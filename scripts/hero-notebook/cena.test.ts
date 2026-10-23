// @vitest-environment node
/**
 * A cena do hero com entrada pelo notebook (spec 2026-10-23, §6): o mundo da
 * mesa e o retângulo da tela do notebook que alimenta o
 * `ENTRADA.aparelho.deitado` (src/lib/heroEntrada.ts). O desenho em si
 * (Canvas2D) é conferido nas fotos; aqui fica a geometria, que roda no Node.
 */
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

type Vec = [number, number, number];
type Tela = {
  cx: number;
  cy: number;
  largura: number;
  altura: number;
  cantos: [number, number][];
};
type Cena = {
  BASE: Record<string, unknown> & {
    notebook?: unknown;
    laptop: { x: number; z: number };
    phone: { x: number; z: number };
    box: { x: number; z: number };
    mug: { x: number; z: number };
    lamp: { base: Vec };
  };
  CAMS: Record<string, { W: number; H: number; semAparelho?: boolean }>;
  telaDoNotebook: (cam: string) => Tela;
};

const PASTA = import.meta.dirname;
const require = createRequire(import.meta.url);
const cena = require("./scene.js") as Cena;

describe("cena do hero notebook", () => {
  it("o mundo não tem mais o caderno de papel e tem o notebook no centro da mesa", () => {
    expect(cena.BASE.notebook).toBeUndefined();
    expect(cena.BASE.laptop).toBeDefined();
    expect(Math.abs(cena.BASE.laptop.x)).toBeLessThanOrEqual(5);
  });

  it("celular e caixa do Replay de um lado, caneca do outro e o abajur na ponta", () => {
    const { laptop, phone, box, mug, lamp } = cena.BASE;
    const lado = Math.sign(phone.x - laptop.x);
    expect(lado).not.toBe(0);
    expect(Math.sign(box.x - laptop.x)).toBe(lado);
    expect(Math.sign(mug.x - laptop.x)).toBe(-lado);
    const maisLonge = Math.max(...[phone, box, mug].map((o) => Math.abs(o.x)));
    expect(Math.abs(lamp.base[0])).toBeGreaterThan(maisLonge);
  });

  it("a câmera media tira o notebook (semAparelho); o fundo largo o mostra", () => {
    expect(cena.CAMS.media?.semAparelho).toBe(true);
    expect(cena.CAMS.bg?.semAparelho).toBeFalsy();
  });

  it("a tela do notebook na mídia é um retângulo 16:10 de frente, no centro do quadro", () => {
    const t = cena.telaDoNotebook("media");
    expect(t.altura).toBeCloseTo((t.largura * 10) / 16, 0);
    // De frente para a câmera: os cantos formam um retângulo alinhado aos eixos.
    const xs = t.cantos.map((c) => c[0]);
    const ys = t.cantos.map((c) => c[1]);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    for (const [x, y] of t.cantos) {
      expect(Math.min(Math.abs(x - x0), Math.abs(x - x1))).toBeLessThan(0.5);
      expect(Math.min(Math.abs(y - y0), Math.abs(y - y1))).toBeLessThan(0.5);
    }
    expect(t.largura).toBeCloseTo(x1 - x0, 1);
    expect(t.cx).toBeCloseTo((x0 + x1) / 2, 1);
    expect(t.cy).toBeCloseTo((y0 + y1) / 2, 1);
    // Protagonista no centro, com espaço dos lados para as metades do título.
    expect(Math.abs(t.cx - 640)).toBeLessThanOrEqual(2);
    // O centro do título na pausa cai em y = 360 da mídia (16:9 e 16:10).
    expect(Math.abs(t.cy - 360)).toBeLessThanOrEqual(15);
    expect(t.largura).toBeGreaterThanOrEqual(260);
    expect(t.largura).toBeLessThanOrEqual(340);
  });

  it("o geo.js imprime o retângulo da tela em px da mídia 1280 × 720", () => {
    const saida = execFileSync(process.execPath, [join(PASTA, "geo.js"), "{}", "media"], { encoding: "utf8" });
    const geo = JSON.parse(saida) as { tela: Omit<Tela, "cantos"> };
    const t = cena.telaDoNotebook("media");
    expect(geo.tela.cx).toBeCloseTo(t.cx, 1);
    expect(geo.tela.cy).toBeCloseTo(t.cy, 1);
    expect(geo.tela.largura).toBeCloseTo(t.largura, 1);
    expect(geo.tela.altura).toBeCloseTo(t.altura, 1);
  });

  it("o pipeline não usa nada do hero-expansao em tempo de execução", () => {
    const fontes = readdirSync(PASTA).filter((f) => /\.(js|html|sh)$/.test(f));
    expect(fontes).toEqual(expect.arrayContaining(["scene.js", "geo.js", "bg.html", "media.html", "shot.sh", "stills.sh"]));
    for (const f of fontes) expect(readFileSync(join(PASTA, f), "utf8")).not.toMatch(/hero-expansao/);
  });
});
