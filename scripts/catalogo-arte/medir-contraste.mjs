// Contraste do texto do cartão do centro sobre a arte (MASTER §3.4).
//
//   node scripts/catalogo-arte/medir-contraste.mjs
//
// Para cada item de public/catalogo/, compõe a arte (cartao.jpg) com o
// degradê escuro do `.catalogo__info` e, em cada linha de texto, pega o pixel
// MAIS CLARO do retângulo dela (o pior caso) e calcula a razão da WCAG contra
// a cor do texto. Sai com código 1 se algum par ficar abaixo de 4,5:1.
//
// A geometria vem de uma medida no navegador (getBoundingClientRect do cartão
// do centro, em frações da superfície). Refaça a medida se o layout do cartão
// mudar (CSS de `.catalogo__info`), e rode este script de novo quando a arte
// final entrar no lugar dos provisórios.
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const RAIZ = new URL("../../public/catalogo/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// Frações da superfície do cartão: [esquerda, topo, direita, base].
const CASOS = {
  "1440x900": {
    info: { topo: 0.4289 },
    linhas: {
      tipo: { cor: "#5fe3e8", r: [0.0702, 0.5614, 0.3311, 0.6038] },
      nome: { cor: "#ffffff", r: [0.0702, 0.6271, 0.9298, 0.6854] },
      frase: { cor: "#dfe7ef", r: [0.0702, 0.701, 0.9298, 0.8283] },
    },
  },
  // A 360x740 o texto é mais alto que o cartão (a caixa passa do topo); o
  // degradê começa acima da borda e só a parte de dentro aparece.
  "360x740": {
    info: { topo: -0.1929 },
    linhas: {
      tipo: { cor: "#5fe3e8", r: [0.1124, 0.0069, 0.2694, 0.0746] },
      nome: { cor: "#ffffff", r: [0.1124, 0.217, 0.8876, 0.3607] },
      frase: { cor: "#dfe7ef", r: [0.1124, 0.3856, 0.8876, 0.7252] },
    },
  },
};

const NAVY = [8, 18, 29];

// Degradê do `.catalogo__info`: 0,94 embaixo, 0,8 a 55% e 0 no topo.
function alfa(y, topoInfo) {
  const f = 1 - (y - topoInfo) / (1 - topoInfo); // 0 embaixo, 1 no topo da caixa
  if (f <= 0.55) return 0.94 - 0.14 * (f / 0.55);
  return Math.max(0, 0.8 * (1 - (f - 0.55) / 0.45));
}

const lin = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const razao = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const slugs = readdirSync(RAIZ, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(RAIZ, d.name, "cartao.jpg")))
  .map((d) => d.name);

const L = 200; // largura da amostra; 2:3
const A = 300;
const piorPorCaso = {};
const falhas = [];

for (const slug of slugs) {
  const { data } = await sharp(join(RAIZ, slug, "cartao.jpg")).resize(L, A).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [caso, { info, linhas }] of Object.entries(CASOS)) {
    for (const [nome, { cor, r }] of Object.entries(linhas)) {
      let maisClaro = [0, 0, 0];
      let lMax = -1;
      const y0 = Math.max(0, Math.floor(r[1] * A));
      const y1 = Math.min(A - 1, Math.ceil(r[3] * A));
      for (let y = y0; y <= y1; y++) {
        const a = alfa(y / A, info.topo);
        for (let x = Math.floor(r[0] * L); x <= Math.min(L - 1, Math.ceil(r[2] * L)); x++) {
          const i = (y * L + x) * 3;
          const p = [0, 1, 2].map((k) => data[i + k] * (1 - a) + NAVY[k] * a);
          const l = lum(p);
          if (l > lMax) {
            lMax = l;
            maisClaro = p;
          }
        }
      }
      const q = razao(hex(cor), maisClaro);
      piorPorCaso[caso] = Math.min(piorPorCaso[caso] ?? Infinity, q);
      if (q < 4.5) falhas.push(`${slug} ${caso} ${nome}: ${q.toFixed(2)}`);
    }
  }
}

for (const [caso, v] of Object.entries(piorPorCaso)) console.log(`${caso}: pior razão ${v.toFixed(2)}:1 em ${slugs.length} itens (exige 4,5:1)`);
if (falhas.length) {
  console.log(falhas.join("\n"));
  process.exit(1);
}
