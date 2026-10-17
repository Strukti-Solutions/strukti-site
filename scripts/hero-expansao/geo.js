// node geo.js '<json world overrides>'  -> media/bg/portrait object bboxes (%), desk points
const F = require('./scene.js');
const ov = process.argv[2] ? JSON.parse(process.argv[2]) : {};
const which = process.argv[3] || 'media';
const o = Object.assign({}, F.CAMS[which], ov.cam || {});
const W = JSON.parse(JSON.stringify(F.BASE)); const wo = Object.assign({}, o.world || {}, ov.world || {});
for (const k in wo) W[k] = wo[k] === null ? null : Object.assign({}, W[k], wo[k]);
const cam = F.makeCam(o);
const bb = pts => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { const q = cam.P(p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return [x0 / cam.W * 100, x1 / cam.W * 100, y0 / cam.H * 100, y1 / cam.H * 100].map(v => +v.toFixed(1)); };
const slab = (ob, h) => { const fr = F.frameOf(ob), r = []; for (const u of [-ob.w / 2, ob.w / 2]) for (const v of [-ob.d / 2, ob.d / 2]) for (const hh of [0, h]) r.push(fr(u, hh, v)); return r; };
const out = {};
if (W.phone) out.phone = bb(slab(W.phone, W.phone.h));
if (W.box) { const b = W.box; const fr = F.frameOf(b), r = []; for (const u of [-b.w / 2, b.w / 2]) for (const v of [-b.d / 2, b.d / 2]) for (const hh of [0, b.h]) r.push(fr(u, hh, v)); out.box = bb(r); }
if (W.notebook) out.note = bb(slab(Object.assign({ w: 21, d: 14.8 }, W.notebook), 1.5));
if (W.mug) { const m = W.mug, mp = []; for (let i = 0; i < 32; i++) { const a = i / 32 * 6.283; for (const h of [0, m.h]) mp.push([m.x + m.r * Math.cos(a), h, m.z + m.r * Math.sin(a)]); } out.mug = bb(mp); out.mugTop = cam.P([m.x, m.h, m.z]).slice(0, 2).map(v => +v.toFixed(1)); }
const desk = (px, py) => { const d = cam.ray(px * cam.W, py * cam.H); const t = -cam.pos[1] / d[1]; return [cam.pos[0] + d[0] * t, 0, cam.pos[2] + d[2] * t].map(v => +v.toFixed(1)); };
out.desk = {}; for (const [px, py] of (ov.pts || [[0.47, 0.78], [0.5, 0.94], [0.5, 1.0], [0.29, 0.7], [0.71, 0.7], [0.5, 0.88]])) out.desk[px + ',' + py] = desk(px, py);
const L = W.lamp; out.lamp = { head: cam.P(L.head).map(v => +v.toFixed(0)), base: cam.P(L.base).map(v => +v.toFixed(0)), elbow: cam.P(L.elbow).map(v => +v.toFixed(0)) };
if (W.win) { const z1 = W.glassZ; out.mull = W.win.mull.map(([a, b]) => [cam.P([a, 30, z1])[0], cam.P([b, 30, z1])[0], cam.P([a, 30, z1 - 4.5])[0], cam.P([b, 30, z1 - 4.5])[0]].map(v => +v.toFixed(0))); out.rail = +(cam.P([0, W.win.y0, z1])[1] / cam.H * 100).toFixed(1); }
console.log(JSON.stringify(out));
