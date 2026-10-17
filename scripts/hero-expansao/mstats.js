// node mstats.js <media 1280x720 image> : pool / bottom / edge stats
const { execFileSync } = require('child_process');
const f = process.argv[2]; const W = 1280, H = 720;
const b = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-frames:v', '1', '-vf', 'scale=1280:720', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const reg = (x0, x1, y0, y1) => { let s = [0, 0, 0], n = 0, mx = 0; for (let y = Math.round(y0 * H); y < Math.round(y1 * H); y++) for (let x = Math.round(x0 * W); x < Math.round(x1 * W); x++) { const i = (y * W + x) * 3; s[0] += b[i]; s[1] += b[i + 1]; s[2] += b[i + 2]; n++; const l = 0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]; if (l > mx) mx = l; } return hex(s.map(v => v / n)) + ' (maxY ' + mx.toFixed(0) + ')'; };
console.log('pool c(47,78)', reg(0.455, 0.485, 0.765, 0.795), ' desk y94-100 x30-70', reg(0.3, 0.7, 0.94, 1), ' y94-100 all', reg(0, 1, 0.94, 1), ' y97-100', reg(0, 1, 0.97, 1), ' last row', reg(0, 1, 0.998, 1));
// brightest desk block (2% x 2%) excluding objects is hard; report the brightest 4%x3% block mean on y 66-100
let best = [0]; for (let y = 0.66; y < 0.98; y += 0.01) for (let x = 0.0; x < 0.96; x += 0.01) { let s = 0, n = 0; for (let yy = Math.round(y * H); yy < Math.round((y + 0.03) * H); yy += 2) for (let xx = Math.round(x * W); xx < Math.round((x + 0.04) * W); xx += 2) { const i = (yy * W + xx) * 3; s += 0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]; n++; } if (s / n > best[0]) best = [s / n, x, y]; }
console.log('brightest 4x3% block on desk rows: Y', best[0].toFixed(1), 'at x', (best[1] * 100).toFixed(0) + '% y', (best[2] * 100).toFixed(0) + '%');
const rows = []; for (const y of [0.6, 0.66, 0.7, 0.74, 0.78, 0.82, 0.86, 0.9, 0.93, 0.96, 0.99]) rows.push((y * 100).toFixed(0) + ':' + reg(0.62, 0.66, y, y + 0.01).slice(0, 7)); console.log('desk column x62-66%:', rows.join(' '));
const cols = []; for (const x of [0.02, 0.1, 0.2, 0.3, 0.4, 0.5, 0.66, 0.7, 0.8, 0.9, 0.97]) cols.push((x * 100).toFixed(0) + ':' + reg(x, x + 0.02, 0.78, 0.8).slice(0, 7)); console.log('row y78-80%:', cols.join(' '));
