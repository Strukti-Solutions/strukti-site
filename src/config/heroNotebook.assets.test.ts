// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { siteConfig, type HeroNotebookQuadro } from "./site";
import { readAvif } from "@/test/avif";

/**
 * A mídia do hero "notebook" (fase 2 da arte, Global Constraints do plano
 * 2026-10-23-hero-notebook-arte): confere os arquivos que o
 * `siteConfig.heroNotebook` usa (e só eles: o vídeo chega depois), com o
 * tamanho e o limite de bytes de cada nome. Mídia só do próprio site
 * (ADR-008), de public/hero/notebook/.
 */

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");
const onDisk = (url: string) => path.join(PUBLIC_DIR, url);

/** Tamanho e limites (bytes, KB = 1000) de cada nome de arquivo, das Global Constraints. */
const LIMITES: Record<string, { w: number; h: number; imagem?: number; jpg?: number; webm?: number; mp4?: number }> = {
  fundo: { w: 1920, h: 1080, imagem: 100_000, jpg: 160_000 },
  "fundo-retrato": { w: 1080, h: 1920, imagem: 100_000, jpg: 160_000 },
  "midia-poster": { w: 1280, h: 720, imagem: 60_000, jpg: 90_000 },
  midia: { w: 1280, h: 720, webm: 420_000, mp4: 520_000 },
  "midia-retrato-poster": { w: 720, h: 1280, imagem: 60_000, jpg: 90_000 },
  "midia-retrato": { w: 720, h: 1280, webm: 420_000, mp4: 520_000 },
};

/** Largura e altura do 1º SOF (baseline ou progressivo) de um JPEG. */
function readJpeg(file: string) {
  const buf = readFileSync(file);
  const signature = buf.readUInt16BE(0) === 0xffd8;
  for (let i = 2; i + 9 < buf.length; ) {
    if (buf[i] !== 0xff) return { signature, width: undefined, height: undefined };
    const marker = buf[i + 1]!;
    const size = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { signature, width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + size;
  }
  return { signature, width: undefined, height: undefined };
}

const nome = (url: string) => path.basename(url).replace(/\.[^.]+$/, "");

const { heroNotebook } = siteConfig;
const quadros: [string, HeroNotebookQuadro][] = [
  ["fundo.deitado", heroNotebook.fundo.deitado],
  ["fundo.retrato", heroNotebook.fundo.retrato],
  ["midia", heroNotebook.midia],
  ["midiaRetrato", heroNotebook.midiaRetrato],
];

describe.each(quadros)("siteConfig.heroNotebook.%s", (_campo, quadro) => {
  const limite = LIMITES[nome(quadro.posterAvif)];

  it("tem nomes fixos da tabela, servidos de /hero/ (do próprio site)", () => {
    expect(limite, quadro.posterAvif).toBeDefined();
    for (const url of [quadro.posterAvif, quadro.posterJpg, quadro.webm, quadro.mp4]) {
      if (url === undefined) continue;
      expect(url).toMatch(/^\/hero\/notebook\/[a-z-]+\.(avif|jpg|webm|mp4)$/);
    }
    expect(nome(quadro.posterJpg)).toBe(nome(quadro.posterAvif));
    expect({ w: quadro.width, h: quadro.height }).toEqual({ w: limite?.w, h: limite?.h });
  });

  it("o pôster em AVIF e em JPG existe, com a largura e a altura da configuração e dentro do limite", () => {
    const avif = onDisk(quadro.posterAvif);
    const jpg = onDisk(quadro.posterJpg);
    expect(existsSync(avif), quadro.posterAvif).toBe(true);
    expect(existsSync(jpg), quadro.posterJpg).toBe(true);
    expect(readAvif(avif)).toEqual({ signature: "ftypavif", width: quadro.width, height: quadro.height });
    expect(readJpeg(jpg)).toEqual({ signature: true, width: quadro.width, height: quadro.height });
    const bytesAvif = statSync(avif).size;
    const bytesJpg = statSync(jpg).size;
    expect(bytesAvif, `${quadro.posterAvif}: ${bytesAvif} bytes`).toBeGreaterThan(0);
    expect(bytesAvif, `${quadro.posterAvif}: ${bytesAvif} bytes`).toBeLessThanOrEqual(limite!.imagem!);
    expect(bytesJpg, `${quadro.posterJpg}: ${bytesJpg} bytes`).toBeGreaterThan(0);
    expect(bytesJpg, `${quadro.posterJpg}: ${bytesJpg} bytes`).toBeLessThanOrEqual(limite!.jpg!);
  });

  it("o vídeo, quando há, existe e cabe no limite do clipe do mesmo nome", () => {
    for (const [tipo, url] of [
      ["webm", quadro.webm],
      ["mp4", quadro.mp4],
    ] as const) {
      if (url === undefined) continue;
      const clipe = LIMITES[nome(url)];
      expect(clipe?.[tipo], url).toBeDefined();
      expect({ w: clipe?.w, h: clipe?.h }).toEqual({ w: quadro.width, h: quadro.height });
      expect(existsSync(onDisk(url)), url).toBe(true);
      const bytes = statSync(onDisk(url)).size;
      expect(bytes, `${url}: ${bytes} bytes`).toBeGreaterThan(0);
      expect(bytes, `${url}: ${bytes} bytes`).toBeLessThanOrEqual(clipe![tipo]!);
    }
  });
});

describe("siteConfig.heroNotebook: a cena em pé", () => {
  it("o fundo e a mídia em pé são os do notebook, com a mídia própria de 720 × 1280 (não a deitada)", () => {
    expect(heroNotebook.fundo.retrato).toMatchObject({
      posterAvif: "/hero/notebook/fundo-retrato.avif",
      posterJpg: "/hero/notebook/fundo-retrato.jpg",
      width: 1080,
      height: 1920,
    });
    expect(heroNotebook.midiaRetrato).toMatchObject({
      posterAvif: "/hero/notebook/midia-retrato-poster.avif",
      posterJpg: "/hero/notebook/midia-retrato-poster.jpg",
      width: 720,
      height: 1280,
    });
    expect(heroNotebook.midiaRetrato).not.toBe(heroNotebook.midia);
  });
});

describe("siteConfig.heroNotebook: o loop de 10 s (N5)", () => {
  it.each([
    ["midia", heroNotebook.midia, "midia"],
    ["midiaRetrato", heroNotebook.midiaRetrato, "midia-retrato"],
  ] as const)("%s tem o loop em WebM e MP4, com o nome do pôster do mesmo enquadramento", (_campo, quadro, base) => {
    expect(quadro.webm).toBe(`/hero/notebook/${base}.webm`);
    expect(quadro.mp4).toBe(`/hero/notebook/${base}.mp4`);
    expect(quadro.posterAvif).toBe(`/hero/notebook/${base}-poster.avif`);
  });

  it("o fundo não tem vídeo (ele nunca é ampliado: só a imagem parada)", () => {
    for (const fundo of [heroNotebook.fundo.deitado, heroNotebook.fundo.retrato]) {
      expect(fundo.webm).toBeUndefined();
      expect(fundo.mp4).toBeUndefined();
    }
  });
});

describe("siteConfig.heroNotebook: a cena deitada", () => {
  it("o fundo e a mídia deitados são os do notebook (public/hero/notebook/)", () => {
    expect(heroNotebook.fundo.deitado.posterAvif).toBe("/hero/notebook/fundo.avif");
    expect(heroNotebook.midia.posterAvif).toBe("/hero/notebook/midia-poster.avif");
  });

  it("o hero expansao de produção segue com a mídia dele", () => {
    expect(siteConfig.heroExpansao.midia.posterAvif).toBe("/hero/expansao/midia-poster.avif");
    expect(siteConfig.heroExpansao.fundo.avif).toBe("/hero/expansao/fundo.avif");
  });
});
