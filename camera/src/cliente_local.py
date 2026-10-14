"""
cliente_local.py — CLI de acesso DIRETO à câmera Inova/Xiongmai na LAN (DVRIP
porta 34567). Sem nuvem, sem token.

  python cliente_local.py                       # ao vivo (Ctrl+C encerra)
  python cliente_local.py --segundos 15         # ao vivo por 15s e para
  python cliente_local.py --listar "2026-10-12 00:00:00" "2026-10-13 23:59:59"
  python cliente_local.py --baixar "/idea0/..../arquivo.h264"

Config (IP/usuário/senha) vem do camera.py — ajuste PASSWORD lá se precisar.
"""
import sys
import os
import time
import subprocess
import shutil
import glob
import camera


def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    for c in [r"C:\Program Files\FFmpeg\bin\ffmpeg.exe", r"C:\ffmpeg\bin\ffmpeg.exe",
              os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe")] + \
             glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin\ffmpeg.exe")):
        if os.path.exists(c):
            return c
    return None


def to_mp4(h264_file, mp4_file):
    if not os.path.exists(h264_file) or os.path.getsize(h264_file) == 0:
        print("[-] Nada de vídeo recebido; MP4 não gerado.")
        return
    ff = find_ffmpeg()
    if not ff:
        print(f"[-] FFmpeg não encontrado; H.264 bruto em '{h264_file}'.")
        return
    r = subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y",
                        "-fflags", "+genpts", "-f", "h264", "-i", h264_file,
                        "-c:v", "copy", mp4_file], capture_output=True, text=True)
    if r.returncode == 0:
        print(f"[+] Vídeo salvo em '{mp4_file}'.")
    else:
        print("[-] FFmpeg falhou:\n" + r.stderr.strip())
        print(f"[-] H.264 bruto mantido em '{h264_file}'.")


def ao_vivo(segundos=None):
    c = camera.Camera()
    print(f"[+] Conectando a {c.ip}:{c.port} (DVRIP local)...")
    c.connect()
    print(f"[+] Login OK. SessionID={c.sid}")
    params = {"Channel": 0, "CombinMode": "NONE", "StreamType": "Main", "TransMode": "TCP"}
    c.send(camera.MONITOR_CLAIM, {"Name": "OPMonitor", "SessionID": c.sid,
                                  "OPMonitor": {"Action": "Claim", "Parameter": params}})
    c.read_frame()
    c.send(camera.MONITOR_START, {"Name": "OPMonitor", "SessionID": c.sid,
                                  "OPMonitor": {"Action": "Start", "Parameter": params}})
    if segundos:
        print(f"[+] Gravando por {segundos}s...")
    else:
        print("[+] Gravando... Ctrl+C para encerrar e converter.")

    raw = bytearray()
    t0 = time.time()
    try:
        while True:
            fr = c.read_frame()
            if fr is None:
                print("\n[-] Conexão encerrada pela câmera.")
                break
            _, payload = fr
            if payload[:1] == b"{":
                continue
            raw += payload
            if segundos and (time.time() - t0) >= segundos:
                break
    except KeyboardInterrupt:
        print("\n[-] Encerrado pelo usuário.")
    finally:
        c.close()

    # salva o BRUTO (pré-dewrap) p/ diagnóstico, e o H.264 desembrulhado
    with open("camera_local.raw", "wb") as f:
        f.write(raw)
    h264 = camera.xm_dewrap_video(bytes(raw))
    print(f"[+] Mídia bruta: {len(raw)} bytes -> H.264: {len(h264)} bytes (raw salvo em camera_local.raw).")
    with open("camera_local.h264", "wb") as f:
        f.write(h264)
    to_mp4("camera_local.h264", "camera_local.mp4")


def listar(begin, end):
    c = camera.Camera()
    c.connect()
    print(f"[+] Login OK ({c.sid}). Buscando gravações de {begin} a {end}...")
    arqs = c.list_recordings(begin, end)
    c.close()
    if not arqs:
        print("[-] Nenhuma gravação encontrada nesse período.")
        return
    print(f"[+] {len(arqs)} gravação(ões):")
    for a in arqs:
        print(f"    {a.get('BeginTime')}  ->  {a.get('EndTime')}   {a.get('FileName')}")


def baixar(nome):
    c = camera.Camera()
    c.connect()
    print(f"[+] Login OK ({c.sid}). Baixando {nome}...")
    h264 = c.download_h264(nome)
    c.close()
    print(f"[+] H.264 desembrulhado: {len(h264)} bytes.")
    with open("gravacao.h264", "wb") as f:
        f.write(h264)
    to_mp4("gravacao.h264", "gravacao.mp4")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        ao_vivo()
    elif a[0] == "--segundos":
        ao_vivo(int(a[1]))
    elif a[0] == "--listar" and len(a) >= 3:
        listar(a[1], a[2])
    elif a[0] == "--baixar" and len(a) >= 2:
        baixar(a[1])
    else:
        print(__doc__)
