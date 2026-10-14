# -*- coding: utf-8 -*-
"""
config.example.py — modelo de configuração.

Copie para `config.py` e preencha com os valores da SUA conta/câmeras
(extraídos por engenharia reversa do seu próprio dispositivo). O arquivo
`config.py` é ignorado pelo git (ver .gitignore) — NUNCA comite segredos.

Como obter os valores: veja docs/PROTOCOL.md (hooks Frida + Fun_DecDevRandomUserInfo).
"""

# --- Criptografia da nuvem XMCloud/FunSDK (identidade do app/conta) ---
UUID = "YOUR_UUID_HEX24"
APP_KEY = "YOUR_APPKEY_HEX32"
APP_SECRET = "YOUR_APPSECRET_HEX32"
CONST36 = "YOUR_CONST36_HEX36"      # constante de instalação (sessão), reusável
ACCOUNT = "YOUR_ACCOUNT_ID"          # userId interno (sa...)

# --- Câmeras: SN -> credenciais de acesso remoto ---
#   authcode:  "aaaaaaaa-1a0e<hash>" por câmera (estável)
#   localuser/localpwd: usuário local criado via GetRandomUser (texto; o código
#                       aplica sofia_hash). Obtido por Fun_DecDevRandomUserInfo.
#   nome:      rótulo amigável
CAMERAS = {
    "YOUR_CAMERA_SN_1": {
        "authcode": "aaaaaaaa-1a0eXXXXX",
        "localuser": "xxxx", "localpwd": "xxxxxx",
        "nome": "Câmera 1",
    },
    # "YOUR_CAMERA_SN_2": { ... },
}

# --- Acesso local na LAN (opcional; cliente_local.py / app.py) ---
LOCAL_CAMERA_IP = "192.168.1.5"
LOCAL_USER = "admin"
LOCAL_PASSWORD = ""
