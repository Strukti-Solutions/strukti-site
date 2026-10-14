# -*- coding: utf-8 -*-
"""Decifra todos os blocos do http_dump.txt e mapeia URL -> MessageType -> JSON.
Dá o mapa de roteamento (qual host/path para cada tipo de mensagem XMCloud)."""
import re, base64, json, sys
import xmcrypto

blocks = open("http_dump.txt", encoding="utf-8", errors="ignore").read().split("----\n")

def parse(block):
    m = re.search(r"(?:>>> REQUEST|<<< RESPONSE) \(\d+\)\n(.*)", block, re.S)
    if not m: return None
    raw = m.group(1)
    is_req = ">>> REQUEST" in block
    line1 = raw.split("\n", 1)[0]
    th = re.search(r"JFTECH-TIME:\s*(\S+)", raw); rq = re.search(r"JFTECH-REQ:\s*(\S+)", raw)
    # separa headers do corpo
    parts = raw.split("\r\n\r\n", 1)
    if len(parts) < 2: parts = raw.split("\n\n", 1)
    body = parts[1].strip() if len(parts) > 1 else ""
    # resposta é chunked: remove as linhas de tamanho de chunk (hex isolado)
    if not is_req:
        body = "".join(l for l in body.splitlines() if not re.fullmatch(r"[0-9a-fA-F]{1,4}", l.strip()))
    return is_req, line1, (th.group(1) if th else None), (rq.group(1) if rq else None), body.strip()

seen = {}
for b in blocks:
    p = parse(b)
    if not p: continue
    is_req, line1, t, r, body = p
    tag = "REQ " if is_req else "RESP"
    msgtype = ""
    decoded = ""
    if t and r and body:
        try:
            pt = xmcrypto.xor_crypt(base64.b64decode(body + "=="), t + r)
            s = pt.decode("utf-8", "replace")
            mt = re.search(r'"MessageType":"(\w+)"', s) or re.search(r'"msg":"(\w+)"', s)
            msgtype = mt.group(1) if mt else ""
            decoded = s
        except Exception as e:
            decoded = "<falha: %s>" % e
    key = (tag, line1[:60], msgtype)
    if key in seen: continue
    seen[key] = 1
    print("%s %-55s  [%s]" % (tag, line1[:55], msgtype))
    if decoded and decoded.startswith("{"):
        print("      ", decoded[:180])
