/* Cartão do Air Central: o módulo da central de ar numa prateleirinha logo abaixo do ar-condicionado de uma sala de
   aula vazia, à noite, depois da última aula (spec 2026-10-16 §6.2). O ar já foi desligado pelo sistema: a aleta está
   fechada e não há luz nenhuma no aparelho. O LED ciano do módulo é a única luz acesa da sala.
   O módulo é ilustração do conceito (ADR-009): uma PCB numa caixinha impressa em 3D, com o formato de um Mac mini
   (10 x 10 x 3 cm, cantos de raio 2 cm, tampo plano, rodapé recuado e escuro), em PLA cinza-ardósia fosco com as
   linhas de camada nas paredes, o hexágono da Strukti em baixo-relevo no tampo, o filete elétrico no contorno de
   cima da frente e a janela de infravermelho de acrílico fumê com o LED ciano. Nenhuma sala, escola, marca ou número
   real; o ar-condicionado é genérico (sem marca e sem display).
   Unidades: cm. A parede é o plano z = 0 (a sala fica em z < 0, onde está a câmera); x à direita, y para cima.
   Na parede: o ar-condicionado no alto, a janela à direita dele (a cidade de hora azul do hero, desfocada) e, embaixo
   da prateleira, o canto de cima do quadro escuro. Camadas: cidade (direções, desfocada) -> caixilhos -> parede, vão
   da janela e quadro (por pixel, transparente no vidro) -> sombras (tudo desfocado: o fundo) -> o fio da moldura do
   quadro -> ar-condicionado -> prateleira -> módulo (paredes por pixel) -> LED -> acabamento.
   Copiado e adaptado do Replay (a caixa, o filete, o LED, a luz da chave) e do Fleet (a cidade do hero, buildCity e
   cityLayer); nada é importado deles em tempo de execução. */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && typeof require !== 'undefined') ? require('../kit/cena.js') : G.KIT;
  const { C, rgba, mix, clamp, sstep, sub, add, mul, dot, norm, len, rng, LUZ, luz, FLD, LMP, makeCam, frameOf, rrect, path, hull, discT, ID, radial, lin, layer, glow, SKY, skyCol } = K;
  const RAD = Math.PI / 180;

  // ---------------- mundo ----------------
  const MUNDO = {
    parede: { alb: [72, 80, 94] },                                          // reboco pintado, claro de dia
    // a janela, logo à direita do ar (o split fica perto dela, por onde passa o cano): uma travessa, o vidro recuado no vão
    janela: { x0: 8.5, x1: 120, y0: 100, y1: 252, vidro: 11, perfil: 1.8, travessas: [176], montantes: [62] },
    // o quadro escuro, embaixo, com o giz apagado: passadas de apagador logo abaixo da aresta de cima, cada uma um arco
    // do braço (flecha de 35–40% do meio comprimento; as pontas caem) [x do meio, y das pontas, meio comprimento, flecha,
    // inclinação, largura, força]. A quina fica a 11 cm do vão da janela: com 0,5 cm, a borda do quadro corria colada
    // ao batente e a metade esquerda lia como a porta de um armário; e não fica na vertical do LED nem das pontas da
    // prateleira e do ar
    quadro: { x0: -330, x1: -2.5, y0: 92, y1: 192, moldura: 2.4,
      passadas: [[-15, 182.2, 11.5, 4.2, -0.02, 2.8, 0.85], [-6.5, 186.6, 8.5, -3.2, 0.06, 2.6, 0.7], [-27, 181.8, 8, 3.0, 0.02, 2.5, 0.55],
        [-21, 180.6, 9, 3.4, -0.03, 2.6, 0.5]] },
    // o split de parede: 90 cm de comprimento, 29 de altura, 20 de fundo (a frente arredondada, a aleta embaixo)
    ar: { x0: -86, x1: 4, y: 225, h: 29, d: 20 },
    prateleira: { x0: -12, x1: 4, y: 215, e: 0.9, d: 15.5 },              // a prateleirinha de parede (chapa)
    // o módulo: 10 x 10 x 3 cm, raio 2 (20% do lado), rodapé recuado 1,2 cm e de 0,42 cm de altura; girado 28° para a
    // janela de infravermelho olhar para o ar (para a ponta direita do aparelho, onde fica o receptor)
    modulo: { x: -4, y: 215, z: -8.0, w: 10, h: 3.0, pe: 0.42, r: 2.0, recuo: 1.2, rot: 28, camadas: 22 },
    // a luz que cai sobre o módulo: a do corredor, pela porta (alta, atrás e à esquerda da câmera), neutra
    chave: { pos: [-95, 430, -205], k: 0.62 }
  };
  // câmera retrato 800 x 1200: um pouco acima do módulo (~15° para baixo), de 3/4 pela frente-esquerda. O quadro sobe o
  // módulo para 16–28% da altura (shiftY): no celular, o texto do cartão do centro começa a ~29% e o véu dele, a ~24,5%;
  // o LED (23,7%) e a janela de infravermelho ficam acima dele
  const CAM = { W: 800, H: 1200, pos: [-15, 233, -60], target: [-2, 212, -12], F: 1200, shiftY: -225,
    fundoBlur: 3.2, cityBlur: 7, bokeh: 15, bokehP: 0.07, discA: 0.12, cityGain: 1, cidadeY: 300, cidadeDx: 0,
    towers: [[-40, -20, 14, 1], [-20, -12, 5, 0], [17, 24.5, 2.5, 0], [24.5, 30, 4, 1], [30, 42, 6.5, 1]], centre: [-6, 6, -2],
    paredeLk: 0.22, arAmb: 0.5, arLk: 0.4, arEsq: 0.5, arBlur: 1.2, arRebate: 0.24, arTopo: 0.66, arPonta: 0.45,
    face: 7, vidroK: 0.2, janelaK: 1, sombraAr: 0.62, sombraTampo: [0.58, -6.5, 2.2], ledK: 1,
    giz: 20, fioQuadro: 0.11, degrauQuadro: 0.6, sombraPrat: 0.55, sombraChave: 0.35, contato: 0.85, sulco: 0.3, crista: 0.45,
    vig: 0.95, vigR: [0.18, 0.64], vigC: [0.54, 0.24], bottomFade: [0.5, 0.76, 1.0, 0.38, 0.62], bloom: 0.18, grain: 5, grainBaixo: [0.6, 6.5] };

  function prepLuz(o) {
    LUZ.ceuDir = norm([0.4, 0.45, 1]);   // a janela fica atrás e à direita do módulo: a luz do céu chega por trás, de cima
    const M = MUNDO.modulo;
    // a chave: uma poça em volta do módulo (como o cone do abajur do hero, recentrado), que some depressa para cima
    // (o ar-condicionado fica fora dela) e mais devagar para baixo; fora dela, 10% da força
    LUZ.pontos = [{ pos: MUNDO.chave.pos, cor: mix(FLD, LMP, 0.15), k: MUNDO.chave.k, alcance: 1e7, grupo: 'chave',
      mascara: p => 0.1 + 0.9 * Math.exp(-Math.pow((p[0] - M.x) / 40, 2) - Math.pow((p[1] - M.y - 2) / (p[1] < M.y + 2 ? 18 : 12), 2)) }];
    LUZ.LK = 1;
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
  // a cidade é vista pela janela, que fica abaixo da altura da câmera: para a linha do horizonte cair na faixa da
  // janela (o mundo do hero: céu de hora azul, torres e a cidade baixa), a câmera da cidade fica nivelada, com o
  // horizonte na altura cidadeY do quadro (com a elevação p = atan((cidadeY − cy) / F), o horizonte cai em cy + F tg p).
  // cidadeDx desloca a cidade de lado (a deriva do loop)
  function camCidade(cam, o) {
    const yaw = Math.atan2(cam.f[0], cam.f[2]), cy = cam.H / 2 + (o.shiftY || 0), p = Math.atan((o.cidadeY - cy) / o.F);
    const d = [Math.sin(yaw) * Math.cos(p), Math.sin(p), Math.cos(yaw) * Math.cos(p)];
    return makeCam({ W: cam.W, H: cam.H, pos: cam.pos, target: add(cam.pos, mul(d, 100)), F: o.F, shiftY: o.shiftY, shiftX: o.cidadeDx || 0 });
  }
  function cidade(cam0, o) {
    const cam = camCidade(cam0, o), { W, H } = cam; const cv = layer(W, H), c = cv.getContext('2d'), S = SKY();
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

  // ---------------- parede, vão da janela e quadro (por pixel; o vidro fica transparente) ----------------
  // o giz apagado (em cm, no plano da parede): um véu fraco e as passadas do apagador, moles, com os fios do feltro ao
  // longo delas e um pouco mais de pó na borda de cima (onde o arrasto termina). Nada que leia como escrita
  function giz(x, y) {
    let g = 0.1;
    for (const [xc, yc, L, fl, inc, e, I] of MUNDO.quadro.passadas) {
      const dx = x - xc, t = dx / L; if (Math.abs(t) > 1) continue;
      const dy = y - (yc + inc * dx + fl * (1 - t * t));
      const corte = sstep(-e / 2 - 0.9, -e / 2 + 0.9, dy) * (1 - sstep(e / 2 - 0.9, e / 2 + 0.9, dy));
      const longo = sstep(-1, -0.72, t) * (1 - sstep(0.7, 1, t));
      const fios = 0.82 + 0.18 * Math.sin(dy * 7.5 + Math.sin(dx * 0.35) * 1.2);
      const borda = 1 + 0.3 * Math.exp(-Math.pow((dy - e / 2 + 0.35) / 0.35, 2));
      g += I * corte * longo * fios * borda;
    }
    return g;
  }
  // a oclusão do ambiente sob a prateleira, no reboco: a chapa tira dele o teto e o céu (colada à chapa, some em ~12 cm)
  function ocPrateleira(x, y) {
    const Pr = MUNDO.prateleira, d = (Pr.y - Pr.e) - y; if (d < 0 || d > 12) return 0;
    return 0.45 * Math.pow(1 - d / 12, 1.5) * sstep(Pr.x0 - 4, Pr.x0 + 3, x) * (1 - sstep(Pr.x1 - 3, Pr.x1 + 4, x));
  }
  function basePass(cam, o) {
    const { W, H } = cam, cv = layer(W, H), ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), D = img.data;
    const pos = cam.pos, J = MUNDO.janela, Q = MUNDO.quadro, A = MUNDO.ar, wallA = MUNDO.parede.alb, R = rng(7);
    // o alumínio da moldura é anodizado escuro (com o claro de antes, a moldura e o caixilho faziam a perna e a
    // travessa de uma mesinha sob a prateleira); a luz fica num fio na aresta de cima (fiosFundo, depois do desfoque)
    const lsa = [26, 34, 42], alu = [84, 90, 100];
    for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
      const d = cam.ray(sx + 0.5, sy + 0.5); let col, a = 255;
      const t = -pos[2] / d[2], x = pos[0] + d[0] * t, y = pos[1] + d[1] * t;
      if (x > J.x0 && x < J.x1 && y > J.y0 && y < J.y1) {
        // dentro do vão: o vidro (transparente: a cidade) ou uma das faces do vão (o raio sai do retângulo antes do vidro)
        const tg = (J.vidro - pos[2]) / d[2], xg = pos[0] + d[0] * tg, yg = pos[1] + d[1] * tg;
        if (xg > J.x0 && xg < J.x1 && yg > J.y0 && yg < J.y1) { a = 0; col = [0, 0, 0]; }
        else {
          let s = 1, n = [0, 1, 0];
          const cruza = (v0, v1, lim, nn) => { if ((v0 - lim) * (v1 - lim) < 0) { const k = (lim - v0) / (v1 - v0); if (k < s) { s = k; n = nn; } } };
          cruza(x, xg, J.x0, [1, 0, 0]); cruza(x, xg, J.x1, [-1, 0, 0]); cruza(y, yg, J.y0, [0, 1, 0]); cruza(y, yg, J.y1, [0, -1, 0]);
          const p = [x + (xg - x) * s, y + (yg - y) * s, J.vidro * s];
          col = luz(wallA, p, n, { amb: 0.55, lk: o.paredeLk * 0.6 });
        }
      } else if (x > Q.x0 && x < Q.x1 && y > Q.y0 && y < Q.y1) {
        const m = Q.moldura, p = [x, y, -1];
        if (y > Q.y1 - m || x > Q.x1 - m) {
          // a moldura de alumínio: a aresta de cima pega a luz (a chave e o céu da janela)
          const n = y > Q.y1 - m ? norm([0, 0.55, -0.84]) : norm([0.5, 0, -0.87]);
          col = luz(alu, p, n, { amb: 0.5, lk: o.paredeLk * 1.2 });
        } else {
          // o quadro: lousa escura e fosca, com o giz apagado (passadas largas de apagador, nada que leia como escrita)
          col = luz(lsa, p, [0, 0, -1], { lk: o.paredeLk * 0.8 });
          col = add(col, mul([1, 1.03, 1.08], giz(x, y) * o.giz + (R() - 0.5) * 1.2));
        }
      } else {
        col = luz(wallA, [x, y, 0], [0, 0, -1], { lk: o.paredeLk });
        // a sombra mole do ar-condicionado no reboco logo abaixo dele (a chave vem de cima e da frente)
        if (y < A.y && x > A.x0 - 6 && x < A.x1 + 6) col = mul(col, 1 - o.sombraAr * sstep(A.y - 26, A.y - 4, y) * sstep(A.x0 - 6, A.x0 + 4, x) * (1 - sstep(A.x1 - 2, A.x1 + 8, x)));
        col = mul(col, 1 - ocPrateleira(x, y));
        const g = (R() - 0.5) * 1.6; col = add(col, [g, g, g * 1.05]);
      }
      const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
  // os caixilhos de alumínio da basculante, no plano do vidro: o quadro, a travessa do meio e os montantes. Vão por baixo
  // do passe da parede (que é transparente só no vidro): a quina da parede esconde o caixilho da esquerda, como deve
  function caixilhos(ctx, cam, o) {
    const J = MUNDO.janela, P = cam.P, z = J.vidro - 0.5, e = J.perfil, alu = [84, 92, 104];
    const barra = (x0, x1, y0, y1, n) => { const q = [[x0, y1, z], [x1, y1, z], [x1, y0, z], [x0, y0, z]].map(P); path(ctx, q);
      ctx.fillStyle = rgba(luz(alu, [(x0 + x1) / 2, (y0 + y1) / 2, z], n, { amb: 0.55, wk: 0.2, lk: o.paredeLk * 0.5 })); ctx.fill(); };
    barra(J.x0, J.x1, J.y1 - e, J.y1, [0, -0.3, -1]); barra(J.x0, J.x1, J.y0, J.y0 + e, [0, 0.5, -1]);
    for (const y of J.travessas) barra(J.x0, J.x1, y - e / 2, y + e / 2, [0, 0.4, -1]);
    for (const x of [J.x0, ...J.montantes, J.x1 - e]) barra(x, x + (x === J.x0 || x === J.x1 - e ? e : e * 1.2), J.y0, J.y1, [0.3, 0, -1]);
    // a aresta de baixo de cada folha da basculante pega o céu (um fio claro e fino)
    ctx.strokeStyle = rgba(mix(C.n300, C.n400, 0.5), 0.2); ctx.lineWidth = Math.max(1, cam.S([0, 0, z]) * 0.12);
    for (const y of [J.y0 + e, ...J.travessas.map(v => v + e / 2)]) { const a1 = P([J.x0, y, z]), a2 = P([J.x1, y, z]); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
  }
  // sombras da prateleira e do módulo (a chave) na parede e no caixilho: projeções no plano da parede, desfocadas
  function sombrasParede(ctx, cam, o) {
    const L = MUNDO.chave.pos, Pr = MUNDO.prateleira, P = cam.P;
    const proj = p => { const d = norm(sub(p, L)), t = (0 - p[2]) / d[2]; return P(add(p, mul(d, t))); };
    const pts = []; for (const x of [Pr.x0, Pr.x1]) for (const z of [0, -Pr.d]) for (const y of [Pr.y - Pr.e, Pr.y + MUNDO.modulo.h]) pts.push([x, y, z]);
    const sh = layer(cam.W, cam.H), s = sh.getContext('2d'), k = cam.S([MUNDO.modulo.x, Pr.y, 0]);
    s.filter = `blur(${Math.round(k * 1.2)}px)`; s.fillStyle = `rgba(0,0,0,${o.sombraPrat})`; path(s, hull(pts.map(proj))); s.fill();
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(sh, 0, 0); ctx.restore();
  }
  // depois do desfoque do fundo: o fio de luz na aresta de cima da moldura do quadro (o perfil boleado pega a chave;
  // mais forte perto da poça do módulo) e o degrau escuro de 1 px entre a moldura e a lousa (a moldura de 2,4 cm só se
  // lê como faixa com ele). A moldura em si fica escura
  function fiosFundo(ctx, cam, o) {
    const Q = MUNDO.quadro, P = cam.P, a1 = P([Math.max(Q.x0, -45), Q.y1 - 0.05, 0]), a2 = P([Q.x1, Q.y1 - 0.05, 0]), c = mix(C.n300, C.n200, 0.3);
    ctx.save(); ctx.filter = 'blur(0.6px)'; ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(c, 0)], [0.55, rgba(c, o.fioQuadro * 0.6)], [0.85, rgba(c, o.fioQuadro)], [1, rgba(c, o.fioQuadro * 0.7)]]);
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
    const m = Q.moldura, b1 = P([Math.max(Q.x0, -45), Q.y1 - m, 0]), b2 = P([Q.x1 - m, Q.y1 - m, 0]), b3 = P([Q.x1 - m, Q.y0, 0]);
    ctx.filter = 'blur(0.4px)'; ctx.strokeStyle = rgba(C.black, o.degrauQuadro); ctx.lineWidth = 1; ctx.lineJoin = 'miter';
    ctx.beginPath(); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b3[0], b3[1]); ctx.stroke(); ctx.restore();
  }

  // ---------------- o ar-condicionado (genérico: sem marca, sem display; desligado, aleta fechada) ----------------
  function perfilAr() {
    const A = MUNDO.ar, pr = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8 * Math.PI / 2; pr.push([A.d - 3 + 3 * Math.sin(t), A.h - 3 + 3 * Math.cos(t)]); }   // canto de cima
    for (let i = 1; i <= 24; i++) { const h = A.h - 3 - (A.h - 10) * i / 24; pr.push([A.d + 0.5 * Math.sin(Math.PI * i / 24), h]); }   // frente abaulada
    for (let i = 1; i <= 30; i++) { const t = i / 30 * Math.PI / 2; pr.push([A.d - 7 + 7 * Math.cos(t), 7 - 7 * Math.sin(t)]); }      // canto de baixo
    pr.push([0, 0]);
    return pr;   // [d (da parede para a sala), h (da base para cima)]
  }
  // a sombra do ar na luz da chave: o ar tem 20 cm de fundo e fica 7 cm acima do tampo, e o raio que vai do fundo do
  // tampo (e da faixa de trás da chapa) até a chave passa por dentro do canto de baixo dele. folgaAr(p) é a folga, em
  // cm, entre esse raio e o canto de baixo (raio 7 cm), no corte (d, h) do aparelho: positiva, o raio passa por baixo
  // e pela frente com essa margem; negativa, atravessa o ar. A chave é larga (a porta do corredor): a penumbra é mole
  function folgaAr(p) {
    const A = MUNDO.ar, L = MUNDO.chave.pos, pd = -p[2], ph = p[1] - A.y;
    let dd = -L[2] - pd, dh = L[1] - A.y - ph; const l = Math.hypot(dd, dh); dd /= l; dh /= l;
    const cd = A.d - 7 - pd, ch = 7 - ph, cr = cd * dh - ch * dd, tc = (cd * dd + ch * dh) / l, xc = p[0] + (L[0] - p[0]) * tc;
    // fora das pontas do aparelho, o raio passa livre
    const dentroX = sstep(A.x0 - 2, A.x0 + 2, xc) * (1 - sstep(A.x1 - 2, A.x1 + 2, xc));
    return -cr - 7 + (1 - dentroX) * 20;
  }
  // o fator da chave em p: 1 com folga, o piso no fundo da sombra ([piso, folga0, folga1] = o.sombraTampo)
  function sombraArChave(p, o) { const [piso, f0, f1] = o.sombraTampo; return piso + (1 - piso) * sstep(f0, f1, folgaAr(p)); }

  function arCondicionado(ctx, cam, o) {
    const A = MUNDO.ar, P = cam.P, pr = perfilAr(), W3 = (x, d, h) => [x, A.y + h, -d];
    // o painel da frente, a aleta (entre as duas fendas) e, abaixo da fenda de baixo, o fundo do chassi, um pouco mais escuro
    const alb = [192, 198, 208], albAleta = [184, 190, 200], albBaixo = [164, 170, 180];
    const k = { amb: o.arAmb, lk: o.arLk, wk: 0.3 };
    // normais do perfil: por segmento e, nos vértices, a média das duas vizinhas (o sombreado desliza sem degraus)
    const nSeg = [];
    for (let i = 0; i < pr.length - 1; i++) { const [d0, h0] = pr[i], [d1, h1] = pr[i + 1], nd = h0 - h1, nh = d1 - d0, nl = Math.hypot(nd, nh); nSeg.push([0, nh / nl, -nd / nl]); }
    const nVert = i => norm(add(nSeg[Math.max(0, i - 1)], nSeg[Math.min(nSeg.length - 1, i)]));
    const xm = MUNDO.modulo.x, segs = [];
    // o rebatido da poça: a chapa, o módulo e a parede logo abaixo, acesos pela chave, devolvem um pouco de luz para a
    // barriga do ar (as faces que olham para baixo; cresce com −n_y). Sem ele, a curva de baixo (a silhueta, o que diz
    // "split") fica escura e sem forma
    const corChave = LUZ.pontos[0].cor, rebate = (a, n) => a.map((v, i) => v * corChave[i] * o.arRebate * Math.max(0, -n[1]));
    for (let i = 0; i < pr.length - 1; i++) {
      const [d0, h0] = pr[i], [d1, h1] = pr[i + 1], n = nSeg[i], dm = (d0 + d1) / 2, hm = (h0 + h1) / 2;
      if (dot(n, sub(cam.pos, W3(A.x1 - 10, dm, hm))) <= 0) continue;
      const aleta = hm < 2.95 && hm > 1.3, a = aleta ? albAleta : hm <= 1.3 ? albBaixo : alb;
      segs.push({ d0, h0, d1, h1, n, aleta, c0: luz(a, W3(xm, d0, h0), nVert(i), k), c1: luz(a, W3(xm, d1, h1), nVert(i + 1), k),
        r0: rebate(a, nVert(i)), r1: rebate(a, nVert(i + 1)) });
    }
    const corpo = layer(cam.W, cam.H), c = corpo.getContext('2d'), reb = layer(cam.W, cam.H), rc = reb.getContext('2d');
    for (const s of segs) {
      const q = [W3(A.x0, s.d0, s.h0), W3(A.x1, s.d0, s.h0), W3(A.x1, s.d1, s.h1), W3(A.x0, s.d1, s.h1)].map(P);
      const g = lin(c, P(W3(xm, s.d0, s.h0)), P(W3(xm, s.d1, s.h1)), [[0, rgba(s.c0)], [1, rgba(s.c1)]]);
      path(c, q); c.fillStyle = g; c.fill(); c.strokeStyle = g; c.lineWidth = 0.8; c.stroke();
      const gr = lin(rc, P(W3(xm, s.d0, s.h0)), P(W3(xm, s.d1, s.h1)), [[0, rgba(s.r0)], [1, rgba(s.r1)]]);
      path(rc, q); rc.fillStyle = gr; rc.fill(); rc.strokeStyle = gr; rc.lineWidth = 0.8; rc.stroke();
    }
    // o rebatido segue a poça ao longo do comprimento (a máscara da chave em x, a de prepLuz) e soma ao corpo
    { const xs = [-40, -25, -15, -8, -4, 0, 4], pts = xs.map(x => P(W3(x, A.d - 3, 2))), x0 = pts[0][0], x1 = pts[pts.length - 1][0];
      rc.save(); rc.globalCompositeOperation = 'destination-in';
      rc.fillStyle = lin(rc, [x0, 0], [x1, 0], xs.map((x, i) => [(pts[i][0] - x0) / (x1 - x0), `rgba(0,0,0,${Math.exp(-Math.pow((x - xm) / 40, 2)).toFixed(3)})`]));
      rc.fillRect(0, 0, cam.W, cam.H); rc.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(reb, 0, 0); c.restore(); }
    const sil = hull(segs.flatMap(s => [W3(A.x0, s.d0, s.h0), W3(A.x1, s.d0, s.h0), W3(A.x1, s.d1, s.h1), W3(A.x0, s.d1, s.h1)].map(P)));
    // ao longo do comprimento: a poça da chave fica em volta do módulo, e o aparelho escurece para a esquerda
    { c.save(); path(c, sil); c.clip(); const xl = P(W3(xm - 34, A.d, 4)), xr = P(W3(xm, A.d, 4));
      c.fillStyle = lin(c, [xl[0], 0], [xr[0], 0], [[0, rgba(C.black, o.arEsq)], [1, rgba(C.black, 0)]]); c.fillRect(0, 0, cam.W, cam.H);
      // e na altura: a luz cresce para baixo (o rebatido), e o topo do quadro, longe da poça, fica um pouco mais escuro
      const yb = P(W3(xm, A.d - 7 + Math.sqrt(49 - 36), 1))[1];
      c.fillStyle = lin(c, [0, 0], [0, yb], [[0, rgba(C.black, 1 - o.arTopo)], [0.45, rgba(C.black, (1 - o.arTopo) * 0.4)], [1, rgba(C.black, 0)]]); c.fillRect(0, 0, cam.W, cam.H); c.restore(); }
    // a ponta direita arredondada: a frente escurece para dentro da curva e a aresta pega o céu da janela (contraluz):
    // um fio que segue o perfil da ponta, para a ponta não sumir contra o céu
    { c.save(); path(c, sil); c.clip();
      const e0 = P(W3(A.x1 - 4.5, A.d, A.h / 2)), e1 = P(W3(A.x1, A.d, A.h / 2));
      c.fillStyle = lin(c, [e0[0], 0], [e1[0], 0], [[0, rgba(C.black, 0)], [0.7, rgba(C.black, 0.28)], [1, rgba(C.black, 0.5)]]); c.fillRect(0, 0, cam.W, cam.H);
      c.restore();
      const hs = [], cor = mix(C.n300, C.n200, 0.7); for (let h = 6; h >= 0.6; h -= 0.3) hs.push(h);
      const pf = hs.map(h => P(W3(A.x1 - 0.15, A.d - 7 + Math.sqrt(Math.max(0, 49 - Math.pow(7 - h, 2))) - 0.1, h)));
      c.beginPath(); pf.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.strokeStyle = lin(c, pf[0], pf[pf.length - 1], [[0, rgba(cor, 0.2)], [0.45, rgba(cor, o.arPonta)], [0.85, rgba(cor, o.arPonta * 0.8)], [1, rgba(cor, 0.1)]]);
      c.lineWidth = Math.max(2, cam.S(W3(A.x1, A.d, 3)) * 0.08); c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
    // a aleta fechada (estreita: as duas fendas entram no quadro): a fenda escura em cima dela e o lábio de baixo, que
    // pega um fio de luz; não vai até as pontas. Duas linhas paralelas numa barra clara e arredondada: a assinatura do split
    { const ponto = h => { let best = pr[0]; for (const p of pr) if (Math.abs(p[1] - h) < Math.abs(best[1] - h) && p[0] > 8) best = p; return best; };
      const linha = (h, cor, lw) => { const [d] = ponto(h), a1 = P(W3(A.x0 + 5, d + 0.05, h)), a2 = P(W3(A.x1 - 5, d + 0.05, h)); c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); c.strokeStyle = cor; c.lineWidth = Math.max(1, cam.S(W3(0, d, h)) * lw); c.stroke(); };
      linha(3.0, rgba(C.black, 0.55), 0.18); linha(2.75, rgba(C.n300, 0.08), 0.08); linha(1.3, rgba(C.black, 0.45), 0.14); linha(1.6, rgba(C.n300, 0.16), 0.08);
      // o painel da frente: uma junta fina, a ~5 cm do topo (sem grade, sem logo, sem display)
      linha(A.h - 5.2, rgba(C.black, 0.25), 0.08); }
    // a frente do ar fica ~12 cm mais perto da câmera que o módulo: um pouco fora de foco (o módulo é o mais nítido)
    ctx.save(); ctx.filter = `blur(${o.arBlur}px)`; ctx.drawImage(corpo, 0, 0); ctx.restore();
    return segs;
  }

  // ---------------- a prateleirinha (chapa dobrada escura, presa na parede por trás) ----------------
  function prateleira(ctx, cam, o) {
    const Pr = MUNDO.prateleira, P = cam.P, alb = [34, 39, 48], y0 = Pr.y - Pr.e, y1 = Pr.y;
    const face = (pts, n, esc = 1) => { const q = pts.map(P); path(ctx, q); const c = mul(luz(alb, mul(pts.reduce((a, p) => add(a, p), [0, 0, 0]), 1 / pts.length), n, { amb: 0.9 }), esc); ctx.fillStyle = rgba(c); ctx.fill(); ctx.strokeStyle = rgba(c); ctx.lineWidth = 0.6; ctx.stroke(); };
    const xm = MUNDO.modulo.x;
    face([[Pr.x0, y0, -Pr.d], [Pr.x1, y0, -Pr.d], [Pr.x1, y1, -Pr.d], [Pr.x0, y1, -Pr.d]], [0, 0, -1], 0.85);   // a borda da frente
    face([[Pr.x0, y0, 0], [Pr.x0, y0, -Pr.d], [Pr.x0, y1, -Pr.d], [Pr.x0, y1, 0]], [-1, 0, 0], 0.7);             // a borda da esquerda
    const tampo = [[Pr.x0, y1, 0], [Pr.x1, y1, 0], [Pr.x1, y1, -Pr.d], [Pr.x0, y1, -Pr.d]];
    face(tampo, [0, 1, 0]);                                                                                       // o tampo
    // a sombra do ar na chave (a mesma do tampo do módulo): a faixa de trás, junto da parede, fica com ~0,75 da chave.
    // Um véu escuro que tira de cada ponto a fração da chave que o ar esconde
    { const c1 = luz(alb, [xm, y1, -Pr.d / 2], [0, 1, 0], { amb: 0.9 }), c0 = luz(alb, [xm, y1, -Pr.d / 2], [0, 1, 0], { amb: 0.9, lk: 0 });
      const fk = (c1[0] + c1[1] + c1[2] - c0[0] - c0[1] - c0[2]) / (c1[0] + c1[1] + c1[2]), zs = [0, -2, -4, -6, -8, -10, -12];
      ctx.save(); path(ctx, tampo.map(P)); ctx.clip();
      ctx.fillStyle = lin(ctx, P([xm, y1, 0]), P([xm, y1, -12]), zs.map(z => [-z / 12, rgba(C.black, fk * (1 - sombraArChave([xm, y1, z], o)))]));
      ctx.fillRect(0, 0, cam.W, cam.H); ctx.restore(); }
    // presa na parede: o canto entre o tampo e a parede escurece (oclusão, ~3 cm) e um vinco de contato corre pela
    // aresta de trás, dos dois lados dela
    { ctx.save(); path(ctx, tampo.map(P)); ctx.clip(); ctx.fillStyle = lin(ctx, P([xm, y1, 0]), P([xm, y1, -3]), [[0, rgba(C.black, 0.3)], [1, rgba(C.black, 0)]]);
      ctx.fillRect(0, 0, cam.W, cam.H); ctx.restore();
      const a1 = P([Pr.x0, y1, 0]), a2 = P([Pr.x1, y1, 0]);
      ctx.save(); ctx.filter = 'blur(1px)'; ctx.strokeStyle = rgba(C.black, 0.5); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); ctx.restore(); }
    // a aresta da frente pega a chave: um fio claro
    { const a1 = P([Pr.x0, y1, -Pr.d]), a2 = P([Pr.x1, y1, -Pr.d]); ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.n300, 0.28)], [1, rgba(C.n400, 0.1)]]); ctx.lineWidth = Math.max(1, cam.S([xm, y1, -Pr.d]) * 0.1); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
  }

  // ---------------- o módulo ----------------
  function geoModulo() {
    const M = MUNDO.modulo, fr = frameOf(M), t = M.rot * RAD, c = Math.cos(t), s = Math.sin(t);
    const Rn = ([u, h, v]) => [u * c - v * s, h, u * s + v * c];
    const at = (u, h, v) => fr(u, h, v);
    return { M, fr, at, Rn };
  }
  // segmentos do contorno (cantos redondos) com a normal para fora, em (u, v)
  function contorno(w, r, n) {
    const pts = rrect(w, w, r, n), segs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) continue;
      let nu = b[1] - a[1], nv = -(b[0] - a[0]); const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (nu * m[0] + nv * m[1] < 0) { nu = -nu; nv = -nv; } const l = Math.hypot(nu, nv);
      segs.push({ a, b, m, n: [nu / l, 0, nv / l] });
    }
    return { pts, segs };
  }
  // os segmentos que passam no filtro, em sequência contígua (a lista é circular: a sequência pode dar a volta)
  function cadeia(segs, ok) {
    const n = segs.length, f = segs.map(ok); if (f.every(Boolean)) return segs.slice();
    const i0 = f.findIndex((v, i) => v && !f[(i - 1 + n) % n]); if (i0 < 0) return [];
    const r = []; for (let k = 0; k < n && f[(i0 + k) % n]; k++) r.push(segs[(i0 + k) % n]); return r;
  }
  function sombraModulo(ctx, cam, o) {
    const { M, at } = geoModulo(), L = MUNDO.chave.pos, P = cam.P, yS = MUNDO.prateleira.y;
    const { pts } = contorno(M.w, M.r, 4);
    const proj = p => { const d = norm(sub(p, L)), t = (yS - p[1]) / d[1]; return P(add(p, mul(d, t))); };
    const sh = layer(cam.W, cam.H), s = sh.getContext('2d'), k = cam.S(at(0, 0, 0));
    s.filter = `blur(${Math.round(k * 0.5)}px)`; s.fillStyle = `rgba(0,0,0,${o.sombraChave})`; path(s, hull(pts.flatMap(([u, v]) => [proj(at(u, M.h, v)), P(at(u, 0, v))]))); s.fill();
    // contato: o rodapé é recuado, então a sombra encosta por baixo da borda inteira: fina e firme (a fresta da base
    // flutuante é uma linha entre a caixa clara e a chapa, não um halo)
    s.filter = `blur(${(k * 0.03).toFixed(2)}px)`; s.fillStyle = `rgba(0,0,0,${o.contato})`; path(s, pts.map(([u, v]) => P(at(u * 0.96, 0, v * 0.96)))); s.fill();
    ctx.drawImage(sh, 0, 0);
  }
  // a entrada do raio (u, v) + t (du, dv) no quadrado de meio lado a e cantos de raio r (o contorno do módulo, visto de
  // cima): [t, nu, nv] com a normal para fora, ou null. É o menor t positivo entre os quatro lados retos e os quatro arcos
  function entra(pu, pv, du, dv, a, r) {
    const b = a - r; let best = null;
    const tenta = (t, nu, nv) => { if (t > 0 && (!best || t < best[0])) best = [t, nu, nv]; };
    for (const sg of [1, -1]) {
      if (du) { const t = (sg * a - pu) / du; if (Math.abs(pv + t * dv) <= b) tenta(t, sg, 0); }
      if (dv) { const t = (sg * a - pv) / dv; if (Math.abs(pu + t * du) <= b) tenta(t, 0, sg); }
    }
    const A = du * du + dv * dv;
    for (const cu of [b, -b]) for (const cv of [b, -b]) {
      const ou = pu - cu, ov = pv - cv, B = ou * du + ov * dv, disc = B * B - A * (ou * ou + ov * ov - r * r); if (disc < 0) continue;
      const sq = Math.sqrt(disc);
      for (const t of [(-B - sq) / A, (-B + sq) / A]) { const u = pu + t * du - cu, v = pv + t * dv - cv; if (u * cu >= 0 && v * cv >= 0) tenta(t, u / r, v / r); }
    }
    return best;
  }
  const dentro = (u, v, a, r) => { const qu = Math.max(Math.abs(u) - (a - r), 0), qv = Math.max(Math.abs(v) - (a - r), 0); return Math.abs(u) <= a && Math.abs(v) <= a && qu * qu + qv * qv <= r * r; };
  function modulo(ctx, cam, o) {
    const { M, at, Rn } = geoModulo(), P = cam.P, sc = cam.S(at(0, M.h / 2, 0));
    const alb = [62, 68, 78];                 // PLA cinza-ardósia fosco (o tom do hardware da série)
    const light = (p, n, k) => luz(alb, p, n, k);
    const vis = (n, p) => dot(Rn(n), sub(cam.pos, p)) > 0;
    const { segs, pts } = contorno(M.w, M.r, 20), visiveis = cadeia(segs, s => vis(s.n, at(s.m[0], M.h / 2, s.m[1])));
    const cF = light(at(0, M.h, -M.w / 2), [0, 1, 0], { wk: 0.6 }), cB = light(at(0, M.h, M.w / 2), [0, 1, 0], { wk: 1 });
    // 1-3. o rodapé, as paredes e as linhas de camada, por pixel: o raio da câmera contra o prisma de cantos redondos,
    //    nas coordenadas do módulo, com 4 x 4 amostras por pixel. Cada amostra tem a normal exata do contorno (o canto
    //    de raio 2 cm degrada sem degrau) e as camadas são uma função da altura (as amostras fazem o filtro: sem moiré)
    { const t = M.rot * RAD, c = Math.cos(t), s = Math.sin(t), toL = d => [d[0] * c + d[2] * s, d[1], -d[0] * s + d[2] * c];
      const o0 = toL(sub(cam.pos, [M.x, M.y, M.z])), a = M.w / 2, af = a - M.recuo, rf = M.r - M.recuo * 0.6;
      const N = M.camadas, ph = (M.h - M.pe) / N, SS = 4;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [u, v] of rrect(M.w, M.w, M.r, 6)) for (const h of [0, M.h]) { const q = P(at(u, h, v)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; const Wb = Math.ceil(x1) + 2 - x0, Hb = Math.ceil(y1) + 2 - y0;
      const cv = layer(Wb, Hb), cx = cv.getContext('2d'), img = cx.createImageData(Wb, Hb), D = img.data;
      // a parede: a frente sobe alguns valores (o reflexo da sala no PLA fosco), mais clara em cima (oclusão perto da base)
      const parede = (u, h, v, nu, nv) => {
        const nW = Rn([nu, 0, nv]), fv = mul([1, 1, 1.1], (o.face || 0) * Math.max(0, -nW[2]));
        const cTop = add(light(at(u, M.h, v), nW), fv), cBot = add(mul(light(at(u, M.pe, v), nW, { lk: 0.7 }), 0.78), mul(fv, 0.8));
        let col = mix(cBot, cTop, (h - M.pe) / (M.h - M.pe));
        // as linhas de camada da impressão 3D: a cada passo, um sulco escuro e, logo acima, a crista que pega a luz (a
        // normal da crista inclina para cima: a luz de cima e a contraluz da janela riscam cada camada)
        const q = (h - M.pe) / ph, k = Math.round(q), kc = Math.floor(q);
        if (k >= 1 && k < N) col = mix(col, C.black, o.sulco * Math.exp(-Math.pow((q - k) / 0.11, 2)));
        if (kc >= 1 && kc < N) { const cr = Math.exp(-Math.pow((q - kc - 0.45) / 0.09, 2));
          if (cr > 0.01) col = mix(col, mix(light(at(u, M.pe + (kc + 0.45) * ph, v), norm(add(nW, [0, 0.9, 0])), { amb: 0.6 }), C.n300, 0.25), o.crista * cr); }
        return col;
      };
      for (let py = 0; py < Hb; py++) for (let px = 0; px < Wb; px++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
          const d = toL(cam.ray(x0 + px + (i + 0.5) / SS, y0 + py + (j + 0.5) / SS)), e = entra(o0[0], o0[2], d[0], d[2], a, M.r); if (!e) continue;
          const h = o0[1] + e[0] * d[1]; let col;
          if (h > M.h) {
            // passa por cima da parede: o tampo (que vem depois, com o degradê) ou nada
            const tt = (M.h - o0[1]) / d[1]; if (!dentro(o0[0] + tt * d[0], o0[2] + tt * d[2], a, M.r)) continue; col = mul(cF, 1.06);
          } else if (h >= M.pe) col = parede(o0[0] + e[0] * d[0], h, o0[2] + e[0] * d[2], e[1], e[2]);
          else {
            // passa por baixo da parede: o rodapé recuado (a "base flutuante"), escuro, quase sem luz; ou a chapa (nada)
            const f = entra(o0[0], o0[2], d[0], d[2], af, rf); if (!f) continue; const hf = o0[1] + f[0] * d[1]; if (hf < 0) continue;
            const uf = o0[0] + f[0] * d[0], vf = o0[2] + f[0] * d[2];
            col = mul(light(at(uf, hf, vf), Rn([f[1], 0, f[2]]), { amb: 0.5, lk: 0.15 }), 0.45);
          }
          r += col[0]; g += col[1]; b += col[2]; n++;
        }
        if (!n) continue; const k = (py * Wb + px) * 4; D[k] = r / n; D[k + 1] = g / n; D[k + 2] = b / n; D[k + 3] = 255 * n / (SS * SS);
      }
      cx.putImageData(img, 0, 0); ctx.drawImage(cv, x0, y0); }
    // a fresta do rodapé: a borda de baixo da parede faz sombra sobre o rodapé recuado
    { ctx.beginPath(); visiveis.forEach((s, i) => { const p = P(at(s.a[0], M.pe, s.a[1])); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      const l = visiveis[visiveis.length - 1], pl = P(at(l.b[0], M.pe, l.b[1])); ctx.lineTo(pl[0], pl[1]);
      ctx.strokeStyle = rgba(C.black, 0.7); ctx.lineWidth = Math.max(1, sc * 0.09); ctx.lineJoin = 'round'; ctx.stroke(); }
    // 4. o tampo: plano, mais claro na frente (a chave), com a borda de trás em contraluz (o céu da janela). Por pixel: o
    //    degradê de antes (da frente para o fundo, em diagonal), com a parte da chave apagada pela sombra do ar ao longo
    //    da profundidade (sombraArChave: 1 na faixa da frente, o piso na aresta de trás). Sem ela, o tampo liso e claro
    //    puxava o PLA ardósia para alumínio prateado
    { const top = pts.map(([u, v]) => P(at(u, M.h, v)));
      const pf = P(at(-M.w * 0.35, M.h, -M.w * 0.35)), pb = P(at(M.w * 0.35, M.h, M.w * 0.35));
      const cF0 = light(at(0, M.h, -M.w / 2), [0, 1, 0], { wk: 0.6, lk: 0 }), cB0 = light(at(0, M.h, M.w / 2), [0, 1, 0], { wk: 1, lk: 0 });
      const grad = (t, f, b) => t < 0.6 ? mix(mul(f, 1.06), mix(f, b, 0.5), t / 0.6) : mix(mix(f, b, 0.5), mul(b, 0.9), (t - 0.6) / 0.4);
      const gx = pb[0] - pf[0], gy = pb[1] - pf[1], g2 = gx * gx + gy * gy, yt = M.y + M.h;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const q of top) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; const Wt = Math.ceil(x1) + 1 - x0, Ht = Math.ceil(y1) + 1 - y0;
      const cv = layer(Wt, Ht), cx = cv.getContext('2d'), img = cx.createImageData(Wt, Ht), D = img.data;
      for (let py = 0; py < Ht; py++) for (let px = 0; px < Wt; px++) {
        const sx = x0 + px + 0.5, sy = y0 + py + 0.5, t = clamp(((sx - pf[0]) * gx + (sy - pf[1]) * gy) / g2, 0, 1);
        const d = cam.ray(sx, sy), tt = (yt - cam.pos[1]) / d[1], pw = [cam.pos[0] + d[0] * tt, yt, cam.pos[2] + d[2] * tt];
        const b0 = grad(t, cF0, cB0), col = add(b0, mul(sub(grad(t, cF, cB), b0), sombraArChave(pw, o)));
        const k = (py * Wt + px) * 4; D[k] = col[0]; D[k + 1] = col[1]; D[k + 2] = col[2]; D[k + 3] = 255;
      }
      cx.putImageData(img, 0, 0); cx.globalCompositeOperation = 'destination-in'; cx.translate(-x0, -y0); path(cx, top); cx.fillStyle = '#000'; cx.fill();
      ctx.drawImage(cv, x0, y0);
      // o hexágono da Strukti em baixo-relevo: o fundo 5% mais escuro que o tampo em volta; a parede de dentro do lado de
      // trás olha para a câmera e para a chave (um fio claro, logo para dentro da aresta); a aresta da frente faz o vinco
      // escuro (a parede de dentro dela não aparece). O fundo e o fio seguem o tom do tampo ali (a sombra do ar)
      { const hc = at(0.4, M.h, 0.6), ru = mul(Rn([1, 0, 0]), 1.25), rv = mul(Rn([0, 0, 1]), 1.25);
        discT(ctx, cam, hc, ru, rv); const hx = []; for (let i = 0; i < 6; i++) { const a = (i * 60 + 30) * RAD; hx.push([Math.cos(a), Math.sin(a)]); }
        path(ctx, hx); ctx.fillStyle = rgba(C.black, 0.05); ctx.fill();
        for (let i = 0; i < 6; i++) { const p = hx[i], q = hx[(i + 1) % 6], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
          // (mx, my): onde fica a aresta no plano do tampo (+v é o fundo); a chave vem da frente-esquerda (-u, -v)
          const f = mx * 0.45 + my * 0.9; if (Math.abs(f) < 0.25) continue;
          ctx.beginPath(); ctx.save();
          if (f > 0) { ctx.moveTo(p[0] * 0.93, p[1] * 0.93); ctx.lineTo(q[0] * 0.93, q[1] * 0.93); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba([14, 14, 15], Math.min(1, f / 0.75)); ctx.lineWidth = 0.15; }
          else { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = rgba(C.black, 0.4 * Math.min(1, -f / 0.75)); ctx.lineWidth = 0.12; }
          ctx.stroke(); ctx.restore(); }
        ID(ctx); }
      // a aresta de cima (o boleado do tampo): um fio claro na esquerda e a contraluz fria atrás
      const borda = (filtro, cor, lw) => { const seq = cadeia(segs, s => filtro(Rn(s.n))); if (!seq.length) return;
        ctx.beginPath(); seq.forEach((s, i) => { const p = P(at(s.a[0], M.h, s.a[1])); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); const l = seq[seq.length - 1], pl = P(at(l.b[0], M.h, l.b[1])); ctx.lineTo(pl[0], pl[1]);
        ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1, sc * lw); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
      borda(n => n[2] > 0.25, rgba(mix(C.n300, C.n200, 0.4), 0.42), 0.07);
      borda(n => n[0] < -0.5 && n[2] < 0.2, rgba(C.n300, 0.22), 0.06); }
    // 5. o filete elétrico pelo contorno de cima da frente, de canto a canto, num traço só (o detalhe da caixa do Replay)
    { const fs = segs.filter(s => s.n[2] < -0.3 || (s.n[2] < 0 && Math.abs(s.n[0]) < 0.97)).filter(s => s.m[1] < -M.w / 2 + M.r * 0.75);
      fs.sort((p, q) => p.m[0] - q.m[0]);
      const pts2 = fs.map(s => P(at(s.a[0], M.h - 0.03, s.a[1]))).concat([P(at(fs[fs.length - 1].b[0], M.h - 0.03, fs[fs.length - 1].b[1]))]);
      pts2.sort((p, q) => p[0] - q[0]);
      ctx.beginPath(); pts2.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = lin(ctx, pts2[0], pts2[pts2.length - 1], [[0, rgba(C.e400, 0.1)], [0.3, rgba(C.e400, 0.75)], [0.78, rgba(C.e400, 0.6)], [1, rgba(C.e400, 0.08)]]);
      ctx.lineWidth = Math.max(1, sc * 0.11); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
    // 6. a janela de infravermelho: acrílico fumê, escuro e brilhante, na frente (v = -w/2)
    const F = (u, h) => at(u, h, -M.w / 2 - 0.02), jw = 5.0, jh = 1.05, jc = 1.72;
    const jan = rrect(jw, jh, 0.38, 5).map(([u, h]) => P(F(u, jc + h)));
    { path(ctx, jan); ctx.fillStyle = rgba([7, 11, 17]); ctx.fill();
      ctx.save(); path(ctx, jan); ctx.clip();
      const t0 = P(F(0, jc + jh / 2)), t1 = P(F(0, jc - jh / 2));
      ctx.fillStyle = lin(ctx, t0, t1, [[0, rgba(C.n300, 0.2)], [0.42, rgba(C.n300, 0.05)], [0.5, rgba(C.n300, 0)], [1, rgba(C.n300, 0.03)]]); ctx.fillRect(0, 0, cam.W, cam.H);
      // reflexo da janela da sala: uma faixa clara inclinada, fraca
      const r0 = P(F(-jw / 2 + 0.6, jc + jh / 2)), r1 = P(F(-jw / 2 + 1.6, jc - jh / 2));
      ctx.fillStyle = lin(ctx, r0, r1, [[0, rgba(C.n200, 0)], [0.45, rgba(C.n200, 0.1)], [0.55, rgba(C.n200, 0.1)], [1, rgba(C.n200, 0)]]); ctx.fillRect(0, 0, cam.W, cam.H);
      ctx.restore();
      path(ctx, jan); ctx.strokeStyle = rgba(C.n400, 0.3); ctx.lineWidth = Math.max(0.8, sc * 0.05); ctx.stroke(); }
    return { led: F(-1.35, jc), F, jc };
  }
  // o LED ciano atrás do acrílico: o único ponto ciano forte do quadro; clareia de leve a prateleira à frente
  function led(ctx, cam, info, o) {
    const k = o.ledK; if (!info || k <= 0) return; const P = cam.P, p = P(info.led), s = cam.S(info.led);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    glow(ctx, p, s * 3.2, C.c400, 0.1 * k);
    glow(ctx, p, s * 1.1, C.c500, 0.42 * k);
    ctx.fillStyle = rgba(mix(C.c300, C.c200, 0.3), 0.95 * k); ctx.beginPath(); ctx.ellipse(p[0], p[1], s * 0.19, s * 0.16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = rgba(C.white, 0.55 * k); ctx.beginPath(); ctx.ellipse(p[0], p[1], s * 0.08, s * 0.07, 0, 0, 7); ctx.fill();
    // a luz que o LED joga na prateleira, à frente da janela de infravermelho
    { const M = MUNDO.modulo, q = P(info.F(-1.35, -M.pe - 0.1)), q2 = P(add(info.led, [2.2, -MUNDO.modulo.pe - 1.6, -2.6]));
      ctx.save(); ctx.translate((q[0] + q2[0]) / 2, q2[1]); ctx.scale(s * 2.6, s * 0.9); ctx.fillStyle = radial(ctx, [[0, rgba(C.c500, 0.07 * k)], [1, rgba(C.c500, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }

  // ---------------- render ----------------
  function render(canvas, extra) {
    const o = Object.assign({}, CAM, extra || {});
    for (const k of ['grainBaixo', 'vigR', 'vigC', 'bottomFade', 'sombraTampo']) if (typeof o[k] === 'string') o[k] = o[k].split(',').map(Number);
    prepLuz(o); const cam = makeCam(o); const ctx = canvas.getContext('2d');
    // 1. o fundo: a cidade pela janela, a parede, o vão e o quadro, os caixilhos e as sombras, tudo desfocado
    const bg = layer(cam.W, cam.H), bx = bg.getContext('2d');
    bx.drawImage(cidade(cam, o), 0, 0);
    // janelaK (padrão 1) escala o que se vê pelo vidro: com 0 a janela fica preta (a placa J0 do loop: N = cartão − J0)
    if (o.janelaK !== 1) { bx.fillStyle = `rgba(0,0,0,${1 - o.janelaK})`; bx.fillRect(0, 0, cam.W, cam.H); }
    bx.fillStyle = rgba(C.n950, o.vidroK); bx.fillRect(0, 0, cam.W, cam.H);   // o vidro escurece um pouco a rua
    if (o.so === 'cidade') { ctx.drawImage(bg, 0, 0); return { cam }; }
    caixilhos(bx, cam, o);
    const base = basePass(cam, o); sombrasParede(base.getContext('2d'), cam, o); bx.drawImage(base, 0, 0);
    ctx.drawImage(bg, 0, 0); ctx.filter = `blur(${o.fundoBlur}px)`; ctx.drawImage(bg, 0, 0); ctx.filter = 'none';
    fiosFundo(ctx, cam, o);
    if (o.so === 'fundo') return { cam };
    // 2. o ar-condicionado, a prateleira e o módulo
    arCondicionado(ctx, cam, o);
    prateleira(ctx, cam, o); sombraModulo(ctx, cam, o);
    const info = modulo(ctx, cam, o); led(ctx, cam, info, o);
    // 3. acabamento do hero
    K.acabamento(ctx, cam, o);
    return { cam };
  }
  // pontos do objeto principal (o módulo), para a sonda de enquadramento
  function objeto() { const { M, at } = geoModulo(), r = []; for (const [u, v] of rrect(M.w, M.w, M.r, 4)) for (const h of [0, M.h]) r.push(at(u, h, v)); return r; }
  // pontos de referência para a sonda de geometria
  function referencias() {
    const A = MUNDO.ar, J = MUNDO.janela, Q = MUNDO.quadro, xm = MUNDO.modulo.x;
    return { arBaseSobreModulo: [xm, A.y, -(A.d - 7)], arPontaDir: [A.x1, A.y + 1, -(A.d - 7 + Math.sqrt(49 - 36))], janelaBatente: [J.x0, MUNDO.prateleira.y, 0],
      quadroCanto: [Q.x1, Q.y1, 0], led: geoModulo().at(-1.35, 1.72, -MUNDO.modulo.w / 2), horizonte: [CAM.pos[0], CAM.pos[1], 1e6] };
  }
  G.CENA = { nome: 'air-central', render, CAM, MUNDO, objeto, referencias };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.CENA;
