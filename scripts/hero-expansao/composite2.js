// Builds the periodic ffmpeg composite of the plates -> plates2/master.mkv (lossless, 251 frames: 0..250, frame 250 must equal frame 0)
// final(t) = A + T*city(t) + k(t)*E + j(t)*Lp + steam(t) + dust(t)
const { execFileSync } = require('child_process'); const fs = require('fs');
const P = __dirname + '/plates2/'; const DUR = '10.04';
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(2026);
// Dust motes were tried (9 sprites on Lissajous paths) and dropped: over the lit desk they read as specks, not floating dust.
const DUST = process.env.DUST === '1';
const inputs = ['A.png', 'T.png', 'city2x.png', 'E.png', 'Lp.png', 'strip.png', 'mask.png'].concat(DUST ? ['sprites.png'] : []);
const args = ['-y', '-v', 'error'];
for (const f of inputs) args.push('-framerate', '25', '-loop', '1', '-t', DUR, '-i', P + f);
let g = [];
g.push('[0]format=gbrp[A]', '[1]format=gbrp[T]', '[3]format=gbrp[E]', '[4]format=gbrp[Lp]');
// city: sway 4*sin^2(pi*t/10) px (1x) on the 2x plate, integer 2x steps = 0.5 px at 1x, then lanczos down
g.push("[2]format=gbrp,crop=2560:1440:x='8-trunc(8*pow(sin(PI*t/10),2)+0.5)':y=0,scale=1280:720:flags=lanczos[city]");
g.push('[T][city]blend=all_mode=multiply[tc]', '[A][tc]blend=all_mode=addition[x1]');
g.push("[x1][E]blend=all_expr='A+B*(0.82+0.18*(0.5-0.5*cos(2*PI*T/10)))'[x2]");
g.push("[x2][Lp]blend=all_expr='A+B*0.03*sin(2*PI*T/10)'[x3]");
// steam: tileable strip (period 400 px at 2x) scrolled up three periods per loop, y=mod(t*3H/10,H) (~7 cm/s rise), column mask, down to 1x, placed on the mug
g.push("[5]format=gbrp,split[s1][s2];[s1][s2]vstack,crop=96:240:0:'trunc(mod(t*1200/10,400))'[sc]");
g.push('[6]format=gbrp[m]', '[sc][m]blend=all_mode=multiply,scale=48:120:flags=lanczos,pad=1280:720:975:333:black[st]');
g.push(DUST ? '[x3][st]blend=all_mode=addition[x4]' : '[x3][st]blend=all_mode=addition,format=gbrp[out]');
if (DUST) {
// dust: 12 motes on closed Lissajous paths (integer frequencies over 10 s), 2x canvas -> 1x region in the lamp cone
g.push("[7]format=rgba,geq=r='255':g='241':b='224':a='r(X,Y)',split=4[p0][p1][p2][p3]");
g.push('SPRITES');
g.push(`color=c=black:s=600x360:r=25:d=${DUR},format=rgba[d0]`);
const motes = []; const used = {};
const NM = 9;
for (let i = 0; i < NM; i++) {
  const cx = 40 + R() * 520, cy = 40 + R() * 280, ax = 10 + R() * 16, ay = 8 + R() * 14;
  const f1 = 1, f2 = 1 + Math.floor(R() * 2), p1 = R() * 6.283, p2 = R() * 6.283, sp = i % 4;
  motes.push([cx, cy, ax, ay, f1, f2, p1, p2, sp]);
  const k = used[sp] = (used[sp] || 0); used[sp]++; const lab = `q${sp}${'abc'[k]}`;
  g.push(`[d${i}][${lab}]overlay=x='${cx.toFixed(1)}+${ax.toFixed(1)}*sin(2*PI*${f1}*t/10+${p1.toFixed(3)})-6':y='${cy.toFixed(1)}+${ay.toFixed(1)}*sin(2*PI*${f2}*t/10+${p2.toFixed(3)})-6':eval=frame[d${i + 1}]`);
}
for (let i = 0; i < 4; i++) { const n = used[i] || 0; g.splice(g.indexOf('SPRITES'), 0, n ? `[p${i}]crop=12:12:${i * 12}:0,split=${n}` + [...'abc'].slice(0, n).map(k => `[q${i}${k}]`).join('') : `[p${i}]nullsink`); }
g.splice(g.indexOf('SPRITES'), 1);
g.push(`[d${NM}]format=gbrp,scale=300:180:flags=lanczos,pad=1280:720:400:380:black[du]`);
g.push('[x4][du]blend=all_mode=addition,format=gbrp[out]');
}
fs.writeFileSync(P + 'graph.txt', g.join(';\n'));
args.push('-/filter_complex', P + 'graph.txt', '-map', '[out]', '-c:v', 'ffv1', '-level', '3', P + 'master.mkv');
const t0 = Date.now(); execFileSync('ffmpeg', args, { stdio: 'inherit' }); console.log('composite', ((Date.now() - t0) / 1000).toFixed(1) + 's');
