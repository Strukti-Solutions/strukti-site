/* Cartão do Replay: a caixa do botão presa ao poste do alambrado de uma quadra vazia à noite, com a névoa
   dos refletores da quadra vizinha ao fundo e o LED ciano aceso (spec 2026-10-16 §6.2).
   A caixa é a do conceito do hero (scripts/hero-expansao/scene.js, drawBox): mesmas proporções
   (9,6 x 13 x 4,6 cm, raio 1,25), botão azul, hexágono, 4 parafusos, barra de LED ciano.
   Ilustração do conceito: nenhuma quadra, marca ou número real.
   Unidades: cm. O alambrado é o plano z = 0; a nossa quadra fica em z < 0 (onde está a câmera) e a
   quadra vizinha em z > 0. Camadas: fundo (desfocado) -> névoa -> alambrado e poste -> caixa -> acabamento. */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && typeof require !== 'undefined') ? require('../kit/cena.js') : G.KIT;
  const { C, rgba, mix, clamp, sub, add, mul, norm, len, rng, LUZ, luz, FLD, makeCam, frameOf, rrect, path, hull, discT, ID, radial, lin, layer, glow, disco, SKY } = K;

  // ---------------- mundo ----------------
  const MUNDO = {
    cerca: { z: 0, passo: 5.0, fio: 0.19 },                    // tela de losango de 5 cm, fio de 1,9 mm
    poste: { x: 0, z: -3.3, r: 3.0 },                          // tubo de 6 cm, do lado da quadra
    caixa: { x: 0, y: 113.5, z: -9.0, rot: 0, w: 9.6, d: 4.6, h: 13, r: 1.25 },   // y: base; frente para -z
    chapa: { w: 4.6, y0: 108.6, y1: 131.4, z: -6.45, d: 0.5 }, // chapa de fixação atrás da caixa
    abracadeiras: [109.6, 129.0],                              // duas cintas inox em volta do poste
    // a quadra vizinha (20 x 40 m, comprida para longe), com o alambrado dela e o gol do fundo
    vizinha: { x0: -1550, x1: 450, z0: 400, z1: 4400, cerca: 400, gol: { w: 300, h: 200 } },
    // refletores: cabeça em [x, y, z]; os da quadra vizinha iluminam o piso dela
    refletores: [
      // os 4 da quadra vizinha, nas laterais: os de perto ficam fora do quadro, os do fundo entram pelo alto
      { pos: [-1610, 950, 1400], alvo: [-700, 0, 1800] }, { pos: [510, 950, 1400], alvo: [-300, 0, 1800] },
      { pos: [-1610, 1250, 3400], alvo: [-700, 0, 3000] }, { pos: [510, 1250, 3400], alvo: [-300, 0, 3000] },
      // uma fileira de refletores de outra quadra, mais longe: as luzes que se veem (fora de foco)
      { pos: [-3200, 760, 6400], alvo: [-2800, 0, 5300], longe: true }, { pos: [-3850, 760, 6400], alvo: [-3300, 0, 5300], longe: true },
      { pos: [-1150, 760, 6400], alvo: [-1050, 0, 5300], longe: true }
    ],
    // a luz que cai sobre a caixa: um refletor da nossa quadra, alto, atrás e à esquerda da câmera
    chave: { pos: [-700, 950, -2400], k: 0.62 }
  };
  // câmera retrato 800 x 1200: a caixa a ~1/3 da altura, quase de frente (como no hero, ~20° de lado)
  const CAM = { W: 800, H: 1200, pos: [23, 121, -70], target: [0, 120, -9], F: 1200, shiftY: -180,
    fundoBlur: 8, fundoExp: 0.86, vig: 0.9, vigR: [0.18, 0.7], vigC: [0.5, 0.34], bottomFade: [0.5, 0.78, 1.0, 0.38, 0.62], bloom: 0.18, grain: 5, ledK: 0.85, nevoa: 1 };

  function prepLuz(o) {
    LUZ.ceuDir = norm([0, 1, 0.3]);    // céu de hora azul por cima (cena externa)
    const pts = [];
    // a chave: uma poça em volta da caixa, que cai para o chão e para o alto (como o cone do abajur do hero,
    // recentrado nos objetos); fora dela fica 12% da força
    pts.push({ pos: MUNDO.chave.pos, cor: FLD, k: MUNDO.chave.k, alcance: 1e7, mascara: p => 0.12 + 0.88 * Math.exp(-Math.pow((p[0] + 4) / 34, 2) - Math.pow((p[1] - 121) / (p[1] < 121 ? 30 : 40), 2)), grupo: 'chave' });
    for (const R of MUNDO.refletores) pts.push({ pos: R.pos, cor: FLD, k: R.longe ? 0.55 : 0.75, alcance: 950, eixo: norm(sub(R.alvo, R.pos)), cone: [0.72, 0.95], grupo: 'fundo' });
    LUZ.pontos = pts; LUZ.LK = 1;
  }
  const soChave = () => LUZ.pontos.filter(L => L.grupo === 'chave');
  const soFundo = () => LUZ.pontos.filter(L => L.grupo === 'fundo');
  function comLuzes(lista, fn) { const old = LUZ.pontos; LUZ.pontos = lista; try { return fn(); } finally { LUZ.pontos = old; } }

  // ---------------- fundo: a quadra vizinha, a arena e a cidade (por pixel; depois desfocado) ----------------
  function fundo(ctx, cam, o) {
    const { W, H } = cam, img = ctx.createImageData(W, H), D = img.data, pos = cam.pos, V = MUNDO.vizinha;
    const S = SKY(), R = rng(17), fundoL = soFundo();
    // céu e cidade ao longe (silhuetas e janelas esparsas, o mundo do hero), em direções a partir da câmera
    const cl = layer(W, H), cx = cl.getContext('2d'); K.ceu(cx, cam, S);
    const yaw = Math.atan2(cam.f[0], cam.f[2]) * 180 / Math.PI;
    const blocos = [[-34, -27, 4.6], [-27, -22, 3.9], [-22, -15, 5.2], [-15, -10, 4.1], [-10, -3, 4.8], [-3, 3, 3.8], [3, 10, 5.0], [10, 18, 4.2], [18, 30, 5.4]];
    const torres = [[-31, -25.5, 11.5], [12.5, 16.5, 9.0]];
    const quad = (a1, a2, e1, e2) => [cam.D(yaw + a1, e1), cam.D(yaw + a2, e1), cam.D(yaw + a2, e2), cam.D(yaw + a1, e2)];
    for (const [a1, a2, top] of blocos.concat(torres)) { path(cx, quad(a1, a2, -0.2, top)); const p0 = cam.D(yaw, top), p1 = cam.D(yaw, 0);
      cx.fillStyle = lin(cx, p0, p1, [[0, rgba(mix(C.n800, C.n900, 0.5))], [1, rgba(mix(C.n700, C.n800, 0.4))]]); cx.fill(); }
    const pick = () => { const t = R(); return t < 0.6 ? C.n300 : t < 0.9 ? C.e300 : C.n100; };
    for (const [a1, a2, top] of blocos.concat(torres)) for (let e = 0.25; e < top - 0.2; e += 0.5) for (let a = a1 + 0.2; a < a2 - 0.2; a += 0.45) if (R() < 0.13) {
      path(cx, quad(a, a + 0.22, e, e + 0.26)); cx.fillStyle = rgba(pick(), 0.25 + R() * 0.3); cx.fill(); }
    const CEUP = cx.getImageData(0, 0, W, H).data;
    const asfalto = [26, 31, 40], piso = [44, 58, 76], faixa = [176, 184, 194], terra = [22, 26, 34];
    const neb = mix(C.n700, C.n600, 0.4);
    // linhas da quadra vizinha (x ou z constantes, 5 cm de largura)
    const xc = (V.x0 + V.x1) / 2, zm = (V.z0 + V.z1) / 2, m = 50, lw = 4;
    const naLinha = (x, z) => {
      const dentro = x > V.x0 + m - lw && x < V.x1 - m + lw && z > V.z0 + m - lw && z < V.z1 - m + lw; if (!dentro) return false;
      return Math.abs(x - (V.x0 + m)) < lw || Math.abs(x - (V.x1 - m)) < lw || Math.abs(z - (V.z0 + m)) < lw || Math.abs(z - (V.z1 - m)) < lw ||
        Math.abs(z - zm) < lw || Math.abs(Math.hypot(x - xc, z - zm) - 300) < lw;
    };
    const fogT = dist => 1 - Math.exp(-dist / 5200);
    for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
      const d = cam.ray(sx + 0.5, sy + 0.5), dl = len(d); let col, dist;
      if (d[1] < 0) {
        const t = -pos[1] / d[1], x = pos[0] + d[0] * t, z = pos[2] + d[2] * t; dist = t * dl;
        const p = [x, 0, z];
        let alb = z > V.z0 && z < V.z1 && x > V.x0 && x < V.x1 ? (naLinha(x, z) ? faixa : piso) : z > 0 && z < V.z0 ? asfalto : terra;
        col = comLuzes(fundoL, () => luz(alb, p, [0, 1, 0], { amb: 1, wk: 1 }));
        // brilho acetinado dos refletores no piso (o reflexo alonga para a câmera)
        if (alb !== terra) {
          const v = norm(sub(pos, p)); let sp = 0;
          for (const L of fundoL) { const h = norm(add(v, norm(sub(L.pos, p)))); sp += Math.pow(Math.max(0, h[1]), 90) * 0.55; }
          col = add(col, mul([FLD[0] * 255, FLD[1] * 255, FLD[2] * 255], sp * 0.18));
        }
      } else {
        const j = (sy * W + sx) * 4; col = [CEUP[j], CEUP[j + 1], CEUP[j + 2]]; dist = 1e5;
      }
      // os alambrados da quadra vizinha (a tela não resolve a esta distância: um véu escuro, com os postes)
      const cercas = [];
      if (d[2] > 0) for (const zf of [V.z0 - 20, V.z1 + 20]) { const t = (zf - pos[2]) / d[2], x = pos[0] + d[0] * t, y = pos[1] + d[1] * t; if (x > V.x0 - 20 && x < V.x1 + 20 && y > 0 && y < V.cerca && t * dl < dist) cercas.push([t * dl, x, y, zf < V.z0]); }
      for (const xs of [V.x0 - 20, V.x1 + 20]) if (Math.abs(d[0]) > 1e-6) { const t = (xs - pos[0]) / d[0], z = pos[2] + d[2] * t, y = pos[1] + d[1] * t; if (t > 0 && z > V.z0 - 40 && z < V.z1 + 20 && y > 0 && y < V.cerca && t * dl < dist) cercas.push([t * dl, z, y]); }
      cercas.sort((p, q) => q[0] - p[0]);   // de trás para a frente
      for (const [dc, u, y, perto] of cercas) {
        const poste = Math.abs(((u % 300) + 300) % 300 - 150) > (perto ? 146 : 145);
        // a de perto está contra a luz: escura, só a travessa pega um pouco do brilho
        const lit = perto ? [12, 18, 27] : comLuzes(fundoL, () => luz([60, 66, 76], [0, y, V.z1], [0, 0, -1], { amb: 0.9, wk: 0.2 }));
        col = mix(col, poste ? mul(lit, 0.7) : lit, poste ? 0.9 : (perto ? 0.22 : 0.32));
        if (y > V.cerca - 8) col = mix(col, perto ? [40, 52, 66] : lit, 0.6);   // travessa de cima
      }
      // névoa: distância (perspectiva aérea)
      if (dist < 1e5) col = mix(col, neb, fogT(dist) * 0.45);
      const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    { const g = V.gol, zg = V.z1 - m, P = cam.P, k = cam.S([xc, 100, zg]), cor = rgba(mix(comLuzes(fundoL, () => luz([200, 206, 214], [xc, 100, zg - 30], [0, 0.3, -1], { amb: 1, wk: 0.6 })), neb, fogT(4400) * 0.45));
      ctx.fillStyle = rgba(mix(C.n700, C.n600, 0.4), 0.35); path(ctx, [[xc - g.w / 2, 0, zg + 80], [xc + g.w / 2, 0, zg + 80], [xc + g.w / 2, g.h, zg], [xc - g.w / 2, g.h, zg]].map(P)); ctx.fill();   // rede
      ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1.5, k * 10); ctx.lineCap = 'butt';
      path(ctx, [[xc - g.w / 2, 0, zg], [xc - g.w / 2, g.h, zg], [xc + g.w / 2, g.h, zg], [xc + g.w / 2, 0, zg]].map(P), false); ctx.stroke(); }
  }

  // névoa dos refletores: halos, fachos que descem e a faixa de névoa sobre o piso iluminado
  function nevoa(ctx, cam, o) {
    const P = cam.P, k = o.nevoa != null ? o.nevoa : 1; if (k <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const R of MUNDO.refletores) {
      const h = P(R.pos); if (h[2] <= 0) continue;
      const s = cam.S(R.pos);
      // facho: um cone muito leve da cabeça até o piso, desfocado
      const g0 = P(R.alvo), ax = norm(sub(R.alvo, R.pos)), side = norm([ax[2], 0, -ax[0]]);
      const a1 = P(add(R.pos, mul(side, 40))), a2 = P(add(R.pos, mul(side, -40)));
      const b1 = P(add(R.alvo, mul(side, 520))), b2 = P(add(R.alvo, mul(side, -520)));
      if ([g0, a1, a2, b1, b2].every(q => q[2] > 0)) {
        const cv = layer(cam.W, cam.H), cc = cv.getContext('2d');
        path(cc, [a1, a2, b2, b1]); cc.fillStyle = lin(cc, h, g0, [[0, rgba(C.floodW, 0.045 * k)], [0.6, rgba(C.floodW, 0.02 * k)], [1, rgba(C.floodW, 0)]]); cc.fill();
        ctx.filter = `blur(${Math.round(Math.max(6, s * 260))}px)`; ctx.drawImage(cv, 0, 0); ctx.filter = 'none';
      }
      // halo largo na névoa + o disco da cabeça (fora de foco)
      glow(ctx, h, Math.max(60, s * 1800), mix(C.floodW, C.n300, 0.6), (R.longe ? 0.07 : 0.045) * k);
      glow(ctx, h, Math.max(18, s * 420), mix(C.floodW, C.n300, 0.25), (R.longe ? 0.16 : 0.08) * k);
      if (R.longe && h[1] > -40 && h[1] < cam.H) disco(ctx, h, Math.max(8, s * 95), mix(C.floodW, C.lampW, 0.3), R.longe ? 0.5 : 0.6);
    }
    // brilho da névoa atrás da caixa: o ar sobre a quadra vizinha, iluminado
    { const c = P([-500, 160, 2600]); if (c[2] > 0) { ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(cam.W * 0.62, cam.H * 0.2);
      ctx.fillStyle = radial(ctx, [[0, rgba(mix(C.floodW, C.n300, 0.45), 0.13 * k)], [0.5, rgba(C.n300, 0.05 * k)], [1, rgba(C.n300, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); } }
    // faixa de névoa baixa sobre o piso da quadra vizinha (o ar iluminado)
    const V = MUNDO.vizinha, c0 = P([(V.x0 + V.x1) / 2, 60, 2000]), cx = P([V.x1, 60, 2000]);
    if (c0[2] > 0) { ctx.save(); ctx.translate(c0[0], c0[1]); ctx.scale(Math.max(200, Math.abs(cx[0] - c0[0])) * 1.6, 70);
      ctx.fillStyle = radial(ctx, [[0, rgba(mix(C.floodW, C.n300, 0.5), 0.10 * k)], [0.6, rgba(C.n300, 0.04 * k)], [1, rgba(C.n300, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }

  // ---------------- alambrado (o plano z = 0), poste, chapa e abraçadeiras ----------------
  function alambrado(ctx, cam, o) {
    const M = MUNDO.cerca, P = cam.P, s = M.passo * Math.SQRT2, zc = M.z;   // linhas a ±45°, losangos de lado 5 cm
    // a área visível do plano (com folga)
    const q = [[0, 0], [cam.W, 0], [0, cam.H], [cam.W, cam.H]].map(([sx, sy]) => { const d = cam.ray(sx, sy), t = (zc - cam.pos[2]) / d[2]; return add(cam.pos, mul(d, t)); });
    const x0 = Math.min(...q.map(p => p[0])) - 20, x1 = Math.max(...q.map(p => p[0])) + 20, y0 = Math.min(...q.map(p => p[1])) - 20, y1 = Math.max(...q.map(p => p[1])) + 20;
    const alb = [132, 140, 152];
    const fios = layer(cam.W, cam.H), fx = fios.getContext('2d'); fx.lineCap = 'round';
    // n do fio: meio de frente para a câmera, meio para cima (cilindro fino)
    const nF = norm([0.15, 0.55, -0.82]);
    const F0 = o._fundo, Wf = cam.W, Hf = cam.H;
    const contraluz = q => { if (!F0) return 0; const x = clamp(Math.round(q[0]), 0, Wf - 1), y = clamp(Math.round(q[1]), 0, Hf - 1), i = (y * Wf + x) * 4; const Yb = (0.299 * F0[i] + 0.587 * F0[i + 1] + 0.114 * F0[i + 2]) / 255; return Math.pow(Yb, 1.8); };
    const corEm = (p, q) => add(comLuzes(soChave(), () => luz(alb, p, nF, { amb: 0.26, wk: 0.35, lk: 0.42 })), mul(mix(C.n300, C.floodW, 0.4), 0.95 * contraluz(q)));
    const passoSeg = 2.5;
    for (const sg of [1, -1]) {
      // linhas y = sg * x + c, c em passos de s
      const cMin = Math.floor((y0 - Math.max(sg * x0, sg * x1)) / s) - 1, cMax = Math.ceil((y1 - Math.min(sg * x0, sg * x1)) / s) + 1;
      for (let c = cMin; c <= cMax; c++) {
        const cc = c * s + (sg > 0 ? 0 : s / 2);
        for (let x = x0; x < x1; x += passoSeg) {
          const a = [x, sg * x + cc, zc], b = [x + passoSeg, sg * (x + passoSeg) + cc, zc];
          if ((a[1] < y0 && b[1] < y0) || (a[1] > y1 && b[1] > y1)) continue;
          const m = mul(add(a, b), 0.5), pa = P(a), pb = P(b);
          fx.strokeStyle = rgba(corEm(m, P(m))); fx.lineWidth = Math.max(1, cam.S(m) * M.fio);
          fx.beginPath(); fx.moveTo(pa[0], pa[1]); fx.lineTo(pb[0], pb[1]); fx.stroke();
        }
      }
    }
    // trama: nos cruzamentos alternados, o fio de +45° passa por cima (com uma sombra fina dos dois lados)
    { const c1a = Math.floor((y0 - x1) / s) - 1, c1b = Math.ceil((y1 - x0) / s) + 1, c2a = Math.floor((y0 + x0) / s) - 1, c2b = Math.ceil((y1 + x1) / s) + 1, h = 0.75;
      for (let c1 = c1a; c1 <= c1b; c1++) for (let c2 = c2a; c2 <= c2b; c2++) {
        if ((c1 + c2) % 2) continue;
        const x = ((c2 - c1) * s + s / 2) / 2, y = x + c1 * s; if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        const a = [x - h, y - h, zc], b = [x + h, y + h, zc], pa = P(a), pb = P(b), m = [x, y, zc], w = Math.max(1, cam.S(m) * M.fio);
        if (pa[0] < -20 || pa[0] > cam.W + 20 || pa[1] < -20 || pa[1] > cam.H + 20) continue;
        fx.lineCap = 'butt'; fx.strokeStyle = rgba(C.black, 0.45); fx.lineWidth = w * 1.9; fx.beginPath(); fx.moveTo(pa[0], pa[1]); fx.lineTo(pb[0], pb[1]); fx.stroke();
        fx.strokeStyle = rgba(corEm(m, P(m))); fx.lineWidth = w; fx.beginPath(); fx.moveTo(pa[0], pa[1]); fx.lineTo(pb[0], pb[1]); fx.stroke();
      }
      fx.lineCap = 'round'; }
    ctx.save(); ctx.filter = 'blur(0.6px)'; ctx.drawImage(fios, 0, 0); ctx.restore();
  }
  function poste(ctx, cam, o) {
    const Po = MUNDO.poste, P = cam.P, rr = Po.r;
    // silhueta do cilindro: as duas tangentes vistas da câmera
    const toC = norm([cam.pos[0] - Po.x, 0, cam.pos[2] - Po.z]), side = [toC[2], 0, -toC[0]];
    const yb = 0, yt = 400;
    const L1 = [Po.x + side[0] * rr, 0, Po.z + side[2] * rr], R1 = [Po.x - side[0] * rr, 0, Po.z - side[2] * rr];
    const pts = [P([L1[0], yt, L1[2]]), P([R1[0], yt, R1[2]]), P([R1[0], yb, R1[2]]), P([L1[0], yb, L1[2]])];
    const alb = [84, 90, 102];
    // sombreado através do tubo, por altura: a chave vem da esquerda, alta
    const col = (ang, y) => { const n = [Math.cos(ang) * toC[0] - Math.sin(ang) * toC[2], 0, Math.sin(ang) * toC[0] + Math.cos(ang) * toC[2]]; return comLuzes(soChave(), () => luz(alb, [Po.x, y, Po.z], norm([n[0], 0.25, n[2]]), { amb: 0.5, wk: 0.4, lk: 0.8 })); };
    const pl = P([L1[0], 120, L1[2]]), pr = P([R1[0], 120, R1[2]]);
    const st = []; for (let i = 0; i <= 8; i++) { const k = i / 8, ang = (k - 0.5) * Math.PI * 0.96; let c = col(ang, 120); st.push([k, rgba(c)]); }
    path(ctx, pts); ctx.fillStyle = lin(ctx, pl, pr, st); ctx.fill();
    // a luz cai para o chão: escurece o tubo para baixo
    path(ctx, pts); const top = P([Po.x, 150, Po.z]), bot = P([Po.x, 55, Po.z]);
    ctx.fillStyle = lin(ctx, top, bot, [[0, 'rgba(0,0,0,0)'], [0.4, 'rgba(0,0,0,0.12)'], [1, rgba(C.black, 0.7)]]); ctx.fill();
    // brilho estreito do galvanizado
    const hl1 = P([Po.x + side[0] * rr * 0.55 + toC[0] * rr * 0.8, 175, Po.z + side[2] * rr * 0.55 + toC[2] * rr * 0.8]), hl2 = P([Po.x + side[0] * rr * 0.55 + toC[0] * rr * 0.8, 60, Po.z + side[2] * rr * 0.55 + toC[2] * rr * 0.8]);
    ctx.strokeStyle = lin(ctx, hl1, hl2, [[0, rgba(C.n200, 0.05)], [0.4, rgba(C.n200, 0.16)], [1, rgba(C.n200, 0)]]); ctx.lineWidth = Math.max(1, cam.S([Po.x, 120, Po.z]) * 0.35); ctx.beginPath(); ctx.moveTo(hl1[0], hl1[1]); ctx.lineTo(hl2[0], hl2[1]); ctx.stroke();
    return { toC, side };
  }
  function fixacao(ctx, cam, o, pinfo) {
    const P = cam.P, Po = MUNDO.poste, Ch = MUNDO.chapa, b = MUNDO.caixa;
    // abraçadeiras: cintas de 1,4 cm em volta da metade visível do tubo
    const { toC } = pinfo;
    for (const y of MUNDO.abracadeiras) {
      const ring = (yy, r) => { const a = []; for (let i = 0; i <= 24; i++) { const t = -Math.PI / 2 + i / 24 * Math.PI, n = [Math.cos(t) * toC[0] - Math.sin(t) * toC[2], 0, Math.sin(t) * toC[0] + Math.cos(t) * toC[2]]; a.push(P([Po.x + n[0] * r, yy, Po.z + n[2] * r])); } return a; };
      const up = ring(y + 1.4, Po.r + 0.12), dn = ring(y, Po.r + 0.12).reverse();
      path(ctx, up.concat(dn));
      const cL = comLuzes(soChave(), () => luz([120, 126, 136], [Po.x, y, Po.z - Po.r], norm([-0.4, 0.2, -1]), { amb: 0.5, lk: 0.7 }));
      ctx.fillStyle = lin(ctx, up[0], up[up.length - 1], [[0, rgba(mix(cL, C.black, 0.55))], [0.35, rgba(cL)], [1, rgba(mix(cL, C.black, 0.45))]]); ctx.fill();
      // aresta de cima pega a luz
      ctx.beginPath(); up.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = rgba(C.n200, 0.22); ctx.lineWidth = 1; ctx.stroke();
    }
    // chapa atrás da caixa (aparece acima e abaixo dela)
    const fr = frameOf({ x: b.x, z: Ch.z, rot: b.rot });
    const cor = (yy, n) => comLuzes(soChave(), () => luz([40, 48, 60], [b.x, yy, Ch.z], n, { amb: 0.9, lk: 0.9 }));
    const face = [[-Ch.w / 2, Ch.y1], [Ch.w / 2, Ch.y1], [Ch.w / 2, Ch.y0], [-Ch.w / 2, Ch.y0]].map(([u, y]) => P(fr(u, y, -Ch.d / 2)));
    const lado = [[Ch.w / 2, Ch.y1, -Ch.d / 2], [Ch.w / 2, Ch.y1, Ch.d / 2], [Ch.w / 2, Ch.y0, Ch.d / 2], [Ch.w / 2, Ch.y0, -Ch.d / 2]].map(([u, y, v]) => P(fr(u, y, v)));
    path(ctx, lado); ctx.fillStyle = rgba(mix(cor(120, [1, 0, 0]), C.black, 0.2)); ctx.fill();
    path(ctx, face); ctx.fillStyle = lin(ctx, P(fr(0, Ch.y1, 0)), P(fr(0, Ch.y0, 0)), [[0, rgba(cor(Ch.y1, [0, 0.2, -1]))], [1, rgba(mix(cor(Ch.y0, [0, 0, -1]), C.black, 0.3))]]); ctx.fill();
    // parafusos da chapa nas abraçadeiras
    for (const y of [Ch.y0 + 1.6, Ch.y1 - 1.6]) { discT(ctx, cam, fr(0, y, -Ch.d / 2 - 0.05), [0.42, 0, 0], [0, 0.42, 0]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = rgba(C.black, 0.85); ctx.fill(); ctx.beginPath(); ctx.arc(-0.2, -0.2, 0.45, 0, 7); ctx.fillStyle = rgba(C.n300, 0.35); ctx.fill(); ID(ctx); }
  }
  // sombra da caixa e da chapa no poste e na tela (luz da chave), só onde há fio ou tubo
  function sombraCaixa(ctx, cam) {
    const b = MUNDO.caixa, L = MUNDO.chave.pos, fr = frameOf(b), P = cam.P, zs = -3.0;
    const pts = []; for (const [u, hh] of rrect(b.w, b.h, b.r, 3)) for (const v of [-b.d / 2, b.d / 2]) pts.push(fr(u, hh + b.h / 2, v));
    const proj = p => { const d = norm(sub(p, L)), t = (zs - p[2]) / d[2]; return P(add(p, mul(d, t))); };
    const sh = layer(cam.W, cam.H), s = sh.getContext('2d'), k = cam.S([b.x, b.y, zs]);
    s.filter = `blur(${Math.round(k * 0.7)}px)`; s.fillStyle = 'rgba(0,0,0,0.5)'; path(s, hull(pts.map(proj))); s.fill();
    s.filter = `blur(${Math.round(k * 1.6)}px)`; s.fillStyle = 'rgba(0,0,0,0.35)'; path(s, hull(pts.map(p => P([p[0], p[1], zs])))); s.fill();
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(sh, 0, 0); ctx.restore();
  }

  // ---------------- a caixa (do hero, drawBox, adaptada à luz desta cena) ----------------
  function caixa(ctx, cam, o) {
    const b = MUNDO.caixa, fr = frameOf(b), P = cam.P, hd = b.d / 2;
    const t = b.rot * Math.PI / 180, ua = [Math.cos(t), 0, Math.sin(t)], va = [-Math.sin(t), 0, Math.cos(t)];
    const light = (alb, p, n, k) => comLuzes(soChave(), () => luz(alb, p, n, k));
    const outl = rrect(b.w, b.h, b.r, 8);
    const at = (u, hh, v) => fr(u, hh + b.h / 2, v);
    const front = outl.map(([u, hh]) => P(at(u, hh, -hd))), back = outl.map(([u, hh]) => P(at(u, hh, hd)));
    const bodyA = [33, 41, 54];
    const cSide = light(bodyA, at(b.w / 2, 0, 0), ua), cTop = light(bodyA, at(0, b.h / 2, 0), [0, 1, 0], { wk: 0.7 });
    path(ctx, hull(front.concat(back)));
    const pA = P(at(0, b.h / 2, hd)), pB = P(at(b.w / 2, -b.h / 2, hd));
    ctx.fillStyle = lin(ctx, pA, pB, [[0, rgba(mix(cTop, C.n500, 0.12))], [0.3, rgba(cSide)], [1, rgba(mix(cSide, C.black, 0.5))]]); ctx.fill();
    // face de cima (vista um pouco de cima): luz fria do céu, mais clara para trás
    { const tq = outl.filter(([u, hh]) => hh > b.h / 2 - b.r - 0.01).map(([u]) => u); const u0 = Math.min(...tq), u1 = Math.max(...tq);
      const topF = [at(u0, b.h / 2, -hd), at(u1, b.h / 2, -hd), at(u1, b.h / 2, hd), at(u0, b.h / 2, hd)].map(P);
      path(ctx, topF); ctx.fillStyle = lin(ctx, P(at(0, b.h / 2, -hd)), P(at(0, b.h / 2, hd)), [[0, rgba(mix(cTop, C.n500, 0.08))], [0.5, rgba(cTop)], [1, rgba(mix(cTop, C.n900, 0.35))]]); ctx.fill(); }
    // frente
    const fn = mul(va, -1);
    const fTL = light(bodyA, at(-b.w / 2, b.h / 2, -hd), fn), fBR = light(bodyA, at(b.w / 2, -b.h / 2, -hd), fn);
    path(ctx, front);
    ctx.fillStyle = lin(ctx, P(at(-b.w / 2, b.h / 2, -hd)), P(at(b.w / 2, -b.h / 2, -hd)), [[0, rgba(mix(fTL, C.n400, 0.04))], [1, rgba(mix(fBR, C.black, 0.22))]]); ctx.fill();
    // chanfro suave no contorno da frente
    ctx.save(); path(ctx, front); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, -hd)) * 0.2);
    ctx.strokeStyle = lin(ctx, P(at(-b.w / 2, b.h / 2, -hd)), P(at(b.w / 2, -b.h / 2, -hd)), [[0, rgba(mix(C.n300, C.n400, 0.5), 0.45)], [0.45, rgba(C.n500, 0.18)], [1, rgba(C.n500, 0.04)]]);
    ctx.stroke(); ctx.restore();
    // filete elétrico-400 na aresta de cima (como no render do produto)
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
    // botão: aro escuro rebaixado + tampa elétrico-700/800 a ~70%, um arco especular suave
    disc(0, 6.0, 3.45, rgba([7, 11, 17]));
    { discT(ctx, cam, F(0, 6.0), ua, [0, 1, 0]);
      const lift = o.lift != null ? o.lift : 0.08;
      const g = ctx.createRadialGradient(-0.8, 0.9, 0.3, 0, 0, 3.0);
      g.addColorStop(0, rgba(mix(mul(mix(C.e700, C.n600, 0.12), 0.74), C.floodW, lift))); g.addColorStop(0.55, rgba(mul(mix(mix(C.e700, C.e800, 0.6), C.n700, 0.15), 0.64))); g.addColorStop(1, rgba(mul(mix(C.e800, C.n800, 0.3), 0.47)));
      ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, 7); ctx.fillStyle = g; ctx.fill();
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.55; ctx.strokeStyle = rgba(C.n100, 0.08); ctx.beginPath(); ctx.arc(0, 0, 2.2, Math.PI * 0.58, Math.PI * 0.95); ctx.stroke();
      ctx.lineWidth = 0.2; ctx.strokeStyle = rgba(C.n100, 0.2); ctx.beginPath(); ctx.arc(0, 0, 2.25, Math.PI * 0.62, Math.PI * 0.9); ctx.stroke();
      ctx.lineWidth = 0.12; ctx.strokeStyle = rgba(C.e400, 0.25); ctx.beginPath(); ctx.arc(0, 0, 2.85, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ID(ctx); }
    // barra do LED apagada (a emissão vem depois)
    const ledPts = rrect(2.8, 0.42, 0.21, 4).map(([s, h]) => P(F(s, 1.95 + h)));
    path(ctx, ledPts); ctx.fillStyle = rgba(mix(C.c600, C.n900, 0.78)); ctx.fill();
    return { led: F(0, 1.95), ledPts };
  }
  function led(ctx, cam, info, k) {
    if (!info || k <= 0) return; const P = cam.P, b = MUNDO.caixa;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    path(ctx, info.ledPts); ctx.fillStyle = rgba(C.c500, 0.86 * k); ctx.fill();
    glow(ctx, P(info.led), cam.S(info.led) * 2.2, C.c500, 0.24 * k);
    // o LED clareia de leve a parte de baixo da frente da caixa e o ar logo à frente
    glow(ctx, P(info.led), cam.S(info.led) * 6, C.c400, 0.05 * k);
    ctx.restore();
  }

  // ---------------- render ----------------
  function render(canvas, extra) {
    const o = Object.assign({}, CAM, extra || {});
    prepLuz(o); const cam = makeCam(o); const ctx = canvas.getContext('2d');
    // 1. fundo desfocado
    const bg = layer(cam.W, cam.H), bx = bg.getContext('2d'); fundo(bx, cam, o);
    // por baixo, o fundo sem desfoque: as bordas do desfoque não puxam preto
    const ex = `brightness(${o.fundoExp || 1})`;
    ctx.filter = ex; ctx.drawImage(bg, 0, 0);
    ctx.filter = `${ex} blur(${o.fundoBlur}px)`; ctx.drawImage(bg, 0, 0); ctx.filter = 'none';
    nevoa(ctx, cam, o);
    if (o.so === 'fundo') return { cam };   // depuração: só o fundo (com ?so=fundo&fundoBlur=0)
    { const fb = layer(cam.W, cam.H), fc = fb.getContext('2d'); fc.filter = 'blur(10px)'; fc.drawImage(ctx.canvas, 0, 0); o._fundo = fc.getImageData(0, 0, cam.W, cam.H).data; }
    // 2. alambrado, poste e fixação (com a sombra da caixa)
    const nr = layer(cam.W, cam.H), nx = nr.getContext('2d');
    alambrado(nx, cam, o); const pinfo = poste(nx, cam, o); fixacao(nx, cam, o, pinfo); sombraCaixa(nx, cam);
    ctx.drawImage(nr, 0, 0);
    // 3. caixa e LED
    const info = caixa(ctx, cam, o); led(ctx, cam, info, o.ledK);
    // 4. acabamento do hero
    K.acabamento(ctx, cam, o);
    return { cam };
  }
  // pontos do objeto principal (a caixa), para a sonda de enquadramento
  function objeto() { const b = MUNDO.caixa, fr = frameOf(b), r = []; for (const u of [-b.w / 2, b.w / 2]) for (const v of [-b.d / 2, b.d / 2]) for (const hh of [0, b.h]) r.push(fr(u, hh, v)); return r; }
  // pontos de referência para a sonda de geometria
  function referencias() { const r = { caixa: [0, 120, -9] }; MUNDO.refletores.forEach((R, i) => { r['refletor' + i] = R.pos; }); r.horizonte = [CAM.pos[0], CAM.pos[1], 1e6]; return r; }
  G.CENA = { nome: 'replay', render, CAM, MUNDO, objeto, referencias };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.CENA;
