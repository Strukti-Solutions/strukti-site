/* Kit de cena da arte do catálogo: a mesma mão do hero "Fim de expediente".
   Copiado e adaptado de scripts/hero-expansao/scene.js (paleta, modelo de luz, câmera, céu de hora azul,
   bokeh, vinheta e grão). Nada é importado do hero em tempo de execução: o hero não muda.
   Unidades: cm. x à direita, y para cima, z para longe do observador.
   Luz: cor = albedo x (ambiente de hora azul + luz do céu/janela + luzes neutro-quentes).
   Câmera padrão: retrato 800 x 1200 (o cartão do catálogo, 2:3).
   Carrega no navegador (window.KIT) e no Node (module.exports), para as sondas. */
(function (G) {
  'use strict';
  // ---------------- paleta (a mesma do hero e do design system) ----------------
  const PAL = {
    n950: '#08121d', n900: '#0e1c2b', n800: '#15273b', n700: '#1e3550', n600: '#2a4766', n500: '#3d5e80',
    n400: '#5f7e9e', n300: '#8ea6be', n200: '#bfcedc', n100: '#dfe7ef', n50: '#f1f5f8',
    e300: '#7cc0fa', e400: '#3aa0f5', e500: '#0185e7', e700: '#0166d2', e800: '#0353ad',
    c200: '#a6f1f3', c300: '#5fe3e8', c400: '#00d1d8', c500: '#00c7d6', c600: '#00a3b4'
  };
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const C = {}; for (const k in PAL) C[k] = hx(PAL[k]);
  C.white = [255, 255, 255]; C.black = [4, 8, 13]; C.edge = [5, 11, 19];
  C.lampW = [255, 241, 224];            // ~4000K, dessaturado: um branco, não uma cor (o abajur do hero)
  C.floodW = [236, 238, 240];           // refletor: branco neutro, entre o abajur e o navy-100

  // ---------------- matemática ----------------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  const rgba = (c, a = 1) => `rgba(${Math.round(clamp(c[0], 0, 255))},${Math.round(clamp(c[1], 0, 255))},${Math.round(clamp(c[2], 0, 255))},${a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => mul(a, 1 / len(a));
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------------- luz ----------------
  // Os mesmos três termos do hero: ambiente de hora azul, luz do céu (a janela, nas cenas internas) e a luz
  // neutro-quente (o abajur do hero; nas cenas externas, refletores). Cada cena declara as suas luzes pontuais.
  const AMB = [0.30, 0.355, 0.46];       // ambiente de hora azul
  const CEU = [0.30, 0.41, 0.60];        // luz do céu / da janela (direcional, suave)
  const LMP = [1.0, 0.90, 0.77];         // ~4000K, dessaturada ~30%
  const FLD = [0.93, 0.93, 0.92];        // refletor: branco neutro
  const LUZ = { ceuDir: norm([0, 0.35, 1]), pontos: [], LK: 1 };
  // ponto: { pos, cor, k, alcance (cm, metade da força), eixo?, cone: [c0, c1] (cossenos), lig: 'LK' }
  function pontoI(L, p, n) {
    const d = sub(L.pos, p), dist = len(d), l = mul(d, 1 / dist);
    let spot = 1; if (L.eixo && L.cone) spot = sstep(L.cone[0], L.cone[1], dot(mul(l, -1), L.eixo));
    if (L.mascara) spot *= L.mascara(p);
    const lam = n ? Math.max(0, dot(n, l)) : 1;
    return (L.k || 1) * spot * lam / (1 + Math.pow(dist / (L.alcance || 42), 2));
  }
  function luz(alb, p, n, k = {}) {
    const w = Math.max(0, dot(n, LUZ.ceuDir)) * (k.wk != null ? k.wk : 1), a = k.amb != null ? k.amb : 1;
    const s = [AMB[0] * a + CEU[0] * w * 0.7, AMB[1] * a + CEU[1] * w * 0.7, AMB[2] * a + CEU[2] * w * 0.7];
    for (const L of LUZ.pontos) {
      const I = pontoI(L, p, n) * LUZ.LK * (k.lk != null ? k.lk : 1) * 2.0, c = L.cor || LMP;
      s[0] += c[0] * I; s[1] += c[1] * I; s[2] += c[2] * I;
    }
    return [0, 1, 2].map(i => clamp(alb[i] * s[i], 0, 255));
  }

  // ---------------- câmera ----------------
  const RETRATO = { W: 800, H: 1200 };   // o cartão do catálogo
  function makeCam(o) {
    const f = norm(sub(o.target, o.pos)), r = norm(cross([0, 1, 0], f)), u = cross(f, r);
    const cx = o.W / 2 + (o.shiftX || 0), cy = o.H / 2 + (o.shiftY || 0), F = o.F, pos = o.pos;
    const P = p => { const d = sub(p, pos); const z = dot(d, f); return [cx + F * dot(d, r) / z, cy - F * dot(d, u) / z, z]; };
    const Dd = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; };
    const D = (az, el) => { const d = Dd(az, el); const z = dot(d, f); return [cx + F * dot(d, r) / z, cy - F * dot(d, u) / z, z]; };
    const S = p => F / dot(sub(p, pos), f);
    const ray = (sx, sy) => add(add(f, mul(r, (sx - cx) / F)), mul(u, -(sy - cy) / F));
    return { P, D, S, ray, pos, f, r, u, F, W: o.W, H: o.H, cx, cy };
  }
  // caixa (em % do quadro) de uma lista de pontos 3D: [x0, x1, y0, y1]
  function caixaPct(cam, pts) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { const q = cam.P(p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    return [x0 / cam.W * 100, x1 / cam.W * 100, y0 / cam.H * 100, y1 / cam.H * 100].map(v => +v.toFixed(1));
  }

  // ---------------- desenho ----------------
  function frameOf(o) { const t = (o.rot || 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return (u, h, v) => [o.x + u * c - v * s, (o.y || 0) + h, o.z + u * s + v * c]; }
  function rrect(w, d, r, n = 7) {
    const pts = [], cs = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]];
    for (const [x, y, a0] of cs) for (let i = 0; i <= n; i++) { const a = (a0 + 90 * i / n) * Math.PI / 180; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
    return pts;
  }
  function path(ctx, pts, close = true) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (close) ctx.closePath(); }
  function hull(pts) {
    const p = pts.map(q => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  function discT(ctx, cam, c, a, b) { const p0 = cam.P(c), pa = cam.P(add(c, a)), pb = cam.P(add(c, b)); ctx.setTransform(pa[0] - p0[0], pa[1] - p0[1], pb[0] - p0[0], pb[1] - p0[1], p0[0], p0[1]); }
  const ID = ctx => ctx.setTransform(1, 0, 0, 1, 0, 0);
  function radial(ctx, stops, r = 1) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
  function lin(ctx, a, b, stops) { const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); for (const s of stops) g.addColorStop(clamp(s[0], 0, 1), s[1]); return g; }
  function layer(W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  function glow(ctx, p, r, col, a) { if (a <= 0 || r <= 0) return; const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }
  // disco de bokeh: borda um pouco mais clara que o centro, como na cidade do hero
  function disco(ctx, p, r, col, A) {
    const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    gr.addColorStop(0, rgba(col, A * 0.75)); gr.addColorStop(0.55, rgba(col, A)); gr.addColorStop(0.82, rgba(col, A * 0.6)); gr.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
  }

  // ---------------- céu de hora azul (por elevação, em graus) ----------------
  const SKY = () => [[60, mix(C.n900, C.n950, 0.35)], [30, mix(C.n800, C.n900, 0.5)], [12, mix(C.n700, C.n800, 0.5)], [4, mix(C.n600, C.n700, 0.6)], [0.8, mix(C.n500, C.n600, 0.7)],
    [0, mix(C.n600, C.n500, 0.2)], [-1.5, mix(C.n700, C.n600, 0.35)], [-6, mix(C.n800, C.n700, 0.4)], [-16, mix(C.n900, C.n800, 0.5)], [-70, mix(C.n950, C.n900, 0.55)]];
  function skyCol(el, S) {
    if (el >= S[0][0]) return S[0][1];
    for (let i = 1; i < S.length; i++) if (el >= S[i][0]) { const t = (el - S[i][0]) / (S[i - 1][0] - S[i][0]); return mix(S[i][1], S[i - 1][1], t); }
    return S[S.length - 1][1];
  }
  function elevacao(cam, sx, sy) { const r = cam.ray(sx, sy); return Math.asin(r[1] / len(r)) * 180 / Math.PI; }
  function ceu(ctx, cam, S = SKY()) { for (let sy = 0; sy < cam.H; sy += 2) { ctx.fillStyle = rgba(skyCol(elevacao(cam, cam.W / 2, sy + 1), S)); ctx.fillRect(0, sy, cam.W, 2); } }

  // ---------------- acabamento: o tratamento do hero ----------------
  // bloom leve, vinheta para o navy (cantos), esmaecimento de baixo (a metade do texto) e grão estático.
  function acabamento(ctx, cam, o) {
    const { W, H } = cam;
    if (o.bloom) {
      const sm = layer(W >> 2, H >> 2), sc = sm.getContext('2d');
      sc.filter = 'brightness(0.55) contrast(2.6) blur(5px)'; sc.drawImage(ctx.canvas, 0, 0, W >> 2, H >> 2);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.bloom; ctx.drawImage(sm, 0, 0, W, H); ctx.restore();
    }
    // vinheta elíptica (o quadro é em pé): centro em vigC, cai para C.edge nas bordas e nos cantos
    const [vx, vy] = o.vigC || [0.5, 0.4], vig = o.vig != null ? o.vig : 0.8;
    ctx.save(); ctx.setTransform(W, 0, 0, H, vx * W, vy * H);
    const [r0, r1] = o.vigR || [0.34, 0.86], v = ctx.createRadialGradient(0, 0, r0, 0, 0, r1);
    v.addColorStop(0, rgba(C.edge, 0)); v.addColorStop(0.5, rgba(C.edge, vig * 0.35)); v.addColorStop(1, rgba(C.edge, vig));
    ctx.fillStyle = v; ctx.fillRect(-vx - 0.1, -vy - 0.1, 1.2, 1.2); ctx.restore();
    if (o.bottomFade) { const [y0, y1, y2, a1, a2] = o.bottomFade; ctx.fillStyle = lin(ctx, [0, y0 * H], [0, y2 * H], [[0, rgba(C.edge, 0)], [(y1 - y0) / (y2 - y0), rgba(C.edge, a1)], [1, rgba(C.edge, a2)]]); ctx.fillRect(0, y0 * H, W, H - y0 * H); }
    if (!o.noGrain) addGrain(ctx, W, H, o.grain || 5, 42);
  }
  // grão estático (mesma semente do hero): o loop compõe passes com o mesmo grão, então ele não "ferve"
  function addGrain(ctx, W, H, amt, seed) {
    const img = ctx.getImageData(0, 0, W, H), d = img.data; const R = rng(seed);
    for (let i = 0; i < d.length; i += 4) { const n = (R() + R() - 1) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.1; }
    ctx.putImageData(img, 0, 0);
  }

  // erro na tela (o shot.sh fotografa o erro em vez de uma tela preta)
  function mostrarErro(e) { document.body.insertAdjacentHTML('beforeend', '<pre style="position:fixed;top:0;left:0;color:#fff;font:18px monospace;background:#900;white-space:pre-wrap;width:100%">' + (e && e.stack || e) + '</pre>'); }

  G.KIT = {
    PAL, C, hx, rgba, mix, clamp, sstep, sub, add, mul, dot, cross, len, norm, rng,
    AMB, CEU, LMP, FLD, LUZ, luz, pontoI,
    RETRATO, makeCam, caixaPct,
    frameOf, rrect, path, hull, discT, ID, radial, lin, layer, glow, disco,
    SKY, skyCol, elevacao, ceu, acabamento, addGrain, mostrarErro
  };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.KIT;
