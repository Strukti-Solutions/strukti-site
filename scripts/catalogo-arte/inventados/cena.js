/* Cena-modelo dos 7 itens inventados do catálogo (spec 2026-10-16 §6.2, plano da arte, Task A4).
   Uma cena só, parametrizada por slug: o mesmo ambiente do "Fim de expediente" e das cenas dos reais (a mesa de
   laminado do hero sob a janela com montantes, a cidade de hora azul desfocada lá fora, o abajur fora do quadro, a
   luz do kit) e, em cada slug, a silhueta do objeto do item:
     placar-conectado   placar suspenso diante da janela, com as luzes de ponto (pips) em ciano
     totem-check-in     totem de balcão com a tela de check-in e o leitor com o anel ciano
     contador-de-fluxo  o sensor sobre a porta de vidro, com o leque de detecção em ciano
     agenda-de-quadras  celular no suporte de mesa com a grade de horários (elétrico)
     estoque-oficinas   celular encostado num gaveteiro de peças, com a lista de estoque (elétrico)
     site-clinicas      notebook com o navegador do site de clínica (página em tema escuro)
     vitrine-lojas      tablet no suporte com o navegador da vitrine e uma sacola desfocada (página em tema escuro)
   Acento: hardware ciano, aplicativo elétrico. Os sites não têm cor própria: a spec (§6.2) fixa a paleta da marca
   (navy, com elétrico e ciano só nos detalhes) e a MASTER veta o roxo, então o violeta do plano saiu na rodada 1 de
   ajuste; as páginas usam no máximo um elemento elétrico e um ciano. Nada de texto: as telas são blocos e barras.
   Unidades: cm. x à direita, y para cima, z para longe (para a janela). O plano y = 0 é o tampo da mesa (ou o piso,
   na cena da porta); a parede fica em z = 64 e o vidro em z = 71, como no hero e no Fleet.
   Copiado e adaptado do Fleet (scripts/catalogo-arte/fleet-analytics-bi/cena.js): a cidade (buildCity/cityLayer do
   hero), o passe da mesa e da parede, o reflexo da cidade, o mapeamento da tela em faixas e a caneca.
   No navegador: window.CENA (cartao.html?slug=...). No Node (sondas): SLUG=<slug> escolhe o item. */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && typeof require !== 'undefined') ? require('../kit/cena.js') : G.KIT;
  const { C, hx, rgba, mix, clamp, sstep, sub, add, mul, dot, norm, len, rng, LUZ, luz, pontoI, LMP, makeCam, rrect, path, hull, discT, ID, radial, lin, layer, glow, SKY, skyCol } = K;
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
      // rodada de série (A6): a parede sobe até 58 cm (o vidro começava no tampo e o bokeh da cidade ia até o pé do
      // quadro, atrás do texto do cartão); a metade de baixo fica na parede lisa
      amb: Object.assign({}, MESA, { aberturas: [[-170, 170, 58, 230]], barras: [[-78, -75, 58, 300], [75, 78, 58, 300]] }),
      cam: { pos: [-30, 104, -135], target: [0, 114, 40], F: 960, shiftY: -150, towers: [[-40, -14, 32, 1], [-14, -8, 9, 0], [9, 14, 10, 0], [14, 40, 30, 1]], centre: [-8, 9, -2] },
      abajur: { pos: [-90, 110, 0], alvo: [-5, 0, 34], k: 0.8 },
      placar: { x: 0, y: 100, z: 32, w: 100, h: 46, d: 11, rot: 10 } },
    // rodada 1 de ajuste: o totem é de chão (a coluna com ~2x a altura da tela), de pé diante do vidro que desce
    // até o piso; o pé do vidro cai em ~56% do quadro
    'totem-check-in': { tipo: 'hardware',
      amb: { sup: { alb: [44, 45, 49], veio: false, piso: true, z0: -400, x0: -400, x1: 400 }, peitoril: true,
        aberturas: [[-200, 200, 0.4, 330]], barras: [[-96, -93, 0.4, 400], [74, 77, 0.4, 400]], travessas: [], trilho: 1.3 },
      cam: { pos: [-10, 112, -190], target: [0, 112, 64], F: 860, shiftY: -325 },
      abajur: { pos: [-120, 175, 10], alvo: [-4, 0, 40], k: 1.15, alcance: 190, piso: true, cone: [0.8, 0.97] },
      totem: { x: 2, z: 46, rot: -10 } },
    'contador-de-fluxo': { tipo: 'hardware',
      amb: { sup: { alb: [40, 42, 47], veio: false, piso: true, z0: -400, x0: -400, x1: 400 }, peitoril: false,
        aberturas: [[-58, 58, 0, 218]], barras: [[-58, -52, 0, 218], [52, 58, 0, 218], [-4.6, -0.5, 0, 210], [0.5, 4.6, 0, 210]], travessas: [[-58, 58, 210, 218], [-52, 52, 0, 16]], trilho: 0, porta: true, paredeAmb: 1.0,
        // rodada de série (A6): parede no navy (era cinza-ardósia) e um friso frio nos montantes, para a porta ler a 64 px
        paredeAlb: [24, 36, 56], friso: 0.3 },
      // rodada 1 de ajuste: câmera mais perto e mais baixa (o sensor com ~2,2x a largura), e a porta some num degradê
      // para o navy-950 a partir de ~49% (puxadores e quadro antes de 60%); a cidade aparece no vidro de cima
      cam: { pos: [-6, 196, -84], target: [0, 196, 64], F: 1250, shiftY: -40, towers: [[-40, -3, 30, 1], [-3, 2, 7, 0], [9, 14, 9, 0], [14, 40, 26, 1]], centre: [2, 9, -1], refl: 0.06, vigR: [0.24, 0.78], leque: 0.45, linhaPiso: 0, cityGain: 1.5, bokehP: 0.05 },
      escurecer: [0.49, 0.62, 0.97],
      teto: { pos: [0, 300, 30], alvo: [0, 200, 64], k: 0.42, cone: [0.45, 0.97] },
      sensor: { x: 0, y: 223, z: 58.5, w: 34, h: 8, d: 10 } },
    'agenda-de-quadras': { tipo: 'aplicativo',
      amb: Object.assign({}, MESA, { barras: [[-38, -35, 1.7, 300], [27, 30, 1.7, 300]] }),
      cam: { pos: [-3, 15, -30], target: [0, 9.5, 20], F: 1150, shiftY: -150, telaLuz: 1.0 },
      abajur: { pos: [-60, 70, 0], alvo: [-2, 0, 22], k: 0.75 },
      celular: { x: 0.5, z: 19, rot: -9, tilt: 14, ui: 'agenda', brilhoK: 0.6 } },   // rodada de série (A6): menos tela na mesa
    'estoque-oficinas': { tipo: 'aplicativo',
      amb: Object.assign({}, MESA, { barras: [[-36, -33, 1.7, 300], [30, 33, 1.7, 300]] }),
      cam: { pos: [-6, 17, -30], target: [1, 9, 22], F: 1100, shiftY: -150 },
      abajur: { pos: [-62, 72, 2], alvo: [-2, 0, 22], k: 1 },
      // rodada de série (A6): o celular girado ~12° a mais, para não repetir o de frente da agenda e do Rota
      celular: { x: -3.6, z: 12.4, rot: -19, tilt: 19, ui: 'estoque' },
      gaveteiro: { x: 2.2, z: 24, rot: 8, w: 15.5, h: 17, d: 13 } },
    'site-clinicas': { tipo: 'site',
      cam: { pos: [-8, 36, -52], target: [0, 15, 30], F: 1100, shiftY: -150 },
      abajur: { pos: [-80, 92, 2], alvo: [-8, 0, 28], k: 1 },
      notebook: { x: 2, z: 28, rot: -14, abre: 20 }, caneca: { x: 26, z: 46, r: 4.1, h: 9.2, alca: 20 } },
    'vitrine-lojas': { tipo: 'site',
      cam: { pos: [-4, 30, -44], target: [2, 12, 28], F: 1100, shiftY: -150 },
      abajur: { pos: [-80, 90, 2], alvo: [-6, 0, 26], k: 1 },
      tablet: { x: -2, z: 26, rot: 12, tilt: 17 }, sacola: { x: 17, z: 44, rot: -16, k: 0.75, blur: 3 } }
  };
  const SLUGS = Object.keys(ITENS);

  // ---------------- luzes ----------------
  let TELA = null, ABAJUR = null;
  function prepLuz(it, o, g) {
    LUZ.ceuDir = norm([0, 0.35, 1]);   // a luz da janela, como no hero
    const pontos = []; ABAJUR = null; TELA = null;
    if (it.abajur) {
      const A = it.abajur;
      ABAJUR = { pos: A.pos, cor: LMP, k: A.k * o.abajurK, alcance: A.alcance || 95, eixo: norm(sub(A.alvo, A.pos)), cone: A.cone || [0.86, 0.975], mascara: A.piso ? (p => p[1] > 0.5 ? 1 : sstep(-40, 30, p[2])) : (p => p[1] > 0.5 ? 1 : sstep(4, 22, p[2])) };
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
    const pos = cam.pos, sp = amb.sup, R = rng(7), wallA = amb.paredeAlb || [44, 50, 62];
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
      const e1 = P([a, h1, zf]), e2 = P([b, h1, zf]); ctx.strokeStyle = rgba(mix(C.n600, C.n300, 0.25 + (amb.friso || 0) * 0.5), 0.35 + (amb.friso || 0)); ctx.lineWidth = Math.max(1, cam.S([0, h1, zf]) * 0.25); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke();
    }
    // montantes (verticais): o lado que a câmera vê, a frente e um fio claro na aresta
    for (const [a, b, h0, h1] of amb.barras) {
      const side = cam.pos[0] < a ? a : b, sn = cam.pos[0] < a ? -1 : 1;
      if (!(cam.pos[0] > a && cam.pos[0] < b)) face([[side, h0, zf], [side, h0, VZ], [side, h1, VZ], [side, h1, zf]], luz(fA, [side, 40, 69], [sn, 0, 0], { wk: 0 }));
      face([[a, h0, zf], [b, h0, zf], [b, h1, zf], [a, h1, zf]], frameC);
      const ex = cam.pos[0] < a ? a : b, e1 = P([ex, h0, zf]), e2 = P([ex, Math.min(h1, 400), zf]);
      if (e1[2] > 0 && e2[2] > 0) { ctx.strokeStyle = rgba(mix(C.n600, C.n300, 0.25 + (amb.friso || 0) * 0.5), 0.4 + (amb.friso || 0)); ctx.lineWidth = Math.max(1, cam.S([a, 40, zf]) * 0.25); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); }
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
  // o polígono do tampo (ou do piso) na tela, recortado no plano de perto da câmera (rodada 1 de ajuste: com a câmera
  // girada, um canto ficava atrás dela e o polígono virava, cobrindo o vidro com uma cunha diagonal)
  function poligonoSup(cam, amb) {
    const sp = amb.sup, zq = Math.max(sp.z0, cam.pos[2] + 5), q = [[sp.x0, 0, zq], [sp.x1, 0, zq], [sp.x1, 0, PZ - 1], [sp.x0, 0, PZ - 1]];
    const dz = p => dot(sub(p, cam.pos), cam.f) - 2, out = [];
    for (let i = 0; i < q.length; i++) {
      const a = q[i], b = q[(i + 1) % q.length], da = dz(a), db = dz(b);
      if (da > 0) out.push(a);
      if ((da > 0) !== (db > 0)) out.push(add(a, mul(sub(b, a), da / (da - db))));
    }
    return out.map(cam.P);
  }
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
      [1, 0, 1, 'livre'], [1, 1, 1, 'res'], [1, 2, 2, 'res'], [1, 4, 1, 'sel'], [1, 5, 2, 'meu2'], [1, 7, 1, 'livre']];
    for (const [c, r0, n, st] of blocos) {
      const [x0, w] = cols[c], y0 = Y0 + r0 * RH + 5, h = n * RH - 10;
      if (st === 'res') { rr(x, x0, y0, w, h, 10, rgba(C.n700, 0.9)); rr(x, x0 + 12, y0 + 12, w * 0.5, 9, 4.5, rgba(C.n500, 0.8)); rr(x, x0 + 12, y0 + 28, w * 0.32, 7, 3.5, rgba(C.n600, 0.8)); }
      else if (st === 'livre') { x.beginPath(); x.roundRect(x0 + 1, y0 + 1, w - 2, h - 2, 10); x.setLineDash([6, 5]); x.strokeStyle = rgba(C.n600, 0.9); x.lineWidth = 1.6; x.stroke(); x.setLineDash([]); }
      else if (st === 'meu') { const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, rgba(C.e500, 0.95)); g.addColorStop(1, rgba(C.e700, 0.9)); rr(x, x0, y0, w, h, 10, g); rr(x, x0 + 12, y0 + 12, w * 0.55, 9, 4.5, rgba(C.n50, 0.9)); rr(x, x0 + 12, y0 + 28, w * 0.35, 7, 3.5, rgba(C.n100, 0.6)); }
      else if (st === 'meu2') { rr(x, x0 + 1, y0 + 1, w - 2, h - 2, 10, rgba(C.e500, 0.1)); x.strokeStyle = rgba(C.e400, 0.85); x.lineWidth = 2; x.stroke(); rr(x, x0 + 12, y0 + 12, w * 0.55, 9, 4.5, rgba(C.e300, 0.75)); rr(x, x0 + 12, y0 + 28, w * 0.35, 7, 3.5, rgba(C.n500, 0.8)); }
      else { rr(x, x0, y0, w, h, 10, rgba(C.c400, 0.14)); x.strokeStyle = rgba(C.c400, 0.95); x.lineWidth = 2.4; x.stroke(); circ(x, x0 + w - 20, y0 + h / 2, 9, rgba(C.c400)); linha(x, [[x0 + w - 24, y0 + h / 2], [x0 + w - 21, y0 + h / 2 + 3], [x0 + w - 15.5, y0 + h / 2 - 3]], rgba(C.n950), 2.2); rr(x, x0 + 12, y0 + h / 2 - 4, w * 0.45, 8, 4, rgba(C.c300, 0.8)); }
    }
    // o botão de reservar: navy-600 com o fio elétrico (rodada 1 de ajuste: menos elétrico cheio na tela)
    rr(x, 21, 713, 318, 44, 22, rgba(C.n600)); x.strokeStyle = rgba(C.e400, 0.9); x.lineWidth = 2; x.stroke(); rr(x, 140, 731, 80, 8, 4, rgba(C.n200, 0.85));
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
  // totem: o cartão da reserva (avatar, nome, a barra do horário e a quadra) e o botão de confirmar; sem ícone de
  // "sucesso" e sem ciano na tela (o anel do leitor é o único ciano do totem; rodada 1 de ajuste)
  function uiTotem(x, W, H) {
    const BG = fundoApp(), CARD = mix(BG, C.n700, 0.5);
    x.fillStyle = rgba(BG); x.fillRect(0, 0, W, H);
    rr(x, 26, 24, 32, 32, 9, rgba(C.n600)); rr(x, 70, 34, 110, 13, 6.5, rgba(C.n300, 0.8)); circ(x, 410, 40, 13, rgba(C.n700));
    // o cartão da reserva
    rr(x, 26, 84, W - 52, 262, 22, rgba(CARD));
    circ(x, 84, 142, 30, rgba(C.n600)); circ(x, 84, 133, 11, rgba(C.n400, 0.8)); x.beginPath(); x.arc(84, 162, 19, Math.PI * 1.12, Math.PI * 1.88); x.fillStyle = rgba(C.n400, 0.8); x.fill();
    rr(x, 130, 124, 170, 15, 7.5, rgba(C.n200, 0.85)); rr(x, 130, 150, 104, 10, 5, rgba(C.n600, 0.9));
    // a barra do horário: a faixa do dia com o bloco reservado no elétrico e as marcas das horas
    rr(x, 52, 206, 70, 9, 4.5, rgba(C.n500, 0.85));
    rr(x, 52, 228, W - 104, 28, 14, rgba(C.n800));
    rr(x, 168, 228, 118, 28, 14, rgba(C.e500));
    for (let i = 0; i <= 8; i++) rr(x, 56 + i * 41, 266, 3, i % 2 ? 6 : 10, 1.5, rgba(C.n600, 0.9));
    rr(x, 168, 288, 44, 9, 4.5, rgba(C.n400, 0.85)); rr(x, 242, 288, 44, 9, 4.5, rgba(C.n400, 0.85));
    // a quadra: um retângulo com a linha do meio e o rótulo
    x.strokeStyle = rgba(C.n500, 0.9); x.lineWidth = 2.4; x.strokeRect(52, 314, 34, 22); linha(x, [[69, 314], [69, 336]], rgba(C.n500, 0.9), 2.4);
    rr(x, 100, 320, 120, 10, 5, rgba(C.n500, 0.85));
    // o botão de confirmar (navy, com o fio claro) e os passos
    rr(x, 26, 374, W - 52, 58, 29, rgba(C.n700)); x.strokeStyle = rgba(C.n500, 0.9); x.lineWidth = 2; x.stroke(); rr(x, W / 2 - 60, 398, 120, 10, 5, rgba(C.n300, 0.85));
    for (let i = 0; i < 3; i++) circ(x, W / 2 - 22 + i * 22, 462, 5.5, rgba(i === 1 ? C.n400 : C.n700, 0.95));
  }
  // navegador (sites): a barra do navegador e a página em tema escuro, como as telas dos apps (rodada 1 de ajuste):
  // fundo navy, blocos navy-700, o claro só em duas linhas finas e, no máximo, um elemento elétrico e um ciano por tela
  function cromo(x, W, H, PG) {
    x.fillStyle = rgba(PG); x.fillRect(0, 0, W, H);
    rr(x, 0, 0, W, 58, 0, rgba(mix(C.n900, C.n950, 0.5)));
    for (let i = 0; i < 3; i++) circ(x, 28 + i * 22, 29, 7, rgba(C.n700, 0.95));
    x.beginPath(); x.roundRect(104, 12, 230, 46, [12, 12, 0, 0]); x.fillStyle = rgba(PG); x.fill(); rr(x, 124, 30, 120, 10, 5, rgba(C.n600, 0.9));
    rr(x, 360, 15, W - 520, 30, 15, rgba(C.n800, 0.9)); circ(x, 382, 30, 6, rgba(C.n600, 0.9)); rr(x, 398, 25, 180, 10, 5, rgba(C.n700, 0.95));
    for (let i = 0; i < 2; i++) circ(x, W - 100 + i * 34, 30, 9, rgba(C.n800));
  }
  const PAGINA = () => mix(C.n900, C.n800, 0.35);
  // mancha mole (a foto desfocada da loja, a sombra do alfinete): elipse cuja borda some
  function mancha(x, cx, cy, rx, ry, cor, a) {
    x.save(); x.translate(cx, cy); x.scale(rx, ry);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(cor, a)); g.addColorStop(0.55, rgba(cor, a * 0.6)); g.addColorStop(1, rgba(cor, 0));
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore();
  }
  // clínica: a lista das especialidades (linhas com marcador), o mapa com o alfinete e o endereço, e um botão só
  function uiClinica(x, W, H) {
    const PG = PAGINA(), BL = mix(PG, C.n700, 0.6), LN = C.n700, MAPA = mix(PG, C.n800, 0.6);
    cromo(x, W, H, PG);
    // menu: a marca (um quadro navy com a cruz vazada), o nome (a linha clara 1) e os itens
    rr(x, 44, 80, 32, 32, 8, rgba(C.n600)); rr(x, 57, 86, 6, 20, 1.5, rgba(PG)); rr(x, 50, 93, 20, 6, 1.5, rgba(PG));
    rr(x, 88, 90, 118, 12, 6, rgba(C.n200, 0.8));
    for (let i = 0; i < 4; i++) rr(x, 700 + i * 112, 91, 70, 10, 5, rgba(C.n600, 0.9));
    linha(x, [[44, 132], [W - 44, 132]], rgba(LN, 0.8), 1.5);
    // a coluna da esquerda: o título (a linha clara 2 e uma navy), o texto e as especialidades
    rr(x, 60, 170, 380, 22, 11, rgba(C.n100, 0.78));
    rr(x, 60, 206, 300, 22, 11, rgba(C.n500, 0.9));
    rr(x, 60, 248, 420, 10, 5, rgba(C.n600, 0.9)); rr(x, 60, 268, 360, 10, 5, rgba(C.n600, 0.9));
    const esp = [250, 190, 280, 220, 160];
    esp.forEach((w, i) => {
      const y = 318 + i * 62, at = i === 1;
      if (at) rr(x, 48, y - 6, 512, 54, 12, rgba(mix(PG, C.n700, 0.5)));
      circ(x, 76, y + 21, 7, rgba(at ? C.c400 : C.n600));   // o marcador; o da linha ativa é o único ciano da tela
      rr(x, 100, y + 10, w, 12, 6, rgba(at ? C.n300 : C.n500, 0.9)); rr(x, 100, y + 30, w * 0.55, 8, 4, rgba(C.n600, 0.85));
      linha(x, [[530, y + 14], [538, y + 21], [530, y + 28]], rgba(C.n600), 2.4);
      if (i < esp.length - 1 && i !== 0 && i !== 1) linha(x, [[100, y + 50], [548, y + 50]], rgba(LN, 0.7), 1.2);
    });
    // o único destaque: o botão de agendar, no elétrico (sem verde de mensageiro)
    rr(x, 60, 652, 250, 54, 27, rgba(C.e500)); rr(x, 110, 675, 150, 9, 4.5, rgba(C.n50, 0.85));
    rr(x, 334, 674, 150, 10, 5, rgba(C.n600, 0.9));
    // a coluna da direita: o mapa (quarteirões e uma avenida em diagonal) com o alfinete; o endereço e os horários embaixo
    { const x0 = 620, y0 = 168, w = 536, h = 380;
      x.save(); x.beginPath(); x.roundRect(x0, y0, w, h, 20); x.clip();
      x.fillStyle = rgba(MAPA); x.fillRect(x0, y0, w, h);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) rr(x, x0 + 14 + i * 92, y0 + 14 + j * 76, 78, 62, 6, rgba(BL, (i * 7 + j * 3) % 5 === 0 ? 0.5 : 0.85));
      linha(x, [[x0 - 20, y0 + h * 0.9], [x0 + w + 20, y0 + h * 0.18]], rgba(MAPA), 26);
      linha(x, [[x0 - 20, y0 + h * 0.9], [x0 + w + 20, y0 + h * 0.18]], rgba(C.n600, 0.5), 1.5);
      x.restore();
      const px = x0 + w * 0.6, py = y0 + h * 0.42;
      mancha(x, px, py + 28, 28, 8, C.n950, 0.7);
      x.beginPath(); x.arc(px, py - 8, 22, Math.PI * 0.8, Math.PI * 0.2); x.lineTo(px, py + 26); x.closePath(); x.fillStyle = rgba(C.n300, 0.85); x.fill();
      circ(x, px, py - 8, 8, rgba(MAPA));
      rr(x, x0, y0 + h + 24, w, 132, 20, rgba(BL));
      x.strokeStyle = rgba(C.n500); x.lineWidth = 2.4; x.beginPath(); x.arc(x0 + 46, y0 + h + 76, 14, 0, 7); x.stroke();
      linha(x, [[x0 + 46, y0 + h + 68], [x0 + 46, y0 + h + 76], [x0 + 53, y0 + h + 81]], rgba(C.n500), 2.4);
      rr(x, x0 + 80, y0 + h + 62, 240, 12, 6, rgba(C.n400, 0.9)); rr(x, x0 + 80, y0 + h + 84, 170, 9, 4.5, rgba(C.n600, 0.9));
      for (let i = 0; i < 3; i++) rr(x, x0 + 360 + i * 54, y0 + h + 62, 40, 30, 8, rgba(mix(PG, C.n700, 0.85)));
    }
  }
  // loja: um produto grande à esquerda e três menores empilhados, só com fotos desfocadas (sem ícone de produto)
  function uiLoja(x, W, H) {
    const PG = PAGINA(), BL = mix(PG, C.n700, 0.6), FOTO = mix(PG, C.n800, 0.5);
    cromo(x, W, H, PG);
    rr(x, 40, 80, 32, 32, 9, rgba(C.n600)); rr(x, 84, 90, 104, 12, 6, rgba(C.n200, 0.8));   // a marca e o nome (a linha clara 1)
    rr(x, 380, 76, 420, 38, 19, rgba(C.n800, 0.9)); x.beginPath(); x.arc(406, 95, 7, 0, 7); x.strokeStyle = rgba(C.n500); x.lineWidth = 2.4; x.stroke(); rr(x, 424, 91, 140, 8, 4, rgba(C.n700, 0.95));
    for (let i = 0; i < 3; i++) rr(x, 880 + i * 70, 91, 50, 9, 4.5, rgba(C.n600, 0.9));
    // o carrinho, com o selo: o único ciano da tela
    { const cx = 1130, cy = 96; x.strokeStyle = rgba(C.n400); x.lineWidth = 2.6; x.beginPath(); x.roundRect(cx - 13, cy - 7, 26, 21, 4); x.stroke(); x.beginPath(); x.arc(cx, cy - 7, 7, Math.PI, 0); x.stroke(); circ(x, cx + 14, cy - 12, 6.5, rgba(C.c400)); }
    // o produto grande: a foto desfocada, os pontos da galeria, o nome (a linha clara 2), o preço e o único botão elétrico
    { const x0 = 40, y0 = 140, w = 600, h = 660;
      rr(x, x0, y0, w, h, 22, rgba(BL));
      x.save(); x.beginPath(); x.roundRect(x0 + 16, y0 + 16, w - 32, 430, 16); x.clip();
      x.fillStyle = rgba(FOTO); x.fillRect(x0, y0, w, 470);
      // rodada de série (A6): as fotos eram quatro ovais iguais (ar de placeholder); agora são silhuetas diferentes,
      // desfocadas: uma bolsa aqui e, nos três menores, um frasco alto, uma caixa e uma peça dobrada
      mancha(x, x0 + w * 0.5, y0 + 240, 270, 220, C.n700, 0.9);
      mancha(x, x0 + w * 0.5, y0 + 384, 170, 26, C.n950, 0.7);
      x.save(); x.filter = 'blur(7px)';
      x.beginPath(); x.moveTo(x0 + 190, y0 + 210); x.lineTo(x0 + 410, y0 + 210); x.lineTo(x0 + 440, y0 + 380); x.lineTo(x0 + 160, y0 + 380); x.closePath(); x.fillStyle = rgba(C.n500, 0.9); x.fill();
      x.beginPath(); x.arc(x0 + 300, y0 + 214, 74, Math.PI, 0); x.strokeStyle = rgba(C.n500, 0.85); x.lineWidth = 16; x.stroke();
      x.beginPath(); x.moveTo(x0 + 200, y0 + 222); x.lineTo(x0 + 400, y0 + 222); x.lineTo(x0 + 412, y0 + 290); x.lineTo(x0 + 188, y0 + 290); x.closePath(); x.fillStyle = rgba(C.n400, 0.35); x.fill();
      x.restore();
      x.restore();
      for (let i = 0; i < 4; i++) circ(x, x0 + w / 2 - 33 + i * 22, y0 + 426, 4.5, rgba(i === 0 ? C.n400 : C.n600, 0.9));
      rr(x, x0 + 28, y0 + 478, 300, 16, 8, rgba(C.n100, 0.78)); rr(x, x0 + 28, y0 + 506, 200, 10, 5, rgba(C.n600, 0.9));
      rr(x, x0 + 28, y0 + 560, 120, 30, 8, rgba(C.n500, 0.8));
      rr(x, x0 + w - 248, y0 + 548, 220, 52, 26, rgba(C.e500)); rr(x, x0 + w - 188, y0 + 570, 100, 9, 4.5, rgba(C.n50, 0.85));
    }
    // os três menores: foto desfocada, nome, preço e o "+" em contorno navy
    for (let i = 0; i < 3; i++) {
      const x0 = 664, y0 = 140 + i * 224, w = 496, h = 204, tom = [C.n500, C.n600, C.n500][i];
      rr(x, x0, y0, w, h, 20, rgba(BL));
      x.save(); x.beginPath(); x.roundRect(x0 + 14, y0 + 14, 176, 176, 14); x.clip(); x.fillStyle = rgba(FOTO); x.fillRect(x0, y0, 200, h);
      mancha(x, x0 + 102, y0 + 160, 60, 12, C.n950, 0.55);
      x.filter = 'blur(5px)';
      if (i === 0) { rr(x, x0 + 80, y0 + 66, 44, 96, 12, rgba(tom, 0.9)); rr(x, x0 + 92, y0 + 42, 20, 28, 5, rgba(C.n400, 0.7)); }                 // frasco alto
      else if (i === 1) { rr(x, x0 + 52, y0 + 76, 100, 82, 6, rgba(tom, 0.95)); rr(x, x0 + 52, y0 + 76, 100, 18, 4, rgba(C.n400, 0.45)); }        // caixa
      else { x.beginPath(); x.moveTo(x0 + 40, y0 + 156); x.lineTo(x0 + 60, y0 + 112); x.quadraticCurveTo(x0 + 102, y0 + 92, x0 + 144, y0 + 112); x.lineTo(x0 + 164, y0 + 156); x.closePath(); x.fillStyle = rgba(tom, 0.9); x.fill(); }   // peça dobrada
      x.filter = 'none'; x.restore();
      rr(x, x0 + 214, y0 + 42, [190, 150, 210][i], 12, 6, rgba(C.n400, 0.9)); rr(x, x0 + 214, y0 + 66, 120, 9, 4.5, rgba(C.n600, 0.9));
      rr(x, x0 + 214, y0 + 132, 90, 22, 6, rgba(C.n500, 0.75));
      x.beginPath(); x.arc(x0 + w - 44, y0 + 143, 18, 0, 7); x.strokeStyle = rgba(C.n600); x.lineWidth = 2; x.stroke();
      linha(x, [[x0 + w - 51, y0 + 143], [x0 + w - 37, y0 + 143]], rgba(C.n500), 2.6); linha(x, [[x0 + w - 44, y0 + 136], [x0 + w - 44, y0 + 150]], rgba(C.n500), 2.6);
    }
  }
  const UIS = { agenda: [360, 773, uiAgenda], estoque: [360, 773, uiEstoque], totem: [440, 490, uiTotem], clinica: [1200, 760, uiClinica], loja: [1200, 820, uiLoja] };

  // ---------------- geometria de cada item ----------------
  // cada montagem devolve: objeto (pontos do objeto principal, para a sonda), sombras (conjuntos de pontos que
  // fazem sombra), tela (centro e normal da tela acesa, para a luz), leds e desenhar(ctx, cam, o).
  const CEL = { w: 7.3, h: 15.2, d: 0.85, r: 1.05 };
  function montaCelular(it) {
    const c = it.celular, base = it.gaveteiro ? null : { u: [-4.2, 4.2], h: [0, 0.55], v: [-4, 5.5] };
    const y = base ? 0.8 : 0.2, F = Fr({ x: c.x, y, z: c.z, rot: c.rot, tilt: c.tilt });
    const Fb = Fr({ x: c.x, y: 0, z: c.z + 0.5, rot: c.rot });
    const tela = { c: F.P(0, CEL.h / 2, -CEL.d / 2), n: F.R([0, 0, -1]) };
    const objeto = pontosLaje(F, CEL);
    const sombras = [pontosLaje(F, CEL)];
    if (base) sombras.push(pontosCaixa(Fb, base));
    let Fx = null, cx = null;
    if (it.gaveteiro) { const b = it.gaveteiro; Fx = Fr({ x: b.x, y: 0, z: b.z, rot: b.rot }); cx = { u: [-b.w / 2, b.w / 2], h: [0, b.h], v: [-b.d / 2, b.d / 2] }; sombras.push(pontosCaixa(Fx, cx)); }
    function desenhar(ctx, cam, o) {
      const plast = [30, 34, 42];
      if (cx) {   // o gaveteiro de peças (rodada 1 de ajuste, no lugar da caixa de papelão): corpo de metal navy e 3 x 2 gavetas de plástico escuro
        const b = it.gaveteiro, metal = [44, 50, 64];
        const fc = caixa3d(ctx, cam, Fx, Object.assign({ alb: metal, aresta: 0.3, esc: 0.8, k: { amb: 1.25 } }, cx));
        const vf = -b.d / 2 - 0.04, Pf = (u, h) => cam.P(Fx.P(u, h, vf)), n = Fx.R([0, 0, -1]);
        const quad = (u0, u1, h0, h1) => path(ctx, [Pf(u0, h0), Pf(u1, h0), Pf(u1, h1), Pf(u0, h1)]);
        const gw = (b.w - 1.6 - 0.5) / 2, gh = (b.h - 1.6 - 1.0) / 3;
        for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) {
          const u0 = -b.w / 2 + 0.8 + k * (gw + 0.5), h0 = 0.8 + r * (gh + 0.5), u1 = u0 + gw, h1 = h0 + gh;
          const ca = luz([26, 30, 38], Fx.P((u0 + u1) / 2, h1, vf), n, { amb: 1.2 }), cz = luz([26, 30, 38], Fx.P((u0 + u1) / 2, h0, vf), n, { amb: 1.2 });
          quad(u0, u1, h0, h1); ctx.fillStyle = lin(ctx, Pf(0, h1), Pf(0, h0), [[0, rgba(ca)], [1, rgba(mul(cz, 0.85))]]); ctx.fill();
          // o puxador (um lábio claro embaixo) e a etiqueta lisa
          quad(u0 + gw * 0.3, u1 - gw * 0.3, h0 + 0.35, h0 + 0.9); ctx.fillStyle = rgba(luz([70, 78, 92], Fx.P(u0, h0, vf), [0, 1, -0.4])); ctx.fill();
          quad(u0 + gw * 0.2, u1 - gw * 0.2, h1 - 1.9, h1 - 0.9); ctx.fillStyle = rgba(C.n500, 0.35); ctx.fill();
          { const a = Pf(u0, h1), z = Pf(u1, h1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(z[0], z[1]); ctx.strokeStyle = rgba(C.n300, 0.14); ctx.lineWidth = 1; ctx.stroke(); }
        }
        // rodada de série (A6): um contraluz frio nas arestas verticais e no topo, para o gaveteiro sair do escuro
        if (fc.frente) { const S = fc.frente.S; ctx.save(); ctx.lineCap = 'round';
          for (const [p0, p1] of [[S[0], S[3]], [S[1], S[2]]]) { ctx.strokeStyle = lin(ctx, p0, p1, [[0, rgba(mix(C.n300, C.e300, 0.3), 0.4)], [1, rgba(C.n300, 0.05)]]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
          ctx.restore(); }
        // a sombra do celular na frente do gaveteiro (do abajur) e a oclusão onde ele encosta
        if (ABAJUR && fc.frente) {
          const L = ABAJUR.pos, P0 = Fx.P(0, 0, -b.d / 2), proj = q => { const t = dot(n, sub(P0, L)) / dot(n, sub(q, L)); return add(L, mul(sub(q, L), t)); };
          const sl = layer(cam.W, cam.H), sx = sl.getContext('2d');
          sx.filter = `blur(${Math.max(1, Math.round(cam.S(P0) * 0.5))}px)`; sx.fillStyle = 'rgb(0,0,0)';
          path(sx, hull(pontosLaje(F, CEL).map(proj).map(cam.P))); sx.fill(); sx.filter = 'none';
          sx.globalCompositeOperation = 'destination-in'; path(sx, fc.frente.S); sx.fill();
          ctx.save(); ctx.globalAlpha = 0.55; ctx.drawImage(sl, 0, 0); ctx.restore();
        }
      }
      if (base) {   // o suporte de mesa: a chapa de base, a chapa de trás (inclinada) e o lábio da frente
        caixa3d(ctx, cam, Fb, Object.assign({ alb: plast, aresta: 0.12 }, { u: base.u, h: [0, 0.32], v: base.v }));
        // o chanfro: uma chapa um pouco menor por cima, mais clara (pega a luz), com o fio de luz na aresta da frente
        caixa3d(ctx, cam, Fb, { u: [base.u[0] + 0.3, base.u[1] - 0.3], h: [0.32, base.h[1]], v: [base.v[0] + 0.3, base.v[1] - 0.3], alb: mix(plast, [70, 78, 92], 0.35), aresta: 0.45, esc: 0.9 });
        caixa3d(ctx, cam, F, { u: [-2.6, 2.6], h: [-1.0, 11], v: [CEL.d / 2, CEL.d / 2 + 0.45], alb: plast });
      }
      // a sombra de contato do celular (ou do suporte) no tampo: escura, curta e mole
      contato(ctx, cam, base ? pontosCaixa(Fb, { u: [base.u[0] - 0.3, base.u[1] + 0.3], h: [0, 0], v: [base.v[0] - 0.2, base.v[1] + 0.3] }) : [[-CEL.w / 2, 0, -CEL.d / 2], [CEL.w / 2, 0, -CEL.d / 2], [CEL.w / 2, 0, CEL.d / 2 + 0.6], [-CEL.w / 2, 0, CEL.d / 2 + 0.6]].map(([u, h, v]) => F.P(u, h, v)).map(p => [p[0], 0, p[2]]), 0.62);
      laje(ctx, cam, F, CEL);
      const [w, h, f] = UIS[c.ui]; const T = tex(w, h, 0.62, f);
      telaNoPlano(ctx, cam, F, [-CEL.w / 2 + 0.28, CEL.w / 2 - 0.28, 0.3, CEL.h - 0.3], -CEL.d / 2 - 0.005, T, 0.75);
      if (base) caixa3d(ctx, cam, F, { u: [-3.0, 3.0], h: [-0.3, 0.35], v: [-CEL.d / 2 - 0.5, -CEL.d / 2 - 0.05], alb: plast, aresta: 0.22 });
    }
    return { objeto, sombras, tela: Object.assign(tela, { alcance: 16, k: 1 }), desenhar, brilhoMesa: { c: [c.x, 0.02, c.z - 3], rx: 16, rz: 7, k: c.brilhoK || 1 } };
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
      // a tela de noite: um véu leve por cima da página escura
      ctx.save(); path(ctx, so); ctx.fillStyle = rgba(C.n950, Math.max(0, 1 - o.telaBrilho * 0.96)); ctx.fill(); ctx.restore();
      // a webcam
      { const q = cam.P(Fl.P(0, 20.6, -tampa.d / 2 - 0.01)); circ(ctx, q[0], q[1], 1.4, rgba(C.black)); }
    }
    return { objeto, sombras: [objeto], tela, desenhar, brilhoMesa: { c: [nb.x, 0.02, nb.z - 12], rx: 28, rz: 10, cor: C.n300, k: 0.18 } };
  }
  function montaTablet(it) {
    const tb = it.tablet, TB = { w: 24.6, h: 17.6, d: 0.7, r: 1.0 };
    const F = Fr({ x: tb.x, y: 1.3, z: tb.z, rot: tb.rot, tilt: tb.tilt }), Fb = Fr({ x: tb.x, y: 0, z: tb.z + 1.5, rot: tb.rot });
    const base = { u: [-7, 7], h: [0, 1.1], v: [-4.5, 5] };
    const sc = it.sacola, k = sc.k || 1, Fs = Fr({ x: sc.x, y: 0, z: sc.z, rot: sc.rot }), sac = { u: [-8.5 * k, 8.5 * k], h: [0, 19 * k], v: [-5 * k, 5 * k] };
    const objeto = pontosLaje(F, TB).concat(pontosCaixa(Fb, base));
    const tela = { c: F.P(0, TB.h / 2, -TB.d / 2), n: F.R([0, 0, -1]), alcance: 22, k: 0.5, cor: [0.4, 0.5, 0.75] };
    function desenhar(ctx, cam, o) {
      const plast = [30, 34, 42];
      // a sacola de papel (navy escuro) com as alças de cordão: menor, atrás e fora de foco (rodada 1 de ajuste)
      { const sl = layer(cam.W, cam.H), sx = sl.getContext('2d');
        caixa3d(sx, cam, Fs, Object.assign({ alb: [40, 45, 58], aresta: 0.1, esc: 0.75 }, sac));
        const fz = -5.05 * k; caixa3d(sx, cam, Fs, { u: [-8.5 * k, 8.5 * k], h: [16.8 * k, 19 * k], v: [fz - 0.05, fz + 0.05], alb: [46, 51, 64], esc: 0.95 });
        for (const vv of [-4.6 * k, 4.6 * k]) { const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 16; pts.push(cam.P(Fs.P(-3.2 * k * Math.cos(a), 19 * k + 7 * k * Math.sin(a), vv))); }
          sx.beginPath(); pts.forEach((p, i) => i ? sx.lineTo(p[0], p[1]) : sx.moveTo(p[0], p[1])); sx.strokeStyle = rgba(mix(luz([32, 36, 46], Fs.P(0, 24 * k, vv), [0, 1, -0.5]), C.n300, 0.35), 1); /* rodada de série (A6): contraluz na alça */ sx.lineWidth = Math.max(1.2, cam.S(Fs.P(0, 22 * k, vv)) * 0.35); sx.lineCap = 'round'; sx.stroke(); }
        ctx.save(); ctx.filter = `blur(${sc.blur || 0}px)`; ctx.drawImage(sl, 0, 0); ctx.restore(); }
      caixa3d(ctx, cam, Fb, Object.assign({ alb: plast, aresta: 0.2 }, base));
      caixa3d(ctx, cam, F, { u: [-4, 4], h: [-0.6, 10], v: [TB.d / 2, TB.d / 2 + 0.5], alb: plast });
      laje(ctx, cam, F, Object.assign({ alb: [52, 57, 68], aro: 0.35 }, TB));
      const [w, h, f] = UIS.loja; const T = tex(w, h, 0.5, f);
      const so = telaNoPlano(ctx, cam, F, [-TB.w / 2 + 1.0, TB.w / 2 - 1.0, 1.0, TB.h - 1.0], -TB.d / 2 - 0.005, T, 0.3);
      ctx.save(); path(ctx, so); ctx.fillStyle = rgba(C.n950, Math.max(0, 1 - o.telaBrilho * 0.96)); ctx.fill(); ctx.restore();
      caixa3d(ctx, cam, F, { u: [-8.5, 8.5], h: [-0.5, 0.8], v: [-TB.d / 2 - 0.7, -TB.d / 2 - 0.05], alb: plast, aresta: 0.25 });
    }
    return { objeto, sombras: [pontosLaje(F, TB), pontosCaixa(Fb, base), pontosCaixa(Fs, sac)], tela, desenhar, brilhoMesa: { c: [tb.x, 0.02, tb.z - 6], rx: 22, rz: 8, cor: C.n300, k: 0.18 } };
  }
  function montaTotem(it) {
    const t = it.totem, Fb = Fr({ x: t.x, y: 0, z: t.z, rot: t.rot });
    // rodada de série (A6): a cabeça ~19% maior (tela de ~21" em vez de ~15") e a coluna mais larga: a 64 px o totem
    // era o objeto de menor massa da série e lia como "algo num poste"; E escala as medidas da cabeça
    const E = 1.19;
    const base = { u: [-18, 18], h: [0, 2.2], v: [-12, 12] }, col = { u: [-6, 6], h: [2.2, 86], v: [0.5, 7] };
    const topo = Fb.P(0, 82, 3.8), Fh = Fr({ x: topo[0], y: topo[1], z: topo[2], rot: t.rot, tilt: 13 });
    const cab = { w: 32 * E, h: 46 * E, d: 4, r: 2 * E };
    const objeto = pontosLaje(Fh, cab).concat(pontosCaixa(Fb, base));
    const tela = { c: Fh.P(0, 28 * E, -cab.d / 2), n: Fh.R([0, 0, -1]), alcance: 34 * E, k: 1.0 };
    const leitor = Fh.P(0, 6.8 * E, -cab.d / 2 - 0.05);
    function desenhar(ctx, cam, o) {
      const corpo = [46, 52, 64];
      caixa3d(ctx, cam, Fb, Object.assign({ alb: corpo, aresta: 0.2, esc: 0.75 }, base));
      const fc = caixa3d(ctx, cam, Fb, Object.assign({ alb: corpo, esc: 0.6 }, col));
      // a luz da tela desce pela frente da coluna (um filete frio que some até o meio dela), para a silhueta sair do vidro
      if (fc.frente) { const S = fc.frente.S, a = cam.P(Fb.P(0, col.h[1], col.v[0])), z = cam.P(Fb.P(0, col.h[1] * 0.45, col.v[0]));
        ctx.save(); path(ctx, S); ctx.clip(); ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = lin(ctx, a, z, [[0, rgba(C.e400, 0.16 * o.telaBrilho)], [1, rgba(C.e400, 0)]]); ctx.fillRect(0, 0, cam.W, cam.H);
        for (const k of [0, 1]) { const p0 = S[k], p1 = S[3 - k]; ctx.strokeStyle = lin(ctx, p0, p1, [[0, rgba(C.n300, 0.35)], [0.6, rgba(C.n300, 0)]]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
        ctx.restore(); }
      const L = laje(ctx, cam, Fh, Object.assign({ alb: corpo, frente: [16, 21, 29], aro: 0.32, aroW: 0.04 }, cab));
      const [w, h, f] = UIS.totem; const T = tex(w, h, 0.62, f);
      telaNoPlano(ctx, cam, Fh, [-13.8 * E, 13.8 * E, 13.4 * E, 44.0 * E], -cab.d / 2 - 0.01, T, 0.6 * E);
      // o leitor: aro escuro, a placa e o anel de LED ciano (o detalhe da Strukti), e o hexágono da marca
      const ua = Fh.R([1, 0, 0]), ha = Fh.R([0, 1, 0]), Fp = (u, h) => Fh.P(u, h, -cab.d / 2 - 0.03);
      const disc = (u, h, r, fill) => { discT(ctx, cam, Fp(u, h), mul(ua, r), mul(ha, r)); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = fill; ctx.fill(); ID(ctx); };
      disc(0, 6.8 * E, 4.6 * E, rgba([8, 12, 18]));
      disc(0, 6.8 * E, 3.7 * E, rgba(mix(C.c600, C.n900, 0.55)));
      disc(0, 6.8 * E, 3.0 * E, rgba([12, 17, 25]));
      { discT(ctx, cam, Fp(-12 * E, 2.6 * E), ua, ha); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 90) * RAD; const x = Math.cos(a) * 0.75, y = Math.sin(a) * 0.75; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(C.n300, 0.45); ctx.fill(); ID(ctx); }
      return { ua, ha, Fp };
    }
    function emissao(ctx, cam, o, info) {
      const k = o.ledK; if (!(k > 0)) return;
      const { ua, ha, Fp } = info;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      discT(ctx, cam, Fp(0, 6.8 * E), mul(ua, E), mul(ha, E)); ctx.beginPath(); ctx.arc(0, 0, 3.7, 0, 7); ctx.arc(0, 0, 3.05, 0, 7, true); ctx.fillStyle = rgba(C.c500, 0.9 * k); ctx.fill(); ID(ctx);
      glow(ctx, cam.P(Fp(0, 6.8 * E)), cam.S(Fp(0, 6.8 * E)) * 6 * E, C.c500, 0.2 * k);
      glow(ctx, cam.P(Fp(0, 6.8 * E)), cam.S(Fp(0, 6.8 * E)) * 14 * E, C.c400, 0.05 * k);
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
      // rodada 1 de ajuste: um brilho fraco por trás (a luz dos painéis na parede de vidro), a moldura de alumínio com
      // o fio de luz no topo e o reflexo ciano fraco na borda de baixo
      { const c = cam.P(F.P(0, p.h / 2, p.d / 2)); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(c[0], c[1]); ctx.scale(1, 0.55);
        glow(ctx, [0, 0], cam.S(F.P(0, p.h / 2, 0)) * p.w * 0.62, C.c600, 0.05 * o.ledK); ctx.restore(); }
      caixa3d(ctx, cam, F, Object.assign({ alb: [40, 46, 58], aresta: 0.6, esc: 0.62, albF: { frente: [74, 82, 96] } }, cx));
      const Fp = (u, h) => F.P(u, h, -p.d / 2 - 0.05), ua = F.R([1, 0, 0]), ha = [0, 1, 0];
      const quad = (u0, u1, h0, h1, fill) => { path(ctx, [[u0, h0], [u1, h0], [u1, h1], [u0, h1]].map(([u, h]) => cam.P(Fp(u, h)))); ctx.fillStyle = fill; ctx.fill(); };
      quad(-p.w / 2 + 1.5, p.w / 2 - 1.5, 1.5, p.h - 1.5, rgba([15, 19, 26]));
      { const a = cam.P(Fp(-p.w / 2 + 1.5, 1.5)), b = cam.P(Fp(p.w / 2 - 1.5, 1.5)); ctx.strokeStyle = lin(ctx, a, b, [[0, rgba(C.c400, 0.04)], [0.35, rgba(C.c400, 0.22)], [0.7, rgba(C.c400, 0.12)], [1, rgba(C.c400, 0.03)]]); ctx.lineWidth = Math.max(1, cam.S(Fp(0, 1.5)) * 0.35); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      { const a = cam.P(Fp(-p.w / 2 + 0.3, p.h - 0.25)), b = cam.P(Fp(p.w / 2 - 0.3, p.h - 0.25)); ctx.strokeStyle = lin(ctx, a, b, [[0, rgba(C.n200, 0.12)], [0.45, rgba(mix(C.n200, C.lampW, 0.3), 0.5)], [1, rgba(C.n200, 0.18)]]); ctx.lineWidth = Math.max(1, cam.S(Fp(0, p.h)) * 0.3); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      // dois painéis rebaixados, as faixas das equipes em cima (elétrico e ciano) e a coluna do meio
      quad(-p.w / 2 + 3, -4, 3.5, p.h - 7, rgba([9, 13, 19])); quad(4, p.w / 2 - 3, 3.5, p.h - 7, rgba([9, 13, 19]));
      quad(-p.w / 2 + 3, -4, p.h - 5.0, p.h - 3.8, rgba(C.e500, 0.5)); quad(4, p.w / 2 - 3, p.h - 5.0, p.h - 3.8, rgba(C.c400, 0.45));
      quad(-2.4, 2.4, 3.5, p.h - 7, rgba([12, 17, 24]));
      const disc = (u, h, r, fill) => { discT(ctx, cam, Fp(u, h), mul(ua, r), mul(ha, r)); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = fill; ctx.fill(); ID(ctx); };
      for (const lado of [-1, 1]) for (let i = 0; i < 20; i++) for (let j = 0; j < 17; j++) disc(lado * (6.2 + i * 2.05), 5.4 + j * 2.05, 0.42, rgba(C.n800, 0.55));
      // os pips: o brilho dos acesos varia 10-15% (LEDs de verdade não são iguais) e cada um tem a lente mais clara no meio
      // rodada de série (A6): o quadro mais aceso da série; pips ~15% menores, ~30% menos emissão, e a equipe da
      // esquerda num ciano mais frio (puxado para o elétrico claro), para o ciano cheio ficar só na barra do tempo
      const ON = mul(mix(mix(C.c400, C.c200, 0.2), C.n300, 0.42), 0.82), ONL = mix(ON, mul(C.e300, 0.8), 0.5);
      pips.forEach((q, i) => { disc(q.u, q.h, 2.6, rgba([7, 11, 16]));
        if (!q.on) { disc(q.u, q.h, 1.95, rgba(mix(C.n800, C.n700, 0.25))); return; }
        const v = 0.86 + 0.14 * ((i * 37 + 11) % 7) / 6; disc(q.u, q.h, 1.95, rgba(mul(q.lado < 0 ? ONL : ON, v))); disc(q.u - 0.3, q.h + 0.4, 0.9, rgba(C.c200, 0.12 * v)); });
      disc(0, 27, 1.1, rgba(C.c300, 0.9)); disc(0, 17, 1.1, rgba(C.c300, 0.9));
      // a barra do tempo (embaixo, no meio) e o hexágono da marca
      quad(-1.2, 1.2, 6, 11.5, rgba(C.n700, 0.9)); quad(-1.2, 1.2, 6, 9.2, rgba(C.c400, 0.85));
      { discT(ctx, cam, Fp(-p.w / 2 + 4.2, 1.8), ua, ha); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 90) * RAD; const x = Math.cos(a) * 0.8, y = Math.sin(a) * 0.8; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(C.n300, 0.45); ctx.fill(); ID(ctx); }
      return { Fp, ua, ha };
    }
    function emissao(ctx, cam, o, info) {
      const k = o.ledK; if (!(k > 0)) return; const { Fp } = info;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (const q of pips) if (q.on) { const c = Fp(q.u, q.h); glow(ctx, cam.P(c), cam.S(c) * 4.2, q.lado < 0 ? C.e400 : C.c500, 0.07 * k); }
      // o véu de luz ciano dos painéis no ar à frente (fraco e largo)
      glow(ctx, cam.P(fr), cam.S(fr) * 70, C.c500, 0.03 * k);
      ctx.restore();
    }
    return { objeto, sombras: [], desenhar, emissao,   // suspenso: sem sombra no tampo
      leds: [{ pos: F.P(-24, p.h / 2, -p.d / 2 - 6), k: 1.1, alcance: 40, eixo: norm([0, -0.5, -1]) }, { pos: F.P(24, p.h / 2, -p.d / 2 - 6), k: 0.8, alcance: 40, eixo: norm([0, -0.5, -1]) }] };
  }
  function montaSensor(it) {
    const s = it.sensor, F = Fr({ x: s.x, y: s.y, z: s.z });
    const cx = { u: [-s.w / 2, s.w / 2], h: [0, s.h], v: [-s.d / 2, s.d / 2] };
    const objeto = pontosCaixa(F, cx);
    function desenhar(ctx, cam, o) {
      // o suporte na parede (uma chapa) e a caixa do sensor
      caixa3d(ctx, cam, F, { u: [-s.w / 2 + 2, s.w / 2 - 2], h: [1, s.h + 3], v: [s.d / 2, PZ - s.z], alb: [36, 41, 52], esc: 0.75 });
      // rodada de série (A6): com a luz de teto mais fraca, a caixa ganha luz ambiente e o fio de cima, para se separar da parede
      const f = caixa3d(ctx, cam, F, Object.assign({ alb: [56, 64, 80], aresta: 0.6, esc: 0.7, k: { amb: 1.6 } }, cx));
      // embaixo: as duas lentes (escuras, com aro ciano apagado); na frente: o hexágono e o LED
      const Fd = (u, v) => F.P(u, -0.03, v), ua = [1, 0, 0], va = [0, 0, 1];
      const discB = (u, v, r, fill) => { discT(ctx, cam, Fd(u, v), mul(ua, r), mul(va, r)); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = fill; ctx.fill(); ID(ctx); };
      if (f.base) { for (const u of [-5.5, 5.5]) { discB(u, 0, 2.6, rgba([8, 12, 18])); discB(u, 0, 1.7, rgba(mix(C.c600, C.n900, 0.5))); discB(u, 0, 1.1, rgba([5, 8, 13])); } }
      const Fp = (u, h) => F.P(u, h, -s.d / 2 - 0.04);
      { discT(ctx, cam, Fp(-s.w / 2 + 3.2, s.h / 2), ua, [0, 1, 0]); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 90) * RAD; const x = Math.cos(a) * 0.66, y = Math.sin(a) * 0.66; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = rgba(C.n300, 0.16); ctx.fill(); ID(ctx); }
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
      ctx.fillStyle = lin(ctx, [0, yS], [0, yF], [[0, rgba(C.c400, 0.15 * k)], [0.3, rgba(C.c400, 0.09 * k)], [0.7, rgba(C.c400, 0.055 * k)], [1, rgba(C.c400, 0)]]); ctx.fill();
      // as bordas do leque, um fio
      for (const [p0, p1] of [[a[0], pe[0]], [a[1], pe[1]]]) { const t = (yF - p0[1]) / (p1[1] - p0[1]); const q = [p0[0] + (p1[0] - p0[0]) * t, yF]; ctx.strokeStyle = lin(ctx, p0, q, [[0, rgba(C.c300, 0.42 * k)], [1, rgba(C.c300, 0)]]); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
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
  // só no tampo ou no piso (rodada 1 de ajuste: sem o recorte, a sombra projetada de pontos perto da altura do
  // abajur caía no vidro como uma cunha diagonal); conjuntos acima do abajur não fazem sombra projetada
  function sombras(ctx, cam, o, sets, amb) {
    if (!sets.length || !ABAJUR) return;
    const { W, H } = cam, P = cam.P, L = ABAJUR.pos;
    const sh = layer(W, H), s = sh.getContext('2d'); s.fillStyle = 'rgb(0,0,0)';
    const sPt = p => { const t = L[1] / (L[1] - p[1]); return [L[0] + (p[0] - L[0]) * t, 0, L[2] + (p[2] - L[2]) * t]; };
    const k = cam.S([0, 0, 30]);
    s.filter = `blur(${Math.round(k * 0.9)}px)`; s.globalAlpha = 0.5;
    for (const pts of sets) { if (pts.some(p => p[1] > L[1] - 5)) continue; path(s, hull(pts.map(p => p[1] > 0.05 ? sPt(p) : p).map(P))); s.fill(); }
    s.filter = `blur(${Math.round(k * 1.8)}px)`; s.globalAlpha = 0.28;
    for (const pts of sets) { path(s, hull(pts.map(p => [p[0], 0, p[2] - p[1] * 0.55]).map(P))); s.fill(); }
    s.filter = `blur(${Math.max(1, Math.round(k * 0.5))}px)`; s.globalAlpha = 0.6;
    for (const pts of sets) { const f = pts.map(p => [p[0], 0, p[2]]); path(s, hull(f.filter((p, i) => pts[i][1] < 3).map(P))); s.fill(); }
    s.filter = 'none';
    ctx.save(); path(ctx, poligonoSup(cam, amb)); ctx.clip(); ctx.globalAlpha = 0.85; ctx.drawImage(sh, 0, 0); ctx.restore();
  }
  // sombra de contato: o contorno no tampo, borrado e escuro (rodada 1 de ajuste, nos aparelhos de mesa)
  function contato(ctx, cam, pts, a) {
    const sl = layer(cam.W, cam.H), s = sl.getContext('2d'), c = pts.reduce((t, p) => add(t, p), [0, 0, 0]).map(v => v / pts.length);
    s.filter = `blur(${Math.max(1, Math.round(cam.S(c) * 0.45))}px)`; s.fillStyle = 'rgb(2,4,8)'; path(s, hull(pts.map(cam.P))); s.fill();
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(sl, 0, 0); ctx.restore();
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
    sombras(ctx, cam, o, sets, amb);
    brilhoMesa(ctx, cam, o, g.brilhoMesa, amb);
    if (g.porta) g.porta(ctx, cam);
    // a porta some para o navy-950 de cima para baixo (só no contador): a metade de baixo calma, sem quadro nem puxador
    if (it.escurecer) { const [y0, y1, a] = it.escurecer; ctx.fillStyle = lin(ctx, [0, y0 * cam.H], [0, y1 * cam.H], [[0, rgba(C.n950, 0)], [0.6, rgba(C.n950, a * 0.75)], [1, rgba(C.n950, a)]]); ctx.fillRect(0, y0 * cam.H, cam.W, cam.H); }
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
