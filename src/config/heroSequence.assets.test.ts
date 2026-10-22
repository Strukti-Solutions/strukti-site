// @vitest-environment node
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { siteConfig } from "./site";
import { readAvif } from "@/test/avif";
import { frameUrl, posterUrl, type FrameSetName } from "@/lib/heroSequence";

// Orçamento da spec (2026-10-03, §5.1): os quadros baixam depois da página,
// mas pesam no plano de dados de quem rola o hero.
const BUDGET_BYTES: Record<FrameSetName, number> = { desktop: 3_000_000, celular: 1_200_000 };
const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");
const onDisk = (url: string) => path.join(PUBLIC_DIR, url);

const readAvifUrl = (url: string) => readAvif(onDisk(url));

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
      expect(readAvifUrl(url), url).toEqual({ signature: "ftypavif", width, height });
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
