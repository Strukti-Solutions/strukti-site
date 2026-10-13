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
  const maxShift = L.mobile ? L.vh * 1.25 : Math.max(0, L.hero.b - 2 - tailEnd0);
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

/* ------------------------------------------------------------------ */
/* Costura v2 (rodada 2): tratamentos "pesponto" e "tecnico"            */
/* Sem brilho, sem degradê na linha, ritmo em compassos.               */
/* ------------------------------------------------------------------ */
type Trat = "pesponto" | "tecnico";

/** Avança em compassos: em cada um, move (acelera e assenta) e depois pausa. */
function beats(t: number, n: number, move = 0.68) {
  t = clamp(t);
  if (t >= 1) return 1;
  const m = Math.floor(t * n);
  const f = t * n - m;
  return (m + (f < move ? easeInOut(f / move) : 1)) / n;
}
/** Assenta com um passo curto além do ponto e volta (sem mola exagerada). */
const settleOut = (t: number) => {
  const c1 = 0.9;
  const c3 = c1 + 1;
  return t <= 0 ? 0 : t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Ponto e direção a uma distância do início da polilinha. */
function pointDirAt(p: P[], dist: number): { q: P; u: P } {
  let left = dist;
  for (let i = 1; i < p.length; i++) {
    const dx = p[i][0] - p[i - 1][0];
    const dy = p[i][1] - p[i - 1][1];
    const seg = Math.hypot(dx, dy);
    if (seg === 0) continue;
    if (left <= seg || i === p.length - 1) {
      const k = Math.min(1, left / seg);
      return { q: [p[i - 1][0] + dx * k, p[i - 1][1] + dy * k], u: [dx / seg, dy / seg] };
    }
    left -= seg;
  }
  return { q: p[p.length - 1], u: [1, 0] };
}
/**
 * Pesponto em ponto de sela (como na costura de couro): pontos curtos,
 * inclinados 30° em relação ao caminho, que aparecem inteiros, um a um.
 * Não é um tracejado de CSS (que lembraria "área para soltar arquivo").
 */
function stitched(pts: P[], t: number, color: string, o: { w?: number; len?: number; gap?: number; op?: number } = {}) {
  const w = o.w ?? 2.8;
  const len = o.len ?? 10;
  const gap = o.gap ?? 6;
  const total = polyLen(pts);
  if (total <= 0 || t <= 0) return { svg: "", head: (pts[0] ?? [0, 0]) as P };
  const q = len + gap;
  const want = clamp(t) * total;
  const n = t >= 1 ? Math.floor(total / q) : Math.floor(want / q) + (want % q >= len * 0.5 ? 1 : 0);
  const cos = Math.cos(Math.PI / 6);
  const sin = Math.sin(Math.PI / 6);
  let d = "";
  let head: P = pts[0];
  for (let i = 0; i < n; i++) {
    const dist = i * q + len / 2;
    if (dist > total) break;
    const { q: c, u } = pointDirAt(pts, dist);
    const vx = u[0] * cos - u[1] * sin;
    const vy = u[0] * sin + u[1] * cos;
    const h = len / 2;
    d += `M${f1(c[0] - vx * h)} ${f1(c[1] - vy * h)}L${f1(c[0] + vx * h)} ${f1(c[1] + vy * h)}`;
    head = [c[0] + u[0] * (len / 2 + gap / 2), c[1] + u[1] * (len / 2 + gap / 2)];
  }
  const svg = d ? `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${o.op ?? 1}"/>` : "";
  return { svg, head };
}
/** Linha contínua e fina (desenho técnico). */
function solid(pts: P[], t: number, color: string, w = 1.5, op = 1) {
  if (t <= 0 || pts.length < 2) return { svg: "", head: (pts[0] ?? [0, 0]) as P };
  const part = polyPart(pts, t);
  return { svg: `<path d="${pathOf(part.pts)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter" opacity="${op}"/>`, head: part.head };
}
/** Ponto de cruz que prende duas partes: diagonais a 30°, cada uma um ponto separado. */
function zigzag(x0: number, x1: number, y: number, amp: number): P[][] {
  const dx = (2 * amp) / Math.tan(Math.PI / 6);
  const n = Math.max(1, Math.floor(Math.abs(x1 - x0) / dx));
  const step = (x1 - x0) / n;
  const out: P[][] = [];
  for (let i = 0; i < n; i++) {
    const up = i % 2 === 0;
    out.push([
      [x0 + step * i, y + (up ? amp : -amp)],
      [x0 + step * (i + 1), y + (up ? -amp : amp)],
    ]);
  }
  return out;
}
function insetPoly(poly: P[], d: number): P[] {
  const n = poly.length;
  const cx = poly.reduce((a, q) => a + q[0], 0) / n;
  const cy = poly.reduce((a, q) => a + q[1], 0) / n;
  const lines = poly.map((q0, i) => {
    const q1 = poly[(i + 1) % n];
    let nx = -(q1[1] - q0[1]);
    let ny = q1[0] - q0[0];
    const l = Math.hypot(nx, ny);
    nx /= l;
    ny /= l;
    if ((cx - (q0[0] + q1[0]) / 2) * nx + (cy - (q0[1] + q1[1]) / 2) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { p: [q0[0] + nx * d, q0[1] + ny * d] as P, dir: [q1[0] - q0[0], q1[1] - q0[1]] as P };
  });
  return lines.map((l1, i) => {
    const l0 = lines[(i - 1 + n) % n];
    const den = l0.dir[0] * l1.dir[1] - l0.dir[1] * l1.dir[0];
    if (Math.abs(den) < 1e-9) return l1.p;
    const a = ((l1.p[0] - l0.p[0]) * l1.dir[1] - (l1.p[1] - l0.p[1]) * l1.dir[0]) / den;
    return [l0.p[0] + a * l0.dir[0], l0.p[1] + a * l0.dir[1]] as P;
  });
}
const POLY: Record<"A" | "B" | "Ct" | "Cf" | "D", P[]> = {
  A: [[424, 365], [627, 258], [752, 324], [424, 476.5]],
  B: [[774, 335.4], [830, 365], [830, 505], [617.3, 407.7]],
  Ct: [[563.5, 425.6], [830, 548.4], [699.1, 609], [432.6, 486.2]],
  Cf: [[699.1, 609], [830, 548.4], [830, 649], [699.1, 718]],
  D: [[424, 523.8], [677, 636.2], [677, 729.7], [627, 756], [424, 649]],
};
// Vista do Encaixe (MASTER §9.4, public/brand/strukti-encaixe.svg), afastada 1,8×.
const ENC: Record<string, P> = { A: [-47, -32], B: [54, -25], Ct: [0, 0], Cf: [0, 0], D: [-43, 47] };
const close = (poly: P[]) => [...poly, poly[0]];

/** Marca de registro (círculo e mira) com o número do capítulo. */
function regMark(x: number, y: number, color: string, label: string, t: number, side: "left" | "right" = "left") {
  if (t <= 0) return "";
  const k = settleOut(t);
  const r = 7 * k;
  const arm = 13 * k;
  const tx = side === "left" ? x - 20 : x + 20;
  return `<g opacity="${clamp(t * 2).toFixed(2)}">
  <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="none" stroke="${color}" stroke-width="1.5"/>
  <path d="M${f1(x - arm)} ${f1(y)}H${f1(x + arm)}M${f1(x)} ${f1(y - arm)}V${f1(y + arm)}" stroke="${color}" stroke-width="1.5"/>
  <text x="${f1(tx)}" y="${f1(y + 5)}" text-anchor="${side === "left" ? "end" : "start"}" fill="${color}" style="font: 600 14px var(--font-geologica), system-ui, sans-serif; font-variant-numeric: tabular-nums">${label}</text></g>`;
}
/** Marca de corte (canto em L), como na prova de impressão. */
function cropMark(x: number, y: number, sx: number, sy: number, color: string, t: number) {
  if (t <= 0) return "";
  const l = 18 * settleOut(t);
  return `<path d="M${f1(x + sx * l)} ${f1(y)}H${f1(x)}V${f1(y + sy * l)}" fill="none" stroke="${color}" stroke-width="1.5" opacity="${clamp(t * 2).toFixed(2)}"/>`;
}

function renderCosturaV2(L: Layout, sy: number, trat: Trat) {
  const tec = trat === "tecnico";
  const H = L.vh * 0.72;
  const hl = sy + H;
  const g = heroSymbol(L, sy);
  const p = g.p;
  const onDark = tec ? C.cyan300 : C.cyan;
  const onPaper = C.e700;
  const seamColor = C.e500;
  const draw = (pts: P[], t: number, color: string) => (tec ? solid(pts, t, color) : stitched(pts, t, color));
  let out = mobileBand(L, g);
  out += `<circle cx="${f1(g.cx)}" cy="${f1(g.cy)}" r="${f1(498 * g.s * 0.95)}" fill="url(#fio-luz)" opacity="0.5"/>`;
  const needle = (q: P, color = C.e500) => `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="4.5" fill="${color}"/>`;
  const headTec = (q: P, color: string) => `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="4" fill="${C.n950}" stroke="${color}" stroke-width="1.5"/>`;

  // ---------------- Capítulo 01: o símbolo ----------------
  let heroHead: P | null = null;
  if (!tec) {
    // Pesponto: as peças começam afastadas (o Encaixe). Cada uma é pespontada e puxada até encaixar.
    out += `<g transform="translate(${f1(g.cx)} ${f1(g.cy)}) scale(${g.s.toFixed(4)}) translate(${-SYM_C[0]} ${-SYM_C[1]})"><path d="${pathOf(HEX)}" fill="none" stroke="${C.n600}" stroke-width="${f1(1.2 / g.s)}" stroke-dasharray="${f1(6 / g.s)} ${f1(7 / g.s)}" opacity="${(1 - range(p, 0.3, 0.8)).toFixed(2)}"/></g>`;
    const plan: { k: keyof typeof POLY; a: number; b: number; with?: keyof typeof POLY }[] = [
      { k: "Ct", a: 0.06, b: 0.24, with: "Cf" },
      { k: "A", a: 0.24, b: 0.42 },
      { k: "B", a: 0.42, b: 0.6 },
      { k: "D", a: 0.6, b: 0.78 },
    ];
    let pieces = "";
    let stitches = "";
    for (const st of plan) {
      const m = range(p, st.a, st.b);
      const sew = range(m, 0, 0.62);
      const pull = settleOut(range(m, 0.72, 1));
      const keys = st.with ? [st.k, st.with] : [st.k];
      for (const k of keys) {
        const off = ENC[k];
        const ox = off[0] * (1 - pull);
        const oy = off[1] * (1 - pull);
        pieces += `<path d="${PIECES[k]}" fill="${FILL[k]}" transform="translate(${f1(ox)} ${f1(oy)})"/>`;
        const pts = close(insetPoly(POLY[k], 11)).map((q) => symPt(g, [q[0] + ox, q[1] + oy]));
        const part = keys.length === 2 ? (k === st.k ? range(sew, 0, 0.6) : range(sew, 0.6, 1)) : sew;
        const s = stitched(pts, part, C.n950, { w: 2.2, len: 7, gap: 4, op: 0.9 });
        stitches += s.svg;
        if (part > 0 && part < 1) heroHead = s.head;
      }
    }
    out += `<g transform="translate(${f1(g.cx)} ${f1(g.cy)}) scale(${g.s.toFixed(4)}) translate(${-SYM_C[0]} ${-SYM_C[1]})">${pieces}</g>` + stitches;
    if (!heroHead && p < 0.06) heroHead = symPt(g, close(insetPoly(POLY.Ct, 11))[0]);
    if (heroHead) out += needle(heroHead);
  } else {
    // Desenho técnico: linhas de construção, arestas em compassos, cota, e só então as peças.
    const cons = easeOut(range(p, 0.04, 0.2));
    let consSvg = "";
    if (cons > 0)
      for (const v of HEX.slice(0, 6)) {
        for (const a of [Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]) {
          const l = 70 * cons;
          const q0 = symPt(g, [v[0] - Math.cos(a) * l, v[1] - Math.sin(a) * l]);
          const q1 = symPt(g, [v[0] + Math.cos(a) * l, v[1] + Math.sin(a) * l]);
          consSvg += `<path d="M${f1(q0[0])} ${f1(q0[1])}L${f1(q1[0])} ${f1(q1[1])}" stroke="${C.n600}" stroke-width="1" stroke-dasharray="3 4" opacity="${(1 - 0.5 * range(p, 0.7, 0.9)).toFixed(2)}"/>`;
        }
      }
    out += consSvg;
    // peças (por baixo das linhas), entram pelo eixo e assentam
    let fills = "";
    (["Ct", "Cf", "A", "B", "D"] as const).forEach((k, i) => {
      const t = range(p, 0.66 + i * 0.03, 0.8 + i * 0.03);
      if (t <= 0) return;
      const d = DIR_DESK[k];
      const o = 26 * (1 - settleOut(t));
      fills += `<path d="${PIECES[k]}" fill="${FILL[k]}" opacity="${clamp(t * 1.6).toFixed(2)}" transform="translate(${f1(d[0] * o)} ${f1(d[1] * o)})"/>`;
    });
    out += `<g transform="translate(${f1(g.cx)} ${f1(g.cy)}) scale(${g.s.toFixed(4)}) translate(${-SYM_C[0]} ${-SYM_C[1]})">${fills}</g>`;
    const hexPts = HEX.map((q) => symPt(g, q));
    const he = solid(hexPts, beats(range(p, 0.16, 0.46), 6), onDark, 1.5);
    out += he.svg;
    if (range(p, 0.16, 0.46) > 0 && range(p, 0.16, 0.46) < 1) heroHead = he.head;
    (["A", "B", "Ct", "Cf", "D"] as const).forEach((k, i) => {
      const t = beats(range(p, 0.44 + i * 0.03, 0.56 + i * 0.03), 1);
      out += solid(close(POLY[k]).map((q) => symPt(g, q)), t, onDark, 1.2, 0.85).svg;
    });
    // cota da altura, à direita: linhas de chamada a 30°, linha de cota a 90°, traços oblíquos
    const ct = range(p, 0.56, 0.7);
    if (ct > 0) {
      const ext = 54 * easeOut(ct);
      const a: P = symPt(g, [830, 365]);
      const b: P = symPt(g, [830, 649]);
      const ex = Math.cos(Math.PI / 6) * ext;
      const ey = -Math.sin(Math.PI / 6) * ext;
      const xa: P = [a[0] + ex * g.s, a[1] + ey * g.s];
      const xb: P = [b[0] + ex * g.s, b[1] + ey * g.s];
      out += `<path d="M${f1(a[0] + 6)} ${f1(a[1] - 3)}L${f1(xa[0])} ${f1(xa[1])}M${f1(b[0] + 6)} ${f1(b[1] - 3)}L${f1(xb[0])} ${f1(xb[1])}" stroke="${C.n300}" stroke-width="1"/>`;
      const dl = beats(range(ct, 0.35, 1), 1);
      if (dl > 0) {
        const mx = xa[0] - 8 * g.s;
        const y0 = xa[1] - 0;
        const y1 = y0 + (xb[1] - xa[1]) * dl;
        out += `<path d="M${f1(mx)} ${f1(y0)}V${f1(y1)}" stroke="${C.n300}" stroke-width="1"/>`;
        out += `<path d="M${f1(mx - 5)} ${f1(y0 + 3)}l10 -6M${f1(mx - 5)} ${f1(y1 + 3)}l10 -6" stroke="${C.n300}" stroke-width="1.5"/>`;
        if (dl >= 1) out += `<text x="${f1(mx + 10)}" y="${f1((y0 + y1) / 2 + 5)}" fill="${C.n300}" style="font: 600 14px var(--font-geologica), system-ui, sans-serif; font-variant-numeric: tabular-nums">01</text>`;
      }
    }
    if (heroHead) out += headTec(heroHead, onDark);
    else if (p < 0.16) out += headTec(hexPts[0], onDark);
  }

  // cauda: do vértice de baixo, a 30°, até a pista da direita; desce em dois compassos
  const bottom = symPt(g, [627, 756]);
  const knee: P = [L.laneR, bottom[1] + Math.abs(L.laneR - bottom[0]) * 0.577];
  const tailPts: P[] = [bottom, knee, [L.laneR, Math.max(knee[1], g.tailEnd)]];
  const tailT = beats(range(p, tec ? 0.84 : 0.8, 1), 2);
  const tail = draw(tailPts, tailT, onDark);
  out += tail.svg;
  if (tailT > 0 && tailT < 1) out += tec ? headTec(tail.head, onDark) : needle(tail.head);
  if (tec) out += regMark(knee[0], knee[1], onDark, "01", range(p, 0.9, 1));

  // ---------------- Do hero ao contato ----------------
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
  const marks: { x: number; y: number; color: string; label: string; s: number; side: "left" | "right" }[] = [];

  const y0 = g.laneStart;
  vertical(L.laneR, y0, L.produtos.y, onDark);
  marks.push({ x: L.laneR, y: L.produtos.y, color: onDark, label: "02", s: L.produtos.y - H, side: "left" });
  const yN = L.aplic.y;
  vertical(L.laneR, L.produtos.y, yN, onDark);
  marks.push({ x: L.laneR, y: yN, color: onDark, label: "03", s: yN - H, side: "left" });
  // T2 (simplificado): três pontos prendem o espaço à noite, na pista
  const t2 = zigzag(L.laneR - 42, L.laneR, yN, 6);
  const yB = L.sob.y;
  vertical(L.laneR, yN, yB, onDark);

  // T3, a virada da noite para o papel: janela longa, em compassos
  const t3s0 = yB - L.vh * 0.88;
  const t3s1 = yB - L.vh * 0.22;
  last = Math.max(last, t3s1);
  const t3 = range(sy, t3s0, t3s1);

  vertical(L.laneL, yB, L.como.y, onPaper);
  marks.push({ x: L.laneL, y: yB, color: onPaper, label: "04", s: t3s1, side: "right" });
  // réguas costuradas em zigue-zague (Como trabalhamos, Equipe)
  push([[L.laneL, L.como.y], [L.laneR, L.como.y]], L.como.y - H, L.como.y - H + L.vh * 0.2, onPaper, { beats: 2 });
  marks.push({ x: L.laneR, y: L.como.y, color: onPaper, label: "05", s: L.como.y - H + L.vh * 0.2, side: "left" });
  vertical(L.laneR, L.como.y, L.equipe.y, onPaper);
  push([[L.laneR, L.equipe.y], [L.laneL, L.equipe.y]], L.equipe.y - H, L.equipe.y - H + L.vh * 0.2, onPaper, { beats: 2 });
  marks.push({ x: L.laneL, y: L.equipe.y, color: onPaper, label: "06", s: L.equipe.y - H + L.vh * 0.2, side: "right" });
  vertical(L.laneL, L.equipe.y, L.contato.y, onPaper);
  marks.push({ x: L.laneL, y: L.contato.y, color: onPaper, label: "07", s: L.contato.y - H, side: "right" });

  // contato
  const off = 14;
  const R = tec ? 0 : 24;
  const fx0 = L.form.x - off;
  const fx1 = L.form.r + off;
  const fy0 = L.form.y - off;
  const fy1 = L.form.b + off;
  const midX = (fx0 + fx1) / 2;
  const cS0 = fy0 - L.vh * 0.9;
  const cS1 = fy1 - L.vh * 0.55;
  const gapX = L.contatoText ? (L.contatoText.r + fx0) / 2 : fx0 - 24;
  if (!tec) {
    if (L.mobile) vertical(L.laneL, L.contato.y, fy0 + R, onPaper);
    else {
      push([[L.laneL, L.contato.y], [midX, L.contato.y]], L.contato.y - H, L.contato.y - H + L.vh * 0.22, onPaper, { beats: 2 });
      vertical(midX, L.contato.y, fy0, onPaper);
    }
  } else {
    if (L.mobile) vertical(L.laneL, L.contato.y, fy1, onPaper);
    else {
      // a régua vira uma fiada de 30°/150° até o vão entre o texto e o formulário, e desce como a cota do formulário
      const zz = zigzag(L.laneL, gapX, L.contato.y + 10, 10);
      const zpts: P[] = [[L.laneL, L.contato.y], ...zz.map((s) => s[1])];
      push(zpts, L.contato.y - H, L.contato.y - H + L.vh * 0.24, onPaper, { beats: 3 });
      vertical(zpts[zpts.length - 1][0], zpts[zpts.length - 1][1], fy1, onPaper);
    }
  }

  // --- desenha os segmentos ---
  let headAt: { q: P; color: string } | null = null;
  for (const sg of segs) {
    const t = range(sy, sg.s0, sg.s1);
    if (t <= 0) break;
    const tt = sg.follow ? t : beats(t, sg.beats ?? 1);
    const r = draw(sg.pts, tt, sg.color);
    out += r.svg;
    headAt = t < 1 ? { q: r.head, color: sg.color } : { q: sg.pts[sg.pts.length - 1], color: sg.color };
  }
  // T2: três pontos
  const t2t = range(sy, yN - H - L.vh * 0.05, yN - H + L.vh * 0.1);
  if (!tec && t2t > 0) t2.forEach((sg, i) => { const k = range(t2t, i / 3, (i + 1) / 3); if (k > 0) out += `<path d="M${f1(sg[0][0])} ${f1(sg[0][1])}L${f1(sg[0][0] + (sg[1][0] - sg[0][0]) * k)} ${f1(sg[0][1] + (sg[1][1] - sg[0][1]) * k)}" stroke="${seamColor}" stroke-width="3"/>`; });

  // T3: a costura que prende a noite ao papel
  if (t3 > 0) {
    const amp0 = tec ? 10 : 9;
    const sew = beats(range(t3, 0.26, 0.8), 4);
    const tight = settleOut(range(t3, 0.8, 1));
    const amp = amp0 - (tec ? 0 : 3.5 * tight);
    const zz = zigzag(L.laneR, L.laneL, yB, amp);
    const n = zz.length;
    const done = sew * n;
    if (!tec) {
      zz.forEach((s, i) => {
        const f = clamp(done - i);
        if (f <= 0) return;
        // cada ponto, encurtado nas pontas: os pontos não se tocam
        const a = s[0];
        const b = s[1];
        const ux = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
        const uy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
        const a2: P = [a[0] + ux * 2.5, a[1] + uy * 2.5];
        const b2: P = [b[0] - ux * 2.5, b[1] - uy * 2.5];
        const e: P = [a2[0] + (b2[0] - a2[0]) * f, a2[1] + (b2[1] - a2[1]) * f];
        out += `<path d="M${f1(a2[0])} ${f1(a2[1])}L${f1(e[0])} ${f1(e[1])}" stroke="${seamColor}" stroke-width="3" stroke-linecap="butt"/>`;
      });
      if (tight > 0) out += `<path d="M${f1(L.laneR)} ${f1(yB)}L${f1(L.laneR + (L.laneL - L.laneR) * clamp(tight))} ${f1(yB)}" stroke="${seamColor}" stroke-width="1" opacity=".55"/>`;
      if (sew > 0 && sew < 1) out += needle(zz[Math.min(n - 1, Math.floor(done))]?.[1] ?? [L.laneR, yB]);
    } else {
      const pts: P[] = [[L.laneR, yB], ...zz.map((s) => s[1])];
      const r = solid(pts, sew, seamColor, 1.5);
      out += r.svg;
      if (sew > 0 && sew < 1) out += headTec(r.head, seamColor);
      out += regMark(L.laneR, yB, onDark, "03", range(t3, 0.12, 0.3), "left");
    }
  }

  // contato
  const ct = tec ? range(sy, cS0, cS1) : range(sy, Math.max(cS0, last - 1), cS1);
  let fim = cS1 + L.vh * 0.3;
  if (ct > 0) {
    if (!tec) {
      // duas agulhas descem pelos lados e se encontram embaixo; o arremate fecha
      const half = (side: -1 | 1): P[] => {
        const fx = side < 0 ? fx0 : fx1;
        if (L.mobile) {
          return side < 0
            ? [[fx0, fy0 + R], [fx0, fy1 - R], ...arc(fx0 + R, fy1 - R, R, Math.PI, Math.PI / 2), [midX, fy1]]
            : [[fx0, fy0 + R], ...arc(fx0 + R, fy0 + R, R, Math.PI, Math.PI * 1.5), [fx1 - R, fy0], ...arc(fx1 - R, fy0 + R, R, -Math.PI / 2, 0), [fx1, fy1 - R], ...arc(fx1 - R, fy1 - R, R, 0, Math.PI / 2), [midX, fy1]];
        }
        return side < 0
          ? [[midX, fy0], [fx0 + R, fy0], ...arc(fx0 + R, fy0 + R, R, Math.PI * 1.5, Math.PI), [fx, fy1 - R], ...arc(fx0 + R, fy1 - R, R, Math.PI, Math.PI / 2), [midX, fy1]]
          : [[midX, fy0], [fx1 - R, fy0], ...arc(fx1 - R, fy0 + R, R, -Math.PI / 2, 0), [fx, fy1 - R], ...arc(fx1 - R, fy1 - R, R, 0, Math.PI / 2), [midX, fy1]];
      };
      // compassos: topo (até os cantos), pausa; lados acompanham a rolagem; base fecha; arremate
      const phase = (h: P[], t: number) => {
        const total = polyLen(h);
        const topLen = L.mobile ? (h.length > 12 ? Math.abs(fx1 - fx0) : 0) : Math.abs(midX - fx0);
        const sideLen = fy1 - fy0;
        const a = topLen / total;
        const b = (topLen + sideLen) / total;
        if (t < 0.18) return a * beats(t / 0.18, 1);
        if (t < 0.8) return a + (b - a) * ((t - 0.18) / 0.62);
        if (t < 0.92) return b + (1 - b) * easeInOut((t - 0.8) / 0.12);
        return 1;
      };
      const hA = half(-1);
      const hB = half(1);
      const ra = stitched(hA, phase(hA, ct), onPaper);
      const rb = stitched(hB, phase(hB, ct), onPaper);
      out += ra.svg + rb.svg;
      if (ct < 0.92) out += needle(ra.head) + needle(rb.head);
      const knot = range(ct, 0.92, 1);
      if (knot > 0) {
        // arremate: dois pontos cruzados e o nó (o ponto do i)
        const k = settleOut(knot);
        const l = 11 * k;
        out += `<path d="M${f1(midX - l)} ${f1(fy1 - l * 0.58)}L${f1(midX + l)} ${f1(fy1 + l * 0.58)}M${f1(midX - l)} ${f1(fy1 + l * 0.58)}L${f1(midX + l)} ${f1(fy1 - l * 0.58)}" stroke="${onPaper}" stroke-width="3"/>`;
        out += `<circle cx="${f1(midX)}" cy="${f1(fy1)}" r="${f1(6 * k)}" fill="${C.e500}"/>`;
      }
      fim = cS1 + L.vh * 0.25;
    } else {
      // marcas de corte nos cantos e a cota descendo pelo lado; o registro final leva o ponto
      out += cropMark(fx0, fy0, 1, 1, onPaper, range(ct, 0.02, 0.12)) + cropMark(fx1, fy0, -1, 1, onPaper, range(ct, 0.08, 0.18));
      out += cropMark(fx0, fy1, 1, -1, onPaper, range(ct, 0.8, 0.88)) + cropMark(fx1, fy1, -1, -1, onPaper, range(ct, 0.84, 0.92));
      const cx = fx1 + 26;
      const dl = range(ct, 0.18, 0.8);
      if (dl > 0) {
        const yy = fy0 + (fy1 - fy0) * dl;
        out += `<path d="M${f1(fx1 + 4)} ${f1(fy0)}H${f1(cx + 8)}" stroke="${C.n500}" stroke-width="1"/>`;
        out += `<path d="M${f1(cx)} ${f1(fy0)}V${f1(yy)}" stroke="${onPaper}" stroke-width="1.5"/><path d="M${f1(cx - 5)} ${f1(fy0 + 3)}l10 -6" stroke="${onPaper}" stroke-width="1.5"/>`;
        if (dl >= 1) out += `<path d="M${f1(fx1 + 4)} ${f1(fy1)}H${f1(cx + 8)}M${f1(cx - 5)} ${f1(fy1 + 3)}l10 -6" stroke="${onPaper}" stroke-width="1.5"/>`;
      }
      if (!L.mobile && ct > 0.05) { const gx = gapX; out += `<path d="M${f1(L.form.x - 4)} ${f1(L.form.y)}H${f1(gx - 8)}M${f1(gx - 5)} ${f1(L.form.y + 3)}l10 -6" stroke="${C.n500}" stroke-width="1"/>`; if (ct > 0.8) out += `<path d="M${f1(L.form.x - 4)} ${f1(L.form.b)}H${f1(gx - 8)}M${f1(gx - 5)} ${f1(L.form.b + 3)}l10 -6" stroke="${C.n500}" stroke-width="1"/>`; }
      const fin = range(ct, 0.92, 1);
      if (fin > 0) {
        out += regMark(fx1, fy1 + 30, onPaper, "07", fin, "right");
        out += `<circle cx="${f1(fx1)}" cy="${f1(fy1 + 30)}" r="${f1(4.5 * settleOut(fin))}" fill="${C.e500}"/>`;
      }
      fim = cS1 + L.vh * 0.25;
    }
  }

  // cabeça da linha (quando não há outra agulha em cena)
  if (headAt && (t3 <= 0 || t3 >= 1) && ct <= 0) out += tec ? headTec(headAt.q, headAt.color) : needle(headAt.q);
  // marcas de registro (só no técnico)
  if (tec) for (const m of marks) out += regMark(m.x, m.y, m.color, m.label, range(sy, m.s - L.vh * 0.02, m.s + L.vh * 0.08), m.side);

  marcos = {
    fim,
    lista: [
      ["1 · capítulo 01: as peças afastadas", 0],
      ["2 · 01: pespontada, a peça é puxada", g.end * 0.38],
      ["3 · 01: a última peça assenta", g.end * 0.75],
      ["4 · a linha desce pela margem", L.aplic.y - H + L.vh * 0.2],
      ["5 · 03 → 04: o ponto que prende a noite ao papel", t3s0 + (t3s1 - t3s0) * 0.62],
      ["6 · 04 → 04: assentou", t3s1 + L.vh * 0.05],
      ["7 · 07: as duas agulhas descem", cS0 + (cS1 - cS0) * 0.55],
      ["8 · 07: o arremate", cS1 + L.vh * 0.12],
    ],
    comparar: [g.end * 0.66, t3s0 + (t3s1 - t3s0) * 0.62, cS0 + (cS1 - cS0) * 0.9],
  };
  return { svg: out, defs: "" };
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
  const yN = L.aplic.y;
  vertical(L.laneR, y0, yN, onDark);
  // T2 (simplificado): um dente a 30° na passagem do espaço para a noite
  push([[L.laneR, yN], [L.laneR - 16, yN + 9], [L.laneR, yN + 18]], yN - H, yN - H + L.vh * 0.06, onDark);
  const yB = L.sob.y;
  vertical(L.laneR, yN + 18, yB, onDark);
  // T3: janela longa, com compassos
  const t3s0 = yB - L.vh * 0.88;
  const t3s1 = yB - L.vh * 0.22;
  last = Math.max(last, t3s1);
  const t3 = range(sy, t3s0, t3s1);
  vertical(L.laneL, yB, L.como.y, onPaper);
  push([[L.laneL, L.como.y], [L.laneR, L.como.y]], L.como.y - H, L.como.y - H + L.vh * 0.18, onPaper, { beats: 1 });
  vertical(L.laneR, L.como.y, L.equipe.y, onPaper);
  push([[L.laneR, L.equipe.y], [L.laneL, L.equipe.y]], L.equipe.y - H, L.equipe.y - H + L.vh * 0.18, onPaper, { beats: 1 });
  vertical(L.laneL, L.equipe.y, L.contato.y, onPaper);
  // contato: a régua leva o fio até a borda do formulário
  const ex = 20 * COS30; // extrusão do cartão (estrutura)
  const ey = 20 * SIN30;
  const fr = L.form;
  const xr = plano ? fr.x - 17 : Math.min(L.vw - 4, fr.r + ex);
  push([[L.laneL, L.contato.y], [xr, L.contato.y]], L.contato.y - H, L.contato.y - H + L.vh * 0.2, onPaper, { beats: 1 });
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
      ["4 · 01: o símbolo montado; o fio sai", g.end * 0.9],
      ["5 · 03 → 04: a viga atravessa a tela", t3s0 + (t3s1 - t3s0) * 0.55],
      ["6 · 03 → 04: assenta e vira fio", t3s0 + (t3s1 - t3s0) * 0.93],
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
    const mode = params.get("fio");
    if (mode !== "costura" && mode !== "montagem") return;
    const gravar = params.has("gravar");
    const trat = params.get("trat") ?? "estrutura";
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
      const r =
        mode === "montagem"
          ? renderMontagem(L, sy)
          : trat === "v1"
            ? renderCostura(L, sy)
            : trat === "pesponto" || trat === "tecnico"
              ? renderCosturaV2(L, sy, trat)
              : renderCosturaV3(L, sy, trat === "plano" ? "plano" : "estrutura");
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
