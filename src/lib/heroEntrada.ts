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
  /**
   * A partir deste `k` a tela cobre a sala (em P = 1, solto ou recolhido,
   * k = 1): o vídeo dela, que ninguém vê, pausa.
   */
  salaCobertaK: 0.98,
  /** Fração da aproximação (`a`) em que as metades do título já saíram. */
  tituloSaidaAte: 0.5,
  /**
   * Distância mínima, em px, entre cada metade do título e a moldura do
   * aparelho na pausa (deitado, de lado; em pé, acima da moldura e abaixo do
   * suporte).
   */
  tituloFolga: 24,
  /**
   * A mesma distância em fração da largura da moldura, quando passa da
   * mínima: numa janela larga (21:9) o aparelho cresce e a folga acompanha.
   */
  tituloFolgaRelativa: 0.04,
  /** Margem, em px, entre cada metade do título e a borda da janela útil na pausa (em pé). */
  tituloMargem: 16,
  /**
   * Deitado, as metades ficam ao lado do notebook, e a folga e a margem
   * crescem (crítica de arte N6 r1): a 16 px da borda e a 24 px da moldura,
   * a linha 1 ficava espremida entre a janela e o aparelho. A margem é a
   * maior entre 48 px e o gutter da página (40 px no desktop); a folga até
   * a moldura, 40 px. A escala cai para cerca de 0,6 a 1366 e 1440.
   */
  tituloFolgaLado: 40,
  tituloMargemLado: 48,
  /**
   * A mídia da sala de cada enquadramento, com o `object-position` do cover
   * (`--hx-midia-pos`). Deitado, a do notebook, 1280 × 720, cortada por
   * baixo (50% 100%: o pé da mídia emenda na página). Em pé, a do celular
   * num suporte, 720 × 1280 (siteConfig.heroNotebook.midiaRetrato), cortada
   * em volta do meio (50% 50%): a tela do celular, no meio da mídia, fica no
   * meio do cartão e, nos tablets em pé, no meio da janela, ao lado do título.
   */
  midia: {
    deitado: { w: 1280, h: 720, posX: 0.5, posY: 1 },
    emPe: { w: 720, h: 1280, posX: 0.5, posY: 0.5 },
  },
  /**
   * Centro, largura e altura da tela do aparelho na cena, em px da mídia do
   * enquadramento: o retângulo da tela na arte (`node
   * scripts/hero-notebook/geo.js '{}' media`, o notebook, 16:10, e `…
   * mediaRetrato`, o celular, 390 × 844). A tela da janela tem a proporção da
   * janela (Q13) e fica presa pelo pé da tela da arte (`cy + altura / 2`),
   * onde a moldura em vetor encontra a base ou o suporte (ver `telaNaCena`).
   */
  aparelho: {
    deitado: {
      cx: 640,
      cy: 359.7,
      largura: 295.2,
      altura: 184.5,
      /** A borda da tampa e o aro (px da mídia, o aparelhoVetor.json; o cena.test.ts confere). */
      moldura: { lado: 15.78, topo: 12.12, queixo: 23.68, aro: 1.69 },
      /** O pé da base (a sombra de contato), abaixo do pé da tela, em px da mídia. */
      pe: 150,
      /**
       * Na pausa, o centro de cada metade do título, em y da mídia: a linha 1
       * no vidro escuro da janela, acima da caixa do Replay (o topo dela fica
       * em y 368), e a linha 2 na parede, acima da caneca. A 1440 × 900 é a
       * altura do layout (o h1 centrado no palco).
       */
      tituloY: [328.4, 391.6],
    },
    emPe: {
      cx: 360,
      cy: 640,
      largura: 191.2,
      altura: 413.78,
      /** A borda do corpo e o aro (px da mídia, o aparelhoVetor.json). */
      moldura: { lado: 8.75, topo: 10.43, queixo: 10.43, aro: 2.06 },
      /** O pé do suporte (a sombra de contato), abaixo do pé da tela, em px da mídia. */
      pe: 92,
    },
  },
  /** O quadro no início da expansão, em px. */
  quadroInicial: { w: 300, h: 400 },
} as const;

/** A mídia de um enquadramento: o tamanho, em px, e o `object-position` do cover (0 a 1). */
export type Midia = { w: number; h: number; posX: number; posY: number };

/**
 * O que a câmera usa de um enquadramento: a mídia e a tela do aparelho nela (px
 * da mídia). Com `altura`, a tela fica presa pelo pé (`cy + altura / 2`); sem
 * ela, pelo centro (`cy`).
 */
export type Cena = {
  midia: Midia;
  aparelho: {
    cx: number;
    cy: number;
    largura: number;
    altura?: number;
    /** A borda e o aro em volta da tela (px da mídia); sem ela, a moldura é a própria tela. */
    moldura?: { lado: number; topo: number; queixo: number; aro: number };
    /** O pé da base ou do suporte, abaixo do pé da tela (px da mídia). */
    pe?: number;
    /** Deitado: o centro de cada metade do título na pausa, em y da mídia. */
    tituloY?: readonly [number, number];
  };
};

/** A cena do enquadramento atual: notebook deitado ou celular em pé (Q26). */
export function cenaDe(v: Viewport): Cena {
  const chave = v.emPe ? "emPe" : "deitado";
  return { midia: ENTRADA.midia[chave], aparelho: ENTRADA.aparelho[chave] };
}

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
 * A tela da janela tem a largura da tela da arte e a proporção da janela: na
 * mídia, a altura dela é `largura · v.h / v.w`. Ela fica presa pelo pé da tela
 * da arte (`cy + altura / 2`): numa janela mais larga que a arte, a tampa fica
 * mais baixa; numa mais estreita, mais alta; e o pé da moldura, onde ficam a
 * base do notebook e o suporte do celular, nunca sai do lugar vazio da mesa
 * (Review Focus 2). Na proporção da arte, o centro é o `cy` dela.
 *
 * O quadro fica centrado na janela. A mídia cobre o quadro como o CSS faz
 * (`object-fit: cover; object-position: 50% 100%`): `m` é a escala do cover e a
 * origem do conteúdo, dentro do quadro, é `((qw − w·m)·posX, (qh − h·m)·posY)`.
 * A mídia e a tela do aparelho são as do enquadramento (`cenaDe`).
 */
export function telaNaCena(e: number, v: Viewport, cena: Cena = cenaDe(v)): { cx: number; cy: number; s: number } {
  const q = quadro(e, v);
  const { midia, aparelho: tela } = cena;
  const m = Math.max(q.w / midia.w, q.h / midia.h);
  const cyNaMidia = tela.altura === undefined ? tela.cy : tela.cy + (tela.altura - (tela.largura * v.h) / v.w) / 2;
  const esquerdaDoQuadro = (v.w - q.w) / 2;
  const topoDoQuadro = (v.h - q.h) / 2;
  const origemX = (q.w - midia.w * m) * midia.posX;
  const origemY = (q.h - midia.h * m) * midia.posY;
  return {
    cx: esquerdaDoQuadro + origemX + tela.cx * m,
    cy: topoDoQuadro + origemY + cyNaMidia * m,
    s: (tela.largura * m) / v.w,
  };
}

/**
 * A câmera em `p`: a tela parte de onde a expansão a deixou (`telaNaCena`) e
 * chega à janela inteira. O centro anda linear em `k`; a escala, multiplicativa
 * (`s0^(1−k)`), para o zoom parecer uniforme. A sala amplia em volta da tela
 * da pausa e é puxada junto, para o ponto da tela nela acompanhar a tela.
 */
export function camera(p: number, v: Viewport, cena: Cena = cenaDe(v)): Camera {
  const { e, a } = fases(p);
  const k = suave(a);
  const { salaZoomMax, salaBlurMax, tituloSaidaAte } = ENTRADA;

  const inicio = telaNaCena(e, v, cena);
  const tela = {
    cx: inicio.cx + (v.w / 2 - inicio.cx) * k,
    cy: inicio.cy + (v.h / 2 - inicio.cy) * k,
    s: Math.pow(inicio.s, 1 - k),
  };

  // A sala só se mexe na aproximação, quando e = 1: a origem é a tela da pausa.
  const naPausa = telaNaCena(1, v, cena);
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

/** Um y da mídia do enquadramento, em px da janela, com a expansão completa (o quadro é a janela). */
function yNaJanela(y: number, v: Viewport, { midia }: Cena): number {
  const m = Math.max(v.w / midia.w, v.h / midia.h);
  return (v.h - midia.h * m) * midia.posY + y * m;
}

/**
 * A moldura do aparelho na pausa, em px da janela: as bordas de fora (a borda
 * de vidro e a metade de fora do aro, como o CSS a desenha em volta da tela)
 * e o pé do aparelho (o fundo da base ou do suporte, com a sombra de contato).
 */
export function molduraNaPausa(
  v: Viewport,
  cena: Cena = cenaDe(v),
): { esquerda: number; direita: number; topo: number; pe: number } {
  const tela = telaNaCena(1, v, cena);
  const { aparelho } = cena;
  // 1 px da mídia em px da janela: a tela da janela tem a largura da tela da arte.
  const px = (tela.s * v.w) / aparelho.largura;
  const { lado = 0, topo = 0, aro = 0 } = aparelho.moldura ?? {};
  const meiaLargura = (tela.s * v.w) / 2;
  const meiaAltura = (tela.s * v.h) / 2;
  return {
    esquerda: tela.cx - meiaLargura - (lado + aro / 2) * px,
    direita: tela.cx + meiaLargura + (lado + aro / 2) * px,
    topo: tela.cy - meiaAltura - (topo + aro / 2) * px,
    pe: tela.cy + meiaAltura + (aparelho.pe ?? 0) * px,
  };
}

/** O que o layout dá de cada metade do título: o centro vertical (px do palco) e a altura, sem transform. */
export type LayoutDoTitulo = { centros: [number, number]; alturas: [number, number] };

/**
 * As metades do título na pausa: o deslocamento X e Y (px) de cada uma e a
 * escala das duas. No layout cada linha é centrada na janela, com o centro
 * vertical em `layout.centros`. A folga até a moldura do aparelho é a maior
 * entre a fixa (`tituloFolgaLado` deitado, `tituloFolga` em pé) e
 * `tituloFolgaRelativa` da largura da moldura.
 *
 * - **Deitado (Q19):** as metades ladeiam a moldura do notebook: a linha 1
 *   termina a folga à esquerda dela e a linha 2 começa a folga à direita. A
 *   escala encolhe as duas por igual em volta dessas bordas (o CSS põe a
 *   origem do transform na direita da linha 1 e na esquerda da linha 2), para
 *   cada uma caber entre a moldura e a janela útil (`tituloMargemLado`), com o
 *   pior dos dois lados. Na altura, o centro de cada uma vai para o
 *   `tituloY` da mídia (a linha 1 no vidro escuro da janela, acima da caixa
 *   do Replay), em qualquer proporção.
 * - **Em pé:** ao lado do celular não cabe um h1 legível (sobravam ~9 px de
 *   corpo a 390 px). As metades ficam centradas, a linha 1 a folga acima da
 *   moldura (na janela escura) e a linha 2 no meio da mesa entre o pé do
 *   suporte e o pé do palco (longe da luz do abajur, que bate junto do
 *   suporte), nunca a menos da folga dele; a escala só encolhe a que não
 *   cabe entre as margens (o CSS põe a origem no meio).
 *
 * Largura não medida (zero, como no jsdom) não desloca essa linha nem pede
 * escala; altura não medida não desloca na vertical.
 */
export function posicaoDoTitulo(
  v: Viewport,
  larguras: [number, number],
  layout: LayoutDoTitulo = { centros: [0, 0], alturas: [0, 0] },
  cena: Cena = cenaDe(v),
): { x: [number, number]; y: [number, number]; escala: number } {
  const { tituloFolga, tituloFolgaLado, tituloFolgaRelativa, tituloMargem, tituloMargemLado } = ENTRADA;
  const moldura = molduraNaPausa(v, cena);
  const folga = Math.max(v.emPe ? tituloFolga : tituloFolgaLado, tituloFolgaRelativa * (moldura.direita - moldura.esquerda));
  const [larguraLinha1, larguraLinha2] = larguras;
  const { centros, alturas } = layout;
  const cabe = (livre: number, largura: number) => (largura > 0 ? livre / largura : 1);

  if (v.emPe) {
    const livre = v.w - 2 * tituloMargem;
    const escala = Math.max(0, Math.min(1, cabe(livre, larguraLinha1), cabe(livre, larguraLinha2)));
    return {
      x: [0, 0],
      y: [
        alturas[0] > 0 ? moldura.topo - folga - (alturas[0] * escala) / 2 - centros[0] : 0,
        alturas[1] > 0
          ? Math.max(moldura.pe + folga + (alturas[1] * escala) / 2, (moldura.pe + v.h) / 2) - centros[1]
          : 0,
      ],
      escala,
    };
  }

  const livreEsquerda = moldura.esquerda - folga - tituloMargemLado;
  const livreDireita = v.w - moldura.direita - folga - tituloMargemLado;
  const escala = Math.min(1, cabe(livreEsquerda, larguraLinha1), cabe(livreDireita, larguraLinha2));
  const alvo = cena.aparelho.tituloY;
  return {
    x: [
      larguraLinha1 > 0 ? moldura.esquerda - folga - (v.w / 2 + larguraLinha1 / 2) : 0,
      larguraLinha2 > 0 ? moldura.direita + folga - (v.w / 2 - larguraLinha2 / 2) : 0,
    ],
    y: [
      alvo && alturas[0] > 0 ? yNaJanela(alvo[0], v, cena) - centros[0] : 0,
      alvo && alturas[1] > 0 ? yNaJanela(alvo[1], v, cena) - centros[1] : 0,
    ],
    escala: Math.max(0, escala),
  };
}
