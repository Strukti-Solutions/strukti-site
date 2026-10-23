// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ENTRADA,
  camera,
  fases,
  posicaoDoTitulo,
  quadro,
  suave,
  telaNaCena,
  type Viewport,
} from "./heroEntrada";

const NOTEBOOK_GRANDE: Viewport = { w: 1440, h: 900, emPe: false };
/** 1366 × 768 menos a barra de rolagem clássica (15 px). */
const NOTEBOOK_COM_BARRA: Viewport = { w: 1351, h: 768, emPe: false };
const CELULAR: Viewport = { w: 390, h: 844, emPe: true };
const VIEWPORTS = [NOTEBOOK_GRANDE, NOTEBOOK_COM_BARRA, CELULAR];

describe("fases", () => {
  it("começa parada e termina cheia", () => {
    expect(fases(0)).toEqual({ e: 0, a: 0 });
    expect(fases(1)).toEqual({ e: 1, a: 1 });
  });

  it("fecha a expansão em E e não move nada na pausa", () => {
    expect(fases(ENTRADA.E)).toEqual({ e: 1, a: 0 });
    const fimDaPausa = fases(ENTRADA.E + ENTRADA.Pa);
    expect(fimDaPausa.e).toBe(1);
    expect(fimDaPausa.a).toBeCloseTo(0, 12);
    const meioDaPausa = fases(ENTRADA.E + ENTRADA.Pa / 2);
    expect(meioDaPausa).toEqual({ e: 1, a: 0 });
  });

  it("é monotônica em 101 amostras", () => {
    let anterior = fases(0);
    for (let i = 1; i <= 100; i += 1) {
      const atual = fases(i / 100);
      expect(atual.e).toBeGreaterThanOrEqual(anterior.e);
      expect(atual.a).toBeGreaterThanOrEqual(anterior.a);
      anterior = atual;
    }
  });
});

describe("suave", () => {
  it("é o smoothstep: 0, 0,5 e 1 nos pontos conhecidos", () => {
    expect(suave(0)).toBe(0);
    expect(suave(1)).toBe(1);
    expect(suave(0.5)).toBeCloseTo(0.5, 12);
  });

  it("tem derivada ~0 nas pontas", () => {
    expect(suave(0.01)).toBeLessThan(0.001);
    expect(suave(0.99)).toBeGreaterThan(0.999);
  });
});

describe("quadro", () => {
  it("vai do quadro inicial exatamente à área útil", () => {
    expect(quadro(1, NOTEBOOK_COM_BARRA)).toEqual({ w: 1351, h: 768 });
    expect(quadro(0, NOTEBOOK_COM_BARRA)).toEqual({ w: 300, h: 400 });
  });

  it("anda linear entre as pontas", () => {
    expect(quadro(0.5, NOTEBOOK_GRANDE)).toEqual({ w: 870, h: 650 });
  });
});

describe("camera: a tela no fim é a janela", () => {
  it.each(VIEWPORTS)("em p = 1 a tela cobre $w × $h", (v) => {
    const { tela } = camera(1, v);
    expect(tela.cx).toBeCloseTo(v.w / 2, 6);
    expect(tela.cy).toBeCloseTo(v.h / 2, 6);
    expect(tela.s).toBeCloseTo(1, 6);
  });

  it.each(VIEWPORTS)("em p = 1 a sala e o título terminam no máximo ($w × $h)", (v) => {
    const c = camera(1, v);
    expect(c.k).toBe(1);
    expect(c.sala.z).toBeCloseTo(ENTRADA.salaZoomMax, 12);
    expect(c.sala.blur).toBeCloseTo(ENTRADA.salaBlurMax, 12);
    expect(c.titulo.saida).toBe(1);
  });
});

describe("camera: continuidade", () => {
  it.each(VIEWPORTS)("a pausa não move a tela ($w × $h)", (v) => {
    const naPausa = camera(ENTRADA.E, v).tela;
    for (const p of [ENTRADA.E + ENTRADA.Pa * 0.25, ENTRADA.E + ENTRADA.Pa * 0.75]) {
      expect(camera(p, v).tela).toEqual(naPausa);
    }
    const fim = camera(ENTRADA.E + ENTRADA.Pa, v).tela;
    expect(fim.cx).toBeCloseTo(naPausa.cx, 9);
    expect(fim.cy).toBeCloseTo(naPausa.cy, 9);
    expect(fim.s).toBeCloseTo(naPausa.s, 9);
  });

  it.each(VIEWPORTS)("não salta entre p vizinhos (passo 0,001) em $w × $h", (v) => {
    const limite = v.w * 0.01;
    let anterior = camera(0, v).tela;
    for (let i = 1; i <= 1000; i += 1) {
      const atual = camera(i / 1000, v).tela;
      expect(Math.abs(atual.cx - anterior.cx)).toBeLessThan(limite);
      expect(Math.abs(atual.cy - anterior.cy)).toBeLessThan(limite);
      // s é adimensional (0..1): o que não pode saltar é a largura da tela, s·v.w.
      expect(Math.abs(atual.s - anterior.s) * v.w).toBeLessThan(limite);
      anterior = atual;
    }
  });
});

describe("camera: a tela fica dentro do quadro", () => {
  it.each(VIEWPORTS)("em e = 0, 0,5 e 1 ($w × $h)", (v) => {
    for (const e of [0, 0.5, 1]) {
      const { cx, cy, s } = telaNaCena(e, v);
      const q = quadro(e, v);
      const esq = (v.w - q.w) / 2;
      const topo = (v.h - q.h) / 2;
      const meioW = (s * v.w) / 2;
      const meioH = (s * v.h) / 2;
      const folga = 1e-9;
      expect(cx - meioW).toBeGreaterThanOrEqual(esq - folga);
      expect(cx + meioW).toBeLessThanOrEqual(esq + q.w + folga);
      expect(cy - meioH).toBeGreaterThanOrEqual(topo - folga);
      expect(cy + meioH).toBeLessThanOrEqual(topo + q.h + folga);
    }
  });

  it("conta do cover: no quadro de 300 × 400 a mídia 1280 × 720 vira 711 × 400", () => {
    // m = max(300/1280, 400/720) = 5/9; o centro da tela (640, 300) cai em
    // x = (300 − 1280·m)/2 + 640·m = 150 e y = 300·m, rente ao pé (posY = 1).
    const v = NOTEBOOK_GRANDE;
    const { cx, cy, s } = telaNaCena(0, v);
    expect(cx - (v.w - 300) / 2).toBeCloseTo(150, 9);
    expect(cy - (v.h - 400) / 2).toBeCloseTo(300 * (5 / 9), 9);
    expect(s * v.w).toBeCloseTo(ENTRADA.aparelho.deitado.largura * (5 / 9), 9);
  });
});

describe("camera: notebook ou celular", () => {
  it("em pé usa aparelho.emPe e deitado usa aparelho.deitado", () => {
    const deitado = camera(ENTRADA.E, { w: 800, h: 600, emPe: false }).tela;
    const emPe = camera(ENTRADA.E, { w: 800, h: 600, emPe: true }).tela;
    expect(emPe.s).not.toBeCloseTo(deitado.s, 3);
    // Mesma janela e mesma mídia: a razão das escalas é a razão das larguras.
    expect(emPe.s / deitado.s).toBeCloseTo(
      ENTRADA.aparelho.emPe.largura / ENTRADA.aparelho.deitado.largura,
      9,
    );
  });
});

describe("camera: a sala", () => {
  it("fica parada até a aproximação começar", () => {
    const c = camera(ENTRADA.E + ENTRADA.Pa / 2, NOTEBOOK_GRANDE);
    expect(c.sala.z).toBe(1);
    expect(c.sala.tx).toBe(0);
    expect(c.sala.ty).toBe(0);
    expect(c.sala.blur).toBe(0);
    expect(c.titulo.saida).toBe(0);
  });

  it("amplia em volta da tela da pausa e leva esse ponto ao centro da janela", () => {
    const v = NOTEBOOK_GRANDE;
    const naPausa = telaNaCena(1, v);
    const c = camera(1, v);
    expect(c.sala.ox).toBeCloseTo(naPausa.cx, 9);
    expect(c.sala.oy).toBeCloseTo(naPausa.cy, 9);
    // Com origem (ox, oy), o ponto da origem anda só pela translação.
    expect(c.sala.ox + c.sala.tx).toBeCloseTo(v.w / 2, 9);
    expect(c.sala.oy + c.sala.ty).toBeCloseTo(v.h / 2, 9);
  });

  it("o ponto da tela na sala acompanha o centro da tela da câmera em todo p", () => {
    const v = NOTEBOOK_COM_BARRA;
    const naPausa = telaNaCena(1, v);
    for (let i = 0; i <= 20; i += 1) {
      const c = camera(i / 20, v);
      // Na expansão (e < 1) a tela anda com o quadro e a sala fica parada.
      if (c.e < 1) continue;
      expect(naPausa.cx + c.sala.tx).toBeCloseTo(c.tela.cx, 9);
      expect(naPausa.cy + c.sala.ty).toBeCloseTo(c.tela.cy, 9);
    }
  });

  it("a saída do título chega a 1 em tituloSaidaAte da aproximação", () => {
    const v = NOTEBOOK_GRANDE;
    // a = tituloSaidaAte ⇒ p = E + Pa + tituloSaidaAte·(1 − E − Pa)
    const p = ENTRADA.E + ENTRADA.Pa + ENTRADA.tituloSaidaAte * (1 - ENTRADA.E - ENTRADA.Pa);
    expect(camera(p, v).titulo.saida).toBeCloseTo(1, 9);
    expect(camera(ENTRADA.E + ENTRADA.Pa, v).titulo.saida).toBe(0);
  });
});

describe("posicaoDoTitulo", () => {
  it("sem medida (jsdom) não desloca nada", () => {
    expect(posicaoDoTitulo(NOTEBOOK_GRANDE, [0, 0])).toEqual([0, 0]);
  });

  it("a linha 1 termina tituloFolga à esquerda da tela e a 2 começa à direita", () => {
    const v = NOTEBOOK_GRANDE;
    const larguras: [number, number] = [400, 300];
    const [dx1, dx2] = posicaoDoTitulo(v, larguras);
    const { tela } = camera(ENTRADA.E, v);
    const esq = tela.cx - (tela.s * v.w) / 2;
    const dir = tela.cx + (tela.s * v.w) / 2;
    // No layout cada linha é centrada na janela.
    const bordaDireitaDaLinha1 = v.w / 2 + larguras[0] / 2 + dx1;
    const bordaEsquerdaDaLinha2 = v.w / 2 - larguras[1] / 2 + dx2;
    expect(Math.abs(bordaDireitaDaLinha1 - (esq - 24))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(bordaEsquerdaDaLinha2 - (dir + 24))).toBeLessThanOrEqual(0.5);
  });
});
