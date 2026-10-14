# -*- coding: utf-8 -*-
"""Decifra o payload da API v3 (jftechws) capturado, usando a chave XOR
descoberta na RE: key = header 'JFTECH-TIME' + header 'JFTECH-REQ'."""
import base64, binascii
from mitmproxy.io import FlowReader
from mitmproxy import http

PATH = "login_nuvem.flows"

def xor(data, key):
    kb = key.encode() if isinstance(key, str) else key
    if not kb: return data
    return bytes(data[i] ^ kb[i % len(kb)] for i in range(len(data)))

def printable_ratio(b):
    if not b: return 0
    return sum(1 for c in b if 32 <= c < 127 or c in (9,10,13)) / len(b)

flows = []
with open(PATH, "rb") as f:
    for fl in FlowReader(f).stream():
        if isinstance(fl, http.HTTPFlow):
            flows.append(fl)

alvo = [f for f in flows if any(k in f.request.path.lower() for k in ("loginexist","userinfo2"))]
print("flows loginExist/userinfo2:", len(alvo))

for fl in alvo[:4]:
    print("\n" + "="*70)
    print(fl.request.method, fl.request.pretty_host + fl.request.path[:70])
    # todos os headers que podem formar a chave
    hdrs = {}
    for k, v in list(fl.request.headers.items()) + (list(fl.response.headers.items()) if fl.response else []):
        if "jftech" in k.lower() or k.lower() in ("time","req","sign"):
            hdrs[k] = v
    print("headers-chave:", hdrs)
    time_h = None; req_h = None
    for k, v in hdrs.items():
        if "time" in k.lower(): time_h = v
        if k.lower().endswith("req") or k.lower() == "jftech-req": req_h = v
    body = fl.response.content if fl.response else b""   # auto-gunzip
    if not body:
        print("(sem corpo)"); continue
    print("corpo[:40]:", body[:40])
    # o corpo pode ser hex-ascii OU base64; preparar as duas formas
    forms = {}
    try: forms["hexdecode"] = binascii.unhexlify(body.strip())
    except Exception: pass
    try: forms["b64decode"] = base64.b64decode(body.strip() + b"===")
    except Exception: pass
    forms["asis"] = body
    keys = {}
    if time_h and req_h:
        keys["TIME+REQ"] = time_h + req_h
        keys["REQ+TIME"] = req_h + time_h
    if req_h: keys["REQ"] = req_h
    if time_h: keys["TIME"] = time_h
    best = None
    for fname, fb in forms.items():
        for kname, k in keys.items():
            out = xor(fb, k)
            r = printable_ratio(out)
            if r > 0.9 and (best is None or r > best[0]):
                best = (r, fname, kname, out)
    if best:
        print(f"  >>> DECIFROU [{best[1]} + XOR {best[2]}] ({best[0]:.0%} ascii):")
        print("     ", best[3][:400].decode("utf-8","replace"))
    else:
        print("  (nenhuma combinação deu texto; chaves testadas:", list(keys), "| formas:", list(forms), ")")
