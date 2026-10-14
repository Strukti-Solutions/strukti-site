# -*- coding: utf-8 -*-
"""Harness de RE para libFunSDK.so (AArch64). Lê a .so como DADO (nunca executa).
Uso: python refun.py <simbolo1> [simbolo2 ...]
     python refun.py --str 0x<vaddr>        # lê C-string nesse vaddr
     python refun.py --find NOME             # lista símbolos que casam
"""
import sys
from elftools.elf.elffile import ELFFile
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM, CS_OP_IMM, CS_OP_REG, CS_OP_MEM

SO = r"re_funsdk/libFunSDK.so"
f = open(SO, "rb")
elf = ELFFile(f)

# mapa de símbolos: nome -> (vaddr, size)
syms = {}
for sec in elf.iter_sections():
    if sec.name in (".dynsym", ".symtab"):
        for s in sec.iter_symbols():
            if s.name and s["st_value"]:
                syms.setdefault(s.name, (s["st_value"], s["st_size"]))

# seções para traduzir vaddr<->offset e ler bytes
SECTS = [(s["sh_addr"], s["sh_offset"], s["sh_size"], s.name)
         for s in elf.iter_sections() if s["sh_addr"]]

def read(va, n):
    for addr, off, size, _ in SECTS:
        if addr <= va < addr + size:
            f.seek(off + (va - addr))
            return f.read(min(n, addr + size - va))
    return b""

def cstr(va, maxn=200):
    b = read(va, maxn)
    i = b.find(b"\x00")
    return b[:i if i >= 0 else maxn]

md = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
md.detail = True

def disasm(name):
    if name not in syms:
        print(f"[!] símbolo não encontrado: {name}"); return
    va, size = syms[name]
    if not size:
        size = 0x400
    code = read(va, size)
    print(f"\n===== {name}  @0x{va:x}  ({size} bytes) =====")
    adrp = {}  # reg -> page addr
    for ins in md.disasm(code, va):
        line = f"  0x{ins.address:x}: {ins.mnemonic:7} {ins.op_str}"
        ann = ""
        try:
            if ins.mnemonic == "adrp" and len(ins.operands) == 2:
                adrp[ins.operands[0].reg] = ins.operands[1].imm
            elif ins.mnemonic == "add" and len(ins.operands) == 3 \
                    and ins.operands[2].type == CS_OP_IMM and ins.operands[1].reg in adrp:
                tgt = adrp[ins.operands[1].reg] + ins.operands[2].imm
                s = cstr(tgt, 80)
                ann = f"   -> 0x{tgt:x}" + (f'  str={s!r}' if s and all(32 <= c < 127 for c in s[:1]) else f'  bytes={read(tgt,16).hex()}')
                adrp[ins.operands[0].reg] = tgt
            elif ins.mnemonic in ("ldr",) and ins.operands[-1].type == CS_OP_MEM:
                m = ins.operands[-1].mem
                if m.base in adrp:
                    tgt = adrp[m.base] + m.disp
                    ann = f"   -> [0x{tgt:x}] = {read(tgt,8).hex()}"
            elif ins.mnemonic == "bl" and ins.operands and ins.operands[0].type == CS_OP_IMM:
                t = ins.operands[0].imm
                nm = next((n for n,(v,_) in syms.items() if v==t), None)
                if nm: ann = f"   -> {nm}"
        except Exception:
            pass
        print(line + ann)

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        print(__doc__)
    elif a[0] == "--str":
        print(cstr(int(a[1], 16)))
    elif a[0] == "--find":
        for n in sorted(syms):
            if a[1].lower() in n.lower():
                print(f"0x{syms[n][0]:x}  {syms[n][1]:6}  {n}")
    else:
        for nm in a:
            disasm(nm)
