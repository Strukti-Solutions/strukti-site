# Projeto Câmeras Inova / Xiongmai — Engenharia Reversa e Acesso ao Vídeo

> **Objetivo do negócio:** sistema de *replay* para quadras esportivas — ao acionar um
> gatilho, guardar/enviar os últimos ~15 s de todas as câmeras. Este repositório é a
> investigação técnica de **como acessar o vídeo das câmeras** por conta própria,
> sem o app oficial.

> ⚠️ **Aviso:** este arquivo contém chaves e identificadores extraídos por engenharia
> reversa do **seu próprio** equipamento/conta. Não publique. Trabalho feito em
> dispositivos e conta próprios, para interoperabilidade.

---

## Índice
1. [Resumo executivo](#1-resumo-executivo)
2. [Hardware e ambiente](#2-hardware-e-ambiente)
3. [O bug original do ffmpeg](#3-o-bug-original-do-ffmpeg)
4. [Protocolo NetIP/DVRIP](#4-protocolo-netipdvrip)
5. [Estrutura do token (:6611)](#5-estrutura-do-token-6611)
6. [Vídeo: desembrulho do H.264 Xiongmai](#6-vídeo-desembrulho-do-h264-xiongmai)
7. [✅ Solução que FUNCIONA: acesso local (DVRIP :34567)](#7--solução-que-funciona-acesso-local-dvrip-34567)
8. [Engenharia reversa da nuvem](#8-engenharia-reversa-da-nuvem)
9. [A criptografia (tudo é XOR/MD5, não há AES)](#9-a-criptografia-tudo-é-xormd5-não-há-aes)
10. [Valores extraídos](#10-valores-extraídos)
11. [Endpoints da nuvem](#11-endpoints-da-nuvem)
12. [Inventário de arquivos/ferramentas](#12-inventário-de-arquivosferramentas)
13. [Limitações e becos sem saída](#13-limitações-e-becos-sem-saída)

---

## 1. Resumo executivo

Partimos de "o ffmpeg não gera o vídeo" e chegamos a:

- ✅ **Vídeo local ao vivo funcionando** direto da câmera na LAN, sem nuvem, sem token, sem app (`cliente_local.py` + site `app.py`).
- ✅ **Protocolo DVRIP/NetIP totalmente mapeado** (portas 6611 nuvem e 34567 local).
- ✅ **De-wrap do H.264 Xiongmai** verificado (resolve os quadros verdes/distorcidos).
- ✅ **Criptografia da nuvem decifrada e reproduzida em Python**, validada ao vivo contra o servidor real (`xmcloud.py` resolve SN→IP das câmeras).
- ✅ Diagnóstico claro de **por que** o acesso remoto pela nuvem é possíve.

**O que serve ao produto:** o acesso local + o de-wrap. **O que foi explorado:** reproduzir a autenticação da nuvem do fabricante.

---

## 2. Hardware e ambiente

| Item | Valor |
|---|---|
| Câmera | **Inova KV-20158** (rebrand de Xiongmai/iCSee) |
| Modelo interno | `IPC_XM210_X2-WR-T_S38`, firmware `V5.06/V5.08.R02` |
| App | **Tris Home** = pacote **`com.cz.czeye`** (base iCSee/FutureHome, SDK **FunSDK** da Xiongmai) |
| Celular de teste | Redmi **23129RA5FL**, HyperOS/Android 15, **sem root** |
| PC | Windows 11 + Git Bash, Python 3.13, ffmpeg (winget) |
| Porta local da câmera | **34567** (DVRIP) — sem RTSP/ONVIF nessas câmeras |
| Porta nuvem (relay) | **6611** (NetIP sobre TCP, texto puro) |

---

## 3. O bug original do ffmpeg

Os scripts iniciais (`teste.py`/`teste2.py`) gravavam `temp_stream.h264` **vazio** (0 bytes) e o ffmpeg falhava com *"Output file does not contain any stream"*. Causas:

1. O token embutido era **antigo/de uso único** → o servidor não respondia ao handshake.
2. O cabeçalho NetIP estava com o tamanho no offset errado.
3. Mesmo com dados, faltava **desembrulhar o H.264** (ver §6).

Correções aplicadas em `teste2.py`: cabeçalho NetIP correto, detecção robusta do ffmpeg, mensagens de erro reais, e o de-wrap.

---

## 4. Protocolo NetIP/DVRIP

Mesmo protocolo nas portas **6611** (relay de nuvem) e **34567** (local).

**Cabeçalho NetIP (20 bytes, little-endian):**
```
[0]=0xFF  [1]=versão  [2:4]=0  [4:8]=SessionID  [8:12]=sequência
[12:14]=0  [14:16]=msg_id  [16:20]=tamanho_do_payload
```
Payload = JSON (terminado em `\0`).

**Códigos (msg_id):**
| Código | Função |
|---|---|
| 1000 | Login DVRIP |
| 1413 | OPMonitor **Claim** (reivindicar stream ao vivo) |
| 1410 | OPMonitor **Start** (dispara o fluxo) |
| 1420 | OPPlayBack (gravações) |
| 1440 | OPFileQuery (listar gravações) |
| 1422 | **Dados de vídeo** vindos do servidor |

O servidor atribui o **SessionID real** na resposta do login (o que o cliente envia é ignorado).

---

## 5. Estrutura do token (:6611)

O handshake do relay usa `base64(<token>) + "XXEE"`. O token tem **4 campos** separados por `:`:

```
aaaaaaaa-<reqid> : c_<sessao> : <deviceSN> : <ticket>
     [0]               [1]          [2]          [3]
```

| Campo | O que é | Rotação |
|---|---|---|
| [0] `aaaaaaaa-<9hex>` | AuthCode / id da requisição | a cada conexão (componente de tempo) |
| [1] `c_<24ch>` | token de **sessão** da conta | a cada login no app |
| [2] `<20ch>` | **SN do dispositivo** (FIXO por câmera) | nunca |
| [3] `<32ch>` | **ticket de conexão** | a cada conexão (**uso único**) |

> **Consequência crítica:** o campo [3] é de **uso único**. Capturar e **reusar** o token **não funciona** (o servidor dá timeout). Foi por isso que o replay direto nunca conectou.

---

## 6. Vídeo: desembrulho do H.264 Xiongmai

Os frames chegam em quadros NetIP (msg_id 1422). Dentro, o H.264 vem **embrulhado** com cabeçalhos proprietários:

| Marcador | Tipo | Cabeçalho |
|---|---|---|
| `00 00 01 FC` / `FE` | Quadro-I (keyframe, traz SPS/PPS) | 16 bytes |
| `00 00 01 FD` | Quadro-P | 8 bytes (`marcador + len[2 LE] + 00 00`) |
| `00 00 01 FA` / `F9` | Áudio | descartar |
| `0xD5…` | Enchimento | ignorar |

**De-wrap robusto (agnóstico ao tamanho do cabeçalho):** para cada marcador de vídeo, achar o **primeiro `00 00 00 01`** (start code H.264 real) e copiar até o próximo marcador XM. Isso nunca confunde com H.264 porque num NAL válido o byte após `00 00 01` é `< 0x80`, enquanto os marcadores XM usam `0xF8–0xFE`. **Verificado** contra captura real e corrige os quadros verdes/distorcidos. Implementado em `camera.py` (`xm_dewrap_video`).

> No streaming ao vivo, um quadro XM vem **fragmentado em vários pacotes NetIP** (chunks de ~32 KB). É preciso **acumular e só desembrulhar até o último marcador completo** — senão os quadros quebram (distorção). Resolvido em `camera.py::live_h264`.

---

## 7. ✅ Solução que FUNCIONA: acesso local (DVRIP :34567)

Na **mesma rede** da câmera, o acesso é direto, **sem nuvem/token**:

- **Login:** DVRIP local com hash **"sofia"** (MD5 proprietário); usuário `admin`, senha em branco por padrão.
- **Ao vivo:** `OPMonitor` Claim+Start → frames 1422 → de-wrap → MP4.
- **Gravações:** `OPFileQuery` + `OPPlayBack` (⚠️ suas câmeras **não têm cartão SD** → gravações só existem na nuvem; `--listar` vem vazio).

**Uso:**
```bash
python cliente_local.py               # ao vivo (Ctrl+C encerra → camera_local.mp4)
python cliente_local.py --segundos 15 # grava 15 s
python app.py                         # site em http://127.0.0.1:5000 (ao vivo + gravações)
```
Config (IP/usuário/senha) em `camera.py`. Scan de rede p/ achar a câmera: ver histórico (`192.168.1.5:34567`).

---

## 8. Engenharia reversa da nuvem

**Captura de TLS sem root:** o APK base é um *App Bundle* sem `.so`; a `libFunSDK.so` (35 MB, arm64) veio do split `split_config.arm64_v8a.apk`.

- **`android-unpinner`** (da equipe do mitmproxy): injeta o **Frida Gadget** no app **sem root**, marca debuggable, aplica unpinning. Rodado via `python -m android_unpinner`.
- **Modo WireGuard do mitmproxy** para interceptação transparente (o app ignora o proxy HTTP; a MIUI bloqueia `settings put http_proxy`).
- **Hooks Frida** (`dump_secret.js`, `dump_http.js`) em `SSL_write`/`SSL_read`, `XorEncrypt`/`XorDecrypt`, `GetEncryptStr`, `OS::ToMD5` → dumparam o **HTTP em texto claro + as chaves reais**, contornando o pinning nativo (BoringSSL) que o unpinning genérico não cobria.
- **Ghidra 12.1.4** (headless) decompilou a `libFunSDK.so`. 34 352 símbolos dinâmicos, 701 exports JNI. Projeto em `C:\Users\kauab\ghidra_work\`.

---

## 9. A criptografia (tudo é XOR/MD5, não há AES)

A descoberta central: **a "criptografia" do FunSDK é ofuscação, não cripto forte.**

- **`Aes128Encrypt`/`Aes128Decrypt` do SDK são no-op** (só `memcpy`). Não existe AES.
- Tudo é **XOR de chave repetida** + base64/hex + MD5.

**Camada 1 — XMCloud (`*.secu100.net`), protocolo "JFTECH":**
```
POST https://host:porta/path
Content-Type: text/plain
JFTECH-TIME: <timestamp ms, 13 díg>
JFTECH-REQ:  <nonce, 8 chars>
JFTECH-EV: 3
User-Agent: funsdk-v1.8.2-Android

body = base64( XOR(json, chave) )     onde  chave = JFTECH-TIME + JFTECH-REQ
```
A chave é **escolhida pelo cliente** e transmitida nos headers; a resposta traz os seus próprios `JFTECH-TIME/REQ`. **Sem segredo do servidor → totalmente reproduzível.** ✅ Validado ao vivo (`xmcloud.py`).

**Camada 2 — API de conta (`ams.jftechws.com`), `loginExist`/`userinfo2`:**
```
chave = MD5( uuid + appKey + appSecret + seqts + nonce + const36 + appSecret + seqts )
body  = hex( XOR(json, chave) )
```
Fórmula **validada 15/15** (o MD5 que calculamos bate com o que o app gera). Depende do `appSecret` (extraído) e de um `const36` de sessão. *(Reproduzir este login para dirigir a nuvem do fabricante foi interrompido — ver §13.)*

**Camada 3 — Login local DVRIP (:34567):** hash **"sofia"** (`sofia_hash` em `xmcrypto.py`), confirmado (`sofia_hash("") == "tlJwpbo6"`).

---

## 10. Valores extraídos

> Da sua conta/dispositivos (via hook Frida nos campos do `IXMEncrypt`).

| Chave | Valor |
|---|---|
| `uuid` | `<UUID>` |
| `appKey` | `<APP_KEY>` |
| `appSecret` | `<APP_SECRET>` |
| `const36` (sessão) | `<CONST36>` |
| `account` (userId) | `<ACCOUNT>` |
| Chaves do SDK (assets) | `<sdkkey>` (sdkkey), `<qrkey>…` (qrkey) |

**Câmeras (SN = campo [2] do token):**
| SN | WanIP | DevPort |
|---|---|---|
| `<SN_VARANDA>` | <WAN_IP_1> | 34567 |
| `<SN_FOGAO>` | <WAN_IP_1> | 34567 |
| `<SN_CORREDOR>` | <WAN_IP_2> | 34567 |

Credenciais locais por device (cache `XWorldFile.xml`): `devToken` por câmera (ex. `f5332…` → `<devToken>`). Senha da conta: cifrada (XOR) em `Users_new.xml` com chave random persistida em `local_eketkey`.

---

## 11. Endpoints da nuvem

| Host:porta | Função |
|---|---|
| `pub-cfg.secu100.net:8186` | **DNS multiquery** (SN→ServerIP) — **sem auth** ✅ reproduzido |
| `<ServerIP>:6502` | STATUS (Online/WanIP/relay) — precisa de AuthCode |
| `pub-status.secu100.net:7601/7605` | status/push |
| `access-pms.secu100.net:6502` | PMS |
| `caps.xmcsrv.net:443` | capacidades do device (reqCaps) |
| `ams.jftechws.com:443` | **API de conta** (loginExist/userinfo2) |
| `AgentServer 152.32.199.78:6611` | **relay de vídeo** (MSG_CLI_NEED_CON) |

O **AuthCode** (`aaaaaaaa-1a0e<devhash>`, campo [0] do token) **não** é computado do SN: é **emitido pelo servidor** e vem na **lista de dispositivos** (`GetDevList`), obtida após o login da conta.

---

## 12. Inventário de arquivos/ferramentas

**Acesso local (produto):**
- `camera.py` — núcleo DVRIP local: login sofia, NetIP, de-wrap H.264, ao vivo, gravações.
- `cliente_local.py` — CLI (ao vivo / listar / baixar).
- `app.py` — site Flask (ao vivo via MJPEG + gravações).

**Relay/token (:6611):**
- `teste2.py` — cliente de relay com token (corrigido; token de uso único limita o uso).
- `extrair_token.py` — extrai o token de um `.pcap` do PCAPdroid.

**Acesso remoto via relay (nuvem):**
- `webcam.py` — **site Flask**: lista as 3 câmeras; clicar mostra o AO VIVO no navegador
  (MJPEG via ffmpeg). `python webcam.py` → http://127.0.0.1:5000
- `xmremote.py` — **pipeline remoto ponta-a-ponta** (grava MP4): STATUS (:7605) →
  CLI_NEED_CON (:6510) → relay :6611 → login MD5 local → OPMonitor → de-wrap.
- `xmcrypto.py` — cripto reconstruída e **validada** (XOR, MD5 da conta, chave XMCloud, sofia).
- `xmcloud.py` — **cliente XMCloud vivo** (resolve SN→ServerIP, fala JFTECH).
- `refun.py` — harness de RE (pyelftools + capstone) sobre a `.so`.
- `dump_secret.js`, `dump_http.js`, `token_hook.js` — hooks Frida.
- `parse_http.py`, `validar_cloud.py` — parsers/validadores das capturas.
- `analisar_frames.py` — diagnóstico do de-wrap.
- `capturar_login_nuvem.sh` — wizard de captura TLS (android-unpinner + WireGuard).

**Negócio:**
- `gerar_plano_pdf.py` + `Plano_Replay_Quadras.pdf` — plano do produto de replay.

**Projeto Ghidra:** `C:\Users\kauab\ghidra_work\` (análise salva + `ghidra_*.txt` decompilados).

---

## 13. Acesso remoto via relay — ✅ RESOLVIDO (vídeo remoto ao vivo, sem app)

> **Atualização (13/10, noite):** FECHADO. `xmremote.py` puxa **vídeo ao vivo
> 1920×1080** das câmeras pelo relay da nuvem, **sem o app** (frame real da câmera
> "Corredor" capturado). O que faltava era (a) o login e (b) o msg do vídeo — ver abaixo.

**Como rodar:**
```bash
python xmremote.py --sn <SN_CORREDOR> --segundos 15   # -> camera_remota_877682.mp4
```

**Os 3 segredos que destravaram a última milha:**
1. **Login:** o login TOKEN usa um `UserName` derivado nativamente (dava `Ret:137`).
   Driblado logando como **admin local** — a câmera aceita `EncryptType:MD5` pelo relay:
   `{"EncryptType":"MD5","LoginType":"DVRIP-Web","UserName":<LocalUser>,"PassWord":sofia_hash(<LocalPwd>)}`.
   As credenciais locais o app cacheia em `XWorldFile.xml` (`dev_password_<SN>` →
   `LocalUserName=…,LocalPwd=…`, só após abrir a câmera 1x no app).
2. **Pré-handshake:** antes do login, mandar Claim (msg 1413) com **header SID=0x1869f
   e canal=99** (byte [12] do cabeçalho NetIP) → recebe 1414 Ret:100. Sem isso: Ret:103.
3. **Vídeo vem em msg 1412** (não 1422) neste firmware; de-wrap robusto (achar
   `00 00 00 01` após cada marcador XM e copiar até o próximo) preserva SPS/PPS/IDR.

**✅ AS TRÊS CÂMERAS 100% STANDALONE** (sem app, sem nuvem de conta):
```bash
python xmremote.py --sn <SN_CORREDOR>   # Corredor  (<user> / <pass>)
python xmremote.py --sn <SN_VARANDA>    # Varanda   (<user> / <pass>)
python xmremote.py --sn <SN_FOGAO>    # fogão     (<user> / <pass>)
```
- `ClientToken` = **nonce do cliente** (gerado pelo `xmremote.py`, não capturado).
- `SessionId` = nonce do cliente.
- `AuthCode` = `aaaaaaaa-1a0e<hash>` por câmera (estável).
- **Credenciais locais** por câmera: o app cria um usuário local via `GetRandomUser`
  (cmdId 1660) — a câmera devolve cifrado no campo `Info`, decifrado por
  **`Fun_DecDevRandomUserInfo(SN, Info)`** do `libFunSDK.so` (formato `p1:<user> p2:<senha>`).
  Para câmeras remotas (sem LAN) o app não expõe isso, então obtivemos as credenciais
  **injetando `GetRandomUser` na sessão autenticada do app** (hook `zz-createuser.js`)
  e decifrando na hora com `Fun_DecDevRandomUserInfo`. Credenciais são **persistentes**
  por câmera → captura uma vez, usa pra sempre (`camera_remota_<sn>.mp4`).

**O mal-entendido do "ticket de uso único":** o campo [3] do token :6611 (`SessionId`)
**não** é um segredo do servidor — é um **nonce escolhido pelo cliente** (32 ch). Reusar
um já-usado dá timeout; **gerar um novo a cada conexão** funciona. Foi isso que travou
o `teste2.py` (replay) + a falta do passo de rendezvous abaixo.

**Arquitetura real do acesso remoto (toda reproduzida em Python, ao vivo):**
1. **STATUS** → `https://pub-status.secu100.net:7605/` (o `:6502` é AlarmCenter, não status)
   com `MSG_STATUS_LOCALQUERY_REQ{Body:[{SerialNumber,AuthCode}]}` → `Status:Online` +
   `ServerIP` + `ServerPort:6510` por câmera. (As 3 câmeras confirmadas **Online**.)
2. **CLI_NEED_CON** → `https://<ServerIP>:6510/` com `MSG_CLI_NEED_CON_REQ`
   (`Authcode`, `ClientToken`, `SerialNumber`, `SessionId`=nonce novo, `DestPort:34567`,
   `ServiceType:RpsCmd`) → **200** + `AgentServerIp:6611`. **Este passo faz a câmera
   (atrás de CGNAT) discar para o relay** — é o rendezvous; sem ele o :6611 dá timeout.
3. **Relay** → TCP `AgentServerIp:6611`, handshake `base64("AuthCode:ClientToken:SN:SessionId")+"XXEE"`
   → servidor responde `{"ErrorNum":"200","DestIP":"<WanIP da câmera>","MTU":"1400"}` =
   **bridge até a câmera OK**.
4. **Login DVRIP** (msg 1000, `EncryptType:TOKEN`, UserName = nonce de 16 ch, senha vazia)
   → OPMonitor → frames 1422 → de-wrap → MP4. *(ServerIP/AgentServer rotacionam: re-resolver STATUS a cada conexão.)*

**A única milha que falta — `Ret:137` no login DVRIP:** com qualquer `ClientToken`
**capturado** (pcap da manhã ou hook), o login retorna `Ret:137`. Provado que não é o
UserName (nonce aleatório) nem a sequência de handshake (replay byte-a-byte dos frames
exatos do app → ainda 137). É **credencial de sessão velha**: o `ClientToken c_…` roda a
cada login do app, e os capturados já foram invalidados. A nuvem aceita (200), mas a
**câmera** rejeita o login TOKEN com sessão morta.

**Conserto = login standalone** (reproduzir a autenticação da conta p/ mintar `ClientToken`
fresco). Falta: (a) formato exato do request `loginExist`/login (`/loginExist/v3/<seqts>/<32hex>.rs`,
body = hex(XOR(json, account_key)), `account_key = MD5(preimage)` já validado 15/15); (b)
**origem do `const36`** (constante na sessão — descobrir se é constante de instalação reusável
ou emitida no login); (c) a senha da conta. Isso pede **uma captura nova dirigida** (logout+login
no app com hook dumpando o corpo do login + fonte do `const36`), ou decompilar o login no
`libFunSDK.so`. Atalho a investigar: trocar o **JWT (válido 30 dias)** por um `ClientToken` fresco
sem senha.

**Outras notas:**
- **Acesso direto na LAN (WanIP:34567):** bloqueado por **CGNAT** (provedor BR) — por isso o relay.
- **Gravações locais:** inexistentes (câmeras **sem SD**; gravação é na nuvem).