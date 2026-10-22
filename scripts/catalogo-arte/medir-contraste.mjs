// Contraste do texto do cartão do centro sobre a arte (MASTER §3.4).
//
//   node scripts/catalogo-arte/medir-contraste.mjs
//
// Para cada item de public/catalogo/, compõe a arte (cartao.jpg) com o véu
// escuro do `.catalogo__info` e, em cada linha de texto (etiqueta do tipo,
// selo, nome e frase), pega o pixel MAIS CLARO do retângulo dela (o pior
// caso) e calcula a razão da WCAG contra a cor do texto, a 1440x900, 390x844
// e 360x740. Sai com código 1 se algum par ficar abaixo de 4,5:1.
//
// A geometria vem de uma medida no navegador (getBoundingClientRect do cartão
// do centro, em frações da superfície). Refaça a medida se o layout do cartão
// mudar (CSS de `.catalogo__info`), e rode este script de novo quando a arte
// final entrar no lugar dos provisórios.
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// O sharp vem com o next (dependência opcional dele), não do package.json.
const { default: sharp } = await import("sharp").catch(() => {
  console.error("medir-contraste precisa do sharp, que vem com o next: rode npm install (sem --omit=optional).");
  process.exit(2);
});

// fileURLToPath decodifica %20 e acentos (um clone numa pasta com espaço ou acento).
const RAIZ = fileURLToPath(new URL("../../public/catalogo/", import.meta.url));

// Frações da superfície do cartão: [esquerda, topo, direita, base]. Cada
// retângulo é a união, nos 10 itens, da caixa daquela linha no cartão do
// centro (getBoundingClientRect, tamanho de fonte padrão, medido em
// 22/10/2026): o pior lugar em que ela cai em algum item. O selo só conta
// os sem fundo próprio ("Em desenvolvimento" e "Ilustração do conceito",
// texto navy-100); "Piloto gratuito" e "Em uso" têm fundo opaco.
const CASOS = {
  "1440x900": {
    tipo: { cor: "#5fe3e8", r: [0.0702, 0.4881, 0.3403, 0.6462] },
    selo: { cor: "#dfe7ef", r: [0.0702, 0.4954, 0.8519, 0.6539] },
    nome: { cor: "#ffffff", r: [0.0702, 0.5688, 0.9298, 0.7278] },
    frase: { cor: "#dfe7ef", r: [0.0702, 0.701, 0.9298, 0.8283] },
  },
  "390x844": {
    tipo: { cor: "#5fe3e8", r: [0.0682, 0.1777, 0.4618, 0.4845] },
    selo: { cor: "#dfe7ef", r: [0.0682, 0.3462, 0.8117, 0.5514] },
    nome: { cor: "#ffffff", r: [0.0682, 0.4417, 0.9318, 0.6282] },
    frase: { cor: "#dfe7ef", r: [0.0682, 0.5839, 0.9318, 0.8067] },
  },
  "360x740": {
    tipo: { cor: "#5fe3e8", r: [0.0749, 0.0968, 0.5072, 0.3726] },
    selo: { cor: "#dfe7ef", r: [0.0749, 0.2207, 0.8915, 0.4461] },
    nome: { cor: "#ffffff", r: [0.0749, 0.3256, 0.9251, 0.5916] },
    frase: { cor: "#dfe7ef", r: [0.0749, 0.4818, 0.9251, 0.7877] },
  },
};

const NAVY = [8, 18, 29];

// Véu sob o texto. No `.catalogo__info`, o esmaecimento fica só no padding
// de cima (--info-fade) e a parada de 0,8 está onde o texto começa; dali para
// baixo o véu vai de 0,8 a 0,94. Todo pixel atrás do texto leva então pelo
// menos 0,8, e a medida usa esse mínimo (o pior caso). O check:browser
// ("texto do cartão") confere no navegador que a linha da etiqueta começa
// abaixo do esmaecimento, nos 10 itens, a 360x740, 390x844 e 1440x900.
const VEU_MINIMO = 0.8;

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
const piorPorLinha = {};
const falhas = [];

for (const slug of slugs) {
  const { data } = await sharp(join(RAIZ, slug, "cartao.jpg")).resize(L, A).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [caso, linhas] of Object.entries(CASOS)) {
    for (const [nome, { cor, r }] of Object.entries(linhas)) {
      let maisClaro = [0, 0, 0];
      let lMax = -1;
      const y0 = Math.max(0, Math.floor(r[1] * A));
      const y1 = Math.min(A - 1, Math.ceil(r[3] * A));
      for (let y = y0; y <= y1; y++) {
        const a = VEU_MINIMO;
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
      const chave = `${caso} ${nome}`;
      piorPorLinha[chave] = Math.min(piorPorLinha[chave] ?? Infinity, q);
      if (q < 4.5) falhas.push(`${slug} ${caso} ${nome}: ${q.toFixed(2)}`);
    }
  }
}

for (const [caso, v] of Object.entries(piorPorCaso)) {
  const linhas = Object.keys(CASOS[caso])
    .map((nome) => `${nome} ${piorPorLinha[`${caso} ${nome}`].toFixed(2)}`)
    .join(", ");
  console.log(`${caso}: pior razão ${v.toFixed(2)}:1 em ${slugs.length} itens (exige 4,5:1); por linha: ${linhas}`);
}
// Com qualquer arte: o pixel mais claro possível (branco) sob o véu mínimo.
const branco = [0, 1, 2].map((k) => 255 * (1 - VEU_MINIMO) + NAVY[k] * VEU_MINIMO);
console.log(
  `qualquer arte (pixel branco sob o véu de ${VEU_MINIMO}): ` +
    [["etiqueta", "#5fe3e8"], ["selo e frase", "#dfe7ef"], ["nome", "#ffffff"]].map(([n, c]) => `${n} ${razao(hex(c), branco).toFixed(2)}`).join(", "),
);
if (falhas.length) {
  console.log(falhas.join("\n"));
  process.exit(1);
}
