/**
 * Geometria e câmera da entrada pelo notebook (spec 2026-10-23, §3–§5): tudo o
 * que não depende de DOM fica aqui, em funções puras e testadas. O
 * ScrollExpandMedia só mede a janela, chama `camera()` e escreve variáveis CSS.
 *
 * Unidades: pixels da janela útil (a largura sem a barra de rolagem clássica e
 * a altura sem a barra do topo), com a origem no canto de cima à esquerda dela.
 */

/** Largura e altura da área útil; `emPe` é `(orientation: portrait)` (Q26). */
export type Viewport = { w: number; h: number; emPe: boolean };

/**
 * Os números da spec (§3–§4) são pontos de partida: ficam todos aqui, num
 * objeto só, para o dono afinar no protótipo.
 */
export const ENTRADA = {
  /** Fim da expansão, em fração do percurso total. */
  E: 0.54,
  /** Duração da pausa, em fração do percurso total. */
  Pa: 0.08,
  /** Divisor dos ganhos da roda e do toque (o percurso total ficou 1,85× maior). */
  ganho: 1.85,
  /** Zoom da sala no fim da aproximação, em volta do centro da tela. */
  salaZoomMax: 1.45,
  /** Desfoque da sala no fim da aproximação, em px. */
  salaBlurMax: 10,
  /** Fração da aproximação (`a`) em que as metades do título já saíram. */
  tituloSaidaAte: 0.5,
  /** Distância, em px, entre cada metade do título e a borda da tela na pausa. */
  tituloFolga: 24,
  /** A mídia da sala: 1280 × 720, `object-position: 50% 100%` (`--hx-midia-pos`). */
  midia: { w: 1280, h: 720, posX: 0.5, posY: 1 },
  /**
   * Centro e largura da tela do aparelho na cena, em px da mídia 1280 × 720.
   * São os valores do protótipo; a arte da fase 2 os confirma.
   */
  aparelho: {
    deitado: { cx: 640, cy: 300, largura: 360 },
    emPe: { cx: 640, cy: 330, largura: 120 },
  },
  /** O quadro no início da expansão, em px. */
  quadroInicial: { w: 300, h: 400 },
} as const;

export type Camera = {
  /** Progresso da expansão, de 0 a 1. */
  e: number;
  /** Progresso linear da aproximação, de 0 a 1. */
  a: number;
  /** Progresso da aproximação já com a curva (`ease-in-out`). */
  k: number;
  /** Centro da tela do aparelho (px da janela) e escala dela (largura ÷ `v.w`). */
  tela: { cx: number; cy: number; s: number };
  /**
   * A sala: `transform-origin: ox oy` e `transform: translate(tx, ty)
   * scale(z)`, mais `filter: blur(blur)`. A origem é o centro da tela na
   * pausa, em px da janela (que é o quadro nessa hora).
   */
  sala: { z: number; ox: number; oy: number; tx: number; ty: number; blur: number };
  /** `titulo.saida` vai de 0 a 1 e leva as metades do título para fora. */
  titulo: { saida: number };
};

function prende(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Parte o progresso total `p` em expansão (`e`) e aproximação (`a`), de 0 a 1. */
export function fases(p: number): { e: number; a: number } {
  const { E, Pa } = ENTRADA;
  return {
    e: prende(p / E),
    a: prende((p - E - Pa) / (1 - E - Pa)),
  };
}

/** Smoothstep `x²(3 − 2x)`: a curva `ease-in-out` da aproximação (§4). */
export function suave(x: number): number {
  return x * x * (3 - 2 * x);
}

/** O quadro da expansão: de `quadroInicial` à área útil, linear em `e`. */
export function quadro(e: number, v: Viewport): { w: number; h: number } {
  const { w, h } = ENTRADA.quadroInicial;
  return { w: w + e * (v.w - w), h: h + e * (v.h - h) };
}

/**
 * Onde a tela do aparelho está na janela com a expansão em `e`: o centro dela
 * (px da janela) e a escala (largura da tela ÷ `v.w`; a tela tem a proporção
 * da janela, então a altura é `s · v.h`).
 *
 * O quadro fica centrado na janela. A mídia cobre o quadro como o CSS faz
 * (`object-fit: cover; object-position: 50% 100%`): `m` é a escala do cover e a
 * origem do conteúdo, dentro do quadro, é `((qw − 1280m)·posX, (qh − 720m)·posY)`.
 */
export function telaNaCena(e: number, v: Viewport): { cx: number; cy: number; s: number } {
  const q = quadro(e, v);
  const { midia, aparelho } = ENTRADA;
  const tela = v.emPe ? aparelho.emPe : aparelho.deitado;
  const m = Math.max(q.w / midia.w, q.h / midia.h);
  const esquerdaDoQuadro = (v.w - q.w) / 2;
  const topoDoQuadro = (v.h - q.h) / 2;
  const origemX = (q.w - midia.w * m) * midia.posX;
  const origemY = (q.h - midia.h * m) * midia.posY;
  return {
    cx: esquerdaDoQuadro + origemX + tela.cx * m,
    cy: topoDoQuadro + origemY + tela.cy * m,
    s: (tela.largura * m) / v.w,
  };
}

/**
 * A câmera em `p`: a tela parte de onde a expansão a deixou (`telaNaCena`) e
 * chega à janela inteira. O centro anda linear em `k`; a escala, multiplicativa
 * (`s0^(1−k)`), para o zoom parecer uniforme. A sala amplia em volta da tela
 * da pausa e é puxada junto, para o ponto da tela nela acompanhar a tela.
 */
export function camera(p: number, v: Viewport): Camera {
  const { e, a } = fases(p);
  const k = suave(a);
  const { salaZoomMax, salaBlurMax, tituloSaidaAte } = ENTRADA;

  const inicio = telaNaCena(e, v);
  const tela = {
    cx: inicio.cx + (v.w / 2 - inicio.cx) * k,
    cy: inicio.cy + (v.h / 2 - inicio.cy) * k,
    s: Math.pow(inicio.s, 1 - k),
  };

  // A sala só se mexe na aproximação, quando e = 1: a origem é a tela da pausa.
  const naPausa = telaNaCena(1, v);
  const sala = {
    z: Math.pow(salaZoomMax, k),
    ox: naPausa.cx,
    oy: naPausa.cy,
    tx: (v.w / 2 - naPausa.cx) * k,
    ty: (v.h / 2 - naPausa.cy) * k,
    blur: salaBlurMax * k,
  };

  return { e, a, k, tela, sala, titulo: { saida: prende(a / tituloSaidaAte) } };
}

/**
 * Deslocamento X, em px, de cada metade do título na pausa. No layout cada
 * linha é centrada na janela; a linha 1 termina `tituloFolga` à esquerda da
 * borda da tela do aparelho e a linha 2 começa `tituloFolga` à direita dela.
 * Largura não medida (zero, como no jsdom) não desloca essa linha.
 */
export function posicaoDoTitulo(v: Viewport, larguras: [number, number]): [number, number] {
  const { tituloFolga } = ENTRADA;
  const tela = telaNaCena(1, v);
  const meia = (tela.s * v.w) / 2;
  const bordaEsquerda = tela.cx - meia;
  const bordaDireita = tela.cx + meia;
  const [larguraLinha1, larguraLinha2] = larguras;
  return [
    larguraLinha1 > 0 ? bordaEsquerda - tituloFolga - (v.w / 2 + larguraLinha1 / 2) : 0,
    larguraLinha2 > 0 ? bordaDireita + tituloFolga - (v.w / 2 - larguraLinha2 / 2) : 0,
  ];
}
