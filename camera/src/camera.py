"""
camera.py — núcleo do acesso DIRETO (DVRIP/NetIP, porta 34567) à câmera
Inova/Xiongmai na rede local. SEM nuvem, SEM token.

Fornece: login, stream ao vivo, listagem e download de gravações, e o
de-wrap Xiongmai -> H.264 (robusto, sem depender do tamanho do cabeçalho).

Usado por cliente_local.py (CLI) e app.py (site).
"""
import socket
import json
import struct
import hashlib

# ---- configuração padrão (pode sobrescrever ao instanciar Camera) ----
try:
    from config import LOCAL_CAMERA_IP as CAMERA_IP, LOCAL_USER as USER, LOCAL_PASSWORD as PASSWORD
except Exception:
    CAMERA_IP = "192.168.1.5"
    USER = "admin"
    PASSWORD = ""
CAMERA_PORT = 34567

LOGIN_REQ = 1000
MONITOR_CLAIM = 1413
MONITOR_START = 1410
MONITOR_STOP = 1411
PLAYBACK = 1420
FILEQUERY = 1440
KEEPALIVE = 1006


def sofia_hash(password: str) -> str:
    m = hashlib.md5(password.encode("utf-8")).digest()
    out = ""
    for i in range(8):
        n = (m[2 * i] + m[2 * i + 1]) % 62
        if n < 10:
            out += chr(n + ord("0"))
        elif n < 36:
            out += chr(n + ord("A") - 10)
        else:
            out += chr(n + ord("a") - 36)
    return out


def _is_xm_marker(b, i):
    return (i + 4 <= len(b) and b[i] == 0 and b[i + 1] == 0 and b[i + 2] == 1
            and 0xF8 <= b[i + 3] <= 0xFE)


def _last_marker(b):
    """Índice do ÚLTIMO marcador XM (00 00 01 F8..FE) no buffer, ou 0."""
    n = len(b)
    p = n
    while True:
        p = b.rfind(b"\x00\x00\x01", 0, p)
        if p < 0:
            return 0
        if p + 3 < n and 0xF8 <= b[p + 3] <= 0xFE:
            return p


def xm_dewrap_video(media: bytes) -> bytes:
    """
    Remove os cabeçalhos de quadro Xiongmai e devolve só o H.264 (Annex-B).
    Robusto: não assume o tamanho do cabeçalho. Para cada marcador de vídeo
    (00 00 01 FC/FD/FE), acha o início real do H.264 (primeiro start code) e
    copia até o próximo marcador XM. Marcadores de áudio (FA/F9/F8) são pulados.
    Isso NUNCA confunde com H.264 porque num NAL válido o byte após 00 00 01 é
    < 0x80, enquanto os marcadores XM usam 0xF8..0xFE.
    """
    n = len(media)
    out = bytearray()
    i = 0
    # vai até o primeiro marcador
    while i < n and not _is_xm_marker(media, i):
        i += 1
    while i < n:
        t = media[i + 3]
        # próximo marcador XM
        j = i + 4
        while j < n and not _is_xm_marker(media, j):
            j += 1
        if t in (0xFC, 0xFD, 0xFE):            # quadro de vídeo
            seg = media[i + 4:j]
            # acha o início do H.264 dentro do segmento (pula o cabeçalho XM)
            sc = seg.find(b"\x00\x00\x00\x01")
            if sc < 0:
                # tenta start code de 3 bytes seguido de NAL válido (<0x80)
                p = 0
                while True:
                    p = seg.find(b"\x00\x00\x01", p)
                    if p < 0:
                        break
                    if p + 3 < len(seg) and seg[p + 3] < 0x80:
                        sc = p
                        break
                    p += 3
            if sc >= 0:
                out += seg[sc:]
        # áudio (FA/F9/F8): ignora
        i = j
    return bytes(out)


class Camera:
    def __init__(self, ip=CAMERA_IP, port=CAMERA_PORT, user=USER, password=PASSWORD):
        self.ip, self.port, self.user, self.password = ip, port, user, password
        self.sock = None
        self.buf = bytearray()
        self.session = 0

    # ---- transporte NetIP ----
    def _header(self, msgid, data):
        return struct.pack("<BBHIIHHI", 0xFF, 0, 0, self.session & 0xFFFFFFFF,
                           0, 0, msgid, len(data))

    def send(self, msgid, obj):
        data = json.dumps(obj).encode("utf-8") + b"\x00"
        self.sock.sendall(self._header(msgid, data) + data)

    def _fill(self):
        d = self.sock.recv(65536)
        if not d:
            return False
        self.buf += d
        return True

    def read_frame(self):
        while True:
            i = self.buf.find(b"\xff")
            if i < 0:
                self.buf.clear()
                if not self._fill():
                    return None
                continue
            if i:
                del self.buf[:i]
            while len(self.buf) < 20:
                if not self._fill():
                    return None
            msgid = struct.unpack("<H", self.buf[14:16])[0]
            ln = struct.unpack("<I", self.buf[16:20])[0]
            while len(self.buf) < 20 + ln:
                if not self._fill():
                    return None
            payload = bytes(self.buf[20:20 + ln])
            del self.buf[:20 + ln]
            return msgid, payload

    def read_json(self):
        fr = self.read_frame()
        if not fr:
            return None
        try:
            return json.loads(fr[1].split(b"\x00")[0].decode("utf-8", "ignore"))
        except Exception:
            return None

    # ---- sessão ----
    def connect(self):
        self.sock = socket.create_connection((self.ip, self.port), timeout=10)
        self.send(LOGIN_REQ, {"EncryptType": "MD5", "LoginType": "DVRIP-Web",
                              "UserName": self.user, "PassWord": sofia_hash(self.password)})
        resp = self.read_json()
        if not resp:
            raise RuntimeError("sem resposta ao login")
        if resp.get("Ret") not in (100, 515):
            raise RuntimeError(f"login recusado (Ret={resp.get('Ret')}) — senha?")
        self.session = int(resp.get("SessionID", "0x0"), 16)
        return self.session

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass

    @property
    def sid(self):
        return hex(self.session)

    # ---- ao vivo ----
    def live_h264(self, channel=0, stream="Main"):
        """
        Generator: produz H.264 desembrulhado, em tempo real.
        IMPORTANTE: um quadro XM vem quebrado em vários pacotes NetIP, então
        acumulamos o bruto e só de-wrapamos até o ÚLTIMO marcador XM completo
        (guardando o resto p/ o próximo ciclo). De-wrapar pacote a pacote
        quebraria quadros e distorceria a imagem.
        """
        params = {"Channel": channel, "CombinMode": "NONE",
                  "StreamType": stream, "TransMode": "TCP"}
        self.send(MONITOR_CLAIM, {"Name": "OPMonitor", "SessionID": self.sid,
                                  "OPMonitor": {"Action": "Claim", "Parameter": params}})
        self.read_frame()
        self.send(MONITOR_START, {"Name": "OPMonitor", "SessionID": self.sid,
                                  "OPMonitor": {"Action": "Start", "Parameter": params}})
        raw = bytearray()
        while True:
            fr = self.read_frame()
            if fr is None:
                break
            _, payload = fr
            if payload[:1] == b"{":
                continue
            raw += payload
            cut = _last_marker(raw)          # último marcador XM completo
            if cut > 0:
                h = xm_dewrap_video(bytes(raw[:cut]))
                del raw[:cut]
                if h:
                    yield h

    # ---- gravações ----
    def list_recordings(self, begin, end, channel=0, stream="Main"):
        """begin/end no formato 'YYYY-MM-DD HH:MM:SS'. Retorna lista de dicts."""
        self.send(FILEQUERY, {"Name": "OPFileQuery", "OPFileQuery": {
            "BeginTime": begin, "EndTime": end, "Channel": channel,
            "DriveTypeMask": "0x0000FFFF", "Event": "*", "Type": "h264",
            "StreamType": stream}})
        arquivos = []
        # a resposta pode vir em vários pacotes; junta até ver a lista
        for _ in range(60):
            fr = self.read_frame()
            if fr is None:
                break
            try:
                obj = json.loads(fr[1].split(b"\x00")[0].decode("utf-8", "ignore"))
            except Exception:
                continue
            if "OPFileQuery" in obj:
                lst = obj["OPFileQuery"]
                if isinstance(lst, list):
                    arquivos.extend(lst)
                if obj.get("Ret") in (100, 106):  # 106 = fim da lista
                    break
        return arquivos

    def download_h264(self, filename, channel=0):
        """Baixa uma gravação (por nome) e devolve o H.264 desembrulhado."""
        params = {"PlayMode": "ByName", "FileName": filename, "Channel": channel,
                  "StreamType": 0, "Value": 0, "TransMode": "TCP"}
        self.send(PLAYBACK, {"Name": "OPPlayBack", "SessionID": self.sid,
                             "OPPlayBack": {"Action": "Claim", "Parameter": params}})
        self.read_frame()
        self.send(PLAYBACK, {"Name": "OPPlayBack", "SessionID": self.sid,
                             "OPPlayBack": {"Action": "Start", "Parameter": params}})
        media = bytearray()
        empty = 0
        while True:
            fr = self.read_frame()
            if fr is None:
                break
            _, payload = fr
            if payload[:1] == b"{":
                # mensagens de controle; quando chega o fim, a câmera para de enviar mídia
                if b'"Ret"' in payload and (b'OPPlayBack' in payload):
                    pass
                continue
            if not payload:
                empty += 1
                if empty > 3:
                    break
                continue
            media += payload
        return xm_dewrap_video(bytes(media))
