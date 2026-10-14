# -*- coding: utf-8 -*-
"""
xmcrypto.py — primitivas de criptografia do SDK Xiongmai/FunSDK, reconstruídas
e VALIDADAS por engenharia reversa (Ghidra) + hook Frida.

Fatos confirmados:
  * "Aes128Encrypt/Decrypt" do SDK são no-op (memcpy). Não há AES real.
  * Toda a cripto de rede é XOR de chave repetida + base64/hex.
  * XMCloud (secu100): chave XOR = str(timestamp_ms) + nonce(8), escolhida pelo
    cliente e transmitida (headers JFTECH-TIME/JFTECH-REQ).
  * API de conta (jftechws): chave = MD5(uuid+appKey+appSecret+seqts+middle+
    const36+appSecret+seqts)  [confirmado 15/15 contra o app].
  * Login DVRIP local (porta 34567): hash "sofia".
"""
import hashlib
import time
import random
import string


# --------------------------------------------------------------------------
# XOR (XorEncrypt / XorDecrypt do SDK)  —  out[i] = in[i] ^ key[i % len(key)]
# --------------------------------------------------------------------------
def xor_crypt(data: bytes, key) -> bytes:
    kb = key.encode("utf-8") if isinstance(key, str) else key
    if not kb:
        return bytes(data)
    return bytes(data[i] ^ kb[i % len(kb)] for i in range(len(data)))


# --------------------------------------------------------------------------
# Chave do XMCloud: timestamp(ms, 13 díg) + nonce(8, base62). Cliente escolhe.
# --------------------------------------------------------------------------
def _nonce(n=8):
    alfa = string.ascii_letters + string.digits
    return "".join(random.choice(alfa) for _ in range(n))

def xmcloud_key(ts_ms: int = None, nonce: str = None) -> str:
    if ts_ms is None:
        ts_ms = int(time.time() * 1000)
    if nonce is None:
        nonce = _nonce(8)
    return "%013d%s" % (ts_ms, nonce)


# --------------------------------------------------------------------------
# Chave da API de conta (jftechws): MD5 do preimage (fórmula validada 15/15).
#   preimage = uuid + appKey + appSecret + seqts + middle + const36 + appSecret + seqts
# --------------------------------------------------------------------------
def account_key(uuid: str, app_key: str, app_secret: str, seqts: str,
                middle: str, const36: str) -> str:
    pre = uuid + app_key + app_secret + seqts + middle + const36 + app_secret + seqts
    return hashlib.md5(pre.encode("utf-8")).hexdigest()

def gen_seqts(seq: int, ts_ms: int = None) -> str:
    """seqts = seq(7 díg) + timestamp_ms(13 díg)."""
    if ts_ms is None:
        ts_ms = int(time.time() * 1000)
    return "%07d%013d" % (seq, ts_ms)


# --------------------------------------------------------------------------
# Hash "sofia" (login DVRIP local na porta 34567)
# --------------------------------------------------------------------------
def sofia_hash(password: str) -> str:
    m = hashlib.md5(password.encode("utf-8")).digest()
    out = ""
    for i in range(8):
        n = (m[2 * i] + m[2 * i + 1]) % 62
        if n < 10:
            out += chr(n + 48)
        elif n < 36:
            out += chr(n + 55)
        else:
            out += chr(n + 61)
    return out


# --------------------------------------------------------------------------
# credenciais da conta — carregadas de config.py (ver config.example.py)
# --------------------------------------------------------------------------
try:
    from config import UUID, APP_KEY, APP_SECRET, CONST36
except Exception:  # pragma: no cover
    UUID = APP_KEY = APP_SECRET = CONST36 = ""


if __name__ == "__main__":
    # auto-teste rápido
    k = xmcloud_key(1791928686943, "H796Ky8D")
    assert k == "1791928686943H796Ky8D", k
    pt = b'{"msg":"dns_req"}'
    assert xor_crypt(xor_crypt(pt, k), k) == pt      # round-trip
    print("xmcloud_key:", k, "| round-trip XOR: OK")
    print("sofia_hash(''):", sofia_hash(""), "(esperado tlJwpbo6)")
    if UUID and CONST36:
        print("account_key exemplo:",
              account_key(UUID, APP_KEY, APP_SECRET, "00000031791928685201",
                          "10258682919713000000", CONST36))
    else:
        print("account_key: configure config.py p/ testar")
