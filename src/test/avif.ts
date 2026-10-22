// Leitura mínima de AVIF para os testes de contrato de mídia (hero e catálogo).
import { readFileSync } from "node:fs";

// Caixa ISOBMFF: [tamanho u32][tipo, 4 letras][conteúdo]. Desce pelo caminho
// de tipos e devolve o conteúdo da última caixa. O "meta" é FullBox (4 bytes de
// versão e flags antes das filhas). Caixa de tamanho 0 ou 1 (até o fim do
// arquivo, ou 64 bits) encerra a busca; o AVIF do ffmpeg só a usa no mdat, que
// vem depois do meta.
export function findBox(file: Buffer, types: string[], start = 0, end = file.length): Buffer | undefined {
  for (let offset = start; offset + 8 <= end; ) {
    const size = file.readUInt32BE(offset);
    if (size < 8 || offset + size > end) return undefined;
    if (file.toString("latin1", offset + 4, offset + 8) === types[0]) {
      const body = offset + 8 + (types[0] === "meta" ? 4 : 0);
      if (types.length === 1) return file.subarray(body, offset + size);
      return findBox(file, types.slice(1), body, offset + size);
    }
    offset += size;
  }
  return undefined;
}

// Assinatura ("ftyp" com a marca principal "avif") e largura x altura do "ispe"
// (FullBox: versão/flags, depois largura e altura em u32).
export function readAvif(path: string) {
  const file = readFileSync(path);
  const ispe = findBox(file, ["meta", "iprp", "ipco", "ispe"]);
  return {
    signature: file.toString("latin1", 4, 12),
    width: ispe?.readUInt32BE(4),
    height: ispe?.readUInt32BE(8),
  };
}
