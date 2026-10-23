// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ENTRADA,
  camera,
  cenaDe,
  fases,
  posicaoDoTitulo,
  quadro,
  suave,
  telaNaCena,
  type Cena,
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
    // m = max(300/1280, 400/720) = 5/9; o centro da tela (640, cy) cai em
    // x = (300 − 1280·m)/2 + 640·m = 150 e y = cy·m, rente ao pé (posY = 1).
    const v = NOTEBOOK_GRANDE;
    const { cx, cy, s } = telaNaCena(0, v);
    expect(cx - (v.w - 300) / 2).toBeCloseTo(150, 9);
    expect(cy - (v.h - 400) / 2).toBeCloseTo(ENTRADA.aparelho.deitado.cy * (5 / 9), 9);
    expect(s * v.w).toBeCloseTo(ENTRADA.aparelho.deitado.largura * (5 / 9), 9);
  });
});

describe("camera: a mídia e o aparelho do enquadramento atual", () => {
  it("cenaDe lê ENTRADA.midia e ENTRADA.aparelho pela orientação", () => {
    const emPe = cenaDe(CELULAR);
    const deitado = cenaDe(NOTEBOOK_GRANDE);
    expect(emPe.midia).toBe(ENTRADA.midia.emPe);
    expect(emPe.aparelho).toBe(ENTRADA.aparelho.emPe);
    expect(deitado.midia).toBe(ENTRADA.midia.deitado);
    expect(deitado.aparelho).toBe(ENTRADA.aparelho.deitado);
  });

  it.each(VIEWPORTS)("telaNaCena e camera usam, sem a cena, a do enquadramento ($w × $h)", (v) => {
    for (const p of [0, 0.3, ENTRADA.E, 0.8, 1]) {
      expect(camera(p, v)).toEqual(camera(p, v, cenaDe(v)));
    }
    expect(telaNaCena(0.5, v)).toEqual(telaNaCena(0.5, v, cenaDe(v)));
  });

  it("o retrato de 720 × 1280 com o aparelho em pé cai no centro esperado", () => {
    const retrato: Cena = {
      midia: { w: 720, h: 1280, posX: 0.5, posY: 1 },
      aparelho: { cx: 360, cy: 900, largura: 200 },
    };
    // Na pausa, a 390 × 844: m = max(390/720, 844/1280) = 0,659375; a mídia
    // fica com 474,75 × 844 e sobra (390 − 474,75)/2 = −42,375 à esquerda.
    const m = 844 / 1280;
    const pausa = telaNaCena(1, CELULAR, retrato);
    expect(pausa.cx).toBeCloseTo(-42.375 + 360 * m, 9);
    expect(pausa.cx).toBeCloseTo(195, 9);
    expect(pausa.cy).toBeCloseTo(900 * m, 9);
    expect(pausa.s).toBeCloseTo((200 * m) / 390, 9);
    // No cartão de 300 × 400: m = 300/720, e a mídia (300 × 533,3) corta por cima.
    const m0 = 300 / 720;
    const cartao = telaNaCena(0, CELULAR, retrato);
    expect(cartao.cx).toBeCloseTo(195, 9);
    expect(cartao.cy).toBeCloseTo((844 - 400) / 2 + (400 - 1280 * m0) + 900 * m0, 9);
    // A câmera parte dela e termina na janela.
    expect(camera(ENTRADA.E, CELULAR, retrato).tela).toEqual(pausa);
    expect(camera(1, CELULAR, retrato).tela.s).toBeCloseTo(1, 9);
  });
});

describe("telaNaCena: a tela presa pelo pé (N4)", () => {
  // A tela tem a proporção da janela (Q13), e a da arte, a dela (16:10 o notebook, 390 × 844 o celular). A borda de baixo
  // da tela fica no pé da tela da arte (cy + altura/2), onde a moldura em vetor encontra a base ou o suporte: numa janela
  // mais larga a tampa fica mais baixa, numa mais estreita, mais alta, e a base nunca sai do lugar vazio da mesa.
  const JANELAS: Viewport[] = [
    NOTEBOOK_GRANDE,
    NOTEBOOK_COM_BARRA,
    { w: 2560, h: 1080, emPe: false },
    { w: 1024, h: 768, emPe: false },
    CELULAR,
    { w: 768, h: 1024, emPe: true },
    { w: 820, h: 1180, emPe: true },
    { w: 360, h: 740, emPe: true },
  ];

  it("ENTRADA.aparelho tem a altura da tela da arte, na proporção dela", () => {
    expect(ENTRADA.aparelho.deitado.largura / ENTRADA.aparelho.deitado.altura).toBeCloseTo(16 / 10, 3);
    expect(ENTRADA.aparelho.emPe.largura / ENTRADA.aparelho.emPe.altura).toBeCloseTo(390 / 844, 3);
  });

  it.each(JANELAS)("a $w × $h, em todo e, o pé da tela na janela é o pé da tela da arte", (v) => {
    const { midia } = cenaDe(v);
    const aparelho = ENTRADA.aparelho[v.emPe ? "emPe" : "deitado"];
    for (const e of [0, 0.4, 1]) {
      const { cy, s } = telaNaCena(e, v);
      const q = quadro(e, v);
      const m = Math.max(q.w / midia.w, q.h / midia.h);
      const topoDaMidia = (v.h - q.h) / 2 + (q.h - midia.h * m) * midia.posY;
      expect(cy + (s * v.h) / 2).toBeCloseTo(topoDaMidia + (aparelho.cy + aparelho.altura / 2) * m, 6);
    }
  });

  it("na proporção da arte, o centro é o da tela da arte (1440 × 900 e 390 × 844)", () => {
    for (const v of [NOTEBOOK_GRANDE, CELULAR]) {
      const { midia, aparelho } = cenaDe(v);
      const m = Math.max(v.w / midia.w, v.h / midia.h);
      expect(telaNaCena(1, v).cy).toBeCloseTo((v.h - midia.h * m) * midia.posY + aparelho.cy * m, 1);
    }
  });
});

describe("camera: notebook ou celular", () => {
  it("em pé usa aparelho.emPe e deitado usa aparelho.deitado", () => {
    const deitado = camera(ENTRADA.E, { w: 800, h: 600, emPe: false }).tela;
    const emPe = camera(ENTRADA.E, { w: 800, h: 600, emPe: true }).tela;
    expect(emPe.s).not.toBeCloseTo(deitado.s, 3);
    // Mesma janela, cada um com a sua mídia: a razão das escalas é a razão das larguras na escala do cover de cada mídia.
    const cover = (m: { w: number; h: number }) => Math.max(800 / m.w, 600 / m.h);
    expect(emPe.s / deitado.s).toBeCloseTo(
      (ENTRADA.aparelho.emPe.largura * cover(ENTRADA.midia.emPe)) /
        (ENTRADA.aparelho.deitado.largura * cover(ENTRADA.midia.deitado)),
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

/**
 * As metades do título na pausa: a linha 1 escala em volta da borda direita
 * (a que encosta na tela) e a linha 2 em volta da esquerda; no layout, cada
 * uma é centrada na janela.
 */
function metadesNaPausa(v: Viewport, larguras: [number, number]) {
  const { x, escala } = posicaoDoTitulo(v, larguras);
  const direita1 = v.w / 2 + larguras[0] / 2 + x[0];
  const esquerda2 = v.w / 2 - larguras[1] / 2 + x[1];
  return {
    escala,
    linha1: { left: direita1 - larguras[0] * escala, right: direita1 },
    linha2: { left: esquerda2, right: esquerda2 + larguras[1] * escala },
  };
}

/** As larguras das metades com a fonte de 60 px, medidas no navegador (relatório da Task 3 da fase 1). */
const TITULO_60PX: [number, number] = [688, 323];

describe("posicaoDoTitulo", () => {
  it("sem medida (jsdom) não desloca nem escala nada", () => {
    expect(posicaoDoTitulo(NOTEBOOK_GRANDE, [0, 0])).toEqual({ x: [0, 0], escala: 1 });
  });

  it("a linha 1 termina tituloFolga à esquerda da tela e a 2 começa à direita", () => {
    const v = NOTEBOOK_GRANDE;
    const larguras: [number, number] = [400, 300];
    const [dx1, dx2] = posicaoDoTitulo(v, larguras).x;
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

describe("posicaoDoTitulo: o título inteiro na pausa", () => {
  it("cabe sem escala quando sobra espaço dos dois lados", () => {
    expect(posicaoDoTitulo(NOTEBOOK_GRANDE, [300, 200]).escala).toBe(1);
  });

  it("a escala é min(1, espaço livre ÷ largura), com o pior dos dois lados", () => {
    const v = NOTEBOOK_GRANDE;
    const tela = telaNaCena(1, v);
    const meia = (tela.s * v.w) / 2;
    const livreEsq = tela.cx - meia - ENTRADA.tituloFolga - ENTRADA.tituloMargem;
    const livreDir = v.w - (tela.cx + meia) - ENTRADA.tituloFolga - ENTRADA.tituloMargem;
    expect(ENTRADA.tituloMargem).toBe(16);
    expect(posicaoDoTitulo(v, TITULO_60PX).escala).toBeCloseTo(Math.min(livreEsq / 688, livreDir / 323), 9);
    // A linha 2 mais larga manda.
    expect(posicaoDoTitulo(v, [100, 900]).escala).toBeCloseTo(livreDir / 900, 9);
  });

  it.each([NOTEBOOK_GRANDE, { w: 1366, h: 768, emPe: false }, NOTEBOOK_COM_BARRA])(
    "a $w × $h, as duas metades ficam dentro de [16, v.w − 16], ao lado da tela",
    (v) => {
      const { escala, linha1, linha2 } = metadesNaPausa(v, TITULO_60PX);
      expect(escala).toBeLessThan(1);
      const folga = 1e-6;
      for (const linha of [linha1, linha2]) {
        expect(linha.left).toBeGreaterThanOrEqual(16 - folga);
        expect(linha.right).toBeLessThanOrEqual(v.w - 16 + folga);
      }
      const tela = telaNaCena(1, v);
      const meia = (tela.s * v.w) / 2;
      expect(linha1.right).toBeCloseTo(tela.cx - meia - ENTRADA.tituloFolga, 6);
      expect(linha2.left).toBeCloseTo(tela.cx + meia + ENTRADA.tituloFolga, 6);
    },
  );

  it("nunca vira escala negativa numa janela estreita demais", () => {
    expect(posicaoDoTitulo({ w: 200, h: 900, emPe: false }, TITULO_60PX).escala).toBeGreaterThanOrEqual(0);
  });
});

/**
 * O cartão de antes de montar e o estado parado são CSS puro (sem medir, o
 * CSS não divide por uma largura): os números fixos do globals.css têm de
 * bater com a câmera nas janelas de referência, 1440 × 900 deitado e
 * 390 × 844 em pé.
 */
describe("globals.css: os números fixos da cena batem com o ENTRADA", () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");
  const inicio = css.indexOf('/* Hero "entrada"');
  const bloco = css.slice(inicio, css.indexOf("/* SPIKE: prévia", inicio));
  /** O corpo da regra que vem logo depois de `cabeca` (até a 1ª chave que fecha). */
  const regra = (cabeca: string) => {
    const i = bloco.indexOf(cabeca);
    expect(i, cabeca).toBeGreaterThan(-1);
    const corpo = bloco.slice(i + cabeca.length);
    return corpo.slice(0, corpo.indexOf("}"));
  };
  const valor = (corpo: string, nome: string) =>
    corpo.match(new RegExp(`${nome}:\\s*([^;]*);`))?.[1]?.replace(/\s+/g, " ").trim();
  const numero = (texto: string | undefined, re: RegExp) => Number(texto?.match(re)?.[1]);

  const cartao = regra(".hero-expansao--entrada {\n");
  const cartaoEmPe = regra("@media (orientation: portrait) {\n  .hero-expansao--entrada {\n");
  const parado = regra("@media (scripting: none), (prefers-reduced-motion: reduce) {\n  .hero-expansao--entrada {\n");
  const paradoEmPe = regra(
    "@media (scripting: none) and (orientation: portrait), (prefers-reduced-motion: reduce) and (orientation: portrait) {\n  .hero-expansao--entrada {\n",
  );

  it("a largura da mídia com cover usa a proporção da mídia de cada enquadramento", () => {
    expect(valor(cartao, "--hx-midia-largura")).toBe("max(100cqw, var(--hx-palco-h) * 16 / 9)");
    expect(ENTRADA.midia.deitado.w / ENTRADA.midia.deitado.h).toBeCloseTo(16 / 9, 9);
    // Em pé, a mídia própria (720 × 1280): uma regra só para ela.
    expect(valor(cartaoEmPe, "--hx-midia-largura")).toBe("max(100cqw, var(--hx-palco-h) * 9 / 16)");
    expect(ENTRADA.midia.emPe.w / ENTRADA.midia.emPe.h).toBeCloseTo(9 / 16, 9);
  });

  it("o corte da mídia (--hx-midia-pos) é o object-position de ENTRADA.midia em cada enquadramento", () => {
    const pos = (m: { posX: number; posY: number }) => `${m.posX * 100}% ${m.posY * 100}%`;
    // Deitado vale o do .hero-expansao (50% 100%), que o modo entrada não muda.
    expect(valor(cartao, "--hx-midia-pos")).toBeUndefined();
    expect(pos(ENTRADA.midia.deitado)).toBe("50% 100%");
    expect(valor(cartaoEmPe, "--hx-midia-pos")).toBe(pos(ENTRADA.midia.emPe));
  });

  it.each([
    { nome: "deitado", v: NOTEBOOK_GRANDE, noCartao: () => cartao, naPausa: () => parado },
    { nome: "em pé", v: CELULAR, noCartao: () => cartaoEmPe, naPausa: () => paradoEmPe },
  ])("$nome: a escala e o centro da tela no cartão (P = 0) e na pausa (o estado parado)", ({ v, noCartao, naPausa }) => {
    // O cartão: --hx-tela-s e o centro a N px acima do meio do palco.
    const cartaoTela = camera(0, v).tela;
    expect(numero(valor(noCartao(), "--hx-tela-s"), /^([\d.]+)/)).toBeCloseTo(cartaoTela.s, 4);
    expect(numero(valor(noCartao(), "--hx-tela-y"), /\/ 2 - ([\d.]+)px/)).toBeCloseTo(v.h / 2 - cartaoTela.cy, 2);

    // A pausa: --hx-tela-s e o topo da tela pelo pé (a tela presa pelo pé da tela da arte, N4): `posY` da altura do
    // palco mais ou menos uma fração da largura da mídia (o cover corta em posY: deitado, 50% 100%, o pé fica acima do pé
    // do palco; em pé, 50% 50%, abaixo do meio dele), menos a altura da tela.
    const pausaTela = camera(ENTRADA.E, v).tela;
    expect(numero(valor(naPausa(), "--hx-tela-s"), /^([\d.]+)/)).toBeCloseTo(pausaTela.s, 4);
    const y = valor(naPausa(), "--hx-tela-y");
    const forma = y?.match(
      /^calc\( ?var\(--hx-palco-h\)( \/ 2)? ([+-]) ([\d.]+) \* var\(--hx-midia-largura\) - var\(--hx-tela-s\) \* var\(--hx-palco-h\) ?\) !important$/,
    );
    expect(forma, y).not.toBeNull();
    const parteDoPalco = forma?.[1] ? 0.5 : 1;
    const fracao = Number(forma?.[3] ?? 0) * (forma?.[2] === "-" ? -1 : 1);
    const { w, h, posY } = cenaDe(v).midia;
    expect(parteDoPalco).toBe(posY);
    const larguraDaMidia = Math.max(v.w, (v.h * w) / h);
    const topo = pausaTela.cy - (pausaTela.s * v.h) / 2;
    expect(parteDoPalco * v.h + fracao * larguraDaMidia - pausaTela.s * v.h).toBeCloseTo(topo, 1);
  });
});
