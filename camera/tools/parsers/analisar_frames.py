"""
analisar_frames.py — diagnóstico: mostra a estrutura REAL dos cabeçalhos de
quadro Xiongmai no 'camera_local.raw' (gerado pelo cliente_local.py), pra
confirmar o de-wrap (ex.: tamanho do cabeçalho do quadro-I FC).

  python analisar_frames.py            # usa camera_local.raw
  python analisar_frames.py arquivo.raw
"""
import sys, collections

path = sys.argv[1] if len(sys.argv) > 1 else "camera_local.raw"
data = open(path, "rb").read()
n = len(data)
print(f"arquivo={path}  {n} bytes")

def is_marker(b, i):
    return i + 4 <= len(b) and b[i] == 0 and b[i+1] == 0 and b[i+2] == 1 and 0xF8 <= b[i+3] <= 0xFE

# lista todos os marcadores
marks = [(i, data[i+3]) for i in range(n-3) if is_marker(data, i)]
tipos = collections.Counter(m[1] for m in marks)
print("marcadores XM:", {hex(k): v for k, v in sorted(tipos.items())})

print("\nprimeiros 20 marcadores (tipo @offset | 16 bytes | offset do 1º 00000001 no segmento):")
for k in range(min(20, len(marks))):
    off, t = marks[k]
    nxt = marks[k+1][0] if k+1 < len(marks) else n
    seg = data[off+4:nxt]
    sc4 = seg.find(b"\x00\x00\x00\x01")
    print(f"  0x{t:02X} @{off:7d}  hdr={data[off:off+16].hex()}  seg_len={len(seg)}  start_code_4b_em=+{sc4}")
