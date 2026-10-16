// node rowsY.js <img> x0 x1 step y1,y2,...  -> BT.709 luma samples (3x3 mean)
const { execFileSync } = require('child_process'); const [f, x0, x1, st, ys] = process.argv.slice(2);
const [W, H] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).toString().trim().split(',').map(Number);
const b = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 29 });
const Y = (x, y) => { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = ((y + dy) * W + x + dx) * 3; s += 0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2]; } return s / 9; };
for (const y of ys.split(',').map(Number)) { const o = []; for (let x = +x0; x < +x1; x += +st) o.push(Y(x, y).toFixed(0)); console.log('y' + y, o.join(' ')); }
