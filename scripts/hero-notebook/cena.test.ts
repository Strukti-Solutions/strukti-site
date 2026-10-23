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
type Bloco = { x: number; z: number; rot: number; w: number; d: number; h: number };
type Caneca = { x: number; z: number; r: number; h: number };
type Mundo = {
  laptop: { x: number; z: number; w: number; d: number; h: number };
  phone: Bloco;
  box: Bloco;
  mug: Caneca;
  desk: { z0: number };
  win: { y0: number };
  wallZ: number;
};
type Camera = { P: (p: Vec) => Vec };
type Cena = {
  BASE: Record<string, unknown> & {
    notebook?: unknown;
    laptop: { x: number; z: number };
    phone: { x: number; z: number };
    box: { x: number; z: number };
    mug: { x: number; z: number };
    lamp: { base: Vec };
  };
  CAMS: Record<string, { W: number; H: number; semAparelho?: boolean; peitoril?: unknown }>;
  telaDoNotebook: (cam: string) => Tela;
  prepWorld: (o: object) => Mundo;
  makeCam: (o: object) => Camera;
  frameOf: (o: { x: number; z: number; rot: number }) => (u: number, h: number, v: number) => Vec;
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

  describe("composição na mídia e no fundo largo (ajuste de arte 1)", () => {
    // Caixas em px do quadro, a partir do mundo e da câmera de cada foto.
    const quadro = (which: "media" | "bg") => {
      const o = { ...cena.CAMS[which] } as Record<string, unknown> & { world?: Record<string, unknown> };
      const w = cena.prepWorld(o);
      const cam = cena.makeCam(o);
      const caixa = (pts: Vec[]) => {
        const q = pts.map((p) => cam.P(p));
        const xs = q.map((p) => p[0]);
        const ys = q.map((p) => p[1]);
        return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
      };
      const bloco = (ob: Bloco, h: number) => {
        const fr = cena.frameOf(ob);
        const pts: Vec[] = [];
        for (const u of [-ob.w / 2, ob.w / 2]) for (const v of [-ob.d / 2, ob.d / 2]) for (const hh of [0, h]) pts.push(fr(u, hh, v));
        return pts;
      };
      const aro = (m: Caneca, h: number) =>
        Array.from({ length: 32 }, (_, i): Vec => {
          const a = (i / 32) * Math.PI * 2;
          return [m.x + m.r * Math.cos(a), h, m.z + m.r * Math.sin(a)];
        });
      return { w, cam, caixa, bloco, aro };
    };

    it("a caixa do Replay e o celular ficam dentro do corte 4:3 deitado e abaixo da linha 1 do título", () => {
      const { w, caixa, bloco } = quadro("media");
      const box = caixa(bloco(w.box, w.box.h));
      const cel = caixa(bloco(w.phone, w.phone.h));
      // A 1024 × 768 o cover corta 160 px da mídia de cada lado.
      expect(box.x0).toBeGreaterThanOrEqual(185);
      expect(cel.x0).toBeGreaterThanOrEqual(175);
      // A faixa da linha 1 vai até y 354 da mídia: o topo da caixa (e o LED) fica abaixo de 365.
      expect(box.y0).toBeGreaterThanOrEqual(365);
      // Nada encosta no notebook (a base começa em x 436).
      expect(Math.max(box.x1, cel.x1)).toBeLessThanOrEqual(425);
    });

    it("a boca da caneca fica abaixo da faixa da linha 2 do título", () => {
      const { w, caixa, aro } = quadro("media");
      const boca = caixa(aro(w.mug, w.mug.h));
      expect(boca.y0).toBeGreaterThanOrEqual(425);
      // E a caneca inteira, com a alça (a −40°, ~3,2 cm além da parede), cabe no corte 4:3 (até x 1120 da mídia).
      const m = w.mug;
      const alca: Vec = [m.x + 0.766 * (m.r + 3.2), m.h * 0.56, m.z - 0.643 * (m.r + 3.2)];
      expect(caixa([...aro(m, 0), alca]).x1).toBeLessThanOrEqual(1100);
    });

    it("o fundo largo: o notebook cabe no cartão de 300 px até 2560 px de janela e a quina da mesa aparece no pé", () => {
      const { w, cam } = quadro("bg");
      const L = w.laptop;
      const fr = cena.frameOf({ x: L.x, z: L.z, rot: 0 });
      const esq = cam.P(fr(-L.w / 2, L.h, -L.d / 2));
      const dir = cam.P(fr(L.w / 2, L.h, -L.d / 2));
      expect(dir[0] - esq[0]).toBeLessThanOrEqual(220);
      const quina = cam.P([0, 0, w.desk.z0])[1];
      expect(quina).toBeGreaterThanOrEqual(960);
      expect(quina).toBeLessThanOrEqual(1000);
    });

    it("a boca da caneca no fundo largo sai da linha do peitoril", () => {
      const { w, cam, caixa, aro } = quadro("bg");
      const peitoril = cam.P([0, w.win.y0, w.wallZ])[1];
      expect(caixa(aro(w.mug, w.mug.h)).y0 - peitoril).toBeGreaterThanOrEqual(8);
    });

    it("na mídia o peitoril escurece à direita da tela (a faixa da linha 2 fica sobre uma superfície só)", () => {
      const p = cena.CAMS.media?.peitoril as [number, number, number] | undefined;
      expect(p).toBeDefined();
      const [u0, u1, a] = p!;
      const t = cena.telaDoNotebook("media");
      // A rampa fica escondida atrás da tela do notebook (vetor por cima); daí para a direita, escuro.
      expect(u0 * 1280).toBeGreaterThanOrEqual(t.cx - t.largura / 2);
      expect(u1 * 1280).toBeLessThanOrEqual(t.cx + t.largura / 2);
      expect(a).toBeGreaterThan(0.4);
    });
  });

  it("o pipeline não usa nada do hero-expansao em tempo de execução", () => {
    const fontes = readdirSync(PASTA).filter((f) => /\.(js|html|sh)$/.test(f));
    expect(fontes).toEqual(expect.arrayContaining(["scene.js", "geo.js", "bg.html", "media.html", "shot.sh", "stills.sh"]));
    for (const f of fontes) expect(readFileSync(join(PASTA, f), "utf8")).not.toMatch(/hero-expansao/);
  });
});
