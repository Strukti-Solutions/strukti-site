// uso: node ../kit/loop.js <receita.js>   (de dentro da pasta da cena; ex.: cd ../replay && node ../kit/loop.js loop.js)
// Compõe o loop de 5 s do cartão (só os 3 reais; spec 2026-10-16 §6.1 e §6.2) a partir de passes ("placas"), como o
// composite2.js do hero, mas em Node e em ponto flutuante: cada quadro é o cartão mais deltas periódicos, somados num
// Float32Array e arredondados uma vez só. O quadro 0 é o cartão byte a byte (o loop confere e sai com 1 se não for), e
// o tempo é periódico em N quadros: o quadro N seria o 0, então a emenda N-1 -> 0 é um passo como os outros.
// Sem grão temporal: o grão está só no cartão (estático); os deltas são diferenças de passes com o mesmo grão.
// Saída: plates/master.mkv (ffv1, sem perda, gbrp, W x H, 25 fps, N quadros). O encode.sh reduz para 600 x 900.
//
// A receita (CommonJS) exporta:
//   { W, H, N, fps, placas: { nome: 'plates/x.png', ... }, preparar(P, util), quadro(n, t, out, P, util) }
//   - P: as placas lidas, cada uma { w, h, d } (d: Buffer RGB de 8 bits, w*h*3).
//   - preparar: calcula o que for fixo (deltas em Float32Array etc.); pode guardar em P.
//   - quadro: escreve o quadro n (t em segundos, 0 <= t < N/fps) em `out` (Float32Array W*H*3, já com o cartão).
'use strict';
const { execFileSync, spawn } = require('child_process');
const path = require('path');

function dims(png) {
  const s = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', png]).toString().trim();
  const [w, h] = s.split(',').map(Number); return { w, h };
}
function ler(png) {
  const { w, h } = dims(png);
  const d = execFileSync('ffmpeg', ['-v', 'error', '-i', png, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: w * h * 3 + 1024 });
  if (d.length !== w * h * 3) throw new Error(`leitura incompleta: ${png} (${d.length} de ${w * h * 3} bytes)`);
  return { w, h, d };
}
// amostra bilinear de uma placa (canal c) em (x, y) em px, com a borda presa
function bilinear(pl, x, y, c) {
  const { w, h, d } = pl;
  x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y));
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = x - x0, fy = y - y0;
  const a = d[(y0 * w + x0) * 3 + c], b = d[(y0 * w + x1) * 3 + c], e = d[(y1 * w + x0) * 3 + c], f = d[(y1 * w + x1) * 3 + c];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (e * (1 - fx) + f * fx) * fy;
}
// delta com sinal (a - b), em Float32Array
function delta(a, b) { const n = a.d.length, r = new Float32Array(n); for (let i = 0; i < n; i++) r[i] = a.d[i] - b.d[i]; return r; }
// pesos periódicos que valem 0 em t = 0 (o quadro 0 é o cartão)
const TAU = Math.PI * 2;
const sobe = (t, T) => 0.5 - 0.5 * Math.cos(TAU * t / T);           // 0 -> 1 -> 0 (respira uma vez por volta)
const util = { ler, dims, bilinear, delta, sobe, TAU };

async function main() {
  const rec = path.resolve(process.argv[2] || 'loop.js');
  const R = require(rec), { W, H, N, fps } = R;
  const t0 = Date.now(), P = {};
  for (const k in R.placas) { P[k] = ler(R.placas[k]); if (P[k].w !== W && !(R.placasLivres || []).includes(k)) throw new Error(`placa ${k}: ${P[k].w}x${P[k].h}, esperado ${W}x${H}`); }
  if (!P.cartao) throw new Error('a receita precisa da placa "cartao" (o quadro 0)');
  if (R.preparar) R.preparar(P, util);
  const saida = path.join(path.dirname(rec), R.saida || 'plates/master.mkv');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-',
    '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'gbrp', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fim = new Promise((ok, erro) => ff.on('close', c => c === 0 ? ok() : erro(new Error('ffmpeg saiu com ' + c))));
  const out = new Float32Array(W * H * 3), buf = Buffer.alloc(W * H * 3), base = P.cartao.d;
  for (let n = 0; n < N; n++) {
    for (let i = 0; i < out.length; i++) out[i] = base[i];
    R.quadro(n, n / fps, out, P, util);
    let difs = 0;
    for (let i = 0; i < out.length; i++) { const v = Math.round(out[i]); buf[i] = v < 0 ? 0 : v > 255 ? 255 : v; if (n === 0 && buf[i] !== base[i]) difs++; }
    if (n === 0 && difs) { ff.stdin.destroy(); throw new Error(`o quadro 0 não é o cartão: ${difs} valores diferentes`); }
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (n === 0) console.log('quadro 0 = cartão (byte a byte)');
    if (n % 25 === 24) process.stdout.write(`${n + 1}/${N} `);
  }
  ff.stdin.end(); await fim;
  console.log(`\n${N} quadros ${W}x${H} @ ${fps} fps -> ${saida} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
