// Receita do loop de 5 s do Fleet Analytics BI (Task A5): os dados pulsam na tela (o anel do veículo selecionado, a
// ponta da curva de velocidade e a barra em ciano), uma volta do `pulso` em 5 s. O resto da sala fica parado.
// node ../kit/loop.js loop.js  ->  plates/master.mkv (ver o README desta pasta)
//
// O pulso mexe na forma (o raio do anel, a curva, a altura da barra), não só no brilho: um passe por quadro, então.
// Placas: cur/cartao.png (o cartão) e plates/pulso-000.png ... pulso-100.png (plates.html, 5 fotos de 25 renders):
// para cada quadro k, a cena inteira com pulso = k / 125 e, dela, só os dois recortes onde o pulso muda alguma coisa
// (a tela e o reflexo dela na mesa; fora deles o render é idêntico ao cartão). O grão é o mesmo em todos os renders.
// quadro(k) = o cartão com os dois recortes trocados pelos do render k; o render 0 é o próprio cartão (byte a byte).
'use strict';
const W = 800, H = 1200, N = 125, FPS = 25;
const R = [[300, 240, 390, 290], [300, 730, 390, 220]];   // os mesmos recortes do plates.html
const TW = R[0][2], TH = R[0][3] + R[1][3], COL = 5, POR = 25;
const placas = { cartao: 'cur/cartao.png' };
for (let i = 0; i < N; i += POR) placas['p' + i] = `plates/pulso-${String(i).padStart(3, '0')}.png`;
module.exports = {
  W, H, N, fps: FPS, placas, placasLivres: Object.keys(placas).filter(k => k !== 'cartao'),
  quadro(n, t, out, P) {
    const M = P['p' + (n - n % POR)], k = n % POR, tx = (k % COL) * TW, ty = Math.floor(k / COL) * TH;
    let oy = 0;
    for (const [x0, y0, w, h] of R) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const s = ((ty + oy + y) * M.w + tx + x) * 3, d = ((y0 + y) * W + x0 + x) * 3;
        out[d] = M.d[s]; out[d + 1] = M.d[s + 1]; out[d + 2] = M.d[s + 2];
      }
      oy += h;
    }
  }
};
