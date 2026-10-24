// O loop de 10 s dos dois enquadramentos (README §5): o que muda de um para o outro na montagem dos passes.
//   node loop.js <media|mediaRetrato>          -> o enquadramento em JSON (tamanhos, cidade em 2x, vapor, LED, curvas)
//   node loop.js recorte <media|mediaRetrato>  -> o recorte do vapor para o vqa.sh (w:h:x:y)
//   node loop.js vapor <media|mediaRetrato>    -> a coluna de vapor gerada (<pasta>/vapor.mkv, ffv1, 251 quadros)
// No navegador (plates*.html, city2x*.html), depois do scene.js: FDE_LOOP.passes(canvas, cam) e FDE_LOOP.cidade(canvas, cam).
//
// final(t) = A + T × cidade(t) + k(t) × E + j(t) × Lp + vapor(t), periódico em 10 s: o quadro 250 é igual ao 0.
// - cidade(t): a placa da cidade em 2x (2 × o quadro, mais 8 px de folga de cada lado) recortada de 8 a 0 px e de volta,
//   em passos inteiros (meio pixel no quadro), e reduzida ao tamanho do quadro;
// - k(t): o LED respira 18%, a partir do brilho da foto parada (`ledK` da câmera; 0,82 se ela não diz), para o quadro 0
//   ser a foto (o pôster sai do quadro 0);
// - j(t): o abajur oscila 3%;
// - vapor(t): uma coluna gerada quadro a quadro (COLUNA, colunaDeVapor), na boca da caneca. A faixa do hero (o
//   steam2.html do expansao) saiu dos dois enquadramentos: em pé ela virava uma coluna reta e alta ao lado do montante
//   da janela (crítica da N5), e deitado subia 1,1× a caneca e cruzava a metade 2 do título (crítica da N6 r1).
// O brilho frio da tela do aparelho na mesa fica parado (spec §12: a tela é o site, sem animação): ele está no passe A
// (e no D, porque não depende do abajur), e nenhum termo o modula.
(function (G) {
  const F = typeof module !== 'undefined' && typeof require === 'function' ? require('./scene.js') : G.FDE;
  // A escala de referência do vapor: a boca de caneca do hero, vista a 8,56 px/cm. O `acima` da coluna (o pé dela acima
  // da boca) é em px dessa escala.
  const VAPOR = { S: 8.56 };
  // Em pé (crítica da N5, rodada 2), o vapor é uma coluna gerada, e não a faixa do hero: com a faixa, ele subia reto,
  // 1,3× a altura da caneca, paralelo ao montante da janela, e os dois fios fechavam "olhos" simétricos. A coluna:
  // - `altura`: some a essa fração da altura da caneca no quadro, com a opacidade caindo do meio para cima;
  // - `deriva`: px no topo, para um lado só (+ = direita, para o vidro, longe do montante), crescendo com a altura;
  // - `forca`: a opacidade de um fio de peso 1 no miolo; `pico`: o teto (saturação suave), para nenhum trecho virar
  //   um traço mais claro onde os fios se cruzam;
  // - `fios`: cada um com o próprio período (10 s e 5 s: sobem em velocidades diferentes e não se reencontram
  //   espelhados), o peso (1 e 0,6), a largura no pé e no topo (σ em px; o de trás alarga com a altura), o lugar na
  //   boca (`x0`, px do meio dela; `dx`, quanto anda até o topo) e a forma (as ondulações e os sopros de densidade, em
  //   harmônicos do comprimento `L`, que fecham em 10 s).
  // Deitado (crítica de arte N6 r1), a mesma receita: a faixa do hero subia 1,1× a caneca, reta, com os fios fechando
  // "olhos", e cruzava a metade 2 do título a 1366 (o "o" de "silêncio" fica sobre o meio da boca). A coluna sai da
  // metade direita da boca (`x0` de +20 e +27 px) e deriva para a direita, longe do título; em foco, os fios são finos.
  const COLUNA = {
    media: {
      arquivo: 'vapor.mkv', altura: 0.9, deriva: 12, pico: 0.28, forca: 0.21, w: 120, cx: 40, acima: 2,
      fios: [
        { periodo: 10, peso: 1, largura: [2, 4.5], x0: 22, L: 440, onda: [[3, 5, 0.4], [5, 2.5, 2.1], [7, 1.2, 4.0]], sopro: [6, 1.3, 0.4] },
        { periodo: 5, peso: 0.6, largura: [3, 9], x0: 29, dx: -4, L: 440, onda: [[2, 5, 2.6], [5, 2, 0.9]], sopro: [5, 4.4, 0.4] }
      ]
    },
    mediaRetrato: {
      arquivo: 'vapor.mkv', altura: 0.9, deriva: 12, pico: 0.3, forca: 0.24, w: 168, cx: 76, acima: 2,
      fios: [
        { periodo: 10, peso: 1, largura: [5, 10], x0: -9, L: 440, onda: [[3, 4.5, 0.4], [5, 2.2, 2.1], [7, 1.1, 4.0]], sopro: [6, 1.3] },
        { periodo: 5, peso: 0.6, largura: [7, 20], x0: 11, dx: -6, L: 440, onda: [[2, 5, 2.6], [5, 1.8, 0.9]], sopro: [5, 4.4] }
      ]
    }
  };

  const SAIDA = { media: 'midia', mediaRetrato: 'midia-retrato' };
  const PASTA = { media: 'plates2', mediaRetrato: 'plates2-retrato' };
  const LED_PADRAO = 0.82, LED_RESPIRA = 0.18, ABAJUR = 0.03;
  const num = n => +n.toFixed(4);

  function quadro(cam) {
    if (!SAIDA[cam]) throw new Error(`enquadramento desconhecido: ${cam} (media ou mediaRetrato)`);
    const o = Object.assign({}, F.CAMS[cam]), W0 = F.prepWorld(o), c = F.makeCam(o);
    // o vapor: a coluna na boca da caneca, na escala dela
    const m = W0.mug, boca = [m.x, m.h, m.z], p = c.P(boca), s = c.S(boca) / VAPOR.S;
    // em pé (desfocaFundo): o desfoque pesa de 0 (yN, a mesa nítida) a 1 (yD); a boca da caneca fica acima de yD
    let desfoque = 0;
    if (o.desfoque) {
      const [zN, zD, px] = o.desfoque, cx = W0.celular ? W0.celular.x : 0;
      const yN = c.P([cx, 0, zN])[1], yD = c.P([cx, 0, zD])[1], peso = Math.min(1, Math.max(0, (yN - p[1]) / (yN - yD)));
      desfoque = peso > 0.5 ? Math.max(1, Math.round(px * o.F / 1000)) : 0;
    }
    // a coluna gerada: a caixa em volta da boca, com o pé `acima` px de escala acima dela e espaço para a deriva
    const col = COLUNA[cam];
    const caneca = c.P([m.x, 0, m.z])[1] - p[1], alto = Math.round(col.altura * caneca);
    const hc = alto + 20, yc = Math.round(p[1] - col.acima * s) - hc + 1, xc = Math.round(p[0]) - col.cx;
    const coluna = Object.assign({}, col, { caneca: num(caneca), pe: hc - 1, cx: col.cx + (p[0] - Math.round(p[0])) });
    const vapor = { x: xc, y: yc, w: col.w, h: hc, desfoque, coluna };
    const entradas = ['A.png', 'T.png', 'city2x.png', 'E.png', 'Lp.png', col.arquivo];
    const rx = Math.max(0, vapor.x - vapor.w / 2), ry = Math.max(0, vapor.y - 3);
    const recorteVapor = { x: rx, y: ry, w: Math.min(o.W, vapor.x + vapor.w + vapor.w / 2) - rx, h: Math.min(o.H, vapor.y + vapor.h + 8) - ry };
    // a direção do respiro com folga de ponto flutuante: 0,82 + 0,18 pode sair um ulp acima de 1
    const k0 = o.ledK != null ? o.ledK : LED_PADRAO, k1 = k0 + LED_RESPIRA <= 1 + 1e-9 ? Math.min(1, k0 + LED_RESPIRA) : k0 - LED_RESPIRA;
    // as curvas, nas expressões do ffmpeg: `t` no crop, `T` no blend
    const curvas = {
      cidade: '8-trunc(8*pow(sin(PI*t/10),2)+0.5)',
      led: `${num(k0)}${k1 >= k0 ? '+' : '-'}${num(Math.abs(k1 - k0))}*(0.5-0.5*cos(2*PI*T/10))`,
      abajur: `${ABAJUR}*sin(2*PI*T/10)`
    };
    return {
      cam, W: o.W, H: o.H, saida: SAIDA[cam], pasta: PASTA[cam], mosaico: [2 * o.W, 2 * o.H],
      cidade: { pass: 'city', W: 2 * o.W + 16, H: 2 * o.H, F: 2 * o.F, shiftY: 2 * (o.shiftY || 0), pxk: 2, dither: 3 },
      vapor, entradas, led: [num(k0), num(k1)], recorteVapor, curvas
    };
  }

  // O grafo do ffmpeg (composite2.js), entradas: 0 A, 1 T, 2 cidade 2x, 3 E, 4 Lp e 5 o vapor, a coluna gerada (um
  // quadro por quadro do loop, já com a opacidade).
  function grafo(cam) {
    const q = quadro(cam), { W, H, vapor: v, curvas: k } = q;
    const st = `[5]format=gbrp,pad=${W}:${H}:${v.x}:${v.y}:black${v.desfoque ? `,gblur=sigma=${v.desfoque}` : ''}[st]`;
    return [
      '[0]format=gbrp[A]', '[1]format=gbrp[T]', '[3]format=gbrp[E]', '[4]format=gbrp[Lp]',
      `[2]format=gbrp,crop=${2 * W}:${2 * H}:x='${k.cidade}':y=0,scale=${W}:${H}:flags=lanczos[city]`,
      '[T][city]blend=all_mode=multiply[tc]', '[A][tc]blend=all_mode=addition[x1]',
      `[x1][E]blend=all_expr='A+B*(${k.led})'[x2]`,
      `[x2][Lp]blend=all_expr='A+B*${k.abajur}'[x3]`,
      st,
      '[x3][st]blend=all_mode=addition,format=gbrp[out]'
    ].join(';\n');
  }

  // A coluna de vapor gerada (em pé), no quadro k do loop (0 a 250; o 250 é o 0): a opacidade (0 a `pico`) de cada px
  // da caixa do vapor, linha a linha. `fio` (0 ou 1) devolve só um dos fios (para os testes).
  // Cada fio é uma linha gaussiana em x, cujo centro e cuja densidade são uma forma de comprimento L que sobe pela
  // coluna a L / periodo px por segundo (exatamente um comprimento por período: fecha em 10 s). A deriva e o envelope
  // (entra em 8% da coluna e cai do meio para cima) ficam presos ao quadro, como o ar parado em volta da caneca.
  function colunaDeVapor(cam, k, fio) {
    const q = quadro(cam), v = q.vapor, c = v.coluna;
    if (!c) throw new Error(`${cam} não tem coluna de vapor`);
    const out = new Float32Array(v.w * v.h), t = 10 * ((k % 250) / 250), alto = c.altura * c.caneca;
    const liso = x => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
    const fios = fio == null ? c.fios : [c.fios[fio]];
    for (let y = 0; y < v.h; y++) {
      const d = c.pe - y; // px acima do pé
      if (d < 0) continue;
      const u = d / alto;
      if (u >= 1) continue;
      const env = liso(u / 0.08) * (1 - liso((u - 0.4) / 0.6));
      const deriva = c.deriva * Math.pow(u, 1.5);
      for (const f of fios) {
        const sv = d - (f.L / f.periodo) * t; // a coordenada da forma, que sobe com o tempo
        let onda = 0;
        for (const [n, a, ph] of f.onda) onda += a * Math.sin((2 * Math.PI * n * sv) / f.L + ph);
        const xc = c.cx + (f.x0 || 0) + (f.dx || 0) * u + deriva + onda * (0.25 + 0.75 * u);
        const [n, ph, base = 0.25] = f.sopro;
        const dens = base + (1 - base) * Math.pow(0.5 + 0.5 * Math.sin((2 * Math.PI * n * sv) / f.L + ph), 2);
        const sg = f.largura[0] + (f.largura[1] - f.largura[0]) * u, a = c.forca * f.peso * env * dens, i0 = y * v.w;
        const x0 = Math.max(0, Math.floor(xc - 4 * sg)), x1 = Math.min(v.w - 1, Math.ceil(xc + 4 * sg));
        for (let x = x0; x <= x1; x++) out[i0 + x] += a * Math.exp(-((x - xc) ** 2) / (2 * sg * sg));
      }
    }
    // o teto: saturação suave até o pico (nenhum trecho passa dele, e o miolo não estoura)
    for (let i = 0; i < out.length; i++) out[i] = c.pico * (1 - Math.exp(-out[i] / c.pico));
    return out;
  }

  // Grava a coluna de vapor em <pasta>/vapor.mkv: ffv1, 251 quadros (o 250 é o 0), na cor do vapor do hero (o navy-100)
  // multiplicada pela opacidade, sobre o preto (o grafo soma).
  function gravaVapor(cam) {
    const { execFileSync } = require('child_process');
    const q = quadro(cam), v = q.vapor, cor = [223, 231, 239];
    const buf = Buffer.alloc(251 * v.w * v.h * 3);
    for (let k = 0; k <= 250; k++) {
      const f = colunaDeVapor(cam, k % 250), o = k * v.w * v.h * 3;
      for (let i = 0; i < f.length; i++) for (let j = 0; j < 3; j++) buf[o + 3 * i + j] = Math.round(cor[j] * f[i]);
    }
    const saida = require('path').join(__dirname, q.pasta, v.coluna.arquivo);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${v.w}x${v.h}`, '-framerate', '25', '-i', '-',
      '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', saida], { input: buf });
    return saida;
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

  G.FDE_LOOP = { quadro, grafo, avalia, colunaDeVapor, gravaVapor, passes, cidade, VAPOR };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') {
  module.exports = globalThis.FDE_LOOP;
  if (require.main === module) {
    // O enquadramento é obrigatório nas três ações (m7 da revisão final da fase 2): sem ele, nada de padrão escondido.
    const [a, b] = process.argv.slice(2);
    const acao = a === 'recorte' || a === 'vapor' ? a : null;
    const cam = acao ? b : a;
    if (cam !== 'media' && cam !== 'mediaRetrato') {
      console.error([
        `enquadramento ${cam === undefined ? 'ausente' : `desconhecido: ${cam}`}`,
        'uso: node loop.js <media|mediaRetrato>',
        '     node loop.js recorte <media|mediaRetrato>',
        '     node loop.js vapor <media|mediaRetrato>',
      ].join('\n'));
      process.exit(1);
    }
    if (acao === 'recorte') { const r = module.exports.quadro(cam).recorteVapor; console.log(`${r.w}:${r.h}:${r.x}:${r.y}`); }
    else if (acao === 'vapor') console.log(module.exports.gravaVapor(cam));
    else console.log(JSON.stringify(module.exports.quadro(cam), null, 1));
  }
}
