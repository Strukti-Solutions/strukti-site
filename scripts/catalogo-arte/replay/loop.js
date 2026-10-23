// Receita do loop de 5 s do Replay (Task A5): o LED respira e a névoa dos refletores anda devagar.
// node ../kit/loop.js loop.js  ->  plates/master.mkv (ver o README desta pasta)
//
// Placas (cartao.html, um Edge por vez): cur/cartao.png (o cartão), plates/L0.png (?ledK=0) e plates/V0.png (?veu=0).
// E = cartão - L0 é o LED (barra, brilhos e o bloom dele); N = cartão - V0 é o ar iluminado (véus, cones de névoa,
// o brilho atrás da caixa e a faixa baixa), já com a contraluz que ele dá aos fios da tela.
// quadro(t) = cartão - led(t) * E + nevoa(x, y, t) * N, com led(0) = nevoa(., ., 0) = 0: o quadro 0 é o cartão.
'use strict';
const W = 800, H = 1200, N = 125, FPS = 25, T = N / FPS;
const LED = 0.45;                 // no meio da volta o LED cai para 55% do cartão (ledK 0,85 -> ~0,47) e volta
// A6: amplitude pela metade e onda de 1700 px (era ±60% e 900 px): os dois cones, a ~430 px um do outro, ficavam em
// contrafase e o da direita parecia apagar; agora ficam a ~90° e o LED volta a ser o pulso principal
const NEV = { a: 0.3, lambda: 1700, ang: -12 };   // a névoa: ondas de densidade de ±30%, 1700 px, andando para a direita
module.exports = {
  W, H, N, fps: FPS,
  placas: { cartao: 'cur/cartao.png', L0: 'plates/L0.png', V0: 'plates/V0.png' },
  preparar(P, u) {
    P.E = u.delta(P.cartao, P.L0); P.Nv = u.delta(P.cartao, P.V0);
    // fase da onda por pixel (seno e cosseno guardados) e a lista dos pixels onde há névoa (o resto não muda)
    const a = NEV.ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), k = u.TAU / NEV.lambda;
    P.sf = new Float32Array(W * H); P.cf = new Float32Array(W * H); P.onde = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, f = k * (x * ca + y * sa); P.sf[i] = Math.sin(f); P.cf[i] = Math.cos(f);
      const j = i * 3; if (P.Nv[j] || P.Nv[j + 1] || P.Nv[j + 2]) P.onde.push(i);
    }
    P.ledOnde = []; for (let i = 0; i < W * H; i++) { const j = i * 3; if (P.E[j] || P.E[j + 1] || P.E[j + 2]) P.ledOnde.push(i); }
    console.log(`névoa em ${P.onde.length} px, LED em ${P.ledOnde.length} px`);
  },
  quadro(n, t, out, P, u) {
    const w = u.TAU * t / T, sw = Math.sin(w), cw = Math.cos(w);
    // LED: respira uma vez por volta (0 -> LED -> 0)
    const b = LED * u.sobe(t, T);
    if (b) for (const i of P.ledOnde) { const j = i * 3; out[j] -= b * P.E[j]; out[j + 1] -= b * P.E[j + 1]; out[j + 2] -= b * P.E[j + 2]; }
    // névoa: sin(w - f) + sin(f) = 2 sen(w/2) cos(w/2 - f): uma faixa de densidade que nasce, anda meia onda e some
    if (n) for (const i of P.onde) {
      const g = NEV.a * (sw * P.cf[i] - cw * P.sf[i] + P.sf[i]), j = i * 3;
      out[j] += g * P.Nv[j]; out[j + 1] += g * P.Nv[j + 1]; out[j + 2] += g * P.Nv[j + 2];
    }
  }
};
