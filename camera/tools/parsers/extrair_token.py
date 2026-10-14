"""
extrair_token.py — lê um .pcap do PCAPdroid, acha o handshake NetIP da porta
6611 (texto puro) e grava 'token6611.txt' (SERVER=ip:porta / TOKEN=base64) que
o teste2.py carrega automaticamente.

Uso:
    python extrair_token.py CAPTURA.pcap
    (sem argumento, usa o .pcap mais recente da pasta)
"""
import sys, os, struct, glob, base64

PORT = 6611

def parse_pcap(path):
    data = open(path, "rb").read()
    magic = data[:4]
    if magic in (b"\xd4\xc3\xb2\xa1", b"\xa1\xb2\xc3\xd4"):
        endian = "<" if magic == b"\xd4\xc3\xb2\xa1" else ">"
    elif magic in (b"\x0a\x0d\x0d\x0a",):
        raise SystemExit("pcapng não suportado; exporte como .pcap clássico no PCAPdroid.")
    else:
        raise SystemExit(f"não é um .pcap clássico (magic {magic.hex()}).")
    linktype = struct.unpack(endian + "I", data[20:24])[0]
    off, pkts = 24, []
    while off + 16 <= len(data):
        _, _, incl, _ = struct.unpack(endian + "IIII", data[off:off+16])
        off += 16
        pkts.append(data[off:off+incl]); off += incl
    return linktype, pkts

def l2_to_ip(linktype, raw):
    if linktype == 1:   # Ethernet
        return raw[14:] if len(raw) >= 14 and raw[12:14] == b"\x08\x00" else None
    if linktype in (101, 12, 14):  # raw IP
        return raw
    if linktype == 113:  # Linux SLL
        return raw[16:]
    return raw

def ip_tcp(ip):
    if len(ip) < 20 or (ip[0] >> 4) != 4 or ip[9] != 6:
        return None
    ihl = (ip[0] & 0xF) * 4
    src = ".".join(map(str, ip[12:16])); dst = ".".join(map(str, ip[16:20]))
    tcp = ip[ihl:]
    if len(tcp) < 20:
        return None
    sport, dport = struct.unpack(">HH", tcp[0:4])
    seq = struct.unpack(">I", tcp[4:8])[0]
    doff = (tcp[12] >> 4) * 4
    return src, dst, sport, dport, seq, tcp[doff:]

def extrair(path):
    linktype, pkts = parse_pcap(path)
    # streams: (cip,cport,sip) -> {seq:payload} no sentido cliente->servidor
    streams = {}
    for raw in pkts:
        ip = l2_to_ip(linktype, raw)
        if not ip:
            continue
        t = ip_tcp(ip)
        if not t:
            continue
        src, dst, sport, dport, seq, payload = t
        if dport != PORT or not payload:
            continue
        key = (src, sport, dst)
        streams.setdefault(key, {})[seq] = payload

    melhor = None
    for (cip, cport, sip), segs in streams.items():
        blob = b"".join(segs[s] for s in sorted(segs))
        i = blob.find(b"XXEE")
        if i <= 0:
            continue
        token = blob[:i]
        # valida decodificando o base64 e checando a estrutura do token
        try:
            dec = base64.b64decode(token)
        except Exception:
            continue
        if b"aaaaaaaa" in dec and b":" in dec:
            if melhor is None or len(token) > len(melhor[2]):
                melhor = (sip, PORT, token)
    return melhor

def main():
    if len(sys.argv) > 1:
        caminho = sys.argv[1]
    else:
        caps = sorted(glob.glob("*.pcap") + glob.glob("*.pcapng"), key=os.path.getmtime)
        if not caps:
            raise SystemExit("Nenhum .pcap na pasta. Passe o caminho: python extrair_token.py CAP.pcap")
        caminho = caps[-1]
        print(f"[i] usando o pcap mais recente: {caminho}")

    r = extrair(caminho)
    if not r:
        raise SystemExit("[-] Não achei o handshake :6611 (token) neste pcap. "
                         "Capture enquanto abre uma câmera ao vivo no app.")
    sip, port, token = r
    # valida que decodifica em base64 com a estrutura esperada
    try:
        dec = base64.b64decode(token).decode("latin1")
        campos = dec.split(":")
        print(f"[+] Token encontrado ({len(campos)} campos): {dec[:60]}...")
    except Exception:
        print("[!] Token achado mas não decodificou como base64 (gravando mesmo assim).")

    with open("token6611.txt", "w", encoding="utf-8") as f:
        f.write(f"SERVER={sip}:{port}\n")
        f.write(f"TOKEN={token.decode('ascii')}\n")
    print(f"[+] Gravado token6611.txt  (servidor {sip}:{port}).")
    print("[+] Agora rode:  python teste2.py")

if __name__ == "__main__":
    main()
