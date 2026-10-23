// node vetor.js > ../../src/components/sections/aparelhoVetor.json
// O aparelho em vetor do site (src/components/sections/AparelhoVetor.tsx, spec §6: "o aparelho é vetor por cima, para
// ficar nítido até o fim"): a mesma geometria e a mesma luz do notebook e do celular que o scene.js desenha (drawLaptop e
// drawCelularEmPe), projetadas pelas câmeras das mídias (media, 1280 x 720, e mediaRetrato, 720 x 1280), onde eles não são
// desenhados (`semAparelho`). Tudo em px da mídia, com a origem no meio do pé da tela e y para baixo.
//
// - A moldura (a tampa do notebook, o corpo do celular) é CSS no site: uma borda de espessura fixa em volta da tela HTML,
//   que tem a proporção da janela (Q13). Daqui saem as espessuras (`lado`, `topo`, `queixo`), o raio, o aro e as cores.
// - O que fica abaixo do pé da tela (a base com o teclado, a dobradiça; o suporte) não depende da janela: sai em SVG, com
//   `caixa` = [x, y, largura, altura] (o viewBox). O site prende a tela pelo pé da tela da arte (ENTRADA.aparelho, `cy +
//   altura / 2`), então a base e o suporte caem sempre no lugar vazio da mesa.
// - A sombra de contato (`contato`) é nova: uma elipse escura sob o pé, para a base e o suporte pousarem na mesa.
const F = require('./scene.js');
const { C } = F;
const ALU = [31, 34, 41], VIDRO = [9, 11, 15];

const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const cor = (c, a = 1) => `rgb(${c.map(v => Math.round(Math.min(255, Math.max(0, v)))).join(' ')}${a < 1 ? ` / ${r2(a)}` : ''})`;
const d = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join('') + 'Z';
const caixa = (pts, folga = 1) => {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.floor(Math.min(...xs) - folga), y0 = Math.floor(Math.min(...ys) - folga);
  return [x0, y0, Math.ceil(Math.max(...xs) + folga) - x0, Math.ceil(Math.max(...ys) + folga) - y0];
};
// a quina que pega a luz: um traço com degradê, de `de` a `para`
const quina = (a, b, largura, de, para) => ({ x1: r2(a[0]), y1: r2(a[1]), x2: r2(b[0]), y2: r2(b[1]), largura: r2(largura), de, para });
const elipse = (cx, cy, rx, ry) => ({ cx: r2(cx), cy: r2(cy), rx: r2(rx), ry: r2(ry) });
const contatoCor = cor(C.edge, 0.55);
// A caixa [x, y, w, h] menos o corpo do celular (de x0 a x1, do alto da caixa até o pé `pe`, cantos de baixo de raio r):
// um caminho para `clip-rule: evenodd`.
const semCorpo = (x0, x1, pe, r, [cx, cy, cw, ch]) => {
  const a = v => r2(v), k = 0.5523 * r;   // o quarto de círculo em Bézier
  return `M${cx} ${cy}H${cx + cw}V${cy + ch}H${cx}Z` +
    `M${a(x0)} ${cy}V${a(pe - r)}C${a(x0)} ${a(pe - r + k)} ${a(x0 + r - k)} ${a(pe)} ${a(x0 + r)} ${a(pe)}` +
    `H${a(x1 - r)}C${a(x1 - r + k)} ${a(pe)} ${a(x1)} ${a(pe - r + k)} ${a(x1)} ${a(pe - r)}V${cy}Z`;
};

function notebook() {
  const o = Object.assign({}, F.CAMS.media), W = F.prepWorld(o), cam = F.makeCam(o);
  const L = W.laptop, g = F.laptopGeo(L), fr = F.frameOf({ x: L.x, z: L.z, rot: 0 });
  const t = F.telaDoNotebook('media');
  const ox = t.cx, oy = t.cy + t.altura / 2;
  const P = p => { const q = cam.P(p); return [q[0] - ox, q[1] - oy]; };
  const D = (u, v, h = L.h) => P(fr(u, h, v));
  const quad = (u0, v0, u1, v1) => [D(u0, v0), D(u1, v0), D(u1, v1), D(u0, v1)];

  // a tampa: o retângulo da frente, em volta da tela
  const esq = P(g.at(-L.w / 2, 0))[0], dir = P(g.at(L.w / 2, 0))[0], topo = P(g.at(0, g.lidH))[1], pe = P(g.at(0, 0))[1];
  const pxCm = (dir - esq) / L.w;
  const tampa = { lado: r2(-t.largura / 2 - esq), topo: r2(-t.altura - topo), queixo: r2(pe), raio: r2(0.9 * pxCm),
    aro: r2(Math.max(1, cam.S(g.at(0, g.lidH / 2)) * 0.16)),
    // o ponto da câmera (novo, o scene.js não desenha): 0,3 cm, no meio da borda de cima
    camera: r2(0.3 * pxCm) };
  const aro = mix(F.light(ALU, g.at(0, g.lidH), g.nrm, { amb: 1.2 }), C.n400, 0.3);

  // a base: a lateral (o contorno de baixo e de cima) e o tampo, com a luz do abajur de um lado
  const outl = F.rrect(L.w, L.d, L.r, 6);
  const bot = outl.map(([u, v]) => D(u, v, 0)), tp = outl.map(([u, v]) => D(u, v));
  const lateral = F.hull(bot.concat(tp));
  const dl = F.light(ALU, fr(-L.w / 2, L.h, 0), [0, 1, 0]), dr = F.light(ALU, fr(L.w / 2, L.h, 0), [0, 1, 0]);
  // o teclado: seis fileiras de teclas sem legenda (a de cima mais fina; a de baixo com a barra de espaço)
  const ks = L.s || 1, gap = 0.26 * ks, teclas = [];
  let v = L.d / 2 - 1.9 * ks;
  [[0.8, 14], [1.4, 14], [1.4, 14], [1.4, 13], [1.4, 12], [1.4, 0]].forEach(([hk, n]) => {
    const v1 = v, v0 = v - hk * ks; v = v0 - gap;
    const parts = [];
    if (!n) parts.push([-12.6, -9.1], [-8.85, -6.5], [-6.25, 6.0], [6.25, 8.45], [8.7, 10.5], [10.75, 12.6]);
    else { const wk = (25.2 - 0.26 * (n - 1)) / n; for (let i = 0; i < n; i++) parts.push([-12.6 + i * (wk + 0.26), -12.6 + i * (wk + 0.26) + wk]); }
    for (const [a, b] of parts) teclas.push(quad(a * ks, v0, b * ks, v1));
  });
  const trackpad = quad(-6.4 * ks, -L.d / 2 + 1.3 * ks, 6.4 * ks, -L.d / 2 + 8.4 * ks);
  const dobradica = [g.at(-L.w / 2 + 3, -0.5), g.at(L.w / 2 - 3, -0.5), g.at(L.w / 2 - 3, 0.45), g.at(-L.w / 2 + 3, 0.45)].map(P);
  const e1 = D(-L.w / 2 + L.r, -L.d / 2), e2 = D(L.w / 2 - L.r, -L.d / 2);
  const chao = D(0, -L.d / 2, 0), chaoEsq = D(-L.w / 2, -L.d / 2, 0), sCm = cam.S(fr(0, 0, -L.d / 2));
  const contato = elipse(chao[0], chao[1], (chaoEsq[0] - chao[0]) * -1.03, 0.45 * sCm);

  return {
    tela: { largura: r1(t.largura), altura: r1(t.altura) },
    tampa,
    cores: { vidro: cor(VIDRO), aro: cor(aro, 0.85) },
    base: {
      caixa: caixa(lateral.concat(dobradica, [[contato.cx - contato.rx, contato.cy + contato.ry], [contato.cx + contato.rx, contato.cy + contato.ry]])),
      lateral: d(lateral),
      tampo: d(tp),
      teclas: teclas.map(d).join(''),
      trackpad: d(trackpad),
      dobradica: d(dobradica),
      // os degradês: o tampo da esquerda (dl) para a direita (dr); a luz fria da tela do fundo (junto da dobradiça) para a frente
      tampoX: [r2(D(-L.w / 2, 0)[0]), r2(D(L.w / 2, 0)[0])],
      brilhoY: [r2(D(0, L.d / 2)[1]), r2(D(0, -L.d / 2)[1])],
      quina: quina(e1, e2, Math.max(1, cam.S(fr(0, L.h, -L.d / 2)) * 0.12), cor(mix(C.n300, C.lampW, 0.5), 0.38), cor(C.n400, 0.14)),
      contato,
      cores: {
        lateral: cor(mix(F.light(ALU, fr(0, L.h / 2, -L.d / 2), [0, 0, -1], { amb: 0.8 }), C.black, 0.35)),
        tampoEsq: cor(dl), tampoDir: cor(dr),
        tecla: cor([13, 15, 20], 0.88),
        trackpad: cor(mix(mix(dl, dr, 0.5), C.black, 0.1)), trackpadAro: cor(C.n400, 0.22),
        brilho: cor(F.GLOW_C), brilhoA: [0.17, 0.06, 0.02],
        dobradica: cor(VIDRO), contato: contatoCor
      }
    }
  };
}

function celular() {
  const o = Object.assign({}, F.CAMS.mediaRetrato), W = F.prepWorld(o), cam = F.makeCam(o);
  const c = W.celular, g = F.celularGeo(c), sg = F.suporteGeo(c);
  const t = F.telaDoCelular('mediaRetrato');
  const ox = t.cx, oy = t.cy + t.altura / 2;
  const P = p => { const q = cam.P(p); return [q[0] - ox, q[1] - oy]; };
  const lado = (p, n) => mix(F.light(ALU, p, n, { amb: 0.9 }), C.black, 0.12);

  // o corpo: a face da frente, em volta da tela
  const esq = P(g.at(-c.w / 2, 0))[0], dir = P(g.at(c.w / 2, 0))[0], topo = P(g.at(0, g.h))[1], pe = P(g.at(0, 0))[1];
  const pxCm = (dir - esq) / c.w;
  const corpo = { lado: r2(-t.largura / 2 - esq), topo: r2(-t.altura - topo), queixo: r2(pe), raio: r2(c.r * pxCm),
    aro: r2(Math.max(1, cam.S(g.centroTela) * 0.07)) };
  const aro = mix(F.light(ALU, g.at(0, g.h, 0), g.nrm, { amb: 1.2 }), C.n400, 0.3);

  // a chapa na mesa: a lateral e o tampo, com a quina da frente pegando a luz
  const ch = sg.chapa, frc = F.frameOf(ch), outl = F.rrect(ch.w, ch.d, ch.r);
  const bot = outl.map(([u, v]) => P(frc(u, 0, v))), tp = outl.map(([u, v]) => P(frc(u, ch.h, v)));
  const chapaLateral = F.hull(bot.concat(tp));
  // um bloco (face da frente e de cima), do tampo da chapa até y1. Só o ressalto aparece: a prateleira tem a mesma frente
  // (z0) e fica inteira atrás dele.
  const bloco = (x0, x1, z0, z1, y1) => {
    const y0 = ch.h;
    return {
      frente: d([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]].map(P)),
      topo: d([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]].map(P)),
      quina: quina(P([x0, y1, z0]), P([x1, y1, z0]), Math.max(1, cam.S([x0, y1, z0]) * 0.08), cor(mix(C.n300, C.lampW, 0.5), 0.32), cor(C.n400, 0.12)),
      cores: { frente: cor(lado([(x0 + x1) / 2, (y0 + y1) / 2, z0], [0, 0, -1])), topo: cor(F.light(ALU, [(x0 + x1) / 2, y1, (z0 + z1) / 2], [0, 1, 0])) }
    };
  };
  const pr = sg.prateleira, rs = sg.ressalto;
  const e1 = P(frc(-ch.w / 2 + ch.r, ch.h, -ch.d / 2)), e2 = P(frc(ch.w / 2 - ch.r, ch.h, -ch.d / 2));
  const chao = P(frc(0, 0, -ch.d / 2)), chaoEsq = P(frc(-ch.w / 2, 0, -ch.d / 2)), sCm = cam.S(frc(0, 0, -ch.d / 2));
  const contato = elipse(chao[0], chao[1], (chaoEsq[0] - chao[0]) * -1.03, 0.3 * sCm);
  const sCaixa = caixa(chapaLateral.concat([[contato.cx - contato.rx, contato.cy + contato.ry], [contato.cx + contato.rx, contato.cy + contato.ry]]));

  return {
    // a altura na proporção de 390 x 844 (a da tela da arte), com a largura arredondada do ENTRADA
    tela: { largura: r1(t.largura), altura: r2(r1(t.largura) * 844 / 390) },
    corpo,
    cores: { vidro: cor(VIDRO), aro: cor(aro, 0.85) },
    suporte: {
      caixa: sCaixa,
      chapa: {
        lateral: d(chapaLateral), topo: d(tp),
        quina: quina(e1, e2, Math.max(1, cam.S(frc(0, ch.h, -ch.d / 2)) * 0.1), cor(mix(C.n300, C.lampW, 0.5), 0.36), cor(C.n400, 0.14)),
        cores: { lateral: cor(lado(frc(0, ch.h / 2, -ch.d / 2), [0, 0, -1])), topo: cor(F.light(ALU, [ch.x, ch.h, ch.z], [0, 1, 0])) }
      },
      ressalto: bloco(pr.x0, pr.x1, rs.z0, rs.z1, rs.y1),
      // o suporte vem depois do corpo no site (o ressalto fica à frente da borda de baixo do celular), mas a chapa fica
      // atrás dele: ela é recortada pelo corpo, que sobe do pé (`queixo`) com os cantos de baixo arredondados (`raio`)
      semCorpo: semCorpo(-t.largura / 2 - corpo.lado, t.largura / 2 + corpo.lado, corpo.queixo, corpo.raio, sCaixa),
      contato,
      cores: { contato: contatoCor }
    }
  };
}

function vetor() { return { notebook: notebook(), celular: celular() }; }
module.exports = vetor;
if (require.main === module) process.stdout.write(JSON.stringify(vetor(), null, 2) + '\n');
