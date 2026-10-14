# -*- coding: utf-8 -*-
"""
webcam.py — site simples: lista as câmeras e mostra o AO VIVO no navegador.

Pipeline por câmera (sem app, sem nuvem de conta):
  STATUS(:7605) -> CLI_NEED_CON(:6510) -> relay :6611 -> login MD5 local
  -> OPMonitor -> frames 1412 -> de-wrap H.264 -> ffmpeg -> MJPEG -> <img>

Uso:  python webcam.py      e abra http://127.0.0.1:5000
"""
import base64
import random
import re
import socket
import string
import subprocess
import threading
import time

from flask import Flask, Response, abort

import xmcloud
from camera import sofia_hash
from xmremote import (CAMERAS, NetIPReader, netip, dewrap, gen_sessionid,
                      gen_clienttoken, STATUS_HOST, MSG_VIDEO, find_ffmpeg)

app = Flask(__name__)
_rnd = lambda n, al: "".join(random.choice(al) for _ in range(n))


# ---------------------------------------------------------------------------
# Conecta no relay, faz login local e dispara o OPMonitor. Devolve (sock, reader).
# ---------------------------------------------------------------------------
def connect_live(sn):
    cam = CAMERAS[sn]
    ac, ct = cam["authcode"], gen_clienttoken()
    user, pwd = cam["localuser"], cam["localpwd"]
    sid = gen_sessionid()

    rq = {"StatusProtocol": {"Header": {"Version": "1.0", "CSeq": "1",
          "MessageType": "MSG_STATUS_LOCALQUERY_REQ"}, "Body": [{"SerialNumber": sn, "AuthCode": ac}]}}
    d = xmcloud.jftech_post("https://%s:7605/" % STATUS_HOST, rq, timeout=9)
    row = next((x for x in d["StatusProtocol"]["Body"] if x.get("SerialNumber") == sn), {})
    if row.get("Status") != "Online":
        raise RuntimeError("câmera offline")
    serverip = row["ServerIP"]

    need = {"AgentProtocol": {"Body": {"Authcode": ac, "ClientToken": ct, "DestPort": "34567",
            "Encrypt": "1", "ProtocolMode": "tcp", "SerialNumber": sn, "ServiceType": "RpsCmd",
            "SessionId": sid, "Step": "0"}, "Header": {"MessageType": "MSG_CLI_NEED_CON_REQ", "Version": "1.0"}}}
    rr = xmcloud.jftech_post("https://%s:6510/" % serverip, need, timeout=9)
    b = rr["AgentProtocol"]["Body"]
    agent, aport = b["AgentServerIp"], int(b["AgentServerPort"])

    s = socket.socket(); s.settimeout(12); s.connect((agent, aport))
    s.sendall(base64.b64encode(("%s:%s:%s:%s" % (ac, ct, sn, sid)).encode()) + b"XXEE")
    s.recv(2048)
    rd = NetIPReader(s)

    # pré-login Claim (SID 0x1869f, canal 99) + login MD5 local + Claim/Start
    s.sendall(netip('{"Name":"OPMonitor","OPMonitor":{"Action":"Claim","Parameter":{"Channel":0,'
                    '"CombinMode":"CONNECT_ALL","StreamType":"Main","TransMode":"TCP"}},'
                    '"DHParameter":{"RandomStrA":"%s"},"SessionID":"0x000001869f"}' % _rnd(4, string.ascii_uppercase+string.digits),
                    sid=0x1869F, msgid=1413, seq=1, chn=99))
    rd.wait({1414})
    s.sendall(netip('{"EncryptType":"MD5","LoginType":"DVRIP-Web","UserName":"%s","PassWord":"%s",'
                    '"User-Agent":"webcam"}' % (user, sofia_hash(pwd)), sid=0, msgid=1000, seq=2))
    _, t = rd.wait({1001})
    m = re.search(r'"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?', t or "")
    rr2 = re.search(r'"Ret"\s*:\s*(\d+)', t or "")
    if not m or (rr2 and rr2.group(1) != "100"):
        s.close(); raise RuntimeError("login falhou (Ret=%s)" % (rr2 and rr2.group(1)))
    sess = int(m.group(1), 16)
    s.sendall(netip('{"Name":"OPMonitor","OPMonitor":{"Action":"Claim","Parameter":{"Channel":0,'
                    '"CombinMode":"CONNECT_ALL","StreamType":"Main","TransMode":"TCP"}},"SessionID":"%s"}' % hex(sess),
                    sid=sess, msgid=1413, seq=3))
    rd.wait({1414})
    s.sendall(netip('{"Name":"OPMonitor","OPMonitor":{"Action":"Start","Parameter":{"Channel":0,'
                    '"CombinMode":"CONNECT_ALL","StreamType":"Main","TransMode":"TCP"}},"SessionID":"%s"}' % hex(sess),
                    sid=sess, msgid=1410, seq=4))
    return s, rd


def _find_last_marker(buf):
    """offset do último marcador XM (00 00 01 F8..FE) no buffer, ou -1."""
    i = len(buf) - 4
    while i >= 0:
        if buf[i] == 0 and buf[i+1] == 0 and buf[i+2] == 1 and 0xF8 <= buf[i+3] <= 0xFE:
            return i
        i -= 1
    return -1


def mjpeg(sn):
    """Gera multipart MJPEG: relay -> de-wrap incremental -> ffmpeg -> JPEGs."""
    ff = find_ffmpeg()
    if not ff:
        return
    s = rd = proc = None
    try:
        s, rd = connect_live(sn)
    except Exception as e:
        return
    proc = subprocess.Popen(
        [ff, "-hide_banner", "-loglevel", "quiet", "-fflags", "nobuffer", "-flags", "low_delay",
         "-f", "h264", "-i", "pipe:0", "-an", "-f", "image2pipe", "-vcodec", "mjpeg",
         "-q:v", "7", "-r", "12", "pipe:1"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=0)

    stop = threading.Event()

    def pump():
        raw = bytearray()
        try:
            while not stop.is_set():
                fr = rd.read()
                if fr is None:
                    break
                if fr[0] != MSG_VIDEO:
                    continue
                raw += fr[1]
                last = _find_last_marker(raw)
                if last > 0:
                    h = dewrap(bytes(raw[:last]))
                    if h:
                        proc.stdin.write(h); proc.stdin.flush()
                    del raw[:last]
        except Exception:
            pass
        finally:
            try: proc.stdin.close()
            except Exception: pass

    th = threading.Thread(target=pump, daemon=True); th.start()

    buf = b""
    try:
        while True:
            chunk = proc.stdout.read(8192)
            if not chunk:
                break
            buf += chunk
            while True:
                a = buf.find(b"\xff\xd8")               # SOI
                b2 = buf.find(b"\xff\xd9", a + 2)        # EOI
                if a < 0 or b2 < 0:
                    break
                jpg = buf[a:b2 + 2]; buf = buf[b2 + 2:]
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg + b"\r\n")
    finally:
        stop.set()
        try: proc.kill()
        except Exception: pass
        try: s.close()
        except Exception: pass


PAGE = """<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Minhas Câmeras</title>
<style>
 :root{--bg:#0d1117;--card:#161b22;--bd:#30363d;--fg:#e6edf3;--mut:#8b949e;--ac:#2f81f7}
 *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);
   font:15px/1.5 system-ui,Segoe UI,Roboto,sans-serif}
 header{padding:18px 20px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:10px}
 header h1{font-size:18px;margin:0;font-weight:600}
 .dot{width:9px;height:9px;border-radius:50%;background:#3fb950;box-shadow:0 0 8px #3fb950}
 main{max-width:980px;margin:0 auto;padding:20px 16px}
 .grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
 .card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:16px;
   cursor:pointer;transition:.15s;display:flex;flex-direction:column;gap:10px}
 .card:hover{border-color:var(--ac);transform:translateY(-2px)}
 .card .ic{font-size:26px} .card .nm{font-weight:600} .card .sn{color:var(--mut);font-size:12px;word-break:break-all}
 #viewer{display:none;margin-top:4px}
 #viewer.on{display:block}
 .bar{display:flex;align-items:center;gap:12px;margin-bottom:12px}
 .back{background:var(--card);border:1px solid var(--bd);color:var(--fg);padding:8px 14px;
   border-radius:8px;cursor:pointer;font-size:14px}
 .back:hover{border-color:var(--ac)}
 .vtitle{font-weight:600;font-size:16px}
 .stage{background:#000;border:1px solid var(--bd);border-radius:12px;overflow:hidden;position:relative}
 .stage img{width:100%;display:block}
 .load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--mut)}
 footer{color:var(--mut);font-size:12px;text-align:center;padding:16px}
</style></head><body>
<header><span class="dot"></span><h1>Minhas Câmeras</h1></header>
<main>
 <div id="list" class="grid">__CARDS__</div>
 <section id="viewer">
   <div class="bar"><button class="back" onclick="voltar()">← Voltar</button>
     <span class="vtitle" id="vtitle"></span></div>
   <div class="stage"><div class="load" id="load">Conectando ao vivo…</div>
     <img id="live" alt=""></div>
 </section>
</main>
<footer>Acesso direto via relay — sem o aplicativo.</footer>
<script>
function ver(sn,nome){
  document.getElementById('list').style.display='none';
  document.getElementById('viewer').classList.add('on');
  document.getElementById('vtitle').textContent=nome;
  var load=document.getElementById('load'); load.style.display='flex';
  var img=document.getElementById('live');
  img.onload=function(){load.style.display='none'};
  img.onerror=function(){load.textContent='Falha ao conectar. Tente voltar e clicar de novo.'};
  img.src='/stream/'+sn+'?t='+Date.now();
}
function voltar(){
  var img=document.getElementById('live'); img.src='';
  document.getElementById('viewer').classList.remove('on');
  document.getElementById('list').style.display='grid';
}
</script></body></html>"""


@app.route("/")
def index():
    cards = []
    for sn, c in CAMERAS.items():
        nome = c.get("nome", sn[:8])
        cards.append(
            '<div class="card" onclick="ver(\'%s\',\'%s\')">'
            '<div class="ic">📹</div><div class="nm">%s</div>'
            '<div class="sn">%s</div></div>' % (sn, nome.replace("'", ""), nome, sn))
    return PAGE.replace("__CARDS__", "".join(cards))


@app.route("/stream/<sn>")
def stream(sn):
    if sn not in CAMERAS:
        abort(404)
    return Response(mjpeg(sn), mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    print("[*] Abra http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, threaded=True)
