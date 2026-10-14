# -*- coding: utf-8 -*-
"""
add_camera.py — ASSISTENTE para cadastrar uma câmera nova no config.py.

Automatiza: injeta o hook (zz-addcam.js) no app, você abre a câmera NOVA ao vivo
uma vez, e ele captura SN + AuthCode + usuário/senha local e grava direto no
src/config.py. Depois disso a câmera funciona standalone (xmremote.py / webcam.py).

Requisitos: celular com android-unpinner preparado (ver docs/CAPTURE_GUIDE.md),
adb no PATH (ou SDK), e o app Tris Home instalado.

Uso:
    python tools/add_camera.py                 # fluxo completo (recomendado)
    python tools/add_camera.py --parse addcam.txt   # só processa um dump já feito
    python tools/add_camera.py --device <serial>
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import time

PKG = "com.cz.czeye"
HOOK = "zz-addcam.js"
REMOTE_OUT = "files/addcam.txt"
HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG = os.path.normpath(os.path.join(HERE, "..", "src", "config.py"))
HOOK_SRC = os.path.join(HERE, "frida", HOOK)


# --------------------------------------------------------------------------
def find_adb():
    exe = shutil.which("adb")
    if exe:
        return exe
    cand = os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe")
    return cand if os.path.exists(cand) else None


def find_unpinner_scripts():
    try:
        import android_unpinner
        return os.path.join(os.path.dirname(android_unpinner.__file__), "scripts")
    except Exception:
        return None


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def pick_device(adb, want=None):
    out = sh([adb, "devices"]).stdout
    devs = [l.split("\t")[0] for l in out.splitlines()[1:] if "\tdevice" in l]
    if want:
        return want if want in devs else None
    return devs[0] if devs else None


# --------------------------------------------------------------------------
def deploy_and_capture(adb, dev):
    scripts = find_unpinner_scripts()
    if not scripts:
        sys.exit("[-] android_unpinner não encontrado (pip install android-unpinner).")
    if not os.path.exists(HOOK_SRC):
        sys.exit("[-] %s não encontrado." % HOOK_SRC)

    # deixa SÓ o hook do assistente (evita acúmulo que trava o app)
    for f in os.listdir(scripts):
        if f.startswith("zz-"):
            try: os.remove(os.path.join(scripts, f))
            except OSError: pass
    shutil.copy(HOOK_SRC, os.path.join(scripts, HOOK))
    sh([adb, "-s", dev, "shell", "rm -f /data/local/tmp/android-unpinner/zz-*.js"])
    sh([adb, "-s", dev, "shell", "run-as %s sh -c 'rm -f %s'" % (PKG, REMOTE_OUT)])

    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    print("[1] enviando hook e (re)iniciando o app...")
    subprocess.run([sys.executable, "-m", "android_unpinner", "push-resources", "-f", "-d", dev],
                   env=env, capture_output=True)
    sh([adb, "-s", dev, "shell", "am force-stop " + PKG])
    subprocess.run([sys.executable, "-m", "android_unpinner", "start-app", "-f", "-d", dev, PKG],
                   env=env, capture_output=True)
    time.sleep(2)

    print("\n" + "=" * 64)
    print("  >>> No CELULAR: faça login (se pedir) e ABRA A CÂMERA NOVA ao vivo.")
    print("      Deixe o vídeo rodar uns 5 segundos.")
    print("=" * 64)
    input("\n  Tecle ENTER aqui quando o vídeo da câmera nova tiver aparecido... ")

    raw = sh([adb, "-s", dev, "shell", "run-as %s cat %s" % (PKG, REMOTE_OUT)]).stdout
    return raw


# --------------------------------------------------------------------------
def parse_records(text):
    """Extrai [(sn, ac, user, pass)] das linhas 'CAM sn=.. ac=.. user=.. pass=..'."""
    recs = []
    for m in re.finditer(r"CAM sn=(\S+) ac=(\S+) user=(\S+) pass=(\S+)", text):
        recs.append(m.groups())
    return recs


def existing_sns():
    if not os.path.exists(CONFIG):
        return set()
    txt = open(CONFIG, encoding="utf-8").read()
    return set(re.findall(r'"([0-9a-z]{16,})"\s*:\s*{', txt))


def add_to_config(sn, ac, user, pwd, nome):
    txt = open(CONFIG, encoding="utf-8").read()
    entry = ('    "%s": {\n'
             '        "authcode": "%s",\n'
             '        "localuser": "%s", "localpwd": "%s", "nome": "%s",\n'
             '    },\n' % (sn, ac, user, pwd, nome))
    # insere logo após 'CAMERAS = {'
    new = re.sub(r"(CAMERAS\s*=\s*\{\s*\n)", r"\1" + entry, txt, count=1)
    if new == txt:
        return False
    open(CONFIG, "w", encoding="utf-8").write(new)
    return True


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Assistente p/ cadastrar câmera nova no config.py")
    ap.add_argument("--parse", metavar="ARQ", help="só processa um dump addcam.txt já capturado")
    ap.add_argument("--device", help="serial do adb (se houver mais de um)")
    a = ap.parse_args()

    if a.parse:
        text = open(a.parse, encoding="utf-8", errors="ignore").read()
    else:
        adb = find_adb()
        if not adb:
            sys.exit("[-] adb não encontrado. Use --parse se já tiver o dump.")
        dev = pick_device(adb, a.device)
        if not dev:
            sys.exit("[-] nenhum celular conectado (adb devices vazio).")
        print("[*] celular:", dev)
        text = deploy_and_capture(adb, dev)

    recs = parse_records(text)
    if not recs:
        print("[-] Nada capturado. A câmera abriu ao vivo? (se travou, reinicie o"
              " celular e tente de novo). Dump cru:\n", text[-400:])
        return

    have = existing_sns()
    novos = 0
    for sn, ac, user, pwd in recs:
        if sn in have:
            print("[=] %s já está no config.py (pulando)." % sn)
            continue
        print("\n[+] Câmera NOVA encontrada:")
        print("      SN       : %s" % sn)
        print("      AuthCode : %s" % ac)
        print("      Usuário  : %s / senha: %s" % (user, pwd))
        nome = input("      Dê um nome para ela (ex: Garagem): ").strip() or sn[:8]
        if add_to_config(sn, ac, user, pwd, nome):
            print("      ✔ adicionada ao config.py como \"%s\"." % nome)
            novos += 1
        else:
            print("      [-] não consegui editar o config.py (confira o formato de CAMERAS).")

    print("\n[OK] %d câmera(s) nova(s) cadastrada(s)." % novos
          + (" Rode:  cd src && python webcam.py" if novos else ""))


if __name__ == "__main__":
    main()
