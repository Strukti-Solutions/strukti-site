// A faixa do título quadro a quadro: o p90 e o máximo da luminância (BT.709, 0 a 255) de cada região em todos os quadros
// de um master (251 quadros), e o pior quadro de cada um. Regiões em px da mídia:
//   node sonda-rapida.js <master.mkv> <pôster.png> [--em-pe] [LxA ...]   -> as regiões do sondas.js (as faixas largas e as
//                                                                           metades no modelo dele), medidas no pôster
//   node sonda-rapida.js <master.mkv> --caixas <caixas.json> [--em-pe]   -> as caixas que o site desenha, medidas no
//                                                                           navegador: {"nome": [x0, x1, y0, y1], ...}
// O limite é o da faixa do título (MASTER §3.4): p90 até 60 em todo quadro.
// Só aprova o que mediu (m2 da revisão final da fase 2): sai com 1 se o ffmpeg falhar (o master errado), se não vierem
// os 251 quadros do loop ou se uma região não tiver pixel nenhum no quadro.
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const emPe = args.includes('--em-pe');
const iCaixas = args.indexOf('--caixas');
const [mk] = args;
const [W, H] = emPe ? [720, 1280] : [1280, 720];
const regs = [];
if (iCaixas > 0) {
  const caixas = JSON.parse(fs.readFileSync(args[iCaixas + 1], 'utf8'));
  for (const [k, m] of Object.entries(caixas)) regs.push({ key: k, m, pior: { p90: 0, q: -1, max: 0, qm: -1 } });
} else {
  const resto = args.slice(1).filter(a => a !== '--em-pe');
  const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'sondas.js')].concat(emPe ? ['--em-pe'] : [], resto)).toString());
  for (const [v, rr] of Object.entries(out.faixa))
    for (const [k, r] of Object.entries(rr)) if (typeof r === 'object') regs.push({ key: v + ' ' + k, m: r.midia, pior: { p90: 0, q: -1, max: 0, qm: -1 } });
}
const QUADROS = 251;
/** Os limites da região no quadro (px inteiros, cortados nas bordas): vazia se não sobra pixel. */
const limites = ([x0, x1, y0, y1]) => ({
  xa: Math.max(0, Math.round(x0)), xb: Math.min(W, Math.round(x1)),
  ya: Math.max(0, Math.round(y0)), yb: Math.min(H, Math.round(y1)),
});
const vazias = regs.filter(r => { const l = limites(r.m); return l.xb <= l.xa || l.yb <= l.ya; });
if (regs.length === 0 || vazias.length > 0) {
  for (const r of vazias) console.error(`a região "${r.key}" [${r.m.join(', ')}] fica sem pixel no quadro de ${W}×${H}`);
  if (regs.length === 0) console.error('nenhuma região para medir');
  process.exit(1);
}
const pct = (a, p) => { a.sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
function proc(b, q) {
  for (const r of regs) {
    const { xa, xb, ya, yb } = limites(r.m), vals = [];
    for (let y = ya; y < yb; y++)
      for (let x = xa; x < xb; x++) {
        const i = (y * W + x) * 3;
        vals.push(0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2]);
      }
    const p90 = pct(vals, 0.9), mx = vals[vals.length - 1];
    if (p90 > r.pior.p90) { r.pior.p90 = +p90.toFixed(1); r.pior.q = q; }
    if (mx > r.pior.max) { r.pior.max = +mx.toFixed(1); r.pior.qm = q; }
  }
}
const fsz = W * H * 3;
const ff = spawn('ffmpeg', ['-v', 'error', '-i', mk, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
let buf = Buffer.alloc(0), n = 0;
ff.stdout.on('data', d => {
  buf = Buffer.concat([buf, d]);
  while (buf.length >= fsz) { proc(buf.subarray(0, fsz), n++); buf = Buffer.from(buf.subarray(fsz)); }
});
ff.on('error', e => {
  console.error('o ffmpeg não rodou:', e.message);
  process.exit(1);
});
ff.on('close', code => {
  console.log('quadros', n);
  let ok = true;
  if (code !== 0) {
    console.error(`o ffmpeg saiu com ${code} (o master ${mk} existe e é legível?)`);
    ok = false;
  }
  if (n !== QUADROS) {
    console.error(`vieram ${n} quadros; o loop tem ${QUADROS}`);
    ok = false;
  }
  for (const r of regs) {
    ok = ok && r.pior.p90 <= 60;
    console.log(r.key.padEnd(24), 'pior p90', r.pior.p90, 'q', r.pior.q, '| máx', r.pior.max, 'q', r.pior.qm);
  }
  process.exit(ok ? 0 : 1);
});
