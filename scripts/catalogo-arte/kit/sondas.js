// Sondas do cartão (spec 2026-10-16 §6.2, plano da arte, Task A1).
//
//   node kit/sondas.js <pasta-da-cena> [cartao.png] ['<json com mudanças da câmera>']
//
// Sem o PNG: só a geometria (caixa do objeto principal em % do quadro e os pontos de referência da cena).
// Com o PNG (800 x 1200): também a luminância da metade de baixo e dos cantos.
// Critérios: objeto entre 15% e 60% da altura; p90 da luminância da metade de baixo <= 60 (0-255, o mesmo
// critério da faixa do título do hero); média de cada canto (5% x 5%) <= a luminância do navy-900 (#0e1c2b).
// Luminância: Y' = 0,299 R' + 0,587 G' + 0,114 B' (como o mstats.js do hero). Sai com 1 se algo reprovar.
const path = require('path');
const { execFileSync } = require('child_process');
const pasta = path.resolve(process.argv[2] || '.');
const png = process.argv[3];
const ov = process.argv[4] ? JSON.parse(process.argv[4]) : {};
const K = require('./cena.js');
const CENA = require(path.join(pasta, 'cena.js'));
const cam = K.makeCam(Object.assign({}, CENA.CAM, ov));
const Y = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const NAVY900 = Y(...K.C.n900);
let ok = true;
const linha = (rotulo, valor, passa) => { if (passa === false) ok = false; console.log(`${rotulo}: ${valor}${passa == null ? '' : passa ? '  ok' : '  REPROVA'}`); };

const bb = K.caixaPct(cam, CENA.objeto());
linha('objeto (x0 x1 y0 y1, % do quadro)', bb.join(' '), bb[2] >= 15 && bb[3] <= 60);
if (CENA.referencias) {
  const r = CENA.referencias(), out = [];
  for (const k in r) { const q = cam.P(r[k]); out.push(`${k} ${(q[0] / cam.W * 100).toFixed(1)}%,${(q[1] / cam.H * 100).toFixed(1)}%${q[2] <= 0 ? ' (atrás)' : ''}`); }
  console.log('referências (x,y em %):', out.join(' | '));
}
if (png) {
  const W = cam.W, H = cam.H;
  const b = execFileSync('ffmpeg', ['-v', 'error', '-i', png, '-frames:v', '1', '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  const ys = []; for (let y = H / 2; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; ys.push(Y(b[i], b[i + 1], b[i + 2])); }
  ys.sort((a, c) => a - c);
  const pct = q => ys[Math.min(ys.length - 1, Math.floor(q * ys.length))];
  linha('metade de baixo, p50 / p90 / p99 / máx (Y 0-255)', `${pct(0.5).toFixed(1)} / ${pct(0.9).toFixed(1)} / ${pct(0.99).toFixed(1)} / ${ys[ys.length - 1].toFixed(0)}`, pct(0.9) <= 60);
  const cw = Math.round(W * 0.05), ch = Math.round(H * 0.05);
  const canto = (x0, y0) => { let s = [0, 0, 0], n = 0; for (let y = y0; y < y0 + ch; y++) for (let x = x0; x < x0 + cw; x++) { const i = (y * W + x) * 3; s[0] += b[i]; s[1] += b[i + 1]; s[2] += b[i + 2]; n++; } return s.map(v => v / n); };
  const cs = { 'sup-esq': canto(0, 0), 'sup-dir': canto(W - cw, 0), 'inf-esq': canto(0, H - ch), 'inf-dir': canto(W - cw, H - ch) };
  const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const piorY = Math.max(...Object.values(cs).map(c => Y(...c)));
  linha(`cantos 5% (Y; navy-900 = ${NAVY900.toFixed(1)})`, Object.entries(cs).map(([k, c]) => `${k} ${hex(c)} Y ${Y(...c).toFixed(1)}`).join(', '), piorY <= NAVY900);
  // média por faixa de 10% da altura (para ver onde a luz está)
  const faixas = []; for (let f = 0; f < 10; f++) { let s = 0, n = 0; for (let y = f * H / 10; y < (f + 1) * H / 10; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 3; s += Y(b[i], b[i + 1], b[i + 2]); n++; } faixas.push((s / n).toFixed(0)); }
  console.log('Y médio por faixa de 10% (de cima para baixo):', faixas.join(' '));
}
process.exit(ok ? 0 : 1);
