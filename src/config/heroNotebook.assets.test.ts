// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { siteConfig, type HeroNotebookQuadro } from "./site";
import { readAvif } from "@/test/avif";

/**
 * A mídia do hero "notebook" (fase 2 da arte, Global Constraints do plano
 * 2026-10-23-hero-notebook-arte): confere os arquivos que o
 * `siteConfig.heroNotebook` usa (inclusive os loops de 10 s, WebM e MP4),
 * com o tamanho e o limite de bytes de cada nome. Mídia só do próprio site
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

/** Os boxes filhos de `buf[ini, fim)` (ISO BMFF): tipo e [início do corpo, fim). */
function boxes(buf: Buffer, ini: number, fim: number) {
  const lista: { tipo: string; corpo: number; fim: number }[] = [];
  for (let i = ini; i + 8 <= fim; ) {
    let tamanho = buf.readUInt32BE(i);
    let cabeca = 8;
    if (tamanho === 1) {
      tamanho = Number(buf.readBigUInt64BE(i + 8));
      cabeca = 16;
    } else if (tamanho === 0) tamanho = fim - i;
    if (tamanho < cabeca) break;
    lista.push({ tipo: buf.toString("latin1", i + 4, i + 8), corpo: i + cabeca, fim: Math.min(fim, i + tamanho) });
    i += tamanho;
  }
  return lista;
}

/** Largura e altura (16.16 fixo, nos últimos 8 bytes do `tkhd`) e duração em segundos (`mvhd`) de um MP4. */
function readMp4(file: string) {
  const buf = readFileSync(file);
  const moov = boxes(buf, 0, buf.length).find((b) => b.tipo === "moov")!;
  const filhos = boxes(buf, moov.corpo, moov.fim);
  const mvhd = filhos.find((b) => b.tipo === "mvhd")!;
  const v1 = buf[mvhd.corpo] === 1;
  const timescale = buf.readUInt32BE(mvhd.corpo + (v1 ? 20 : 12));
  const duracao = v1 ? Number(buf.readBigUInt64BE(mvhd.corpo + 24)) : buf.readUInt32BE(mvhd.corpo + 16);
  const trilhas = filhos
    .filter((b) => b.tipo === "trak")
    .map((trak) => boxes(buf, trak.corpo, trak.fim).find((b) => b.tipo === "tkhd")!)
    .map((tkhd) => ({ width: buf.readUInt32BE(tkhd.fim - 8) / 65536, height: buf.readUInt32BE(tkhd.fim - 4) / 65536 }))
    .filter((t) => t.width > 0 && t.height > 0);
  return { ...trilhas[0]!, segundos: duracao / timescale };
}

/** Largura e altura (`PixelWidth` 0xB0 e `PixelHeight` 0xBA) da faixa de vídeo de um WebM (EBML). */
function readWebm(file: string) {
  const buf = readFileSync(file);
  const MASTERS = new Set([0x18538067, 0x1654ae6b, 0xae, 0xe0]); // Segment, Tracks, TrackEntry, Video
  const achados: Record<number, number> = {};
  function varint(i: number, mantemMarca: boolean) {
    const b = buf[i]!;
    let len = 1;
    while (len <= 8 && !(b & (0x80 >> (len - 1)))) len++;
    let valor = mantemMarca ? b : b & (0xff >> len);
    for (let k = 1; k < len; k++) valor = valor * 256 + buf[i + k]!;
    return { valor, len };
  }
  function percorre(ini: number, fim: number) {
    for (let i = ini; i < fim; ) {
      const id = varint(i, true);
      const tam = varint(i + id.len, false);
      const corpo = i + id.len + tam.len;
      const desconhecido = tam.valor === 2 ** (7 * tam.len) - 1;
      const topo = desconhecido ? fim : Math.min(fim, corpo + tam.valor);
      if (MASTERS.has(id.valor)) percorre(corpo, topo);
      else if (id.valor === 0xb0 || id.valor === 0xba) {
        let n = 0;
        for (let k = corpo; k < topo; k++) n = n * 256 + buf[k]!;
        achados[id.valor] = n;
      }
      i = topo;
    }
  }
  percorre(0, buf.length);
  return { width: achados[0xb0], height: achados[0xba] };
}

describe("siteConfig.heroNotebook: os vídeos publicados (lidos do próprio arquivo)", () => {
  it.each([
    ["midia", heroNotebook.midia],
    ["midiaRetrato", heroNotebook.midiaRetrato],
  ] as const)("os vídeos publicados têm o tamanho do config e 10 s (%s)", (_campo, quadro) => {
    const esperado = { width: quadro.width, height: quadro.height };
    const mp4 = readMp4(onDisk(quadro.mp4!));
    expect({ width: mp4.width, height: mp4.height }).toEqual(esperado);
    expect(mp4.segundos).toBeGreaterThanOrEqual(9.9);
    expect(mp4.segundos).toBeLessThanOrEqual(10.1);
    expect(readWebm(onDisk(quadro.webm!))).toEqual(esperado);
  });
});
