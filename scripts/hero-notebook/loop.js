// O loop de 10 s dos dois enquadramentos (README §5): o que muda de um para o outro na montagem dos passes.
//   node loop.js <media|mediaRetrato>          -> o enquadramento em JSON (tamanhos, cidade em 2x, vapor, LED, curvas)
//   node loop.js recorte <media|mediaRetrato>  -> o recorte do vapor para o vqa.sh (w:h:x:y)
// No navegador (plates*.html, city2x*.html), depois do scene.js: FDE_LOOP.passes(canvas, cam) e FDE_LOOP.cidade(canvas, cam).
//
// final(t) = A + T × cidade(t) + k(t) × E + j(t) × Lp + vapor(t), periódico em 10 s: o quadro 250 é igual ao 0.
// - cidade(t): a placa da cidade em 2x (2 × o quadro, mais 8 px de folga de cada lado) recortada de 8 a 0 px e de volta,
//   em passos inteiros (meio pixel no quadro), e reduzida ao tamanho do quadro;
// - k(t): o LED respira 18%, a partir do brilho da foto parada (`ledK` da câmera; 0,82 se ela não diz), para o quadro 0
//   ser a foto (o pôster sai do quadro 0);
// - j(t): o abajur oscila 3%;
// - vapor(t): a faixa do steam2.html (em 2x, período de 400 px) sobe três períodos por volta, na boca da caneca e na
//   escala dela. Em pé, a caneca está no desfoque do fundo (`desfoque` da câmera), e o vapor, mais mole ainda, é névoa:
//   mais desfoque, pico 20% mais baixo e a faixa defasada no quadro 0 (VAPOR_EM).
// O brilho frio da tela do aparelho na mesa fica parado (spec §12: a tela é o site, sem animação): ele está no passe A
// (e no D, porque não depende do abajur), e nenhum termo o modula.
(function (G) {
  const F = typeof module !== 'undefined' && typeof require === 'function' ? require('./scene.js') : G.FDE;
  // A faixa do vapor (steam2.html) foi desenhada para uma boca de caneca vista a 8,56 px/cm (o vapor ocupa 48 x 120 px do
  // quadro, ~14 cm de altura); o pé da faixa fica 4 px acima da boca. Noutra escala, a faixa cresce na mesma proporção.
  const VAPOR = { w: 48, h: 120, S: 8.56, acima: 4 };
  // Ajuste de arte (rodada 1 da N5), só em pé: a faixa ali fica 2,2× maior, e o fio do hero vira uma linha encostada
  // no montante da janela. `fase` (px da faixa, de 0 a 400) adianta o começo dela, para o quadro 0 (o pôster) pegar a
  // voluta que abre e não a reta; a curva continua periódica em 10 s, então a emenda não muda. `desfoque` (px) troca o
  // do fundo (4) por um de névoa, e `opacidade` baixa o pico do vapor. Deitado fica como foi aprovado (o vapor do hero).
  const VAPOR_EM = { mediaRetrato: { fase: 140, desfoque: 7, opacidade: 0.8 } };
  const SAIDA = { media: 'midia', mediaRetrato: 'midia-retrato' };
  const PASTA = { media: 'plates2', mediaRetrato: 'plates2-retrato' };
  const LED_PADRAO = 0.82, LED_RESPIRA = 0.18, ABAJUR = 0.03;
  const par = n => 2 * Math.round(n / 2);
  const num = n => +n.toFixed(4);

  function quadro(cam) {
    if (!SAIDA[cam]) throw new Error(`enquadramento desconhecido: ${cam} (media ou mediaRetrato)`);
    const o = Object.assign({}, F.CAMS[cam]), W0 = F.prepWorld(o), c = F.makeCam(o);
    // o vapor: o pé no meio da boca da caneca, o tamanho na escala dela
    const m = W0.mug, boca = [m.x, m.h, m.z], p = c.P(boca), s = c.S(boca) / VAPOR.S;
    const w = par(VAPOR.w * s), h = par(VAPOR.h * s);
    const x = Math.round(p[0] - w / 2), y = Math.round(p[1] - VAPOR.acima * s - h);
    // em pé (desfocaFundo): o desfoque pesa de 0 (yN, a mesa nítida) a 1 (yD); a boca da caneca fica acima de yD
    let desfoque = 0;
    if (o.desfoque) {
      const [zN, zD, px] = o.desfoque, cx = W0.celular ? W0.celular.x : 0;
      const yN = c.P([cx, 0, zN])[1], yD = c.P([cx, 0, zD])[1], peso = Math.min(1, Math.max(0, (yN - p[1]) / (yN - yD)));
      desfoque = peso > 0.5 ? Math.max(1, Math.round(px * o.F / 1000)) : 0;
    }
    const aj = VAPOR_EM[cam] || {}, fase = aj.fase || 0, opacidade = aj.opacidade != null ? aj.opacidade : 1;
    if (aj.desfoque) desfoque = Math.max(desfoque, aj.desfoque);
    const rx = Math.max(0, x - w / 2), ry = Math.max(0, y - 3);
    const recorteVapor = { x: rx, y: ry, w: Math.min(o.W, x + w + w / 2) - rx, h: Math.min(o.H, y + h + 8) - ry };
    const k0 = o.ledK != null ? o.ledK : LED_PADRAO, k1 = k0 + LED_RESPIRA <= 1 ? k0 + LED_RESPIRA : k0 - LED_RESPIRA;
    // as curvas, nas expressões do ffmpeg: `t` no crop, `T` no blend
    const curvas = {
      cidade: '8-trunc(8*pow(sin(PI*t/10),2)+0.5)',
      led: `${num(k0)}${k1 >= k0 ? '+' : '-'}${num(Math.abs(k1 - k0))}*(0.5-0.5*cos(2*PI*T/10))`,
      abajur: `${ABAJUR}*sin(2*PI*T/10)`,
      vapor: `trunc(mod(t*1200/10${fase ? `+${fase}` : ''},400))`
    };
    return {
      cam, W: o.W, H: o.H, saida: SAIDA[cam], pasta: PASTA[cam], mosaico: [2 * o.W, 2 * o.H],
      cidade: { pass: 'city', W: 2 * o.W + 16, H: 2 * o.H, F: 2 * o.F, shiftY: 2 * (o.shiftY || 0), pxk: 2, dither: 3 },
      vapor: { x, y, w, h, desfoque, fase, opacidade }, led: [num(k0), num(k1)], recorteVapor, curvas
    };
  }

  // O grafo do ffmpeg (composite2.js), entradas: 0 A, 1 T, 2 cidade 2x, 3 E, 4 Lp, 5 faixa do vapor, 6 máscara do vapor.
  function grafo(cam) {
    const q = quadro(cam), { W, H, vapor: v, curvas: k } = q;
    return [
      '[0]format=gbrp[A]', '[1]format=gbrp[T]', '[3]format=gbrp[E]', '[4]format=gbrp[Lp]',
      `[2]format=gbrp,crop=${2 * W}:${2 * H}:x='${k.cidade}':y=0,scale=${W}:${H}:flags=lanczos[city]`,
      '[T][city]blend=all_mode=multiply[tc]', '[A][tc]blend=all_mode=addition[x1]',
      `[x1][E]blend=all_expr='A+B*(${k.led})'[x2]`,
      `[x2][Lp]blend=all_expr='A+B*${k.abajur}'[x3]`,
      `[5]format=gbrp,split[s1][s2];[s1][s2]vstack,crop=96:240:0:'${k.vapor}'[sc]`,
      `[6]format=gbrp[m]`,
      `[sc][m]blend=all_mode=multiply,scale=${v.w}:${v.h}:flags=lanczos${v.opacidade < 1 ? `,colorchannelmixer=rr=${v.opacidade}:gg=${v.opacidade}:bb=${v.opacidade}` : ''},pad=${W}:${H}:${v.x}:${v.y}:black${v.desfoque ? `,gblur=sigma=${v.desfoque}` : ''}[st]`,
      '[x3][st]blend=all_mode=addition,format=gbrp[out]'
    ].join(';\n');
  }

  // Avalia uma curva (expressão do ffmpeg) em t segundos, para os testes e as conferências.
  function avalia(expr, t) {
    const f = new Function('t', 'T', 'PI', 'sin', 'cos', 'pow', 'trunc', 'mod', `return ${expr};`);
    return f(t, t, Math.PI, Math.sin, Math.cos, Math.pow, Math.trunc, (a, b) => a - b * Math.floor(a / b));
  }

  // No navegador: os quatro passes num mosaico (A B / C D) e a cidade em 2x.
  function passes(canvas, cam) {
    const q = quadro(cam), x = canvas.getContext('2d');
    ['A', 'B', 'C', 'D'].forEach((p, i) => {
      const t = document.createElement('canvas'); t.width = q.W; t.height = q.H;
      F.render(t, cam, { pass: p }); x.drawImage(t, (i % 2) * q.W, Math.floor(i / 2) * q.H);
    });
  }
  function cidade(canvas, cam) { F.render(canvas, cam, quadro(cam).cidade); }

  G.FDE_LOOP = { quadro, grafo, avalia, passes, cidade, VAPOR };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') {
  module.exports = globalThis.FDE_LOOP;
  if (require.main === module) {
    const [a, b] = process.argv.slice(2);
    if (a === 'recorte') { const r = module.exports.quadro(b).recorteVapor; console.log(`${r.w}:${r.h}:${r.x}:${r.y}`); }
    else console.log(JSON.stringify(module.exports.quadro(a || 'media'), null, 1));
  }
}
