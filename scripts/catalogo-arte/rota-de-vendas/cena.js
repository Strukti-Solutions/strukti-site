/* Cartão do Rota de Vendas: o celular com a rota, deitado (paisagem) no suporte do painel de um carro parado, com a
   cidade de hora azul desfocada no para-brisa (spec 2026-10-16 §6.2).
   A tela é a interface do celular do hero (scripts/hero-expansao/scene.js, drawPhone): o mapa de quadras girado,
   a rota em ângulos retos do elétrico ao ciano, cinco paradas, o pino de partida e o cartão de concluído, sem texto.
   Nada inventado: nenhuma rua, placa, marca ou cliente real.
   Unidades: cm. x à direita, y para cima, z para a frente (para o para-brisa). O topo do painel é o plano y = 0;
   o celular fica em x = 0, z = 0; a rua lá fora fica 95 cm abaixo do painel.
   Camadas: cidade (por pixel, desfocada) -> bokeh e vidro -> painel (por pixel) e sombras -> suporte -> celular ->
   garras do suporte -> acabamento do kit. */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && typeof require !== 'undefined') ? require('../kit/cena.js') : G.KIT;
  const { C, rgba, mix, clamp, sstep, sub, add, mul, dot, norm, len, rng, LUZ, luz, FLD, LMP, makeCam, frameOf, rrect, path, hull, discT, ID, radial, lin, layer, glow, disco, SKY } = K;

  // ---------------- mundo ----------------
  const MUNDO = {
    painel: { zBase: 52, zBorda: -13, curva: 9, raio: 3.5, alb: [34, 38, 47] },   // topo do painel, do pé do para-brisa até a borda arredondada (mais longe nos lados)
    // o celular em paisagem, de pé no suporte, virado de leve para a câmera (y: a base do aparelho)
    celular: { x: 0, y: 5.6, z: 0, rot: -7, w: 15.2, h: 7.3, d: 0.85, r: 1.05 },
    suporte: { braco: 0.95, ventosa: 3.6, ventosaTopo: 1.7, ventosaH: 2.0, base: [0, 6.5], junta: 1.3 },  // ventosa no painel, braço inclinado até a junta atrás do aparelho
    // a rua: o carro parado junto ao meio-fio da direita; fachadas dos dois lados, postes nas calçadas
    rua: { y: -95, xE: -1450, xD: 620, meioFio: [-1160, 330], faixa: -415, z0: 250 },
    postes: { altura: 760, braco: 150, passo: 3000, zE: 900, zD: 2400, zMax: 30000 },
    // a luz que cai no painel e no aparelho: um poste de fora, pela janela do motorista, alto à esquerda
    chave: { pos: [-230, 125, 25], k: 0.85 }
  };
  // câmera retrato 800 x 1200: um pouco à esquerda e acima do celular; o ponto de fuga da rua fica atrás dele
  const CAM = { W: 800, H: 1200, pos: [-6, 10.4, -42], target: [0, 9.25, 0], F: 1080, shiftY: -144,
    cidadeBlur: 7, cidadeExp: 0.92, bokeh: 22, janelas: 14, vidro: 1, serigrafia: 1, brilhoTela: 0.07, grade: 1, quina: 1,
    vig: 0.9, vigR: [0.2, 0.74], vigC: [0.5, 0.36], bottomFade: [0.5, 0.74, 1.0, 0.36, 0.62], bloom: 0.2, grain: 5, grainBaixo: [0.6, 6.5],
    tela: 1, telaLuz: 0.5, telaFundo: 0.45, halo: 0.05 };

  // ---------------- luzes ----------------
  const corPoste = mix(FLD, LMP, 0.5);
  function postesLista() {
    const R = MUNDO.rua, Pt = MUNDO.postes, out = [];
    for (const [lado, z0] of [[-1, Pt.zE], [1, Pt.zD]]) for (let z = z0; z < Pt.zMax; z += Pt.passo) {
      const xb = lado < 0 ? R.meioFio[0] - 50 : R.meioFio[1] + 50, xh = xb - lado * Pt.braco;
      out.push({ base: [xb, R.y, z], cabeca: [xh, R.y + Pt.altura, z], lado });
    }
    return out;
  }
  const POSTES = postesLista();
  let TELA = null;   // a luz da tela (posição e normal), montada em prepLuz
  function prepLuz(o) {
    LUZ.ceuDir = norm([0, 0.5, 1]);   // a luz do céu entra pelo para-brisa, à frente e de cima (como a janela do hero)
    const pts = [];
    for (const p of POSTES) if (p.cabeca[2] < 16000) pts.push({ pos: p.cabeca, cor: corPoste, k: 1.0, alcance: 700, eixo: [0, -1, 0], cone: [0.2, 0.75], grupo: 'rua' });
    // a chave: uma poça em volta do celular, que cai para perto da câmera (fora dela, 15% da força)
    pts.push({ pos: MUNDO.chave.pos, cor: mix(FLD, LMP, 0.55), k: MUNDO.chave.k, alcance: 1e7, grupo: 'chave',
      mascara: p => 0.15 + 0.85 * Math.exp(-Math.pow((p[0] + 2) / 38, 2) - Math.pow((p[2] - (p[2] < 0 ? 0 : 4)) / (p[2] < 0 ? 16 : 30), 2)) });
    // a tela acesa: uma luz elétrica fraca, só para a frente do aparelho
    const ph = MUNDO.celular, fr = frameOf(ph), t = ph.rot * Math.PI / 180, nrm = [Math.sin(t), 0, -Math.cos(t)];
    TELA = { pos: add(fr(0, ph.h / 2, -ph.d / 2), mul(nrm, 1.2)), n: nrm };
    pts.push({ pos: TELA.pos, cor: [0.24, 0.6, 0.96], k: o.telaLuz * (o.tela != null ? o.tela : 1), alcance: 8, eixo: nrm, cone: [-0.2, 0.55], grupo: 'tela' });
    LUZ.pontos = pts; LUZ.LK = 1;
  }
  const grupo = (...g) => LUZ.pontos.filter(L => g.includes(L.grupo));
  function comLuzes(lista, fn) { const old = LUZ.pontos; LUZ.pontos = lista; try { return fn(); } finally { LUZ.pontos = old; } }

  // ---------------- a cidade lá fora (por pixel; depois desfocada) ----------------
  function h3(a, b, c) { let x = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1442695041); x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
  // quarteirões de cada lado: [z0, z1, altura acima da rua], com cruzamentos de vez em quando
  function quarteiroes(seed, o_alt) {
    const R = rng(seed), out = []; let z = MUNDO.rua.z0;
    while (z < 42000) { const l = 1300 + R() * 3200, top = 800 + Math.pow(R(), 1.6) * (o_alt || 4600); out.push([z, z + l, top]); z += l + (R() < 0.33 ? 1300 : 90 + R() * 160); }
    return out;
  }
  const QE = quarteiroes(31, 4200), QD = quarteiroes(57, 5200);
  const pickJanela = t => t < 0.6 ? C.n300 : t < 0.9 ? C.e300 : C.n100;   // as cores das janelas da cidade do hero
  function janela(lado, fi, ci, zi) {
    // acesa? (fileiras inteiras apagadas às vezes, como no hero)
    if (h3(fi, zi, lado * 7 + 1) < 0.28) return null;
    const r = h3(fi, ci, lado * 13 + 3); if (r > (fi === 0 ? 0.1 : 0.17)) return null;
    // as lojas do térreo: poucas, baixas e neutras (uma vitrine clara perto da câmera puxava o olho)
    return fi === 0 ? { cor: mix(C.lampW, C.n300, 0.5), a: 0.12 + h3(ci, fi, 91 + lado) * 0.12 } : { cor: pickJanela(h3(ci, fi, 77 + lado)), a: 0.3 + h3(ci, fi, 91 + lado) * 0.4 };
  }
  function cidade(ctx, cam, o) {
    const { W, H } = cam, img = ctx.createImageData(W, H), D = img.data, pos = cam.pos, Rr = MUNDO.rua, S = SKY();
    const rua = grupo('rua'), neb = mix(C.n700, C.n600, 0.35);
    const fogT = dist => 1 - Math.exp(-dist / 9000);
    const asfalto = [30, 34, 43], calcada = [50, 54, 63], fachada = [46, 52, 66], vidroJ = mix(C.n800, C.n700, 0.5), faixaC = [150, 156, 162];
    const andar = 330, vao = 280;
    const naQuadra = (Q, z) => { for (const q of Q) { if (z < q[0]) return null; if (z <= q[1]) return q; } return null; };
    for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
      const d = cam.ray(sx + 0.5, sy + 0.5), dl = len(d);
      let best = 1e12, kind = 0, hit = null;
      // fachadas (planos x = xE e x = xD), com o fundo dos cruzamentos 22 m para dentro
      for (const [lado, xf, Q] of [[-1, Rr.xE, QE], [1, Rr.xD, QD]]) {
        if (Math.sign(d[0]) !== lado) continue;
        const t = (xf - pos[0]) / d[0], y = pos[1] + d[1] * t, z = pos[2] + d[2] * t;
        if (t <= 0 || t >= best || y < Rr.y) continue;
        const q = naQuadra(Q, z);
        if (q) { if (y < Rr.y + q[2]) { best = t; kind = 1; hit = { lado, y, z, q }; } }
        else if (z < 42000) {
          const t2 = (xf + lado * 2200 - pos[0]) / d[0], y2 = pos[1] + d[1] * t2, z2 = pos[2] + d[2] * t2;
          if (t2 < best && y2 > Rr.y && y2 < Rr.y + 1400 + h3(Math.floor(z2 / 900), lado, 5) * 2600) { best = t2; kind = 2; hit = { lado, y: y2, z: z2 }; }
        }
      }
      if (d[1] < 0) { const t = (Rr.y - pos[1]) / d[1]; if (t < best) { best = t; kind = 3; } }
      let col, dist = best * dl;
      if (kind === 1 || kind === 2) {
        const { lado, y, z } = hit, p = [lado < 0 ? Rr.xE : Rr.xD, y, z], n = [-lado, 0, 0];
        col = comLuzes(rua, () => luz(kind === 1 ? fachada : mul(fachada, 0.8), p, n, { amb: 0.75, wk: 0 }));
        const fi = Math.floor((y - Rr.y) / andar), ci = Math.floor(z / vao), fy = (y - Rr.y) / andar - fi, fz = z / vao - ci;
        const naJanela = fi === 0 ? (fy > 0.12 && fy < 0.78 && fz > 0.06 && fz < 0.94) : (fy > 0.32 && fy < 0.8 && fz > 0.18 && fz < 0.82);
        if (naJanela && (kind === 1 ? y < Rr.y + hit.q[2] - 120 : true)) {
          const j = janela(lado, fi, ci, kind === 1 ? Math.floor(hit.q[0]) : 9);
          col = j ? mix(col, j.cor, j.a * (kind === 2 ? 0.5 : 1)) : mix(col, vidroJ, 0.45);
        }
      } else if (kind === 3) {
        const x = pos[0] + d[0] * best, z = pos[2] + d[2] * best, p = [x, Rr.y, z];
        const naRua = x > Rr.meioFio[0] && x < Rr.meioFio[1];
        const faixa = naRua && Math.abs(x - Rr.faixa) < 7 && (z % 900) < 450;
        col = comLuzes(rua, () => luz(faixa ? faixaC : naRua ? asfalto : calcada, p, [0, 1, 0], { amb: 0.8, wk: 0.6 }));
        // o asfalto acetinado: o reflexo dos postes alonga na direção da câmera
        if (naRua) { const v = norm(sub(pos, p)); let sp = 0; for (const L of rua) { const hv = norm(add(v, norm(sub(L.pos, p)))); sp += Math.pow(Math.max(0, hv[1]), 140); }
          col = add(col, mul(corPoste, 255 * sp * 0.22)); }
      } else {
        // céu de hora azul e, ao longe, uma linha baixa de prédios
        const el = Math.asin(d[1] / dl) * 180 / Math.PI, az = Math.atan2(d[0], d[2]) * 180 / Math.PI;
        col = K.skyCol(el, S); dist = 1e5;
        const b = Math.floor((az + 90) / 1.3), topo = 0.25 + h3(b, 3, 4) * 1.6 + (h3(b, 5, 6) < 0.12 ? 1.8 : 0);
        if (el < topo) { col = mix(C.n700, C.n800, 0.45); dist = 40000;
          if (h3(Math.floor(az * 9), Math.floor(el * 7), 11) < 0.05) col = mix(col, pickJanela(h3(Math.floor(az * 9), 1, 2)), 0.25); }
      }
      if (dist < 1e5) col = mix(col, neb, fogT(dist) * 0.55);
      const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // os postes: o tubo fino e escuro e a luminária clara (o desfoque e o bokeh vêm depois)
    for (const p of POSTES) {
      const a = cam.P(p.base), b = cam.P(p.cabeca), c = cam.P([p.base[0], p.cabeca[1], p.base[2]]); if (a[2] <= 0) continue;
      const w = Math.max(1, cam.S(p.base) * 14);
      ctx.strokeStyle = rgba(mix(C.n900, C.n800, 0.3), 0.85); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.fillStyle = rgba(mix(corPoste.map(v => v * 255), C.white, 0.2), 0.9); ctx.beginPath(); ctx.ellipse(b[0], b[1] + w * 0.6, w * 2.2, w * 0.9, 0, 0, 7); ctx.fill();
    }
  }
  // o bokeh: as luminárias dos postes (discos do mesmo tamanho, um pouco maiores perto) e algumas janelas
  function bokeh(ctx, cam, o) {
    const dc = layer(cam.W, cam.H), dx = dc.getContext('2d'), Rr = MUNDO.rua, R = rng(808);
    for (const p of POSTES) {
      const q = cam.P(p.cabeca); if (q[2] <= 0 || q[0] < -60 || q[0] > cam.W + 60 || q[1] < -60) continue;
      const dist = len(sub(p.cabeca, cam.pos)), perto = clamp(1 - dist / 12000, 0, 1);
      disco(dx, q, o.bokeh * (0.8 + 0.45 * perto), mix(corPoste.map(v => v * 255), C.n300, 0.25), (0.16 + 0.26 * perto));
    }
    // janelas: as mesmas do passe por pixel (mesmo sorteio), poucas viram disco
    let n = 0;
    for (const [lado, xf, Q] of [[-1, Rr.xE, QE], [1, Rr.xD, QD]]) for (const q of Q) {
      if (q[0] > 9000) break;
      for (let fi = 1; fi * 330 < q[2] - 150; fi++) for (let ci = Math.ceil(q[0] / 280); ci * 280 < q[1] - 280; ci++) {
        const j = janela(lado, fi, ci, Math.floor(q[0])); if (!j || h3(ci, fi, 404 + lado) > 0.16) continue;
        const pw = [xf, Rr.y + (fi + 0.56) * 330, (ci + 0.5) * 280], s = cam.P(pw);
        if (s[2] <= 0 || s[0] < -30 || s[0] > cam.W + 30 || s[1] < -30 || s[1] > cam.H * 0.55) continue;
        disco(dx, s, o.bokeh * (0.55 + R() * 0.45), j.cor, 0.1 + R() * 0.12); n++;
        if (n > (o.janelas || 14)) break;
      }
    }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(2px)'; ctx.drawImage(dc, 0, 0); ctx.restore();
    // o ar iluminado em volta das luminárias mais perto
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const p of POSTES) { const q = cam.P(p.cabeca); if (q[2] <= 0) continue; const dist = len(sub(p.cabeca, cam.pos)); if (dist > 9000) continue;
      glow(ctx, q, o.bokeh * 4.5, mix(C.floodW, C.n300, 0.5), 0.07 * (1 - dist / 9000)); }
    ctx.restore();
  }

  // ---------------- o para-brisa: a serigrafia do pé do vidro, o véu e o reflexo do painel no vidro ----------------
  function linhaPainel(cam) { const pb = MUNDO.painel.zBase; return cam.P([0, 0, pb])[1]; }   // a altura (px) do pé do para-brisa no centro
  function vidro(ctx, cam, o) {
    const P = cam.P, yb = linhaPainel(cam);
    if (o.serigrafia) {
      // a faixa preta pontilhada no pé do vidro (por dentro): sólida até 2 cm e depois pontos que diminuem até 4,5 cm
      const zb = MUNDO.painel.zBase, tg = Math.tan(28 * Math.PI / 180), G = (x, hh) => P([x, hh, zb - hh / tg]);
      const fx = layer(cam.W, cam.H), fc = fx.getContext('2d'), cor = rgba(mix(C.black, C.n950, 0.5), 0.94);
      fc.fillStyle = cor; path(fc, [G(-90, -0.5), G(90, -0.5), G(90, 2), G(-90, 2)]); fc.fill();
      for (let hh = 2.2; hh < 4.6; hh += 0.36) { const k = 1 - (hh - 2.2) / 2.4; for (let x = -90; x < 90; x += 0.36) {
        const q = G(x + ((hh * 2.78) % 2 < 1 ? 0.18 : 0), hh), r = cam.S([x, hh, zb]) * 0.16 * Math.sqrt(k); if (q[0] < -4 || q[0] > cam.W + 4 || r < 0.25) continue;
        fc.beginPath(); fc.arc(q[0], q[1], r, 0, 7); fc.fill(); } }
      ctx.drawImage(fx, 0, 0);
    }
    if (o.vidro) {
      // o vidro tira um pouco do contraste e, perto do pé, reflete o painel (uma faixa um pouco mais clara)
      ctx.fillStyle = rgba(mix(C.n700, C.n600, 0.3), 0.06 * o.vidro); ctx.fillRect(0, 0, cam.W, yb);
      ctx.fillStyle = lin(ctx, [0, yb - 70], [0, yb], [[0, rgba(C.n500, 0)], [1, rgba(mix(C.n500, C.n400, 0.3), 0.1 * o.vidro)]]); ctx.fillRect(0, yb - 70, cam.W, 70);
    }
  }

  // ---------------- o painel (por pixel) ----------------
  function painel(ctx, cam, o) {
    const { W, H } = cam, pos = cam.pos, Pn = MUNDO.painel, img = ctx.createImageData(W, H), D = img.data;
    const luzes = grupo('chave', 'tela'), y0 = Math.max(0, Math.floor(linhaPainel(cam)) - 40);
    // a borda de perto do painel é um arco (mais longe da câmera nos lados) que arredonda para baixo (raio Pn.raio)
    // e vira a face do painel, quase vertical e no escuro: o painel não é uma mesa que vai até a câmera
    const borda = x => Pn.zBorda + Pn.curva * Math.pow(x / 60, 2), rr = Pn.raio;
    for (let sy = y0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
      const d = cam.ray(sx + 0.5, sy + 0.5); if (d[1] >= 0) continue;
      const t = -pos[1] / d[1], x = pos[0] + d[0] * t, z = pos[2] + d[2] * t; if (z > Pn.zBase) continue;
      let p = [x, 0, z], n = [0, 1, 0], alb = Pn.alb, face = 0;
      const zb = borda(x);
      if (z < zb) {
        // passou da borda: o raio desce pelo arredondado (aproximação: um quarto de círculo visto de lado) e pela face
        const tf = (zb - rr - pos[2]) / d[2], yf = pos[1] + d[1] * tf;
        if (yf > -rr) { const a = clamp(-yf / rr, 0, 1), ang = Math.asin(a); n = [0, Math.cos(ang), -Math.sin(ang)]; p = [pos[0] + d[0] * tf, yf, zb - rr * (1 - Math.cos(ang))]; }
        else { n = [0, 0.1, -1]; p = [pos[0] + d[0] * tf, yf, zb - rr]; face = 1; }
      }
      // a grade do desembaçador, perto do vidro
      if (o.grade && !face && z > Pn.zBase - 13 && z < Pn.zBase - 4 && Math.abs(x) < 42) alb = ((z % 1.5) + 1.5) % 1.5 < 0.6 ? mul(alb, 0.45) : mul(alb, 1.08);
      let col = comLuzes(luzes, () => luz(alb, p, norm(n), { amb: face ? 0.32 : 0.55, wk: 0.5 }));
      // brilho rasante do plástico perto do vidro (reflete o céu)
      if (!face) col = add(col, mul(mix(C.n600, C.n500, 0.4), 0.16 * sstep(Pn.zBase - 30, Pn.zBase - 2, z)));
      // a quina arredondada pega um fio de luz do para-brisa (mais forte no meio, some nos lados)
      if (!face && z < zb + 1.2) { const k = Math.exp(-Math.pow((z < zb ? (zb - p[2]) / (rr * 0.45) : (z - zb) / 1.2), 2)) * Math.exp(-Math.pow((x + 2) / 55, 2)); col = add(col, mul(mix(C.n500, C.n400, 0.4), 0.22 * k * (o.quina != null ? o.quina : 1))); }
      // a fresta escura no pé do para-brisa
      if (z > Pn.zBase - 1.6) col = mul(col, 0.35);
      const i = (sy * W + sx) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---------------- o celular e o suporte ----------------
  function pontosCelular(dz = 0) { const o = MUNDO.celular, fr = frameOf(o), r = []; for (const [u, hh] of rrect(o.w, o.h, o.r, 3)) for (const v of [-o.d / 2, o.d / 2 + dz]) r.push(fr(u, hh + o.h / 2, v)); return r; }
  // o suporte: a ventosa no painel (atrás do aparelho), o braço inclinado e a junta atrás do centro do aparelho
  function geoSuporte() {
    const o = MUNDO.celular, s = MUNDO.suporte, fr = frameOf(o);
    const base = [o.x + s.base[0], 0, o.z + s.base[1]], topo = [base[0], s.ventosaH, base[2]], junta = fr(0, o.h / 2, o.d / 2 + s.junta);
    return { base, topo, junta };
  }
  function pontosSuporte() {
    const s = MUNDO.suporte, g = geoSuporte(), r = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; r.push([g.base[0] + s.ventosa * Math.cos(a), 0, g.base[2] + s.ventosa * Math.sin(a)], [g.base[0] + s.ventosaTopo * Math.cos(a), s.ventosaH, g.base[2] + s.ventosaTopo * Math.sin(a)]); }
    for (const p of [g.topo, g.junta]) for (const dx of [-s.braco, s.braco]) r.push([p[0] + dx, p[1], p[2]]);
    return r;
  }
  // sombras no painel: a do aparelho e do suporte pela chave (projetadas no plano y = 0), mais o contato da base
  function sombras(ctx, cam, o) {
    const L = MUNDO.chave.pos, P = cam.P, proj = p => { const t = L[1] / (L[1] - p[1]); return P([L[0] + (p[0] - L[0]) * t, 0, L[2] + (p[2] - L[2]) * t]); };
    const sh = layer(cam.W, cam.H), s = sh.getContext('2d'), k = cam.S([0, 0, 0]);
    s.filter = `blur(${Math.round(k * 0.7)}px)`; s.fillStyle = 'rgba(0,0,0,0.55)'; path(s, hull(pontosCelular().map(proj))); s.fill();
    s.filter = `blur(${Math.round(k * 0.3)}px)`; s.fillStyle = 'rgba(0,0,0,0.6)'; path(s, hull(pontosSuporte().map(proj))); s.fill();
    // contato: a base apoiada no painel
    { const sp = MUNDO.suporte, c = geoSuporte().base; s.filter = `blur(${Math.round(k * 0.35)}px)`; s.fillStyle = 'rgba(0,0,0,0.7)';
      discT(s, cam, [c[0] + 0.3, 0.01, c[2] + 0.2], [sp.ventosa * 1.1, 0, 0], [0, 0, sp.ventosa * 1.1]); s.beginPath(); s.arc(0, 0, 1, 0, 7); s.fill(); ID(s); }
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(sh, 0, 0); ctx.restore();
  }
  // a tela acesa clareia o painel à frente do aparelho, como o celular do hero na mesa (elétrico, fraco e largo)
  function brilhoTela(ctx, cam, o) {
    const a = o.brilhoTela * (o.tela != null ? o.tela : 1); if (!(a > 0)) return; const ph = MUNDO.celular;
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    discT(ctx, cam, [ph.x, 0.02, ph.z - 0.5], [22, 0, 0], [0, 0, 9]);
    ctx.fillStyle = radial(ctx, [[0, rgba(C.e400, a)], [0.5, rgba(C.e500, a * 0.33)], [1, rgba(C.e500, 0)]]); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ID(ctx);
    ctx.restore();
  }
  function suporte(ctx, cam, o) {
    const s = MUNDO.suporte, P = cam.P, g = geoSuporte();
    const luzes = grupo('chave', 'tela'), L = (alb, p, n, k) => comLuzes(luzes, () => luz(alb, p, n, k)), plast = [30, 34, 42];
    // a ventosa: um tronco de cone baixo no painel, com a borda de baixo mais larga e um aro claro em cima
    { const c = g.base, bot = [], top = [];
      for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; bot.push(P([c[0] + s.ventosa * Math.cos(a), 0, c[2] + s.ventosa * Math.sin(a)])); top.push(P([c[0] + s.ventosaTopo * Math.cos(a), s.ventosaH, c[2] + s.ventosaTopo * Math.sin(a)])); }
      const nC = norm([0, s.ventosa - s.ventosaTopo, -s.ventosaH]);
      const cE = L(plast, [c[0] - s.ventosa, 0.8, c[2] - 1], norm([-0.7, 0.45, -0.55]), { amb: 0.6, wk: 0.4 }), cD = L(plast, [c[0] + s.ventosa, 0.8, c[2] - 1], norm([0.7, 0.45, -0.55]), { amb: 0.6, wk: 0.4 });
      path(ctx, hull(bot.concat(top))); ctx.fillStyle = lin(ctx, P([c[0] - s.ventosa, 1, c[2]]), P([c[0] + s.ventosa, 1, c[2]]), [[0, rgba(cE)], [0.45, rgba(L(plast, [c[0], 1, c[2] - s.ventosa], nC, { amb: 0.6, wk: 0.4 }))], [1, rgba(mul(cD, 0.75))]]); ctx.fill();
      path(ctx, top); ctx.fillStyle = rgba(L(plast, [c[0], s.ventosaH, c[2]], [0, 1, 0], { amb: 0.6, wk: 0.6 })); ctx.fill();
      // o lábio de borracha na borda de baixo pega a luz da frente
      ctx.strokeStyle = rgba(C.n400, 0.16); ctx.lineWidth = 1; ctx.beginPath(); bot.slice(6, 19).forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
    // o braço: um tubo da ventosa até a junta atrás do aparelho, inclinado para a câmera (sombreado de lado)
    { const a = g.topo, b = g.junta, ax = norm(sub(b, a)), sd = [1, 0, 0], w = s.braco;
      const q = [P(add(a, mul(sd, -w))), P(add(a, mul(sd, w))), P(add(b, mul(sd, w))), P(add(b, mul(sd, -w)))];
      const st = []; for (let i = 0; i <= 6; i++) { const k = i / 6, ang = (k - 0.5) * Math.PI * 0.9, n = [Math.sin(ang), 0.15, -Math.cos(ang)]; st.push([k, rgba(L(plast, add(a, mul(sub(b, a), 0.5)), norm(n), { amb: 0.6, wk: 0.3 }))]); }
      path(ctx, q); ctx.fillStyle = lin(ctx, q[0], q[1], st); ctx.fill();
      // o anel de aperto, no pé do braço
      const r0 = add(a, mul(ax, 0.3)), r1 = add(a, mul(ax, 1.5)), w2 = w * 1.45;
      path(ctx, [P(add(r0, [-w2, 0, 0])), P(add(r0, [w2, 0, 0])), P(add(r1, [w2, 0, 0])), P(add(r1, [-w2, 0, 0]))]);
      ctx.fillStyle = lin(ctx, P(add(r0, [-w2, 0, 0])), P(add(r0, [w2, 0, 0])), [[0, rgba(L(plast, r0, norm([-0.6, 0.2, -0.8]), { amb: 0.6 }))], [1, rgba(mul(L(plast, r0, norm([0.6, 0.2, -0.8]), { amb: 0.6 }), 0.7))]]); ctx.fill(); }
  }
  // garras: as duas laterais (com o lábio sobre a borda da frente) e os dois pés de baixo
  function garras(ctx, cam, o) {
    const ph = MUNDO.celular, fr = frameOf(ph), P = cam.P, hd = ph.d / 2, t = ph.rot * Math.PI / 180, fn = [Math.sin(t), 0, -Math.cos(t)];
    const luzes = grupo('chave', 'tela'), L = (alb, p, n, k) => comLuzes(luzes, () => luz(alb, p, n, k)), plast = [30, 34, 42];
    const peca = (u0, u1, h0, h1, rr) => {
      const at = (u, h) => P(fr(u, h, -hd - 0.32));
      const pts = rrect(u1 - u0, h1 - h0, rr, 4).map(([u, h]) => at((u0 + u1) / 2 + u, (h0 + h1) / 2 + h));
      // a espessura (vista de cima/lado): a mesma forma, empurrada para trás
      const back = rrect(u1 - u0, h1 - h0, rr, 4).map(([u, h]) => P(fr((u0 + u1) / 2 + u, (h0 + h1) / 2 + h, hd + 0.3)));
      path(ctx, hull(pts.concat(back))); ctx.fillStyle = rgba(mix(L(plast, fr((u0 + u1) / 2, h1, 0), [0, 1, 0], { amb: 0.6, wk: 0.5 }), C.black, 0.2)); ctx.fill();
      const cTop = L(plast, fr(u0, h1, -hd), fn, { amb: 0.62 }), cBot = L(plast, fr(u1, h0, -hd), fn, { amb: 0.5 });
      path(ctx, pts); ctx.fillStyle = lin(ctx, at(u0, h1), at(u1, h0), [[0, rgba(add(cTop, [4, 4, 5]))], [1, rgba(mul(cBot, 0.8))]]); ctx.fill();
      ctx.strokeStyle = lin(ctx, at(u0, h1), at(u1, h0), [[0, rgba(C.n400, 0.3)], [1, rgba(C.n500, 0.05)]]); ctx.lineWidth = 1; ctx.stroke();
    };
    const hc = ph.h / 2;
    peca(-ph.w / 2 - 0.5, -ph.w / 2 + 0.32, hc - 1.15, hc + 1.15, 0.3);
    peca(ph.w / 2 - 0.32, ph.w / 2 + 0.5, hc - 1.15, hc + 1.15, 0.3);
    for (const u of [-4.4, 4.4]) peca(u - 0.75, u + 0.75, -0.55, 0.3, 0.25);
  }
  function celular(ctx, cam, o) {
    const ph = MUNDO.celular, fr = frameOf(ph), P = cam.P, hd = ph.d / 2, hc = ph.h / 2;
    const luzes = grupo('chave'), L = (alb, p, n, k) => comLuzes(luzes, () => luz(alb, p, n, k));
    const outl = rrect(ph.w, ph.h, ph.r, 8);
    const front = outl.map(([u, h]) => P(fr(u, hc + h, -hd))), back = outl.map(([u, h]) => P(fr(u, hc + h, hd)));
    // o corpo (a borda de alumínio escuro): mais claro em cima, onde pega o céu do para-brisa
    const sideA = [58, 64, 76], cTop = L(sideA, fr(0, ph.h, 0), [0, 1, 0], { wk: 1 }), cBot = L(sideA, fr(0, 0, 0), [0, -0.3, -1], { wk: 0.2 });
    path(ctx, hull(front.concat(back))); ctx.fillStyle = lin(ctx, P(fr(0, ph.h, 0)), P(fr(0, 0, 0)), [[0, rgba(cTop)], [0.5, rgba(mix(cTop, cBot, 0.6))], [1, rgba(mul(cBot, 0.8))]]); ctx.fill();
    path(ctx, front); ctx.fillStyle = rgba([6, 9, 13]); ctx.fill();
    path(ctx, front); ctx.strokeStyle = rgba(mix(C.n400, C.lampW, 0.3), 0.42); ctx.lineWidth = Math.max(0.8, cam.S(fr(0, hc, 0)) * 0.05); ctx.stroke();
    // a aresta de cima pega o céu: um fio claro
    { const tp = outl.filter(([u, h]) => h > ph.h / 2 - ph.r * 0.5).sort((a, b) => a[0] - b[0]).map(([u, h]) => P(fr(u, hc + h, -hd + 0.05)));
      ctx.beginPath(); tp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = lin(ctx, tp[0], tp[tp.length - 1], [[0, rgba(C.n300, 0.08)], [0.4, rgba(C.n300, 0.3)], [1, rgba(C.n300, 0.12)]]); ctx.lineWidth = Math.max(1, cam.S(fr(0, hc, 0)) * 0.06); ctx.stroke(); }
    // a tela: a mesma interface do celular do hero (drawPhone), em pé e em paisagem
    const sw = ph.h - 0.5, sh = ph.w - 0.55;
    const S2W = (X, Y) => fr(X, hc - Y, -hd - 0.005);      // X: da esquerda para a direita; Y: de cima para baixo
    const O = P(S2W(0, 0)), ex = P(S2W(1, 0)), ey = P(S2W(0, 1));
    ctx.save();
    ctx.setTransform(ex[0] - O[0], ex[1] - O[1], ey[0] - O[0], ey[1] - O[1], O[0], O[1]);
    const HX = sh / 2, HY = sw / 2;
    ctx.beginPath(); ctx.roundRect(-HX, -HY, sh, sw, 0.8); ctx.clip();
    // o fundo do mapa: o do hero, um pouco mais aceso (a tela é a luz mais forte do quadro; telaFundo 0 = o do hero)
    ctx.fillStyle = rgba(mix(mix(C.n900, C.n950, 0.25), C.n800, o.telaFundo || 0)); ctx.fillRect(-HX, -HY, sh, sw);
    const th = -4 * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th), gs = 1.15;
    const G2 = (i, j) => [(i * ct - j * st) * gs, (i * st + j * ct) * gs - 0.4];
    const R = rng(11);
    for (let i = -8; i < 8; i++) for (let j = -5; j < 5; j++) { const r = R(); if (r < 0.45) { const q = [G2(i + 0.09, j + 0.09), G2(i + 0.91, j + 0.09), G2(i + 0.91, j + 0.91), G2(i + 0.09, j + 0.91)]; path(ctx, q); ctx.fillStyle = rgba(r < 0.15 ? C.n700 : C.n800, r < 0.15 ? 0.45 : 0.7); ctx.fill(); } }
    ctx.lineCap = 'butt';
    const seg = (a, b, col, wd) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.stroke(); };
    for (let i = -9; i <= 9; i++) { const maj = i % 3 === 0; seg(G2(i, -7), G2(i, 7), rgba(maj ? C.n500 : C.n600, maj ? 0.55 : 0.5), maj ? 0.13 : 0.06); }
    for (let j = -6; j <= 6; j++) { const maj = j % 3 === 0; seg(G2(-11, j), G2(11, j), rgba(maj ? C.n500 : C.n600, maj ? 0.55 : 0.5), maj ? 0.13 : 0.06); }
    seg([-HX - 1, 3.6], [HX + 1, -3.0], rgba(C.n500, 0.35), 0.17);
    const RT = [[-5.5, 2], [-3, 2], [-3, -1], [0, -1], [0, -2], [3, -2], [3, 0], [4.3, 0]].map(([i, j]) => G2(i, j));
    const routePath = () => { ctx.beginPath(); ctx.moveTo(RT[0][0], RT[0][1]); for (let i = 1; i < RT.length - 1; i++) ctx.arcTo(RT[i][0], RT[i][1], RT[i + 1][0], RT[i + 1][1], 0.32); ctx.lineTo(RT[RT.length - 1][0], RT[RT.length - 1][1]); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    routePath(); ctx.strokeStyle = rgba(C.c400, 0.12); ctx.lineWidth = 0.42; ctx.stroke();
    routePath(); const gr = ctx.createLinearGradient(RT[0][0], RT[0][1], RT[RT.length - 1][0], RT[RT.length - 1][1]); gr.addColorStop(0, rgba(C.e500, 0.9)); gr.addColorStop(1, rgba(C.c400, 0.85)); ctx.strokeStyle = gr; ctx.lineWidth = 0.16; ctx.stroke();
    const stops = [[-4.3, 2], [-3, 0.4], [-1.4, -1], [1.6, -2], [4.3, 0]].map(([i, j]) => G2(i, j));
    stops.forEach((p, k) => {
      const last = k === stops.length - 1;
      if (last) { ctx.fillStyle = radial(ctx, [[0, rgba(C.c300, 0.25)], [1, rgba(C.c300, 0)]], 0.7); ctx.save(); ctx.translate(p[0], p[1]); ctx.beginPath(); ctx.arc(0, 0, 0.7, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(p[0], p[1], last ? 0.24 : 0.19, 0, 7); ctx.fillStyle = rgba(last ? C.c300 : C.n200, 0.8); ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], last ? 0.13 : 0.1, 0, 7); ctx.fillStyle = rgba(last ? C.c400 : C.e400); ctx.fill();
    });
    { const p = RT[0]; ctx.beginPath(); ctx.moveTo(p[0], p[1] + 0.02); ctx.lineTo(p[0] - 0.2, p[1] - 0.42); ctx.arc(p[0], p[1] - 0.55, 0.27, Math.PI * 0.82, Math.PI * 0.18); ctx.closePath(); ctx.fillStyle = rgba(C.e500); ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1] - 0.55, 0.1, 0, 7); ctx.fillStyle = rgba(C.n50); ctx.fill(); }
    { const x0 = 1.7, y0 = 1.25, cw = 4.9, chh = 1.55; ctx.beginPath(); ctx.roundRect(x0, y0, cw, chh, 0.38); ctx.fillStyle = rgba(mix(C.n950, C.n900, 0.3), 0.94); ctx.fill(); ctx.strokeStyle = rgba(C.n700, 0.9); ctx.lineWidth = 0.05; ctx.stroke();
      const cx0 = x0 + 0.8, cy0 = y0 + chh / 2; ctx.beginPath(); ctx.arc(cx0, cy0, 0.42, 0, 7); ctx.fillStyle = rgba(C.c400, 0.82); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx0 - 0.2, cy0 + 0.01); ctx.lineTo(cx0 - 0.05, cy0 + 0.16); ctx.lineTo(cx0 + 0.22, cy0 - 0.14); ctx.strokeStyle = rgba(C.n950); ctx.lineWidth = 0.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      { const bx = x0 + 1.55, bw = cw - 2.0; ctx.beginPath(); ctx.roundRect(bx, cy0 - 0.11, bw, 0.22, 0.11); const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, rgba(C.e500, 0.85)); g.addColorStop(1, rgba(C.c400, 0.85)); ctx.fillStyle = g; ctx.fill(); } }
    { const g = ctx.createLinearGradient(-HX, -HY, HX * 0.2, HY); g.addColorStop(0, rgba(C.n300, 0.07)); g.addColorStop(0.5, rgba(C.n300, 0.015)); g.addColorStop(1, rgba(C.n300, 0)); ctx.fillStyle = g; ctx.fillRect(-HX, -HY, sh, sw); }
    ctx.restore();
    return { front };
  }

  // ---------------- render ----------------
  function render(canvas, extra) {
    const o = Object.assign({}, CAM, extra || {});
    if (typeof o.grainBaixo === 'string') o.grainBaixo = o.grainBaixo.split(',').map(Number);
    prepLuz(o); const cam = makeCam(o); const ctx = canvas.getContext('2d');
    // 1. a cidade, desfocada (por baixo, sem desfoque: as bordas do desfoque não puxam preto)
    const bg = layer(cam.W, cam.H), bx = bg.getContext('2d'); cidade(bx, cam, o);
    const ex = `brightness(${o.cidadeExp || 1})`;
    ctx.filter = ex; ctx.drawImage(bg, 0, 0);
    ctx.filter = `${ex} blur(${o.cidadeBlur}px)`; ctx.drawImage(bg, 0, 0); ctx.filter = 'none';
    bokeh(ctx, cam, o);
    if (o.so === 'cidade') return { cam };
    vidro(ctx, cam, o);
    // 2. o painel, com as sombras
    const pl = layer(cam.W, cam.H), pc = pl.getContext('2d'); painel(pc, cam, o); sombras(pc, cam, o); brilhoTela(pc, cam, o);
    ctx.drawImage(pl, 0, 0);
    // 3. o suporte, o celular e as garras
    suporte(ctx, cam, o); celular(ctx, cam, o); garras(ctx, cam, o);
    // a tela acesa no carro escuro: um halo elétrico largo e fraco em volta do aparelho
    if (o.halo) { const ph = MUNDO.celular, c = cam.P([ph.x, ph.y + ph.h / 2, ph.z]), r = cam.S([ph.x, ph.y, ph.z]) * ph.w * 0.75;
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(c[0], c[1]); ctx.scale(r, r * 0.62);
      ctx.fillStyle = radial(ctx, [[0, rgba(C.e500, o.halo)], [0.55, rgba(C.e500, o.halo * 0.5)], [1, rgba(C.e500, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); }
    // 4. acabamento do hero
    K.acabamento(ctx, cam, o);
    return { cam };
  }
  // pontos do objeto principal (o celular), para a sonda de enquadramento
  function objeto() { return pontosCelular(); }
  function referencias() {
    const ph = MUNDO.celular;
    return { celular: [ph.x, ph.y + ph.h / 2, ph.z], basePainel: [0, 0, MUNDO.painel.zBase], baseSuporte: geoSuporte().base,
      fuga: [CAM.pos[0], CAM.pos[1], 1e6], poste0: POSTES[0].cabeca, poste1: POSTES[1].cabeca };
  }
  G.CENA = { nome: 'rota-de-vendas', render, CAM, MUNDO, objeto, referencias };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.CENA;
