"use client";

/*
 * PRÉVIA APROVADA PARA HOMOLOGAÇÃO (13/10/2026) — protótipo do fio condutor
 * (conceito "Costura", tratamento A "Estrutura"). Não é a versão definitiva:
 * a definitiva é CSS de rolagem atrás do conteúdo, pela spec em pausa no
 * branch docs/s1-a-spec-fio (docs/superpowers/specs/2026-10-13-fio-condutor-design.md).
 * Ligado por padrão; ?fio=off desliga; ?trat=plano mostra o tratamento B.
 * &gravar=1 ignora o prefers-reduced-motion só no fio (gravação dos vídeos).
 */

import { useEffect } from "react";

type P = [number, number];
type Box = { x: number; y: number; w: number; h: number; r: number; b: number };

const C = {
  cyan: "#00D1D8",
  cyan300: "#5FE3E8",
  e500: "#0185E7",
  e700: "#0166D2",
  n950: "#08121D",
  n800: "#15273B",
  n700: "#1E3550",
  n600: "#2A4766",
  n900: "#0E1C2B",
  n500: "#3D5E80",
  n50: "#F1F5F8",
  e900: "#063F82",
  n300: "#8EA6BE",
  n200: "#BFCEDC",
  n100: "#DFE7EF",
};

// Símbolo (public/brand/strukti-simbolo-*.svg), em coordenadas do viewBox 424 258 406 498.
const SYM_C: P = [627, 507];
const PIECES = {
  A: "M428.42 362.67L622.58 260.33Q627.00 258.00 631.42 260.33L747.58 321.57Q752.00 323.90 747.47 326.01L428.53 474.39Q424.00 476.50 424.00 471.50L424.00 370.00Q424.00 365.00 428.42 362.67Z",
  B: "M778.32 337.73L825.58 362.67Q830.00 365.00 830.00 370.00L830.00 500.00Q830.00 505.00 825.45 502.92L621.85 409.78Q617.30 407.70 621.84 405.60L769.36 337.50Q773.90 335.40 778.32 337.73Z",
  Ct: "M437.14 484.10L558.96 427.70Q563.50 425.60 568.04 427.69L830.00 548.40L699.10 609.00L437.14 488.29Q432.60 486.20 437.14 484.10Z",
  Cf: "M699.10 609.00L830.00 548.40L830.00 644.00Q830.00 649.00 825.58 651.33L703.52 715.67Q699.10 718.00 699.10 713.00L699.10 609.00Z",
  D: "M428.57 525.83L672.43 634.17Q677.00 636.20 677.00 641.20L677.00 724.70Q677.00 729.70 672.57 732.03L631.43 753.67Q627.00 756.00 622.58 753.67L428.42 651.33Q424.00 649.00 424.00 644.00L424.00 528.80Q424.00 523.80 428.57 525.83Z",
};
const HEX: P[] = [
  [627, 258],
  [830, 365],
  [830, 649],
  [627, 756],
  [424, 649],
  [424, 365],
  [627, 258],
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (v: number, a: number, b: number) => (b <= a ? (v >= b ? 1 : 0) : clamp((v - a) / (b - a)));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const f1 = (n: number) => n.toFixed(1);

function polyLen(p: P[]) {
  let l = 0;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1];
    const b = p[i];
    if (a && b) l += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return l;
}
/** Os pontos da polilinha até a fração t do comprimento (e a ponta). */
function polyPart(p: P[], t: number): { pts: P[]; head: P } {
  const first = p[0];
  if (!first) return { pts: [], head: [0, 0] };
  const total = polyLen(p);
  let left = clamp(t) * total;
  const out: P[] = [first];
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1];
    const b = p[i];
    if (!a || !b) continue;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left >= seg) {
      out.push(b);
      left -= seg;
    } else {
      const k = seg === 0 ? 0 : left / seg;
      const q: P = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      out.push(q);
      return { pts: out, head: q };
    }
  }
  return { pts: out, head: out[out.length - 1] ?? first };
}
const pathOf = (p: P[]) => (p.length < 2 ? "" : "M" + p.map((q) => `${f1(q[0])} ${f1(q[1])}`).join("L"));

function docBox(el: Element | null | undefined): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, r: r.right + scrollX, b: r.bottom + scrollY };
}

type Layout = ReturnType<typeof measure>;

/** Para a gravação: scroll final e quadros-chave (rótulo, scroll). */
let marcos: { fim: number; lista: (string | number)[][]; comparar?: number[] } | null = null;

function measure() {
  const vw = document.documentElement.clientWidth;
  const vh = innerHeight;
  const mobile = vw < 768;
  const desk = vw >= 1024;
  const hero = docBox(document.querySelector("#inicio"))!;
  const quadro = docBox(document.querySelector(".hero-estudio__quadro"))!;
  const cont = document.querySelector("#produtos .container")!;
  const cb = docBox(cont)!;
  const cs = getComputedStyle(cont);
  const contentL = cb.x + parseFloat(cs.paddingLeft);
  const contentR = cb.r - parseFloat(cs.paddingRight);
  const laneR = (contentR + vw) / 2;
  const laneL = contentL / 2;
  const sec = (sel: string) => docBox(document.querySelector(sel))!;
  const produtos = sec("#produtos");
  const duvidas = sec("#duvidas");
  const aplic = docBox(document.querySelector("#aplicativos")) ?? produtos;
  const sob = sec("#sob-medida");
  const como = docBox(document.querySelector("#sob-medida")?.nextElementSibling)!;
  const equipe = sec("#equipe");
  const contato = sec("#contato");
  const form = sec("#contato .form-card");
  const contatoText = docBox(document.querySelector("#contato h2")?.parentElement);
  const aplicCont = docBox(document.querySelector("#aplicativos > .container")) ?? sec("#produtos > .container");
  const sobCont = sec("#sob-medida > .container");
  const equipeCont = sec("#equipe > .container");
  const walls = Array.from(document.querySelectorAll<HTMLElement>("#aplicativos .wall, #equipe .wall"));
  return { vw, vh, mobile, desk, duvidas, hero, quadro, contentL, contentR, laneR, laneL, produtos, aplic, sob, como, equipe, contato, form, contatoText, aplicCont, sobCont, equipeCont, walls };
}

/** Posição e escala do símbolo do hero (sticky emulado no computador). */
function heroSymbol(L: Layout, sy: number) {
  const symH = L.mobile ? Math.min(L.quadro.h * 0.66, 300) : Math.min(L.quadro.h * 0.62, 470);
  const s = symH / 498;
  const cx = L.quadro.x + L.quadro.w / 2;
  const cy0 = L.quadro.y + L.quadro.h * 0.5;
  // Ponta da cauda: no pé do quadro, na pista da direita.
  const tailEnd0 = L.quadro.b - 6;
  const maxShift = Math.max(0, L.hero.b - 2 - tailEnd0);
  const end = Math.max(maxShift, L.vh * 0.5);
  const shift = clamp(sy, 0, maxShift);
  const p = clamp(sy / end);
  return { s, cx, cy: cy0 + shift, tailEnd: tailEnd0 + shift, laneStart: tailEnd0 + maxShift, p, end, shift, bandBottom: L.quadro.b + shift };
}
/** Celular: faixa opaca presa atrás do símbolo; o texto do hero passa por baixo dela. */
function mobileBand(L: Layout, g: ReturnType<typeof heroSymbol>) {
  if (!L.mobile) return "";
  return `<rect x="0" y="${f1(g.shift)}" width="${L.vw}" height="${f1(g.bandBottom - g.shift)}" fill="${C.n950}"/>
  <rect x="0" y="${f1(g.bandBottom)}" width="${L.vw}" height="32" fill="url(#fio-faixa)"/>`;
}
const symPt = (g: { s: number; cx: number; cy: number }, q: P): P => [g.cx + (q[0] - SYM_C[0]) * g.s, g.cy + (q[1] - SYM_C[1]) * g.s];

const DEFS = `
<defs>
  <filter id="fio-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="fio-glow-forte" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
  <linearGradient id="fio-faixa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08121D"/><stop offset="1" stop-color="#08121D" stop-opacity="0"/></linearGradient>
  <radialGradient id="fio-luz"><stop offset="0" stop-color="${C.e700}" stop-opacity=".55"/><stop offset=".55" stop-color="${C.e700}" stop-opacity=".16"/><stop offset="1" stop-color="${C.e700}" stop-opacity="0"/></radialGradient>
  <linearGradient id="sA" gradientUnits="userSpaceOnUse" x1="690" y1="275" x2="440" y2="470"><stop offset="0" stop-color="#0B8EF5"/><stop offset="1" stop-color="#0366DA"/></linearGradient>
  <linearGradient id="sB" gradientUnits="userSpaceOnUse" x1="620" y1="405" x2="830" y2="470"><stop offset="0" stop-color="#01B0CF"/><stop offset="1" stop-color="#0CD8D9"/></linearGradient>
  <linearGradient id="sD" gradientUnits="userSpaceOnUse" x1="440" y1="530" x2="640" y2="750"><stop offset="0" stop-color="#0BCDD8"/><stop offset="1" stop-color="#0468D3"/></linearGradient>
  <linearGradient id="sCt" gradientUnits="userSpaceOnUse" x1="440" y1="480" x2="830" y2="560"><stop offset="0" stop-color="#DCE6F0"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
  <linearGradient id="sCtClaro" gradientUnits="userSpaceOnUse" x1="440" y1="480" x2="830" y2="560"><stop offset="0" stop-color="#192D41"/><stop offset="1" stop-color="#283D53"/></linearGradient>
</defs>`;
const FILL: Record<string, string> = { A: "url(#sA)", B: "url(#sB)", Ct: "url(#sCt)", Cf: "#9FB4C9", D: "url(#sD)" };
const FILL_CLARO: Record<string, string> = { ...FILL, Ct: "url(#sCtClaro)", Cf: "#15273B" };

// Direções da vista explodida: nada vai para a esquerda no computador (lá está o texto do hero).
const DIR_DESK: Record<keyof typeof PIECES, P> = { A: [-0.3, -0.95], B: [0.95, -0.3], Ct: [0.87, 0.5], Cf: [0.87, 0.5], D: [-0.15, 0.99] };
const DIR_MOB: Record<keyof typeof PIECES, P> = { A: [-0.92, -0.38], B: [0.92, -0.38], Ct: [0.92, 0.38], Cf: [0.92, 0.38], D: [-0.92, 0.38] };

/** Avança em compassos: em cada um, move (acelera e assenta) e depois pausa. */
function beats(t: number, n: number, move = 0.68) {
  t = clamp(t);
  if (t >= 1) return 1;
  const m = Math.floor(t * n);
  const f = t * n - m;
  return (m + (f < move ? easeInOut(f / move) : 1)) / n;
}
/* ------------------------------------------------------------------ */
/* Costura v3 (rodada 2, correção de rumo): "estrutura" e "plano"       */
/* Fio contínuo; nos clímax ele vira estrutura. Sem brilho, sem degradê */
/* na linha, poucas cores; ritmo: acelera, freia seco, assenta com peso.*/
/* ------------------------------------------------------------------ */
type Trat3 = "estrutura" | "plano";
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

/** Acelera, freia seco e assenta com peso (passa 2,5% e volta). */
function heavy(t: number) {
  t = clamp(t);
  if (t < 0.6) {
    const k = t / 0.6;
    return 1.025 * k * k * k;
  }
  if (t < 0.78) return 1.025 - 0.035 * easeOut((t - 0.6) / 0.18);
  return 0.99 + 0.01 * easeInOut((t - 0.78) / 0.22);
}
/** Impulso curto depois de um impacto (o conjunto recua e volta). */
const kick = (v: number, a: number, len: number) => {
  const t = (v - a) / len;
  return t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t) * (1 - t);
};
const polyg = (pts: P[], fill: string) => `<polygon points="${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join(" ")}" fill="${fill}"/>`;

/** Viga isométrica: face da frente, topo a 30° e a ponta direita. */
function beam(x0: number, x1: number, yTop: number, th: number, depth: number, cTop: string, cFront: string, cEnd: string) {
  if (x1 - x0 <= 0.5) return "";
  const dx = depth * COS30;
  const dy = depth * SIN30;
  let s = "";
  if (depth > 0.3) s += polyg([[x0, yTop], [x1, yTop], [x1 + dx, yTop - dy], [x0 + dx, yTop - dy]], cTop);
  s += polyg([[x0, yTop], [x1, yTop], [x1, yTop + th], [x0, yTop + th]], cFront);
  if (depth > 0.3) s += polyg([[x1, yTop], [x1 + dx, yTop - dy], [x1 + dx, yTop - dy + th], [x1, yTop + th]], cEnd);
  return s;
}
/** Cubo isométrico (o ponto final), apoiado em (x, y). */
function cube(x: number, y: number, a: number, cTop: string, cRight: string, cLeft: string) {
  const dx = a * COS30;
  const dy = a * SIN30;
  const top: P[] = [[x, y - a - 2 * dy], [x + dx, y - a - dy], [x, y - a], [x - dx, y - a - dy]];
  const right: P[] = [[x, y - a], [x + dx, y - a - dy], [x + dx, y - dy], [x, y]];
  const left: P[] = [[x, y - a], [x - dx, y - a - dy], [x - dx, y - dy], [x, y]];
  return polyg(top, cTop) + polyg(right, cRight) + polyg(left, cLeft);
}

function renderCosturaV3(L: Layout, sy: number, trat: Trat3) {
  const plano = trat === "plano";
  const H = L.vh * 0.72;
  const g = heroSymbol(L, sy);
  const p = g.p;
  const onDark = C.cyan;
  const onPaper = C.e700;
  const W = plano ? 6 : 3;
  const lineSvg = (pts: P[], color: string, w = W) =>
    pts.length < 2 ? "" : `<path d="${pathOf(pts)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter"/>`;
  // cabeça do fio: um losango isométrico, sem brilho
  const node = (q: P, color: string) => {
    const r = plano ? 8 : 6.5;
    return polyg([[q[0], q[1] - r], [q[0] + r * COS30, q[1]], [q[0], q[1] + r], [q[0] - r * COS30, q[1]]], color);
  };
  let out = mobileBand(L, g);

  // ---------------- 01: o símbolo grande, montado com força ----------------
  const symH = L.mobile ? Math.min(L.quadro.h * 0.86, (L.vw - 48) / 0.815, 420) : Math.min(L.quadro.h * 0.84, L.vh * 0.74, 640);
  const s = symH / 498;
  const sym = { s, cx: g.cx, cy: g.cy };
  const DIRS = L.mobile ? DIR_MOB : DIR_DESK;
  const fly = (L.mobile ? 460 : 1000) / s; // de fora da tela, em unidades do símbolo
  const plan: { ks: (keyof typeof PIECES)[]; a: number; b: number; dir: P }[] = [
    { ks: ["Ct", "Cf"], a: 0.06, b: 0.22, dir: DIRS.Ct },
    { ks: ["A"], a: 0.22, b: 0.38, dir: DIRS.A },
    { ks: ["B"], a: 0.38, b: 0.54, dir: DIRS.B },
    { ks: ["D"], a: 0.54, b: 0.7, dir: DIRS.D },
  ];
  // recuo do conjunto a cada impacto
  let rx = 0;
  let ry = 0;
  for (const st of plan) {
    const hit = st.a + (st.b - st.a) * 0.6;
    const k = kick(p, hit, 0.07) * (L.mobile ? 4 : 7);
    rx += st.dir[0] * k;
    ry += st.dir[1] * k;
  }
  const fills = plano ? FILL_CLARO : FILL;
  if (plano) {
    // um plano claro (papel) entra pela direita e recebe o símbolo: contraste forte
    const t = heavy(range(p, 0.0, 0.12));
    if (L.mobile) {
      const top = L.quadro.y + 6;
      const bot = L.quadro.b - 6;
      const x0 = L.vw * (1 - t);
      out += polyg([[x0, top], [L.vw + 1, top], [L.vw + 1, bot], [x0 - 0, bot]], C.n50);
    } else {
      const top = g.cy - symH * 0.66;
      const bot = g.cy + symH * 0.66;
      const left = g.cx - symH * 0.815 * 0.6;
      const x0 = left + (L.vw + 40 - left) * (1 - t);
      out += polyg([[x0, top], [L.vw + 1, top], [L.vw + 1, bot], [x0, bot]], C.n50);
    }
  } else {
    out += `<circle cx="${f1(g.cx)}" cy="${f1(g.cy)}" r="${f1(symH * 0.62)}" fill="url(#fio-luz)" opacity="0.45"/>`;
  }
  let inner = "";
  // o molde: os lugares das peças, tom sobre tom, e a planta do hexágono
  const mold = plano ? C.n100 : C.n900;
  for (const k of ["A", "B", "Ct", "Cf", "D"] as const) inner += `<path d="${PIECES[k]}" fill="${mold}"/>`;
  inner += `<path d="${pathOf(HEX)}" fill="none" stroke="${plano ? C.n200 : C.n600}" stroke-width="${f1(1.2 / s)}" opacity="${(1 - range(p, 0.1, 0.5)).toFixed(2)}"/>`;
  for (const st of plan) {
    const t = range(p, st.a, st.b);
    if (t <= 0) continue;
    const o = fly * (1 - heavy(t));
    for (const k of st.ks) inner += `<path d="${PIECES[k]}" fill="${fills[k]}" transform="translate(${f1(st.dir[0] * o)} ${f1(st.dir[1] * o)})"/>`;
  }
  out += `<g transform="translate(${f1(sym.cx + rx)} ${f1(sym.cy + ry)}) scale(${s.toFixed(4)}) translate(${-SYM_C[0]} ${-SYM_C[1]})">${inner}</g>`;
  const top0 = symPt(sym, [627, 258]);
  if (p < 0.06) out += node(top0, C.e500);

  // saída: do vértice de baixo, a 30°, até a pista; dois compassos
  const bottom = symPt(sym, [627, 756]);
  const kneeY = bottom[1] + Math.abs(L.laneR - bottom[0]) * 0.577;
  const tailPts: P[] = [bottom, [L.laneR, kneeY], [L.laneR, Math.max(kneeY, g.tailEnd)]];
  const tailT = beats(range(p, 0.8, 1), 2);
  if (tailT > 0) {
    const tp = polyPart(tailPts, tailT);
    out += lineSvg(tp.pts, onDark);
    if (tailT < 1) out += node(tp.head, onDark);
  }

  // ---------------- do hero ao contato ----------------
  type Seg = { pts: P[]; s0: number; s1: number; color: string; follow?: boolean; beats?: number };
  const segs: Seg[] = [];
  let last = g.end;
  const push = (pts: P[], s0: number, s1: number, color: string, o: Partial<Seg> = {}) => {
    const a = Math.max(s0, last);
    const b = Math.max(s1, a + 1);
    segs.push({ pts, s0: a, s1: b, color, ...o });
    last = b;
  };
  const vertical = (x: number, y0: number, y1: number, color: string) => push([[x, y0], [x, y1]], y0 - H, y1 - H, color, { follow: true });
  const y0 = g.laneStart;
  const yB = L.sob.y;
  vertical(L.laneR, y0, yB, onDark);
  // T3: janela longa, com compassos
  const t3s0 = yB - L.vh * 0.88;
  const t3s1 = yB - L.vh * 0.22;
  last = Math.max(last, t3s1);
  const t3 = range(sy, t3s0, t3s1);
  vertical(L.laneL, yB, L.como.y, onPaper);
  push([[L.laneL, L.como.y], [L.laneR, L.como.y]], L.como.y - H, L.como.y - H + L.vh * 0.18, onPaper, { beats: 1 });
  vertical(L.laneR, L.como.y, L.equipe.y, onPaper);
  push([[L.laneR, L.equipe.y], [L.laneL, L.equipe.y]], L.equipe.y - H, L.equipe.y - H + L.vh * 0.18, onPaper, { beats: 1 });
  vertical(L.laneL, L.equipe.y, L.duvidas.y, onPaper);
  push([[L.laneL, L.duvidas.y], [L.laneR, L.duvidas.y]], L.duvidas.y - H, L.duvidas.y - H + L.vh * 0.18, onPaper, { beats: 1 });
  vertical(L.laneR, L.duvidas.y, L.contato.y, onPaper);
  // contato: a régua leva o fio até a borda do formulário
  const ex = 20 * COS30; // extrusão do cartão (estrutura)
  const ey = 20 * SIN30;
  const fr = L.form;
  const xr = plano ? fr.x - 17 : Math.min(L.vw - 4, fr.r + ex);
  push([[L.laneR, L.contato.y], [xr, L.contato.y]], L.contato.y - H, L.contato.y - H + L.vh * 0.2, onPaper, { beats: 1 });
  vertical(xr, L.contato.y, fr.y, onPaper);
  const cS0 = fr.y - L.vh * 0.8;
  const cS1 = fr.b - L.vh * 0.3;

  let headAt: { q: P; color: string } | null = null;
  for (const sg of segs) {
    const t = range(sy, sg.s0, sg.s1);
    if (t <= 0) break;
    const part = polyPart(sg.pts, sg.follow ? t : heavy(t));
    out += lineSvg(part.pts, sg.color);
    headAt = { q: part.head, color: sg.color };
  }

  // ---------------- T3: a virada vira estrutura ----------------
  if (t3 > 0) {
    if (!plano) {
      // viga isométrica de borda a borda, montada em blocos que chegam pela direita e travam com peso
      const N = L.mobile ? 4 : 8;
      const w = L.vw / N;
      const sink = heavy(range(t3, 0.8, 1));
      const th = (L.mobile ? 20 : 32) * (1 - sink) + 3 * sink;
      const depth = (L.mobile ? 16 : 26) * (1 - sink);
      let jolt = 0;
      for (let i = 0; i < N; i++) {
        const a = 0.24 + (i * 0.4) / N;
        const hit = a + 0.16 * 0.6;
        jolt += kick(t3, hit, 0.05) * 3;
      }
      const yTop = yB - th / 2 + jolt;
      for (let i = 0; i < N; i++) {
        const a = 0.24 + (i * 0.4) / N;
        const t = range(t3, a, a + 0.16);
        if (t <= 0) continue;
        const off = (L.vw + 60) * (1 - heavy(t));
        const x1 = L.vw - i * w + off;
        const x0 = x1 - w + (i === N - 1 ? 0 : 0);
        out += beam(Math.max(-2, x0), x1, yTop, th, depth, C.cyan, C.e700, C.n800);
      }
    } else {
      // um corte: plano elétrico de borda a borda, com as pontas a 60°, que varre e depois fecha no fio
      const hP0 = L.mobile ? 44 : 84;
      const close = heavy(range(t3, 0.78, 1));
      const hP = hP0 * (1 - close) + 6 * close;
      const k = hP * 0.577;
      const sweep = heavy(range(t3, 0.24, 0.62));
      const xA = L.vw + k - (L.vw + 2 * k) * sweep;
      const top = yB - hP / 2;
      out += polyg([[xA, top], [L.vw + k, top], [L.vw, top + hP], [xA - k, top + hP]], C.e700);
    }
  }

  // ---------------- contato: o fio vira peça ----------------
  const ct = range(sy, cS0, cS1);
  if (ct > 0) {
    if (!plano) {
      // o cartão do formulário ganha espessura: a face da direita cresce com a rolagem, a de baixo trava, e um cubo assenta no canto
      const press = heavy(range(ct, 0.92, 1));
      const kx = 1 - 0.3 * press;
      const exx = ex * kx;
      const eyy = ey * kx;
      const grow = range(ct, 0.08, 0.72);
      const yy = fr.y + fr.h * grow;
      out += polyg([[fr.r, fr.y], [fr.r + exx, fr.y + eyy], [fr.r + exx, yy + eyy], [fr.r, yy]], C.e700);
      const bt = heavy(range(ct, 0.72, 0.82));
      if (bt > 0) {
        const xs = fr.r - fr.w * bt;
        out += polyg([[xs, fr.b], [fr.r, fr.b], [fr.r + exx, fr.b + eyy], [xs + exx, fr.b + eyy]], C.e900);
      }
      if (grow > 0 && grow < 1) out += node([fr.r + exx, yy + eyy], onPaper);
      const cb = range(ct, 0.82, 0.92);
      if (cb > 0) {
        const a = L.mobile ? 14 : 20;
        const drop = (1 - heavy(cb)) * 120;
        out += cube(fr.x + exx * 0.5, fr.b + eyy + a * 0.2 - drop + 3 * press, a, C.e500, C.e700, C.e900);
      }
    } else {
      // um L elétrico emoldura o formulário por fora (esquerda e base) e o ponto assenta
      const tk = L.mobile ? 8 : 14;
      const lx = fr.x - 10 - tk;
      const grow = range(ct, 0.08, 0.72);
      const yy = fr.y + (fr.h + 10) * grow;
      out += polyg([[lx, fr.y], [lx + tk, fr.y], [lx + tk, yy], [lx, yy]], C.e700);
      const bt = heavy(range(ct, 0.72, 0.86));
      if (bt > 0) {
        const xe = lx + (fr.r + 10 - lx) * bt;
        out += polyg([[lx, fr.b + 10], [xe, fr.b + 10], [xe, fr.b + 10 + tk], [lx, fr.b + 10 + tk]], C.e700);
      }
      const dt = range(ct, 0.86, 0.96);
      if (dt > 0) out += `<circle cx="${f1(fr.r + 10 + tk)}" cy="${f1(fr.b + 10 + tk / 2)}" r="${f1(tk * 0.75 * heavy(dt))}" fill="${C.e500}"/>`;
    }
  }

  // cabeça do fio nas pistas
  if (headAt && (t3 <= 0 || t3 >= 1) && ct <= 0) out += node(headAt.q, headAt.color);

  marcos = {
    fim: cS1 + L.vh * 0.15,
    lista: [
      ["1 · 01: o molde vazio", 0],
      ["2 · 01: a primeira peça bate e o conjunto recua", g.end * 0.2],
      ["3 · 01: as peças chegam de fora da tela", g.end * 0.47],
      ["4 · 02: Produtos, os 3 cartões", L.produtos.y + L.produtos.h * 0.4 - H],
      ["5 · 02 → 03: a viga atravessa a tela", t3s0 + (t3s1 - t3s0) * 0.55],
      ["6 · 06: Dúvidas, a régua", L.duvidas.y - H + L.vh * 0.1],
      ["7 · 07: o formulário ganha espessura", cS0 + (cS1 - cS0) * 0.6],
      ["8 · 07: o cubo assenta no canto", cS1 + L.vh * 0.1],
    ],
    comparar: [g.end * 0.47, t3s0 + (t3s1 - t3s0) * 0.55, cS0 + (cS1 - cS0) * 0.88],
  };
  return { svg: out, defs: "" };
}

const CSS = `
html[data-fio] .hero-estudio__quadro picture,
html[data-fio] .hero-estudio__canvas,
html[data-fio] .hero-estudio__selo { visibility: hidden; }
nextjs-portal { display: none !important; }
html[data-fio] .produtos > .produto:nth-child(2) { display: none; }
html[data-fio] .produtos { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 1024px) {
  html[data-fio] .produtos > .produto:first-child { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); align-items: center; column-gap: var(--space-7); padding: var(--space-6); }
}
@media (min-width: 768px) {
  html[data-fio] .hero-estudio__textos { padding-bottom: calc(var(--space-7) + 45svh); }
}
.fio-overlay { position: absolute; left: 0; top: 0; width: 1px; height: 1px; overflow: visible; pointer-events: none; z-index: 40; }
`;

export function FioPrototipo() {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Prévia aprovada (13/10): o fio fica ligado por padrão; ?fio=off desliga.
    const mode = params.get("fio") ?? "costura";
    if (mode !== "costura") return;
    const gravar = params.has("gravar");
    const trat = params.get("trat") ?? "estrutura";
    // Só com o hero estudio e as peças que o fio mede (nos heros "video" e "classic", nada).
    if (!document.querySelector(".hero-estudio__quadro") || !document.querySelector("#produtos .container") || !document.querySelector("#contato .form-card")) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches && !gravar;
    document.documentElement.dataset.fio = mode;
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "fio-overlay");
    svg.setAttribute("aria-hidden", "true");
    document.body.appendChild(svg);

    let raf = 0;
    const draw = () => {
      raf = 0;
      const L = measure();
      const sy = reduce ? 1e7 : scrollY;
      const r = renderCosturaV3(L, sy, trat === "plano" ? "plano" : "estrutura");
      svg.innerHTML = DEFS.replace("</defs>", r.defs + "</defs>") + r.svg;
      (window as unknown as { __fioMarcos?: unknown }).__fioMarcos = marcos;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    (window as unknown as { __fioDraw?: () => void }).__fioDraw = draw;
    draw();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    addEventListener("load", schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      removeEventListener("load", schedule);
      cancelAnimationFrame(raf);
      svg.remove();
      style.remove();
      delete document.documentElement.dataset.fio;
    };
  }, []);
  return null;
}
