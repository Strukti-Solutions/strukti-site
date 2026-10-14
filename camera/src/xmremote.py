# -*- coding: utf-8 -*-
"""
xmremote.py — VÍDEO REMOTO AO VIVO das câmeras, sem o app. FUNCIONA.

Pipeline (tudo reproduzido em Python, validado ao vivo em 2026-10-13):
  1) STATUS   pub-status.secu100.net:7605  -> Online + ServerIP atual
  2) NEED_CON <ServerIP>:6510              -> faz a câmera (CGNAT) discar pro
                                              relay; devolve AgentServerIp:6611
  3) :6611    handshake base64(AuthCode:ClientToken:SN:SessionId)+"XXEE"
  4) DVRIP sobre o relay:
       a) pré-login Claim (msg 1413, header SID=0x1869f, canal=99, Main+DH)
       b) LOGIN LOCAL (msg 1000, EncryptType MD5, UserName/senha LOCAIS da
          câmera — sofia_hash). Isto DRIBLA o login TOKEN (cujo UserName é
          derivado nativamente e dava Ret:137).
       c) Claim + Start (Main) com a SessionID real
       d) VÍDEO chega em msg **1412** (não 1422 neste firmware) -> de-wrap
          robusto -> .h264 -> .mp4

CREDENCIAIS (ver seção CAMERAS):
  * AuthCode (aaaaaaaa-1a0e…) + ClientToken (c_…): da sessão da conta. Rotacionam
    por login do app. Capturar com o hook (zz-dump6611.js) ou de dump_login_novo.
  * LocalUserName / LocalPwd: usuário local que o app cria em cada câmera.
    Ficam em XWorldFile.xml do app:
      adb shell run-as com.cz.czeye cat shared_prefs/XWorldFile.xml | grep dev_password
    (só preenchem depois de abrir a câmera 1x no app).

Uso:  python xmremote.py --sn <SN> --segundos 15   (SN de config.py)
"""
import argparse
import base64
import collections
import os
import random
import re
import socket
import string
import subprocess
import sys
import time

import xmcloud
from camera import sofia_hash

# ---------------------------------------------------------------------------
# CAMERAS — preencher com credenciais da captura mais recente.
#   authcode/clienttoken: de dump_login_novo.txt / dump6611.txt (rotacionam)
#   localuser/localpwd:   de XWorldFile.xml (dev_password_<SN>)
# ---------------------------------------------------------------------------
# O ClientToken (c_…) é um NONCE do cliente (gerado aqui, não capturado).
# O AuthCode (aaaaaaaa-1a0e<hash>) é por-dispositivo (estável).
# localuser/localpwd: usuário local criado via GetRandomUser (ver docs/PROTOCOL.md).
# Valores reais ficam em config.py (ignorado pelo git).
from config import CAMERAS


def gen_clienttoken():
    """ClientToken = nonce do cliente 'c_' + 24 chars (não é emitido pelo servidor)."""
    return "c_" + _rnd(24, string.ascii_lowercase + string.digits)

STATUS_HOST = "pub-status.secu100.net"
MSG_VIDEO = 1412   # dados de vídeo NESTE firmware (0x0594)


def _rnd(n, alfa):
    return "".join(random.choice(alfa) for _ in range(n))

def gen_sessionid():
    return _rnd(32, string.ascii_lowercase + string.digits)


# ---- NetIP (cabeçalho 20B, com byte de canal em [12]) ----
def netip(js, sid=0, msgid=0, seq=0, chn=0):
    pl = js.encode("utf-8") + b"\x00"
    h = bytearray(20)
    h[0] = 0xFF; h[1] = 0x01
    h[4:8] = (sid & 0xFFFFFFFF).to_bytes(4, "little")
    h[8:12] = (seq & 0xFFFFFFFF).to_bytes(4, "little")
    h[12] = chn
    h[14:16] = msgid.to_bytes(2, "little")
    h[16:20] = len(pl).to_bytes(4, "little")
    return bytes(h) + pl


class NetIPReader:
    def __init__(self, sock):
        self.sock = sock; self.buf = bytearray()
    def _fill(self):
        d = self.sock.recv(65536)
        if not d:
            return False
        self.buf += d; return True
    def read(self):
        while True:
            i = self.buf.find(b"\xff")
            if i < 0:
                self.buf.clear()
                if not self._fill():
                    return None
                continue
            if i:
                del self.buf[:i]
            while len(self.buf) < 20:
                if not self._fill():
                    return None
            mid = int.from_bytes(self.buf[14:16], "little")
            ln = int.from_bytes(self.buf[16:20], "little")
            while len(self.buf) < 20 + ln:
                if not self._fill():
                    return None
            pl = bytes(self.buf[20:20 + ln]); del self.buf[:20 + ln]
            return mid, pl
    def wait(self, mids, tries=25):
        for _ in range(tries):
            fr = self.read()
            if fr is None:
                return None, None
            if fr[0] in mids:
                return fr[0], fr[1].split(b"\x00")[0].decode("utf-8", "ignore")
        return None, None


# ---- de-wrap robusto XM -> H.264 Annex-B (I-frames FC/FE + P FD; áudio FA/F9/F8 fora) ----
def dewrap(media: bytes) -> bytes:
    n = len(media); out = bytearray(); i = 0
    def nxt(j):
        while j + 4 <= n:
            if media[j] == 0 and media[j+1] == 0 and media[j+2] == 1 and 0xF8 <= media[j+3] <= 0xFE:
                return j
            j += 1
        return n
    while i + 4 <= n:
        if media[i] == 0 and media[i+1] == 0 and media[i+2] == 1 and 0xF8 <= media[i+3] <= 0xFE:
            t = media[i+3]; end = nxt(i + 4)
            if t in (0xFC, 0xFE, 0xFD):            # vídeo I/P
                seg = media[i+4:end]
                k = seg.find(b"\x00\x00\x00\x01")
                if k < 0:
                    k = seg.find(b"\x00\x00\x01")
                if k >= 0:
                    out += seg[k:]
            i = end                                 # pula áudio/padding
        else:
            i += 1
    return bytes(out)


def find_ffmpeg():
    import shutil, glob
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    for c in [os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe"),
              r"C:\ffmpeg\bin\ffmpeg.exe"] + glob.glob(os.path.expandvars(
              r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin\ffmpeg.exe")):
        if os.path.exists(c):
            return c
    return None


def to_mp4(h264_file, mp4_file, fps=15):
    ff = find_ffmpeg()
    if not ff:
        print("[-] ffmpeg não encontrado; H.264 bruto em", h264_file); return
    r = subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-fflags", "+genpts",
                        "-r", str(fps), "-f", "h264", "-i", h264_file, "-c:v", "copy", mp4_file],
                       capture_output=True, text=True)
    if r.returncode == 0:
        print("[+] MP4:", mp4_file)
    else:
        print("[-] ffmpeg:", r.stderr.strip()[:200], "| H.264 bruto em", h264_file)


def stream(sn, segundos=15):
    cam = CAMERAS.get(sn)
    if not cam:
        print("[-] SN desconhecido:", list(CAMERAS)); return False
    ac, ct = cam["authcode"], gen_clienttoken()
    user, pwd = cam["localuser"], cam["localpwd"]
    if not user:
        print("[-] Faltam credenciais locais (localuser/localpwd) p/ %s." % sn)
        print("    Abra a câmera 1x no app e pegue de XWorldFile.xml (dev_password_%s)." % sn)
        return False
    sid = gen_sessionid()
    print("[*] %s (%s) | AuthCode %s | SessionId %s" % (sn, cam.get("nome", ""), ac, sid))

    # 1) STATUS
    rq = {"StatusProtocol": {"Header": {"Version": "1.0", "CSeq": "1",
          "MessageType": "MSG_STATUS_LOCALQUERY_REQ"}, "Body": [{"SerialNumber": sn, "AuthCode": ac}]}}
    d = xmcloud.jftech_post("https://%s:7605/" % STATUS_HOST, rq, timeout=9)
    row = next((x for x in d["StatusProtocol"]["Body"] if x.get("SerialNumber") == sn), {})
    if row.get("Status") != "Online":
        print("[-] câmera offline (ou AuthCode inválido)."); return False
    serverip = row["ServerIP"]
    print("[1] Online. ServerIP=%s" % serverip)

    # 2) CLI_NEED_CON
    need = {"AgentProtocol": {"Body": {"Authcode": ac, "ClientToken": ct, "DestPort": "34567",
            "Encrypt": "1", "ProtocolMode": "tcp", "SerialNumber": sn, "ServiceType": "RpsCmd",
            "SessionId": sid, "Step": "0"}, "Header": {"MessageType": "MSG_CLI_NEED_CON_REQ", "Version": "1.0"}}}
    rr = xmcloud.jftech_post("https://%s:6510/" % serverip, need, timeout=9)
    b = rr["AgentProtocol"]["Body"]
    agent, aport = b["AgentServerIp"], int(b["AgentServerPort"])
    print("[2] AgentServer=%s:%d" % (agent, aport))

    # 3) relay handshake
    s = socket.socket(); s.settimeout(12); s.connect((agent, aport))
    s.sendall(base64.b64encode(("%s:%s:%s:%s" % (ac, ct, sn, sid)).encode()) + b"XXEE")
    rota = base64.b64decode(s.recv(2048).split(b"XXEE")[0]).decode("utf-8", "ignore")
    print("[3] relay:", rota[:70])
    rd = NetIPReader(s)

    # 4a) pré-login Claim (SID 0x1869f, canal 99, Main + DH) -> 1414
    s.sendall(netip('{"Name":"OPMonitor","OPMonitor":{"Action":"Claim","Parameter":{"Channel":0,'
                    '"CombinMode":"CONNECT_ALL","StreamType":"Main","TransMode":"TCP"}},'
                    '"DHParameter":{"RandomStrA":"%s"},"SessionID":"0x000001869f"}' % _rnd(4, string.ascii_uppercase+string.digits),
                    sid=0x1869F, msgid=1413, seq=1, chn=99))
    rd.wait({1414})

    # 4b) LOGIN LOCAL MD5 (dribla o TOKEN)
    s.sendall(netip('{"EncryptType":"MD5","LoginType":"DVRIP-Web","UserName":"%s","PassWord":"%s",'
                    '"User-Agent":"xmremote"}' % (user, sofia_hash(pwd)), sid=0, msgid=1000, seq=2, chn=0))
    _, t = rd.wait({1001})
    ret = re.search(r'"Ret"\s*:\s*(\d+)', t or "")
    if not ret or ret.group(1) != "100":
        print("[-] login falhou: Ret=%s (confira localuser/localpwd)" % (ret and ret.group(1)))
        s.close(); return False
    sess = int(re.search(r'"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?', t).group(1), 16)
    print("[4] login OK (local %s). SessionID=%s" % (user, hex(sess)))

    # 4c) Claim + Start (Main) com a SID real
    s.sendall(netip('{"Name":"OPMonitor","OPMonitor":{"Action":"Claim","Parameter":{"Channel":0,'
                    '"CombinMode":"CONNECT_ALL","StreamType":"Main","TransMode":"TCP"}},"SessionID":"%s"}' % hex(sess),
                    sid=sess, msgid=1413, seq=3))
    rd.wait({1414})
    s.sendall(netip('{"Name":"OPMonitor","OPMonitor":{"Action":"Start","Parameter":{"Channel":0,'
                    '"CombinMode":"CONNECT_ALL","StreamType":"Main","TransMode":"TCP"}},"SessionID":"%s"}' % hex(sess),
                    sid=sess, msgid=1410, seq=4))
    print("[5] gravando %ds (msg %d)..." % (segundos, MSG_VIDEO))

    # 4d) coleta vídeo (msg 1412)
    media = bytearray(); t0 = time.time(); s.settimeout(15)
    try:
        while time.time() - t0 < segundos:
            fr = rd.read()
            if fr is None:
                break
            if fr[0] == MSG_VIDEO:
                media += fr[1]
    except socket.timeout:
        pass
    finally:
        s.close()

    h264 = dewrap(bytes(media))
    nals = collections.Counter()
    j = 0
    while j + 5 < len(h264):
        if h264[j:j+4] == b"\x00\x00\x00\x01":
            nals[h264[j+4] & 0x1f] += 1; j += 4
        else:
            j += 1
    print("[6] vídeo=%dB -> H.264=%dB | NAL %s (7=SPS 8=PPS 5=IDR 1=P)" % (len(media), len(h264), dict(nals)))
    if not h264:
        print("[-] sem vídeo."); return False
    base = "camera_remota_" + sn[:6]
    open(base + ".h264", "wb").write(h264)
    to_mp4(base + ".h264", base + ".mp4")
    return True


def main():
    ap = argparse.ArgumentParser(description="Vídeo remoto das câmeras via relay (sem app).")
    ap.add_argument("--sn", default=next(iter(CAMERAS), None), help="SN da câmera (de config.py)")
    ap.add_argument("--segundos", type=int, default=15)
    a = ap.parse_args()
    ok = stream(a.sn, a.segundos)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
