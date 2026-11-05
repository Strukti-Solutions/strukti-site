// Receita do loop de 5 s do Air Central: o LED do módulo respira e um véu lento passa pelo céu da janela.
// node ../kit/loop.js loop.js  ->  plates/master.mkv (ver o README desta pasta)
//
// Placas (cartao.html, um Edge por vez): cur/cartao.png (o cartão), plates/L0.png (?ledK=0) e plates/J0.png (?janelaK=0).
// E = cartão − L0 é o LED (o núcleo, os brilhos, o ciano na prateleira e o bloom dele); N = cartão − J0 é o que se vê
// pelo vidro (o céu, as torres, a cidade baixa e o bokeh), já com o desfoque, a vinheta e o bloom do cartão.
// quadro(t) = cartão − led(t) · E + veu(x, y, t) · N, com led(0) = veu(., ., 0) = 0: o quadro 0 é o cartão.
// Nada de feixe de infravermelho nem de ar saindo do aparelho (ele está desligado); a cidade não anda de lado: a janela
// é estreita (~35% da largura) e a deriva de 8–10 px que seria vista arriscava mostrar a borda do recorte da cidade.
'use strict';
const W = 800, H = 1200, N = 125, FPS = 25, T = N / FPS;
const LED = 0.45;                 // no meio da volta o LED cai para 55% do cartão e volta (como o do Replay)
// o véu: ondas de densidade de ±10% (a mesma conta da névoa do Replay), de 1100 px, andando para a direita e um pouco
// para cima; pesa inteiro no céu (acima de ~250 px) e cai para a metade na cidade baixa
const VEU = { a: 0.1, lambda: 1100, ang: -12, y0: 250, y1: 650, baixo: 0.5 };
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
module.exports = {
  W, H, N, fps: FPS,
  placas: { cartao: 'cur/cartao.png', L0: 'plates/L0.png', J0: 'plates/J0.png' },
  preparar(P, u) {
    P.E = u.delta(P.cartao, P.L0); P.Nj = u.delta(P.cartao, P.J0);
    // fase da onda por pixel (seno e cosseno, já com o peso da altura) e a lista dos pixels onde há janela
    const a = VEU.ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), k = u.TAU / VEU.lambda;
    P.sf = new Float32Array(W * H); P.cf = new Float32Array(W * H); P.onde = [];
    for (let y = 0; y < H; y++) {
      const pe = 1 - (1 - VEU.baixo) * sstep(VEU.y0, VEU.y1, y);
      for (let x = 0; x < W; x++) {
        const i = y * W + x, f = k * (x * ca + y * sa); P.sf[i] = pe * Math.sin(f); P.cf[i] = pe * Math.cos(f);
        const j = i * 3; if (P.Nj[j] || P.Nj[j + 1] || P.Nj[j + 2]) P.onde.push(i);
      }
    }
    P.ledOnde = []; for (let i = 0; i < W * H; i++) { const j = i * 3; if (P.E[j] || P.E[j + 1] || P.E[j + 2]) P.ledOnde.push(i); }
    console.log(`janela em ${P.onde.length} px, LED em ${P.ledOnde.length} px`);
  },
  quadro(n, t, out, P, u) {
    const w = u.TAU * t / T, sw = Math.sin(w), cw = Math.cos(w);
    // LED: respira uma vez por volta (0 -> LED -> 0)
    const b = LED * u.sobe(t, T);
    if (b) for (const i of P.ledOnde) { const j = i * 3; out[j] -= b * P.E[j]; out[j + 1] -= b * P.E[j + 1]; out[j + 2] -= b * P.E[j + 2]; }
    // véu: sen(w − f) + sen(f) = 2 sen(w/2) cos(w/2 − f): uma faixa de luz que nasce, anda meia onda e some
    if (n) for (const i of P.onde) {
      const g = VEU.a * (sw * P.cf[i] - cw * P.sf[i] + P.sf[i]), j = i * 3;
      out[j] += g * P.Nj[j]; out[j + 1] += g * P.Nj[j + 1]; out[j + 2] += g * P.Nj[j + 2];
    }
  }
};
