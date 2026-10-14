# -*- coding: utf-8 -*-
"""
parse_http2.py — analisa http2.txt (do zz-dumphttp2.js: Fun_Enc/DecHttpData em
claro) pra fechar o login standalone. Acha:
  1) o MINT do ClientToken (c_...)  -> qual request/response e que inputs usa
  2) a lista de dispositivos + AuthCodes (GetDevList / shadow / nmq)
  3) o request de login (loginExist / AccountLoginEx) e a senha
  4) a derivação do UserName TOKEN (GenPWDToken p1/p2 -> out)

Uso: python parse_http2.py [http2.txt]
"""
import re, sys
T = open(sys.argv[1] if len(sys.argv) > 1 else "http2.txt", encoding="utf-8", errors="ignore").read()
L = T.splitlines()

def sec(t): print("\n"+"="*78+"\n"+t+"\n"+"="*78)

sec("1) MINT do ClientToken (linhas com c_<token>)")
for ln in L:
    if re.search(r"c_[a-z0-9]{18,}", ln):
        print(ln[:300])

sec("2) GenPWDToken (derivação do UserName TOKEN)")
for ln in L:
    if ln.startswith("GenPWDToken"):
        print(ln[:300])

sec("3) AuthCodes / DevList / shadow")
for ln in L:
    if re.search(r"aaaaaaaa-\w+|DevList|devlist|SDevAuthCode|\"auth\"|AuthCode|shadow|Shadow", ln):
        print(ln[:300])

sec("4) Login / senha / loginExist")
for ln in L:
    if re.search(r"login|Login|passw|Passw|pwd|Pwd|account|Account|loginExist", ln):
        print(ln[:300])

sec("5) mapa: todos os msg/MessageType vistos")
for mt in sorted(set(re.findall(r'"(?:msg|MessageType)":"([^"]+)"', T))):
    print("  ", mt)
