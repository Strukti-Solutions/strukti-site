// node sondas.js <media 1280x720> [<bg 1920x1080>] [LxA ...]
// 1. A faixa do título na pausa: as metades ladeiam a tela do notebook (geo.js, câmera media). Para cada janela LxA
//    (padrão 1440x900 e 1366x768), a conta é a do telaNaCena (src/lib/heroEntrada.ts) com e = 1: a mídia cobre o palco
//    (object-fit: cover, object-position: 50% 100%). A linha 1 fica à esquerda da tela, a linha 2 à direita, cada uma
//    de 16 px da borda da janela até 24 px (tituloFolga) da borda da tela, na altura medida no site (h1 centrado no
//    palco: duas linhas de 1,05 × a fonte, com 16 px entre elas). Luminância BT.709 (0-255), percentil 90: até 60.
// 2. Os cantos (24 x 24 px) de cada imagem: a média não passa do navy-900 (#0e1c2b) em nenhum canal.
const { execFileSync } = require('child_process');
const F = require('./scene.js');
const args = process.argv.slice(2);
const imgs = args.filter(a => !/^\d+x\d+$/.test(a)), views = args.filter(a => /^\d+x\d+$/.test(a));
const decode = f => {
  const [W, H] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).toString().trim().split(',').map(Number);
  return { W, H, b: execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 29 }) };
};
const Y = (im, x, y) => { const i = (y * im.W + x) * 3; return 0.2126 * im.b[i] + 0.7152 * im.b[i + 1] + 0.0722 * im.b[i + 2]; };
const pct = (a, p) => { const s = Float64Array.from(a).sort(); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const midia = decode(imgs[0]);
const tela = F.telaDoNotebook('media');
const FOLGA = 24, MARGEM = 16;
// o h1 no site (medido a 1440x900 e 1366x768): fonte clamp(1.5rem, min(1.2rem + 3.6vw, 8.6vw - 0.25rem), 3.75rem)
const fonte = w => Math.min(60, Math.max(24, Math.min(19.2 + 0.036 * w, 0.086 * w - 4)));
const out = { tela: { cx: +tela.cx.toFixed(1), cy: +tela.cy.toFixed(1), largura: +tela.largura.toFixed(1), altura: +tela.altura.toFixed(1) }, faixa: {}, cantos: {} };
for (const v of (views.length ? views : ['1440x900', '1366x768'])) {
  const [w, h] = v.split('x').map(Number);
  const m = Math.max(w / 1280, h / 720), ox = (w - 1280 * m) * 0.5, oy = (h - 720 * m) * 1;
  const cx = ox + tela.cx * m, cy = oy + tela.cy * m, meia = tela.largura * m / 2;
  const lh = fonte(w) * 1.05, gap = 16, topo = h / 2 - (2 * lh + gap) / 2;
  const regs = { linha1: [MARGEM, cx - meia - FOLGA, topo, topo + lh], linha2: [cx + meia + FOLGA, w - MARGEM, topo + lh + gap, topo + 2 * lh + gap] };
  const res = {};
  for (const [k, [x0, x1, y0, y1]] of Object.entries(regs)) {
    const toM = (x, y) => [(x - ox) / m, (y - oy) / m];
    const [mx0, my0] = toM(x0, y0), [mx1, my1] = toM(x1, y1);
    const vals = [];
    for (let y = Math.max(0, Math.round(my0)); y < Math.min(720, Math.round(my1)); y++) for (let x = Math.max(0, Math.round(mx0)); x < Math.min(1280, Math.round(mx1)); x++) vals.push(Y(midia, x, y));
    res[k] = { janela: [x0, x1, y0, y1].map(n => +n.toFixed(1)), midia: [mx0, mx1, my0, my1].map(n => +n.toFixed(1)), p90: +pct(vals, 0.9).toFixed(1), max: +pct(vals, 1).toFixed(1), ok: pct(vals, 0.9) <= 60 };
  }
  out.faixa[v] = res;
}
const NAVY900 = [14, 28, 43];
for (const f of imgs) {
  const im = f === imgs[0] ? midia : decode(f), c = {};
  for (const [k, x0, y0] of [['se', 0, 0], ['sd', im.W - 24, 0], ['ie', 0, im.H - 24], ['id', im.W - 24, im.H - 24]]) {
    const s = [0, 0, 0]; for (let y = y0; y < y0 + 24; y++) for (let x = x0; x < x0 + 24; x++) { const i = (y * im.W + x) * 3; s[0] += im.b[i]; s[1] += im.b[i + 1]; s[2] += im.b[i + 2]; }
    const mean = s.map(t => +(t / 576).toFixed(1)); c[k] = { rgb: mean, ok: mean.every((t, j) => t <= NAVY900[j]) };
  }
  out.cantos[f] = c;
}
console.log(JSON.stringify(out, null, 1));
