"use client";

/*
 * SPIKE DESCARTÁVEL [S1-A] — protótipos do fio condutor (Costura e Montagem).
 * Nada daqui vai para o produto sem spec aprovada. Liga com ?fio=costura ou
 * ?fio=montagem; sem a chave, não renderiza nada (home padrão intacta).
 * &gravar=1 ignora o prefers-reduced-motion só no fio (a gravação emula
 * reduced motion para congelar as entradas por tempo do resto do site).
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
const PIECE_CENTER: Record<string, P> = { A: [560, 360], B: [740, 420], Ct: [630, 520], Cf: [765, 630], D: [550, 640] };
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
const backOut = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const pulse = (v: number, a: number, b: number) => {
  const t = range(v, a, b);
  return t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t);
};
const f1 = (n: number) => n.toFixed(1);

function polyLen(p: P[]) {
  let l = 0;
  for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return l;
}
/** Os pontos da polilinha até a fração t do comprimento (e a ponta). */
function polyPart(p: P[], t: number): { pts: P[]; head: P } {
  if (p.length === 0) return { pts: [], head: [0, 0] };
  const total = polyLen(p);
  let left = clamp(t) * total;
  const out: P[] = [p[0]];
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (left >= seg) {
      out.push(p[i]);
      left -= seg;
    } else {
      const k = seg === 0 ? 0 : left / seg;
      const q: P = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k];
      out.push(q);
      return { pts: out, head: q };
    }
  }
  return { pts: out, head: out[out.length - 1] };
}
const pathOf = (p: P[]) => (p.length < 2 ? "" : "M" + p.map((q) => `${f1(q[0])} ${f1(q[1])}`).join("L"));

/** Arco de canto (quarto de círculo) como polilinha. */
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 8): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

function docBox(el: Element | null | undefined): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, r: r.right + scrollX, b: r.bottom + scrollY };
}

type Layout = ReturnType<typeof measure>;

/** Para a gravação: scroll final e quadros-chave (rótulo, scroll). */
let marcos: { fim: number; lista: (string | number)[][] } | null = null;

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
  const aplic = sec("#aplicativos");
  const sob = sec("#sob-medida");
  const como = docBox(document.querySelector("#sob-medida")?.nextElementSibling)!;
  const equipe = sec("#equipe");
  const contato = sec("#contato");
  const form = sec("#contato .form-card");
  const contatoText = docBox(document.querySelector("#contato h2")?.parentElement);
  const aplicCont = sec("#aplicativos > .container");
  const sobCont = sec("#sob-medida > .container");
  const equipeCont = sec("#equipe > .container");
  const walls = Array.from(document.querySelectorAll<HTMLElement>("#aplicativos .wall, #equipe .wall"));
  return { vw, vh, mobile, desk, hero, quadro, contentL, contentR, laneR, laneL, produtos, aplic, sob, como, equipe, contato, form, contatoText, aplicCont, sobCont, equipeCont, walls };
}

/** Posição e escala do símbolo do hero (sticky emulado no computador). */
function heroSymbol(L: Layout, sy: number) {
  const symH = L.mobile ? Math.min(L.quadro.h * 0.66, 300) : Math.min(L.quadro.h * 0.62, 470);
  const s = symH / 498;
  const cx = L.quadro.x + L.quadro.w / 2;
  const cy0 = L.quadro.y + L.quadro.h * 0.5;
  // Ponta da cauda: no pé do quadro, na pista da direita.
  const tailEnd0 = L.quadro.b - 6;
  const maxShift = L.mobile ? L.vh * 0.9 : Math.max(0, L.hero.b - 2 - tailEnd0);
  const end = L.mobile ? maxShift : Math.max(maxShift, L.vh * 0.5);
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

/** Linha com brilho opcional (o brilho é a mesma linha, mais grossa e desfocada). */
function line(pts: P[], color: string, w: number, glow = 0, extra = "") {
  const d = pathOf(pts);
  if (!d) return "";
  const g = glow > 0 ? `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w * 3}" stroke-linecap="round" stroke-linejoin="round" opacity="${glow}" filter="url(#fio-glow)"/>` : "";
  return `${g}<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}
function head(q: P, color: string, big = 1) {
  return `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="${f1(11 * big)}" fill="${color}" opacity=".55" filter="url(#fio-glow-forte)"/>
  <circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="${f1(4.5 * big)}" fill="#fff"/>
  <circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="${f1(7 * big)}" fill="none" stroke="${color}" stroke-width="2"/>`;
}
/** Prévia tracejada à frente da cabeça: o fio "puxa" para baixo. */
function preview(from: P, to: P, color: string) {
  return `<path d="M${f1(from[0])} ${f1(from[1])}L${f1(to[0])} ${f1(to[1])}" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 6" opacity=".55" fill="none"/>`;
}

/* ------------------------------------------------------------------ */
/* Costura                                                             */
/* ------------------------------------------------------------------ */
function renderCostura(L: Layout, sy: number) {
  const H = L.vh * 0.72;
  const hl = sy + H; // linha da cabeça, em coordenadas do documento
  const g = heroSymbol(L, sy);
  const p = g.p;
  let out = "";

  // --- Capítulo 1: o símbolo desenhado pelas costuras ---
  const sw = 3 / g.s;
  const tf = `transform="translate(${f1(g.cx)} ${f1(g.cy)}) scale(${g.s.toFixed(4)}) translate(${-SYM_C[0]} ${-SYM_C[1]})"`;
  const luz = 0.35 + 0.65 * easeOut(range(p, 0, 0.8));
  out += mobileBand(L, g);
  out += `<circle cx="${f1(g.cx)}" cy="${f1(g.cy)}" r="${f1(498 * g.s * 0.95)}" fill="url(#fio-luz)" opacity="${luz.toFixed(2)}"/>`;
  out += `<g ${tf}>`;
  // planta tracejada
  out += `<path d="${pathOf(HEX)}" fill="none" stroke="${C.n600}" stroke-width="${f1(1.2 / g.s)}" stroke-dasharray="${f1(6 / g.s)} ${f1(7 / g.s)}" opacity="${(1 - range(p, 0.05, 0.4)).toFixed(2)}"/>`;
  // aro (o ponto corre pelas arestas)
  const rimT = easeInOut(range(p, 0.02, 0.32));
  const rim = polyPart(HEX, rimT);
  out += line(rim.pts, C.cyan, sw, 0.6 - 0.4 * range(p, 0.8, 1));
  // costuras internas: contorno de cada peça
  const order = ["A", "B", "Ct", "Cf", "D"] as const;
  order.forEach((k, i) => {
    const t = easeInOut(range(p, 0.24 + i * 0.05, 0.42 + i * 0.05));
    if (t <= 0) return;
    out += `<path d="${PIECES[k]}" fill="none" stroke="${C.cyan}" stroke-width="${f1(2.2 / g.s)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - t).toFixed(3)}" opacity="${(1 - 0.45 * range(p, 0.8, 0.95)).toFixed(2)}"/>`;
  });
  // encaixe: as peças entram pelo seu eixo e assentam; a junta pisca
  order.forEach((k, i) => {
    const t = range(p, 0.5 + i * 0.045, 0.66 + i * 0.045);
    if (t <= 0) return;
    const c = PIECE_CENTER[k];
    const dx = (c[0] - SYM_C[0]) * 0.5 * (1 - backOut(t));
    const dy = (c[1] - SYM_C[1]) * 0.5 * (1 - backOut(t));
    out += `<path d="${PIECES[k]}" fill="${FILL[k]}" opacity="${easeOut(t).toFixed(2)}" transform="translate(${f1(dx)} ${f1(dy)})"/>`;
    const flash = pulse(p, 0.6 + i * 0.045, 0.72 + i * 0.045);
    if (flash > 0) out += `<path d="${PIECES[k]}" fill="none" stroke="#E9FDFF" stroke-width="${f1(3 / g.s)}" opacity="${flash.toFixed(2)}" filter="url(#fio-glow)"/>`;
  });
  out += `</g>`;
  if (rimT > 0 && rimT < 1) out += head(symPt(g, rim.head), C.cyan);
  if (rimT === 0) out += head(symPt(g, HEX[0]), C.e500, 0.9);

  // cauda: do vértice de baixo, a 30°, até a pista da direita, e desce
  const bottom = symPt(g, [627, 756]);
  const dx = L.laneR - bottom[0];
  const knee: P = [L.laneR, bottom[1] + Math.abs(dx) * 0.577];
  const tailPts: P[] = [bottom, knee, [L.laneR, Math.max(knee[1], g.tailEnd)]];
  const tailT = easeInOut(range(p, 0.8, 1));
  const tail = polyPart(tailPts, tailT);
  out += line(tail.pts, C.cyan, 3, 0.6);
  if (tailT > 0 && tailT < 1) out += head(tail.head, C.cyan);

  // --- Do hero ao contato: segmentos em sequência ---
  type Seg = { pts: P[]; s0: number; s1: number; color: string; w?: number; glow?: number; grad?: string; follow?: boolean };
  const segs: Seg[] = [];
  let last = g.end; // fim do capítulo 1 (scroll)
  const push = (pts: P[], s0: number, s1: number, color: string, o: Partial<Seg> = {}) => {
    const a = Math.max(s0, last);
    const b = Math.max(s1, a + 1);
    segs.push({ pts, s0: a, s1: b, color, ...o });
    last = b;
  };
  const vertical = (x: number, y0: number, y1: number, color: string) => push([[x, y0], [x, y1]], y0 - H, y1 - H, color, { follow: true, glow: color === C.cyan ? 0.5 : 0.25 });

  const y0 = g.laneStart;
  const yN = L.aplic.y; // espaço -> noite
  vertical(L.laneR, y0, yN, C.cyan);
  // T2 (simplificado): um ponto de costura de 30° na fronteira
  const jog: P[] = [[L.laneR, yN], [L.laneR - 18, yN + 10], [L.laneR, yN + 20]];
  push(jog, yN - H, yN + 20 - H, C.cyan, { glow: 0.5 });
  const yB = L.sob.y; // noite -> papel (T3)
  vertical(L.laneR, yN + 20, yB, C.cyan);
  // T3: a costura atravessa a largura toda e muda de cor
  const sweepS0 = yB - H;
  push([[L.laneR, yB], [L.laneL, yB]], sweepS0, sweepS0 + L.vh * 0.2, C.e700, { w: 3, glow: 0.8, grad: "url(#fio-t3)" });
  const t3 = segs[segs.length - 1];
  // papel: pista da esquerda, réguas em zigue-zague
  vertical(L.laneL, yB, L.como.y, C.e700);
  push([[L.laneL, L.como.y], [L.laneR, L.como.y]], L.como.y - H, L.como.y - H + L.vh * 0.14, C.e700, { glow: 0.2 });
  vertical(L.laneR, L.como.y, L.equipe.y, C.e700);
  push([[L.laneR, L.equipe.y], [L.laneL, L.equipe.y]], L.equipe.y - H, L.equipe.y - H + L.vh * 0.14, C.e700, { glow: 0.2 });
  vertical(L.laneL, L.equipe.y, L.contato.y, C.e700);
  // contato: régua até o canto do formulário, desce e contorna em duas metades
  const off = 12;
  const R = 22;
  const fx0 = L.form.x - off;
  const fx1 = L.form.r + off;
  const fy0 = L.form.y - off;
  const fy1 = L.form.b + off;
  const midX = (fx0 + fx1) / 2;
  let loopA: P[];
  let loopB: P[];
  let loopTop: number;
  if (L.mobile) {
    // celular: a pista da esquerda vira o lado esquerdo do contorno
    vertical(L.laneL, L.contato.y, fy0 + R, C.e700);
    loopA = [[fx0, fy0 + R], [fx0, fy1 - R], ...arc(fx0 + R, fy1 - R, R, Math.PI, Math.PI / 2), [midX, fy1]];
    loopB = [[fx0, fy0 + R], ...arc(fx0 + R, fy0 + R, R, Math.PI, Math.PI * 1.5), [fx1 - R, fy0], ...arc(fx1 - R, fy0 + R, R, -Math.PI / 2, 0), [fx1, fy1 - R], ...arc(fx1 - R, fy1 - R, R, 0, Math.PI / 2), [midX, fy1]];
    loopTop = fy0 + R;
  } else {
    // computador: a régua leva o fio ao meio do formulário, e ele abre em duas metades (zíper)
    push([[L.laneL, L.contato.y], [midX, L.contato.y]], L.contato.y - H, L.contato.y - H + L.vh * 0.16, C.e700, { glow: 0.2 });
    vertical(midX, L.contato.y, fy0, C.e700);
    loopA = [[midX, fy0], [fx0 + R, fy0], ...arc(fx0 + R, fy0 + R, R, Math.PI * 1.5, Math.PI), [fx0, fy1 - R], ...arc(fx0 + R, fy1 - R, R, Math.PI, Math.PI / 2), [midX, fy1]];
    loopB = [[midX, fy0], [fx1 - R, fy0], ...arc(fx1 - R, fy0 + R, R, -Math.PI / 2, 0), [fx1, fy1 - R], ...arc(fx1 - R, fy1 - R, R, 0, Math.PI / 2), [midX, fy1]];
    loopTop = fy0;
  }
  const loopS0 = Math.max(last, loopTop - H);
  const loopS1 = Math.max(loopS0 + L.vh * 0.3, fy1 - H);
  last = loopS1;

  // T3: degradê ciano -> elétrico ao longo da costura
  let defsExtra = `<linearGradient id="fio-t3" gradientUnits="userSpaceOnUse" x1="${f1(L.laneR)}" y1="0" x2="${f1(L.laneL)}" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".55" stop-color="${C.e500}"/><stop offset="1" stop-color="${C.e700}"/></linearGradient>`;

  let headAt: { q: P; color: string; seg?: Seg } | null = null;
  for (const sgm of segs) {
    const t = range(sy, sgm.s0, sgm.s1);
    if (t <= 0) break;
    const part = polyPart(sgm.pts, sgm.follow ? t : easeInOut(t));
    out += line(part.pts, sgm.grad ?? sgm.color, sgm.w ?? 3, sgm.glow ?? 0);
    headAt = t < 1 ? { q: part.head, color: sgm.color, seg: sgm } : { q: sgm.pts[sgm.pts.length - 1], color: sgm.color, seg: sgm };
  }
  // brilho da virada noite -> papel, do lado escuro
  const t3t = range(sy, t3.s0, t3.s1);
  if (t3t > 0) {
    const fade = 1 - range(sy, t3.s1 + L.vh * 0.1, t3.s1 + L.vh * 0.6);
    const wx = (L.laneR - L.laneL) * easeInOut(t3t);
    defsExtra += `<linearGradient id="fio-t3luz" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".3"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></linearGradient>`;
    if (fade > 0) out += `<rect x="${f1(L.laneR - wx)}" y="${f1(yB - 46)}" width="${f1(wx)}" height="44" fill="url(#fio-t3luz)" opacity="${fade.toFixed(2)}"/>`;
  }
  // contato: o contorno fecha em duas metades e o ponto pousa
  const lt = range(sy, loopS0, loopS1);
  if (lt > 0) {
    const settle = 1 - range(sy, loopS1 + L.vh * 0.06, loopS1 + L.vh * 0.3);
    const a = polyPart(loopA, lt);
    const b = polyPart(loopB, lt);
    out += `<g opacity="${settle.toFixed(2)}">${line(a.pts, C.e700, 3, 0.3)}${line(b.pts, C.e700, 3, 0.3)}</g>`;
    if (settle < 1) out += `<g opacity="${(1 - settle).toFixed(2)}">${line(a.pts, C.n200, 3)}${line(b.pts, C.n200, 3)}</g>`;
    if (lt < 1) {
      out += head(a.head, C.e700) + head(b.head, C.e700);
      headAt = null;
    } else {
      const pop = range(sy, loopS1, loopS1 + L.vh * 0.08);
      const r = 8 * backOut(pop);
      const ring = pulse(sy, loopS1, loopS1 + L.vh * 0.3);
      out += `<circle cx="${f1(midX)}" cy="${f1(fy1)}" r="${f1(r * 2.4)}" fill="${C.e500}" opacity="${(0.5 * pop).toFixed(2)}" filter="url(#fio-glow-forte)"/>`;
      out += `<circle cx="${f1(midX)}" cy="${f1(fy1)}" r="${f1(Math.max(0, r))}" fill="${C.e500}"/>`;
      if (ring > 0) out += `<circle cx="${f1(midX)}" cy="${f1(fy1)}" r="${f1(10 + 40 * range(sy, loopS1, loopS1 + L.vh * 0.3))}" fill="none" stroke="${C.e500}" stroke-width="2" opacity="${ring.toFixed(2)}"/>`;
      headAt = null;
    }
  }
  if (headAt && headAt.seg) {
    out += head(headAt.q, headAt.color);
    if (headAt.seg.follow) {
      const end = headAt.seg.pts[headAt.seg.pts.length - 1];
      const ahead: P = [headAt.q[0], Math.min(end[1], headAt.q[1] + 150)];
      if (ahead[1] > headAt.q[1] + 4) out += preview(headAt.q, ahead, headAt.color);
    }
  }

  // Para a gravação: onde termina (o ponto já pousou) e os quadros-chave.
  marcos = {
    fim: loopS1 + L.vh * 0.35,
    lista: [
      ["1 · hero: o ponto na planta", 0],
      ["2 · hero: o símbolo pelas costuras", g.end * 0.62],
      ["3 · a cauda puxa para baixo", g.end + L.vh * 0.1],
      ["4 · Aplicativos: onda nas juntas", L.aplic.y + L.aplic.h * 0.45 - H],
      ["5 · T3: a costura atravessa", t3.s0 + (t3.s1 - t3.s0) * 0.6],
      ["6 · papel: régua em zigue-zague", L.equipe.y - H + L.vh * 0.08],
      ["7 · contato: o contorno fecha", loopS0 + (loopS1 - loopS0) * 0.6],
      ["8 · contato: o ponto pousa", loopS1 + L.vh * 0.12],
    ],
  };

  // ondas nas juntas das paredes (Aplicativos e Equipe)
  for (const wall of L.walls) {
    const wb = docBox(wall)!;
    const k = (hl - wb.y) / wb.h;
    const onDark = wall.closest("#aplicativos") !== null;
    const col = onDark ? "rgb(1 133 231 / .95)" : "rgb(1 102 210 / .7)";
    const at = clamp(k, -0.2, 1.2) * wb.h;
    wall.style.backgroundImage = k > -0.2 && k < 1.3 ? `linear-gradient(180deg, transparent ${f1(at - 260)}px, ${col} ${f1(at - 30)}px, ${col} ${f1(at)}px, transparent ${f1(at + 2)}px)` : "";
  }

  return { svg: out, defs: defsExtra };
}

/* ------------------------------------------------------------------ */
/* Montagem                                                            */
/* ------------------------------------------------------------------ */
// Direções da vista explodida: nada vai para a esquerda no computador (lá está o texto do hero).
const DIR_DESK: Record<string, P> = { A: [-0.3, -0.95], B: [0.95, -0.3], Ct: [0.87, 0.5], Cf: [0.87, 0.5], D: [-0.15, 0.99] };
const DIR_MOB: Record<string, P> = { A: [-0.92, -0.38], B: [0.92, -0.38], Ct: [0.92, 0.38], Cf: [0.92, 0.38], D: [-0.92, 0.38] };
let DIR: Record<string, P> = DIR_DESK;
// Blocos de obra (lajes isométricas), posição no andaime e de onde vêm.
const BLOCK = (x: number, y: number, w = 90) => `M${x} ${y}l${w / 2} ${-w * 0.27}l${w / 2} ${w * 0.27}l${-w / 2} ${w * 0.27}Z`;
const BLOCKS: { at: P; from: P; w: number }[] = [
  { at: [470, 800], from: [-700, 300], w: 110 },
  { at: [590, 830], from: [-500, 700], w: 110 },
  { at: [710, 800], from: [500, 650], w: 110 },
  { at: [380, 700], from: [-650, -200], w: 80 },
  { at: [830, 700], from: [700, -150], w: 80 },
  { at: [360, 470], from: [-600, -500], w: 70 },
  { at: [860, 470], from: [650, -450], w: 70 },
  { at: [610, 205], from: [0, -700], w: 80 },
];

function symbolGroup(cx: number, cy: number, s: number, inner: string) {
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s.toFixed(4)}) translate(${-SYM_C[0]} ${-SYM_C[1]})">${inner}</g>`;
}
function slot(k: keyof typeof PIECES, s: number, color: string) {
  return `<path d="${PIECES[k]}" fill="none" stroke="${color}" stroke-width="${f1(1.4 / s)}" stroke-dasharray="${f1(5 / s)} ${f1(5 / s)}"/>`;
}
function piece(k: keyof typeof PIECES, t: number, dist: number, fills = FILL, opacity = 1) {
  const d = DIR[k];
  const off = dist * (1 - t);
  return `<path d="${PIECES[k]}" fill="${fills[k]}" opacity="${opacity.toFixed(2)}" transform="translate(${f1(d[0] * off)} ${f1(d[1] * off)})"/>`;
}
function junta(k: keyof typeof PIECES, s: number, a: number, color = "#E9FDFF") {
  return a > 0 ? `<path d="${PIECES[k]}" fill="none" stroke="${color}" stroke-width="${f1(3 / s)}" opacity="${a.toFixed(2)}" filter="url(#fio-glow)"/>` : "";
}
/** Uma peça em miniatura (a "conta" que corre no trilho). */
function bead(ks: (keyof typeof PIECES)[], at: P, s: number, fills = FILL) {
  const cs = ks.map((k) => PIECE_CENTER[k]);
  const c: P = [cs.reduce((a, q) => a + q[0], 0) / cs.length, cs.reduce((a, q) => a + q[1], 0) / cs.length];
  const inner = ks.map((k) => `<path d="${PIECES[k]}" fill="${fills[k]}"/>`).join("");
  return `<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${f1(Math.min(26, Math.max(8, 90 * s)))}" fill="${C.e500}" opacity=".3" filter="url(#fio-glow-forte)"/>
  <g transform="translate(${f1(at[0])} ${f1(at[1])}) scale(${s.toFixed(4)}) translate(${f1(-c[0])} ${f1(-c[1])})">${inner}</g>`;
}

function renderMontagem(L: Layout, sy: number) {
  const H = L.vh * 0.72;
  const hl = sy + H;
  const g = heroSymbol(L, sy);
  const p = g.p;
  DIR = L.mobile ? DIR_MOB : DIR_DESK;
  const EXP = L.mobile ? 150 : 170; // distância da vista explodida, em unidades do símbolo
  let out = "";
  const railDark = (pts: P[], op = 0.55) => `<path d="${pathOf(pts)}" fill="none" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="8 7" opacity="${op}"/>`;
  const railPaper = (pts: P[], op = 0.5) => `<path d="${pathOf(pts)}" fill="none" stroke="${C.e700}" stroke-width="2" stroke-dasharray="8 7" opacity="${op}"/>`;
  const expl = (k: keyof typeof PIECES): P => [PIECE_CENTER[k][0] + DIR[k][0] * EXP, PIECE_CENTER[k][1] + DIR[k][1] * EXP];

  // --- Capítulo 1: vista explodida com trilhos; A e B encaixam; D e C partem no trilho ---
  const luz = 0.3 + 0.7 * easeOut(range(p, 0, 0.7));
  out += mobileBand(L, g);
  out += `<circle cx="${f1(g.cx)}" cy="${f1(g.cy)}" r="${f1(498 * g.s * 0.95)}" fill="url(#fio-luz)" opacity="${luz.toFixed(2)}"/>`;
  let inner = `<path d="${pathOf(HEX)}" fill="none" stroke="${C.n600}" stroke-width="${f1(1.2 / g.s)}" stroke-dasharray="${f1(6 / g.s)} ${f1(7 / g.s)}"/>`;
  inner += slot("Ct", g.s, C.n600) + slot("Cf", g.s, C.n600) + slot("D", g.s, C.n600);
  if (p < 0.55) inner += slot("A", g.s, C.n600) + slot("B", g.s, C.n600);
  // trilhos de montagem (tracejados) de cada peça até o seu lugar; os de A e B acendem
  (["A", "B", "D", "Ct"] as const).forEach((k, i) => {
    const c = PIECE_CENTER[k];
    const e = expl(k);
    const lit = k === "A" || k === "B" ? easeInOut(range(p, 0.04 + i * 0.06, 0.2 + i * 0.06)) : 0;
    const gone = k === "D" || k === "Ct" ? range(p, 0.66, 0.78) : range(p, 0.6, 0.75);
    const op = (1 - gone) * 0.9;
    if (op <= 0.01) return;
    inner += `<path d="M${c[0]} ${c[1]}L${f1(e[0])} ${f1(e[1])}" stroke="${C.n300}" stroke-width="${f1(1.2 / g.s)}" stroke-dasharray="${f1(4 / g.s)} ${f1(5 / g.s)}" opacity="${op.toFixed(2)}"/>`;
    if (lit > 0) inner += `<path d="M${f1(e[0])} ${f1(e[1])}L${f1(e[0] + (c[0] - e[0]) * lit)} ${f1(e[1] + (c[1] - e[1]) * lit)}" stroke="${C.cyan}" stroke-width="${f1(2.4 / g.s)}" opacity="${op.toFixed(2)}"/>`;
  });
  const tA = backOut(range(p, 0.24, 0.46));
  const tB = backOut(range(p, 0.38, 0.6));
  inner += piece("A", tA, EXP) + piece("B", tB, EXP);
  inner += junta("A", g.s, pulse(p, 0.42, 0.56)) + junta("B", g.s, pulse(p, 0.56, 0.7));
  const leave = range(p, 0.7, 1); // D e C deixam o hero
  if (leave <= 0) inner += piece("D", 0, EXP) + piece("Ct", 0, EXP) + piece("Cf", 0, EXP);
  out += symbolGroup(g.cx, g.cy, g.s, inner);

  // trilho saindo do hero
  const right = symPt(g, [830, 600]);
  const railPts: P[] = [right, [L.laneR, right[1] + Math.abs(L.laneR - right[0]) * 0.577], [L.laneR, g.tailEnd]];
  const railT = easeInOut(range(p, 0.66, 0.95));
  const rail = polyPart(railPts, railT);
  out += railDark(rail.pts);

  const beadS = L.mobile ? 0.052 : 0.14;
  const gap = L.mobile ? 26 : 70;
  const y0 = g.laneStart;
  // T3: o símbolo na faixa entre a noite e o papel
  const bandTop = L.aplicCont.b;
  const bandBot = L.sobCont.y;
  const s3 = Math.min((bandBot - bandTop) * 0.78, 230) / 498;
  const c3: P = [L.mobile ? L.vw / 2 : L.contentR - 498 * s3 * 0.5, (bandTop + bandBot) / 2];
  const dock3 = c3[1] - H;
  const travel3 = range(sy, dock3, dock3 + L.vh * 0.16);
  const yB = L.sob.y;
  // contato: onde o símbolo se completa
  const deskFinal = !L.mobile && L.contatoText && L.form.b - L.contatoText.b > 260;
  let s7: number;
  let c7: P;
  if (deskFinal && L.contatoText) {
    const area = L.form.b - L.contatoText.b - 48;
    s7 = Math.min(area * 0.7, 300) / 498;
    c7 = [L.contatoText.x + 498 * s7 * 0.5 + 10, L.contatoText.b + 48 + area * 0.45];
  } else {
    const top = L.equipeCont.b;
    const bot = L.contato.y + 48;
    s7 = Math.min((bot - top) * 0.68, 200) / 498;
    c7 = [L.vw / 2, (top + bot) / 2];
  }
  const dock7 = c7[1] - H;
  const travel7 = range(sy, dock7, dock7 + L.vh * 0.2);
  const seamS0 = dock3 + L.vh * 0.1;
  const seamS1 = dock3 + L.vh * 0.3;

  // trilho vertical da direita (escuro) e da esquerda (papel)
  if (sy > g.end - 1) out += railDark([[L.laneR, y0], [L.laneR, clamp(hl, y0, yB)]]);
  const seamT = easeInOut(range(sy, seamS0, seamS1));
  if (seamT > 0) out += line([[L.laneR, yB], [L.laneR + (L.laneL - L.laneR) * seamT, yB]], C.e500, 3, 0.7);
  if (sy > seamS1) out += railPaper([[L.laneL, yB], [L.laneL, clamp(hl, yB, c7[1])]]);

  // posição de uma conta no trilho: hero -> pista da direita -> (C) costura -> pista da esquerda
  const onRail = (lag: number, k: "D" | "C"): { at: P; sc: number } => {
    if (leave < 1) {
      const t = easeInOut(leave);
      const e = symPt(g, k === "D" ? expl("D") : expl("Ct"));
      const target = polyPart(railPts, clamp(railT - lag / Math.max(1, polyLen(railPts)))).head;
      return { at: [e[0] + (target[0] - e[0]) * t, e[1] + (target[1] - e[1]) * t], sc: g.s + (beadS - g.s) * t };
    }
    if (k === "D" || sy < seamS0) return { at: [L.laneR, clamp(hl - lag, y0, k === "D" ? c3[1] : yB)], sc: beadS };
    const lead = range(sy, seamS0, seamS1);
    if (lead < 1) return { at: [L.laneR + (L.laneL - L.laneR) * easeInOut(lead), yB], sc: beadS };
    return { at: [L.laneL, clamp(hl, yB, c7[1] - 24)], sc: beadS };
  };

  // conta D: até encaixar no T3
  if (leave > 0 && travel3 < 1) {
    let { at, sc } = onRail(0, "D");
    if (travel3 > 0) {
      const slotD: P = [c3[0] + (PIECE_CENTER.D[0] - SYM_C[0]) * s3, c3[1] + (PIECE_CENTER.D[1] - SYM_C[1]) * s3];
      at = [at[0] + (slotD[0] - at[0]) * easeInOut(travel3), at[1] + (slotD[1] - at[1]) * easeInOut(travel3)];
      sc = beadS + (s3 - beadS) * easeInOut(travel3);
    }
    out += bead(["D"], at, sc);
  }
  // conta C: até cair no lugar no contato
  if (leave > 0 && travel7 < 1) {
    let { at, sc } = onRail(gap, "C");
    if (travel7 > 0) {
      const above: P = [c7[0], c7[1] - 24];
      const t1 = range(travel7, 0, 0.6);
      const t2 = range(travel7, 0.6, 1);
      at = t2 > 0 ? [above[0], above[1] + (c7[1] - above[1]) * t2 * t2] : [at[0] + (above[0] - at[0]) * easeInOut(t1), at[1] + (above[1] - at[1]) * easeInOut(t1)];
      sc = beadS + (s7 - beadS) * easeInOut(range(travel7, 0.45, 1));
    }
    out += bead(["Ct", "Cf"], at, sc, sy > seamS1 ? FILL_CLARO : FILL);
  }

  // símbolo da faixa do T3
  const appear = easeOut(range(sy, dock3 - L.vh * 0.4, dock3 - L.vh * 0.12));
  if (appear > 0) {
    let i3 = slot("Ct", s3, C.n300) + slot("Cf", s3, C.n300);
    if (travel3 < 1) i3 += slot("D", s3, C.n300);
    i3 += piece("A", 1, 0) + piece("B", 1, 0);
    if (travel3 >= 1) {
      const f = pulse(sy, dock3 + L.vh * 0.12, dock3 + L.vh * 0.34);
      i3 += piece("D", 1, 0) + junta("D", s3, f) + junta("A", s3, f) + junta("B", s3, f);
    }
    out += `<g opacity="${appear.toFixed(2)}" transform="translate(0 ${f1(30 * (1 - appear))})">${symbolGroup(c3[0], c3[1], s3, i3)}</g>`;
  }
  // símbolo do contato
  const appear7 = easeOut(range(sy, dock7 - L.vh * 0.45, dock7 - L.vh * 0.15));
  if (appear7 > 0) {
    let i7 = piece("A", 1, 0) + piece("B", 1, 0) + piece("D", 1, 0);
    if (travel7 < 1) i7 += slot("Ct", s7, C.n300) + slot("Cf", s7, C.n300);
    else {
      i7 += piece("Ct", 1, 0, FILL_CLARO) + piece("Cf", 1, 0, FILL_CLARO);
      const f = pulse(sy, dock7 + L.vh * 0.18, dock7 + L.vh * 0.42);
      (["A", "B", "Ct", "Cf", "D"] as const).forEach((k) => (i7 += junta(k, s7, f, C.e500)));
    }
    const click = travel7 >= 1 ? 1 - 0.05 * pulse(sy, dock7 + L.vh * 0.19, dock7 + L.vh * 0.26) : 1;
    out += `<g opacity="${appear7.toFixed(2)}">${symbolGroup(c7[0], c7[1], s7 * click, i7)}</g>`;
    if (travel7 >= 1) {
      const ring = range(sy, dock7 + L.vh * 0.19, dock7 + L.vh * 0.5);
      if (ring > 0 && ring < 1) out += `<circle cx="${f1(c7[0])}" cy="${f1(c7[1])}" r="${f1(498 * s7 * (0.55 + 0.5 * ring))}" fill="none" stroke="${C.e500}" stroke-width="2" opacity="${(1 - ring).toFixed(2)}"/>`;
    }
  }
  const span1 = g.end;
  marcos = {
    fim: dock7 + L.vh * 0.6,
    lista: [
      ["1 · hero: vista explodida com trilhos", 0],
      ["2 · hero: A encaixa", span1 * 0.45],
      ["3 · hero: D e C partem no trilho", span1 * 0.86],
      ["4 · o trem de peças corre no trilho", L.aplic.y - H + L.vh * 0.3],
      ["5 · T3: D encaixa na virada", dock3 + L.vh * 0.2],
      ["6 · papel: C segue no trilho", L.equipe.y - H],
      ["7 · contato: C cai no lugar", dock7 + L.vh * 0.12],
      ["8 · contato: símbolo completo", dock7 + L.vh * 0.45],
    ],
  };
  return { svg: out, defs: "" };
}

const CSS = `
html[data-fio] .hero-estudio__quadro picture,
html[data-fio] .hero-estudio__canvas,
html[data-fio] .hero-estudio__selo { visibility: hidden; }
nextjs-portal { display: none !important; }
.fio-overlay { position: absolute; left: 0; top: 0; width: 1px; height: 1px; overflow: visible; pointer-events: none; z-index: 40; }
`;

export function FioPrototipo() {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("fio");
    if (mode !== "costura" && mode !== "montagem") return;
    const gravar = params.has("gravar");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches && !gravar;
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
      const r = mode === "costura" ? renderCostura(L, sy) : renderMontagem(L, sy);
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
