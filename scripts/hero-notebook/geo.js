// node geo.js '<json>' [media|bg|mediaRetrato|portrait]  -> o retângulo da tela do aparelho (px do quadro) e caixas (%) dos
// objetos, pontos da mesa. O `tela` (cx, cy, largura e altura, em px) é a tela do notebook nas câmeras deitadas e a do celular
// nas em pé: na media (px da mídia 1280x720) alimenta o ENTRADA.aparelho.deitado; na mediaRetrato (px da mídia 720x1280), o
// ENTRADA.aparelho.emPe. Em pé saem também o corpo do celular e o suporte (`celular`, `suporte`), para o vetor.
// json: { "world": {...}, "cam": {...}, "pts": [[px, py], ...] }
const F = require('./scene.js');
const ov = process.argv[2] ? JSON.parse(process.argv[2]) : {};
const which = process.argv[3] || 'media';
const o = Object.assign({}, F.CAMS[which], ov.cam || {});
o.world = Object.assign({}, o.world || {}, ov.world || {});
const W = F.prepWorld(o);
const cam = F.makeCam(o);
const r1 = v => +v.toFixed(1);
const bb = pts => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { const q = cam.P(p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return [x0 / cam.W * 100, x1 / cam.W * 100, y0 / cam.H * 100, y1 / cam.H * 100].map(r1); };
const slab = (ob, h) => { const fr = F.frameOf(ob), r = []; for (const u of [-ob.w / 2, ob.w / 2]) for (const v of [-ob.d / 2, ob.d / 2]) for (const hh of [0, h]) r.push(fr(u, hh, v)); return r; };
const out = {};
if (W.laptop) {
  const t = F.telaDoNotebook(which, Object.assign({}, ov.cam || {}, { world: o.world }));
  out.tela = { cx: r1(t.cx), cy: r1(t.cy), largura: r1(t.largura), altura: r1(t.altura), proporcao: +(t.largura / t.altura).toFixed(3) };
  // a base (o tampo, com o teclado) e a tampa inteira, em px: para o vetor do aparelho
  const L = W.laptop, g = F.laptopGeo(L), fr = F.frameOf({ x: L.x, z: L.z, rot: 0 });
  const px = p => cam.P(p).slice(0, 2).map(r1);
  out.base = { frenteEsq: px(fr(-L.w / 2, L.h, -L.d / 2)), frenteDir: px(fr(L.w / 2, L.h, -L.d / 2)), fundoEsq: px(fr(-L.w / 2, L.h, L.d / 2)), fundoDir: px(fr(L.w / 2, L.h, L.d / 2)), chaoFrente: r1(cam.P(fr(0, 0, -L.d / 2))[1]) };
  out.tampa = { esq: r1(cam.P(g.at(-L.w / 2, 0))[0]), dir: r1(cam.P(g.at(L.w / 2, 0))[0]), topo: r1(cam.P(g.at(0, g.lidH))[1]), pe: r1(cam.P(g.at(0, 0))[1]) };
  out.laptop = bb(slab(Object.assign({ rot: 0 }, L), L.h).concat([g.at(-L.w / 2, g.lidH), g.at(L.w / 2, g.lidH)]));
}
if (W.celular) {
  // em pé, a tela é a do celular; a do notebook (atrás dele) fica em `telaNotebook`
  out.telaNotebook = out.tela;
  const t = F.telaDoCelular(which, Object.assign({}, ov.cam || {}, { world: o.world }));
  out.tela = { cx: r1(t.cx), cy: r1(t.cy), largura: r1(t.largura), altura: r1(t.altura), proporcao: +(t.largura / t.altura).toFixed(4) };
  const c = W.celular, g = F.celularGeo(c), sg = F.suporteGeo(c), ch = sg.chapa, fr = F.frameOf(ch);
  const px = p => cam.P(p).slice(0, 2).map(r1);
  // o corpo: a face da frente (esquerda, direita, topo e pé); o suporte: a quina da frente da chapa na mesa (o `pe`) e no tampo
  out.celular = { esq: r1(cam.P(g.at(-c.w / 2, 0))[0]), dir: r1(cam.P(g.at(c.w / 2, 0))[0]), topo: r1(cam.P(g.at(0, g.h))[1]), pe: r1(cam.P(g.at(0, 0))[1]) };
  out.suporte = { frenteEsq: px(fr(-ch.w / 2, ch.h, -ch.d / 2)), frenteDir: px(fr(ch.w / 2, ch.h, -ch.d / 2)), fundoEsq: px(fr(-ch.w / 2, ch.h, ch.d / 2)), fundoDir: px(fr(ch.w / 2, ch.h, ch.d / 2)),
    ressalto: r1(cam.P([c.x, sg.ressalto.y1, sg.ressalto.z0])[1]), pe: r1(cam.P(fr(0, 0, -ch.d / 2))[1]) };
}
if (W.phone) out.phone = bb(slab(W.phone, W.phone.h));
if (W.box) { const b = W.box; const fr = F.frameOf(b), r = []; for (const u of [-b.w / 2, b.w / 2]) for (const v of [-b.d / 2, b.d / 2]) for (const hh of [0, b.h]) r.push(fr(u, hh, v)); out.box = bb(r); }
if (W.mug) { const m = W.mug, mp = []; for (let i = 0; i < 32; i++) { const a = i / 32 * 6.283; for (const h of [0, m.h]) mp.push([m.x + m.r * Math.cos(a), h, m.z + m.r * Math.sin(a)]); } out.mug = bb(mp); out.mugTop = cam.P([m.x, m.h, m.z]).slice(0, 2).map(r1); }
const desk = (px, py) => { const d = cam.ray(px * cam.W, py * cam.H); const t = -cam.pos[1] / d[1]; return [cam.pos[0] + d[0] * t, 0, cam.pos[2] + d[2] * t].map(r1); };
out.desk = {}; for (const [px, py] of (ov.pts || [[0.5, 0.94], [0.5, 1.0], [0.29, 0.7], [0.71, 0.7], [0.5, 0.88]])) out.desk[px + ',' + py] = desk(px, py);
const L = W.lamp; out.lamp = { head: cam.P(L.head).map(v => +v.toFixed(0)), base: cam.P(L.base).map(v => +v.toFixed(0)), elbow: cam.P(L.elbow).map(v => +v.toFixed(0)) };
if (W.win) { const z1 = W.glassZ; out.mull = W.win.mull.map(([a, b]) => [cam.P([a, 30, z1])[0], cam.P([b, 30, z1])[0], cam.P([a, 30, z1 - 4.5])[0], cam.P([b, 30, z1 - 4.5])[0]].map(v => +v.toFixed(0))); out.rail = r1(cam.P([0, W.win.y0, z1])[1] / cam.H * 100); }
console.log(JSON.stringify(out));
