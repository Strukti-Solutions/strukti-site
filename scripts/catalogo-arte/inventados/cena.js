/* Cena-modelo dos 7 itens inventados do catálogo (spec 2026-10-16 §6.2, plano da arte, Task A4).
   Uma cena só, parametrizada por slug: o mesmo ambiente do "Fim de expediente" e das cenas dos reais (a mesa de
   laminado do hero sob a janela com montantes, a cidade de hora azul desfocada lá fora, o abajur fora do quadro, a
   luz do kit) e, em cada slug, a silhueta do objeto do item:
     placar-conectado   placar suspenso diante da janela, com as luzes de ponto (pips) em ciano
     totem-check-in     totem de balcão com a tela de check-in e o leitor com o anel ciano
     contador-de-fluxo  o sensor sobre a porta de vidro, com o leque de detecção em ciano
     agenda-de-quadras  celular no suporte de mesa com a grade de horários (elétrico)
     estoque-oficinas   celular encostado numa caixa de peças, com a lista de estoque (elétrico)
     site-clinicas      notebook com o navegador do site de clínica (violeta suave só no detalhe)
     vitrine-lojas      tablet no suporte com o navegador da vitrine e uma sacola (violeta suave só no detalhe)
   Acento do tipo (plano, Task A4): hardware ciano, aplicativo elétrico, site o violeta suave #8b7ff0 só no detalhe
   (nunca degradê roxo -> azul de fundo). Nada de texto: as telas são blocos, barras e ícones.
   Unidades: cm. x à direita, y para cima, z para longe (para a janela). O plano y = 0 é o tampo da mesa (ou o piso,
   na cena da porta); a parede fica em z = 64 e o vidro em z = 71, como no hero e no Fleet.
   Copiado e adaptado do Fleet (scripts/catalogo-arte/fleet-analytics-bi/cena.js): a cidade (buildCity/cityLayer do
   hero), o passe da mesa e da parede, o reflexo da cidade, o mapeamento da tela em faixas e a caneca.
   No navegador: window.CENA (cartao.html?slug=...). No Node (sondas): SLUG=<slug> escolhe o item. */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && typeof require !== 'undefined') ? require('../kit/cena.js') : G.KIT;
  const { C, hx, rgba, mix, clamp, sstep, sub, add, mul, dot, norm, len, rng, LUZ, luz, pontoI, LMP, makeCam, rrect, path, hull, discT, ID, radial, lin, layer, glow, SKY, skyCol } = K;
  const VIO = hx('#8b7ff0');            // o violeta suave dos sites (só no detalhe)
  const PZ = 64, VZ = 71, RAD = Math.PI / 180;

  // ---------------- referencial com giro (rot, em torno de y) e inclinação para trás (tilt, em torno de u) ----------------
  function Fr(o) {
    const t = (o.rot || 0) * RAD, c = Math.cos(t), s = Math.sin(t), a = (o.tilt || 0) * RAD, ca = Math.cos(a), sa = Math.sin(a);
    const R = ([u, h, v]) => { const h2 = h * ca - v * sa, v2 = h * sa + v * ca; return [u * c - v2 * s, h2, u * s + v2 * c]; };
    const O = [o.x || 0, o.y || 0, o.z || 0];
    return { P: (u, h, v) => add(O, R([u, h, v])), R, O };
  }
  const sobre = (F, u, h, v, o) => Object.assign({ x: F.P(u, h, v)[0], y: F.P(u, h, v)[1], z: F.P(u, h, v)[2] }, o);

  // ---------------- os itens ----------------
  // amb: o ambiente (sup = a superfície y = 0; aberturas = os vãos da parede, transparentes; barras = montantes e travessas)
  const MESA = { sup: { alb: [54, 52, 49], veio: true, z0: -140, x0: -220, x1: 220 }, peitoril: true,
    aberturas: [[-170, 170, 0.4, 230]], barras: [[-45, -42, 1.7, 300], [42, 45, 1.7, 300]], travessas: [], trilho: 1.3 };
  const TORRES = [[-34, -10, 30, 1], [-10, -5.5, 6.5, 0], [6, 10.5, 8, 0], [10.5, 34, 13, 1]], CENTRO = [-5.5, 6, -2.5];
  const BASE = { W: 800, H: 1200, cityBlur: 7, bokeh: 16, bokehP: 0.035, discA: 0.12, cityGain: 1, refl: 0.12,
    towers: TORRES, centre: CENTRO, telaLuz: 1.6, telaBrilho: 1, abajurK: 1, caneca: 0, ledK: 1,
    vig: 0.85, vigR: [0.2, 0.7], vigC: [0.5, 0.36], bottomFade: [0.5, 0.74, 1.0, 0.36, 0.62], bloom: 0.2, grain: 5, grainBaixo: [0.6, 6.5] };

  const ITENS = {
    'placar-conectado': { tipo: 'hardware',
      amb: Object.assign({}, MESA, { barras: [[-78, -75, 1.7, 300], [75, 78, 1.7, 300]] }),
      cam: { pos: [-30, 104, -135], target: [0, 114, 40], F: 960, shiftY: -150, towers: [[-40, -14, 32, 1], [-14, -8, 9, 0], [9, 14, 10, 0], [14, 40, 30, 1]], centre: [-8, 9, -2] },
      abajur: { pos: [-90, 110, 0], alvo: [-5, 0, 34], k: 0.8 },
      placar: { x: 0, y: 100, z: 32, w: 100, h: 46, d: 11, rot: 10 } },
    'totem-check-in': { tipo: 'hardware',
      cam: { pos: [-6, 50, -118], target: [0, 36, 28], F: 1000, shiftY: -150 },
      abajur: { pos: [-95, 105, 4], alvo: [-6, 0, 30], k: 1 },
      totem: { x: 2, z: 30, rot: -10 } },
    'contador-de-fluxo': { tipo: 'hardware',
      amb: { sup: { alb: [40, 42, 47], veio: false, piso: true, z0: -400, x0: -400, x1: 400 }, peitoril: false,
        aberturas: [[-58, 58, 0, 218]], barras: [[-58, -52, 0, 218], [52, 58, 0, 218], [-4.6, -0.5, 0, 210], [0.5, 4.6, 0, 210]], travessas: [[-58, 58, 210, 218], [-52, 52, 0, 16]], trilho: 0, porta: true, paredeAmb: 1.0 },
      cam: { pos: [0, 165, -250], target: [0, 176, 64], F: 1250, shiftY: -150, towers: [[-40, -3, 30, 1], [-3, 2, 7, 0], [9, 14, 9, 0], [14, 40, 26, 1]], centre: [2, 9, -1], refl: 0.06, vigR: [0.24, 0.78] },
      teto: { pos: [0, 300, 30], alvo: [0, 200, 64], k: 0.7, cone: [0.75, 0.96] },
      sensor: { x: 0, y: 223, z: 58.5, w: 34, h: 8, d: 10 } },
    'agenda-de-quadras': { tipo: 'aplicativo',
      amb: Object.assign({}, MESA, { barras: [[-38, -35, 1.7, 300], [27, 30, 1.7, 300]] }),
      cam: { pos: [-3, 15, -30], target: [0, 9.5, 20], F: 1150, shiftY: -150 },
      abajur: { pos: [-60, 70, 0], alvo: [-2, 0, 22], k: 0.75 },
      celular: { x: 0.5, z: 19, rot: -9, tilt: 14, ui: 'agenda' } },
    'estoque-oficinas': { tipo: 'aplicativo',
      amb: Object.assign({}, MESA, { barras: [[-36, -33, 1.7, 300], [30, 33, 1.7, 300]] }),
      cam: { pos: [-6, 17, -30], target: [1, 9, 22], F: 1100, shiftY: -150 },
      abajur: { pos: [-62, 72, 2], alvo: [-2, 0, 22], k: 1 },
      celular: { x: -3, z: 12.4, rot: -7, tilt: 19, ui: 'estoque' },
      caixa: { x: 3.5, z: 25, rot: 10, w: 22, h: 14.5, d: 17 } },
    'site-clinicas': { tipo: 'site',
      cam: { pos: [-8, 36, -52], target: [0, 15, 30], F: 1100, shiftY: -150 },
      abajur: { pos: [-80, 92, 2], alvo: [-8, 0, 28], k: 1 },
      notebook: { x: 2, z: 28, rot: -14, abre: 20 }, caneca: { x: 26, z: 46, r: 4.1, h: 9.2, alca: 20 } },
    'vitrine-lojas': { tipo: 'site',
      cam: { pos: [-4, 30, -44], target: [2, 12, 28], F: 1100, shiftY: -150 },
      abajur: { pos: [-80, 90, 2], alvo: [-6, 0, 26], k: 1 },
      tablet: { x: -2, z: 26, rot: 12, tilt: 17 }, sacola: { x: 21, z: 40, rot: -16 } }
  };
  const SLUGS = Object.keys(ITENS);

  // ---------------- luzes ----------------
  let TELA = null, ABAJUR = null;
  function prepLuz(it, o, g) {
    LUZ.ceuDir = norm([0, 0.35, 1]);   // a luz da janela, como no hero
    const pontos = []; ABAJUR = null; TELA = null;
    if (it.abajur) {
      const A = it.abajur;
      ABAJUR = { pos: A.pos, cor: LMP, k: A.k * o.abajurK, alcance: 95, eixo: norm(sub(A.alvo, A.pos)), cone: [0.86, 0.975], mascara: p => p[1] > 0.5 ? 1 : sstep(4, 22, p[2]) };
      pontos.push(ABAJUR);
    }
    if (it.teto) { const T = it.teto; ABAJUR = { pos: T.pos, cor: LMP, k: T.k * o.abajurK, alcance: 160, eixo: norm(sub(T.alvo, T.pos)), cone: T.cone || [0.8, 0.97] }; pontos.push(ABAJUR); }
    if (g.tela) { const t = g.tela; TELA = { pos: add(t.c, mul(t.n, 3)), cor: t.cor || [0.32, 0.6, 1.0], k: o.telaLuz * (t.k || 1), alcance: t.alcance || 18, eixo: t.n, cone: [-0.25, 0.55] }; pontos.push(TELA); }
    for (const L of g.leds || []) pontos.push(Object.assign({ cor: [0.3, 0.85, 0.9], cone: [-0.2, 0.5] }, L, { k: L.k * o.ledK }));
    LUZ.pontos = pontos; LUZ.LK = 1;
  }

  // ---------------- a cidade (do hero: buildCity + cityLayer, em direções; igual à do Fleet) ----------------
  const CITYC = {};
  function buildCity(towers, CENTRE) {
    const key = JSON.stringify([towers, CENTRE]); if (CITYC[key]) return CITYC[key];
    const R = rng(1234), sil = [], lights = [];
    const hid = (a, e) => towers.some(([a1, a2, top]) => a >= a1 && a <= a2 && e <= top) || (a >= CENTRE[0] && a <= CENTRE[1] && e <= CENTRE[2]);
    const pick = () => { const t = R(); return t < 0.6 ? C.n300 : t < 0.94 ? C.e300 : C.n100; };
    const lv = () => { const t = R(); return t < 0.5 ? 0.55 : t < 0.85 ? 0.8 : 1.0; };
    for (let a = -75; a < 75;) {
      const w = 0.8 + R() * 2.6, top = 0.3 + Math.pow(R(), 2.2) * 4.0;
      sil.push([a, a + w, -0.4, top, mix(C.n700, C.n800, 0.55 + R() * 0.35)]);
      for (let e = 0; e < top - 0.15; e += 0.42) for (let b = a + 0.12; b < a + w - 0.1; b += 0.32) if (R() < 0.18) { const L = [b + (R() - 0.5) * 0.08, e + 0.1, 0.14, 0.17, pick(), (0.22 + R() * 0.2) * lv(), 0]; if (!hid(L[0], L[1])) lights.push(L); }
      a += w + R() * 0.4;
    }
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
    return (CITYC[key] = { sil, lights });
  }
  function cidade(cam, o) {
    const { W, H } = cam; const cv = layer(W, H), c = cv.getContext('2d'), S = SKY();
    const { sil, lights } = buildCity(o.towers, o.centre);
    const skyRows = c2 => { for (let sy = 0; sy < H; sy += 2) { const r = cam.ray(W / 2, sy + 1), el = Math.asin(r[1] / len(r)) * 180 / Math.PI; c2.fillStyle = rgba(skyCol(el, S)); c2.fillRect(0, sy, W, 2); } };
    const quad = (a1, a2, e1, e2) => {
      const n = Math.max(1, Math.ceil((a2 - a1) / 3)), pts = [];
      for (let i = 0; i <= n; i++) pts.push(cam.D(a1 + (a2 - a1) * i / n, e1));
      for (let i = n; i >= 0; i--) pts.push(cam.D(a1 + (a2 - a1) * i / n, e2));
      return pts.some(p => p[2] < 0.05) ? null : pts;
    };
    const sc = layer(W, H), sx = sc.getContext('2d'); skyRows(sx);
    for (const [a1, a2, e1, e2, col] of sil) { const q = quad(a1, a2, e1, e2); if (!q) continue; sx.fillStyle = rgba(col); path(sx, q); sx.fill(); }
    skyRows(c); c.filter = `blur(${Math.round(o.cityBlur * 0.8)}px)`; c.drawImage(sc, 0, 0); c.filter = 'none';
    const lc = layer(W, H), lx = lc.getContext('2d');
    for (const [a, e, w, h, col, al] of lights) { const q = [cam.D(a, e), cam.D(a + w, e), cam.D(a + w, e + h), cam.D(a, e + h)]; if (q.some(p => p[2] < 0.05)) continue; if (q.every(p => p[0] < -40 || p[0] > W + 40 || p[1] < -40 || p[1] > H + 40)) continue; lx.fillStyle = rgba(col, Math.min(1, al * (o.cityGain || 1))); path(lx, q); lx.fill(); }
    const dc = layer(W, H), dx = dc.getContext('2d'); const R2 = rng(99);
    for (const [a, e, w, h, col] of lights) {
      if (R2() > o.bokehP) continue;
      const p = cam.D(a + w / 2, e + h / 2); if (p[2] <= 0.05 || p[0] < -80 || p[0] > W + 80 || p[1] < -80 || p[1] > H + 80) continue;
      K.disco(dx, p, o.bokeh * (0.8 + R2() * 0.6), col, o.discA + R2() * 0.15);
    }
    c.save(); c.globalCompositeOperation = 'screen'; c.filter = `blur(${Math.round(o.cityBlur)}px)`; c.drawImage(lc, 0, 0);
    c.filter = `blur(${Math.round(o.cityBlur * 0.35)}px)`; c.drawImage(dc, 0, 0); c.restore();
    c.fillStyle = rgba(C.n300, 0.03); c.fillRect(0, 0, W, H);   // 3% de névoa no plano do vidro (hero)
    return cv;
  }

  // ---------------- superfície e parede (por pixel; os vãos ficam transparentes) ----------------
  function basePass(cam, o, amb) {
    const { W, H } = cam, cv = layer(W, H), ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), D = img.data;
    const pos = cam.pos, sp = amb.sup, R = rng(7), wallA = [44, 50, 62];
    const vao = (x, y) => amb.aberturas.some(([x0, x1, y0, y1]) => x > x0 && x < x1 && y > y0 && y < y1);
    for (let sy = 0; sy < H; sy++) {
      for (let sx = 0; sx < W; sx++) {
        const d = cam.ray(sx + 0.5, sy + 0.5); let col, a = 255;
        const tw = d[2] > 0 ? (PZ - pos[2]) / d[2] : 1e9; const wy = pos[1] + d[1] * tw, wx = pos[0] + d[0] * tw;
        if (wy >= 0 && tw < 1e8) {
          if (vao(wx, wy)) { a = 0; col = [0, 0, 0]; }
          else col = luz(wallA, [wx, wy, PZ], [0, 0, -1], { amb: amb.paredeAmb || 0.6, wk: 0 });
        } else if (d[1] < 0) {
          const t = -pos[1] / d[1]; const x = pos[0] + d[0] * t, z = pos[2] + d[2] * t;
          if (z >= sp.z0 && z <= PZ - 1 && x > sp.x0 && x < sp.x1) {
            const p = [x, 0, z], back = sstep(20, 63, z);
            col = luz(sp.alb, p, [0, 1, 0], { wk: 0.22 + back * 0.75 });
            if (ABAJUR) {   // reflexo acetinado da luz neutro-quente no laminado (hero)
              const v = norm(sub(pos, p)), l = norm(sub(ABAJUR.pos, p)), h = norm(add(v, l));
              const spec = Math.pow(Math.max(0, h[1]), 60) * pontoI(ABAJUR, p, null) * (sp.piso ? 18 : 40);
              col = add(col, [spec * LMP[0], spec * LMP[1], spec * LMP[2]]);
            }
            const lum = (col[0] + col[1] + col[2]) / 3;
            let fig = 0;
            if (sp.veio) fig = Math.sin(z * 2.1 + Math.sin(x * 0.037 + z * 0.21) * 2.6) * 0.55 + Math.sin(z * 6.7 + Math.sin(x * 0.09) * 1.3) * 0.3 + Math.sin(z * 17.3 + x * 0.013) * 0.15;
            if (sp.piso) { const gx = Math.abs(((x + 30) % 60 + 60) % 60 - 30), gz = Math.abs(((z - 4) % 60 + 60) % 60 - 30); fig = (Math.max(sstep(29.2, 29.8, gx), sstep(29.2, 29.8, gz)) * -1.4); }
            const g = (R() - 0.5) * 2.0 + fig * lum * 0.045; col = add(col, [g, g * 0.98, g * 0.93]);
          } else col = [5, 10, 17];
        } else col = [5, 10, 17];
        const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  // ---------------- os vãos: peitoril, trilho, montantes e travessas (do hero/Fleet, por vão) ----------------
  function vaos(ctx, cam, amb) {
    const P = cam.P, fA = [40, 46, 58];
    const face = (pts, col) => { const q = pts.map(P); if (q.some(p => p[2] <= 0)) return; path(ctx, q); ctx.fillStyle = rgba(col); ctx.fill(); ctx.strokeStyle = rgba(col); ctx.lineWidth = 0.8; ctx.stroke(); };
    for (const [x0, x1, y0, y1] of amb.aberturas) {
      // os lados do vão (a espessura da parede, de PZ a VZ)
      if (cam.pos[0] > x0) face([[x0, y0, PZ], [x0, y0, VZ], [x0, y1, VZ], [x0, y1, PZ]], luz(fA, [x0, 60, 67], [1, 0, 0], { amb: 0.7, wk: 0 }));
      if (cam.pos[0] < x1) face([[x1, y0, PZ], [x1, y0, VZ], [x1, y1, VZ], [x1, y1, PZ]], luz(fA, [x1, 60, 67], [-1, 0, 0], { amb: 0.7, wk: 0 }));
      if (cam.pos[1] < y1) face([[x0, y1, PZ], [x1, y1, PZ], [x1, y1, VZ], [x0, y1, VZ]], luz(fA, [0, y1, 67], [0, -1, 0], { amb: 0.55, wk: 0 }));
      if (amb.peitoril) {
        const sA = P([0, y0, PZ]), sB = P([0, y0, VZ]);
        path(ctx, [[x0, y0, PZ], [x1, y0, PZ], [x1, y0, VZ], [x0, y0, VZ]].map(P));
        ctx.fillStyle = lin(ctx, sA, sB, [[0, rgba(luz(fA, [0, y0, 66], [0, 1, 0], { wk: 0.9 }))], [1, rgba(mix(C.n700, C.n600, 0.4))]]); ctx.fill();
        face([[x0, y0 - 1.0, PZ - 0.3], [x1, y0 - 1.0, PZ - 0.3], [x1, y0, PZ - 0.3], [x0, y0, PZ - 0.3]], luz(fA, [0, y0, PZ], [0, 0, -1], { amb: 0.75, wk: 0 }));
        { const a1 = P([x0, y0, PZ - 0.3]), a2 = P([x1, y0, PZ - 0.3]); ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.n400, 0.1)], [0.5, rgba(mix(C.n300, C.lampW, 0.2), 0.36)], [1, rgba(C.n400, 0.1)]]); ctx.lineWidth = Math.max(1, cam.S([0, 0, PZ]) * 0.14); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
      }
      if (amb.trilho) {
        const rl = amb.trilho, fz = VZ - 0.01;
        face([[x0, y0, fz], [x1, y0, fz], [x1, y0 + rl, fz], [x0, y0 + rl, fz]], mix(C.n800, C.n700, 0.45));
        const a1 = P([x0, y0 + rl, fz]), a2 = P([x1, y0 + rl, fz]); ctx.strokeStyle = rgba(C.n400, 0.5); ctx.lineWidth = Math.max(1, cam.S([0, 0, fz]) * 0.16); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
      }
    }
    const frameC = mix(C.n900, C.n800, 0.3), zf = VZ - 4.5;
    // travessas (horizontais): frente e a face de baixo ou de cima que a câmera vê
    for (const [a, b, h0, h1] of amb.travessas) {
      const ny = cam.pos[1] < h0 ? h0 : h1, sn = cam.pos[1] < h0 ? -1 : 1;
      face([[a, ny, zf], [b, ny, zf], [b, ny, VZ], [a, ny, VZ]], luz(fA, [0, ny, 69], [0, sn, 0], { wk: sn > 0 ? 0.6 : 0, amb: 0.8 }));
      face([[a, h0, zf], [b, h0, zf], [b, h1, zf], [a, h1, zf]], frameC);
      const e1 = P([a, h1, zf]), e2 = P([b, h1, zf]); ctx.strokeStyle = rgba(mix(C.n600, C.n300, 0.25), 0.35); ctx.lineWidth = Math.max(1, cam.S([0, h1, zf]) * 0.25); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke();
    }
    // montantes (verticais): o lado que a câmera vê, a frente e um fio claro na aresta
    for (const [a, b, h0, h1] of amb.barras) {
      const side = cam.pos[0] < a ? a : b, sn = cam.pos[0] < a ? -1 : 1;
      if (!(cam.pos[0] > a && cam.pos[0] < b)) face([[side, h0, zf], [side, h0, VZ], [side, h1, VZ], [side, h1, zf]], luz(fA, [side, 40, 69], [sn, 0, 0], { wk: 0 }));
      face([[a, h0, zf], [b, h0, zf], [b, h1, zf], [a, h1, zf]], frameC);
      const ex = cam.pos[0] < a ? a : b, e1 = P([ex, h0, zf]), e2 = P([ex, Math.min(h1, 400), zf]);
      if (e1[2] > 0 && e2[2] > 0) { ctx.strokeStyle = rgba(mix(C.n600, C.n300, 0.25), 0.4); ctx.lineWidth = Math.max(1, cam.S([a, 40, zf]) * 0.25); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); }
    }
  }
  // o vidro da porta: um reflexo diagonal fraco da sala (faixas largas), por cima da cidade
  function vidro(ctx, cam, amb) {
    for (const [x0, x1, y0, y1] of amb.aberturas) {
      const q = [[x0, y0, VZ], [x1, y0, VZ], [x1, y1, VZ], [x0, y1, VZ]].map(cam.P);
      ctx.save(); path(ctx, q); ctx.clip();
      const a = cam.P([x0, y1, VZ]), b = cam.P([x1, y0, VZ]);
      ctx.fillStyle = lin(ctx, a, b, [[0, rgba(C.n300, 0)], [0.18, rgba(C.n300, 0.05)], [0.26, rgba(C.n300, 0.012)], [0.34, rgba(C.n300, 0.04)], [0.42, rgba(C.n300, 0)], [1, rgba(C.n300, 0)]]);
      ctx.fillRect(0, 0, cam.W, cam.H);
      ctx.fillStyle = rgba(C.n800, 0.12); ctx.fillRect(0, 0, cam.W, cam.H);   // o vidro escurece um pouco a rua
      ctx.restore();
    }
  }
  function poligonoSup(cam, amb) { const sp = amb.sup; return [[sp.x0, 0, Math.max(sp.z0, cam.pos[2] + 5)], [sp.x1, 0, Math.max(sp.z0, cam.pos[2] + 5)], [sp.x1, 0, PZ - 1], [sp.x0, 0, PZ - 1]].map(cam.P); }
  // reflexo da cidade no laminado (ou no piso), junto do vidro (hero)
  function reflexoCidade(ctx, cam, city, o, amb) {
    const P = cam.P, y0 = Math.min(...amb.aberturas.map(a => a[2])), yS = P([0, y0, VZ])[1];
    ctx.save(); path(ctx, poligonoSup(cam, amb)); ctx.clip();
    const tmp = layer(cam.W, cam.H), t = tmp.getContext('2d');
    t.filter = `blur(${Math.round(o.cityBlur * 1.8)}px)`; t.translate(0, yS * 2 + 4); t.scale(1, -1); t.drawImage(city, 0, 0); t.setTransform(1, 0, 0, 1, 0, 0); t.filter = 'none';
    t.globalCompositeOperation = 'destination-in';
    const yN = P([0, 0, 30])[1];
    t.fillStyle = lin(t, [0, yS], [0, Math.max(yN, yS + 1)], [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); t.fillRect(0, 0, cam.W, cam.H);
    ctx.globalAlpha = o.refl; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }

  // ---------------- peças genéricas ----------------
  // caixa: as faces que a câmera vê, cada uma com a luz do kit no meio da aresta de cima e no da de baixo
  function caixa3d(ctx, cam, F, b) {
    const [u0, u1] = b.u, [h0, h1] = b.h, [v0, v1] = b.v, k = b.k || {}, esc = b.esc != null ? b.esc : 0.82;
    const faces = [
      ['frente', [0, 0, -1], [[u0, h1, v0], [u1, h1, v0], [u1, h0, v0], [u0, h0, v0]]],
      ['tras', [0, 0, 1], [[u1, h1, v1], [u0, h1, v1], [u0, h0, v1], [u1, h0, v1]]],
      ['esq', [-1, 0, 0], [[u0, h1, v1], [u0, h1, v0], [u0, h0, v0], [u0, h0, v1]]],
      ['dir', [1, 0, 0], [[u1, h1, v0], [u1, h1, v1], [u1, h0, v1], [u1, h0, v0]]],
      ['topo', [0, 1, 0], [[u0, h1, v1], [u1, h1, v1], [u1, h1, v0], [u0, h1, v0]]],
      ['base', [0, -1, 0], [[u0, h0, v0], [u1, h0, v0], [u1, h0, v1], [u0, h0, v1]]]];
    const out = {};
    for (const [nome, nl, q] of faces) {
      const Wp = q.map(p => F.P(...p)), n = F.R(nl), c = mul(Wp.reduce((a, p) => add(a, p), [0, 0, 0]), 0.25);
      if (dot(n, sub(cam.pos, c)) <= 0) continue;
      const S = Wp.map(cam.P); if (S.some(p => p[2] <= 0)) continue;
      const a = mul(add(Wp[0], Wp[1]), 0.5), z = mul(add(Wp[2], Wp[3]), 0.5);
      const alb = (b.albF && b.albF[nome]) || b.alb;
      const ca = luz(alb, a, n, k), cz = luz(alb, z, n, k);
      path(ctx, S); const g = lin(ctx, cam.P(a), cam.P(z), [[0, rgba(ca)], [1, rgba(mul(cz, esc))]]); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = g; ctx.lineWidth = 0.7; ctx.stroke();
      out[nome] = { W: Wp, S, n };
    }
    if (b.aresta && out.frente) { const S = out.frente.S; ctx.beginPath(); ctx.moveTo(S[0][0], S[0][1]); ctx.lineTo(S[1][0], S[1][1]); ctx.strokeStyle = rgba(C.n300, b.aresta); ctx.lineWidth = Math.max(1, cam.S(F.P(0, h1, v0)) * 0.12); ctx.lineCap = 'round'; ctx.stroke(); }
    return out;
  }
  // chapa de cantos redondos (celular, tablet, tampa do notebook, cabeça do totem): corpo, frente escura e aro
  function laje(ctx, cam, F, s) {
    const outl = rrect(s.w, s.h, s.r, 7), hc = s.h / 2, hd = s.d / 2, h0 = s.h0 || 0;
    const at = (u, hh, v) => F.P(u, h0 + hc + hh, v);
    const front = outl.map(([u, hh]) => cam.P(at(u, hh, -hd))), back = outl.map(([u, hh]) => cam.P(at(u, hh, hd)));
    const k = s.k || {}, alb = s.alb || [58, 64, 76];
    const cTop = luz(alb, at(0, hc, 0), F.R([0, 1, 0]), Object.assign({ wk: 1 }, k)), cBot = luz(alb, at(0, -hc, 0), F.R([0, -0.3, -1]), Object.assign({ wk: 0.2 }, k));
    path(ctx, hull(front.concat(back))); ctx.fillStyle = lin(ctx, cam.P(at(0, hc, 0)), cam.P(at(0, -hc, 0)), [[0, rgba(cTop)], [0.5, rgba(mix(cTop, cBot, 0.6))], [1, rgba(mul(cBot, 0.8))]]); ctx.fill();
    path(ctx, front); ctx.fillStyle = rgba(s.frente || [6, 9, 13]); ctx.fill();
    path(ctx, front); ctx.strokeStyle = rgba(mix(C.n400, C.lampW, 0.3), s.aro != null ? s.aro : 0.4); ctx.lineWidth = Math.max(0.8, cam.S(at(0, 0, 0)) * (s.aroW || 0.05)); ctx.stroke();
    // a aresta de cima pega o céu: um fio claro
    { const tp = outl.filter(([u, hh]) => hh > hc - s.r * 0.5).sort((a, b) => a[0] - b[0]).map(([u, hh]) => cam.P(at(u, hh, -hd + 0.05)));
      ctx.beginPath(); tp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = lin(ctx, tp[0], tp[tp.length - 1], [[0, rgba(C.n300, 0.08)], [0.4, rgba(C.n300, 0.3)], [1, rgba(C.n300, 0.12)]]); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, 0)) * 0.06); ctx.stroke(); }
    return { front, at };
  }
  function pontosLaje(F, s, dz = 0) { const r = [], hc = s.h / 2, h0 = s.h0 || 0; for (const [u, hh] of rrect(s.w, s.h, s.r, 3)) for (const v of [-s.d / 2, s.d / 2 + dz]) r.push(F.P(u, h0 + hc + hh, v)); return r; }
  function pontosCaixa(F, b) { const r = []; for (const u of b.u) for (const h of b.h) for (const v of b.v) r.push(F.P(u, h, v)); return r; }

  // mapeia a textura num retângulo do mundo, em faixas verticais afins (do Fleet): a perspectiva sai certa sem recorte
  function mapear(ctx, tex, TL, BL, n = 120) {
    const TW = tex.width, TH = tex.height;
    ctx.imageSmoothingQuality = 'high';
    for (let i = 0; i < n; i++) {
      const s0 = i / n, s1 = (i + 1) / n, sx0 = s0 * TW, sx1 = s1 * TW;
      const a = TL(s0), b = TL(s1), c = BL(s0);
      const ax = (b[0] - a[0]) / (sx1 - sx0), ay = (b[1] - a[1]) / (sx1 - sx0), cx = (c[0] - a[0]) / TH, cy = (c[1] - a[1]) / TH;
      ctx.setTransform(ax, ay, cx, cy, a[0] - ax * sx0, a[1] - ay * sx0);
      const wpx = Math.min(TW - sx0, sx1 - sx0 + 1.5);
      ctx.drawImage(tex, sx0, 0, wpx, TH, sx0, 0, wpx, TH);
    }
    ID(ctx);
  }
  // a tela num plano do referencial F (v fixo), com o brilho do vidro de cima à esquerda (hero)
  function telaNoPlano(ctx, cam, F, ret, v, tex, raio) {
    const [u0, u1, h0, h1] = ret, pt = (s, h) => cam.P(F.P(u0 + (u1 - u0) * s, h, v));
    const so = rrect(u1 - u0, h1 - h0, raio || 0.25, 4).map(([u, hh]) => cam.P(F.P((u0 + u1) / 2 + u, (h0 + h1) / 2 + hh, v)));
    ctx.save(); path(ctx, so); ctx.clip();
    mapear(ctx, tex, s => pt(s, h1), s => pt(s, h0));
    { const a = pt(0, h1), b = pt(0.6, h0); ctx.fillStyle = lin(ctx, a, b, [[0, rgba(C.n300, 0.07)], [0.5, rgba(C.n300, 0.015)], [1, rgba(C.n300, 0)]]); ctx.fillRect(0, 0, cam.W, cam.H); }
    ctx.restore();
    return so;
  }

  // ---------------- telas (texturas sem texto: blocos, barras e ícones) ----------------
  // desenha em "dp" (largura x altura de projeto) e entrega com k px por dp (feito em 2k e reduzido à metade)
  function tex(wdp, hdp, k, desenho) {
    const cv = layer(Math.round(wdp * k * 2), Math.round(hdp * k * 2)), x = cv.getContext('2d');
    x.scale(k * 2, k * 2); desenho(x, wdp, hdp);
    const half = layer(cv.width >> 1, cv.height >> 1), hx2 = half.getContext('2d'); hx2.imageSmoothingQuality = 'high'; hx2.drawImage(cv, 0, 0, half.width, half.height);
    return half;
  }
  const rr = (x, x0, y0, w, h, r, fill) => { x.beginPath(); x.roundRect(x0, y0, w, h, r); x.fillStyle = fill; x.fill(); };
  const circ = (x, cx, cy, r, fill) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = fill; x.fill(); };
  const linha = (x, pts, cor, wd) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.strokeStyle = cor; x.lineWidth = wd; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); };
  const logoStrukti = (x, x0, y0, s) => { const g = x.createLinearGradient(x0, y0, x0 + s, y0 + s); g.addColorStop(0, rgba(C.e500)); g.addColorStop(1, rgba(C.c400)); rr(x, x0, y0, s, s, s * 0.28, g); };
  const fundoApp = () => mix(mix(C.n900, C.n950, 0.25), C.n800, 0.45);   // o fundo da tela do Fleet (telaFundo 0,45)

  // agenda de quadras: dias, quadras e a grade de horários
  function uiAgenda(x, W, H) {
    const BG = fundoApp(), CARD = mix(BG, C.n700, 0.5);
    x.fillStyle = rgba(BG); x.fillRect(0, 0, W, H);
    rr(x, 24, 14, 34, 8, 4, rgba(C.n600, 0.7)); rr(x, 296, 14, 40, 8, 4, rgba(C.n600, 0.7));
    logoStrukti(x, 20, 42, 34);
    rr(x, 66, 48, 124, 13, 6.5, rgba(C.n300, 0.8)); rr(x, 66, 68, 74, 9, 4.5, rgba(C.n600, 0.85));
    circ(x, 322, 59, 17, rgba(C.n700)); circ(x, 322, 54, 6, rgba(C.n500, 0.8));
    // os dias (o terceiro escolhido)
    for (let i = 0; i < 7; i++) { const x0 = 20 + i * 46.7, sel = i === 2;
      rr(x, x0, 104, 40, 62, 12, rgba(sel ? C.e500 : CARD)); rr(x, x0 + 12, 116, 16, 6, 3, rgba(sel ? C.n50 : C.n500, sel ? 0.8 : 0.7)); rr(x, x0 + 9, 133, 22, 18, 5, rgba(sel ? C.n50 : C.n400, sel ? 0.95 : 0.6)); }
    // as quadras (a primeira escolhida): um ícone de quadra (retângulo com a linha do meio) e uma barra
    for (let i = 0; i < 3; i++) { const x0 = 20 + i * 108, sel = i === 0;
      rr(x, x0, 184, 100, 32, 16, rgba(sel ? C.e500 : CARD, sel ? 0.22 : 1)); if (sel) { x.strokeStyle = rgba(C.e400, 0.9); x.lineWidth = 2; x.stroke(); }
      x.strokeStyle = rgba(sel ? C.e300 : C.n500, 0.9); x.lineWidth = 2; x.strokeRect(x0 + 14, 193, 22, 14); linha(x, [[x0 + 25, 193], [x0 + 25, 207]], rgba(sel ? C.e300 : C.n500, 0.9), 2);
      rr(x, x0 + 46, 196, 40, 8, 4, rgba(sel ? C.e300 : C.n500, 0.8)); }
    // a grade: 8 horários x 2 quadras
    const Y0 = 236, RH = 56;
    for (let r = 0; r <= 8; r++) { const y = Y0 + r * RH; linha(x, [[60, y], [340, y]], rgba(C.n700, 0.6), 1.2); if (r < 8) rr(x, 20, y + 6, 28, 8, 4, rgba(C.n600, 0.85)); }
    const cols = [[64, 132], [204, 132]];
    const blocos = [[0, 0, 2, 'res'], [0, 2, 1, 'livre'], [0, 3, 2, 'meu'], [0, 5, 1, 'livre'], [0, 6, 2, 'res'],
      [1, 0, 1, 'livre'], [1, 1, 1, 'res'], [1, 2, 2, 'res'], [1, 4, 1, 'sel'], [1, 5, 2, 'meu'], [1, 7, 1, 'livre']];
    for (const [c, r0, n, st] of blocos) {
      const [x0, w] = cols[c], y0 = Y0 + r0 * RH + 5, h = n * RH - 10;
      if (st === 'res') { rr(x, x0, y0, w, h, 10, rgba(C.n700, 0.9)); rr(x, x0 + 12, y0 + 12, w * 0.5, 9, 4.5, rgba(C.n500, 0.8)); rr(x, x0 + 12, y0 + 28, w * 0.32, 7, 3.5, rgba(C.n600, 0.8)); }
      else if (st === 'livre') { x.beginPath(); x.roundRect(x0 + 1, y0 + 1, w - 2, h - 2, 10); x.setLineDash([6, 5]); x.strokeStyle = rgba(C.n600, 0.9); x.lineWidth = 1.6; x.stroke(); x.setLineDash([]); }
      else if (st === 'meu') { const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, rgba(C.e500, 0.95)); g.addColorStop(1, rgba(C.e700, 0.9)); rr(x, x0, y0, w, h, 10, g); rr(x, x0 + 12, y0 + 12, w * 0.55, 9, 4.5, rgba(C.n50, 0.9)); rr(x, x0 + 12, y0 + 28, w * 0.35, 7, 3.5, rgba(C.n100, 0.6)); }
      else { rr(x, x0, y0, w, h, 10, rgba(C.c400, 0.14)); x.strokeStyle = rgba(C.c400, 0.95); x.lineWidth = 2.4; x.stroke(); circ(x, x0 + w - 20, y0 + h / 2, 9, rgba(C.c400)); linha(x, [[x0 + w - 24, y0 + h / 2], [x0 + w - 21, y0 + h / 2 + 3], [x0 + w - 15.5, y0 + h / 2 - 3]], rgba(C.n950), 2.2); rr(x, x0 + 12, y0 + h / 2 - 4, w * 0.45, 8, 4, rgba(C.c300, 0.8)); }
    }
    // o botão de reservar
    rr(x, 20, 712, 320, 46, 23, rgba(C.e500)); rr(x, 140, 731, 80, 8, 4, rgba(C.n50, 0.9));
  }
  // estoque para oficinas: busca, resumo, a lista de peças com o nível de cada uma e o botão de adicionar
  function uiEstoque(x, W, H) {
    const BG = fundoApp(), CARD = mix(BG, C.n700, 0.5);
    x.fillStyle = rgba(BG); x.fillRect(0, 0, W, H);
    rr(x, 24, 14, 34, 8, 4, rgba(C.n600, 0.7)); rr(x, 296, 14, 40, 8, 4, rgba(C.n600, 0.7));
    logoStrukti(x, 20, 42, 34);
    rr(x, 66, 48, 112, 13, 6.5, rgba(C.n300, 0.8)); rr(x, 66, 68, 66, 9, 4.5, rgba(C.n600, 0.85));
    // o leitor de código: quatro cantos e as barras
    { const cx = 320, cy = 59, s = 15; for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) linha(x, [[cx + dx * s, cy + dy * (s - 6)], [cx + dx * s, cy + dy * s], [cx + dx * (s - 6), cy + dy * s]], rgba(C.n300, 0.85), 2.4);
      for (let i = -3; i <= 3; i++) linha(x, [[cx + i * 3.2, cy - 7], [cx + i * 3.2, cy + 7]], rgba(C.n400, 0.8), i % 2 ? 1.2 : 2); }
    rr(x, 20, 100, 320, 40, 20, rgba(CARD)); x.beginPath(); x.arc(44, 119, 7, 0, 7); x.strokeStyle = rgba(C.n500); x.lineWidth = 2.4; x.stroke(); linha(x, [[49, 124], [54, 129]], rgba(C.n500), 2.4); rr(x, 64, 115, 110, 8, 4, rgba(C.n600, 0.8));
    // o resumo: um bloco com a barra e o anel
    rr(x, 20, 156, 320, 96, 16, rgba(CARD));
    rr(x, 40, 174, 62, 9, 4.5, rgba(C.n600, 0.85)); rr(x, 40, 192, 92, 22, 6, rgba(C.n400, 0.55));
    rr(x, 40, 226, 150, 8, 4, rgba(C.n800)); rr(x, 40, 226, 104, 8, 4, rgba(C.e500, 0.85));
    x.lineCap = 'round'; x.beginPath(); x.arc(288, 204, 28, 0, 7); x.strokeStyle = rgba(C.n800); x.lineWidth = 10; x.stroke();
    x.beginPath(); x.arc(288, 204, 28, -Math.PI / 2, -Math.PI / 2 + 0.68 * Math.PI * 2); x.strokeStyle = rgba(C.e400, 0.8); x.stroke();
    rr(x, 20, 272, 92, 10, 5, rgba(C.n500, 0.8)); rr(x, 284, 272, 56, 10, 5, rgba(C.n600, 0.7));
    // a lista: miniatura (porca sextavada), nome, código e o nível do estoque
    const niv = [0.82, 0.64, 0.14, 0.9, 0.48, 0.7, 0.36];
    niv.forEach((f, i) => {
      const y = 296 + i * 60, baixo = f < 0.2;
      rr(x, 20, y + 7, 46, 46, 12, rgba(mix(BG, C.n700, 0.75)));
      x.beginPath(); for (let k = 0; k < 6; k++) { const a = (k * 60 + 30) * RAD; const px = 43 + Math.cos(a) * 13, py = y + 30 + Math.sin(a) * 13; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); x.fillStyle = rgba(C.n400, 0.6); x.fill();
      circ(x, 43, y + 30, 5.5, rgba(mix(BG, C.n700, 0.75)));
      rr(x, 80, y + 15, 96 + (i * 37 % 50), 11, 5.5, rgba(C.n300, 0.8)); rr(x, 80, y + 35, 62, 8, 4, rgba(C.n600, 0.85));
      rr(x, 246, y + 19, 94, 8, 4, rgba(C.n800)); rr(x, 246, y + 19, Math.max(10, 94 * f), 8, 4, rgba(baixo ? C.c400 : C.e500, baixo ? 1 : 0.85));
      rr(x, 300, y + 36, 40, 8, 4, rgba(baixo ? C.c300 : C.n500, 0.75));
      if (baixo) circ(x, 232, y + 23, 4.5, rgba(C.c400));
      if (i < niv.length - 1) linha(x, [[80, y + 58], [340, y + 58]], rgba(C.n700, 0.55), 1);
    });
    // o botão de adicionar
    circ(x, 306, 722, 28, rgba(C.e500)); linha(x, [[306, 711], [306, 733]], rgba(C.n50), 4); linha(x, [[295, 722], [317, 722]], rgba(C.n50), 4);
  }
  // totem: o check-in confirmado (anel com o visto), o cartão do aluno e os passos
  function uiTotem(x, W, H) {
    const BG = fundoApp(), CARD = mix(BG, C.n700, 0.5);
    x.fillStyle = rgba(BG); x.fillRect(0, 0, W, H);
    logoStrukti(x, 26, 24, 32); rr(x, 70, 33, 110, 13, 6.5, rgba(C.n300, 0.8)); circ(x, 410, 40, 13, rgba(C.n700));
    const cx = W / 2, cy = 236;
    circ(x, cx, cy, 96, rgba(C.c400, 0.07));
    x.beginPath(); x.arc(cx, cy, 82, 0, 7); x.strokeStyle = rgba(C.n800); x.lineWidth = 15; x.stroke();
    { const g = x.createLinearGradient(cx - 82, cy - 82, cx + 82, cy + 82); g.addColorStop(0, rgba(C.e500)); g.addColorStop(1, rgba(C.c400)); x.beginPath(); x.arc(cx, cy, 82, 0, 7); x.strokeStyle = g; x.lineWidth = 15; x.stroke(); }
    linha(x, [[cx - 36, cy + 2], [cx - 10, cy + 28], [cx + 40, cy - 26]], rgba(C.n50, 0.95), 15);
    rr(x, cx - 96, 360, 192, 17, 8.5, rgba(C.n200, 0.85)); rr(x, cx - 62, 390, 124, 10, 5, rgba(C.n500, 0.8));
    rr(x, 36, 436, W - 72, 92, 18, rgba(CARD));
    circ(x, 86, 482, 27, rgba(C.n600)); circ(x, 86, 474, 10, rgba(C.n400, 0.8)); x.beginPath(); x.arc(86, 500, 17, Math.PI * 1.1, Math.PI * 1.9); x.fillStyle = rgba(C.n400, 0.8); x.fill();
    rr(x, 128, 464, 150, 13, 6.5, rgba(C.n300, 0.8)); rr(x, 128, 488, 94, 9, 4.5, rgba(C.n600, 0.85));
    rr(x, 300, 467, 92, 30, 15, rgba(C.c400, 0.16)); x.strokeStyle = rgba(C.c400, 0.85); x.lineWidth = 2; x.stroke(); rr(x, 318, 478, 56, 8, 4, rgba(C.c300, 0.8));
    for (let i = 0; i < 3; i++) circ(x, cx - 22 + i * 22, 566, 6, rgba(i === 1 ? C.e400 : C.n600, 0.9));
  }
  // navegador (sites): a barra do navegador e a página clara, esmaecida (a tela de noite)
  function cromo(x, W, H, PG) {
    x.fillStyle = rgba(PG); x.fillRect(0, 0, W, H);
    rr(x, 0, 0, W, 58, 0, rgba(mix(C.n800, C.n900, 0.4)));
    for (let i = 0; i < 3; i++) circ(x, 28 + i * 22, 29, 7, rgba(C.n600, 0.95));
    x.beginPath(); x.roundRect(104, 12, 230, 46, [12, 12, 0, 0]); x.fillStyle = rgba(PG); x.fill(); rr(x, 124, 30, 120, 10, 5, rgba(C.n500, 0.8));
    rr(x, 360, 15, W - 520, 30, 15, rgba(C.n900, 0.85)); circ(x, 382, 30, 6, rgba(C.n500, 0.9)); rr(x, 398, 25, 180, 10, 5, rgba(C.n600, 0.95));
    for (let i = 0; i < 2; i++) circ(x, W - 100 + i * 34, 30, 9, rgba(C.n700));
  }
  const PAGINA = () => mix(C.n100, C.n200, 0.5);
  function uiClinica(x, W, H) {
    const PG = PAGINA(), INK = C.n800, SOFT = mix(C.n200, C.n300, 0.4), CARDB = mix(C.n50, C.n100, 0.3);
    cromo(x, W, H, PG);
    // menu: marca (quadrado violeta), itens e o botão de agendar com o contorno violeta
    rr(x, 44, 80, 30, 30, 8, rgba(VIO)); rr(x, 86, 89, 120, 12, 6, rgba(C.n600, 0.9));
    for (let i = 0; i < 4; i++) rr(x, 560 + i * 96, 90, 66, 10, 5, rgba(C.n400, 0.9));
    rr(x, 1000, 78, 156, 34, 17, rgba(C.n50, 0)); x.strokeStyle = rgba(VIO); x.lineWidth = 2.4; x.stroke(); rr(x, 1034, 91, 88, 8, 4, rgba(VIO, 0.85));
    // destaque: título, texto, os dois botões e a imagem (a cruz)
    rr(x, 60, 176, 430, 34, 9, rgba(INK, 0.92)); rr(x, 60, 222, 330, 34, 9, rgba(INK, 0.92));
    rr(x, 60, 284, 410, 12, 6, rgba(C.n500, 0.85)); rr(x, 60, 306, 370, 12, 6, rgba(C.n500, 0.85)); rr(x, 60, 328, 300, 12, 6, rgba(C.n500, 0.85));
    rr(x, 60, 380, 196, 50, 25, rgba(VIO)); rr(x, 100, 400, 116, 10, 5, rgba(C.n50, 0.95));
    rr(x, 272, 380, 176, 50, 25, rgba(PG, 0)); x.strokeStyle = rgba(C.n500); x.lineWidth = 2; x.stroke(); rr(x, 310, 400, 100, 10, 5, rgba(C.n500, 0.9));
    { const x0 = 590, y0 = 150, w = 560, h = 310; const g = x.createLinearGradient(x0, y0, x0 + w, y0 + h); g.addColorStop(0, rgba(mix(C.n300, C.n400, 0.3))); g.addColorStop(1, rgba(mix(C.n400, C.n500, 0.4))); rr(x, x0, y0, w, h, 24, g);
      circ(x, x0 + w * 0.62, y0 + h * 0.48, 112, rgba(C.n200, 0.35)); circ(x, x0 + w * 0.62, y0 + h * 0.48, 76, rgba(C.n50, 0.55));
      const cx = x0 + w * 0.62, cy = y0 + h * 0.48; rr(x, cx - 14, cy - 44, 28, 88, 6, rgba(C.n50, 0.95)); rr(x, cx - 44, cy - 14, 88, 28, 6, rgba(C.n50, 0.95));
      rr(x, x0 - 34, y0 + h - 70, 250, 84, 16, rgba(CARDB)); circ(x, x0 + 4, y0 + h - 28, 22, rgba(VIO, 0.2));
      x.strokeStyle = rgba(VIO); x.lineWidth = 2.6; x.strokeRect(x0 - 7, y0 + h - 38, 22, 20); linha(x, [[x0 - 7, y0 + h - 32], [x0 + 15, y0 + h - 32]], rgba(VIO), 2.6);
      rr(x, x0 + 40, y0 + h - 46, 120, 11, 5.5, rgba(C.n700, 0.9)); rr(x, x0 + 40, y0 + h - 26, 80, 9, 4.5, rgba(C.n400, 0.9)); }
    // os serviços: três cartões com ícone (cruz, coração, calendário)
    for (let i = 0; i < 3; i++) { const x0 = 60 + i * 370, y0 = 520;
      rr(x, x0, y0, 340, 200, 18, rgba(CARDB)); circ(x, x0 + 52, y0 + 54, 28, rgba(i === 0 ? VIO : SOFT, i === 0 ? 0.22 : 0.9));
      const ic = rgba(i === 0 ? VIO : C.n600), cx = x0 + 52, cy = y0 + 54;
      if (i === 0) { rr(x, cx - 4, cy - 13, 8, 26, 2, ic); rr(x, cx - 13, cy - 4, 26, 8, 2, ic); }
      else if (i === 1) { x.beginPath(); x.moveTo(cx, cy + 12); x.bezierCurveTo(cx - 22, cy - 2, cx - 10, cy - 20, cx, cy - 8); x.bezierCurveTo(cx + 10, cy - 20, cx + 22, cy - 2, cx, cy + 12); x.fillStyle = ic; x.fill(); }
      else { x.strokeStyle = ic; x.lineWidth = 3; x.strokeRect(cx - 12, cy - 10, 24, 22); linha(x, [[cx - 12, cy - 3], [cx + 12, cy - 3]], ic, 3); }
      rr(x, x0 + 28, y0 + 104, 200, 14, 7, rgba(C.n700, 0.9)); rr(x, x0 + 28, y0 + 132, 270, 10, 5, rgba(C.n400, 0.85)); rr(x, x0 + 28, y0 + 152, 230, 10, 5, rgba(C.n400, 0.85)); }
  }
  function uiLoja(x, W, H) {
    const PG = PAGINA(), CARDB = mix(C.n50, C.n100, 0.3), IMG = mix(C.n100, C.n200, 0.7);
    cromo(x, W, H, PG);
    rr(x, 40, 80, 30, 30, 8, rgba(VIO)); rr(x, 82, 89, 104, 12, 6, rgba(C.n600, 0.9));
    rr(x, 360, 76, 470, 38, 19, rgba(C.n50, 0.7)); x.strokeStyle = rgba(C.n300); x.lineWidth = 1.6; x.stroke(); x.beginPath(); x.arc(386, 95, 7, 0, 7); x.strokeStyle = rgba(C.n500); x.lineWidth = 2.4; x.stroke(); rr(x, 404, 91, 140, 8, 4, rgba(C.n300, 0.95));
    // a sacola do carrinho, com o selo violeta
    { const cx = 1130, cy = 96; x.strokeStyle = rgba(C.n700); x.lineWidth = 2.6; x.strokeRect(cx - 14, cy - 8, 28, 22); x.beginPath(); x.arc(cx, cy - 8, 8, Math.PI, 0); x.stroke(); circ(x, cx + 15, cy - 13, 8, rgba(VIO)); }
    for (let i = 0; i < 3; i++) rr(x, 880 + i * 70, 91, 50, 9, 4.5, rgba(C.n400, 0.9));
    // a faixa de ofertas: texto, botão e dois produtos
    { const x0 = 40, y0 = 138, w = W - 80, h = 196; const g = x.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, rgba(mix(C.n300, C.n400, 0.2))); g.addColorStop(1, rgba(mix(C.n300, C.n200, 0.5))); rr(x, x0, y0, w, h, 22, g);
      rr(x, 84, 182, 360, 30, 8, rgba(C.n800, 0.9)); rr(x, 84, 224, 270, 12, 6, rgba(C.n600, 0.9)); rr(x, 84, 262, 170, 44, 22, rgba(VIO)); rr(x, 116, 280, 106, 9, 4.5, rgba(C.n50, 0.95));
      x.beginPath(); x.ellipse(840, 270, 66, 18, 0, 0, 7); x.fillStyle = rgba(C.n500, 0.35); x.fill();
      x.beginPath(); x.moveTo(800, 270); x.bezierCurveTo(780, 210, 800, 175, 820, 168); x.lineTo(860, 168); x.bezierCurveTo(880, 175, 900, 210, 880, 270); x.closePath(); x.fillStyle = rgba(C.n50, 0.9); x.fill();
      rr(x, 930, 196, 90, 76, 10, rgba(C.n600, 0.9)); rr(x, 930, 196, 90, 18, [10, 10, 0, 0], rgba(C.n500, 0.9)); }
    // a vitrine: quatro produtos, cada um com imagem, nome, preço e o botão de pôr no carrinho
    const forma = (i, cx, cy) => {
      const cor = rgba(i % 2 ? C.n500 : C.n400, 0.95);
      if (i === 0) { x.beginPath(); x.moveTo(cx - 26, cy - 34); x.lineTo(cx + 26, cy - 34); x.lineTo(cx + 22, cy + 38); x.lineTo(cx - 22, cy + 38); x.closePath(); x.fillStyle = cor; x.fill(); x.beginPath(); x.arc(cx + 30, cy, 14, -Math.PI / 2, Math.PI / 2); x.strokeStyle = cor; x.lineWidth = 7; x.stroke(); }
      else if (i === 1) { rr(x, cx - 18, cy - 20, 36, 60, 10, cor); rr(x, cx - 9, cy - 40, 18, 22, 4, cor); }
      else if (i === 2) { rr(x, cx - 34, cy - 18, 68, 58, 8, cor); x.beginPath(); x.arc(cx, cy - 18, 18, Math.PI, 0); x.strokeStyle = cor; x.lineWidth = 6; x.stroke(); }
      else { x.beginPath(); x.moveTo(cx - 30, cy + 2); x.lineTo(cx + 30, cy + 2); x.lineTo(cx + 16, cy - 36); x.lineTo(cx - 16, cy - 36); x.closePath(); x.fillStyle = cor; x.fill(); rr(x, cx - 3, cy + 2, 6, 34, 2, cor); rr(x, cx - 22, cy + 34, 44, 7, 3, cor); }
    };
    for (let i = 0; i < 4; i++) { const x0 = 40 + i * 286, y0 = 360;
      rr(x, x0, y0, 262, 330, 18, rgba(CARDB)); rr(x, x0 + 14, y0 + 14, 234, 184, 12, rgba(IMG)); forma(i, x0 + 131, y0 + 106);
      rr(x, x0 + 18, y0 + 218, 150, 12, 6, rgba(C.n700, 0.9)); rr(x, x0 + 18, y0 + 242, 100, 9, 4.5, rgba(C.n400, 0.9)); rr(x, x0 + 18, y0 + 272, 84, 20, 6, rgba(C.n800, 0.9));
      const sel = i === 1; circ(x, x0 + 226, y0 + 282, 20, rgba(sel ? VIO : C.n50, sel ? 1 : 0)); if (!sel) { x.strokeStyle = rgba(C.n400); x.lineWidth = 2; x.stroke(); }
      linha(x, [[x0 + 218, y0 + 282], [x0 + 234, y0 + 282]], rgba(sel ? C.n50 : C.n500), 3); linha(x, [[x0 + 226, y0 + 274], [x0 + 226, y0 + 290]], rgba(sel ? C.n50 : C.n500), 3); }
    for (let i = 0; i < 4; i++) rr(x, 40 + i * 286, 716, 262, 140, 18, rgba(CARDB));
  }
  const UIS = { agenda: [360, 773, uiAgenda], estoque: [360, 773, uiEstoque], totem: [440, 600, uiTotem], clinica: [1200, 760, uiClinica], loja: [1200, 820, uiLoja] };

  // ---------------- geometria de cada item ----------------
  // cada montagem devolve: objeto (pontos do objeto principal, para a sonda), sombras (conjuntos de pontos que
  // fazem sombra), tela (centro e normal da tela acesa, para a luz), leds e desenhar(ctx, cam, o).
  const CEL = { w: 7.3, h: 15.2, d: 0.85, r: 1.05 };
  function montaCelular(it) {
    const c = it.celular, base = it.caixa ? null : { u: [-4.2, 4.2], h: [0, 0.55], v: [-4, 5.5] };
    const y = base ? 0.8 : 0.2, F = Fr({ x: c.x, y, z: c.z, rot: c.rot, tilt: c.tilt });
    const Fb = Fr({ x: c.x, y: 0, z: c.z + 0.5, rot: c.rot });
    const tela = { c: F.P(0, CEL.h / 2, -CEL.d / 2), n: F.R([0, 0, -1]) };
    const objeto = pontosLaje(F, CEL);
    const sombras = [pontosLaje(F, CEL)];
    if (base) sombras.push(pontosCaixa(Fb, base));
    let Fx = null, cx = null;
    if (it.caixa) { const b = it.caixa; Fx = Fr({ x: b.x, y: 0, z: b.z, rot: b.rot }); cx = { u: [-b.w / 2, b.w / 2], h: [0, b.h], v: [-b.d / 2, b.d / 2] }; sombras.push(pontosCaixa(Fx, cx)); }
    function desenhar(ctx, cam, o) {
      const plast = [30, 34, 42];
      if (cx) {   // a caixa de peças: papelão escuro, fita no meio e uma etiqueta lisa (sem texto)
        const kraft = [74, 64, 52];
        caixa3d(ctx, cam, Fx, Object.assign({ alb: kraft, aresta: 0.12, esc: 0.86, k: { amb: 1.35 } }, cx));
        const b = it.caixa, fita = [84, 76, 64];
        caixa3d(ctx, cam, Fx, { u: [-1.8, 1.8], h: [b.h - 0.02, b.h + 0.06], v: [-b.d / 2 - 0.05, b.d / 2 + 0.05], alb: fita, k: { amb: 1.35 } });
        caixa3d(ctx, cam, Fx, { u: [-1.8, 1.8], h: [b.h - 3.5, b.h + 0.06], v: [-b.d / 2 - 0.08, -b.d / 2 + 0.02], alb: fita, esc: 0.9, k: { amb: 1.35 } });
        // a emenda das abas, na tampa
        { const a = cam.P(Fx.P(-b.w / 2 + 0.3, b.h + 0.07, 0)), z = cam.P(Fx.P(b.w / 2 - 0.3, b.h + 0.07, 0)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(z[0], z[1]); ctx.strokeStyle = rgba(C.black, 0.35); ctx.lineWidth = 1.2; ctx.stroke(); }
        caixa3d(ctx, cam, Fx, { u: [4.5, 9], h: [3.5, 6.8], v: [-b.d / 2 - 0.1, -b.d / 2 + 0.02], alb: [86, 88, 92], esc: 0.9 });
      }
      if (base) {   // o suporte de mesa: a chapa de base, a chapa de trás (inclinada) e o lábio da frente
        caixa3d(ctx, cam, Fb, Object.assign({ alb: plast, aresta: 0.18 }, base));
        caixa3d(ctx, cam, F, { u: [-2.6, 2.6], h: [-1.0, 11], v: [CEL.d / 2, CEL.d / 2 + 0.45], alb: plast });
      }
      laje(ctx, cam, F, CEL);
      const [w, h, f] = UIS[c.ui]; const T = tex(w, h, 0.62, f);
      telaNoPlano(ctx, cam, F, [-CEL.w / 2 + 0.28, CEL.w / 2 - 0.28, 0.3, CEL.h - 0.3], -CEL.d / 2 - 0.005, T, 0.75);
      if (base) caixa3d(ctx, cam, F, { u: [-3.0, 3.0], h: [-0.3, 0.35], v: [-CEL.d / 2 - 0.5, -CEL.d / 2 - 0.05], alb: plast, aresta: 0.22 });
    }
    return { objeto, sombras, tela: Object.assign(tela, { alcance: 16, k: 1 }), desenhar, brilhoMesa: { c: [c.x, 0.02, c.z - 3], rx: 16, rz: 7 } };
  }
  function montaNotebook(it) {
    const nb = it.notebook, Fb = Fr({ x: nb.x, y: 0, z: nb.z, rot: nb.rot });
    const base = { u: [-15.5, 15.5], h: [0, 1.5], v: [-10.8, 10.8] };
    const dob = Fb.P(0, 1.5, 10.6), Ft = Fr({ x: dob[0], y: dob[1], z: dob[2], rot: nb.rot, tilt: nb.abre });
    const tampa = { w: 31, h: 21, d: 0.55, r: 0.7 };
    // a tampa: o referencial tem a dobradiça no pé; a tela olha para -v
    const Fl = { P: (u, h, v) => Ft.P(u, h, v - tampa.d / 2), R: Ft.R };
    const objeto = pontosLaje(Fl, tampa).concat(pontosCaixa(Fb, base));
    const tela = { c: Fl.P(0, tampa.h / 2, -tampa.d / 2), n: Fl.R([0, 0, -1]), alcance: 24, k: 0.45, cor: [0.4, 0.5, 0.75] };
    function desenhar(ctx, cam, o) {
      const alu = [54, 58, 68];
      const fc = caixa3d(ctx, cam, Fb, Object.assign({ alb: alu, aresta: 0.2, esc: 0.75 }, base));
      // o teclado (escuro) e o touchpad, no tampo
      const top = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => cam.P(Fb.P(u, 1.51, v)));
      path(ctx, top(-13.6, 13.6, -1.2, 9.4)); ctx.fillStyle = rgba(luz([22, 25, 31], Fb.P(0, 1.5, 4), [0, 1, 0])); ctx.fill();
      for (let r = 0; r < 5; r++) for (let k = 0; k < 13; k++) { const u0 = -13.2 + k * 2.05, v0 = -0.8 + r * 2.0; path(ctx, top(u0, u0 + 1.7, v0, v0 + 1.6)); ctx.fillStyle = rgba(luz([30, 33, 40], Fb.P(u0, 1.5, v0), [0, 1, 0]), 0.75); ctx.fill(); }
      path(ctx, top(-5.4, 5.4, -9.6, -2.8)); ctx.fillStyle = rgba(luz([50, 54, 63], Fb.P(0, 1.5, -6), [0, 1, 0])); ctx.fill();
      laje(ctx, cam, Fl, Object.assign({ alb: alu, aro: 0.3 }, tampa));
      const [w, h, f] = UIS[it.ui || 'clinica']; const T = tex(w, h, 0.52, f);
      const so = telaNoPlano(ctx, cam, Fl, [-14.6, 14.6, 1.2, 20.1], -tampa.d / 2 - 0.005, T, 0.2);
      // a tela de noite: brilho baixo (a página clara não pode virar o ponto mais claro do quadro de longe)
      ctx.save(); path(ctx, so); ctx.fillStyle = rgba(C.n950, 1 - o.telaBrilho * 0.74); ctx.fill(); ctx.restore();
      // a webcam
      { const q = cam.P(Fl.P(0, 20.6, -tampa.d / 2 - 0.01)); circ(ctx, q[0], q[1], 1.4, rgba(C.black)); }
    }
    return { objeto, sombras: [objeto], tela, desenhar, brilhoMesa: { c: [nb.x, 0.02, nb.z - 12], rx: 28, rz: 10, cor: C.n300, k: 0.18 } };
  }
  function montaTablet(it) {
    const tb = it.tablet, TB = { w: 24.6, h: 17.6, d: 0.7, r: 1.0 };
    const F = Fr({ x: tb.x, y: 1.3, z: tb.z, rot: tb.rot, tilt: tb.tilt }), Fb = Fr({ x: tb.x, y: 0, z: tb.z + 1.5, rot: tb.rot });
    const base = { u: [-7, 7], h: [0, 1.1], v: [-4.5, 5] };
    const sc = it.sacola, Fs = Fr({ x: sc.x, y: 0, z: sc.z, rot: sc.rot }), sac = { u: [-8.5, 8.5], h: [0, 19], v: [-5, 5] };
    const objeto = pontosLaje(F, TB).concat(pontosCaixa(Fb, base));
    const tela = { c: F.P(0, TB.h / 2, -TB.d / 2), n: F.R([0, 0, -1]), alcance: 22, k: 0.5, cor: [0.4, 0.5, 0.75] };
    function desenhar(ctx, cam, o) {
      const plast = [30, 34, 42];
      // a sacola de papel (navy acinzentado) com as alças de cordão
      caixa3d(ctx, cam, Fs, Object.assign({ alb: [58, 64, 80], aresta: 0.16, esc: 0.78 }, sac));
      { const fz = -5.05; caixa3d(ctx, cam, Fs, { u: [-8.5, 8.5], h: [16.8, 19], v: [fz - 0.05, fz + 0.05], alb: [66, 72, 88], esc: 0.95 });
        for (const vv of [-4.6, 4.6]) { const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 16; pts.push(cam.P(Fs.P(-3.2 * Math.cos(a), 19 + 7 * Math.sin(a), vv))); }
          ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = rgba(luz([40, 44, 54], Fs.P(0, 24, vv), [0, 1, -0.5]), 1); ctx.lineWidth = Math.max(1.2, cam.S(Fs.P(0, 22, vv)) * 0.35); ctx.lineCap = 'round'; ctx.stroke(); } }
      caixa3d(ctx, cam, Fb, Object.assign({ alb: plast, aresta: 0.2 }, base));
      caixa3d(ctx, cam, F, { u: [-4, 4], h: [-0.6, 10], v: [TB.d / 2, TB.d / 2 + 0.5], alb: plast });
      laje(ctx, cam, F, Object.assign({ alb: [52, 57, 68], aro: 0.35 }, TB));
      const [w, h, f] = UIS.loja; const T = tex(w, h, 0.5, f);
      const so = telaNoPlano(ctx, cam, F, [-TB.w / 2 + 1.0, TB.w / 2 - 1.0, 1.0, TB.h - 1.0], -TB.d / 2 - 0.005, T, 0.3);
      ctx.save(); path(ctx, so); ctx.fillStyle = rgba(C.n950, 1 - o.telaBrilho * 0.74); ctx.fill(); ctx.restore();
      caixa3d(ctx, cam, F, { u: [-8.5, 8.5], h: [-0.5, 0.8], v: [-TB.d / 2 - 0.7, -TB.d / 2 - 0.05], alb: plast, aresta: 0.25 });
    }
    return { objeto, sombras: [pontosLaje(F, TB), pontosCaixa(Fb, base), pontosCaixa(Fs, sac)], tela, desenhar, brilhoMesa: { c: [tb.x, 0.02, tb.z - 6], rx: 22, rz: 8, cor: C.n300, k: 0.18 } };
  }
  function montaTotem(it) {
    const t = it.totem, Fb = Fr({ x: t.x, y: 0, z: t.z, rot: t.rot });
    const base = { u: [-12.5, 12.5], h: [0, 1.6], v: [-9.5, 9.5] }, col = { u: [-3.6, 3.6], h: [1.6, 33], v: [0.5, 5] };
    const topo = Fb.P(0, 30, 2.5), Fh = Fr({ x: topo[0], y: topo[1], z: topo[2], rot: t.rot, tilt: 13 });
    const cab = { w: 28, h: 44, d: 3.4, r: 1.8 };
    const objeto = pontosLaje(Fh, cab).concat(pontosCaixa(Fb, base));
    const tela = { c: Fh.P(0, 28, -cab.d / 2), n: Fh.R([0, 0, -1]), alcance: 30, k: 1.2 };
    const leitor = Fh.P(0, 6.6, -cab.d / 2 - 0.05);
    function desenhar(ctx, cam, o) {
      const corpo = [46, 52, 64];
      caixa3d(ctx, cam, Fb, Object.assign({ alb: corpo, aresta: 0.2, esc: 0.75 }, base));
      caixa3d(ctx, cam, Fb, Object.assign({ alb: corpo, esc: 0.6 }, col));
      const L = laje(ctx, cam, Fh, Object.assign({ alb: corpo, frente: [16, 21, 29], aro: 0.32, aroW: 0.04 }, cab));
      const [w, h, f] = UIS.totem; const T = tex(w, h, 0.62, f);
      telaNoPlano(ctx, cam, Fh, [-12.4, 12.4, 13.0, 41.6], -cab.d / 2 - 0.01, T, 0.6);
      // o leitor: aro escuro, a placa e o anel de LED ciano (o detalhe da Strukti), e o hexágono da marca
      const ua = Fh.R([1, 0, 0]), ha = Fh.R([0, 1, 0]), Fp = (u, h) => Fh.P(u, h, -cab.d / 2 - 0.03);
      const disc = (u, h, r, fill) => { discT(ctx, cam, Fp(u, h), mul(ua, r), mul(ha, r)); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = fill; ctx.fill(); ID(ctx); };
      disc(0, 6.6, 4.6, rgba([8, 12, 18]));
      disc(0, 6.6, 3.7, rgba(mix(C.c600, C.n900, 0.55)));
      disc(0, 6.6, 3.0, rgba([12, 17, 25]));
      { discT(ctx, cam, Fp(-10.2, 2.6), ua, ha); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 90) * RAD; const x = Math.cos(a) * 0.75, y = Math.sin(a) * 0.75; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(C.n300, 0.45); ctx.fill(); ID(ctx); }
      return { ua, ha, Fp };
    }
    function emissao(ctx, cam, o, info) {
      const k = o.ledK; if (!(k > 0)) return;
      const { ua, ha, Fp } = info;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      discT(ctx, cam, Fp(0, 6.6), mul(ua, 1), mul(ha, 1)); ctx.beginPath(); ctx.arc(0, 0, 3.7, 0, 7); ctx.arc(0, 0, 3.05, 0, 7, true); ctx.fillStyle = rgba(C.c500, 0.9 * k); ctx.fill(); ID(ctx);
      glow(ctx, cam.P(Fp(0, 6.6)), cam.S(Fp(0, 6.6)) * 6, C.c500, 0.2 * k);
      glow(ctx, cam.P(Fp(0, 6.6)), cam.S(Fp(0, 6.6)) * 14, C.c400, 0.05 * k);
      ctx.restore();
    }
    return { objeto, sombras: [objeto.concat(pontosCaixa(Fb, col))], tela, desenhar, emissao, leds: [{ pos: add(leitor, mul(Fh.R([0, 0, -1]), 2)), k: 0.25, alcance: 9, eixo: Fh.R([0, 0, -1]) }],
      brilhoMesa: { c: [t.x, 0.02, t.z - 12], rx: 26, rz: 12, k: 0.6 } };
  }
  function montaPlacar(it) {
    const p = it.placar, F = Fr({ x: p.x, y: p.y, z: p.z, rot: p.rot });
    const cx = { u: [-p.w / 2, p.w / 2], h: [0, p.h], v: [-p.d / 2, p.d / 2] };
    const objeto = pontosCaixa(F, cx);
    // os pips: 3 x 4 de cada lado; acesos 7 à esquerda e 5 à direita (pontos, sem algarismos)
    const pips = []; for (const [lado, acesos] of [[-1, 7], [1, 5]]) for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c; pips.push({ u: lado * (12 + c * 9.2) + (lado < 0 ? 0 : 0), h: 31 - r * 10.5, on: i < acesos, lado }); }
    const fr = F.P(0, p.h / 2, -p.d / 2 - 0.1);
    function desenhar(ctx, cam, o) {
      // as hastes até o teto
      for (const u of [-p.w * 0.36, p.w * 0.36]) { const a = cam.P(F.P(u, p.h, 0)), b = cam.P(F.P(u, 400, 0)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = rgba(mix(C.n800, C.n700, 0.6)); ctx.lineWidth = Math.max(2, cam.S(F.P(0, p.h, 0)) * 1.2); ctx.stroke(); ctx.strokeStyle = rgba(C.n400, 0.25); ctx.lineWidth = 1; ctx.stroke(); }
      caixa3d(ctx, cam, F, Object.assign({ alb: [40, 46, 58], aresta: 0.3, esc: 0.7, albF: { frente: [26, 31, 40] } }, cx));
      const Fp = (u, h) => F.P(u, h, -p.d / 2 - 0.05), ua = F.R([1, 0, 0]), ha = [0, 1, 0];
      const quad = (u0, u1, h0, h1, fill) => { path(ctx, [[u0, h0], [u1, h0], [u1, h1], [u0, h1]].map(([u, h]) => cam.P(Fp(u, h)))); ctx.fillStyle = fill; ctx.fill(); };
      // dois painéis rebaixados, as faixas das equipes em cima (elétrico e ciano) e a coluna do meio
      quad(-p.w / 2 + 3, -4, 3.5, p.h - 7, rgba([9, 13, 19])); quad(4, p.w / 2 - 3, 3.5, p.h - 7, rgba([9, 13, 19]));
      quad(-p.w / 2 + 3, -4, p.h - 5.0, p.h - 3.8, rgba(C.e500, 0.5)); quad(4, p.w / 2 - 3, p.h - 5.0, p.h - 3.8, rgba(C.c400, 0.45));
      quad(-2.4, 2.4, 3.5, p.h - 7, rgba([12, 17, 24]));
      const disc = (u, h, r, fill) => { discT(ctx, cam, Fp(u, h), mul(ua, r), mul(ha, r)); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = fill; ctx.fill(); ID(ctx); };
      for (const lado of [-1, 1]) for (let i = 0; i < 20; i++) for (let j = 0; j < 17; j++) disc(lado * (6.2 + i * 2.05), 5.4 + j * 2.05, 0.42, rgba(C.n800, 0.55));
      for (const q of pips) { disc(q.u, q.h, 3.0, rgba([7, 11, 16])); disc(q.u, q.h, 2.3, rgba(q.on ? mix(mix(C.c400, C.c200, 0.2), C.n300, 0.3) : mix(C.n800, C.n700, 0.25))); }
      disc(0, 27, 1.1, rgba(C.c300, 0.9)); disc(0, 17, 1.1, rgba(C.c300, 0.9));
      // a barra do tempo (embaixo, no meio) e o hexágono da marca
      quad(-1.2, 1.2, 6, 11.5, rgba(C.n700, 0.9)); quad(-1.2, 1.2, 6, 9.2, rgba(C.c400, 0.85));
      { discT(ctx, cam, Fp(-p.w / 2 + 4.2, 1.8), ua, ha); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 90) * RAD; const x = Math.cos(a) * 0.8, y = Math.sin(a) * 0.8; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(C.n300, 0.45); ctx.fill(); ID(ctx); }
      return { Fp, ua, ha };
    }
    function emissao(ctx, cam, o, info) {
      const k = o.ledK; if (!(k > 0)) return; const { Fp } = info;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (const q of pips) if (q.on) { const c = Fp(q.u, q.h); glow(ctx, cam.P(c), cam.S(c) * 5, C.c500, 0.12 * k); }
      // o véu de luz ciano dos painéis no ar à frente (fraco e largo)
      glow(ctx, cam.P(fr), cam.S(fr) * 70, C.c500, 0.05 * k);
      ctx.restore();
    }
    return { objeto, sombras: [objeto], desenhar, emissao,
      leds: [{ pos: F.P(-24, p.h / 2, -p.d / 2 - 6), k: 1.1, alcance: 40, eixo: norm([0, -0.5, -1]) }, { pos: F.P(24, p.h / 2, -p.d / 2 - 6), k: 0.8, alcance: 40, eixo: norm([0, -0.5, -1]) }] };
  }
  function montaSensor(it) {
    const s = it.sensor, F = Fr({ x: s.x, y: s.y, z: s.z });
    const cx = { u: [-s.w / 2, s.w / 2], h: [0, s.h], v: [-s.d / 2, s.d / 2] };
    const objeto = pontosCaixa(F, cx);
    function desenhar(ctx, cam, o) {
      // o suporte na parede (uma chapa) e a caixa do sensor
      caixa3d(ctx, cam, F, { u: [-s.w / 2 + 2, s.w / 2 - 2], h: [1, s.h + 3], v: [s.d / 2, PZ - s.z], alb: [36, 41, 52], esc: 0.75 });
      const f = caixa3d(ctx, cam, F, Object.assign({ alb: [52, 58, 72], aresta: 0.35, esc: 0.72 }, cx));
      // embaixo: as duas lentes (escuras, com aro ciano apagado); na frente: o hexágono e o LED
      const Fd = (u, v) => F.P(u, -0.03, v), ua = [1, 0, 0], va = [0, 0, 1];
      const discB = (u, v, r, fill) => { discT(ctx, cam, Fd(u, v), mul(ua, r), mul(va, r)); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = fill; ctx.fill(); ID(ctx); };
      if (f.base) { for (const u of [-5.5, 5.5]) { discB(u, 0, 2.6, rgba([8, 12, 18])); discB(u, 0, 1.7, rgba(mix(C.c600, C.n900, 0.5))); discB(u, 0, 1.1, rgba([5, 8, 13])); } }
      const Fp = (u, h) => F.P(u, h, -s.d / 2 - 0.04);
      { discT(ctx, cam, Fp(-s.w / 2 + 3.2, s.h / 2), ua, [0, 1, 0]); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 90) * RAD; const x = Math.cos(a) * 1.1, y = Math.sin(a) * 1.1; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(C.n300, 0.5); ctx.fill(); ID(ctx); }
      path(ctx, rrect(9, 0.9, 0.45, 4).map(([u, h]) => cam.P(Fp(u + 4, 2.2 + h)))); ctx.fillStyle = rgba(mix(C.c600, C.n900, 0.7)); ctx.fill();
      return { Fp, Fd, discB };
    }
    function emissao(ctx, cam, o, info) {
      const k = o.ledK; if (!(k > 0)) return; const { Fp, Fd } = info;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      // o leque de detecção: das lentes até o vão da porta, some antes da metade de baixo do quadro
      const a = [cam.P(Fd(-6, 0)), cam.P(Fd(6, 0))], yS = a[0][1];
      const pe = [[-50, 0, 30], [50, 0, 30], [50, 0, 60], [-50, 0, 60]].map(cam.P);
      const fim = o.leque || 0.52, yF = cam.H * fim;
      const pts = [a[0], a[1], pe[1], pe[0]];
      path(ctx, hull(pts.concat([pe[2], pe[3]])));
      ctx.fillStyle = lin(ctx, [0, yS], [0, yF], [[0, rgba(C.c400, 0.13 * k)], [0.35, rgba(C.c400, 0.055 * k)], [1, rgba(C.c400, 0)]]); ctx.fill();
      // as bordas do leque, um fio
      for (const [p0, p1] of [[a[0], pe[0]], [a[1], pe[1]]]) { const t = (yF - p0[1]) / (p1[1] - p0[1]); const q = [p0[0] + (p1[0] - p0[0]) * t, yF]; ctx.strokeStyle = lin(ctx, p0, q, [[0, rgba(C.c300, 0.3 * k)], [1, rgba(C.c300, 0)]]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
      // as lentes e o LED acesos
      for (const u of [-5.5, 5.5]) glow(ctx, cam.P(Fd(u, 0)), cam.S(Fd(u, 0)) * 3.2, C.c400, 0.35 * k);
      path(ctx, rrect(9, 0.9, 0.45, 4).map(([u, h]) => cam.P(Fp(u + 4, 2.2 + h)))); ctx.fillStyle = rgba(C.c500, 0.9 * k); ctx.fill();
      glow(ctx, cam.P(Fp(4, 2.2)), cam.S(Fp(4, 2.2)) * 5, C.c500, 0.22 * k);
      // a linha de contagem no piso, tracejada e fraca
      if (o.linhaPiso !== 0) { const L0 = cam.P([-50, 0.1, 44]), L1 = cam.P([50, 0.1, 44]); ctx.setLineDash([14, 10]); ctx.strokeStyle = rgba(C.c400, 0.16 * k); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(L0[0], L0[1]); ctx.lineTo(L1[0], L1[1]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore();
    }
    // as barras de empurrar das duas folhas (inox escovado), à frente do vidro
    function porta(ctx, cam) {
      for (const [u0, u1] of [[-46, -9], [9, 46]]) {
        const Fq = Fr({ x: 0, y: 0, z: 0 });
        caixa3d(ctx, cam, Fq, { u: [u0, u1], h: [100, 103.4], v: [VZ - 9.5, VZ - 7.8], alb: [86, 92, 102], aresta: 0.4, esc: 0.7 });
        for (const u of [u0 + 2, u1 - 2]) caixa3d(ctx, cam, Fq, { u: [u - 0.9, u + 0.9], h: [100.6, 102.8], v: [VZ - 7.8, VZ - 4.5], alb: [70, 76, 86] });
      }
    }
    return { objeto, sombras: [], desenhar, emissao, porta, leds: [{ pos: F.P(0, -3, -2), k: 0.5, alcance: 30, eixo: [0, -1, 0], cone: [0.2, 0.7] }] };
  }
  function monta(it) {
    if (it.celular) return montaCelular(it);
    if (it.notebook) return montaNotebook(it);
    if (it.tablet) return montaTablet(it);
    if (it.totem) return montaTotem(it);
    if (it.placar) return montaPlacar(it);
    return montaSensor(it);
  }

  // ---------------- sombras (do abajur, mole da janela e de contato; Fleet) ----------------
  function sombras(ctx, cam, o, sets) {
    if (!sets.length || !ABAJUR) return;
    const { W, H } = cam, P = cam.P, L = ABAJUR.pos;
    const sh = layer(W, H), s = sh.getContext('2d'); s.fillStyle = 'rgb(0,0,0)';
    const sPt = p => { const t = L[1] / (L[1] - p[1]); return [L[0] + (p[0] - L[0]) * t, 0, L[2] + (p[2] - L[2]) * t]; };
    const k = cam.S([0, 0, 30]);
    s.filter = `blur(${Math.round(k * 0.9)}px)`; s.globalAlpha = 0.5;
    for (const pts of sets) { path(s, hull(pts.map(p => p[1] > 0.05 ? sPt(p) : p).map(P))); s.fill(); }
    s.filter = `blur(${Math.round(k * 1.8)}px)`; s.globalAlpha = 0.28;
    for (const pts of sets) { path(s, hull(pts.map(p => [p[0], 0, p[2] - p[1] * 0.55]).map(P))); s.fill(); }
    s.filter = `blur(${Math.max(1, Math.round(k * 0.5))}px)`; s.globalAlpha = 0.6;
    for (const pts of sets) { const f = pts.map(p => [p[0], 0, p[2]]); path(s, hull(f.filter((p, i) => pts[i][1] < 3).map(P))); s.fill(); }
    s.filter = 'none';
    ctx.save(); ctx.globalAlpha = 0.85; ctx.drawImage(sh, 0, 0); ctx.restore();
  }
  // a tela acesa clareia a mesa à frente do aparelho (Rota)
  function brilhoMesa(ctx, cam, o, b, amb) {
    if (!b) return; const a = 0.1 * (b.k || 1) * o.telaBrilho; const cor = b.cor || C.e400;
    ctx.save(); path(ctx, poligonoSup(cam, amb)); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    discT(ctx, cam, b.c, [b.rx, 0, 0], [0, 0, b.rz]);
    ctx.fillStyle = radial(ctx, [[0, rgba(cor, a)], [0.5, rgba(cor, a * 0.33)], [1, rgba(cor, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ID(ctx);
    ctx.restore();
  }

  // ---------------- a caneca do hero (Fleet) ----------------
  function caneca(ctx, cam, m) {
    const P = cam.P, N = 72;
    const ring = (h, r) => { const a = []; for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; a.push(P([m.x + r * Math.cos(t), h, m.z + r * Math.sin(t)])); } return a; };
    const alb = [34, 50, 72];
    const hAng = m.alca * RAD, hd = [Math.cos(hAng), 0, Math.sin(hAng)];
    const hc = [m.x + hd[0] * (m.r + 1.3), m.h * 0.56, m.z + hd[2] * (m.r + 1.3)];
    const handle = () => {
      const pts = []; for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + i / 24 * Math.PI; pts.push(P([hc[0] + hd[0] * Math.cos(a) * 1.9 - hd[0] * 0.6, hc[1] + Math.sin(a) * 2.8, hc[2] + hd[2] * Math.cos(a) * 1.9 - hd[2] * 0.6])); }
      ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = rgba(luz(alb, hc, hd, { lk: 0.6 })); ctx.lineWidth = cam.S(hc) * 0.95; ctx.stroke();
      ctx.strokeStyle = rgba(C.n400, 0.16); ctx.lineWidth = cam.S(hc) * 0.22; ctx.stroke();
    };
    const handleFront = dot(hd, sub(cam.pos, [m.x, 0, m.z])) > 0;
    if (!handleFront) handle();
    const sil = hull(ring(0, m.r * 0.96).concat(ring(m.h, m.r)));
    const pl = P([m.x - m.r, m.h / 2, m.z]), pr = P([m.x + m.r, m.h / 2, m.z]);
    const sideCol = ang => { const n = [Math.cos(ang), 0, Math.sin(ang)]; return luz(alb, [m.x + n[0] * m.r, m.h * 0.6, m.z + n[2] * m.r], n); };
    const stops = []; for (let i = 0; i <= 8; i++) { const k = i / 8; let c = sideCol(Math.PI + k * Math.PI); if (k < 0.08 || k > 0.92) c = mix(c, C.n800, 0.35); stops.push([k, rgba(c)]); }
    path(ctx, sil); ctx.fillStyle = lin(ctx, pl, pr, stops); ctx.fill();
    const pt = P([m.x, m.h, m.z - m.r]), pbm = P([m.x, 0, m.z - m.r]);
    path(ctx, sil); ctx.fillStyle = lin(ctx, pt, pbm, [[0, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(4,8,13,0.5)']]); ctx.fill();
    path(ctx, ring(m.h, m.r)); ctx.fillStyle = rgba(luz(mix(alb, [120, 130, 142], 0.4), [m.x, m.h, m.z], [0, 1, 0], { amb: 1.1 })); ctx.fill();
    const inner = ring(m.h, m.r * 0.9); path(ctx, inner); ctx.fillStyle = rgba(luz([70, 84, 100], [m.x, m.h, m.z + m.r], [0, 0, -1], { amb: 0.6 })); ctx.fill();
    ctx.save(); path(ctx, inner); ctx.clip(); path(ctx, ring(m.h - 1.3, m.r * 0.9)); ctx.fillStyle = rgba([16, 14, 14]); ctx.fill(); ctx.restore();
    if (handleFront) handle();
  }
  function pontosCaneca(m) { const r = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; for (const h of [0, m.h]) r.push([m.x + m.r * Math.cos(a), h, m.z + m.r * Math.sin(a)]); } return r; }

  // ---------------- render ----------------
  function opcoes(slug, extra) {
    const it = ITENS[slug]; if (!it) throw new Error('slug desconhecido: ' + slug + ' (use um de: ' + SLUGS.join(', ') + ')');
    const o = Object.assign({}, BASE, it.cam, extra || {});
    if (typeof o.grainBaixo === 'string') o.grainBaixo = o.grainBaixo.split(',').map(Number);
    if (it.caneca && (extra || {}).caneca == null) o.caneca = 1;
    return { it, o, amb: it.amb || MESA };
  }
  function render(canvas, extra) {
    const slug = (extra && extra.slug) || SLUG_PADRAO;
    const { it, o, amb } = opcoes(slug, extra);
    const g = monta(it);
    prepLuz(it, o, g); const cam = makeCam(o); const ctx = canvas.getContext('2d');
    if (o.so === 'tela') { const u = it.celular ? it.celular.ui : it.totem ? 'totem' : it.notebook ? 'clinica' : 'loja'; const [w, h, f] = UIS[u]; const T = tex(w, h, 1, f); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cam.W, cam.H); ctx.drawImage(T, 0, 0, cam.W, cam.W * T.height / T.width); return { cam }; }
    // 1. a cidade e, por cima, a superfície e a parede com os vãos
    const city = cidade(cam, o);
    ctx.drawImage(city, 0, 0);
    if (o.so === 'cidade') return { cam };
    ctx.drawImage(basePass(cam, o, amb), 0, 0);
    if (amb.porta) vidro(ctx, cam, amb);
    vaos(ctx, cam, amb);
    reflexoCidade(ctx, cam, city, o, amb);
    // 2. sombras, o brilho da tela na mesa, e o objeto (com a caneca, onde houver)
    const sets = g.sombras.slice(); if (o.caneca && it.caneca) sets.push(pontosCaneca(it.caneca));
    sombras(ctx, cam, o, sets);
    brilhoMesa(ctx, cam, o, g.brilhoMesa, amb);
    if (g.porta) g.porta(ctx, cam);
    // a caneca atrás do objeto (mais longe que o centro dele) vem antes, para o objeto cobri-la
    const zObj = g.objeto.reduce((t, p) => t + p[2], 0) / g.objeto.length, canecaAtras = o.caneca && it.caneca && it.caneca.z > zObj;
    if (canecaAtras) caneca(ctx, cam, it.caneca);
    const info = g.desenhar(ctx, cam, o);
    if (o.caneca && it.caneca && !canecaAtras) caneca(ctx, cam, it.caneca);
    if (g.emissao) g.emissao(ctx, cam, o, info);
    // 3. acabamento do hero (kit)
    K.acabamento(ctx, cam, o);
    return { cam };
  }
  const SLUG_PADRAO = (typeof process !== 'undefined' && process.env && process.env.SLUG) || 'placar-conectado';
  // para as sondas (Node): a câmera e os pontos do objeto principal do slug em SLUG
  const CAM = (() => { const { o } = opcoes(SLUG_PADRAO); return o; })();
  function objeto(slug) { return monta(ITENS[slug || SLUG_PADRAO]).objeto; }
  function referencias() { return { horizonte: [CAM.pos[0], CAM.pos[1], 1e6] }; }
  G.CENA = { nome: 'inventados', SLUGS, ITENS, render, CAM, objeto, referencias, tipo: s => ITENS[s].tipo };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.CENA;
