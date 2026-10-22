/* Cartão do Fleet Analytics BI: o painel de BI num monitor, na mesa do escritório escuro do hero, com a janela para a
   cidade de hora azul (spec 2026-10-16 §6.2). É o mesmo mundo do "Fim de expediente" (scripts/hero-expansao/scene.js):
   a mesa de laminado, a janela com montantes e a cidade desfocada (buildCity/cityLayer copiados), o abajur fora do
   quadro e a caneca do hero.
   A tela não tem texto: o mapa da frota (quadras giradas, veículos, o rastro em ângulos retos do selecionado), os
   indicadores (um bloco com barra de progresso e dois anéis), a curva de velocidade e as barras. Nada inventado: nenhuma placa, cidade,
   empresa ou cliente real.
   Unidades: cm. x à direita, y para cima, z para longe (para a janela). O tampo da mesa é o plano y = 0, a parede da
   janela fica em z = 64 e o vidro em z = 71 (como no hero); o monitor fica em x = -2, z = 40.
   Camadas: cidade (direção, desfocada) -> mesa e parede (por pixel, com o buraco da janela) -> montantes e peitoril ->
   reflexo da cidade na mesa -> halo da tela -> sombras e reflexo da tela na mesa -> pé, base e monitor -> caneca ->
   acabamento do kit. */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && typeof require !== 'undefined') ? require('../kit/cena.js') : G.KIT;
  const { C, rgba, mix, clamp, sstep, sub, add, mul, dot, norm, len, rng, LUZ, luz, pontoI, LMP, makeCam, frameOf, rrect, path, hull, discT, ID, radial, lin, layer, glow, SKY, skyCol } = K;

  // ---------------- mundo ----------------
  const MUNDO = {
    paredeZ: 64, vidroZ: 71,
    // a janela do hero, mais larga (a câmera retrato vê só vidro e os dois montantes, um de cada lado do monitor)
    janela: { x0: -160, x1: 160, y0: 0.4, y1: 210, trilho: 1.3, montantes: [[-45, -42], [42, 45]] },
    mesa: { x0: -170, x1: 170, z0: -90, z1: 63, alb: [54, 52, 49] },          // o laminado do hero
    // monitor de 27": painel 62 x 36 cm, virado 18° para a cadeira (fora do quadro, à esquerda); borda fina e queixo
    monitor: { x: -2, y: 14, z: 40, rot: -18, w: 62, h: 36, d: 1.6, r: 0.7, borda: 0.75, queixo: 1.7 },
    pe: { w: 5, d: 2.4, recuo: 2.4, base: { w: 25, d: 17, h: 0.9, r: 4, recuo: 1.6 } },
    caneca: { x: -29, z: 21, r: 4.1, h: 9.2, alca: -15 },   // na mesa, à esquerda, um palmo à frente do peitoril; a alça aponta para o monitor
    // o abajur do hero, fora do quadro, alto à esquerda: uma poça neutro-quente em volta do pé do monitor
    abajur: { pos: [-80, 92, 2], alvo: [-10, 0, 32], k: 1.0 }
  };
  // câmera retrato 800 x 1200: de pé, um pouco atrás da cadeira; o monitor entre ~17% e ~49% da altura
  const CAM = { W: 800, H: 1200, pos: [0, 42, -95], target: [0, 26, 40], F: 1150, shiftY: -196,
    cityBlur: 7, bokeh: 16, bokehP: 0.035, discA: 0.12, cityGain: 1, refl: 0.12,
    towers: [[-34, -10, 30, 1], [-10, -5.5, 6.5, 0], [6, 10.5, 8, 0], [10.5, 34, 13, 1]], centre: [-5.5, 6, -2.5],
    telaFundo: 0.45, telaLuz: 2.0, halo: 0.05, reflexoTela: 0.1, pulso: 0, abajurK: 1, caneca: 1,
    vig: 0.85, vigR: [0.2, 0.7], vigC: [0.5, 0.36], bottomFade: [0.5, 0.74, 1.0, 0.36, 0.62], bloom: 0.2, grain: 5, grainBaixo: [0.6, 6.5] };

  // ---------------- luzes ----------------
  const nrmTela = () => { const t = MUNDO.monitor.rot * Math.PI / 180; return [Math.sin(t), 0, -Math.cos(t)]; };
  let TELA = null, ABAJUR = null;
  function prepLuz(o) {
    LUZ.ceuDir = norm([0, 0.35, 1]);   // a luz da janela, como no hero
    const m = MUNDO.monitor, fr = frameOf(m), n = nrmTela(), A = MUNDO.abajur;
    TELA = { pos: add(fr(0, m.h / 2, -m.d / 2), mul(n, 3)), cor: [0.32, 0.6, 1.0], k: o.telaLuz, alcance: 24, eixo: n, cone: [-0.25, 0.55], grupo: 'tela' };
    // a aba do abajur corta a luz antes de chegar perto da câmera (o cutZ do hero): a poça fica no fundo da mesa
    ABAJUR = { pos: A.pos, cor: LMP, k: A.k * o.abajurK, alcance: 95, eixo: norm(sub(A.alvo, A.pos)), cone: [0.86, 0.975], grupo: 'abajur', mascara: p => p[1] > 0.5 ? 1 : sstep(6, 26, p[2]) };
    LUZ.pontos = [TELA, ABAJUR]; LUZ.LK = 1;
  }

  // ---------------- a cidade (do hero: buildCity + cityLayer, em direções) ----------------
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
    // 3% de névoa no plano do vidro (hero)
    c.fillStyle = rgba(C.n300, 0.03); c.fillRect(0, 0, W, H);
    return cv;
  }

  // ---------------- mesa e parede (por pixel; a janela fica transparente) ----------------
  function basePass(cam, o) {
    const { W, H } = cam, cv = layer(W, H), ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), D = img.data;
    const pos = cam.pos, wz = MUNDO.paredeZ, dk = MUNDO.mesa, jn = MUNDO.janela, R = rng(7);
    const wallA = [44, 50, 62];
    for (let sy = 0; sy < H; sy++) {
      for (let sx = 0; sx < W; sx++) {
        const d = cam.ray(sx + 0.5, sy + 0.5); let col, a = 255;
        const tw = d[2] > 0 ? (wz - pos[2]) / d[2] : 1e9; const wy = pos[1] + d[1] * tw, wx = pos[0] + d[0] * tw;
        if (wy >= 0) {
          if (wx > jn.x0 && wx < jn.x1 && wy > jn.y0 && wy < jn.y1) { a = 0; col = [0, 0, 0]; }
          else col = luz(wallA, [wx, wy, wz], [0, 0, -1], { amb: 0.6, wk: 0 });
        } else {
          const t = -pos[1] / d[1]; const x = pos[0] + d[0] * t, z = pos[2] + d[2] * t;
          if (z >= dk.z0 && z <= dk.z1 && x > dk.x0 && x < dk.x1) {
            const p = [x, 0, z], back = sstep(20, 63, z);
            col = luz(dk.alb, p, [0, 1, 0], { wk: 0.22 + back * 0.75 });
            // reflexo acetinado do abajur no laminado (hero)
            const v = norm(sub(pos, p)), l = norm(sub(ABAJUR.pos, p)), h = norm(add(v, l));
            const spec = Math.pow(Math.max(0, h[1]), 60) * pontoI(ABAJUR, p, null) * 40;
            col = add(col, [spec * LMP[0], spec * LMP[1], spec * LMP[2]]);
            // laminado de carvalho: veio comprido ao longo de x, 3-5% de contraste (hero)
            const lum = (col[0] + col[1] + col[2]) / 3;
            const fig = Math.sin(z * 2.1 + Math.sin(x * 0.037 + z * 0.21) * 2.6) * 0.55 + Math.sin(z * 6.7 + Math.sin(x * 0.09) * 1.3) * 0.3 + Math.sin(z * 17.3 + x * 0.013) * 0.15;
            const g = (R() - 0.5) * 2.0 + fig * lum * 0.045; col = add(col, [g, g * 0.98, g * 0.93]);
          } else col = [5, 10, 17];
        }
        const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  // ---------------- janela: montantes, trilho e peitoril (hero) ----------------
  function janela(ctx, cam) {
    const w = MUNDO.janela, z0 = MUNDO.paredeZ, z1 = MUNDO.vidroZ, P = cam.P, top = 300, fA = [40, 46, 58];
    const face = (pts, col) => { const q = pts.map(P); if (q.some(p => p[2] <= 0)) return; path(ctx, q); ctx.fillStyle = rgba(col); ctx.fill(); ctx.strokeStyle = rgba(col); ctx.lineWidth = 0.8; ctx.stroke(); };
    // peitoril: pega o céu
    const sA = P([0, w.y0, z0]), sB = P([0, w.y0, z1]);
    path(ctx, [[w.x0, w.y0, z0], [w.x1, w.y0, z0], [w.x1, w.y0, z1], [w.x0, w.y0, z1]].map(P));
    ctx.fillStyle = lin(ctx, sA, sB, [[0, rgba(luz(fA, [0, w.y0, 66], [0, 1, 0], { wk: 0.9 }))], [1, rgba(mix(C.n700, C.n600, 0.4))]]); ctx.fill();
    face([[w.x0, w.y0 - 1.0, z0 - 0.3], [w.x1, w.y0 - 1.0, z0 - 0.3], [w.x1, w.y0, z0 - 0.3], [w.x0, w.y0, z0 - 0.3]], luz(fA, [0, w.y0, z0], [0, 0, -1], { amb: 0.75, wk: 0 }));
    { const a1 = P([w.x0, w.y0, z0 - 0.3]), a2 = P([w.x1, w.y0, z0 - 0.3]); ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.n400, 0.1)], [0.5, rgba(mix(C.n300, C.lampW, 0.2), 0.36)], [1, rgba(C.n400, 0.1)]]); ctx.lineWidth = Math.max(1, cam.S([0, 0, z0]) * 0.14); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
    const rl = w.trilho, fz = z1 - 0.01, frameC = mix(C.n900, C.n800, 0.3);
    face([[w.x0, w.y0, fz], [w.x1, w.y0, fz], [w.x1, w.y0 + rl, fz], [w.x0, w.y0 + rl, fz]], mix(C.n800, C.n700, 0.45));
    { const a1 = P([w.x0, w.y0 + rl, fz]), a2 = P([w.x1, w.y0 + rl, fz]); ctx.strokeStyle = rgba(C.n400, 0.5); ctx.lineWidth = Math.max(1, cam.S([0, 0, fz]) * 0.16); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
    for (const [a, b] of w.montantes) {
      const zf = z1 - 4.5, side = cam.pos[0] < a ? a : b, sn = cam.pos[0] < a ? -1 : 1;
      face([[side, w.y0 + rl, zf], [side, w.y0 + rl, z1], [side, top, z1], [side, top, zf]], luz(fA, [side, 40, 69], [sn, 0, 0], { wk: 0 }));
      face([[a, w.y0 + rl, zf], [b, w.y0 + rl, zf], [b, top, zf], [a, top, zf]], frameC);
      const e1 = P([a, w.y0 + rl, zf]), e2 = P([a, top, zf]);
      if (e1[2] > 0 && e2[2] > 0) { ctx.strokeStyle = rgba(mix(C.n600, C.n300, 0.25), 0.4); ctx.lineWidth = Math.max(1, cam.S([a, 40, zf]) * 0.25); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); }
    }
  }
  function poligonoMesa(cam) { const dk = MUNDO.mesa; return [[dk.x0, 0, -40], [dk.x1, 0, -40], [dk.x1, 0, dk.z1], [dk.x0, 0, dk.z1]].map(cam.P); }
  // reflexo da cidade no laminado, junto da janela (hero)
  function reflexoCidade(ctx, cam, city, o) {
    const P = cam.P, yS = P([0, MUNDO.janela.y0, MUNDO.vidroZ])[1];
    ctx.save(); path(ctx, poligonoMesa(cam)); ctx.clip();
    const tmp = layer(cam.W, cam.H), t = tmp.getContext('2d');
    t.filter = `blur(${Math.round(o.cityBlur * 1.8)}px)`; t.translate(0, yS * 2 + 4); t.scale(1, -1); t.drawImage(city, 0, 0); t.setTransform(1, 0, 0, 1, 0, 0); t.filter = 'none';
    t.globalCompositeOperation = 'destination-in';
    const yN = P([0, 0, 30])[1];
    t.fillStyle = lin(t, [0, yS], [0, yN], [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); t.fillRect(0, 0, cam.W, cam.H);
    ctx.globalAlpha = o.refl; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }

  // ---------------- a tela do BI (textura sem texto) ----------------
  function textura(o) {
    const m = MUNDO.monitor, PX = 20, sw = m.w - 2 * m.borda, sh = m.h - m.borda - m.queixo;
    const TW = Math.round(sw * PX), TH = Math.round(sh * PX), cv = layer(TW, TH), x = cv.getContext('2d');
    const pulso = o.pulso || 0;   // 0..1: a fase dos dados (o loop da A5); 0 é o cartão
    const BG = mix(mix(C.n900, C.n950, 0.25), C.n800, o.telaFundo);
    const BAR = mix(BG, C.n950, 0.4), CARD = mix(BG, C.n700, 0.5), MAPA = mix(BG, C.n800, 0.55);
    x.fillStyle = rgba(BG); x.fillRect(0, 0, TW, TH);
    const rr = (x0, y0, w, h, r, fill) => { x.beginPath(); x.roundRect(x0, y0, w, h, r); x.fillStyle = fill; x.fill(); };
    // barra de cima e barra lateral (ícones como quadrados, sem letras)
    rr(0, 0, TW, 40, 0, rgba(BAR)); rr(0, 40, 52, TH - 40, 0, rgba(BAR));
    { const g = x.createLinearGradient(16, 11, 34, 29); g.addColorStop(0, rgba(C.e500)); g.addColorStop(1, rgba(C.c400)); rr(16, 11, 18, 18, 5, g); }
    rr(TW - 250, 12, 120, 16, 8, rgba(C.n700, 0.7));
    for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(TW - 28 - k * 30, 20, 8, 0, 7); x.fillStyle = rgba(k === 0 ? C.n600 : C.n700, 0.9); x.fill(); }
    for (let i = 0; i < 6; i++) rr(16, 66 + i * 46, 20, 20, 5, rgba(i === 1 ? C.e500 : C.n700, i === 1 ? 0.95 : 0.8));
    rr(0, 66 + 46 - 2, 4, 24, 2, rgba(C.e400));
    // ---- mapa da frota ----
    const MX = 66, MY = 54, MW = 690, MH = TH - 14 - MY;
    x.save(); x.beginPath(); x.roundRect(MX, MY, MW, MH, 12); x.clip();
    x.fillStyle = rgba(MAPA); x.fillRect(MX, MY, MW, MH);
    const th = -8 * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th), gs = 46, ox = MX + MW * 0.5, oy = MY + MH * 0.52;
    const G2 = (i, j) => [ox + (i * ct - j * st) * gs, oy + (i * st + j * ct) * gs];
    const R = rng(11);
    for (let i = -9; i < 9; i++) for (let j = -8; j < 8; j++) { const r = R(); if (r < 0.45) { const q = [G2(i + 0.1, j + 0.1), G2(i + 0.9, j + 0.1), G2(i + 0.9, j + 0.9), G2(i + 0.1, j + 0.9)]; path(x, q); x.fillStyle = rgba(r < 0.15 ? C.n700 : C.n800, r < 0.15 ? 0.5 : 0.75); x.fill(); } }
    const seg = (a, b, col, wd) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.strokeStyle = col; x.lineWidth = wd; x.stroke(); };
    x.lineCap = 'butt';
    for (let i = -10; i <= 10; i++) { const maj = i % 3 === 0; seg(G2(i, -9), G2(i, 9), rgba(maj ? C.n500 : C.n600, maj ? 0.6 : 0.45), maj ? 5 : 2); }
    for (let j = -9; j <= 9; j++) { const maj = j % 3 === 0; seg(G2(-11, j), G2(11, j), rgba(maj ? C.n500 : C.n600, maj ? 0.6 : 0.45), maj ? 5 : 2); }
    seg([MX - 10, MY + MH * 0.92], [MX + MW + 10, MY + MH * 0.12], rgba(C.n500, 0.4), 7);   // a avenida na diagonal
    // o rastro do veículo selecionado: ângulos retos, do elétrico ao ciano (a rota do hero)
    const RT = [[-5, 4], [-5, 2], [-2, 2], [-2, -1], [1, -1], [1, 0], [3, 0]].map(([i, j]) => G2(i, j));
    const rastro = () => { x.beginPath(); x.moveTo(RT[0][0], RT[0][1]); for (let i = 1; i < RT.length - 1; i++) x.arcTo(RT[i][0], RT[i][1], RT[i + 1][0], RT[i + 1][1], 12); x.lineTo(RT[RT.length - 1][0], RT[RT.length - 1][1]); };
    x.lineCap = 'round'; x.lineJoin = 'round';
    rastro(); x.strokeStyle = rgba(C.c400, 0.14); x.lineWidth = 20; x.stroke();
    rastro(); { const g = x.createLinearGradient(RT[0][0], RT[0][1], RT[RT.length - 1][0], RT[RT.length - 1][1]); g.addColorStop(0, rgba(C.e500, 0.9)); g.addColorStop(1, rgba(C.c400, 0.9)); x.strokeStyle = g; } x.lineWidth = 8; x.stroke();
    // a frota: veículos parados (elétrico) e em movimento (ciano)
    const FROTA = [[-5.5, -3.5, 0], [-3, -5, 0], [-6, 0.5, 1], [-3.5, 5, 0], [-0.5, 3, 0], [2, 4.5, 1], [4.5, 2.5, 0], [5.5, -2.5, 0], [3, -4.5, 1], [0, -3, 0], [6, 5, 0], [-1, 5.5, 0], [-2, 0.5, 0], [6.5, 0, 1]];
    for (const [i, j, mov] of FROTA) {
      const p = G2(i, j), cor = mov ? C.c400 : C.e400;
      if (mov) { x.fillStyle = radial(x, [[0, rgba(cor, 0.3)], [1, rgba(cor, 0)]], 22); x.save(); x.translate(p[0], p[1]); x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill(); x.restore(); }   // halo só em quem anda
      x.beginPath(); x.arc(p[0], p[1], 10, 0, 7); x.fillStyle = rgba(C.n100, 0.85); x.fill();
      x.beginPath(); x.arc(p[0], p[1], 6.5, 0, 7); x.fillStyle = rgba(cor); x.fill();
    }
    // o selecionado, na ponta do rastro, com o anel que pulsa
    { const p = RT[RT.length - 1], pr = 34 + 10 * Math.sin(pulso * Math.PI * 2);
      x.fillStyle = radial(x, [[0, rgba(C.c300, 0.32)], [0.6, rgba(C.c300, 0.12)], [1, rgba(C.c300, 0)]], pr); x.save(); x.translate(p[0], p[1]); x.beginPath(); x.arc(0, 0, pr, 0, 7); x.fill(); x.restore();
      x.beginPath(); x.arc(p[0], p[1], 14, 0, 7); x.fillStyle = rgba(C.c200, 0.95); x.fill();
      x.beginPath(); x.arc(p[0], p[1], 9, 0, 7); x.fillStyle = rgba(C.c400); x.fill();
      // o cartão do veículo, como o de concluído do hero: selo e uma barra, sem texto
      const cw = 170, chh = 58, cx0 = p[0] + 28, cy0 = p[1] - 92;   // acima e à direita do veículo, dentro do mapa
      rr(cx0, cy0, cw, chh, 14, rgba(mix(C.n950, C.n900, 0.3), 0.94)); x.strokeStyle = rgba(C.n700, 0.9); x.lineWidth = 2; x.stroke();
      x.beginPath(); x.arc(cx0 + 31, cy0 + chh / 2, 16, 0, 7); x.fillStyle = rgba(C.c400, 0.85); x.fill();
      x.beginPath(); x.arc(cx0 + 31, cy0 + chh / 2, 6, 0, 7); x.fillStyle = rgba(C.n950); x.fill();
      const g = x.createLinearGradient(cx0 + 60, 0, cx0 + cw - 18, 0); g.addColorStop(0, rgba(C.e500, 0.85)); g.addColorStop(1, rgba(C.c400, 0.85));
      rr(cx0 + 60, cy0 + chh / 2 - 5, (cw - 78) * 0.72, 10, 5, g);
      rr(cx0 + 60 + (cw - 78) * 0.72 + 6, cy0 + chh / 2 - 5, (cw - 78) * 0.28 - 6, 10, 5, rgba(C.n700, 0.9)); }
    x.restore();
    // ---- coluna da direita: indicadores ----
    const CX = MX + MW + 14, CW = TW - 14 - CX;
    // indicadores: um bloco largo (valor como bloco e barra de progresso) e um cartão com dois anéis de tamanhos
    // diferentes, a 0,7 (nada de três cartões iguais em fila)
    { const hh = 118, wa = Math.round(CW * 0.54), x0 = CX, y0 = MY; rr(x0, y0, wa, hh, 12, rgba(CARD));
      rr(x0 + 22, y0 + 18, 70, 10, 5, rgba(C.n600, 0.7));                     // rótulo
      rr(x0 + 22, y0 + 40, 104, 26, 7, rgba(C.n400, 0.55));                   // o valor, como bloco
      rr(x0 + 136, y0 + 48, 40, 12, 6, rgba(C.n600, 0.6));                    // a unidade
      const bw = wa - 44, f = 0.68; rr(x0 + 22, y0 + hh - 30, bw, 12, 6, rgba(C.n800, 0.95));
      { const g = x.createLinearGradient(x0 + 22, 0, x0 + 22 + bw * f, 0); g.addColorStop(0, rgba(C.e500, 0.7)); g.addColorStop(1, rgba(C.e400, 0.7)); rr(x0 + 22, y0 + hh - 30, bw * f, 12, 6, g); }
      const xb = x0 + wa + 12, wb = CW - wa - 12; rr(xb, y0, wb, hh, 12, rgba(CARD)); x.lineCap = 'round';
      const anel = (cx, cy, r, lw, f, cor) => {
        x.beginPath(); x.arc(cx, cy, r, 0, 7); x.strokeStyle = rgba(C.n800, 0.95); x.lineWidth = lw; x.stroke();
        x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); x.strokeStyle = rgba(cor, 0.7); x.lineWidth = lw; x.stroke(); };
      anel(xb + 58, y0 + hh / 2, 33, 11, 0.72, C.e400);
      anel(xb + wb - 44, y0 + 44, 18, 7, 0.48, C.e300);
      rr(xb + wb - 70, y0 + hh - 30, 52, 8, 4, rgba(C.n600, 0.7)); }
    // a curva de velocidade
    { const x0 = CX, y0 = MY + 130, w = CW, h = 240; rr(x0, y0, w, h, 12, rgba(CARD));
      const gx0 = x0 + 22, gx1 = x0 + w - 22, gy0 = y0 + 34, gy1 = y0 + h - 26;
      for (let k = 0; k < 4; k++) { const yy = gy0 + (gy1 - gy0) * k / 3; seg([gx0, yy], [gx1, yy], rgba(C.n600, 0.55), 2); }
      seg([gx0, gy0 + (gy1 - gy0) * 0.22], [gx1, gy0 + (gy1 - gy0) * 0.22], rgba(C.n400, 0.45), 2);   // o limite
      const N = 60, pts = [];
      for (let i = 0; i <= N; i++) { const t = i / N; const v = 0.52 + 0.2 * Math.sin(t * 7.1 + 0.6) + 0.12 * Math.sin(t * 17.3 + 1.1) - 0.38 * Math.exp(-Math.pow((t - 0.42) / 0.05, 2)) + 0.08 * Math.sin(t * 31 + pulso * Math.PI * 2) * t; pts.push([gx0 + (gx1 - gx0) * t, gy1 - (gy1 - gy0) * clamp(v, 0.04, 0.96)]); }
      x.beginPath(); x.moveTo(pts[0][0], gy1); for (const p of pts) x.lineTo(p[0], p[1]); x.lineTo(gx1, gy1); x.closePath();
      { const g = x.createLinearGradient(0, gy0, 0, gy1); g.addColorStop(0, rgba(C.e500, 0.4)); g.addColorStop(1, rgba(C.e500, 0)); x.fillStyle = g; x.fill(); }
      x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
      { const g = x.createLinearGradient(gx0, 0, gx1, 0); g.addColorStop(0, rgba(C.e400)); g.addColorStop(1, rgba(C.c400)); x.strokeStyle = g; } x.lineWidth = 5; x.lineJoin = 'round'; x.stroke();
      const pe = pts[N]; x.fillStyle = radial(x, [[0, rgba(C.c300, 0.4)], [1, rgba(C.c300, 0)]], 24); x.save(); x.translate(pe[0], pe[1]); x.beginPath(); x.arc(0, 0, 24, 0, 7); x.fill(); x.restore();
      x.beginPath(); x.arc(pe[0], pe[1], 8, 0, 7); x.fillStyle = rgba(C.c300); x.fill();
      rr(x0 + 22, y0 + 12, 70, 10, 5, rgba(C.n600, 0.7)); }
    // as barras de indicadores
    { const x0 = CX, y0 = MY + 384, w = CW, h = TH - 14 - y0; rr(x0, y0, w, h, 12, rgba(CARD));
      const HB = [0.55, 0.72, 0.48, 0.86, 0.64, 0.92, 0.58, 0.76, 0.67, 0.81, 0.52, 0.7], n = HB.length;
      const bx0 = x0 + 24, bx1 = x0 + w - 24, by1 = y0 + h - 26, byH = h - 66, bw = (bx1 - bx0) / n * 0.62;
      seg([bx0 - 6, by1 + 1], [bx1 + 6, by1 + 1], rgba(C.n600, 0.8), 2);
      HB.forEach((f, i) => {
        const bx = bx0 + (bx1 - bx0) * (i + 0.5) / n - bw / 2, bh = byH * f * (1 + (i === 5 ? 0.04 * Math.sin(pulso * Math.PI * 2) : 0)), sel = i === 5;
        const viz = i === 4 || i === 6, g = x.createLinearGradient(0, by1 - bh, 0, by1);   // a ciano e as vizinhas em cor; as outras em navy claro
        if (sel) { g.addColorStop(0, rgba(C.c400)); g.addColorStop(1, rgba(C.c600, 0.75)); }
        else if (viz) { g.addColorStop(0, rgba(C.e400, 0.9)); g.addColorStop(1, rgba(C.e700, 0.75)); }
        else { g.addColorStop(0, rgba(C.n500, 0.6)); g.addColorStop(1, rgba(C.n600, 0.6)); }
        x.beginPath(); x.roundRect(bx, by1 - bh, bw, bh, [5, 5, 0, 0]); x.fillStyle = g; x.fill();
      });
      rr(x0 + 22, y0 + 12, 90, 10, 5, rgba(C.n600, 0.7)); }
    // reduz pela metade com suavização (o mapeamento depois reduz pouco: sem serrilhado)
    const half = layer(TW >> 1, TH >> 1), hx = half.getContext('2d'); hx.imageSmoothingQuality = 'high'; hx.drawImage(cv, 0, 0, TW >> 1, TH >> 1);
    return half;
  }
  // mapeia a textura num retângulo do mundo: topo(s) e base(s) dão o ponto na tela (px) da aresta de cima e da de
  // baixo na fração s da largura; faixas verticais estreitas, cada uma afim: a perspectiva sai certa sem recorte
  function mapear(ctx, tex, TL, BL, n = 140) {
    const TW = tex.width, TH = tex.height;
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

  // ---------------- o monitor ----------------
  const geo = () => {
    const m = MUNDO.monitor, fr = frameOf(m), hd = m.d / 2;
    const at = (u, hh, v) => fr(u, hh + m.h / 2, v);                   // hh a partir do centro do painel
    const tela = { u0: -m.w / 2 + m.borda, u1: m.w / 2 - m.borda, h0: -m.h / 2 + m.queixo, h1: m.h / 2 - m.borda, v: -hd - 0.02 };
    return { m, fr, hd, at, tela };
  };
  function pontosMonitor() { const { m, at, hd } = geo(), r = []; for (const [u, hh] of rrect(m.w, m.h, m.r, 2)) for (const v of [-hd, hd]) r.push(at(u, hh, v)); return r; }
  function pontosPe() {
    const { m, fr, hd } = geo(), p = MUNDO.pe, b = p.base, r = [], vb = hd + b.recuo, vp = hd + p.recuo;
    for (const [u, v] of rrect(b.w, b.d, b.r, 3)) for (const y of [0, b.h]) r.push(fr(u, y - m.y, v + vb));
    for (const u of [-p.w / 2, p.w / 2]) for (const v of [vp - p.d / 2, vp + p.d / 2]) for (const y of [b.h, m.y + m.h / 2]) r.push(fr(u, y - m.y, v));
    return r;
  }
  function sombras(ctx, cam, o) {
    const { W, H } = cam, P = cam.P, L = ABAJUR.pos;
    const sh = layer(W, H), s = sh.getContext('2d'); s.fillStyle = 'rgb(0,0,0)';
    const sets = [pontosMonitor().concat(pontosPe())];
    if (o.caneca) { const c = MUNDO.caneca; const r = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; for (const h of [0, c.h]) r.push([c.x + c.r * Math.cos(a), h, c.z + c.r * Math.sin(a)]); } sets.push(r); }
    const sPt = p => { const t = L[1] / (L[1] - p[1]); return [L[0] + (p[0] - L[0]) * t, 0, L[2] + (p[2] - L[2]) * t]; };
    const k = cam.S([0, 0, 30]);
    s.filter = `blur(${Math.round(k * 0.9)}px)`; s.globalAlpha = 0.5;
    for (const pts of sets) { path(s, hull(pts.map(p => p[1] > 0.05 ? sPt(p) : p).map(P))); s.fill(); }
    s.filter = `blur(${Math.round(k * 1.8)}px)`; s.globalAlpha = 0.28;      // a janela atrás: sombra mole para quem olha
    for (const pts of sets) { path(s, hull(pts.map(p => [p[0], 0, p[2] - p[1] * 0.55]).map(P))); s.fill(); }
    s.filter = `blur(${Math.max(1, Math.round(k * 0.5))}px)`; s.globalAlpha = 0.6;   // contato
    { const f = pontosPe().filter(p => p[1] <= 0.05); const c = f.reduce((a, p) => add(a, p), [0, 0, 0]).map(v => v / f.length); path(s, hull(f.map(p => add(c, mul(sub(p, c), 1.08))).map(P))); s.fill(); }
    s.filter = 'none';
    ctx.save(); ctx.globalAlpha = 0.85; ctx.drawImage(sh, 0, 0); ctx.restore();
  }
  // o reflexo da tela no laminado: a tela espelhada no plano da mesa, desfocada e fraca
  function reflexoTela(ctx, cam, tex, o) {
    if (!o.reflexoTela) return;
    const { m, at, tela } = geo(), P = cam.P, mir = p => [p[0], -p[1], p[2]];
    const rl = layer(cam.W, cam.H), r = rl.getContext('2d');
    const q = (s, h) => P(mir(at(tela.u0 + (tela.u1 - tela.u0) * s, h, tela.v)));
    mapear(r, tex, s => q(s, tela.h1), s => q(s, tela.h0), 60);   // a linha de cima da textura cai embaixo: espelho
    return rl;
  }
  function pe(ctx, cam, o) {
    const { m, fr, hd } = geo(), P = cam.P, p = MUNDO.pe, b = p.base, n = nrmTela(), t = m.rot * Math.PI / 180, ua = [Math.cos(t), 0, Math.sin(t)];
    const alb = [44, 48, 56];
    // base: chapa baixa de cantos redondos
    const vb = hd + b.recuo, outl = rrect(b.w, b.d, b.r, 6);
    const bot = outl.map(([u, v]) => P(fr(u, 0 - m.y, v + vb))), tp = outl.map(([u, v]) => P(fr(u, b.h - m.y, v + vb)));
    path(ctx, hull(bot.concat(tp))); ctx.fillStyle = rgba(mix(luz(alb, fr(0, 0.4 - m.y, vb - b.d / 2), n), C.black, 0.25)); ctx.fill();
    const cF = luz(alb, fr(0, b.h - m.y, vb - b.d / 2), [0, 1, 0], { wk: 0.4 }), cB = luz(alb, fr(0, b.h - m.y, vb + b.d / 2), [0, 1, 0], { wk: 0.9 });
    path(ctx, tp); ctx.fillStyle = lin(ctx, P(fr(0, b.h - m.y, vb - b.d / 2)), P(fr(0, b.h - m.y, vb + b.d / 2)), [[0, rgba(cF)], [1, rgba(mix(cB, C.n900, 0.3))]]); ctx.fill();
    { const a1 = P(fr(-b.w / 2 + b.r, b.h - m.y, vb - b.d / 2)), a2 = P(fr(b.w / 2 - b.r, b.h - m.y, vb - b.d / 2));
      ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(mix(C.n400, C.lampW, 0.4), 0.4)], [1, rgba(C.n500, 0.12)]]); ctx.lineWidth = Math.max(1, cam.S(fr(0, 0, vb)) * 0.12); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
    // coluna: atrás do centro do painel, da base até o meio dele
    const vp = hd + p.recuo, y1 = m.y + m.h / 2;
    const cs = []; for (const u of [-p.w / 2, p.w / 2]) for (const v of [vp - p.d / 2, vp + p.d / 2]) for (const y of [b.h, y1]) cs.push(P(fr(u, y - m.y, v)));
    path(ctx, hull(cs));
    const c0 = luz(alb, fr(0, 2 - m.y, vp - p.d / 2), n), c1 = luz(alb, fr(0, m.y - m.y, vp - p.d / 2), n);
    ctx.fillStyle = lin(ctx, P(fr(0, b.h - m.y, vp)), P(fr(0, 0, vp)), [[0, rgba(c0)], [1, rgba(mix(c1, C.black, 0.45))]]); ctx.fill();
    // fio de luz do abajur na aresta esquerda da coluna
    { const a1 = P(fr(-p.w / 2, b.h + 0.4 - m.y, vp - p.d / 2)), a2 = P(fr(-p.w / 2, 0, vp - p.d / 2));
      ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(mix(C.n400, C.lampW, 0.5), 0.35)], [1, rgba(C.n500, 0.05)]]); ctx.lineWidth = Math.max(1, cam.S(fr(0, 0, vp)) * 0.15); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
  }
  function monitor(ctx, cam, o, tex) {
    const { m, hd, at, tela } = geo(), P = cam.P, t = m.rot * Math.PI / 180, ua = [Math.cos(t), 0, Math.sin(t)];
    const alb = [42, 46, 54], outl = rrect(m.w, m.h, m.r, 4);
    const front = outl.map(([u, hh]) => P(at(u, hh, -hd))), back = outl.map(([u, hh]) => P(at(u, hh, hd + 1.2)));
    // o corpo: a lateral que a câmera vê (a direita, mais perto), clara em cima (pega o céu)
    const cSide = luz(alb, at(m.w / 2, 0, 0), ua), cTop = luz(alb, at(m.w / 2, m.h / 2, 0), [0, 1, 0]);
    path(ctx, hull(front.concat(back)));
    ctx.fillStyle = lin(ctx, P(at(m.w / 2, m.h / 2, 0)), P(at(m.w / 2, -m.h / 2, 0)), [[0, rgba(mix(cTop, C.n500, 0.15))], [0.4, rgba(cSide)], [1, rgba(mix(cSide, C.black, 0.4))]]); ctx.fill();
    // a frente: vidro preto
    path(ctx, front); ctx.fillStyle = rgba([7, 10, 15]); ctx.fill();
    // a tela
    const pt = (s, h) => P(at(tela.u0 + (tela.u1 - tela.u0) * s, h, tela.v));
    const so = rrect(tela.u1 - tela.u0, tela.h1 - tela.h0, 0.25, 3).map(([u, hh]) => P(at(u + (tela.u0 + tela.u1) / 2, hh + (tela.h0 + tela.h1) / 2, tela.v)));
    ctx.save(); path(ctx, so); ctx.clip();
    mapear(ctx, tex, s => pt(s, tela.h1), s => pt(s, tela.h0));
    // brilho do vidro, de cima à esquerda (hero)
    { const a = pt(0, tela.h1), b = pt(0.6, tela.h0); ctx.fillStyle = lin(ctx, a, b, [[0, rgba(C.n300, 0.06)], [0.5, rgba(C.n300, 0.015)], [1, rgba(C.n300, 0)]]); ctx.fillRect(0, 0, cam.W, cam.H); }
    ctx.restore();
    // filete claro no contorno, mais aceso em cima (a janela atrás) e no canto mais perto
    path(ctx, front); ctx.strokeStyle = lin(ctx, P(at(-m.w / 2, m.h / 2, -hd)), P(at(m.w / 2, -m.h / 2, -hd)), [[0, rgba(C.n400, 0.22)], [0.6, rgba(C.n500, 0.18)], [1, rgba(C.n400, 0.3)]]);
    ctx.lineWidth = Math.max(1, cam.S(at(0, 0, 0)) * 0.1); ctx.stroke();
    // aresta de cima em contraluz (o céu atrás)
    { const pts = []; for (let i = 0; i <= 30; i++) pts.push(P(at(-m.w / 2 + m.r + (m.w - 2 * m.r) * i / 30, m.h / 2, -hd + 0.2)));
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = lin(ctx, pts[0], pts[pts.length - 1], [[0, rgba(C.n400, 0.15)], [0.5, rgba(C.n300, 0.4)], [1, rgba(C.n400, 0.3)]]); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, 0)) * 0.12); ctx.lineCap = 'round'; ctx.stroke(); }
  }

  // ---------------- a caneca do hero ----------------
  function caneca(ctx, cam) {
    const m = MUNDO.caneca, P = cam.P, N = 72;
    const ring = (h, r) => { const a = []; for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; a.push(P([m.x + r * Math.cos(t), h, m.z + r * Math.sin(t)])); } return a; };
    const alb = [34, 50, 72];
    const hAng = m.alca * Math.PI / 180, hd = [Math.cos(hAng), 0, Math.sin(hAng)];
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

  // ---------------- render ----------------
  function render(canvas, extra) {
    const o = Object.assign({}, CAM, extra || {});
    if (typeof o.grainBaixo === 'string') o.grainBaixo = o.grainBaixo.split(',').map(Number);
    prepLuz(o); const cam = makeCam(o); const ctx = canvas.getContext('2d');
    const tex = textura(o);
    if (o.so === 'tela') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cam.W, cam.H); ctx.drawImage(tex, 0, 0, cam.W, cam.W * tex.height / tex.width); return { cam }; }
    // 1. a cidade e, por cima, a mesa e a parede com o buraco da janela
    const city = cidade(cam, o);
    ctx.drawImage(city, 0, 0);
    if (o.so === 'cidade') return { cam };
    ctx.drawImage(basePass(cam, o), 0, 0);
    janela(ctx, cam);
    reflexoCidade(ctx, cam, city, o);
    // 2. o halo da tela no ar da sala (atrás do monitor)
    if (o.halo) { const { m } = geo(), c = cam.P([m.x, m.y + m.h / 2, m.z]), r = cam.S([m.x, m.y, m.z]) * m.w * 0.85;
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(c[0], c[1]); ctx.scale(r, r * 0.7);
      ctx.fillStyle = radial(ctx, [[0, rgba(C.e500, o.halo)], [0.55, rgba(C.e500, o.halo * 0.45)], [1, rgba(C.e500, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); }
    // 3. sombras e o reflexo da tela na mesa
    sombras(ctx, cam, o);
    { const rl = reflexoTela(ctx, cam, tex, o);
      if (rl) { const { m } = geo(), y0 = cam.P([m.x, -m.y, m.z])[1], y1 = cam.P([m.x, -(m.y + m.h * 0.7), m.z])[1];
        const t = layer(cam.W, cam.H), tc = t.getContext('2d'); tc.filter = 'blur(7px)'; tc.drawImage(rl, 0, 0); tc.filter = 'none';
        tc.globalCompositeOperation = 'destination-in'; tc.fillStyle = lin(tc, [0, y0], [0, y1], [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); tc.fillRect(0, 0, cam.W, cam.H);
        ctx.save(); path(ctx, poligonoMesa(cam)); ctx.clip(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.reflexoTela; ctx.drawImage(t, 0, 0); ctx.restore(); } }
    // 4. o pé, o monitor e a caneca
    pe(ctx, cam, o); monitor(ctx, cam, o, tex);
    if (o.caneca) caneca(ctx, cam);
    // 5. acabamento do hero
    K.acabamento(ctx, cam, o);
    return { cam };
  }
  // pontos do objeto principal (o monitor com o pé), para a sonda de enquadramento
  function objeto() { return pontosMonitor().concat(pontosPe()); }
  function referencias() {
    const m = MUNDO.monitor, jn = MUNDO.janela;
    return { monitor: [m.x, m.y + m.h / 2, m.z], peitoril: [0, jn.y0, MUNDO.paredeZ], montanteE: [jn.montantes[0][1], 40, MUNDO.vidroZ], montanteD: [jn.montantes[1][0], 40, MUNDO.vidroZ],
      caneca: [MUNDO.caneca.x, MUNDO.caneca.h, MUNDO.caneca.z], horizonte: [0, CAM.pos[1], 1e6] };
  }
  G.CENA = { nome: 'fleet-analytics-bi', render, CAM, MUNDO, objeto, referencias };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.CENA;
