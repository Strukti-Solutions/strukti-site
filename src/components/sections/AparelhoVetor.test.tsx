import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ENTRADA } from "@/lib/heroEntrada";
import { AparelhoVetor } from "./AparelhoVetor";
import geometria from "./aparelhoVetor.json";

function montar() {
  const host = document.createElement("div");
  host.innerHTML = renderToString(<AparelhoVetor />);
  return host;
}

/** Os pontos (x, y) de um `d` de SVG feito só de M, L e Z. */
function pontos(d: string): [number, number][] {
  return [...d.matchAll(/[ML]\s*(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

describe("<AparelhoVetor />", () => {
  it("no HTML do servidor: o notebook (tampa e base) e o celular (corpo e suporte), com os ganchos do check:browser", () => {
    const raiz = montar().querySelector(".aparelho-vetor");
    expect(raiz).not.toBeNull();
    expect(raiz?.querySelector(".aparelho-vetor__notebook > .aparelho-vetor__tampa")).not.toBeNull();
    expect(raiz?.querySelector(".aparelho-vetor__notebook > .aparelho-vetor__base")).not.toBeNull();
    expect(raiz?.querySelector(".aparelho-vetor__celular > .aparelho-vetor__corpo")).not.toBeNull();
    expect(raiz?.querySelector(".aparelho-vetor__celular > .aparelho-vetor__suporte")).not.toBeNull();
  });

  it("é aria-hidden, sem texto e sem nada focável", () => {
    const host = montar();
    expect(host.querySelector(".aparelho-vetor")?.getAttribute("aria-hidden")).toBe("true");
    expect(host.textContent).toBe("");
    expect(host.querySelector("a, button, input, select, textarea, [tabindex], video, audio, text, title")).toBeNull();
    for (const svg of host.querySelectorAll("svg")) expect(svg.getAttribute("focusable")).toBe("false");
  });

  it("só CSS e SVG inline: nenhuma imagem, e as pinturas do SVG só apontam para dentro dele", () => {
    const html = renderToString(<AparelhoVetor />);
    expect(html).not.toMatch(/<img|<image|<picture|href=/i);
    for (const url of html.matchAll(/url\(([^)]*)\)/g)) expect(url[1]).toMatch(/^#aparelho-vetor-/);
  });

  it("a tampa tem a borda da tela e o ponto da câmera; a base, a dobradiça, o teclado sem legenda e a sombra de contato", () => {
    const host = montar();
    expect(host.querySelector(".aparelho-vetor__tampa > .aparelho-vetor__camera")).not.toBeNull();
    for (const peca of ["__lateral", "__tampo", "__teclas", "__trackpad", "__brilho", "__dobradica", "__contato"]) {
      expect(host.querySelector(`.aparelho-vetor__base .aparelho-vetor${peca}`), peca).not.toBeNull();
    }
    for (const peca of ["__chapa", "__ressalto", "__contato"]) {
      expect(host.querySelector(`.aparelho-vetor__suporte .aparelho-vetor${peca}`), peca).not.toBeNull();
    }
    // Seis fileiras (a de cima mais fina; a de baixo com a barra de espaço): 14 + 14 + 14 + 13 + 12 + 6 teclas.
    const teclas = host.querySelector(".aparelho-vetor__teclas")?.getAttribute("d") ?? "";
    expect(teclas.match(/M/g)?.length).toBe(73);
  });

  it("a base é um trapézio que se alarga para baixo, abaixo da tela e mais larga que a tampa", () => {
    const { notebook } = geometria;
    const tampo = pontos(notebook.base.tampo);
    const ys = tampo.map(([, y]) => y);
    const largura = (y: number) => {
      const xs = tampo.filter(([, py]) => Math.abs(py - y) < 2).map(([x]) => x);
      return Math.max(...xs) - Math.min(...xs);
    };
    const fundo = Math.min(...ys);
    const frente = Math.max(...ys);
    expect(fundo).toBeGreaterThan(0);
    expect(largura(frente)).toBeGreaterThan(largura(fundo) * 1.15);
    expect(largura(frente)).toBeGreaterThan(notebook.tela.largura + 2 * notebook.tampa.lado);
  });

  it("a tela do vetor é a do ENTRADA (a escala do furo é a largura da tela da arte)", () => {
    expect(geometria.notebook.tela.largura).toBe(ENTRADA.aparelho.deitado.largura);
    expect(geometria.celular.tela.largura).toBe(ENTRADA.aparelho.emPe.largura);
  });
});

describe('globals.css, bloco Hero "entrada"', () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");
  const start = css.indexOf('/* Hero "entrada"');
  const end = css.indexOf("/* SPIKE: prévia", start);
  const bloco = css.slice(start, end);
  const corpo = (seletor: string) => {
    const i = bloco.indexOf(`${seletor} {\n`);
    expect(i, seletor).toBeGreaterThan(-1);
    return bloco.slice(i, bloco.indexOf("}", i)).replace(/\s+/g, " ");
  };

  it("existe, logo depois do bloco do hero expansao", () => {
    expect(start).toBeGreaterThan(css.indexOf('/* Hero "expansao" (MASTER §9.8, ADR-010)'));
    expect(end).toBeGreaterThan(start);
  });

  it("o cinza saiu: nada de .aparelho-cinza no CSS", () => {
    expect(css).not.toContain("aparelho-cinza");
  });

  it("expandido, a tela fica sem transform (é a página)", () => {
    expect(bloco).toMatch(
      /\.hero-expansao--entrada\[data-expanded="true"\] \.hero-expansao__conteudo \{[^}]*transform: none;/,
    );
  });

  it("até o fim da entrada, a tela não recebe ponteiro", () => {
    expect(bloco).toMatch(
      /\.hero-expansao--entrada\[data-pin="true"\]:not\(\[data-progress="1\.00"\]\) \.hero-expansao__conteudo \{[^}]*pointer-events: none;/,
    );
  });

  it("tem o estado parado sem JavaScript e as cores forçadas", () => {
    expect(bloco).toContain("@media (scripting: none)");
    expect(bloco).toContain("forced-colors");
  });

  it("a moldura é uma borda de espessura fixa em volta do furo (a tela), na unidade da largura da tela", () => {
    // A tampa do notebook e o corpo do celular: a mesma regra, com as medidas de cada um.
    const moldura = corpo(".hero-expansao--entrada :is(.aparelho-vetor__tampa, .aparelho-vetor__corpo)");
    expect(moldura).toContain(
      "border-width: calc(var(--av-topo) * var(--av-px)) calc(var(--av-lado) * var(--av-px)) calc(var(--av-queixo) * var(--av-px));",
    );
    expect(moldura).toContain(
      "inset: calc(-1 * var(--av-topo) * var(--av-px)) calc(-1 * var(--av-lado) * var(--av-px)) calc(-1 * var(--av-queixo) * var(--av-px));",
    );
    // A unidade: a tela tem `largura` px da mídia e 100cqw no aparelho sem escala.
    expect(corpo(".hero-expansao--entrada :is(.aparelho-vetor__notebook, .aparelho-vetor__celular)")).toContain(
      "--av-px: calc(100cqw / var(--av-largura));",
    );
  });

  it("a base e o suporte ficam presos ao pé da tela, na escala dela (o SVG no tamanho da caixa do vetor.js)", () => {
    const svg = corpo(".hero-expansao--entrada :is(.aparelho-vetor__base, .aparelho-vetor__suporte)");
    expect(svg).toContain("top: calc(100% + var(--av-y) * var(--av-px));");
    expect(svg).toContain("left: calc(50% + var(--av-x) * var(--av-px));");
    expect(svg).toContain("width: calc(var(--av-w) * var(--av-px));");
    expect(svg).toContain("height: calc(var(--av-h) * var(--av-px));");
  });

  it("o notebook deitado e o celular em pé, pela orientação", () => {
    expect(corpo(".hero-expansao--entrada .aparelho-vetor__celular")).toContain("display: none;");
    expect(bloco).toMatch(
      /@media \(orientation: portrait\) \{\s*\.hero-expansao--entrada \.aparelho-vetor__notebook \{\s*display: none;\s*\}\s*\.hero-expansao--entrada \.aparelho-vetor__celular \{\s*display: block;/,
    );
  });

  it("no estado parado, o furo ganha o fundo da página; com cores forçadas, o contorno fica em CanvasText", () => {
    const parado = bloco.slice(bloco.indexOf("@media (scripting: none), (prefers-reduced-motion: reduce) {"));
    expect(parado.slice(0, parado.indexOf("\n}\n"))).toMatch(
      /\.hero-expansao--entrada :is\(\.aparelho-vetor__notebook, \.aparelho-vetor__celular\) \{\s*background-color: var\(--surface\);/,
    );
    const forcadas = bloco.slice(bloco.indexOf("@media (forced-colors: active) {"));
    expect(forcadas.slice(0, forcadas.indexOf("\n}\n"))).toMatch(
      /\.hero-expansao--entrada :is\(\.aparelho-vetor__tampa, \.aparelho-vetor__corpo\) \{[^}]*outline: 2px solid CanvasText;/,
    );
  });

  it("no estado parado, as metades do título ficam inteiras no palco, entre os gutters", () => {
    // O palco corta (overflow: clip) e o estado parado é permanente: a linha
    // que passasse da borda ficaria ilegível. A borda esquerda da linha 1
    // (centrada, 50% é meia largura dela) não passa do gutter, e a direita
    // da linha 2 também não.
    const inicio = bloco.indexOf("@media (scripting: none), (prefers-reduced-motion: reduce) {");
    expect(inicio).toBeGreaterThan(-1);
    const parado = bloco.slice(inicio, bloco.indexOf("\n}\n", inicio));
    const declaracao = (nome: string) => parado.match(new RegExp(`${nome}:\\s*([^;]*);`))?.[1]?.replace(/\s+/g, " ");

    expect(declaracao("--hx-linha1-x")).toBe(
      "max( calc(-50cqw * var(--hx-tela-s) - var(--hx-titulo-folga) - 50%), calc(-50cqw + 50% + var(--gutter)) ) !important",
    );
    expect(declaracao("--hx-linha2-x")).toBe(
      "min( calc(50cqw * var(--hx-tela-s) + var(--hx-titulo-folga) + 50%), calc(50cqw - 50% - var(--gutter)) ) !important",
    );
  });

  it("na pausa, as metades do título escalam por --hx-titulo-s em volta da borda que encosta na tela", () => {
    // A escala vem com a expansão (1 no cartão, --hx-titulo-s na pausa) e fica na aproximação.
    const escala = "scale(calc(1 - var(--hx-e) * (1 - var(--hx-titulo-s))))";
    const linha1 = corpo(".hero-expansao--entrada .hero-expansao__linha--1");
    expect(linha1).toContain("transform-origin: 100% 50%;");
    expect(linha1).toContain(escala);
    const linha2 = corpo(".hero-expansao--entrada .hero-expansao__linha--2");
    expect(linha2).toContain("transform-origin: 0 50%;");
    expect(linha2).toContain(escala);
    // Antes de medir, e no estado parado (sem medir), sem escala.
    expect(corpo(".hero-expansao--entrada")).toContain("--hx-titulo-s: 1;");
    const parado = bloco.slice(bloco.indexOf("@media (scripting: none), (prefers-reduced-motion: reduce) {"));
    expect(parado.slice(0, parado.indexOf("\n}\n"))).toContain("--hx-titulo-s: 1 !important;");
  });

  it("não usa 100vw (com a barra de rolagem clássica, passa da janela útil) nem imagem no aparelho", () => {
    expect(bloco).not.toContain("100vw");
    const aparelho = bloco.slice(bloco.indexOf("/* O aparelho em vetor"));
    expect(aparelho).not.toMatch(/url\(/);
  });
});
