/* Hero com entrada pelo notebook: a cena do "Fim de expediente" com o notebook aberto no centro da mesa
   (spec 2026-10-23, §6). Cópia adaptada do renderizador do hero "expansao"; não importa nada de lá.
   Um mundo, duas câmeras por enquanto (bg 1920x1080 com o notebook; media 1280x720 sem ele, `semAparelho`:
   o notebook é vetor por cima, no site, e a mídia guarda só a sombra e o brilho dele na mesa). Canvas2D.
   Units: cm. x right, y up, z away from the viewer. Desk top at y=0, wall at z=64, glass at z=71.
   Light model: colour = albedo x (cool ambient + window light + neutral-warm lamp).
   Passes (media plates): full | A (city black) | B (city grey 128) | C (A + LED on) | D (A, lamp off).
   final = A + T*city(t) + k(t)*(C-A) + j(t)*(A-D),  T = (B-A)/128. */
(function (G) {
  'use strict';
  const PAL = {
    n950: '#08121d', n900: '#0e1c2b', n800: '#15273b', n700: '#1e3550', n600: '#2a4766', n500: '#3d5e80',
    n400: '#5f7e9e', n300: '#8ea6be', n200: '#bfcedc', n100: '#dfe7ef', n50: '#f1f5f8',
    e300: '#7cc0fa', e400: '#3aa0f5', e500: '#0185e7', e700: '#0166d2', e800: '#0353ad',
    c200: '#a6f1f3', c300: '#5fe3e8', c400: '#00d1d8', c500: '#00c7d6', c600: '#00a3b4'
  };
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const C = {}; for (const k in PAL) C[k] = hx(PAL[k]);
  C.white = [255, 255, 255]; C.black = [4, 8, 13]; C.edge = [5, 11, 19];
  C.lampW = [255, 241, 224];           // ~4000K, desaturated: a white, not a hue
  const rgba = (c, a = 1) => `rgba(${Math.round(clamp(c[0], 0, 255))},${Math.round(clamp(c[1], 0, 255))},${Math.round(clamp(c[2], 0, 255))},${a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => mul(a, 1 / len(a));
  const GLOW_C = mix(C.n400, C.e500, 0.8), GLOW_A = 0.24;   // a luz da tela do notebook: um azul-navy claro
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------------- world ----------------
  const BASE = {
    wallZ: 64, glassZ: 71,
    win: { x0: -95, x1: 95, y0: 0.4, y1: 175, frame: 3, rail: 1.3, mull: [[-37, -34], [34, 37]] },
    desk: { x0: -130, x1: 130, z0: -45, z1: 63, th: 3.2 },   // na media a mesa sai pelo pé do quadro; no bg a quina da frente, com o fio de luz, fica no pé (y ≈ 995)
    lamp: { base: [-100, 0, 20], elbow: [-108, 44, 24], head: [-60, 78, 6], target: [2, 0, 16], k: 2.1, openK: 1, c0: 0.95, c1: 0.994, s0: 0.80, s1: 0.955, sw: 0.4 },
    // O notebook aberto no centro da mesa, de frente para a câmera (sai o caderno de papel). Base w x d x h, tela 16:10
    // (sw x sh) com bordas side/top/chin; a tampa sobe da dobradiça inclinada para trás `tilt` graus, o mesmo da câmera
    // media (calculado abaixo, depois das câmeras): a tela fica paralela ao quadro e vira um retângulo alinhado aos eixos.
    laptop: { x: 3, z: 29, w: 31, d: 21, h: 1.5, r: 1.2, sw: 28, sh: 17.5, side: 1.5, top: 1.15, chin: 2.25, lidT: 0.6, tilt: 0 },
    // Uma disposição só, para as duas câmeras (o fundo largo não muda nada daqui): a caixa do Replay atrás e o celular deitado
    // logo à frente dela, na mesma coluna; a caneca do outro lado. Na mídia, tudo cabe entre o corte 4:3 deitado (160 px de cada
    // lado) e o recorte do cartão de 300 x 400 em P = 0 (x 370-910), com ~40 px de folga; no fundo largo, fora do cartão de
    // 1024 a 2560 px de janela. O celular fica quase de pé no quadro (rot 12): deitado na horizontal ele não cabe nessa faixa.
    // A caixa tem o topo abaixo da linha 1 do título; a boca da caneca fica abaixo da linha 2. `alca`: o ângulo da alça (graus).
    phone: { x: -26.5, z: 17.5, rot: 12, w: 7.1, d: 14.7, h: 0.85 },
    box: { x: -30.2, z: 32, rot: 8, w: 9.6, d: 4.6, h: 13, r: 1.25 },
    mug: { x: 33.5, z: 21, r: 3.8, h: 8.8, alca: -74 }
  };
  let W0 = BASE;
  function prepWorld(o) {
    const w = JSON.parse(JSON.stringify(BASE));
    if (o.world) for (const k in o.world) w[k] = o.world[k] === null ? null : Object.assign({}, w[k], o.world[k]);
    const L = w.lamp; L.axis = norm(sub(L.target, L.head));
    L.open = add(L.head, mul(L.axis, 6)); L.back = add(L.head, mul(L.axis, -5.5)); L.bulb = add(L.head, mul(L.axis, 3.5));
    // `s`: o notebook em outra escala (o do fundo largo é menor, para caber atrás do cartão em P = 0 até 2560 px de janela)
    const Lt = w.laptop; if (Lt && Lt.s && Lt.s !== 1) for (const k of ['w', 'd', 'h', 'r', 'sw', 'sh', 'side', 'top', 'chin', 'lidT']) Lt[k] *= Lt.s;
    W0 = w; return w;
  }

  // ---------------- lights ----------------
  const AMB = [0.30, 0.355, 0.46];       // blue-hour ambient
  const WINL = [0.30, 0.41, 0.60];       // light from the window (directional, soft)
  const LMP = [1.0, 0.90, 0.77];         // ~4000K, desaturated ~30%
  const WIN_DIR = norm([0, 0.35, 1]);
  let LK = 1;                            // lamp on/off for the current pass
  function lampI(p, n) {
    const L = W0.lamp, d = sub(L.bulb, p), dist = len(d), l = mul(d, 1 / dist);
    const cosS = dot(mul(l, -1), L.axis), sw = L.sw != null ? L.sw : 0.16;
    // cutZ: the shade's front lip stops the light short of the viewer (the pool must not run off the bottom of the frame)
    const spot = (sstep(L.c0 || 0.905, L.c1 || 0.985, cosS) * (1 - sw) + sstep(L.s0 || 0.76, L.s1 || 0.93, cosS) * sw) * (L.cutZ ? sstep(L.cutZ[0], L.cutZ[1], p[2]) * (L.cutZ.length > 2 ? 1 - sstep(L.cutZ[2], L.cutZ[3], p[2]) : 1) : 1);
    const lam = n ? Math.max(0, dot(n, l)) : 1;
    return LK * (L.k || 1) * spot * lam / (1 + Math.pow(dist / 42, 2)) * 3.3;
  }
  function light(alb, p, n, k = {}) {
    const I = lampI(p, n) * (k.lk != null ? k.lk : 1), w = Math.max(0, dot(n, WIN_DIR)) * (k.wk != null ? k.wk : 1);
    const a = k.amb != null ? k.amb : 1;
    return [0, 1, 2].map(i => clamp(alb[i] * (AMB[i] * a + WINL[i] * w * 0.7 + LMP[i] * I * 2.0), 0, 255));
  }

  // ---------------- camera ----------------
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
  // O fundo largo (bg) mostra o mundo como ele é, com o notebook renderizado: ele nunca é ampliado.
  const BG_WORLD = {
    laptop: { s: 0.84 },
    // o abajur baixo na ponta: a poça pega de leve a caixa e o celular (como no fundo de referência, onde ela pousava no caderno)
    lamp: { base: [-100, 0, 50], elbow: [-108, 46, 56], head: [-84, 33, 38], target: [-52, 0, 30], k: 0.66, openK: 0.33 }
  };
  const CAMS = {
    // bg: a mesma direção da câmera media, mais aberta: o notebook fica atrás do cartão de 300 x 400 em P = 0 (a 1440x900, a tela
    // dele no fundo cai quase no mesmo lugar e no mesmo tamanho da tela no cartão), sem dois notebooks empilhados.
    bg: { W: 1920, H: 1080, pos: [3, 44, -110], target: [3, 22, 34], F: 1100, shiftY: -66, cityBlur: 6, bokeh: 13, bokehP: 0.035, refl: 0.13,
      dof: 0, vig: 0.85, bloom: 0.35, lampGlow: 0.05, grain: 5, rimA: 0.3, titleBand: [400, 680, 0.72], hint: [960, 835, 720, 125, 1.0], bottomFade: [0.78, 0.95, 1.0, 0.35, 0.6],
      // o abajur é baixo: sem limite, a caneca jogava uma sombra de ~45 cm. Todas as sombras do abajur ficam curtas (até
      // `sombraMax` x a altura de cada ponto) e mais leves no miolo (`sombraA`).
      sombraMax: 1.1, sombraA: 0.7,
      world: Object.assign({ win: { mull: [[-43.5, -40.5], [40.5, 43.5]] } }, BG_WORLD),
      towers: [[-71, -18.4, 28, 1], [-18.4, -13.2, 9.5, 0], [13.4, 18.6, 11, 0], [18.6, 73, 31, 1]], centre: [-15.6, 15.6, -5.4] },
    // media: a mesma cidade desfocada do expansao (montada no quadro 1280x720), câmera mais baixa e de frente para o notebook,
    // com a tela dele no centro do quadro (onde fica o centro do título na pausa). `semAparelho`: o notebook não é desenhado.
    media: { W: 1280, H: 720, pos: [3, 42, -54], target: [3, 21, 34], F: 1050, shiftY: -80, cityBlur: 13, bokeh: 36, discBlur: 0.7, refl: 0.06, cityGain: 1.35,
      mcity: true, dof: 2.5, vig: 0.78, bloom: 0, lampGlow: 0, grain: 5, winBand: 0.3, lampBody: false, cone: false, bottomFade: [0.91, 0.97, 1.0, 0.45, 0.62],
      semAparelho: true, skyEl: -11,
      // o peitoril escurece à direita da tela (rampa escondida atrás do notebook): a linha 2 do título fica sobre uma superfície só
      peitoril: [0.45, 0.6, 0.64],
      world: { win: { mull: [[-43, -40], [46, 49]] },
        lamp: { head: [-40, 95, 16], target: [-30, 0, 24], k: 1.6, c0: 0.88, c1: 0.985, s0: 0.78, s1: 0.94, sw: 0.4, cutZ: [3, 22, 24, 54] } } }
  };
  // A tampa do notebook inclina para trás o mesmo ângulo da câmera media (sem guinada: x da câmera = x do alvo).
  { const m = CAMS.media, f = norm(sub(m.target, m.pos)); BASE.laptop.tilt = Math.asin(-f[1]) * 180 / Math.PI; }

  // ---------------- o notebook: geometria ----------------
  // A tampa é um plano gerado por `dir` (x) e `up` (sobe e recua `tilt`), a partir da dobradiça no fundo da base.
  function laptopGeo(L) {
    const t = L.tilt * Math.PI / 180, up = [0, Math.cos(t), Math.sin(t)], dir = [1, 0, 0], nrm = [0, Math.sin(t), -Math.cos(t)];
    const hinge = [L.x, L.h * 0.55, L.z + L.d / 2 - 0.9];
    const lidH = L.chin + L.sh + L.top;
    const at = (u, v, off = 0) => add(add(add(hinge, mul(dir, u)), mul(up, v)), mul(nrm, off));   // u: da esquerda para a direita; v: para cima na tampa
    const tela = [[-L.sw / 2, L.chin + L.sh], [L.sw / 2, L.chin + L.sh], [L.sw / 2, L.chin], [-L.sw / 2, L.chin]].map(([u, v]) => at(u, v, 0.02));
    return { up, dir, nrm, hinge, lidH, at, tela };
  }
  // O retângulo da tela do notebook na câmera `which`, em px do quadro: centro, largura, altura e os 4 cantos.
  function telaDoNotebook(which, extra) {
    const o = Object.assign({}, CAMS[which], extra || {}), prev = W0;
    const w = prepWorld(o); W0 = prev;
    const cam = makeCam(o), g = laptopGeo(w.laptop), q = g.tela.map(p => cam.P(p));
    const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, largura: x1 - x0, altura: y1 - y0, cantos: q.map(p => [p[0], p[1]]) };
  }

  // ---------------- helpers ----------------
  function frameOf(o) { const t = o.rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return (u, h, v) => [o.x + u * c - v * s, (o.y || 0) + h, o.z + u * s + v * c]; }
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
  // A sombra de p na mesa, vinda da luz L; `maxK`: o deslocamento na mesa fica em até maxK x a altura de p (sombra curta).
  function shadowPt(L, p, maxK) {
    const t = L[1] / (L[1] - p[1]), s = [L[0] + (p[0] - L[0]) * t, 0, L[2] + (p[2] - L[2]) * t];
    if (maxK == null) return s;
    const dx = s[0] - p[0], dz = s[2] - p[2], d = Math.hypot(dx, dz), lim = maxK * Math.max(0, p[1]);
    return d > lim ? [p[0] + dx * lim / d, 0, p[2] + dz * lim / d] : s;
  }
  function discT(ctx, cam, c, a, b) { const p0 = cam.P(c), pa = cam.P(add(c, a)), pb = cam.P(add(c, b)); ctx.setTransform(pa[0] - p0[0], pa[1] - p0[1], pb[0] - p0[0], pb[1] - p0[1], p0[0], p0[1]); }
  const ID = ctx => ctx.setTransform(1, 0, 0, 1, 0, 0);
  function radial(ctx, stops, r = 1) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
  function lin(ctx, a, b, stops) { const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); for (const s of stops) g.addColorStop(clamp(s[0], 0, 1), s[1]); return g; }
  function layer(W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  function glow(ctx, p, r, col, a) { if (a <= 0 || r <= 0) return; const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }
  function solid(W, H, v) { const c = layer(W, H), x = c.getContext('2d'); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(0, 0, W, H); return c; }

  // ---------------- base pass (per pixel): wall, window hole, desk ----------------
  function basePass(ctx, cam, o) {
    const { W, H } = cam, img = ctx.createImageData(W, H), D = img.data;
    const pos = cam.pos, wz = W0.wallZ, dk = W0.desk, win = W0.win, L = W0.lamp;
    const R = rng(7);
    const wallA = [44, 50, 62], deskA = [54, 52, 49], frontA = [30, 34, 42];
    for (let sy = 0; sy < H; sy++) {
      for (let sx = 0; sx < W; sx++) {
        const d = cam.ray(sx + 0.5, sy + 0.5); let col, a = 255;
        const tw = d[2] > 0 ? (wz - pos[2]) / d[2] : 1e9; const wy = pos[1] + d[1] * tw, wx = pos[0] + d[0] * tw;
        if (wy >= 0) {
          if (wx > win.x0 && wx < win.x1 && wy > win.y0 && wy < win.y1) { a = 0; col = [0, 0, 0]; }
          else {
            const p = [wx, wy, wz];
            const top = sstep(30, 170, wy);
            col = light(wallA, p, [0, 0, -1], { amb: 0.8 - 0.45 * top, wk: 0 });
            const b = Math.exp(-(Math.pow((wx - L.target[0]) / 50, 2) + Math.pow(wy / 26, 2)));
            col = add(col, mul([LMP[0] * 255, LMP[1] * 255, LMP[2] * 255], b * 0.04 * LK));
          }
        } else {
          const t = -pos[1] / d[1]; const x = pos[0] + d[0] * t, z = pos[2] + d[2] * t;
          if (z >= dk.z0 && x > dk.x0 && x < dk.x1) {
            const p = [x, 0, z];
            const back = sstep(20, 63, z);
            col = light(deskA, p, [0, 1, 0], { wk: 0.22 + back * 0.75 });
            // satin reflection of the bulb on the laminate
            const v = norm(sub(pos, p)), l = norm(sub(L.bulb, p)), h = norm(add(v, l));
            const spec = Math.pow(Math.max(0, h[1]), 60) * lampI(p, null) * 26;
            col = add(col, [spec * LMP[0], spec * LMP[1], spec * LMP[2]]);
            // oak-veneer laminate: long grain along x, 3-5% contrast relative to the local value
            const lum = (col[0] + col[1] + col[2]) / 3;
            const fig = Math.sin(z * 2.1 + Math.sin(x * 0.037 + z * 0.21) * 2.6) * 0.55 + Math.sin(z * 6.7 + Math.sin(x * 0.09) * 1.3) * 0.3 + Math.sin(z * 17.3 + x * 0.013) * 0.15;
            const g = (R() - 0.5) * 2.0 + fig * lum * 0.045; col = add(col, [g, g * 0.98, g * 0.93]);
          } else {
            const tf = (dk.z0 - pos[2]) / d[2]; const fy = pos[1] + d[1] * tf;
            if (d[2] > 0 && fy > -dk.th && fy <= 0) { const p = [pos[0] + d[0] * tf, fy, dk.z0]; col = light(frontA, p, [0, 0, -1], { amb: 0.5, wk: 0 }); }
            else col = [5, 10, 17];
          }
        }
        const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    // lit front edge of the desk (thin line, warm-grey where the lamp reaches)
    const P = cam.P; const e1 = P([dk.x0, 0, dk.z0 + 0.01]), e2 = P([dk.x1, 0, dk.z0 + 0.01]), pc = P([L.target[0], 0, dk.z0 + 0.01]);
    if (e1[2] > 0 && e2[2] > 0) {
      ctx.lineWidth = Math.max(1, cam.S([0, 0, 0.01]) * 0.16);
      ctx.strokeStyle = lin(ctx, e1, e2, [[0, rgba(C.n700, 0.45)], [clamp((pc[0] - e1[0]) / (e2[0] - e1[0]), 0.05, 0.95), rgba(mix(C.n300, C.lampW, 0.5), 0.55 * LK + 0.15)], [1, rgba(C.n700, 0.45)]]);
      ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke();
    }
  }

  // ---------------- city (direction space, defocused) ----------------
  const SKY = () => [[60, mix(C.n900, C.n950, 0.35)], [30, mix(C.n800, C.n900, 0.5)], [12, mix(C.n700, C.n800, 0.5)], [4, mix(C.n600, C.n700, 0.6)], [0.8, mix(C.n500, C.n600, 0.7)],
    [0, mix(C.n600, C.n500, 0.2)], [-1.5, mix(C.n700, C.n600, 0.35)], [-6, mix(C.n800, C.n700, 0.4)], [-16, mix(C.n900, C.n800, 0.5)], [-70, mix(C.n950, C.n900, 0.55)]];
  function skyCol(el, S) {
    if (el >= S[0][0]) return S[0][1];
    for (let i = 1; i < S.length; i++) if (el >= S[i][0]) { const t = (el - S[i][0]) / (S[i - 1][0] - S[i][0]); return mix(S[i][1], S[i - 1][1], t); }
    return S[S.length - 1][1];
  }
  // build the city (deterministic, direction space; towers can be staged per camera)
  const TOWERS = [[-60, -15.2, 28, 1], [-15.2, -11.0, 9.5, 0], [11.2, 15.6, 11, 0], [15.6, 62, 31, 1]];
  const CENTRE0 = [-13.2, 13.2, -5.4];
  const CITYC = {};
  function buildCity(towers, CENTRE) {
    const key = JSON.stringify([towers, CENTRE]); if (CITYC[key]) return CITYC[key];
    const R = rng(1234), sil = [], lights = [];
    const hid = (a, e) => towers.some(([a1, a2, top]) => a >= a1 && a <= a2 && e <= top) || (a >= CENTRE[0] && a <= CENTRE[1] && e <= CENTRE[2]);
    const pick = () => { const t = R(); return t < 0.6 ? C.n300 : t < 0.94 ? C.e300 : C.n100; };
    const lv = () => { const t = R(); return t < 0.5 ? 0.55 : t < 0.85 ? 0.8 : 1.0; };   // 3 brightness levels
    // far skyline
    for (let a = -75; a < 75;) {
      const w = 0.8 + R() * 2.6, top = 0.3 + Math.pow(R(), 2.2) * 4.0;
      sil.push([a, a + w, -0.4, top, mix(C.n700, C.n800, 0.55 + R() * 0.35)]);
      for (let e = 0; e < top - 0.15; e += 0.42) for (let b = a + 0.12; b < a + w - 0.1; b += 0.32) if (R() < 0.18) { const L = [b + (R() - 0.5) * 0.08, e + 0.1, 0.14, 0.17, pick(), (0.22 + R() * 0.2) * lv(), 0]; if (!hid(L[0], L[1])) lights.push(L); }
      a += w + R() * 0.4;
    }
    // lower city: rows of lights grouped in blocks, thinner toward the steep (near) rooftops
    for (let k = 0; k < 44; k++) {
      const e = -0.6 - Math.pow(k / 43, 1.4) * 44, sz = 0.12 + (-e) * 0.05;
      const dens0 = e > -14 ? 0.36 : 0.36 * Math.exp((e + 14) / 14);
      let a = -75;
      while (a < 75) {
        const blockW = (2 + R() * 6) * (0.6 + (-e) * 0.06), dens = R() < 0.4 ? 0.04 : dens0;
        for (let b = a; b < a + blockW; b += sz * (1.9 + R() * 2.6)) if (R() < dens) { const L = [b, e + (R() - 0.5) * sz, sz * (0.8 + R() * 1.5), sz * (0.6 + R() * 0.6), pick(), (0.16 + R() * 0.26) * lv(), 1]; if (!hid(L[0], L[1])) lights.push(L); }
        a += blockW + R() * 2;
      }
    }
    // towers framing the centre pane + a low dark building straight across (behind the hint line)
    for (const [a1, a2, top, near] of towers) {
      sil.push([a1, a2, -75, top, mix(C.n900, C.n950, 0.4)]);
      const fh = near ? 1.75 : 1.0, fw = near ? 1.3 : 0.8;
      for (let e = -70; e < top - fh * 0.6; e += fh) {
        const rowOn = R() < 0.72, rowLv = lv();
        for (let a = a1 + fw * 0.3; a < a2 - fw * 0.6; a += fw) {
          const on = R() < (near ? 0.155 : 0.21);
          const ja = (R() - 0.5) * fw * 0.22, je = (R() - 0.5) * fh * 0.16, sw = 0.55 + R() * 0.2, shh = 0.48 + R() * 0.16;
          if (!rowOn || !on) continue;
          if (a + ja >= CENTRE[0] && a + ja <= CENTRE[1] && e + je <= CENTRE[2]) continue;
          lights.push([a + ja, e + je, fw * sw, fh * shh, pick(), (0.15 + R() * 0.24) * (R() < 0.7 ? rowLv : lv()), 2]);
        }
      }
    }
    sil.push([CENTRE[0], CENTRE[1], -75, CENTRE[2], mix(C.n900, C.n950, 0.25)]);
    for (let e = -70; e < -6.2; e += 1.6) for (let a = -12.6; a < 12.4; a += 1.15) if (R() < 0.05) lights.push([a + (R() - 0.5) * 0.2, e, 0.7, 0.8, pick(), (0.10 + R() * 0.12), 3]);
    return (CITYC[key] = { sil, lights });
  }
  // ---------------- media city: bespoke, laid out in the 1x media frame (u,v 0..1) and carried as directions ----------------
  // Two soft out-of-focus tower masses behind the side panes carry ~80% of the bokeh in loose rows; the centre pane stays a calm gap
  // with a low far skyline and 3 small, faint, staggered discs. Directions make the 2x city plate (other F / shift) line up exactly.
  function mediaCity(cam, o, cv, c, S) {
    const { W, H } = cam, k = o.pxk || 1;
    const ref = makeCam(Object.assign({}, CAMS.media)), sc = cam.F / ref.F;
    const dirOf = (u, v) => { const d = ref.ray(u * 1280, v * 720); return [Math.atan2(d[0], d[2]) * 180 / Math.PI, Math.asin(d[1] / len(d)) * 180 / Math.PI]; };
    const at = (u, v) => { const [az, el] = dirOf(u, v); return cam.D(az, el); };
    const poly = (ctx2, pts) => path(ctx2, pts.map(([u, v]) => at(u, v)));
    // skyEl: a câmera media daqui é mais baixa que a do expansao (~11° a menos de inclinação); o céu é lido com esse
    // desvio, para o quadro ter o mesmo degradê (escuro no alto, sem o claro do horizonte atrás das metades do título).
    const dEl = o.skyEl || 0;
    const skyAt = v => skyCol(dirOf(0.5, v)[1] + dEl, S);
    const skyRows = ctx2 => { for (let sy = 0; sy < H; sy += 2) { const r = cam.ray(W / 2, sy + 1), el = Math.asin(r[1] / len(r)) * 180 / Math.PI; ctx2.fillStyle = rgba(skyCol(el + dEl, S)); ctx2.fillRect(0, sy, W, 2); } };
    const R = rng(2031);
    // silhouettes (defocused)
    const sl = layer(W, H), sx = sl.getContext('2d'); skyRows(sx);
    const fillV = (ctx2, v0, v1, kk) => { ctx2.fillStyle = lin(ctx2, at(0.5, v0), at(0.5, v1), [[0, rgba(mul(skyAt(v0), kk))], [1, rgba(mul(skyAt(v1), kk))]]); };
    // the gap: distant city haze between the towers, a touch lighter than the masses
    { const g0 = at(0.5, 0.16), gx = at(0.82, 0.16), gy = at(0.5, 0.62); sx.save(); sx.setTransform(gx[0] - g0[0], 0, 0, gy[1] - g0[1], g0[0], g0[1]);
      sx.fillStyle = radial(sx, [[0, rgba(mix(C.n600, C.n500, 0.45), o.gapA || 0.3)], [0.55, rgba(mix(C.n600, C.n500, 0.45), (o.gapA || 0.3) * 0.5)], [1, rgba(C.n600, 0)]]); sx.beginPath(); sx.arc(0, 0, 1, 0, 7); sx.fill(); sx.restore(); }
    // far low skyline across the gap (just above the rail), barely darker than the haze
    for (let u = 0.2; u < 0.8;) { const w = 0.03 + R() * 0.06, top = 0.385 + R() * 0.05; poly(sx, [[u, top], [u + w, top], [u + w, 0.9], [u, 0.9]]); fillV(sx, top, 0.6, 0.86 + R() * 0.05); sx.fill(); u += w + R() * 0.012; }
    const TW = [
      { body: [-0.12, 0.17, 0.08], crown: [-0.04, 0.11, -0.2] },     // left: crown leaves the frame, a setback step at the right
      { body: [0.83, 1.12, 0.14], crown: [0.9, 1.12, -0.03] }      // right: stepped, the crown leaves the frame (dark top corner)
    ];
    for (const t of TW) {
      poly(sx, [[t.body[0], t.body[2]], [t.body[1], t.body[2]], [t.body[1], 0.9], [t.body[0], 0.9]]); fillV(sx, t.body[2], 0.6, o.towerK || 0.6); sx.fill();
      poly(sx, [[t.crown[0], t.crown[2]], [t.crown[1], t.crown[2]], [t.crown[1], t.body[2] + 0.01], [t.crown[0], t.body[2] + 0.01]]); fillV(sx, Math.max(0, t.crown[2]), t.body[2], (o.towerK || 0.6) - 0.02); sx.fill();
    }
    skyRows(c); c.filter = `blur(${Math.round(o.cityBlur * k * 0.8)}px)`; c.drawImage(sl, 0, 0); c.filter = 'none';
    const pick = () => { const t = R(); return t < 0.6 ? C.n300 : t < 0.9 ? C.e300 : C.n100; };
    // small window lights: sparse loose rows on the towers, a few on the far skyline
    const lc = layer(W, H), lx = lc.getContext('2d');
    const lite = (u, v, w, h, col, a) => { poly(lx, [[u, v], [u + w, v], [u + w, v + h], [u, v + h]]); lx.fillStyle = rgba(col, Math.min(1, a * (o.cityGain || 1))); lx.fill(); };
    for (const t of TW) for (let v = t.body[2] + 0.03; v < 0.5; v += 0.034) { const rowOn = R() < 0.75; for (let u = t.body[0] + 0.01; u < t.body[1] - 0.012; u += 0.024) { const on = R() < 0.2, ju = (R() - 0.5) * 0.006, jv = (R() - 0.5) * 0.006, a = 0.07 + R() * 0.12; if (rowOn && on) lite(u + ju, v + jv, 0.011, 0.009, pick(), a); } }
    for (let u = 0.22; u < 0.78; u += 0.018) if (R() < 0.12) lite(u, 0.44 + R() * 0.04, 0.007, 0.006, pick(), 0.05 + R() * 0.06);
    // bokeh: loose rows on the towers (11) + 3 small faint staggered discs in the centre pane
    const dc = layer(W, H), dx = dc.getContext('2d');
    const disc = (p, r, col, A) => { const gr = dx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      gr.addColorStop(0, rgba(col, A * 0.75)); gr.addColorStop(0.55, rgba(col, A)); gr.addColorStop(0.82, rgba(col, A * 0.6)); gr.addColorStop(1, rgba(col, 0));
      dx.fillStyle = gr; dx.beginPath(); dx.arc(p[0], p[1], r, 0, 7); dx.fill(); };
    const D = [
      [0.030, 0.150, 1.0], [0.130, 0.130, 0.70], [0.080, 0.265, 1.10], [0.015, 0.370, 0.78], [0.120, 0.385, 0.90],
      [0.870, 0.210, 0.86], [0.975, 0.190, 1.08], [0.920, 0.315, 0.68], [0.995, 0.305, 0.84], [0.860, 0.420, 0.98], [0.955, 0.410, 0.64]
    ];
    for (const [u, v, rf] of D) disc(at(u + (R() - 0.5) * 0.01, v + (R() - 0.5) * 0.012), o.bokeh * sc * rf, pick(), 0.18 + R() * 0.14);
    for (const [u, v, rf, A] of [[0.395, 0.060, 0.52, 0.17], [0.625, 0.150, 0.36, 0.155], [0.505, 0.245, 0.25, 0.15]]) disc(at(u, v), o.bokeh * sc * rf, C.n300, A);
    c.save(); c.globalCompositeOperation = 'screen';
    c.filter = `blur(${Math.round(o.cityBlur * k * 0.55)}px)`; c.drawImage(lc, 0, 0);
    c.filter = `blur(${Math.round(o.cityBlur * k * (o.discBlur || 0.35))}px)`; c.drawImage(dc, 0, 0); c.restore();
    return cv;
  }
  function cityLayer(cam, o) {
    const { W, H } = cam, k = o.pxk || 1; const cv = layer(W, H), c = cv.getContext('2d');
    const S = SKY();
    if (o.mcity) return mediaCity(cam, o, cv, c, S);
    const { sil, lights } = buildCity(o.towers || TOWERS, o.centre || CENTRE0);
    // sky / ground gradient by elevation, row by row (robust for pitched cameras)
    const skyRows = ctx2 => { for (let sy = 0; sy < H; sy += 2) { const r = cam.ray(W / 2, sy + 1), el = Math.asin(r[1] / len(r)) * 180 / Math.PI; ctx2.fillStyle = rgba(skyCol(el, S)); ctx2.fillRect(0, sy, W, 2); } };
    const quad = (a1, a2, e1, e2) => {
      const n = Math.max(1, Math.ceil((a2 - a1) / 3)), pts = [];
      for (let i = 0; i <= n; i++) pts.push(cam.D(a1 + (a2 - a1) * i / n, e1));
      for (let i = n; i >= 0; i--) pts.push(cam.D(a1 + (a2 - a1) * i / n, e2));
      return pts.some(p => p[2] < 0.05) ? null : pts;
    };
    // sky + silhouettes, defocused (an unblurred sky underneath keeps the frame edges clean)
    const sc = layer(W, H), sx = sc.getContext('2d'); skyRows(sx);
    for (const [a1, a2, e1, e2, col] of sil) { const q = quad(a1, a2, e1, e2); if (!q) continue; sx.fillStyle = rgba(col); path(sx, q); sx.fill(); }
    skyRows(c); c.filter = `blur(${Math.round(o.cityBlur * k * 0.8)}px)`; c.drawImage(sc, 0, 0); c.filter = 'none';
    // lights on their own layer so the title band / hint zone can be calmed
    const lc = layer(W, H), lx = lc.getContext('2d');
    for (const [a, e, w, h, col, al] of lights) { const q = [cam.D(a, e), cam.D(a + w, e), cam.D(a + w, e + h), cam.D(a, e + h)]; if (q.some(p => p[2] < 0.05)) continue; if (q.every(p => p[0] < -40 || p[0] > W + 40 || p[1] < -40 || p[1] > H + 40)) continue; lx.fillStyle = rgba(col, Math.min(1, al * (o.cityGain || 1))); path(lx, q); lx.fill(); }
    // bokeh discs: few, large, soft, one tone
    const dc = layer(W, H), dx = dc.getContext('2d'); const R2 = rng(99);
    const disc = (p, r, col, A) => { const gr = dx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      gr.addColorStop(0, rgba(col, A * 0.75)); gr.addColorStop(0.55, rgba(col, A)); gr.addColorStop(0.82, rgba(col, A * 0.6)); gr.addColorStop(1, rgba(col, 0));
      dx.fillStyle = gr; dx.beginPath(); dx.arc(p[0], p[1], r, 0, 7); dx.fill(); };
    if (o.discN) {
      // media: a few large, soft discs spread evenly over the glass (sampled once in the 1x frame, stored as directions)
      const ref = makeCam(Object.assign({}, CAMS.media)), R3 = rng(321), pts = []; let tries = 0;
      while (pts.length < o.discN && tries++ < 20000) {
        const u = -0.03 + R3() * 1.06, v = -0.04 + R3() * 0.5, q = [u * 1280, v * 720];
        if (pts.some(p => Math.hypot(p[0] - q[0], p[1] - q[1]) < (o.discMin || 150))) continue;
        pts.push(q);
      }
      const sc = cam.F / ref.F;
      for (const q of pts) {
        const d = ref.ray(q[0], q[1]), az = Math.atan2(d[0], d[2]) * 180 / Math.PI, el = Math.asin(d[1] / len(d)) * 180 / Math.PI;
        const p = cam.D(az, el); const t = R2(); const col = t < 0.6 ? C.n300 : t < 0.9 ? C.e300 : C.n100;
        disc(p, o.bokeh * sc * (0.6 + R2() * 0.9), col, 0.15 + R2() * 0.17);
      }
    } else for (const [a, e, w, h, col, al] of lights) {
      if (R2() > (o.bokehP || 0.04)) continue;
      const p = cam.D(a + w / 2, e + h / 2); if (p[2] <= 0.05 || p[0] < -80 || p[0] > W + 80 || p[1] < -80 || p[1] > H + 80) continue;
      disc(p, o.bokeh * k * (0.8 + R2() * 0.6), col, (o.discA || 0.13) + R2() * 0.15);
    }
    const calm = (ctx2) => {
      ctx2.globalCompositeOperation = 'destination-out';
      if (o.titleBand) { const [y0, y1, s] = o.titleBand; const g = ctx2.createLinearGradient(0, y0 * k, 0, y1 * k); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, `rgba(0,0,0,${s})`); g.addColorStop(0.75, `rgba(0,0,0,${s})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx2.fillStyle = g; ctx2.fillRect(0, 0, W, H); }
      if (o.hint) { const [hx0, hy0, rx, ry, s] = o.hint; ctx2.setTransform(rx * k, 0, 0, ry * k, hx0 * k, hy0 * k); ctx2.fillStyle = radial(ctx2, [[0, `rgba(0,0,0,${s})`], [0.6, `rgba(0,0,0,${s * 0.8})`], [1, 'rgba(0,0,0,0)']]); ctx2.beginPath(); ctx2.arc(0, 0, 1, 0, 7); ctx2.fill(); ctx2.setTransform(1, 0, 0, 1, 0, 0); }
      ctx2.globalCompositeOperation = 'source-over';
    };
    calm(lx); calm(dx);
    c.save(); c.globalCompositeOperation = 'screen'; c.filter = `blur(${Math.round(o.cityBlur * k)}px)`; c.drawImage(lc, 0, 0); c.filter = `blur(${Math.round(o.cityBlur * k * (o.discBlur || 0.35))}px)`; c.drawImage(dc, 0, 0); c.restore();
    return cv;
  }

  // ---------------- window ----------------
  function panes(cam) {
    const w = W0.win, z = W0.glassZ, f = w.frame, y0 = w.y0 + w.rail, y1 = w.y1;
    const xs = [[w.x0 + f, w.mull[0][0]], [w.mull[0][1], w.mull[1][0]], [w.mull[1][1], w.x1 - f]];
    return xs.map(([a, b]) => [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]].map(cam.P));
  }
  function drawWindow(ctx, cam, city, o) {
    const w = W0.win, z0 = W0.wallZ, z1 = W0.glassZ, P = cam.P, L = W0.lamp, H = cam.H;
    ctx.save(); ctx.beginPath(); for (const q of panes(cam)) { q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
    ctx.clip(); ctx.drawImage(city, 0, 0);
    // 3% haze on the glass plane
    ctx.fillStyle = rgba(C.n300, 0.03); ctx.fillRect(0, 0, cam.W, H);
    if (o.winBand) { const g = ctx.createLinearGradient(0, H * 0.22, 0, H * 0.72); g.addColorStop(0, rgba(C.n900, 0)); g.addColorStop(0.22, rgba(C.n900, o.winBand)); g.addColorStop(0.8, rgba(C.n900, o.winBand)); g.addColorStop(1, rgba(C.n900, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, cam.W, H); }
    // faint reflection of the lamp in the glass
    ctx.globalCompositeOperation = 'screen';
    const lp = P([L.open[0], L.open[1], z1 + (z1 - L.open[2])]);
    if (lp[2] > 0) glow(ctx, lp, cam.S([0, 40, 100]) * 10, C.lampW, 0.05 * LK);
    ctx.globalCompositeOperation = 'source-over'; ctx.restore();
    const face = (pts, col) => { const q = pts.map(P); if (q.some(p => p[2] <= 0)) return; path(ctx, q); ctx.fillStyle = rgba(col); ctx.fill(); ctx.strokeStyle = rgba(col); ctx.lineWidth = 0.8; ctx.stroke(); };
    const top = 260, fA = [40, 46, 58];
    face([[w.x0, w.y0, z0], [w.x0, w.y0, z1], [w.x0, top, z1], [w.x0, top, z0]], light(fA, [w.x0, 25, 67], [1, 0, 0], { wk: 0 }));
    face([[w.x1, w.y0, z0], [w.x1, w.y0, z1], [w.x1, top, z1], [w.x1, top, z0]], light(fA, [w.x1, 25, 67], [-1, 0, 0], { wk: 0 }));
    // sill: catches the sky
    const sA = P([0, w.y0, z0]), sB = P([0, w.y0, z1]);
    path(ctx, [[w.x0, w.y0, z0], [w.x1, w.y0, z0], [w.x1, w.y0, z1], [w.x0, w.y0, z1]].map(P));
    ctx.fillStyle = lin(ctx, sA, sB, [[0, rgba(light(fA, [0, w.y0, 66], [0, 1, 0], { wk: 0.9 }))], [1, rgba(mix(C.n700, C.n600, 0.4))]]); ctx.fill();
    // sill nose + faint highlight along its edge
    face([[w.x0, w.y0 - 1.0, z0 - 0.3], [w.x1, w.y0 - 1.0, z0 - 0.3], [w.x1, w.y0, z0 - 0.3], [w.x0, w.y0, z0 - 0.3]], light(fA, [0, w.y0, z0], [0, 0, -1], { amb: 0.75, wk: 0 }));
    { const a1 = P([w.x0, w.y0, z0 - 0.3]), a2 = P([w.x1, w.y0, z0 - 0.3]); ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.n400, 0.1)], [0.5, rgba(mix(C.n300, C.lampW, 0.2), 0.42)], [1, rgba(C.n400, 0.1)]]); ctx.lineWidth = Math.max(1, cam.S([0, 0, z0]) * 0.14); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
    const fr = w.frame, rl = w.rail, fz = z1 - 0.01, frameC = mix(C.n900, C.n800, 0.3);
    face([[w.x0, w.y0, fz], [w.x0 + fr, w.y0, fz], [w.x0 + fr, top, fz], [w.x0, top, fz]], frameC);
    face([[w.x1 - fr, w.y0, fz], [w.x1, w.y0, fz], [w.x1, top, fz], [w.x1 - fr, top, fz]], frameC);
    // thin, lighter bottom rail with a lit top edge
    face([[w.x0, w.y0, fz], [w.x1, w.y0, fz], [w.x1, w.y0 + rl, fz], [w.x0, w.y0 + rl, fz]], mix(C.n800, C.n700, 0.45));
    { const a1 = P([w.x0, w.y0 + rl, fz]), a2 = P([w.x1, w.y0 + rl, fz]); ctx.strokeStyle = rgba(C.n400, 0.5); ctx.lineWidth = Math.max(1, cam.S([0, 0, fz]) * 0.16); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
    for (const [a, b] of w.mull) {
      const zf = z1 - 4.5; const side = cam.pos[0] < a ? a : b; const sn = cam.pos[0] < a ? -1 : 1;
      face([[side, w.y0 + rl, zf], [side, w.y0 + rl, z1], [side, top, z1], [side, top, zf]], light(fA, [side, 40, 69], [sn, 0, 0], { wk: 0 }));
      face([[a, w.y0 + rl, zf], [b, w.y0 + rl, zf], [b, top, zf], [a, top, zf]], frameC);
      const e1 = P([a, w.y0 + rl, zf]), e2 = P([a, top, zf]);
      if (e1[2] > 0 && e2[2] > 0) { ctx.strokeStyle = rgba(mix(C.n600, C.n300, 0.25), 0.4); ctx.lineWidth = Math.max(1, cam.S([a, 40, zf]) * 0.25); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); }
    }
    // peitoril: [u0, u1, a] (frações da largura do quadro). Do trilho ao bico do peitoril, escurece até `a` de u0 a u1 e segue
    // escuro até a borda: a face clara não corta a faixa da linha 2 do título ao meio.
    if (o.peitoril) {
      const [u0, u1, a] = o.peitoril;
      path(ctx, [[w.x0 - 20, w.y0 + rl + 0.3, z1], [w.x1 + 20, w.y0 + rl + 0.3, z1], [w.x1 + 20, w.y0 - 1.15, z0 - 0.3], [w.x0 - 20, w.y0 - 1.15, z0 - 0.3]].map(P));
      ctx.fillStyle = lin(ctx, [u0 * cam.W, 0], [u1 * cam.W, 0], [[0, rgba(C.edge, 0)], [1, rgba(C.edge, a)]]); ctx.fill();
    }
  }
  // Com `peitoril`, depois do reflexo na mesa: desfoca o filete (o trilho, o bico do peitoril, a fresta escura e a borda de trás
  // da mesa) à direita da tela, com a mesma rampa. Atrás das letras da linha 2 não fica uma linha horizontal (lia como um tachado).
  function calmaPeitoril(ctx, cam, o) {
    if (!o.peitoril) return;
    const [u0, u1] = o.peitoril, w = W0.win, P = cam.P, H = cam.H;
    const yT = P([0, w.y0 + w.rail, W0.glassZ])[1] - 12, yB = P([0, 0, W0.desk.z1 - 4])[1] + 8, bl = layer(cam.W, H), bx = bl.getContext('2d');
    bx.filter = `blur(${o.peitorilBlur || 8}px)`; bx.drawImage(ctx.canvas, 0, 0); bx.filter = 'none'; bx.globalCompositeOperation = 'destination-in';
    bx.fillStyle = lin(bx, [0, yT], [0, yB], [[0, 'rgba(0,0,0,0)'], [0.25, 'rgba(0,0,0,1)'], [0.75, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); bx.fillRect(0, 0, cam.W, H);
    bx.fillStyle = lin(bx, [u0 * cam.W, 0], [u1 * cam.W, 0], [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]); bx.fillRect(0, 0, cam.W, H);
    ctx.drawImage(bl, 0, 0);
  }
  function deskReflection(ctx, cam, city, o) {
    const dk = W0.desk, P = cam.P;
    const yS = P([0, W0.win.y0, W0.glassZ])[1];
    // a borda de perto do recorte fica à frente da câmera (a mesa funda passa por baixo dela, e a projeção viraria do avesso)
    const zn = Math.max(dk.z0, cam.pos[2] + 5) + 0.5;
    ctx.save(); path(ctx, [[dk.x0, 0, zn], [dk.x1, 0, zn], [dk.x1, 0, dk.z1], [dk.x0, 0, dk.z1]].map(P)); ctx.clip();
    const tmp = layer(cam.W, cam.H), t = tmp.getContext('2d');
    t.filter = `blur(${Math.round(o.cityBlur * 1.8)}px)`; t.translate(0, yS * 2 + 4); t.scale(1, -1); t.drawImage(city, 0, 0); t.setTransform(1, 0, 0, 1, 0, 0); t.filter = 'none';
    t.globalCompositeOperation = 'destination-in';
    const yN = P([0, 0, 30])[1];
    t.fillStyle = lin(t, [0, yS], [0, yN], [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); t.fillRect(0, 0, cam.W, cam.H);
    ctx.globalAlpha = o.refl; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }

  // ---------------- shadows / contact AO ----------------
  function boxPts() { const b = W0.box, fr = frameOf(b), r = []; for (const [u, hh] of rrect(b.w, b.h, b.r, 3)) for (const v of [-b.d / 2, b.d / 2]) r.push(fr(u, hh + b.h / 2, v)); return r; }
  function mugPts() { const m = W0.mug, r = []; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; for (const h of [0, m.h]) r.push([m.x + m.r * Math.cos(a), h, m.z + m.r * Math.sin(a)]); } return r; }
  function slabPts(o) { const fr = frameOf(o), r = []; for (const [u, v] of rrect(o.w, o.d, 1, 3)) for (const h of [0, o.h]) r.push(fr(u, h, v)); return r; }
  function lampBasePts() { const L = W0.lamp, r = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; for (const h of [0, 2.4]) r.push([L.base[0] + 8.2 * Math.cos(a), h, L.base[2] + 8.2 * Math.sin(a)]); } return r; }
  // O notebook para as sombras: a base (rrect, chão e tampo) e os cantos da tampa.
  function laptopPts() {
    const L = W0.laptop, g = laptopGeo(L), r = slabPts({ x: L.x, z: L.z, rot: 0, w: L.w, d: L.d, h: L.h });
    for (const u of [-L.w / 2, L.w / 2]) for (const v of [0, g.lidH]) r.push(g.at(u, v));
    return r;
  }
  function drawShadows(ctx, cam, o = {}) {
    const { W, H } = cam, L = W0.lamp.bulb, P = cam.P;
    const sh = layer(W, H), s = sh.getContext('2d');
    s.fillStyle = 'rgb(0,0,0)';
    const lp = W0.laptop ? laptopPts() : null;
    const sets = []; if (W0.box) sets.push(boxPts()); if (W0.mug) sets.push(mugPts()); if (W0.phone) sets.push(slabPts(W0.phone));
    const todos = lp ? sets.concat([lp]) : sets;
    const castOf = pts => hull(pts.map(p => p[1] > 0.05 ? shadowPt(L, p, o.sombraMax) : p).concat(pts.filter(p => p[1] <= 0.05)).map(P));
    const k = cam.S([0, 0, 30]);
    // lamp-cast shadows
    s.filter = `blur(${Math.round(k * 0.9)}px)`; s.globalAlpha = 0.55 * (0.35 + 0.65 * LK) * (o.sombraA != null ? o.sombraA : 1);
    for (const pts of todos) { if (L[1] > 1) { path(s, castOf(pts)); s.fill(); } }
    // soft window-side shadow toward the viewer (sky light from behind)
    s.filter = `blur(${Math.round(k * 1.6)}px)`; s.globalAlpha = 0.32;
    for (const pts of sets) { path(s, hull(pts.map(p => [p[0], 0, p[2] - p[1] * 0.55]).map(P))); s.fill(); }
    // ambient occlusion: a slightly grown footprint, medium blur
    const ao = (c2, pts, bl, f2) => {
      c2.filter = `blur(${Math.max(1, Math.round(k * bl))}px)`; c2.globalAlpha = 0.5;
      const f = pts.filter(p => p[1] <= 0.05), c = f.reduce((a, p) => add(a, p), [0, 0, 0]).map(v => v / f.length);
      path(c2, hull(f.map(p => f2(add(c, mul(sub(p, c), 1.12)))).map(P))); c2.fill();
    };
    for (const pts of sets) ao(s, pts, 0.6, p => p);
    // O notebook tem a penumbra (janela e AO) numa camada própria, deslocada para a direita (o abajur está à esquerda) e
    // apagada à esquerda da base: do lado da luz fica só a linha de contato, e o vetor por cima não deixa sobra.
    // (o AO e a linha de contato dele têm desfoque largo, ~8-11 px na media: o vetor por cima tolera 1-2 px de arredondamento)
    if (lp) {
      const Lt = W0.laptop, nl = layer(W, H), n = nl.getContext('2d'), dx = Lt.w * 0.04, desl = p => [p[0] + dx, p[1], p[2]];
      n.fillStyle = 'rgb(0,0,0)';
      n.filter = `blur(${Math.round(k * 1.6)}px)`; n.globalAlpha = 0.32; path(n, hull(lp.map(p => desl([p[0], 0, p[2] - p[1] * 0.55])).map(P))); n.fill();
      ao(n, lp, 0.9, desl);
      const fr = frameOf({ x: Lt.x, z: Lt.z, rot: 0 }), e = 0.25;
      const a = P(fr(-Lt.w / 2 + e, 0, -Lt.d / 2 - 30)), b = P(fr(-Lt.w / 2 + e, 0, Lt.d / 2 + 30));
      n.filter = 'none'; n.globalAlpha = 1; n.globalCompositeOperation = 'destination-out';
      path(n, [[-W, a[1]], a, b, [-W, b[1]]]); n.fill();
      s.filter = 'none'; s.globalAlpha = 1; s.drawImage(nl, 0, 0);
    }
    // tight contact line
    s.globalAlpha = 0.9;
    for (const pts of todos) { s.filter = `blur(${Math.max(1, Math.round(k * (pts === lp ? 0.66 : 0.18)))}px)`; path(s, hull(pts.filter(p => p[1] <= 0.05).map(P))); s.fill(); }
    s.filter = 'none';
    ctx.save(); ctx.globalAlpha = 0.8; ctx.drawImage(sh, 0, 0); ctx.restore();
  }

  // ---------------- objects ----------------
  function slab(ctx, cam, o, sideFill, topFill, r) {
    const fr = frameOf(o), outl = rrect(o.w, o.d, r);
    const bot = outl.map(([u, v]) => cam.P(fr(u, 0, v))), tp = outl.map(([u, v]) => cam.P(fr(u, o.h, v)));
    path(ctx, hull(bot.concat(tp))); ctx.fillStyle = sideFill; ctx.fill();
    path(ctx, tp); ctx.fillStyle = topFill; ctx.fill();
    return { fr, tp };
  }
  // ---------------- o notebook ----------------
  // O brilho frio da tela na mesa (Q18): uma elipse à frente da base, mais larga que ela e curta em profundidade, com nada
  // dentro da pegada (a tela ilumina a mesa à frente e dos lados, não por baixo). Fica também na mídia sem o notebook.
  // Depois, a linha de oclusão logo à frente do pé da base (um pouco além das quinas): a base pousa na mesa.
  // A tela tem o fundo navy da página e pouco texto: ilumina pouco. O brilho é um azul-navy claro, mais fraco que a poça do
  // abajur, e morre logo à frente da base (antes de y 680 na mídia).
  function brilhoDaTela(L) { const zf = L.z - L.d / 2; return { centro: [L.x, 0.05, zf - L.d * 0.1], semiX: L.w * 0.78, semiZ: L.d * 0.36 }; }
  function screenGlow(ctx, cam) {
    const L = W0.laptop, k = L.glow != null ? L.glow : 1, col = GLOW_C, P = cam.P;
    const fr = frameOf({ x: L.x, z: L.z, rot: 0 }), bt = brilhoDaTela(L);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, cam.W, cam.H);
    rrect(L.w, L.d, L.r, 6).map(([u, v]) => P(fr(u, 0, v))).forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    ctx.clip('evenodd');
    discT(ctx, cam, bt.centro, [bt.semiX, 0, 0], [0, 0, bt.semiZ]);
    ctx.fillStyle = radial(ctx, [[0, rgba(col, GLOW_A * k)], [0.4, rgba(col, GLOW_A * 0.47 * k)], [1, rgba(col, 0)]]);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ID(ctx);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    const s = cam.S(fr(0, 0, -L.d / 2)), e = 6 / s, dz = 2.6 / s;
    const a1 = P(fr(-L.w / 2 - e, 0, -L.d / 2 - dz)), a2 = P(fr(L.w / 2 + e, 0, -L.d / 2 - dz));
    ctx.filter = `blur(${Math.max(1, Math.round(s * 0.1))}px)`; ctx.lineCap = 'round';
    ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.edge, 0)], [0.04, rgba(C.edge, 0.4)], [0.96, rgba(C.edge, 0.4)], [1, rgba(C.edge, 0)]]);
    ctx.lineWidth = Math.max(2, s * 0.32); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
    ctx.restore();
  }

  // O notebook aberto: base de alumínio grafite com teclado (teclas sem legenda) e trackpad, tampa com moldura preta e a
  // tela só no navy da página. Não é desenhado com `semAparelho` (câmera media).
  function drawLaptop(ctx, cam, o) {
    const L = W0.laptop; if (!L || o.semAparelho) return;
    const P = cam.P, g = laptopGeo(L), fr = frameOf({ x: L.x, z: L.z, rot: 0 });
    const alu = [31, 34, 41], glowC = GLOW_C;
    const D = (u, v, h = L.h) => P(fr(u, h, v));          // base: u de um lado ao outro, v da frente (-) para o fundo (+)
    const quad = (u0, v0, u1, v1) => [D(u0, v0), D(u1, v0), D(u1, v1), D(u0, v1)];
    // base: a lateral e o tampo, com a luz do abajur de um lado
    const outl = rrect(L.w, L.d, L.r, 6);
    const bot = outl.map(([u, v]) => D(u, v, 0)), tp = outl.map(([u, v]) => D(u, v));
    path(ctx, hull(bot.concat(tp))); ctx.fillStyle = rgba(mix(light(alu, fr(0, L.h / 2, -L.d / 2), [0, 0, -1], { amb: 0.8 }), C.black, 0.35)); ctx.fill();
    const dl = light(alu, fr(-L.w / 2, L.h, 0), [0, 1, 0]), dr = light(alu, fr(L.w / 2, L.h, 0), [0, 1, 0]);
    path(ctx, tp); ctx.fillStyle = lin(ctx, D(-L.w / 2, 0), D(L.w / 2, 0), [[0, rgba(dl)], [1, rgba(dr)]]); ctx.fill();
    // teclado: seis fileiras de teclas escuras (a de cima mais fina; a de baixo com a barra de espaço), sem legenda
    const ks = L.s || 1, keyC = rgba([13, 15, 20], 0.88), gap = 0.26 * ks;   // ks: a escala do notebook (medidas do de 31 cm)
    let v = L.d / 2 - 1.9 * ks;
    [[0.8, 14], [1.4, 14], [1.4, 14], [1.4, 13], [1.4, 12], [1.4, 0]].forEach(([hk, n]) => {
      const v1 = v, v0 = v - hk * ks; v = v0 - gap;
      const parts = [];
      if (!n) parts.push([-12.6, -9.1], [-8.85, -6.5], [-6.25, 6.0], [6.25, 8.45], [8.7, 10.5], [10.75, 12.6]);
      else { const wk = (25.2 - 0.26 * (n - 1)) / n; for (let i = 0; i < n; i++) parts.push([-12.6 + i * (wk + 0.26), -12.6 + i * (wk + 0.26) + wk]); }
      for (const [a, b] of parts) { path(ctx, quad(a * ks, v0, b * ks, v1)); ctx.fillStyle = keyC; ctx.fill(); }
    });
    // trackpad
    path(ctx, quad(-6.4 * ks, -L.d / 2 + 1.3 * ks, 6.4 * ks, -L.d / 2 + 8.4 * ks)); ctx.fillStyle = rgba(mix(mix(dl, dr, 0.5), C.black, 0.1)); ctx.fill();
    ctx.strokeStyle = rgba(C.n400, 0.22); ctx.lineWidth = 0.8; ctx.stroke();
    // a luz fria da tela no tampo e no teclado, mais forte junto da dobradiça
    ctx.save(); path(ctx, tp); ctx.clip(); ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = lin(ctx, D(0, L.d / 2), D(0, -L.d / 2), [[0, rgba(glowC, 0.17)], [0.55, rgba(glowC, 0.06)], [1, rgba(glowC, 0.02)]]); ctx.fillRect(0, 0, cam.W, cam.H);
    ctx.restore();
    // a quina da frente pega a luz
    { const e1 = D(-L.w / 2 + L.r, -L.d / 2), e2 = D(L.w / 2 - L.r, -L.d / 2);
      ctx.strokeStyle = lin(ctx, e1, e2, [[0, rgba(mix(C.n300, C.lampW, 0.5), 0.38)], [1, rgba(C.n400, 0.14)]]); ctx.lineWidth = Math.max(1, cam.S(fr(0, L.h, -L.d / 2)) * 0.12);
      ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); }
    // dobradiça
    path(ctx, [g.at(-L.w / 2 + 3, -0.5), g.at(L.w / 2 - 3, -0.5), g.at(L.w / 2 - 3, 0.45), g.at(-L.w / 2 + 3, 0.45)].map(P)); ctx.fillStyle = rgba([9, 11, 15]); ctx.fill();
    // tampa: moldura de vidro preto com a borda de alumínio
    const lid = rrect(L.w, g.lidH, 0.9, 5).map(([u, vv]) => P(g.at(u, vv + g.lidH / 2)));
    path(ctx, lid); ctx.fillStyle = rgba([9, 11, 15]); ctx.fill();
    ctx.strokeStyle = rgba(mix(light(alu, g.at(0, g.lidH), g.nrm, { amb: 1.2 }), C.n400, 0.3), 0.85); ctx.lineWidth = Math.max(1, cam.S(g.at(0, g.lidH / 2)) * 0.16); ctx.stroke();
    // a tela: só o navy da página (surface-space), com um brilho suave no meio. Sem elementos de interface: o conteúdo de
    // verdade é a tela em HTML no site, e este notebook do fundo não pode brigar com ela.
    const sq = g.tela.map(p => P(p));
    path(ctx, sq); ctx.fillStyle = rgba(C.n950); ctx.fill();
    ctx.save(); path(ctx, sq); ctx.clip();
    { const c0 = P(g.at(0, L.chin + L.sh / 2, 0.02)), cx1 = P(g.at(L.sw / 2, L.chin + L.sh / 2, 0.02)), cy1 = P(g.at(0, L.chin, 0.02));
      ctx.setTransform(cx1[0] - c0[0], 0, 0, cy1[1] - c0[1], c0[0], c0[1]); }   // -1..1 nos dois eixos, y para baixo
    ctx.fillStyle = radial(ctx, [[0, rgba(mix(C.n900, C.n800, 0.5), 0.95)], [0.6, rgba(C.n900, 0.5)], [1, rgba(C.n950, 0)]], 1.15); ctx.fillRect(-1, -1, 2, 2);
    ID(ctx);
    // brilho do vidro
    { const a1 = P(g.at(-L.sw / 2, L.chin + L.sh)), a2 = P(g.at(L.sw / 6, L.chin)); ctx.fillStyle = lin(ctx, a1, a2, [[0, rgba(C.n300, 0.07)], [0.5, rgba(C.n300, 0.02)], [1, rgba(C.n300, 0)]]); ctx.fillRect(0, 0, cam.W, cam.H); }
    ctx.restore();
  }

  // Phone lying in landscape: Rota de Vendas route over a street grid. No text, no glyph-like strokes.
  function drawPhone(ctx, cam) {
    const o = W0.phone; if (!o) return; const fr = frameOf(o), P = cam.P;
    const sideC = light([58, 64, 76], [o.x, 0.4, o.z], [0, 0.3, -1]);
    const { tp } = slab(ctx, cam, o, rgba(sideC), rgba([6, 9, 13]), 1.05);
    path(ctx, tp); ctx.strokeStyle = rgba(mix(C.n400, C.lampW, 0.3), 0.42); ctx.lineWidth = Math.max(0.8, cam.S([o.x, 0, o.z]) * 0.05); ctx.stroke();
    const sw = o.w - 0.5, sh = o.d - 0.55, h = o.h + 0.005;
    const S2W = (X, Y) => fr(-Y, h, -X);          // X: viewer's left->right along the long side, Y: far->near
    const O = P(S2W(0, 0)), ex = P(S2W(1, 0)), ey = P(S2W(0, 1));
    ctx.save();
    ctx.setTransform(ex[0] - O[0], ex[1] - O[1], ey[0] - O[0], ey[1] - O[1], O[0], O[1]);
    const HX = sh / 2, HY = sw / 2;
    ctx.beginPath(); ctx.roundRect(-HX, -HY, sh, sw, 0.8); ctx.clip();
    ctx.fillStyle = rgba(mix(C.n900, C.n950, 0.25)); ctx.fillRect(-HX, -HY, sh, sw);
    // map: rotated street grid, a few lighter blocks, one avenue
    const th = -4 * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th), gs = 1.15;
    const G2 = (i, j) => [(i * ct - j * st) * gs, (i * st + j * ct) * gs - 0.4];
    const R = rng(11);
    for (let i = -8; i < 8; i++) for (let j = -5; j < 5; j++) { const r = R(); if (r < 0.45) { const q = [G2(i + 0.09, j + 0.09), G2(i + 0.91, j + 0.09), G2(i + 0.91, j + 0.91), G2(i + 0.09, j + 0.91)]; path(ctx, q); ctx.fillStyle = rgba(r < 0.15 ? C.n700 : C.n800, r < 0.15 ? 0.45 : 0.7); ctx.fill(); } }
    ctx.lineCap = 'butt';
    const seg = (a, b, col, wd) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.stroke(); };
    for (let i = -9; i <= 9; i++) { const maj = i % 3 === 0; seg(G2(i, -7), G2(i, 7), rgba(maj ? C.n500 : C.n600, maj ? 0.55 : 0.5), maj ? 0.13 : 0.06); }
    for (let j = -6; j <= 6; j++) { const maj = j % 3 === 0; seg(G2(-11, j), G2(11, j), rgba(maj ? C.n500 : C.n600, maj ? 0.55 : 0.5), maj ? 0.13 : 0.06); }
    seg([-HX - 1, 3.6], [HX + 1, -3.0], rgba(C.n500, 0.35), 0.17);
    // route: right-angle turns with slightly rounded corners
    const RT = [[-5.5, 2], [-3, 2], [-3, -1], [0, -1], [0, -2], [3, -2], [3, 0], [4.3, 0]].map(([i, j]) => G2(i, j));
    const routePath = () => { ctx.beginPath(); ctx.moveTo(RT[0][0], RT[0][1]); for (let i = 1; i < RT.length - 1; i++) ctx.arcTo(RT[i][0], RT[i][1], RT[i + 1][0], RT[i + 1][1], 0.32); ctx.lineTo(RT[RT.length - 1][0], RT[RT.length - 1][1]); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    routePath(); ctx.strokeStyle = rgba(C.c400, 0.12); ctx.lineWidth = 0.42; ctx.stroke();
    routePath(); const gr = ctx.createLinearGradient(RT[0][0], RT[0][1], RT[RT.length - 1][0], RT[RT.length - 1][1]); gr.addColorStop(0, rgba(C.e500, 0.9)); gr.addColorStop(1, rgba(C.c400, 0.85)); ctx.strokeStyle = gr; ctx.lineWidth = 0.16; ctx.stroke();
    // five stops (the last one is the end of the route)
    const stops = [[-4.3, 2], [-3, 0.4], [-1.4, -1], [1.6, -2], [4.3, 0]].map(([i, j]) => G2(i, j));
    stops.forEach((p, k) => {
      const last = k === stops.length - 1;
      if (last) { ctx.fillStyle = radial(ctx, [[0, rgba(C.c300, 0.25)], [1, rgba(C.c300, 0)]], 0.7); ctx.save(); ctx.translate(p[0], p[1]); ctx.beginPath(); ctx.arc(0, 0, 0.7, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(p[0], p[1], last ? 0.24 : 0.19, 0, 7); ctx.fillStyle = rgba(last ? C.c300 : C.n200, 0.8); ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], last ? 0.13 : 0.1, 0, 7); ctx.fillStyle = rgba(last ? C.c400 : C.e400); ctx.fill();
    });
    // start pin (teardrop)
    { const p = RT[0]; ctx.beginPath(); ctx.moveTo(p[0], p[1] + 0.02); ctx.lineTo(p[0] - 0.2, p[1] - 0.42); ctx.arc(p[0], p[1] - 0.55, 0.27, Math.PI * 0.82, Math.PI * 0.18); ctx.closePath(); ctx.fillStyle = rgba(C.e500); ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1] - 0.55, 0.1, 0, 7); ctx.fillStyle = rgba(C.n50); ctx.fill(); }
    // route-done card: check badge + one full progress bar (route complete), no text
    { const x0 = 1.7, y0 = 1.25, cw = 4.9, chh = 1.55; ctx.beginPath(); ctx.roundRect(x0, y0, cw, chh, 0.38); ctx.fillStyle = rgba(mix(C.n950, C.n900, 0.3), 0.94); ctx.fill(); ctx.strokeStyle = rgba(C.n700, 0.9); ctx.lineWidth = 0.05; ctx.stroke();
      const cx0 = x0 + 0.8, cy0 = y0 + chh / 2; ctx.beginPath(); ctx.arc(cx0, cy0, 0.42, 0, 7); ctx.fillStyle = rgba(C.c400, 0.82); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx0 - 0.2, cy0 + 0.01); ctx.lineTo(cx0 - 0.05, cy0 + 0.16); ctx.lineTo(cx0 + 0.22, cy0 - 0.14); ctx.strokeStyle = rgba(C.n950); ctx.lineWidth = 0.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      { const bx = x0 + 1.55, bw = cw - 2.0; ctx.beginPath(); ctx.roundRect(bx, cy0 - 0.11, bw, 0.22, 0.11); const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, rgba(C.e500, 0.85)); g.addColorStop(1, rgba(C.c400, 0.85)); ctx.fillStyle = g; ctx.fill(); } }
    // glass sheen
    { const g = ctx.createLinearGradient(-HX, -HY, HX * 0.2, HY); g.addColorStop(0, rgba(C.n300, 0.07)); g.addColorStop(0.5, rgba(C.n300, 0.015)); g.addColorStop(1, rgba(C.n300, 0)); ctx.fillStyle = g; ctx.fillRect(-HX, -HY, sh, sw); }
    ctx.restore();
  }

  // Replay box, modelled on the real render: dark rounded body, blue cap, four screws, light-grey hexagon, teal LED bar.
  function drawBox(ctx, cam) {
    const b = W0.box; if (!b) return null; const fr = frameOf(b), P = cam.P, hd = b.d / 2;
    const t = b.rot * Math.PI / 180, ua = [Math.cos(t), 0, Math.sin(t)], va = [-Math.sin(t), 0, Math.cos(t)];
    const outl = rrect(b.w, b.h, b.r, 8);
    const at = (u, hh, v) => fr(u, hh + b.h / 2, v);
    const front = outl.map(([u, hh]) => P(at(u, hh, -hd))), back = outl.map(([u, hh]) => P(at(u, hh, hd)));
    const bodyA = [33, 41, 54];
    const cSide = light(bodyA, at(b.w / 2, 0, 0), ua), cTop = light(bodyA, at(0, b.h / 2, 0), [0, 1, 0], { wk: 0.7 });
    path(ctx, hull(front.concat(back)));
    const pA = P(at(0, b.h / 2, hd)), pB = P(at(b.w / 2, -b.h / 2, hd));
    ctx.fillStyle = lin(ctx, pA, pB, [[0, rgba(mix(cTop, C.n500, 0.12))], [0.3, rgba(cSide)], [1, rgba(mix(cSide, C.black, 0.5))]]); ctx.fill();
    // top face (seen from above): cool sky light, slightly lighter toward the back
    { const tq = outl.filter(([u, hh]) => hh > b.h / 2 - b.r - 0.01).map(([u]) => u); const u0 = Math.min(...tq), u1 = Math.max(...tq);
      const topF = [at(u0, b.h / 2, -hd), at(u1, b.h / 2, -hd), at(u1, b.h / 2, hd), at(u0, b.h / 2, hd)].map(P);
      path(ctx, topF); ctx.fillStyle = lin(ctx, P(at(0, b.h / 2, -hd)), P(at(0, b.h / 2, hd)), [[0, rgba(mix(cTop, C.n500, 0.08))], [0.5, rgba(cTop)], [1, rgba(mix(cTop, C.n900, 0.35))]]); ctx.fill(); }
    // front face
    const fn = mul(va, -1);
    const fTL = light(bodyA, at(-b.w / 2, b.h / 2, -hd), fn), fBR = light(bodyA, at(b.w / 2, -b.h / 2, -hd), fn);
    path(ctx, front);
    ctx.fillStyle = lin(ctx, P(at(-b.w / 2, b.h / 2, -hd)), P(at(b.w / 2, -b.h / 2, -hd)), [[0, rgba(mix(fTL, C.n400, 0.04))], [1, rgba(mix(fBR, C.black, 0.22))]]); ctx.fill();
    // bounce light from the lamp pool onto the lower front face
    { ctx.save(); path(ctx, front); ctx.clip(); const g0 = P(at(0, -b.h / 2, -hd)), g1 = P(at(0, -b.h / 2 + 4.2, -hd));
      ctx.fillStyle = lin(ctx, g0, g1, [[0, rgba(mix(C.lampW, C.n300, 0.4), 0.11 * LK)], [1, rgba(C.lampW, 0)]]); ctx.globalCompositeOperation = 'screen'; ctx.fillRect(0, 0, cam.W, cam.H); ctx.restore(); }
    // soft bevel on the front outline
    ctx.save(); path(ctx, front); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, -hd)) * 0.2);
    ctx.strokeStyle = lin(ctx, P(at(-b.w / 2, b.h / 2, -hd)), P(at(b.w / 2, -b.h / 2, -hd)), [[0, rgba(mix(C.n300, C.n400, 0.5), 0.45)], [0.45, rgba(C.n500, 0.18)], [1, rgba(C.n500, 0.04)]]);
    ctx.stroke(); ctx.restore();
    // thin electric-400 rim light along the top edge (as in the product render)
    { const pts = []; for (let i = 0; i <= 24; i++) { const u = -b.w / 2 + b.r * 0.6 + (b.w - b.r * 1.2) * i / 24; pts.push(P(at(u, b.h / 2, -hd + 0.05))); }
      const a1 = pts[0], a2 = pts[pts.length - 1];
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.e400, 0.15)], [0.35, rgba(C.e400, 0.75)], [0.75, rgba(C.e400, 0.6)], [1, rgba(C.e400, 0.1)]]); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, 0)) * 0.13); ctx.lineCap = 'round'; ctx.stroke();
      const qb = []; for (let i = 0; i <= 12; i++) { const v = -hd + b.d * i / 12; qb.push(P(at(b.w / 2 - 0.15, b.h / 2 - 0.15, v))); }
      ctx.beginPath(); qb.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = rgba(C.e400, 0.35); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, 0)) * 0.1); ctx.stroke(); }
    const F = (s, h) => fr(s, h, -hd - 0.02);
    const disc = (s, h, r, fill) => { discT(ctx, cam, F(s, h), mul(ua, r), [0, r, 0]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = fill; ctx.fill(); ID(ctx); };
    for (const [s, h] of [[-b.w / 2 + 0.95, 0.95], [b.w / 2 - 0.95, 0.95], [-b.w / 2 + 0.95, b.h - 0.95], [b.w / 2 - 0.95, b.h - 0.95]]) { disc(s, h, 0.2, rgba([8, 12, 18], 0.92)); disc(s - 0.05, h + 0.05, 0.08, rgba(C.n400, 0.35)); }
    { discT(ctx, cam, F(0, 10.75), ua, [0, 1, 0]); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 90) * Math.PI / 180; const x = Math.cos(a) * 0.6, y = Math.sin(a) * 0.6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(light([196, 204, 214], F(0, 10.75), fn, { amb: 1.3 }), 0.7); ctx.fill(); ID(ctx); }
    // button: recessed dark bezel + cap in electric-700/800 at ~70%, one soft specular arc
    disc(0, 6.0, 3.45, rgba([7, 11, 17]));
    { discT(ctx, cam, F(0, 6.0), ua, [0, 1, 0]);
      const lift = 0.06 * LK;
      const g = ctx.createRadialGradient(-0.8, 0.9, 0.3, 0, 0, 3.0);
      g.addColorStop(0, rgba(mix(mul(mix(C.e700, C.n600, 0.12), 0.68), C.lampW, lift))); g.addColorStop(0.55, rgba(mul(mix(mix(C.e700, C.e800, 0.6), C.n700, 0.15), 0.6))); g.addColorStop(1, rgba(mul(mix(C.e800, C.n800, 0.3), 0.45)));
      ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, 7); ctx.fillStyle = g; ctx.fill();
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.55; ctx.strokeStyle = rgba(C.n100, 0.07); ctx.beginPath(); ctx.arc(0, 0, 2.2, Math.PI * 0.58, Math.PI * 0.95); ctx.stroke();
      ctx.lineWidth = 0.2; ctx.strokeStyle = rgba(C.n100, 0.18); ctx.beginPath(); ctx.arc(0, 0, 2.25, Math.PI * 0.62, Math.PI * 0.9); ctx.stroke();
      ctx.lineWidth = 0.12; ctx.strokeStyle = rgba(C.e400, 0.25); ctx.beginPath(); ctx.arc(0, 0, 2.85, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ID(ctx); }
    // LED bar, unlit body (the emission is a separate pass)
    const ledPts = rrect(2.8, 0.42, 0.21, 4).map(([s, h]) => P(F(s, 1.95 + h)));
    path(ctx, ledPts); ctx.fillStyle = rgba(mix(C.c600, C.n900, 0.78)); ctx.fill();
    return { led: F(0, 1.95), ledPts };
  }

  function drawMug(ctx, cam) {
    const m = W0.mug; if (!m) return null; const P = cam.P, N = 72;
    const ring = (h, r) => { const a = []; for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; a.push(P([m.x + r * Math.cos(t), h, m.z + r * Math.sin(t)])); } return a; };
    const alb = [34, 50, 72];                  // matte navy-700 ceramic: recedes
    const hAng = (m.alca != null ? m.alca : -40) * Math.PI / 180, hd = [Math.cos(hAng), 0, Math.sin(hAng)];
    const hc = [m.x + hd[0] * (m.r + 1.3), m.h * 0.56, m.z + hd[2] * (m.r + 1.3)];
    const handle = () => {
      const pts = []; for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + i / 24 * Math.PI; pts.push(P([hc[0] + hd[0] * Math.cos(a) * 1.9 - hd[0] * 0.6, hc[1] + Math.sin(a) * 2.8, hc[2] + hd[2] * Math.cos(a) * 1.9 - hd[2] * 0.6])); }
      ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = rgba(light(alb, hc, hd, { lk: 0.6 })); ctx.lineWidth = cam.S(hc) * 0.95; ctx.stroke();
      ctx.strokeStyle = rgba(C.n400, 0.16); ctx.lineWidth = cam.S(hc) * 0.22; ctx.stroke();
    };
    const handleFront = dot(hd, sub(cam.pos, [m.x, 0, m.z])) > 0;
    if (!handleFront) handle();
    const sil = hull(ring(0, m.r * 0.96).concat(ring(m.h, m.r)));
    const pl = P([m.x - m.r, m.h / 2, m.z]), pr = P([m.x + m.r, m.h / 2, m.z]);
    const sideCol = ang => { const n = [Math.cos(ang), 0, Math.sin(ang)]; return light(alb, [m.x + n[0] * m.r, m.h * 0.6, m.z + n[2] * m.r], n); };
    const stops = []; for (let i = 0; i <= 8; i++) { const k = i / 8; let c = sideCol(Math.PI + k * Math.PI); if (k < 0.08 || k > 0.92) c = mix(c, C.n800, 0.35); stops.push([k, rgba(c)]); }
    path(ctx, sil); ctx.fillStyle = lin(ctx, pl, pr, stops); ctx.fill();
    const pt = P([m.x, m.h, m.z - m.r]), pbm = P([m.x, 0, m.z - m.r]);
    path(ctx, sil); ctx.fillStyle = lin(ctx, pt, pbm, [[0, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(4,8,13,0.5)']]); ctx.fill();
    // matte: only a broad, very soft sheen
    const hl1 = P([m.x - m.r * 0.55, m.h * 0.85, m.z - m.r * 0.83]), hl2 = P([m.x - m.r * 0.55, m.h * 0.2, m.z - m.r * 0.83]);
    ctx.strokeStyle = lin(ctx, hl1, hl2, [[0, rgba(C.n300, 0.0)], [0.35, rgba(C.n300, 0.07)], [1, rgba(C.n300, 0.0)]]); ctx.lineWidth = cam.S([m.x, 0, m.z]) * 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hl1[0], hl1[1]); ctx.lineTo(hl2[0], hl2[1]); ctx.stroke();
    path(ctx, ring(m.h, m.r)); ctx.fillStyle = rgba(light(mix(alb, [120, 130, 142], 0.4), [m.x, m.h, m.z], [0, 1, 0], { amb: 1.1 })); ctx.fill();
    const inner = ring(m.h, m.r * 0.9); path(ctx, inner); ctx.fillStyle = rgba(light([70, 84, 100], [m.x, m.h, m.z + m.r], [0, 0, -1], { amb: 0.6 })); ctx.fill();
    ctx.save(); path(ctx, inner); ctx.clip();
    const cof = ring(m.h - 1.3, m.r * 0.9); path(ctx, cof); ctx.fillStyle = rgba([16, 14, 14]); ctx.fill();
    const cp = P([m.x - 1.2, m.h - 1.3, m.z + 0.6]); glow(ctx, cp, cam.S([m.x, m.h, m.z]) * 1.2, C.lampW, 0.08 * LK);
    ctx.restore();
    if (handleFront) handle();
    return { top: [m.x, m.h, m.z] };
  }

  function drawLamp(ctx, cam, o) {
    const L = W0.lamp, P = cam.P;
    const N = 48, br = 8.2, bh = 2.4; const ring = (h, r) => { const a = []; for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; a.push(P([L.base[0] + r * Math.cos(t), h, L.base[2] + r * Math.sin(t)])); } return a; };
    if (P(L.base)[2] <= 1) return;
    const metal = [40, 46, 56];
    path(ctx, hull(ring(0, br).concat(ring(bh, br * 0.92)))); ctx.fillStyle = rgba(light(metal, add(L.base, [0, 1, -br]), [0, 0, -1])); ctx.fill();
    path(ctx, ring(bh, br * 0.92)); ctx.fillStyle = rgba(light(metal, add(L.base, [0, bh, 0]), [0, 1, 0], { amb: 1.3 })); ctx.fill();
    const rod = (a, b, w, col) => { const p = P(a), q = P(b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); };
    const j0 = add(L.base, [0, bh, 0]), hb = L.back;
    // arms: a body around navy-700 and a 1 px navy-400 rim on the window side (toward the frame centre), joints that read
    const armC = rgba(mix(C.n800, C.n700, 0.62)), rimC = rgba(C.n400, 0.85), side = Math.sign(cam.W / 2 - P(L.elbow)[0]) || 1;
    const arm = (a, b, w) => { const p = P(a), q = P(b); let nx = -(q[1] - p[1]), ny = q[0] - p[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl; if (nx * side < 0) { nx = -nx; ny = -ny; }
      rod(a, b, w, armC); const off = Math.max(0, w / 2 - 0.6); ctx.beginPath(); ctx.moveTo(p[0] + nx * off, p[1] + ny * off); ctx.lineTo(q[0] + nx * off, q[1] + ny * off); ctx.strokeStyle = rimC; ctx.lineWidth = 1; ctx.lineCap = 'butt'; ctx.stroke(); };
    arm(j0, L.elbow, Math.max(2.5, cam.S(L.elbow) * 1.1)); arm(L.elbow, hb, Math.max(2.2, cam.S(L.head) * 0.95));
    for (const j of [j0, L.elbow, hb]) { const p = P(j), r = Math.max(2, cam.S(j) * 1.05); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fillStyle = rgba(mix(C.n900, C.n800, 0.6)); ctx.fill(); ctx.strokeStyle = rgba(C.n400, 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], r - 0.5, side > 0 ? -1.2 : 1.9, side > 0 ? 1.2 : 4.3); ctx.stroke(); }
    const ax = L.axis, t1 = norm(cross(ax, [0, 1, 0])), t2 = cross(t1, ax);
    const circ = (c, r) => { const a = []; for (let i = 0; i < 48; i++) { const t = i / 48 * Math.PI * 2; a.push(P(add(c, add(mul(t1, r * Math.cos(t)), mul(t2, r * Math.sin(t)))))); } return a; };
    const back = circ(L.back, 2.6), open = circ(L.open, 7.2);
    path(ctx, hull(back.concat(open)));
    ctx.fillStyle = lin(ctx, P(L.back), P(L.open), [[0, rgba(mix(C.n900, C.n800, 0.55))], [0.6, rgba(mix(C.n800, C.n700, 0.45))], [1, rgba(mix(C.n700, C.n600, 0.25))]]); ctx.fill();
    if (dot(ax, sub(cam.pos, L.open)) > 0) {
      path(ctx, open); const po2 = P(L.open), pb2 = P(add(L.open, mul(ax, -4)));
      const gi = ctx.createRadialGradient(pb2[0], pb2[1], 0, po2[0], po2[1], cam.S(L.open) * 7.5);
      const oa = (L.openK != null ? L.openK : 1) * LK;
      const dark = [24, 26, 30];
      gi.addColorStop(0, rgba(mix(dark, C.white, 0.95 * oa))); gi.addColorStop(0.25, rgba(mix(dark, C.lampW, 0.85 * oa))); gi.addColorStop(0.7, rgba(mix(dark, mix(C.lampW, [120, 112, 102], 0.55), oa))); gi.addColorStop(1, rgba(mix(dark, mix(C.lampW, [70, 66, 62], 0.7), oa)));
      ctx.fillStyle = gi; ctx.fill();
    }
    path(ctx, open); ctx.strokeStyle = rgba(mix(C.n400, C.lampW, 0.45), o.rimA != null ? o.rimA : 0.6); ctx.lineWidth = Math.max(1, cam.S(L.open) * 0.26); ctx.stroke();
  }

  function lightEffects(ctx, cam, info, o, ledK, pass) {
    const P = cam.P, L = W0.lamp;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const ax = L.axis, t1 = norm(cross(ax, [0, 1, 0])), t2 = cross(t1, ax);
    if (LK > 0) {
      const A = [], B = [];
      for (let i = 0; i < 36; i++) { const t = i / 36 * Math.PI * 2; A.push(P(add(L.open, add(mul(t1, 6.8 * Math.cos(t)), mul(t2, 6.8 * Math.sin(t)))))); B.push(P([L.target[0] + 24 * Math.cos(t), 0.2, L.target[2] + 18 * Math.sin(t)])); }
      if (o.cone !== false && A.concat(B).every(p => p[2] > 0)) {
        const cone = layer(cam.W, cam.H), cc = cone.getContext('2d');
        path(cc, hull(A.concat(B)));
        cc.fillStyle = lin(cc, P(L.open), P(L.target), [[0, rgba(C.lampW, 0.05)], [0.6, rgba(C.lampW, 0.018)], [1, rgba(C.lampW, 0.0)]]); cc.fill();
        ctx.filter = `blur(${Math.round(cam.S(L.target) * 2.2)}px)`; ctx.drawImage(cone, 0, 0); ctx.filter = 'none';
      }
      if (pass === 'full' && o.dust !== false) {
        const R = rng(55);
        for (let i = 0; i < 14; i++) {
          const k = 0.2 + R() * 0.7, p3 = add(mul(L.open, 1 - k), mul([L.target[0] + (R() - 0.5) * 26, 0, L.target[2] + (R() - 0.5) * 18], k));
          p3[1] += 2 + R() * 4; const p = P(p3); if (p[2] <= 0) continue; const r = Math.max(0.6, cam.S(p3) * (0.035 + R() * 0.04));
          ctx.fillStyle = rgba(C.lampW, 0.14 + R() * 0.22); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
        }
      }
    }
    if (W0.laptop) { screenGlow(ctx, cam); toqueFrio(ctx, cam); }
    if (W0.phone) { const ph = W0.phone; discT(ctx, cam, [ph.x, 0.05, ph.z], [15, 0, 0], [0, 0, 15]);
      ctx.fillStyle = radial(ctx, [[0, rgba(C.e400, 0.09)], [0.5, rgba(C.e500, 0.03)], [1, rgba(C.e500, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ID(ctx); }
    if (info && info.led && ledK > 0) {
      const b = W0.box, t = b.rot * Math.PI / 180, va = [-Math.sin(t), 0, Math.cos(t)];
      path(ctx, info.ledPts); ctx.fillStyle = rgba(C.c500, 0.86 * ledK); ctx.fill();
      const c = add([b.x, 0.05, b.z], mul(va, -b.d / 2 - 2.2));
      discT(ctx, cam, c, [5, 0, 0], [0, 0, 3.2]);
      ctx.fillStyle = radial(ctx, [[0, rgba(C.c500, 0.13 * ledK)], [0.5, rgba(C.c500, 0.05 * ledK)], [1, rgba(C.c500, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ID(ctx);
      glow(ctx, P(info.led), cam.S(info.led) * 2.2, C.c500, 0.22 * ledK);
    }
    if (o.lampGlow && P(L.open)[2] > 0) glow(ctx, P(L.open), cam.S(L.open) * 11, C.lampW, o.lampGlow * LK);
    ctx.restore();
  }

  // A luz da tela chega de leve nos vizinhos: a face da caixa e a da caneca voltadas para o notebook pegam um frio fraco.
  function toqueFrio(ctx, cam) {
    const P = cam.P, Lt = W0.laptop, alvo = [Lt.x, 0, Lt.z];
    const lado = (sil, c, r) => {   // sil: a silhueta em px; c: o centro (mundo); r: a distância (cm) do centro até a face
      const d = norm(sub([alvo[0], c[1], alvo[2]], c)), p0 = P(c), p1 = P(add(c, mul(d, r)));
      ctx.save(); path(ctx, sil); ctx.clip();
      ctx.fillStyle = lin(ctx, p0, p1, [[0, rgba(GLOW_C, 0)], [0.55, rgba(GLOW_C, 0.02)], [1, rgba(GLOW_C, 0.085)]]); ctx.fillRect(0, 0, cam.W, cam.H);
      ctx.restore();
    };
    const b = W0.box; if (b) lado(hull(boxPts().map(P)), [b.x, b.h / 2, b.z], b.w / 2);
    const m = W0.mug; if (m) lado(hull(mugPts().map(P)), [m.x, m.h * 0.55, m.z], m.r);
  }

  function steam(ctx, cam, top) {
    const st = layer(cam.W, cam.H), s = st.getContext('2d'); const P = cam.P; const R = rng(3);
    s.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      s.beginPath(); const ph = R() * 6, sx = (R() - 0.5) * 2.0;
      for (let i = 0; i <= 30; i++) { const t = i / 30; const p3 = [top[0] + sx + Math.sin(t * 5 + ph) * (0.4 + t * 2.0), top[1] + 0.3 + t * 15, top[2] + Math.cos(t * 3 + ph) * 1.0]; const p = P(p3); i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); }
      s.strokeStyle = rgba(C.n100, 0.16 - k * 0.04); s.lineWidth = cam.S(top) * (0.9 - k * 0.25); s.stroke();
    }
    const tp = P(top), tq = P(add(top, [0, 16, 0]));
    s.globalCompositeOperation = 'destination-in'; s.fillStyle = lin(s, tp, tq, [[0, 'rgba(0,0,0,0.2)'], [0.22, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); s.fillRect(0, 0, cam.W, cam.H);
    ctx.save(); ctx.filter = `blur(${Math.max(2, Math.round(cam.S(top) * 0.5))}px)`; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(st, 0, 0); ctx.restore();
  }

  function finish(ctx, cam, o, fl) {
    const { W, H } = cam;
    if (o.dof) {
      const fy = W0.phone ? cam.P([W0.phone.x, 0, W0.phone.z])[1] : H * 0.8;
      const b = layer(W, H), bc = b.getContext('2d'); bc.filter = `blur(${o.dof}px)`; bc.drawImage(ctx.canvas, 0, 0); bc.filter = 'none';
      bc.globalCompositeOperation = 'destination-in';
      bc.fillStyle = lin(bc, [0, 0], [0, H], [[0, 'rgba(0,0,0,1)'], [(fy - 260) / H, 'rgba(0,0,0,0.55)'], [(fy - 150) / H, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]);
      bc.fillRect(0, 0, W, H); ctx.drawImage(b, 0, 0);
    }
    if (o.exposure && o.exposure !== 1) { const e = layer(W, H), ec = e.getContext('2d'); ec.filter = `brightness(${o.exposure})`; ec.drawImage(ctx.canvas, 0, 0); ctx.clearRect(0, 0, W, H); ctx.drawImage(e, 0, 0); }
    if (o.bloom && !fl.noBloom) {
      const sm = layer(W >> 2, H >> 2), sc = sm.getContext('2d');
      sc.filter = 'brightness(0.55) contrast(2.6) blur(5px)'; sc.drawImage(ctx.canvas, 0, 0, W >> 2, H >> 2);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.bloom; ctx.drawImage(sm, 0, 0, W, H); ctx.restore();
    }
    const v = ctx.createRadialGradient(W * 0.5, H * 0.55, Math.min(W, H) * 0.32, W * 0.5, H * 0.55, Math.hypot(W, H) * 0.62);
    v.addColorStop(0, rgba(C.edge, 0)); v.addColorStop(0.55, rgba(C.edge, (o.vig || 0.7) * 0.35)); v.addColorStop(1, rgba(C.edge, o.vig || 0.7));
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    if (o.bottomFade) { const [y0, y1, y2, a1, a2] = o.bottomFade; ctx.fillStyle = lin(ctx, [0, y0 * H], [0, y2 * H], [[0, rgba(C.edge, 0)], [(y1 - y0) / (y2 - y0), rgba(C.edge, a1)], [1, rgba(C.edge, a2)]]); ctx.fillRect(0, y0 * H, W, H - y0 * H); }
    if (!fl.noGrain) addGrain(ctx, W, H, o.grain || 5, 42);
  }
  function addGrain(ctx, W, H, amt, seed) {
    const img = ctx.getImageData(0, 0, W, H), d = img.data; const R = rng(seed);
    for (let i = 0; i < d.length; i += 4) { const n = (R() + R() - 1) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.1; }
    ctx.putImageData(img, 0, 0);
  }

  function render(canvas, which, extra) {
    const o = Object.assign({}, CAMS[which], extra || {});
    const pass = o.pass || 'full';
    prepWorld(o); const cam = makeCam(o);
    const ctx = canvas.getContext('2d');
    if (pass === 'city') { const city = cityLayer(cam, o); ctx.drawImage(city, 0, 0); if (o.dither) addGrain(ctx, cam.W, cam.H, o.dither, 77); return { cam }; }
    LK = pass === 'D' ? 0 : 1;
    const ledK = pass === 'C' ? 1 : pass === 'full' ? (o.ledK != null ? o.ledK : 0.82) : 0;
    basePass(ctx, cam, o);
    const city = cityLayer(cam, o);
    const fill = pass === 'full' ? city : solid(cam.W, cam.H, pass === 'B' ? 128 : 0);
    drawWindow(ctx, cam, fill, o);
    deskReflection(ctx, cam, city, o);
    calmaPeitoril(ctx, cam, o);
    drawShadows(ctx, cam, o);
    if (o.lampBody !== false) drawLamp(ctx, cam, o);
    const info = drawBox(ctx, cam);
    drawLaptop(ctx, cam, o);
    const mug = drawMug(ctx, cam);
    drawPhone(ctx, cam);
    lightEffects(ctx, cam, info, o, ledK, pass);
    if (pass === 'full' && mug && o.steam !== false) steam(ctx, cam, mug.top);
    finish(ctx, cam, o, { noGrain: !!o.noGrain, noBloom: false });   // plates share the same static grain, so it cancels in B-A, C-A, A-D
    LK = 1;
    return { cam };
  }
  G.FDE = { render, makeCam, prepWorld, CAMS, BASE, rng, frameOf, laptopGeo, telaDoNotebook, brilhoDaTela, shadowPt };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.FDE;
