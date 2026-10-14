# -*- coding: utf-8 -*-
"""
xmcloud.py — cliente Python do XMCloud (secu100), reconstruído por RE e validado.
Fala o protocolo JFTECH: POST text/plain, body = base64(XOR(json, chave)), onde
chave = header JFTECH-TIME + JFTECH-REQ (cliente escolhe; resposta traz os seus).

Primeira capacidade: resolver SN da câmera -> ServerIP (DNS multiquery), SEM auth.
"""
import base64
import json
import re
import ssl
import time
import urllib.request

import xmcrypto

UA = "funsdk-v1.8.2-Android"
_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE   # não precisamos verificar o servidor


def _b64fix(s):
    s = re.sub(r"[^A-Za-z0-9+/=]", "", s).rstrip("=")
    return base64.b64decode(s + "=" * (-len(s) % 4))


def jftech_post(url, obj, timeout=10):
    """Envia um objeto JSON cifrado (JFTECH) e devolve o JSON decifrado da resposta."""
    ts = int(time.time() * 1000)
    nonce = xmcrypto._nonce(8)
    key = "%d%s" % (ts, nonce)
    body = base64.b64encode(xmcrypto.xor_crypt(json.dumps(obj).encode("utf-8"), key))
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "text/plain")
    req.add_header("JFTECH-EV", "3")
    req.add_header("JFTECH-REQ", nonce)
    req.add_header("JFTECH-TIME", str(ts))
    req.add_header("User-Agent", UA)
    req.add_header("Accept", "*/*")
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
        raw = r.read()
        rt = r.headers.get("JFTECH-TIME")
        rq = r.headers.get("JFTECH-REQ")
    if not (rt and rq):
        raise RuntimeError("resposta sem headers JFTECH (key indisponível): %r" % raw[:80])
    pt = xmcrypto.xor_crypt(_b64fix(raw.decode("latin1")), rt + rq)
    return json.loads(pt.decode("utf-8", "replace"))


def dns_multiquery(sns, domain="pub-dss-hls.secu100.net",
                   host="pub-cfg.secu100.net:8186"):
    """Resolve uma lista de SNs -> ServerIP, via MSG_XM_DNS_MULTIQUERY (sem auth)."""
    obj = {
        "CfgProtocol": {
            "Header": {"Version": "1.0", "CSeq": "1",
                       "MessageType": "MSG_XM_DNS_MULTIQUERY_REQ"},
            "Body": {"DomainName": domain,
                     "Deviceinfo": [{"SerialNumber": sn} for sn in sns]},
        }
    }
    resp = jftech_post("https://%s/" % host, obj)
    body = resp.get("CfgProtocol", {}).get("Body", [])
    return {d["SerialNumber"]: d.get("ServerIP") for d in body}


if __name__ == "__main__":
    try:
        from config import CAMERAS
        SNS = list(CAMERAS.keys())
    except Exception:
        SNS = []  # configure config.py
    if not SNS:
        print("[-] configure config.py (CAMERAS) para testar."); raise SystemExit
    print("[*] Resolvendo SNs no XMCloud (pub-cfg.secu100.net:8186)...")
    try:
        res = dns_multiquery(SNS)
        for sn, ip in res.items():
            print("    %s -> %s" % (sn, ip))
        print("[+] OK — cliente XMCloud funcional ao vivo.")
    except Exception as e:
        print("[-] falhou:", type(e).__name__, e)
