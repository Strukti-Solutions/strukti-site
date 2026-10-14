# Ferramentas de engenharia reversa

Scripts usados para **descobrir** o protocolo e **capturar as credenciais** uma vez.
Depois que `config.py` está preenchido, o acesso do dia a dia (`src/`) não precisa deles.

- `frida/` — hooks Frida injetados no app (via `android-unpinner`, sem root):
  - `zz-createuser.js` — injeta `GetRandomUser` na sessão autenticada e decifra as
    credenciais locais na hora (`Fun_DecDevRandomUserInfo`). **Principal.**
  - `dump_secret.js` — dumpa chaves/segredos da conta (XorEncrypt/ToMD5/GetEncryptStr).
  - `zz-dump6611.js`, `zz-deccall.js`, etc. — auxiliares usados na investigação.
- `parsers/` — decodificam as capturas (`http_dump`, `dump_hook`, `.pcap`, `.flows`).
- `refun.py` — análise do `libFunSDK.so` (pyelftools + capstone).
- `capturar_login_nuvem.sh` — wizard de captura TLS (android-unpinner + mitmproxy).

> Os parsers importam módulos de `src/`. Rode-os com `PYTHONPATH=../src`
> (ou a partir de `src/`). Veja `docs/CAPTURE_GUIDE.md`.
