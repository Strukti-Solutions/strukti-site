// node composite2.js [media|mediaRetrato] -> <pasta dos passes>/master.mkv (ffv1, sem perda, 251 quadros: 0 a 250, e o 250
// é igual ao 0). O grafo vem do loop.js: final(t) = A + T × cidade(t) + k(t) × E + j(t) × Lp + vapor(t).
// Os grãos de poeira do hero foram testados lá e ficaram de fora (pareciam sujeira sobre a mesa iluminada): aqui não entram.
const { execFileSync } = require('child_process'); const fs = require('fs');
const loop = require('./loop.js');
const cam = process.argv[2] || 'media';
const q = loop.quadro(cam);
const P = __dirname + '/' + q.pasta + '/'; const DUR = '10.04';
const inputs = ['A.png', 'T.png', 'city2x.png', 'E.png', 'Lp.png', 'strip.png', 'mask.png'];
const args = ['-y', '-v', 'error'];
for (const f of inputs) args.push('-framerate', '25', '-loop', '1', '-t', DUR, '-i', P + f);
fs.writeFileSync(P + 'graph.txt', loop.grafo(cam));
args.push('-/filter_complex', P + 'graph.txt', '-map', '[out]', '-c:v', 'ffv1', '-level', '3', P + 'master.mkv');
const t0 = Date.now(); execFileSync('ffmpeg', args, { stdio: 'inherit' }); console.log(cam, 'composite', ((Date.now() - t0) / 1000).toFixed(1) + 's');
