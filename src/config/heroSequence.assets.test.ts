// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { siteConfig } from "./site";
import { frameUrl, posterUrl, type FrameSetName } from "@/lib/heroSequence";

// Orçamento da spec (2026-10-03, §5.1): os quadros baixam depois da página,
// mas pesam no plano de dados de quem rola o hero.
const BUDGET_BYTES: Record<FrameSetName, number> = { desktop: 3_000_000, celular: 1_200_000 };
const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");
const onDisk = (url: string) => path.join(PUBLIC_DIR, url);

// Caixa ISOBMFF: [tamanho u32][tipo, 4 letras][conteúdo]. Desce pelo caminho
// de tipos e devolve o conteúdo da última caixa. O "meta" é FullBox (4 bytes de
// versão e flags antes das filhas). Caixa de tamanho 0 ou 1 (até o fim do
// arquivo, ou 64 bits) encerra a busca; o AVIF do ffmpeg só a usa no mdat, que
// vem depois do meta.
function findBox(file: Buffer, types: string[], start = 0, end = file.length): Buffer | undefined {
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
function readAvif(url: string) {
  const file = readFileSync(onDisk(url));
  const ispe = findBox(file, ["meta", "iprp", "ipco", "ispe"]);
  return {
    signature: file.toString("latin1", 4, 12),
    width: ispe?.readUInt32BE(4),
    height: ispe?.readUInt32BE(8),
  };
}

describe.each(["desktop", "celular"] as const)("quadros do hero (%s)", (set) => {
  const { frames, width, height } = siteConfig.heroSequence[set];

  it("tem exatamente os quadros da configuração", () => {
    for (let index = 0; index < frames; index++) {
      expect(existsSync(onDisk(frameUrl(set, index))), frameUrl(set, index)).toBe(true);
    }
    expect(existsSync(onDisk(frameUrl(set, frames))), "quadro a mais na pasta").toBe(false);
  });

  it("cada quadro e o pôster são AVIF não vazios, com a largura e a altura da configuração", () => {
    const urls = [...Array.from({ length: frames }, (_, index) => frameUrl(set, index)), posterUrl(set, "avif")];
    for (const url of urls) {
      expect(statSync(onDisk(url)).size, `${url} vazio`).toBeGreaterThan(0);
      expect(readAvif(url), url).toEqual({ signature: "ftypavif", width, height });
    }
  });

  it("cabe no orçamento", () => {
    let total = 0;
    for (let index = 0; index < frames; index++) total += statSync(onDisk(frameUrl(set, index))).size;
    expect(total, `${set}: ${total} bytes`).toBeLessThanOrEqual(BUDGET_BYTES[set]);
  });

  it("tem o pôster em AVIF e JPG", () => {
    expect(existsSync(onDisk(posterUrl(set, "avif")))).toBe(true);
    expect(existsSync(onDisk(posterUrl(set, "jpg")))).toBe(true);
    expect(statSync(onDisk(posterUrl(set, "jpg"))).size, "poster.jpg vazio").toBeGreaterThan(0);
  });
});
