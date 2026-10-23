// Receita do loop de 5 s do Rota de Vendas (Task A5): a cidade lá fora anda devagar no para-brisa; o carro, o celular
// e a tela ficam parados. node ../kit/loop.js loop.js  ->  plates/master.mkv (ver o README desta pasta)
//
// Placas (cartao.html, um Edge por vez): cur/cartao.png (o cartão); plates/C.png (?so=cidade: a cidade desfocada com o
// bokeh, a camada de baixo de tudo, sem acabamento); plates/B64.png e plates/B192.png (?cidadeCinza=64 e 192, sem grão):
// a cena com a cidade trocada por um cinza liso. T = (B192 - B64) / 128 é o quanto a cidade aparece em cada pixel
// (1 no vidro limpo; menos na serigrafia, no véu do vidro, na vinheta e no esmaecimento; 0 no painel, no celular e na
// moldura), como o T do hero.
// quadro(t) = cartão + T * (C(x - dx(t), y) - C(x, y)), com dx(0) = 0: o quadro 0 é o cartão.
'use strict';
const W = 800, H = 1200, N = 125, FPS = 25, T = N / FPS;
const DERIVA = 14;   // px (no 800; 10,5 px no 600): a cidade vai até 14 px para a direita e volta, uma vez por volta
module.exports = {
  W, H, N, fps: FPS,
  placas: { cartao: 'cur/cartao.png', C: 'plates/C.png', B64: 'plates/B64.png', B192: 'plates/B192.png' },
  preparar(P) {
    const n = W * H * 3; P.T = new Float32Array(n); P.onde = [];
    for (let i = 0; i < n; i++) P.T[i] = Math.max(0, (P.B192.d[i] - P.B64.d[i]) / 128);
    for (let i = 0; i < W * H; i++) { const j = i * 3; if (P.T[j] > 0.004 || P.T[j + 1] > 0.004 || P.T[j + 2] > 0.004) P.onde.push(i); }
    console.log(`a cidade aparece em ${P.onde.length} px (${(100 * P.onde.length / (W * H)).toFixed(1)}%)`);
  },
  quadro(n, t, out, P, u) {
    const dx = DERIVA * u.sobe(t, T); if (!dx) return;
    const C = P.C, d = C.d;
    for (const i of P.onde) {
      const x = i % W, y = (i - x) / W, j = i * 3;
      for (let c = 0; c < 3; c++) out[j + c] += P.T[j + c] * (u.bilinear(C, x - dx, y, c) - d[j + c]);
    }
  }
};
