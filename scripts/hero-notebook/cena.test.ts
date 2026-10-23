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
import { ENTRADA } from "../../src/lib/heroEntrada";

type Vec = [number, number, number];
type Tela = {
  cx: number;
  cy: number;
  largura: number;
  altura: number;
  cantos: [number, number][];
};
type Bloco = { x: number; z: number; rot: number; w: number; d: number; h: number };
type Caneca = { x: number; z: number; r: number; h: number; alca: number };
type Mundo = {
  laptop: { x: number; z: number; w: number; d: number; h: number };
  phone: Bloco;
  box: Bloco;
  mug: Caneca;
  desk: { z0: number };
  win: { y0: number };
  wallZ: number;
};
type MundoEmPe = Omit<Mundo, "phone"> & {
  laptop: Mundo["laptop"];
  phone: null;
  celular: { x: number; z: number; tilt: number };
};
type Camera = { P: (p: Vec) => Vec };
type Cena = {
  BASE: Record<string, unknown> & {
    notebook?: unknown;
    laptop: { x: number; z: number; tilt: number };
    phone: { x: number; z: number };
    box: { x: number; z: number };
    mug: { x: number; z: number };
    lamp: { base: Vec };
  };
  CAMS: Record<
    string,
    {
      W: number;
      H: number;
      semAparelho?: boolean;
      aparelho?: string;
      desfoque?: unknown;
      peitoril?: unknown;
      sombraMax?: number;
      world?: Record<string, unknown>;
      vazio?: { cresce: number; transicao: number; contato: boolean };
    }
  >;
  corDaMesa: (p: Vec) => Vec;
  discosDaCidade: (cam: Camera, o: object) => { p: [number, number]; r: number; torre: boolean; coluna: string }[];
  brilhoDaTela: (L: { x: number; z: number; w: number; d: number }) => { centro: Vec; semiZ: number };
  brilhoDoCelular: (c: object) => { centro: Vec; semiX: number; semiZ: number; a: number };
  coresDoMontante: (o: object) => { frente: Vec; lado: Vec; quina: [Vec, number] };
  shadowPt: (L: Vec, p: Vec, maxK?: number) => Vec;
  telaDoNotebook: (cam: string) => Tela;
  telaDoCelular: (cam: string) => Tela;
  laptopGeo: (L: object) => { lidH: number; at: (u: number, v: number, off?: number) => Vec };
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

  it("o ENTRADA.aparelho.deitado do site é o retângulo da tela na mídia (com 0,1 px)", () => {
    const t = cena.telaDoNotebook("media");
    const { deitado } = ENTRADA.aparelho;
    expect(Math.abs(deitado.cx - t.cx)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(deitado.cy - t.cy)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(deitado.largura - t.largura)).toBeLessThanOrEqual(0.1);
    expect(ENTRADA.midia.deitado).toMatchObject({ w: cena.CAMS.media?.W, h: cena.CAMS.media?.H });
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
      const a = (m.alca * Math.PI) / 180;
      const alca: Vec = [m.x + Math.cos(a) * (m.r + 3.2), m.h * 0.56, m.z + Math.sin(a) * (m.r + 3.2)];
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

  describe("o cartão em P = 0 e uma disposição só (ajuste de arte 2)", () => {
    // O cartão de 300 × 400 (quadroInicial) cobre a mídia 1280 × 720 com cover 50% 100%: o recorte é x 369–911.
    const RECORTE = (() => {
      const m = Math.max(300 / 1280, 400 / 720);
      const x0 = (1280 * m - 300) / 2 / m;
      return { x0, x1: x0 + 300 / m };
    })();
    // No fundo largo (cover 50% 85%), a faixa coberta pelo cartão, de 1024 × 768 a 2560 × 1440.
    const JANELAS: [number, number][] = [[1024, 768], [1180, 820], [1366, 768], [1440, 900], [2560, 1440], [2560, 1080]];
    const noFundo = JANELAS.map(([w, h]) => {
      const m = Math.max(w / 1920, h / 1080);
      const ox = (w - 1920 * m) * 0.5;
      return { x0: (w / 2 - 150 - ox) / m, x1: (w / 2 + 150 - ox) / m };
    });
    const px = (which: "media" | "bg") => {
      const o = { ...cena.CAMS[which] } as Record<string, unknown>;
      const w = cena.prepWorld(o);
      const cam = cena.makeCam(o);
      const caixa = (pts: Vec[]) => {
        const q = pts.map((p) => cam.P(p));
        const xs = q.map((p) => p[0]);
        const ys = q.map((p) => p[1]);
        return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
      };
      const bloco = (ob: Bloco) => {
        const fr = cena.frameOf(ob);
        const pts: Vec[] = [];
        for (const u of [-ob.w / 2, ob.w / 2]) for (const v of [-ob.d / 2, ob.d / 2]) for (const hh of [0, ob.h]) pts.push(fr(u, hh, v));
        return caixa(pts);
      };
      const m = w.mug;
      const aro = (h: number) =>
        Array.from({ length: 32 }, (_, i): Vec => {
          const a = (i / 32) * Math.PI * 2;
          return [m.x + m.r * Math.cos(a), h, m.z + m.r * Math.sin(a)];
        });
      const a = (m.alca * Math.PI) / 180;
      const alca: Vec = [m.x + Math.cos(a) * (m.r + 3.2), m.h * 0.56, m.z + Math.sin(a) * (m.r + 3.2)];
      return { w, cam, box: bloco(w.box), phone: bloco(w.phone), mug: caixa([...aro(0), ...aro(m.h), alca]) };
    };

    it("na mídia, celular e caixa ficam fora do recorte do cartão, com folga de 39 px, e dentro do corte 4:3", () => {
      const { box, phone } = px("media");
      expect(RECORTE.x0).toBeCloseTo(370, 0);
      expect(Math.max(box.x1, phone.x1)).toBeLessThanOrEqual(RECORTE.x0 - 39);
      expect(box.x0).toBeGreaterThanOrEqual(185);
      expect(phone.x0).toBeGreaterThanOrEqual(175);
      expect(box.y0).toBeGreaterThanOrEqual(365);
    });

    it("na mídia, a caneca começa depois do recorte do cartão, com folga de 39 px", () => {
      const { mug } = px("media");
      expect(mug.x0).toBeGreaterThanOrEqual(RECORTE.x1 + 39);
      expect(mug.x1).toBeLessThanOrEqual(1100);
    });

    it("uma disposição só: o fundo largo não muda a posição de celular, caixa e caneca", () => {
      const bgWorld = cena.CAMS.bg?.world ?? {};
      for (const k of ["phone", "box", "mug"]) expect(bgWorld[k]).toBeUndefined();
      const { phone, box } = cena.BASE;
      // A caixa atrás, o celular à frente dela.
      expect(phone.z).toBeLessThan(box.z);
      // Nas duas câmeras, o celular fica logo à frente (abaixo) da caixa, na mesma coluna.
      for (const which of ["media", "bg"] as const) {
        const c = px(which);
        expect(c.phone.y1).toBeGreaterThan(c.box.y1);
        const sobreposto = Math.min(c.phone.x1, c.box.x1) - Math.max(c.phone.x0, c.box.x0);
        expect(sobreposto / Math.min(c.phone.x1 - c.phone.x0, c.box.x1 - c.box.x0)).toBeGreaterThanOrEqual(0.8);
      }
    });

    it("no fundo largo, os objetos ficam fora do cartão em P = 0 (de 1024 × 768 a 2560 × 1440)", () => {
      const { box, phone, mug } = px("bg");
      const esq = Math.min(...noFundo.map((f) => f.x0));
      const dir = Math.max(...noFundo.map((f) => f.x1));
      // A borda do cartão a 1024 × 768 cai em x 749 do fundo: até 1 px de toque.
      expect(Math.max(box.x1, phone.x1)).toBeLessThanOrEqual(esq + 1);
      expect(mug.x0).toBeGreaterThanOrEqual(dir);
    });

    it("no fundo largo, a sombra do abajur é curta: a da caneca não passa de 1,5 × a largura dela", () => {
      const k = cena.CAMS.bg?.sombraMax;
      expect(k).toBeDefined();
      const o = { ...cena.CAMS.bg } as Record<string, unknown>;
      const w = cena.prepWorld(o) as Mundo & { lamp: { bulb: Vec } };
      const m = w.mug;
      const s = cena.shadowPt(w.lamp.bulb, [m.x + m.r, m.h, m.z], k);
      expect(Math.hypot(s[0] - (m.x + m.r), s[2] - m.z)).toBeLessThanOrEqual(1.5 * 2 * m.r);
    });

    it("o brilho da tela na mesa morre antes de y 680 da mídia", () => {
      const o = { ...cena.CAMS.media } as Record<string, unknown>;
      const w = cena.prepWorld(o);
      const cam = cena.makeCam(o);
      const b = cena.brilhoDaTela(w.laptop);
      expect(cam.P([b.centro[0], 0, b.centro[2] - b.semiZ])[1]).toBeLessThanOrEqual(680);
    });
  });

  describe("a cena em pé (N3): o celular num suporte, na frente e no centro", () => {
    const EM_PE = { w: 390, h: 844 };
    const quadroEmPe = (which: "mediaRetrato" | "portrait") => {
      const o = { ...cena.CAMS[which] } as Record<string, unknown>;
      const w = cena.prepWorld(o) as unknown as MundoEmPe;
      const cam = cena.makeCam(o);
      const caixa = (pts: Vec[]) => {
        const q = pts.map((p) => cam.P(p));
        const xs = q.map((p) => p[0]);
        const ys = q.map((p) => p[1]);
        return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
      };
      return { w, cam, caixa };
    };

    it("duas câmeras novas: a mídia em pé 720 × 1280 sem o celular e o fundo em pé 1080 × 1920 com ele", () => {
      expect(cena.CAMS.mediaRetrato).toMatchObject({ W: 720, H: 1280, semAparelho: true, aparelho: "celular" });
      expect(cena.CAMS.portrait).toMatchObject({ W: 1080, H: 1920, aparelho: "celular" });
      expect(cena.CAMS.portrait?.semAparelho).toBeFalsy();
    });

    it("o mesmo mundo: o notebook fica onde está, o celular sai da mesa e fica de pé à frente dele, no x da câmera", () => {
      for (const which of ["mediaRetrato", "portrait"] as const) {
        const { w } = quadroEmPe(which);
        expect(w.laptop).toMatchObject({ x: cena.BASE.laptop.x, z: cena.BASE.laptop.z });
        expect(w.phone).toBeNull();
        expect(w.celular).toBeDefined();
        expect(w.celular.z).toBeLessThan(w.laptop.z - w.laptop.d / 2);
        expect(w.celular.tilt).toBeCloseTo(cena.BASE.laptop.tilt, 6);
      }
    });

    it("a tela do celular na mídia em pé é um retângulo de frente, na proporção de 390 × 844, no centro do quadro", () => {
      const t = cena.telaDoCelular("mediaRetrato");
      expect(t.altura / t.largura).toBeCloseTo(EM_PE.h / EM_PE.w, 2);
      const xs = t.cantos.map((c) => c[0]);
      const ys = t.cantos.map((c) => c[1]);
      const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
      const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
      for (const [x, y] of t.cantos) {
        expect(Math.min(Math.abs(x - x0), Math.abs(x - x1))).toBeLessThan(0.5);
        expect(Math.min(Math.abs(y - y0), Math.abs(y - y1))).toBeLessThan(0.5);
      }
      expect(Math.abs(t.cx - 360)).toBeLessThanOrEqual(2);
      // O centro do título na pausa cai no meio da altura da mídia (o cover em pé enche a altura).
      expect(Math.abs(t.cy - 640)).toBeLessThanOrEqual(15);
      expect(t.largura).toBeGreaterThanOrEqual(160);
      expect(t.largura).toBeLessThanOrEqual(230);
    });

    it("o geo.js imprime o retângulo da tela do celular em px da mídia 720 × 1280", () => {
      const saida = execFileSync(process.execPath, [join(PASTA, "geo.js"), "{}", "mediaRetrato"], { encoding: "utf8" });
      const geo = JSON.parse(saida) as { tela: Omit<Tela, "cantos">; suporte: { pe: number } };
      const t = cena.telaDoCelular("mediaRetrato");
      expect(geo.tela.cx).toBeCloseTo(t.cx, 1);
      expect(geo.tela.cy).toBeCloseTo(t.cy, 1);
      expect(geo.tela.largura).toBeCloseTo(t.largura, 1);
      expect(geo.tela.altura).toBeCloseTo(t.altura, 1);
      // O pé do suporte na mesa, abaixo da tela: o vetor da N4 encosta nele.
      expect(geo.suporte.pe).toBeGreaterThan(t.cy + t.altura / 2);
    });

    it("o ENTRADA.aparelho.emPe e o ENTRADA.midia.emPe são os da mídia em pé (com 0,1 px)", () => {
      const t = cena.telaDoCelular("mediaRetrato");
      const { emPe } = ENTRADA.aparelho;
      expect(Math.abs(emPe.cx - t.cx)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(emPe.cy - t.cy)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(emPe.largura - t.largura)).toBeLessThanOrEqual(0.1);
      // Cover 50% 50%: a tela do celular (no meio da mídia) fica no meio do cartão e, nos tablets em pé, no meio da janela.
      expect(ENTRADA.midia.emPe).toMatchObject({ w: 720, h: 1280, posX: 0.5, posY: 0.5 });
    });

    it("o notebook fica atrás do celular, cortado por ele (e desfocado), com a tampa acima da tela", () => {
      const { w, caixa } = quadroEmPe("mediaRetrato");
      const L = w.laptop;
      const g = cena.laptopGeo({ ...L, tilt: cena.BASE.laptop.tilt });
      const tampa = caixa([g.at(-L.w / 2, 0), g.at(L.w / 2, 0), g.at(-L.w / 2, g.lidH), g.at(L.w / 2, g.lidH)]);
      const t = cena.telaDoCelular("mediaRetrato");
      expect(tampa.y0).toBeLessThan(t.cy - t.altura / 2);
      // O celular cobre o meio da tampa.
      expect(tampa.x0).toBeLessThan(t.cx - t.largura / 2);
      expect(tampa.x1).toBeGreaterThan(t.cx + t.largura / 2);
      expect(cena.CAMS.mediaRetrato?.desfoque).toBeDefined();
    });

    it("caixa do Replay e caneca nas laterais do celular, sem encostar nele", () => {
      const { w, caixa } = quadroEmPe("mediaRetrato");
      const t = cena.telaDoCelular("mediaRetrato");
      const fr = cena.frameOf(w.box);
      const pts: Vec[] = [];
      for (const u of [-w.box.w / 2, w.box.w / 2]) for (const v of [-w.box.d / 2, w.box.d / 2]) for (const hh of [0, w.box.h]) pts.push(fr(u, hh, v));
      const box = caixa(pts);
      const m = w.mug;
      const aro = Array.from({ length: 32 }, (_, i): Vec => {
        const a = (i / 32) * Math.PI * 2;
        return [m.x + m.r * Math.cos(a), m.h, m.z + m.r * Math.sin(a)];
      });
      const mug = caixa(aro);
      // Um de cada lado, fora da moldura do celular (a borda é ~5% da largura da tela).
      expect(box.x1).toBeLessThan(t.cx - t.largura * 0.6);
      expect(mug.x0).toBeGreaterThan(t.cx + t.largura * 0.6);
      // E ao menos em parte dentro do corte de 390 × 844 (o cover mostra x 64-656 da mídia).
      const corte = (720 - EM_PE.w / (EM_PE.h / 1280)) / 2;
      expect(box.x1).toBeGreaterThan(corte + 20);
      expect(mug.x0).toBeLessThan(720 - corte - 20);
    });

    it("o fundo em pé: a 390 × 844, a tela do celular renderizado fica atrás da tela do cartão de 300 × 400", () => {
      // O cartão (centrado) cobre a mídia em pé com cover 50% 50% (ENTRADA.midia.emPe); o fundo cobre a janela com cover 50% 75%.
      const tm = cena.telaDoCelular("mediaRetrato");
      const mc = Math.max(300 / 720, 400 / 1280);
      const noCartao = {
        cx: EM_PE.w / 2 + (tm.cx - 360) * mc,
        cy: (EM_PE.h - 400) / 2 + (400 - 1280 * mc) * 0.5 + tm.cy * mc,
        largura: tm.largura * mc,
      };
      const tb = cena.telaDoCelular("portrait");
      const k = Math.max(EM_PE.w / 1080, EM_PE.h / 1920);
      const ox = (EM_PE.w - 1080 * k) * 0.5;
      const oy = (EM_PE.h - 1920 * k) * 0.75;
      expect(ox + tb.cx * k).toBeCloseTo(noCartao.cx, 0);
      expect(Math.abs(oy + tb.cy * k - noCartao.cy)).toBeLessThanOrEqual(2);
      expect((tb.largura * k) / noCartao.largura).toBeCloseTo(1, 1);
    });

    // Ajuste de arte 1 (crítica da N3)
    const lum = (c: Vec) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

    it("o lugar vazio do suporte na mídia em pé é uma sombra difusa: ~15% maior que a chapa, transição de 15 a 25 px", () => {
      const v = cena.CAMS.mediaRetrato?.vazio;
      expect(v).toBeDefined();
      expect(v!.cresce).toBeGreaterThanOrEqual(1.1);
      expect(v!.cresce).toBeLessThanOrEqual(1.25);
      // a transição (borda do desfoque, ~2,5 σ) fica entre 15 e 25 px da mídia
      expect(v!.transicao).toBeGreaterThanOrEqual(15);
      expect(v!.transicao).toBeLessThanOrEqual(25);
      // sem a linha de contato nítida (ela fica a cargo do vetor da N4); o fundo em pé, com o celular, mantém a dele
      expect(v!.contato).toBe(false);
      expect(cena.CAMS.portrait?.vazio).toBeUndefined();
    });

    it("a poça do abajur em pé fecha nas laterais do corte de 390 × 844: cai ao menos 30% em x < 80 e x > 310 do corte", () => {
      const o = { ...cena.CAMS.mediaRetrato } as Record<string, unknown>;
      cena.prepWorld(o);
      const cam = cena.makeCam(o) as Camera & { ray: (x: number, y: number) => Vec; pos: Vec };
      const naMesa = (sx: number, sy: number): Vec => {
        const d = cam.ray(sx, sy);
        const t = -cam.pos[1] / d[1];
        return [cam.pos[0] + d[0] * t, 0, cam.pos[2] + d[2] * t];
      };
      // o cover de 390 × 844 mostra x 64-656 da mídia; as laterais (x < 80 e x > 310 do corte) são medidas no meio de cada
      // uma (x 40 e 350 do corte, ~125 e ~595 da mídia), nas linhas da poça (y 800-980 da mídia: z de ~-1 a ~-13, em volta do
      // suporte; atrás de z 2 a poça já foi cortada pelo `cutZ` e a mesa só tem a luz ambiente)
      const k = EM_PE.h / 1280;
      const corte = (720 - EM_PE.w / k) / 2;
      const [xe, xd] = [corte + 40 / k, corte + 350 / k];
      for (const y of [800, 860, 920, 980]) {
        const centro = lum(cena.corDaMesa(naMesa(360, y)));
        for (const x of [xe, xd]) expect(lum(cena.corDaMesa(naMesa(x, y)))).toBeLessThanOrEqual(0.7 * centro);
      }
    });

    it("os montantes da janela em pé têm a espessura da esquadria (ao menos 2× os 3 cm de antes)", () => {
      for (const which of ["mediaRetrato", "portrait"] as const) {
        const { w } = quadroEmPe(which);
        for (const [a, b] of (w as unknown as { win: { mull: [number, number][] } }).win.mull) expect(b - a).toBeGreaterThanOrEqual(6);
      }
    });

    it("as luzes desfocadas da cidade em pé ficam nas torres, em colunas, longe dos montantes e com tamanhos variados", () => {
      for (const which of ["mediaRetrato", "portrait"] as const) {
        const o = { ...cena.CAMS[which] } as Record<string, unknown>;
        const w = cena.prepWorld(o) as unknown as { win: { mull: [number, number][] }; glassZ: number };
        const cam = cena.makeCam(o);
        const discos = cena.discosDaCidade(cam, o);
        expect(discos.length).toBeGreaterThanOrEqual(6);
        // presas às janelas das torres, e em colunas: cada disco divide a coluna com outro
        for (const d of discos) expect(d.torre).toBe(true);
        const porColuna = new Map<string, number>();
        for (const d of discos) porColuna.set(d.coluna, (porColuna.get(d.coluna) ?? 0) + 1);
        expect([...porColuna.values()].filter((n) => n >= 2).length).toBeGreaterThanOrEqual(porColuna.size / 2);
        // nenhum disco sobre um montante (com a borda do disco), na altura do disco: com a câmera inclinada, o montante
        // vira uma reta levemente diagonal no quadro
        const xNaAltura = (x: number, y: number) => {
          const p = cam.P([x, 20, w.glassZ]);
          const q = cam.P([x, 150, w.glassZ]);
          return p[0] + ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]);
        };
        for (const d of discos) {
          for (const [a, b] of w.win.mull) {
            expect(d.p[0] + d.r * 0.8 < xNaAltura(a, d.p[1]) || d.p[0] - d.r * 0.8 > xNaAltura(b, d.p[1])).toBe(true);
          }
        }
        const rs = discos.map((d) => d.r);
        expect(Math.max(...rs) / Math.min(...rs)).toBeGreaterThanOrEqual(2.5);
      }
    });

    // Ajuste de arte 2 (crítica da N3, rodada 2)
    it("a caixa do Replay fica no desfoque da profundidade dela, e a leitura vem da luz: LED mais forte e reflexo na bola", () => {
      for (const which of ["mediaRetrato", "portrait"] as const) {
        const o = cena.CAMS[which] as { desfoque: number[]; ledK?: number; caixaLuz?: { halo: number; spec: number } };
        // a caixa (z 55, o objeto mais distante) não escapa do desfoque: nada fica mais nítido que o notebook (z 29)
        expect(o.desfoque[3] ?? 0).toBe(0);
        // o LED acende mais que o padrão (0,82) e o halo dele cresce, e a bola tem um reflexo: desfocados, viram pontos de luz
        expect(o.ledK).toBeGreaterThanOrEqual(0.95);
        expect(o.caixaLuz?.halo).toBeGreaterThan(1);
        expect(o.caixaLuz?.spec).toBeGreaterThan(0);
      }
    });

    it("os montantes em pé ficam um tom abaixo do vidro ao lado, com só uma quina discreta do lado da cidade", () => {
      const m = cena.coresDoMontante({ montante: true });
      // o vidro ao lado dos montantes, na mídia em pé, mede ~rgb(13, 25, 37) (L ~23); o navy-900 é L ~26
      const n900: Vec = [14, 28, 43];
      expect(lum(m.frente)).toBeLessThan(22);
      expect(lum(m.lado)).toBeLessThanOrEqual(lum(n900));
      expect(m.quina[1]).toBeLessThanOrEqual(0.15);
    });

    it("o brilho frio da tela do celular: ~1× a largura do corpo, colado à frente do vazio, morre em ~40 px e é fraco", () => {
      const o = { ...cena.CAMS.mediaRetrato } as Record<string, unknown>;
      const w = cena.prepWorld(o) as unknown as MundoEmPe & {
        celular: { w: number; suporte: { d: number } };
      };
      const cam = cena.makeCam(o);
      const c = w.celular;
      const b = cena.brilhoDoCelular(c);
      // a frente do vazio: a chapa (centro em z + d/2 - 2), crescida `cresce` vezes
      const zc = c.z + c.suporte.d / 2 - 2.0;
      const frente = zc - (c.suporte.d / 2) * (cena.CAMS.mediaRetrato!.vazio!.cresce);
      expect((2 * b.semiX) / c.w).toBeGreaterThanOrEqual(0.9);
      expect((2 * b.semiX) / c.w).toBeLessThanOrEqual(1.5);
      // começa colado à frente do vazio (a parte de trás encosta nele) e morre em ~40 px de mídia (o núcleo, ~2/3 do raio)
      expect(b.centro[2] + b.semiZ).toBeGreaterThanOrEqual(frente);
      expect(b.centro[2]).toBeLessThan(frente);
      const yFrente = cam.P([c.x, 0, frente])[1];
      const yFim = cam.P([c.x, 0, b.centro[2] - b.semiZ * 0.67])[1];
      expect(yFim - yFrente).toBeLessThanOrEqual(45);
      // fraco: metade do brilho da tela do notebook, no máximo (a tela mostra uma página navy)
      expect(b.a).toBeLessThanOrEqual(0.12);
    });

    it("a boca da caneca aparece na mídia em pé: a elipse tem ao menos 22 px de altura e um aro claro", () => {
      const { w, cam } = quadroEmPe("mediaRetrato");
      const m = w.mug as Caneca & { boca?: { aro: number } };
      const ys = Array.from({ length: 64 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return cam.P([m.x + m.r * Math.cos(a), m.h, m.z + m.r * Math.sin(a)])[1];
      });
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(22);
      expect(m.boca?.aro).toBeGreaterThan(0);
    });
  });

  it("o pipeline não usa nada do hero-expansao em tempo de execução", () => {
    const fontes = readdirSync(PASTA).filter((f) => /\.(js|html|sh)$/.test(f));
    expect(fontes).toEqual(
      expect.arrayContaining([
        "scene.js",
        "geo.js",
        "bg.html",
        "media.html",
        "portrait.html",
        "media-retrato.html",
        "shot.sh",
        "stills.sh",
      ]),
    );
    for (const f of fontes) expect(readFileSync(join(PASTA, f), "utf8")).not.toMatch(/hero-expansao/);
  });
});
