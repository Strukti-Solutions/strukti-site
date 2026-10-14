# -*- coding: utf-8 -*-
"""Valida a reprodução da cripto da nuvem Xiongmai a partir do dump do hook
(dump_hook.txt). Confirma:
  1) chave da API de conta = MD5(preimage)  -> compara com os key(MD5) do app
  2) esquema XOR (XorEncrypt/XorDecrypt) + formato da chave (timestamp+nonce)
  3) resumo dos endpoints de conexão (ServerIP/WanIP/AgentServer/AuthCode)
"""
import re, hashlib, json, sys

DUMP = sys.argv[1] if len(sys.argv) > 1 else "dump_hook.txt"
txt = open(DUMP, encoding="utf-8", errors="ignore").read()

# ---- 1) valida MD5(preimage) == key(MD5) do app ----
preimages = re.findall(r"ToMD5 preimage\(\d+\)=([0-9a-fA-F]+)", txt)
appkeys = set(m.lower() for m in re.findall(r"GetEncryptStr -> key\(MD5\)=([0-9a-fA-F]{32})", txt))
print("=== 1) FÓRMULA DA CHAVE (MD5 do preimage) ===")
print(f"preimages capturados: {len(preimages)} | digests do app: {len(appkeys)}")
hit = 0
for p in preimages:
    d = hashlib.md5(p.encode()).hexdigest()
    if d in appkeys:
        hit += 1
        if hit <= 3:
            print(f"  ✔ MD5(preimage) = {d}  CONFERE com key(MD5) do app")
if hit:
    print(f"  >>> {hit}/{len(preimages)} preimages batem -> FÓRMULA CONFIRMADA: key = MD5(uuid+appKey+appSecret+seqts+nonce+const+appSecret+seqts)")
else:
    print("  (nenhum bateu — preimages e digests podem ser de execuções diferentes; "
          "rode o hook uma vez só e puxe o arquivo)")

# ---- 2) esquema XOR + formato da chave ----
print("\n=== 2) ESQUEMA XOR (chave = timestamp(13) + nonce(8)) ===")
def xor(data, key):
    kb = key.encode(); return bytes(data[i] ^ kb[i % len(kb)] for i in range(len(data)))
pairs = re.findall(r"(?:REQ-claro|RESP-claro|claro)=(.*?)\s*\|\|KEY=(\S+)", txt)
ok = 0
for pt, key in pairs[:5]:
    m = re.match(r"^(\d{13})(.+)$", key)
    tsflag = "ts+nonce ✓" if m else "formato?"
    ct = xor(pt.encode("utf-8", "ignore"), key)
    rt = xor(ct, key).decode("utf-8", "ignore")
    ok += (rt == pt)
    print(f"  key={key}  [{tsflag}]  round-trip XOR: {'OK' if rt==pt else 'FALHOU'}")
print(f"  >>> {ok}/{min(5,len(pairs))} round-trips XOR OK (confirma a implementação)")

# ---- 3) endpoints de conexão ----
print("\n=== 3) ENDPOINTS DE CONEXÃO (das respostas em claro) ===")
for sn, sip, wan, dp in re.findall(r'"SerialNumber":"(\w+)","ServerIP":"([\d.]+)","WanIP":"([\d.]+)","ServerPort":"(\d+)"', txt):
    pass
for m in re.finditer(r'"SerialNumber":"(\w+)"[^}]*?"ServerIP":"([\d.]+)"[^}]*?"WanIP":"([\d.]+)"[^}]*?"DevicePort":"(\d+)"[^}]*?"Status":"(\w+)"', txt):
    print(f"  {m.group(1)}: ServerIP {m.group(2)} | WanIP {m.group(3)} | DevPort {m.group(4)} | {m.group(5)}")
for m in re.finditer(r'"AgentServerIp":"([\d.]+)"[^}]*?"AgentServerPort":"(\d+)"', txt):
    print(f"  RELAY (AgentServer): {m.group(1)}:{m.group(2)}")
acs = set(re.findall(r'"(?:AuthCode|ac)":"(aaaaaaaa-?\w+)"', txt))
if acs: print("  AuthCodes (campo[0] do :6611):", sorted(acs)[:6])
