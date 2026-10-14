"""
app.py — site simples para a câmera Inova/Xiongmai na LAN (DVRIP 34567).
Ao vivo (MJPEG transcodificado por ffmpeg) + consulta/download de gravações.

  python app.py          # abre em http://127.0.0.1:5000

Config da câmera (IP/usuário/senha) em camera.py.
"""
import subprocess
import threading
import datetime
import io
import os
from flask import Flask, Response, request, render_template_string, send_file, jsonify

import camera
from cliente_local import find_ffmpeg, to_mp4

app = Flask(__name__)
FFMPEG = find_ffmpeg()

PAGINA = """
<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Câmera {{ip}}</title>
<style>
 :root{--bg:#0f1115;--fg:#e8eaed;--mut:#9aa0a6;--acc:#4f8cff;--card:#1a1d24;--br:#2a2e37}
 *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);
   font:15px/1.5 system-ui,Segoe UI,Roboto,sans-serif}
 header{padding:16px 20px;border-bottom:1px solid var(--br);display:flex;gap:10px;align-items:center}
 header b{font-size:17px} .dot{width:9px;height:9px;border-radius:50%;background:#2ecc71}
 main{max-width:1000px;margin:0 auto;padding:20px;display:grid;gap:20px}
 .card{background:var(--card);border:1px solid var(--br);border-radius:12px;padding:16px}
 h2{margin:0 0 12px;font-size:15px;color:var(--mut);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
 img#live{width:100%;border-radius:8px;background:#000;aspect-ratio:16/9;object-fit:contain}
 label{display:block;color:var(--mut);font-size:13px;margin:8px 0 4px}
 input,button{font:inherit;padding:9px 12px;border-radius:8px;border:1px solid var(--br);
   background:#11141b;color:var(--fg)}
 .row{display:flex;gap:12px;flex-wrap:wrap;align-items:end}
 button{background:var(--acc);border-color:var(--acc);color:#fff;cursor:pointer;font-weight:600}
 button.ghost{background:transparent;color:var(--acc)}
 table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
 th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--br)}
 th{color:var(--mut);font-weight:600} .mut{color:var(--mut)}
 #status{font-size:13px;color:var(--mut)}
</style></head><body>
<header><span class="dot"></span><b>Câmera {{ip}}</b><span class="mut">· acesso local direto</span></header>
<main>
  <section class="card">
    <h2>Ao vivo</h2>
    <img id="live" src="/live.mjpeg" alt="ao vivo">
    <p class="mut" style="margin:10px 0 0">Transmissão direta da câmera (sem nuvem). Se travar, recarregue a página.</p>
  </section>
  <section class="card">
    <h2>Gravações</h2>
    <div class="row">
      <div><label>Início</label><input type="datetime-local" id="ini"></div>
      <div><label>Fim</label><input type="datetime-local" id="fim"></div>
      <button onclick="buscar()">Buscar</button>
      <span id="status"></span>
    </div>
    <table id="tbl" hidden><thead><tr><th>Início</th><th>Fim</th><th>Arquivo</th><th></th></tr></thead><tbody></tbody></table>
  </section>
</main>
<script>
 // preenche datas padrão: hoje 00:00 -> agora
 const z=n=>String(n).padStart(2,'0');
 const now=new Date(), ini=new Date(); ini.setHours(0,0,0,0);
 const fmt=d=>`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
 document.getElementById('ini').value=fmt(ini);
 document.getElementById('fim').value=fmt(now);
 function toApi(v){ return v.replace('T',' ')+':00'; }
 async function buscar(){
   const st=document.getElementById('status'); st.textContent='buscando...';
   const b=toApi(document.getElementById('ini').value), e=toApi(document.getElementById('fim').value);
   const r=await fetch(`/api/recordings?begin=${encodeURIComponent(b)}&end=${encodeURIComponent(e)}`);
   const j=await r.json();
   const tb=document.querySelector('#tbl tbody'); tb.innerHTML='';
   if(j.error){ st.textContent='erro: '+j.error; return; }
   st.textContent=`${j.length} gravação(ões)`;
   document.getElementById('tbl').hidden=j.length===0;
   for(const a of j){
     const tr=document.createElement('tr');
     tr.innerHTML=`<td>${a.BeginTime||''}</td><td>${a.EndTime||''}</td>
       <td class="mut" style="font-size:12px">${a.FileName||''}</td>
       <td><a class="ghost" href="/baixar?name=${encodeURIComponent(a.FileName)}"><button class="ghost">Baixar MP4</button></a></td>`;
     tb.appendChild(tr);
   }
 }
</script>
</body></html>
"""


@app.route("/")
def index():
    return render_template_string(PAGINA, ip=camera.CAMERA_IP)


@app.route("/live.mjpeg")
def live():
    if not FFMPEG:
        return "FFmpeg não encontrado", 500

    def gen():
        cam = camera.Camera()
        cam.connect()
        proc = subprocess.Popen(
            [FFMPEG, "-hide_banner", "-loglevel", "error", "-fflags", "+genpts",
             "-f", "h264", "-i", "pipe:0", "-f", "mjpeg", "-q:v", "6", "-r", "12", "pipe:1"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE)

        def feed():
            try:
                for h in cam.live_h264():
                    proc.stdin.write(h)
                    proc.stdin.flush()
            except Exception:
                pass
            finally:
                try: proc.stdin.close()
                except Exception: pass

        threading.Thread(target=feed, daemon=True).start()

        buf = b""
        try:
            while True:
                chunk = proc.stdout.read(4096)
                if not chunk:
                    break
                buf += chunk
                while True:
                    a = buf.find(b"\xff\xd8")           # SOI
                    b = buf.find(b"\xff\xd9", a + 2)     # EOI
                    if a < 0 or b < 0:
                        break
                    jpg = buf[a:b + 2]
                    buf = buf[b + 2:]
                    yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg + b"\r\n")
        finally:
            try: proc.kill()
            except Exception: pass
            cam.close()

    return Response(gen(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/api/recordings")
def api_recordings():
    begin = request.args.get("begin"); end = request.args.get("end")
    try:
        cam = camera.Camera(); cam.connect()
        arqs = cam.list_recordings(begin, end); cam.close()
        return jsonify(arqs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/baixar")
def baixar():
    name = request.args.get("name")
    if not name:
        return "faltou name", 400
    safe = "".join(c if c.isalnum() else "_" for c in name)[-60:]
    h264 = f"_dl_{safe}.h264"; mp4 = f"_dl_{safe}.mp4"
    try:
        cam = camera.Camera(); cam.connect()
        data = cam.download_h264(name); cam.close()
        with open(h264, "wb") as f:
            f.write(data)
        to_mp4(h264, mp4)
        if os.path.exists(mp4):
            return send_file(mp4, as_attachment=True, download_name="gravacao.mp4")
        return "falha ao converter (câmera pode não ter essa gravação)", 500
    except Exception as e:
        return f"erro: {e}", 500


if __name__ == "__main__":
    print("Abra http://127.0.0.1:5000  (Ctrl+C para parar)")
    app.run(host="127.0.0.1", port=5000, threaded=True)
