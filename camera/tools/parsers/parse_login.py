# -*- coding: utf-8 -*-
"""
parse_login.py — analisa uma captura NOVA da fase de LOGIN (dump do dump_secret.js
feito durante logout+login no app) para fechar o login standalone.

Responde às 3 perguntas que faltam:
  1) Formato do request de login (loginExist/login) e o que vai no corpo.
  2) Onde o ClientToken (c_...) e o AuthCode (aaaaaaaa-...) são EMITIDOS (em qual
     resposta), e se dependem só do JWT/conta (=> atalho sem senha) ou da senha.
  3) Origem do const36 (c206...): aparece em alguma resposta, ou é constante de
     instalação reusável?

Uso:  python parse_login.py dump_login_novo.txt
"""
import re
import sys

DUMP = sys.argv[1] if len(sys.argv) > 1 else "dump_login_novo.txt"
txt = open(DUMP, encoding="utf-8", errors="ignore").read()

CONST36 = "<CONST36>"
APPKEY = "<APP_KEY>"


def seção(t):
    print("\n" + "=" * 78 + "\n" + t + "\n" + "=" * 78)


seção("1) REQUESTS de login/conta em claro (XorEncrypt REQ-claro)")
for m in re.finditer(r"XorEncrypt REQ-claro=(.*?)\s*\|\|KEY=(\S+)", txt):
    body, key = m.group(1), m.group(2)
    if re.search(r"login|Login|pwd|Pwd|passw|Passw|account|Account|user|User", body):
        print("REQ:", body[:300])
        print("    KEY:", key, "(ts+nonce)" if re.match(r"^\d{13}", key) else "")

seção("2) RESPOSTAS em claro que EMITEM token/JWT/ClientToken/AuthCode")
emit = re.compile(r"(accessToken|refreshToken|ClientToken|\"ac\"|AuthCode|c_[a-z0-9]{18,}|eyJ[A-Za-z0-9_-]{10,})")
for m in re.finditer(r"(?:DecResp RESP-claro|XorDec claro)=(.*?)\s*\|\|KEY=(\S+)", txt):
    body = m.group(1)
    if emit.search(body):
        print("RESP:", body[:400])

seção("3) Onde o const36 aparece (preimages) e se vem de resposta")
pres = re.findall(r"ToMD5 preimage\(\d+\)=([0-9a-fA-F]+)", txt)
print("preimages capturados:", len(pres))
if pres:
    # tenta localizar seqts/nonce/const na estrutura: uuid+appKey+appSecret+seqts+nonce+const+appSecret+seqts
    p = pres[0]
    i = p.find(APPKEY)
    print("exemplo preimage[0]:", p[:60], "...", "(contém const36)" if CONST36 in p else "(SEM const36!)")
const_in_resp = []
for m in re.finditer(r"(?:DecResp RESP-claro|XorDec claro)=(.*?)\s*\|\|KEY=", txt):
    if CONST36 in m.group(1) or re.search(r"[0-9a-f]{36}", m.group(1)):
        const_in_resp.append(m.group(1)[:200])
if const_in_resp:
    print("const36/hex36 apareceu em RESPOSTA (=> emitido no login):")
    for c in const_in_resp[:5]:
        print("   ", c)
else:
    print("const36 NÃO apareceu em nenhuma resposta desta captura.")
    print("=> provável constante de INSTALAÇÃO (reusável). Confirmar se é o mesmo")
    print("   valor de capturas anteriores:", CONST36)

seção("4) Todos os MessageType/msg vistos (mapa do fluxo de login)")
for mt in sorted(set(re.findall(r'"(?:MessageType|msg)":"([^"]+)"', txt))):
    print("  ", mt)
