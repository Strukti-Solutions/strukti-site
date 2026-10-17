// lamp pool probe for the media camera: node pool.js '<lamp json>'
const F = require('./scene.js');
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => a.map(v => v * s), len = a => Math.hypot(...a), norm = a => mul(a, 1 / len(a)), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const L = Object.assign({}, F.BASE.lamp, JSON.parse(process.argv[2] || '{}'));
L.axis = norm(sub(L.target, L.head)); L.bulb = add(L.head, mul(L.axis, 3.5));
const cam = F.makeCam(F.CAMS.media);
function I(p) { const d = sub(L.bulb, p), dist = len(d), l = mul(d, 1 / dist); const cosS = dot(mul(l, -1), L.axis); const sw = L.sw;
  const spot = (sstep(L.c0, L.c1, cosS) * (1 - sw) + sstep(L.s0, L.s1, cosS) * sw) * (L.cutZ ? sstep(L.cutZ[0], L.cutZ[1], p[2]) * (L.cutZ.length > 2 ? 1 - sstep(L.cutZ[2], L.cutZ[3], p[2]) : 1) : 1); return L.k * spot * Math.max(0, l[1]) / (1 + Math.pow(dist / 42, 2)) * 3.3; }
const at = (px, py) => { const d = cam.ray(px * 1280, py * 720); const t = -cam.pos[1] / d[1]; return [cam.pos[0] + d[0] * t, 0, cam.pos[2] + d[2] * t]; };
let best = [0, 0, 0]; const rows = [];
for (let py = 0.52; py <= 1.001; py += 0.02) { let row = []; for (let px = 0.0; px <= 1.001; px += 0.05) { const v = I(at(px, py)); row.push(v); if (v > best[0]) best = [v, px, py]; } rows.push([py, row]); }
console.log('peak', best.map(v => v.toFixed(2)).join(' '), ' I(47,78)', I(at(0.47, 0.78)).toFixed(2));
for (const [py, row] of rows) console.log((py * 100).toFixed(0).padStart(3), row.map(v => (v / best[0] * 99).toFixed(0).padStart(3)).join(''));
