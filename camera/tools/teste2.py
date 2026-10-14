"""
Cliente Tris Home / Xiongmai (NetIP/DVRIP) - captura de vídeo ao vivo.

Baseado na engenharia reversa dos dois .pcap desta pasta e do APK (FunSDK).

====================================================================
IMPORTANTE - sobre o TOKEN (leia antes de rodar)
====================================================================
O token NÃO é gerado localmente: ele é emitido pela nuvem Xiongmai
(secu100.net / xmeye.net / jftechws.com) via HTTPS, dentro da
libFunSDK.so. Portanto este script NÃO consegue, sozinho, fazer o
login na nuvem - ele precisa de um token FRESCO, capturado do app.

Estrutura do token (4 campos separados por ':'), confirmada nos pcaps:
    aaaaaaaa-<reqid> : c_<sessao> : <id_do_dispositivo> : <ticket>
    [0] aaaaaaaa-1a0a34ad8   -> id da requisição  (gira a cada conexão)
    [1] c_bei0xe5blwdwnzw7...-> token de sessão    (gira a cada LOGIN no app)
    [2] d24bdacad1d85edc6rnb -> id do dispositivo   (FIXO por câmera)
    [3] ak1k2a8fr5krbr1mr4...-> ticket de conexão   (gira a cada conexão)

Para obter um token novo: capture o tráfego do app na porta 6611
(PCAPdroid) e cole abaixo em TOKEN_BASE64 o bloco base64 que vem
ANTES de "XXEE" no primeiro pacote enviado ao servidor.
O IP/porta do relay também saem dessa captura (o app usa vários).
"""

import socket
import subprocess
import os
import shutil
import glob
import sys

# ---------------------------------------------------------------------------
# Configuração - PREENCHA com dados de uma captura RECENTE do app
# ---------------------------------------------------------------------------
SERVER_IP = "152.32.197.30"
PORT = 6611

# Cole aqui o base64 que aparece antes de "XXEE" no 1º pacote (sem o XXEE).
TOKEN_BASE64 = b"YWFhYWFhYWEtMWEwYTM0YWQ4OmNfYmVpMHhlNWJsd2R3bnp3N2hndGptbzJ4OmQyNGJkYWNhZDFkODVlZGM2cm5iOmFrMWsyYThmcjVrcmJyMW1yNGVrZzF0bXU5d2Znb2I2"

def _carregar_token_capturado():
    """Se existir 'token6611.txt' (gerado pelo token_hook.js e puxado do
    celular), usa o SERVER/TOKEN frescos dele. Formato:
        SERVER=152.32.197.30:6611
        TOKEN=<base64 sem XXEE>
    """
    global SERVER_IP, PORT, TOKEN_BASE64
    caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), "token6611.txt")
    if not os.path.exists(caminho):
        return False
    with open(caminho, "r", encoding="utf-8", errors="ignore") as f:
        for linha in f:
            linha = linha.strip()
            if linha.startswith("SERVER=") and ":" in linha:
                ip, _, porta = linha[7:].rpartition(":")
                if ip and porta.isdigit():
                    SERVER_IP, PORT = ip, int(porta)
            elif linha.startswith("TOKEN=") and len(linha) > 7:
                TOKEN_BASE64 = linha[6:].encode("ascii")
    print(f"[+] Token capturado carregado de token6611.txt (servidor {SERVER_IP}:{PORT}).")
    return True

_carregar_token_capturado()
HANDSHAKE_PACKET = TOKEN_BASE64 + b"XXEE"

# Login DVRIP observado na captura (EncryptType TOKEN, senha vazia).
# O UserName também gira por conexão; use o da mesma captura do token.
LOGIN_USERNAME = "l8Vh-MSk8KhXn-HW"
USER_AGENT = "Funv1.8.2-And-bmBcazwKh7Q2xjO"

CHANNEL = 0
STREAM_TYPE = "Main"          # "Main" ou "Extra1"

# Códigos NetIP (do JsonConfig.java / tráfego)
MSG_LOGIN_REQ = 1000          # 0x03E8  login DVRIP
MSG_MONITOR_CLAIM = 1413      # 0x0585  OPMonitor Claim
MSG_MONITOR_START = 1410      # 0x0582  OPMonitor Start (dispara o fluxo)
MSG_VIDEO_DATA = 1422         # 0x058E  frames de mídia vindos do servidor

RECV_CHUNK = 65536

# ---------------------------------------------------------------------------
# Protocolo NetIP (cabeçalho de 20 bytes, little-endian)
#   [0]=0xFF [1]=versão [4:8]=SessionID [8:12]=sequência
#   [12:14]=0 [14:16]=msg_id [16:20]=tamanho do payload
# ---------------------------------------------------------------------------
def build_netip_packet(json_payload, session_id=0, msg_id=MSG_MONITOR_CLAIM, seq=0):
    payload = json_payload.encode("utf-8") + b"\x00"   # o app termina o JSON com \0
    header = bytearray(20)
    header[0] = 0xFF
    header[1] = 0x01
    header[4:8] = (session_id & 0xFFFFFFFF).to_bytes(4, "little")
    header[8:12] = (seq & 0xFFFFFFFF).to_bytes(4, "little")
    header[14:16] = msg_id.to_bytes(2, "little")
    header[16:20] = len(payload).to_bytes(4, "little")
    return bytes(header) + payload


class NetIPReader:
    """Reassembla frames NetIP a partir do fluxo TCP, respeitando limites de pacote."""
    def __init__(self, sock):
        self.sock = sock
        self.buf = bytearray()

    def _fill(self):
        data = self.sock.recv(RECV_CHUNK)
        if not data:
            return False
        self.buf += data
        return True

    def read_frame(self):
        """Retorna (msg_id, payload_bytes) ou None se a conexão fechar."""
        while True:
            # alinha no próximo 0xFF
            start = self.buf.find(b"\xff")
            if start < 0:
                self.buf.clear()
                if not self._fill():
                    return None
                continue
            if start > 0:
                del self.buf[:start]
            while len(self.buf) < 20:
                if not self._fill():
                    return None
            msg_id = int.from_bytes(self.buf[14:16], "little")
            length = int.from_bytes(self.buf[16:20], "little")
            while len(self.buf) < 20 + length:
                if not self._fill():
                    return None
            payload = bytes(self.buf[20:20 + length])
            del self.buf[:20 + length]
            return msg_id, payload


# ---------------------------------------------------------------------------
# De-wrap Xiongmai -> H.264 puro  (VERIFICADO contra o pcap de 128 KB)
#   Vídeo I : 00 00 01 FC + cabeçalho de 16 bytes (tamanho em [12:16] LE)
#   Vídeo P : 00 00 01 FD + cabeçalho de 8  bytes (tamanho em [4:6]  LE)
#   Áudio   : 00 00 01 FA/F9/F8 (descartado)
#   Enchimento entre frames: bytes 0xD5
# ---------------------------------------------------------------------------
def xm_dewrap_video(media: bytes) -> bytes:
    out = bytearray()
    i, n = 0, len(media)
    while i + 4 <= n:
        if media[i] == 0 and media[i+1] == 0 and media[i+2] == 1 and 0xF0 <= media[i+3] <= 0xFF:
            t = media[i+3]
            if t in (0xFC, 0xFE):                       # I-frame
                length = int.from_bytes(media[i+12:i+16], "little")
                out += media[i+16:i+16+length]
                i += 16 + length
                continue
            if t == 0xFD:                               # P-frame
                length = int.from_bytes(media[i+4:i+6], "little")
                out += media[i+8:i+8+length]
                i += 8 + length
                continue
            if t in (0xFA, 0xF9, 0xF8):                 # áudio / outros
                length = int.from_bytes(media[i+4:i+6], "little")
                i += 8 + length
                continue
        i += 1
    return bytes(out)


# ---------------------------------------------------------------------------
# FFmpeg
# ---------------------------------------------------------------------------
def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    candidatos = [
        r"C:\Program Files\FFmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe"),
    ]
    candidatos += glob.glob(os.path.expandvars(
        r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin\ffmpeg.exe"))
    for c in candidatos:
        if os.path.exists(c):
            return c
    return None


def convert_to_mp4(input_file, output_file):
    print("\n[+] Convertendo para MP4...")
    tam = os.path.getsize(input_file) if os.path.exists(input_file) else 0
    if tam == 0:
        print(f"[-] '{input_file}' está vazio: nenhum frame de vídeo foi recebido. Conversão cancelada.")
        return
    ff = find_ffmpeg()
    if not ff:
        print("[-] FFmpeg não encontrado. Feche e reabra o terminal após instalar.")
        return
    cmd = [ff, "-hide_banner", "-loglevel", "error", "-y",
           "-fflags", "+genpts", "-f", "h264", "-i", input_file, "-c:v", "copy", output_file]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("[-] FFmpeg falhou:")
        print(r.stderr.strip())
        print(f"[-] H.264 bruto mantido em '{input_file}' ({tam} bytes).")
        return
    print(f"[+] Sucesso! Vídeo salvo em '{output_file}'.")
    os.remove(input_file)


# ---------------------------------------------------------------------------
# Fluxo principal
# ---------------------------------------------------------------------------
def start_stream():
    raw_file = "temp_stream.h264"
    final_file = "video_camera.mp4"

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(10)
    try:
        s.connect((SERVER_IP, PORT))
    except OSError as e:
        print(f"[-] Falha ao conectar em {SERVER_IP}:{PORT} -> {e}")
        return
    print(f"[+] Conectado a {SERVER_IP}:{PORT}.")

    # 1) Handshake (token base64 + XXEE)
    s.sendall(HANDSHAKE_PACKET)
    try:
        rota = s.recv(1024)
    except socket.timeout:
        print("[-] Sem resposta ao handshake: o token quase certamente expirou.")
        print("    Capture um token novo no app (veja o cabeçalho deste arquivo).")
        s.close()
        return
    print(f"[<-] Roteamento: {rota.split(b'XXEE')[0][:200]!r}")

    reader = NetIPReader(s)

    # 2) Login DVRIP (EncryptType TOKEN, senha vazia) - como o app faz
    login_json = (
        '{"EncryptType":"TOKEN","LoginType":"DVRIP-FutureHome",'
        f'"UserName":"{LOGIN_USERNAME}","PassWord":"","User-Agent":"{USER_AGENT}"}}'
    )
    s.sendall(build_netip_packet(login_json, session_id=0, msg_id=MSG_LOGIN_REQ))

    # Lê respostas até achar o SessionID atribuído pelo servidor
    session_id = 0
    for _ in range(10):
        frame = reader.read_frame()
        if frame is None:
            print("[-] Conexão encerrada durante o login (token inválido/expirado?).")
            s.close()
            return
        msg_id, payload = frame
        txt = payload.split(b"\x00")[0].decode("utf-8", "ignore")
        if '"SessionID"' in txt:
            import re
            m = re.search(r'"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?', txt)
            if m:
                session_id = int(m.group(1), 16)
                print(f"[+] SessionID atribuído: {hex(session_id)}")
                break
    if session_id == 0:
        print("[!] Não recebi SessionID; seguindo com 0 (pode não funcionar).")

    # 3) OPMonitor Claim + Start -> dispara o fluxo de vídeo
    claim = (
        '{"Name":"OPMonitor","OPMonitor":{"Action":"Claim","Parameter":'
        '{"Channel":%d,"CombinMode":"CONNECT_ALL","StreamType":"%s","TransMode":"TCP"}},'
        '"SessionID":"%s"}' % (CHANNEL, STREAM_TYPE, hex(session_id))
    )
    s.sendall(build_netip_packet(claim, session_id, MSG_MONITOR_CLAIM, seq=1))
    start = (
        '{"Name":"OPMonitor","OPMonitor":{"Action":"Start","Parameter":'
        '{"Channel":%d,"CombinMode":"CONNECT_ALL","StreamType":"%s","TransMode":"TCP"}},'
        '"SessionID":"%s"}' % (CHANNEL, STREAM_TYPE, hex(session_id))
    )
    s.sendall(build_netip_packet(start, session_id, MSG_MONITOR_START, seq=2))

    print("[+] Transmissão solicitada. Gravando... Ctrl+C para encerrar e converter.")

    # 4) Recebe frames de mídia, de-wrap XM -> H.264
    media = bytearray()
    s.settimeout(None)
    try:
        while True:
            frame = reader.read_frame()
            if frame is None:
                print("\n[-] Servidor encerrou a conexão.")
                break
            msg_id, payload = frame
            if msg_id == MSG_VIDEO_DATA:
                media += payload
    except KeyboardInterrupt:
        print("\n[-] Encerrado pelo usuário.")
    finally:
        s.close()

    h264 = xm_dewrap_video(bytes(media))
    print(f"[+] Mídia recebida: {len(media)} bytes -> H.264: {len(h264)} bytes.")
    with open(raw_file, "wb") as f:
        f.write(h264)
    convert_to_mp4(raw_file, final_file)


if __name__ == "__main__":
    start_stream()
