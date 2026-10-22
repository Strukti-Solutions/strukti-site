// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readAvif } from "@/test/avif";
import { CATALOGO } from "./catalogo";

// Contrato de arquivos da spec (2026-10-16, §6.1): vale para os provisórios de
// hoje e para a arte final, que troca os arquivos com os mesmos nomes.
const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");
const LIMITE_LOOP = 600_000;
const onDisk = (url: string) => path.join(PUBLIC_DIR, url);

// Largura e altura do JPEG pelo primeiro marcador SOF (baseline ou progressivo).
function readJpeg(file: string) {
  const buf = readFileSync(file);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return { width: undefined, height: undefined };
  for (let offset = 2; offset + 9 < buf.length; ) {
    if (buf[offset] !== 0xff) return { width: undefined, height: undefined };
    const marker = buf[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  return { width: undefined, height: undefined };
}

const tamanhos = [
  { sufixo: "", width: 800, height: 1200, avif: 120_000, jpg: 200_000 },
  { sufixo: "-480", width: 480, height: 720, avif: 45_000, jpg: 70_000 },
] as const;

describe.each(CATALOGO.map((item) => [item.slug, item] as const))("arte de %s", (_slug, item) => {
  it.each(tamanhos)("cartão$sufixo: medidas e orçamento", ({ sufixo, width, height, avif, jpg }) => {
    const base = onDisk(`${item.arte.base}${sufixo}`);
    expect(readAvif(`${base}.avif`), "avif").toEqual({ signature: "ftypavif", width, height });
    expect(statSync(`${base}.avif`).size, "avif bytes").toBeLessThanOrEqual(avif);
    expect(readJpeg(`${base}.jpg`), "jpg").toEqual({ width, height });
    expect(statSync(`${base}.jpg`).size, "jpg bytes").toBeLessThanOrEqual(jpg);
  });

  it("tem as 3 telas", () => {
    for (const n of [1, 2, 3]) {
      expect(existsSync(onDisk(`/catalogo/${item.slug}/tela-${n}.svg`)), `tela-${n}.svg`).toBe(true);
    }
  });

  it("tem o loop se e só se declara `arte.loop`, dentro do orçamento", () => {
    for (const ext of ["webm", "mp4"] as const) {
      const arquivo = onDisk(`${item.arte.base}-loop.${ext}`);
      expect(existsSync(arquivo), `cartao-loop.${ext}`).toBe(Boolean(item.arte.loop));
      if (item.arte.loop) expect(statSync(arquivo).size, ext).toBeLessThanOrEqual(LIMITE_LOOP);
    }
  });
});
