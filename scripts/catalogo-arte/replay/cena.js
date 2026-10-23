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
  const { C, rgba, mix, clamp, sub, add, mul, norm, len, rng, LUZ, luz, FLD, LMP, makeCam, frameOf, rrect, path, hull, discT, ID, radial, lin, layer, glow, disco, SKY } = K;

  // ---------------- mundo ----------------
  const MUNDO = {
    cerca: { z: 0, passo: 3.6, fio: 0.17, var: 0.14 },         // tela de losango de 3,6 cm (lado), fio de 1,7 mm, ±14% fio a fio
    poste: { x: 0, z: -3.3, r: 3.0 },                          // tubo de 6 cm, do lado da quadra
    // a caixa e a chapa ficam um pouco à direita do eixo do poste, o quanto a paralaxe da câmera (~20° de lado) as
    // empurra para a esquerda: assim, na imagem, as duas ficam centradas no tubo e as abraçadeiras saem dos dois lados
    caixa: { x: 1.97, y: 113.5, z: -9.0, rot: 0, w: 9.6, d: 4.6, h: 13, r: 1.25 },   // y: base; frente para -z
    chapa: { x: 1.09, w: 4.6, y0: 108.6, y1: 131.4, z: -6.45, d: 0.5 }, // chapa de fixação atrás da caixa
    abracadeiras: [109.6, 129.0],                              // duas cintas inox em volta do poste
    // a quadra vizinha: society de 15 x 25 m, girada 6° e comprida para longe, com o alambrado dela e o gol do
    // fundo. Coordenadas locais: u na largura (0 no meio), w no comprimento (0 na linha de perto, a 6 m da tela)
    vizinha: { cx: -780, cz: 600, rot: 6, W: 1500, L: 2500, m: 50, cerca: 400, gol: { w: 300, h: 200 } },
    // refletores: cabeça [u, altura, w] e alvo [u, w] no sistema da quadra vizinha (viram mundo pelo VZ, logo abaixo)
    refletores: [
      // os 4 da quadra vizinha, em postes de 5,4 a 6 m fora das laterais: os de perto ficam acima do quadro; o segundo
      // da esquerda (mais baixo) entra no quadro, o maior e mais perto; o segundo da direita fica fora do quadro
      { loc: [-880, 600, 450], alvo: [-250, 800] }, { loc: [880, 600, 450], alvo: [250, 800] },
      { loc: [-880, 540, 1650], alvo: [-400, 1150] }, { loc: [880, 600, 2150], alvo: [250, 1700] },
      // dois refletores de outra quadra, mais longe e mais altos: menores, acima do gol (fora de foco)
      { pos: [-1060, 1160, 6490], alvo: [-900, 0, 5400], longe: true }, { pos: [-610, 1095, 6650], alvo: [-500, 0, 5500], longe: true }
    ],
    // a luz que cai sobre a caixa: um refletor da nossa quadra, alto, atrás e à esquerda da câmera
    chave: { pos: [-700, 950, -2400], k: 0.62 }
  };
  // sistema local da quadra vizinha: (u, w) -> mundo e de volta
  const VZ = (() => { const V = MUNDO.vizinha, t = V.rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return { c, s, W: (u, w, y = 0) => [V.cx + u * c + w * s, y, V.cz - u * s + w * c],
      L: (x, z) => { const dx = x - V.cx, dz = z - V.cz; return [dx * c - dz * s, dx * s + dz * c]; } }; })();
  for (const R of MUNDO.refletores) if (R.loc) { R.pos = VZ.W(R.loc[0], R.loc[2], R.loc[1]); R.alvo = VZ.W(R.alvo[0], R.alvo[1]); }
  // câmera retrato 800 x 1200: a caixa a ~1/3 da altura, quase de frente (como no hero, ~20° de lado)
  const CAM = { W: 800, H: 1200, pos: [23, 121, -70], target: [0, 120, -9], F: 1200, shiftY: -180,
    fundoBlur: 4.5, fundoExp: 0.86, fundoExpPiso: 0.96, faixaPiso: [0.28, 0.34, 0.54, 0.62], telaPiso: 0.2, posteSombra: [0.5, 0.57, 0.72], vig: 0.9, vigR: [0.18, 0.7], vigC: [0.5, 0.34], bottomFade: [0.5, 0.78, 1.0, 0.38, 0.62], bloom: 0.18, grain: 5, grainBaixo: [0.6, 6.5], ledK: 0.85, nevoa: 1,
    bancoR: 13, fachoMax: 0.45, linhaDir: 0.6, poca: [0.3, 160, 300], face: 8, realce: 0.07, contato: 0.45 };

  function prepLuz(o) {
    LUZ.ceuDir = norm([0, 1, 0.3]);    // céu de hora azul por cima (cena externa)
    const pts = [];
    // a chave: uma poça em volta da caixa, que cai para o chão e para o alto (como o cone do abajur do hero,
    // recentrado nos objetos); fora dela fica 12% da força
    pts.push({ pos: MUNDO.chave.pos, cor: mix(FLD, LMP, 0.15), k: MUNDO.chave.k, alcance: 1e7, mascara: p => 0.12 + 0.88 * Math.exp(-Math.pow((p[0] + 4) / 34, 2) - Math.pow((p[1] - 121) / (p[1] < 121 ? 30 : 40), 2)), grupo: 'chave' });
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
    const asfalto = [26, 31, 40], piso = [44, 58, 76], faixa = o.faixa || [242, 245, 248], terra = [22, 26, 34];
    const neb = mix(C.n700, C.n600, 0.4);
    // linhas da quadra vizinha (no sistema local; 10 cm de largura)
    const m = V.m, lw = 5, hw = V.W / 2, zm = V.L / 2;
    const naLinha = (u, w) => {
      if (Math.abs(u) > hw - m + lw || w < m - lw || w > V.L - m + lw) return false;
      return Math.abs(Math.abs(u) - (hw - m)) < lw || Math.abs(w - m) < lw || Math.abs(w - (V.L - m)) < lw ||
        Math.abs(w - zm) < lw || Math.abs(Math.hypot(u, w - zm) - 300) < lw;
    };
    // alambrados da quadra vizinha: as duas laterais e o do fundo (o de perto é a nossa tela)
    const cercasV = [[[-hw - 20, -20], [-hw - 20, V.L + 20]], [[hw + 20, -20], [hw + 20, V.L + 20]], [[-hw - 20, V.L + 20], [hw + 20, V.L + 20]]]
      .map(([a, b]) => { const A = VZ.W(a[0], a[1]), B = VZ.W(b[0], b[1]); return { A: [A[0], A[2]], B: [B[0], B[2]] }; });
    const fogT = dist => 1 - Math.exp(-dist / 5200);
    for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
      const d = cam.ray(sx + 0.5, sy + 0.5), dl = len(d); let col, dist;
      if (d[1] < 0) {
        const t = -pos[1] / d[1], x = pos[0] + d[0] * t, z = pos[2] + d[2] * t; dist = t * dl;
        const p = [x, 0, z];
        const [u, w] = VZ.L(x, z), naQuadra = Math.abs(u) < hw && w > 0 && w < V.L;
        // à direita da caixa a linha fica a ~60% (o filete que corria até a borda puxava o olho para fora do objeto)
        let alb = naQuadra ? (naLinha(u, w) ? mix(piso, faixa, 1 - (1 - (o.linhaDir != null ? o.linhaDir : 0.6)) * K.sstep(540, 650, sx)) : piso) : z > 0 && w < 0 && Math.abs(u) < hw + 400 ? asfalto : terra;
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
      for (const F of cercasV) {
        const ex = F.B[0] - F.A[0], ez = F.B[1] - F.A[1], nx = -ez, nz = ex, den = d[0] * nx + d[2] * nz; if (Math.abs(den) < 1e-9) continue;
        const t = ((F.A[0] - pos[0]) * nx + (F.A[1] - pos[2]) * nz) / den; if (t <= 0) continue;
        const x = pos[0] + d[0] * t, z = pos[2] + d[2] * t, y = pos[1] + d[1] * t, el = Math.hypot(ex, ez);
        const k = ((x - F.A[0]) * ex + (z - F.A[1]) * ez) / (el * el);
        if (k > 0 && k < 1 && y > 0 && y < V.cerca && t * dl < dist) cercas.push([t * dl, k * el, y]);
      }
      cercas.sort((p, q) => q[0] - p[0]);   // de trás para a frente
      for (const [dc, u, y] of cercas) {
        const poste = Math.abs(((u % 300) + 300) % 300 - 150) > 145;
        const lit = comLuzes(fundoL, () => luz([60, 66, 76], VZ.W(0, V.L, y), [-VZ.s, 0, -VZ.c], { amb: 0.9, wk: 0.2 }));
        col = mix(col, poste ? mul(lit, 0.7) : lit, poste ? 0.9 : 0.32);
        if (y > V.cerca - 8) col = mix(col, lit, 0.6);   // travessa de cima
      }
      // névoa: distância (perspectiva aérea)
      if (dist < 1e5) col = mix(col, neb, fogT(dist) * 0.45);
      const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // o gol do fundo: a trave e o travessão claros e finos (14 cm no desenho, para a trave de ~10 cm resistir ao desfoque), a rede escura para trás
    { const g = V.gol, wg = V.L - m, P = cam.P, G = (u, y, dw = 0) => P(VZ.W(u, wg + dw, y)), pc = VZ.W(0, wg, 100), k = cam.S(pc);
      const dg = len(sub(pc, pos)), cor = rgba(mix(comLuzes(fundoL, () => luz(o.golAlb || [228, 232, 238], VZ.W(0, wg - 30, 100), [-VZ.s, 0.3, -VZ.c], { amb: 1.5, wk: 0.8 })), neb, fogT(dg) * 0.45));
      ctx.fillStyle = rgba(mix(C.n800, C.n700, 0.4), 0.45); path(ctx, [G(-g.w / 2, 0, 90), G(g.w / 2, 0, 90), G(g.w / 2, g.h, 0), G(-g.w / 2, g.h, 0)]); ctx.fill();   // rede
      ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1.5, k * (o.golTubo || 14)); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
      path(ctx, [G(-g.w / 2, 0), G(-g.w / 2, g.h), G(g.w / 2, g.h), G(g.w / 2, 0)], false); ctx.stroke(); }
  }

  // o banco de refletores fora de foco: uma caixa escura com 2 ou 3 lâmpadas lado a lado (nada de disco solto, que
  // lê como lua), do mesmo tamanho na imagem para todos (meia largura o.bancoR, ~13 px), com um halo contido
  function banco(ctx, cam, R, h, o) {
    const rb = (o.bancoR || 13) * (R.longe ? 0.92 : 1), n = R.longe ? 2 : 3, hb = rb * 0.62, cv = layer(cam.W, cam.H), cc = cv.getContext('2d');
    const [x, y] = h;
    cc.beginPath(); cc.roundRect ? cc.roundRect(x - rb - 2, y - hb / 2 - 2, 2 * rb + 4, hb + 4, 2) : cc.rect(x - rb - 2, y - hb / 2 - 2, 2 * rb + 4, hb + 4);
    cc.fillStyle = rgba(mix(C.n800, C.n900, 0.4), 0.85); cc.fill();
    cc.globalCompositeOperation = 'lighter';
    const lr = rb / n * 0.95, cor = mix(C.floodW, C.lampW, 0.25);
    for (let i = 0; i < n; i++) { const lx = x + (i - (n - 1) / 2) * (2 * rb / n), g = cc.createRadialGradient(lx, y, 0, lx, y, lr);
      g.addColorStop(0, rgba(cor, 0.95)); g.addColorStop(0.6, rgba(cor, 0.75)); g.addColorStop(1, rgba(cor, 0)); cc.fillStyle = g; cc.beginPath(); cc.arc(lx, y, lr, 0, 7); cc.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.filter = `blur(${o.bancoBlur || 2.4}px)`; ctx.drawImage(cv, 0, 0); ctx.restore();
    // halo contido em volta do banco (em largura, como a fileira de lâmpadas)
    ctx.save(); ctx.translate(x, y); ctx.scale(rb * 3.2, rb * 2.1);
    ctx.fillStyle = radial(ctx, [[0, rgba(mix(C.floodW, C.n300, 0.3), 0.2 * (o.nevoa != null ? o.nevoa : 1))], [0.4, rgba(mix(C.floodW, C.n300, 0.5), 0.05)], [1, rgba(C.n300, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore();
  }
  // o poste fino e escuro do banco, desfocado como o fundo; some na névoa para baixo (os de longe, mais cedo)
  function posteBanco(ctx, cam, R, h, o) {
    const pe = cam.P([R.pos[0], 0, R.pos[2]]), w = Math.max(2, cam.S(R.pos) * 16), y0 = h[1] + 3, y1 = R.longe ? h[1] + (pe[1] - h[1]) * 0.55 : pe[1];
    const a = R.longe ? 0.32 : 0.5, cor = mix(C.n900, C.n800, 0.4);
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'blur(2px)';
    ctx.fillStyle = lin(ctx, [0, y0], [0, y1], [[0, rgba(cor, a)], [0.6, rgba(cor, a * 0.7)], [1, rgba(cor, 0)]]);
    ctx.fillRect(h[0] - w / 2 + (pe[0] - h[0]) * 0.5, y0, w, y1 - y0); ctx.restore();
  }
  // névoa dos refletores: véu, cone de névoa e o banco de lâmpadas; a faixa de névoa sobre o piso iluminado
  function nevoa(ctx, cam, o) {
    const P = cam.P, k = o.nevoa != null ? o.nevoa : 1; if (k <= 0) return;
    // veu: só o ar iluminado (véus, cones, o brilho atrás da caixa e a faixa baixa), sem os bancos e os postes deles;
    // o loop (A5) compõe a névoa à deriva com o passe veu = 0. Com veu = 1 (o cartão) nada muda
    const v = o.veu != null ? o.veu : 1;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const fk = o.facho != null ? o.facho : 1, yMax = (o.fachoMax || 0.45) * cam.H, cinza = mix(C.n300, C.floodW, 0.35);
    for (const R of MUNDO.refletores) {
      const h = P(R.pos); if (h[2] <= 0) continue;
      const s = cam.S(R.pos), noQuadro = h[0] > -60 && h[0] < cam.W + 60 && h[1] > -60 && h[1] < cam.H;
      // o véu de luz no ar em volta do banco (o céu deixa de ser uniforme perto dos refletores)
      glow(ctx, h, Math.max(90, s * 1500), mix(C.floodW, C.n300, 0.6), 0.06 * k * v);
      if (!noQuadro) { glow(ctx, h, Math.max(18, s * 420), mix(C.floodW, C.n300, 0.25), 0.08 * k * v); continue; }
      posteBanco(ctx, cam, R, h, o);
      // cone de névoa sob o banco, abrindo para a quadra: azul-acinzentado, tênue, e some antes de 45% da altura
      { const cv = layer(cam.W, cam.H), cc = cv.getContext('2d'), rb = o.bancoR || 13, ab = (R.longe ? 0.08 : 0.10) * k * fk * v;
        const yb = Math.min(yMax, h[1] + (R.longe ? 210 : 260)), ab2 = (yb - h[1]) * (R.longe ? 0.42 : 0.55);
        const dx = (P(R.alvo)[0] - h[0]) * 0.25;   // o cone pende um pouco para onde o refletor aponta
        path(cc, [[h[0] - rb, h[1] + 4], [h[0] + rb, h[1] + 4], [h[0] + dx + ab2, yb], [h[0] + dx - ab2, yb]]);
        cc.fillStyle = lin(cc, [0, h[1]], [0, yb], [[0, rgba(cinza, ab)], [0.55, rgba(cinza, ab * 0.6)], [1, rgba(cinza, 0)]]); cc.fill();
        ctx.filter = 'blur(14px)'; ctx.drawImage(cv, 0, 0); ctx.filter = 'none'; }
      banco(ctx, cam, R, h, o);
    }
    // brilho da névoa atrás da caixa: o ar sobre a quadra vizinha, iluminado
    { const c = P([-500, 160, 2600]); if (c[2] > 0) { ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(cam.W * 0.62, cam.H * 0.2);
      ctx.fillStyle = radial(ctx, [[0, rgba(mix(C.floodW, C.n300, 0.45), 0.13 * k * v)], [0.5, rgba(C.n300, 0.05 * k * v)], [1, rgba(C.n300, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); } }
    // faixa de névoa baixa sobre o piso da quadra vizinha (o ar iluminado)
    const V = MUNDO.vizinha, c0 = P(VZ.W(0, V.L * 0.55, 60)), cx = P(VZ.W(V.W / 2, V.L * 0.55, 60));
    if (c0[2] > 0) { ctx.save(); ctx.translate(c0[0], c0[1]); ctx.scale(Math.max(200, Math.abs(cx[0] - c0[0])) * 1.6, 70);
      ctx.fillStyle = radial(ctx, [[0, rgba(mix(C.floodW, C.n300, 0.5), 0.10 * k * v)], [0.6, rgba(C.n300, 0.04 * k * v)], [1, rgba(C.n300, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); }
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
    const corEm = (p, q) => add(comLuzes(soChave(), () => luz(alb, p, nF, { amb: 0.26, wk: 0.35, lk: 0.42 })), mul(mix(C.n300, C.floodW, 0.4), (o.contraluz || 1.1) * contraluz(q)));
    const passoSeg = 2.5;
    for (const sg of [1, -1]) {
      // linhas y = sg * x + c, c em passos de s
      const cMin = Math.floor((y0 - Math.max(sg * x0, sg * x1)) / s) - 1, cMax = Math.ceil((y1 - Math.min(sg * x0, sg * x1)) / s) + 1;
      for (let c = cMin; c <= cMax; c++) {
        const cc = c * s + (sg > 0 ? 0 : s / 2);
        // fio a fio, a espessura e a opacidade variam de leve (e devagar ao longo do fio): arame, não régua
        const Rf = rng(1009 + c * 2 + (sg > 0 ? 0 : 1)), vw = 1 + (M.var || 0) * (2 * Rf() - 1), va = 1 - (M.var || 0) * 1.3 * Rf(), fase = Rf() * 6.28;
        for (let x = x0; x < x1; x += passoSeg) {
          const a = [x, sg * x + cc, zc], b = [x + passoSeg, sg * (x + passoSeg) + cc, zc];
          if ((a[1] < y0 && b[1] < y0) || (a[1] > y1 && b[1] > y1)) continue;
          const m = mul(add(a, b), 0.5), pa = P(a), pb = P(b);
          const ond = 1 + (M.var || 0) * 0.5 * Math.sin(fase + x / 23);
          fx.strokeStyle = rgba(corEm(m, P(m)), clamp(va * ond, 0, 1)); fx.lineWidth = Math.max(1, cam.S(m) * M.fio * vw * ond);
          fx.beginPath(); fx.moveTo(pa[0], pa[1]); fx.lineTo(pb[0], pb[1]); fx.stroke();
        }
      }
    }
    // trama: nos cruzamentos alternados, o fio de +45° passa por cima (com uma sombra fina dos dois lados)
    { const c1a = Math.floor((y0 - x1) / s) - 1, c1b = Math.ceil((y1 - x0) / s) + 1, c2a = Math.floor((y0 + x0) / s) - 1, c2b = Math.ceil((y1 + x1) / s) + 1, h = 0.75 * M.passo / 5;
      for (let c1 = c1a; c1 <= c1b; c1++) for (let c2 = c2a; c2 <= c2b; c2++) {
        if ((c1 + c2) % 2) continue;
        const x = ((c2 - c1) * s + s / 2) / 2, y = x + c1 * s; if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        const a = [x - h, y - h, zc], b = [x + h, y + h, zc], pa = P(a), pb = P(b), m = [x, y, zc], w = Math.max(1, cam.S(m) * M.fio);
        if (pa[0] < -20 || pa[0] > cam.W + 20 || pa[1] < -20 || pa[1] > cam.H + 20) continue;
        fx.lineCap = 'butt'; fx.strokeStyle = rgba(C.black, 0.45); fx.lineWidth = w * 1.9; fx.beginPath(); fx.moveTo(pa[0], pa[1]); fx.lineTo(pb[0], pb[1]); fx.stroke();
        fx.strokeStyle = rgba(corEm(m, P(m))); fx.lineWidth = w; fx.beginPath(); fx.moveTo(pa[0], pa[1]); fx.lineTo(pb[0], pb[1]); fx.stroke();
      }
      fx.lineCap = 'round'; }
    // sobre a faixa do piso da quadra vizinha os fios ficam ~20% mais leves, para o piso respirar
    if (o.telaPiso) { const [y0, y1, y2, y3] = o.faixaPiso, H = cam.H; fx.globalCompositeOperation = 'destination-out';
      fx.fillStyle = lin(fx, [0, y0 * H], [0, y3 * H], [[0, 'rgba(0,0,0,0)'], [(y1 - y0) / (y3 - y0), `rgba(0,0,0,${o.telaPiso})`], [(y2 - y0) / (y3 - y0), `rgba(0,0,0,${o.telaPiso})`], [1, 'rgba(0,0,0,0)']]);
      fx.fillRect(0, 0, cam.W, H); fx.globalCompositeOperation = 'source-over'; }
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
    // a luz da chave fica na caixa: abaixo dela o tubo sai da luz e se funde ao navy (a metade do texto)
    { const H = cam.H, [y0, y1, y2] = o.posteSombra; path(ctx, pts);
      ctx.fillStyle = lin(ctx, [0, y0 * H], [0, y2 * H], [[0, rgba(C.edge, 0)], [(y1 - y0) / (y2 - y0), rgba(C.edge, 0.6)], [1, rgba(C.edge, 0.9)]]); ctx.fill(); }
    // brilho estreito do galvanizado: só de cima até a chapa de baixo
    const hlP = y => P([Po.x + side[0] * rr * 0.55 + toC[0] * rr * 0.8, y, Po.z + side[2] * rr * 0.55 + toC[2] * rr * 0.8]);
    const hl1 = hlP(175), hl2 = hlP(MUNDO.chapa.y0 + 1);
    ctx.strokeStyle = lin(ctx, hl1, hl2, [[0, rgba(C.n200, 0.05)], [0.45, rgba(C.n200, 0.16)], [1, rgba(C.n200, 0)]]); ctx.lineWidth = Math.max(1, cam.S([Po.x, 120, Po.z]) * 0.35); ctx.beginPath(); ctx.moveTo(hl1[0], hl1[1]); ctx.lineTo(hl2[0], hl2[1]); ctx.stroke();
    return { toC, side, pts };
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
    const fr = frameOf({ x: Ch.x, z: Ch.z, rot: b.rot });
    const cor = (yy, n) => comLuzes(soChave(), () => luz([40, 48, 60], [Ch.x, yy, Ch.z], n, { amb: 0.9, lk: 0.9 }));
    const face = [[-Ch.w / 2, Ch.y1], [Ch.w / 2, Ch.y1], [Ch.w / 2, Ch.y0], [-Ch.w / 2, Ch.y0]].map(([u, y]) => P(fr(u, y, -Ch.d / 2)));
    const lado = [[Ch.w / 2, Ch.y1, -Ch.d / 2], [Ch.w / 2, Ch.y1, Ch.d / 2], [Ch.w / 2, Ch.y0, Ch.d / 2], [Ch.w / 2, Ch.y0, -Ch.d / 2]].map(([u, y, v]) => P(fr(u, y, v)));
    path(ctx, lado); ctx.fillStyle = rgba(mix(cor(120, [1, 0, 0]), C.black, 0.2)); ctx.fill();
    path(ctx, face); ctx.fillStyle = lin(ctx, P(fr(0, Ch.y1, 0)), P(fr(0, Ch.y0, 0)), [[0, rgba(cor(Ch.y1, [0, 0.2, -1]))], [1, rgba(mix(cor(Ch.y0, [0, 0, -1]), C.black, 0.3))]]); ctx.fill();
    // sombra de contato no tubo logo abaixo da chapa de baixo
    { const y0 = P(fr(0, Ch.y0, 0)), y1 = P(fr(0, Ch.y0 - 3.2, 0)); ctx.save(); path(ctx, pinfo.pts); ctx.clip();
      ctx.fillStyle = lin(ctx, y0, y1, [[0, rgba(C.black, 0.6)], [1, rgba(C.black, 0)]]); ctx.fillRect(0, Math.min(y0[1], y1[1]) - 2, cam.W, Math.abs(y1[1] - y0[1]) + 4); ctx.restore(); }
    // parafusos da chapa nas abraçadeiras
    for (const y of [Ch.y0 + 1.6, Ch.y1 - 1.6]) { discT(ctx, cam, fr(0, y, -Ch.d / 2 - 0.05), [0.42, 0, 0], [0, 0.42, 0]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = rgba(C.black, 0.85); ctx.fill(); ctx.beginPath(); ctx.arc(-0.2, -0.2, 0.45, 0, 7); ctx.fillStyle = rgba(C.n300, 0.35); ctx.fill(); ID(ctx); }
  }
  // sombra da caixa e da chapa no poste e na tela (luz da chave), só onde há fio ou tubo
  function sombraCaixa(ctx, cam, o) {
    const b = MUNDO.caixa, L = MUNDO.chave.pos, fr = frameOf(b), P = cam.P, zs = -3.0;
    const pts = []; for (const [u, hh] of rrect(b.w, b.h, b.r, 3)) for (const v of [-b.d / 2, b.d / 2]) pts.push(fr(u, hh + b.h / 2, v));
    const proj = p => { const d = norm(sub(p, L)), t = (zs - p[2]) / d[2]; return P(add(p, mul(d, t))); };
    const sh = layer(cam.W, cam.H), s = sh.getContext('2d'), k = cam.S([b.x, b.y, zs]);
    s.filter = `blur(${Math.round(k * 0.45)}px)`; s.fillStyle = 'rgba(0,0,0,0.7)'; path(s, hull(pts.map(proj))); s.fill();
    s.filter = `blur(${Math.round(k * 1.6)}px)`; s.fillStyle = 'rgba(0,0,0,0.35)'; path(s, hull(pts.map(p => P([p[0], p[1], zs])))); s.fill();
    // sombra de contato curta no poste, embaixo e à direita da caixa (a chave vem de cima, à esquerda)
    if (o && o.contato) { s.filter = `blur(${Math.max(2, Math.round(k * 0.3))}px)`; s.fillStyle = `rgba(0,0,0,${o.contato})`; path(s, hull(pts.map(p => P([p[0] + 0.7, p[1] - 0.9, zs])))); s.fill(); }
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
    // a chave vem de cima, à esquerda e de trás da câmera: mais clara no canto de cima à esquerda, ~20% mais escura embaixo à direita
    const fv = [o.face || 0, o.face || 0, (o.face || 0) * 1.1];   // a face sobe ~7 de valor: o meio-tom mais claro do quadro
    ctx.fillStyle = lin(ctx, P(at(-b.w / 2, b.h / 2, -hd)), P(at(b.w / 2, -b.h / 2, -hd)), [[0, rgba(add(mix(mul(fTL, 1.14), C.lampW, 0.03), fv))], [0.45, rgba(add(mul(fTL, 0.98), fv))], [1, rgba(add(mul(fBR, 0.76), fv))]]); ctx.fill();
    // realce fraco de luz neutra no canto de cima à esquerda (o refletor da esquerda, alto)
    if (o.realce) { const q = P(at(-b.w / 2 + 0.6, b.h / 2 - 0.6, -hd)), rr = cam.S(at(0, 0, -hd)) * 5.5; ctx.save(); path(ctx, front); ctx.clip();
      const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); g.addColorStop(0, rgba(C.floodW, o.realce)); g.addColorStop(0.5, rgba(C.floodW, o.realce * 0.3)); g.addColorStop(1, rgba(C.floodW, 0));
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(q[0] - rr, q[1] - rr, 2 * rr, 2 * rr); ctx.restore(); }
    // chanfro suave no contorno da frente
    ctx.save(); path(ctx, front); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, -hd)) * 0.2);
    ctx.strokeStyle = lin(ctx, P(at(-b.w / 2, b.h / 2, -hd)), P(at(b.w / 2, -b.h / 2, -hd)), [[0, rgba(mix(C.n300, C.n400, 0.5), 0.45)], [0.45, rgba(C.n500, 0.18)], [1, rgba(C.n500, 0.04)]]);
    ctx.stroke(); ctx.restore();
    // filete elétrico-400 na aresta de cima (como no render do produto): segue o contorno arredondado da frente,
    // de um canto ao outro, num traço só (sem pedaço na lateral, que se soltava do canto)
    { const pts = outl.filter(([u, hh]) => hh > b.h / 2 - b.r * 0.55).sort((p, q) => p[0] - q[0]).map(([u, hh]) => P(at(u, hh, -hd - 0.01)));
      const a1 = pts[0], a2 = pts[pts.length - 1];
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.e400, 0.1)], [0.3, rgba(C.e400, 0.75)], [0.78, rgba(C.e400, 0.6)], [1, rgba(C.e400, 0.08)]]); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, 0)) * 0.13); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
    // rim frio fino na borda esquerda: a névoa dos refletores, atrás, recorta a caixa
    { const pts = outl.filter(([u]) => u < -b.w / 2 + b.r * 0.7).sort((p, q) => q[1] - p[1]).map(([u, hh]) => P(at(u, hh, -hd)));
      const a1 = pts[0], a2 = pts[pts.length - 1];
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = lin(ctx, a1, a2, [[0, rgba(C.n300, 0.05)], [0.25, rgba(mix(C.n300, C.floodW, 0.3), 0.32)], [0.7, rgba(C.n300, 0.2)], [1, rgba(C.n300, 0.03)]]); ctx.lineWidth = Math.max(1, cam.S(at(0, 0, 0)) * 0.08); ctx.lineCap = 'round'; ctx.stroke(); }
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
    if (typeof o.grainBaixo === 'string') o.grainBaixo = o.grainBaixo.split(',').map(Number);   // ?grainBaixo=0.6,7
    prepLuz(o); const cam = makeCam(o); const ctx = canvas.getContext('2d');
    // 1. fundo desfocado
    const bg = layer(cam.W, cam.H), bx = bg.getContext('2d'); fundo(bx, cam, o);
    // por baixo, o fundo sem desfoque: as bordas do desfoque não puxam preto
    const ex = `brightness(${o.fundoExp || 1})`;
    ctx.filter = ex; ctx.drawImage(bg, 0, 0);
    ctx.filter = `${ex} blur(${o.fundoBlur}px)`; ctx.drawImage(bg, 0, 0); ctx.filter = 'none';
    // a faixa do piso da quadra vizinha (o gol, as linhas, o reflexo) com mais exposição, numa máscara suave
    if (o.fundoExpPiso && o.fundoExpPiso !== o.fundoExp) {
      const [y0, y1, y2, y3] = o.faixaPiso, pl = layer(cam.W, cam.H), pc = pl.getContext('2d');
      pc.filter = `brightness(${o.fundoExpPiso}) blur(${o.fundoBlur}px)`; pc.drawImage(bg, 0, 0); pc.filter = 'none';
      pc.globalCompositeOperation = 'destination-in';
      pc.fillStyle = lin(pc, [0, y0 * cam.H], [0, y3 * cam.H], [[0, 'rgba(0,0,0,0)'], [(y1 - y0) / (y3 - y0), 'rgba(0,0,0,1)'], [(y2 - y0) / (y3 - y0), 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
      pc.fillRect(0, 0, cam.W, cam.H); ctx.drawImage(pl, 0, 0);
    }
    nevoa(ctx, cam, o);
    // em volta da caixa o fundo cai ~18%: a caixa vira o meio-tom mais claro do quadro (raio ~150 px, depois some)
    if (o.poca) { const c = cam.P([MUNDO.caixa.x, MUNDO.caixa.y + MUNDO.caixa.h / 2, MUNDO.caixa.z]), [a, r0, r1] = o.poca;
      ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(r1, r1 * 1.1);
      ctx.fillStyle = radial(ctx, [[0, rgba(C.edge, a)], [r0 / r1, rgba(C.edge, a * 0.85)], [1, rgba(C.edge, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); }
    if (o.so === 'fundo') return { cam };   // depuração: só o fundo (com ?so=fundo&fundoBlur=0)
    { const fb = layer(cam.W, cam.H), fc = fb.getContext('2d'); fc.filter = 'blur(10px)'; fc.drawImage(ctx.canvas, 0, 0); o._fundo = fc.getImageData(0, 0, cam.W, cam.H).data; }
    // 2. alambrado, poste e fixação (com a sombra da caixa)
    const nr = layer(cam.W, cam.H), nx = nr.getContext('2d');
    alambrado(nx, cam, o); const pinfo = poste(nx, cam, o); fixacao(nx, cam, o, pinfo); sombraCaixa(nx, cam, o);
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
  function referencias() { const r = { caixa: [MUNDO.caixa.x, 120, MUNDO.caixa.z], poste: [MUNDO.poste.x, 120, MUNDO.poste.z] }; MUNDO.refletores.forEach((R, i) => { r['refletor' + i] = R.pos; }); r.horizonte = [CAM.pos[0], CAM.pos[1], 1e6]; return r; }
  G.CENA = { nome: 'replay', render, CAM, MUNDO, objeto, referencias };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.CENA;
