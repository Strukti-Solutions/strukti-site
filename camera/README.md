# Acesso às câmeras Inova / Xiongmai (iCSee) sem o app

Cliente **100% em Python** para assistir às câmeras IP baseadas em **Xiongmai/iCSee
(FunSDK)** — vendidas como *Inova*, *Tris Home* (`com.cz.czeye`) e similares —
**sem depender do aplicativo oficial**, inclusive **remotamente** (através do relay
da nuvem, contornando CGNAT).

Inclui um pequeno **site web** que lista as câmeras e mostra o vídeo ao vivo no
navegador, e toda a **engenharia reversa** do protocolo documentada.

> ⚠️ **Aviso legal/ético.** Este projeto é um trabalho de **interoperabilidade** com
> equipamento e conta **próprios**. Use **apenas** em dispositivos que você possui e
> está autorizado a acessar. Não use para acessar câmeras ou contas de terceiros.
> O autor não se responsabiliza por uso indevido.

---

## ✨ O que faz

- 🎥 **Vídeo ao vivo remoto** de cada câmera, sem o app, via relay da nuvem.
- 🌐 **Site web** (`webcam.py`): lista as câmeras; clicou, assiste ao vivo (MJPEG).
- 💾 **Gravação** em MP4 (`xmremote.py`).
- 🏠 **Acesso local na LAN** (`app.py` / `cliente_local.py`) quando na mesma rede.
- 🔬 **Protocolo DVRIP/NetIP + nuvem XMCloud totalmente documentados** (`docs/PROTOCOL.md`).

## 🧩 Como funciona (resumo)

As câmeras ficam atrás de **CGNAT** (sem IP público), então o acesso remoto passa
pelo **relay da nuvem** do fabricante:

```
STATUS (pub-status.secu100.net:7605)   -> câmera Online + ServerIP
CLI_NEED_CON (<ServerIP>:6510)          -> faz a câmera discar para o relay (rendezvous)
relay :6611  (handshake base64+XXEE)    -> túnel TCP até a câmera
login DVRIP MD5 (usuário local)         -> autentica
OPMonitor -> frames de vídeo (msg 1412) -> de-wrap H.264 -> MP4 / MJPEG
```

O `ClientToken` e o `SessionId` do handshake são **nonces gerados pelo cliente**; o
`AuthCode` é estável por câmera; e o **login usa um usuário local** (criado pela própria
câmera via `GetRandomUser` e decifrado pela função `Fun_DecDevRandomUserInfo` do
`libFunSDK.so`). Todos os detalhes e a descoberta estão em **[`docs/PROTOCOL.md`](docs/PROTOCOL.md)**.

## 📁 Estrutura

```
.
├── src/                    # código principal (rode a partir daqui)
│   ├── config.example.py   # modelo de configuração (copie para config.py)
│   ├── xmcrypto.py         # cripto do FunSDK (XOR/MD5/sofia) reconstruída
│   ├── xmcloud.py          # cliente da nuvem XMCloud (protocolo JFTECH)
│   ├── camera.py           # núcleo DVRIP/NetIP (login, de-wrap H.264)
│   ├── xmremote.py         # acesso REMOTO via relay -> grava MP4
│   ├── webcam.py           # site web: lista câmeras + ao vivo (MJPEG)
│   ├── app.py              # site web para acesso LOCAL (LAN)
│   └── cliente_local.py    # CLI para acesso local (LAN)
├── tools/                  # ferramentas de engenharia reversa
│   ├── frida/              # hooks Frida (captura/decifra credenciais)
│   ├── parsers/            # parsers das capturas
│   ├── refun.py            # análise do libFunSDK.so (pyelftools+capstone)
│   └── capturar_login_nuvem.sh
├── docs/
│   ├── PROTOCOL.md         # engenharia reversa completa do protocolo
│   └── CAPTURE_GUIDE.md    # como capturar as credenciais (uma vez)
├── requirements.txt
└── config.py               # SEUS segredos (ignorado pelo git)
```

## 🚀 Começando

### 1. Dependências
```bash
pip install -r requirements.txt
# ffmpeg (para vídeo): winget install Gyan.FFmpeg
```

### 2. Configuração
```bash
cp src/config.example.py src/config.py
# edite src/config.py com os dados das SUAS câmeras/conta
```
Os valores (SNs, `AuthCode`, usuário/senha local por câmera, chaves da conta) são
obtidos **uma única vez** por engenharia reversa do seu próprio dispositivo — veja
**[`docs/CAPTURE_GUIDE.md`](docs/CAPTURE_GUIDE.md)**. Depois disso, o acesso é
standalone (sem app, sem celular).

### 3. Uso

**Site web (recomendado):**
```bash
cd src && python webcam.py
# abra http://127.0.0.1:5000
```

**Gravar um clipe de uma câmera:**
```bash
cd src && python xmremote.py --sn <SN> --segundos 15
# -> camera_remota_<sn>.mp4
```

**Acesso local na LAN (mesma rede da câmera):**
```bash
cd src && python app.py          # site em http://127.0.0.1:5000
cd src && python cliente_local.py
```

## 🔒 Segurança

- **Nunca** comite `config.py` — ele contém segredos da sua conta/câmeras
  (já está no `.gitignore`).
- Capturas, dumps, binários e vídeos ficam em `local/` (ignorado pelo git).

## 🛠️ Hardware testado

| Item | Valor |
|---|---|
| Câmera | Inova KV-20158 (rebrand Xiongmai/iCSee), `IPC_XM210_X2-WR-T_S38` |
| App | Tris Home (`com.cz.czeye`), base iCSee/FunSDK |
| Porta local | 34567 (DVRIP) · Relay nuvem | 6611 (NetIP) |

## 📜 Licença

[MIT](LICENSE). Projeto de interoperabilidade — veja o aviso legal no topo.
