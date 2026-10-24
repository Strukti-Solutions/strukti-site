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

  it("o grão da cena (ajuste de arte r1): a base e o suporte levam os três ladrilhos, presos ao contorno deles", () => {
    const host = montar();
    const { grao } = geometria;
    // Lados primos entre si: a soma só se repete a cada 7 × 11 × 13 px da mídia (um ladrilho só formava uma grade).
    expect(grao.ladrilhos.map((l) => l.lado)).toEqual([7, 11, 13]);
    for (const seletor of [".aparelho-vetor__base", ".aparelho-vetor__suporte"]) {
      const svg = host.querySelector(`svg${seletor}`);
      // Os <pattern> de cada SVG ficam nele (as pinturas só apontam para dentro do próprio SVG).
      const patterns = [...(svg?.querySelectorAll("pattern") ?? [])];
      expect(patterns.map((p) => p.getAttribute("width")), seletor).toEqual(["7", "11", "13"]);
      for (const [i, pattern] of patterns.entries()) {
        expect(pattern.getAttribute("patternUnits")).toBe("userSpaceOnUse");
        expect(pattern.querySelectorAll("path")[0]?.getAttribute("d")).toBe(grao.ladrilhos[i]?.claro);
        expect(svg?.querySelector(`.aparelho-vetor__grao [fill="url(#${pattern.id})"]`), pattern.id).not.toBeNull();
      }
      // O grão fica dentro do contorno (um clipPath do próprio SVG).
      expect(svg?.querySelector(".aparelho-vetor__grao")?.getAttribute("clip-path")).toMatch(/^url\(#aparelho-vetor-/);
    }
    // A moldura fica sem grão: no vidro escuro ele não aparece, e sobre o furo sujaria a tela no estado parado.
    expect(host.querySelector(".aparelho-vetor__tampa .aparelho-vetor__grao, .aparelho-vetor__corpo .aparelho-vetor__grao")).toBeNull();
  });

  it("o vidro da borda é navy (o mais escuro da cena) e não o fundo da tela; o ressalto tem volume e o brilho frio cai até 35% da base", () => {
    expect(geometria.notebook.cores.vidro).toBe("rgb(5 11 19)");
    expect(geometria.celular.cores.vidro).toBe("rgb(5 11 19)");
    // O navy-950 (#08121d) é o fundo da tela (surface-space): a borda tem de ser outra cor.
    expect(geometria.notebook.cores.vidro).not.toBe("rgb(8 18 29)");
    const host = montar();
    const frente = host.querySelector(".aparelho-vetor__ressalto .aparelho-vetor__lateral");
    expect(frente?.getAttribute("fill")).toMatch(/^url\(#aparelho-vetor-/);
    const brilho = host.querySelector("#aparelho-vetor-brilho");
    expect([...(brilho?.querySelectorAll("stop") ?? [])].map((s) => s.getAttribute("offset"))).toEqual(["0", "0.35", "1"]);
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

  it("o celular (crítica de arte N6 r1): o furo da câmera na borda de cima, como no notebook", () => {
    const host = montar();
    expect(host.querySelector(".aparelho-vetor__corpo > .aparelho-vetor__camera")).not.toBeNull();
    const { corpo } = geometria.celular as { corpo: { topo: number; camera?: number } };
    // discreto: um quarto da borda de cima, como o do notebook (3,16 px numa borda de 12,12)
    expect(corpo.camera).toBeGreaterThan(0.15 * corpo.topo);
    expect(corpo.camera).toBeLessThan(0.35 * corpo.topo);
    const estilo = host.querySelector<HTMLElement>(".aparelho-vetor__celular")?.getAttribute("style") ?? "";
    expect(estilo).toContain(`--av-camera:${corpo.camera}`);
  });

  it("a aba do suporte abraça o pé do celular: a frente sobe sobre o queixo, sem chegar ao pé da tela", () => {
    const { corpo, suporte } = geometria.celular;
    const yDe = (d: string) => pontos(d).map(([, y]) => y);
    const altoDaFrente = Math.min(...yDe(suporte.ressalto.frente));
    // o queixo vai do pé da tela (y 0) ao pé do corpo (y = queixo): a aba cobre ao menos 40% dele
    expect(altoDaFrente).toBeLessThanOrEqual(0.6 * corpo.queixo);
    // e nem a frente nem o topo dela passam do pé da tela (a tela, por cima de tudo, a cortaria)
    expect(altoDaFrente).toBeGreaterThan(0);
    expect(Math.min(...yDe(suporte.ressalto.topo))).toBeGreaterThanOrEqual(0);
  });

  it("a frente da aba recebe a luz quente da luminária, da esquerda, e deixa uma sombra macia na chapa", () => {
    const host = montar();
    const { ressalto } = geometria.celular.suporte as { ressalto: { frente: string; cores: { quente?: string } } };
    const quente = host.querySelector("#aparelho-vetor-ressalto-quente");
    expect(quente?.tagName.toLowerCase()).toBe("lineargradient");
    // da esquerda para a direita
    expect([quente?.getAttribute("x1"), quente?.getAttribute("x2"), quente?.getAttribute("y2")]).toEqual(["0", "1", "0"]);
    const paradas = [...(quente?.querySelectorAll("stop") ?? [])];
    expect(paradas[0]?.getAttribute("stop-color")).toBe(ressalto.cores.quente);
    expect(Number(paradas.at(-1)?.getAttribute("stop-opacity"))).toBe(0);
    const camada = host.querySelector('.aparelho-vetor__ressalto [fill="url(#aparelho-vetor-ressalto-quente)"]');
    expect(camada?.getAttribute("d")).toBe(ressalto.frente);
    // a sombra da aba na chapa: uma faixa logo abaixo da frente, que some para a frente
    const sombra = host.querySelector(".aparelho-vetor__suporte .aparelho-vetor__sombra-aba");
    expect(sombra?.getAttribute("fill")).toBe("url(#aparelho-vetor-sombra-aba)");
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

  it("o grão some nas cores forçadas", () => {
    const forcadas = bloco.slice(bloco.indexOf("@media (forced-colors: active) {"));
    expect(forcadas.slice(0, forcadas.indexOf("\n}\n"))).toMatch(/\.aparelho-vetor__grao \{\s*display: none;/);
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

  /** O corpo do estado parado: o deitado (as duas condições) e o em pé. */
  const parado = (() => {
    const inicio = bloco.indexOf("@media (scripting: none), (prefers-reduced-motion: reduce) {");
    return bloco.slice(inicio, bloco.indexOf("\n}\n", inicio));
  })();
  const paradoEmPe = (() => {
    const inicio = bloco.indexOf("@media (scripting: none) and (orientation: portrait)");
    return bloco.slice(inicio, bloco.indexOf("\n}\n", inicio));
  })();
  const declaracao = (corpoDaRegra: string, nome: string) =>
    corpoDaRegra.match(new RegExp(`${nome}:\\s*([^;]*);`))?.[1]?.replace(/\s+/g, " ").trim();

  it("no estado parado (o pôster da pausa, §7), deitado, as metades ladeiam a moldura com a folga, inteiras no palco", () => {
    // A moldura: a meia tela, a borda e meio aro do ENTRADA, na unidade de 1 px da mídia da pose parada.
    const { deitado } = ENTRADA.aparelho;
    expect(declaracao(parado, "--hx-parado-px")).toBe(`calc(var(--hx-tela-s) * 100cqw / ${deitado.largura})`);
    expect(declaracao(parado, "--hx-parado-moldura")).toBe(
      `calc(50cqw * var(--hx-tela-s) + (${deitado.moldura.lado} + ${deitado.moldura.aro} / 2) * var(--hx-parado-px))`,
    );
    // A folga: a fixa ou 4% da largura da moldura (8% da meia).
    expect(declaracao(parado, "--hx-parado-folga")).toBe(
      `max(var(--hx-titulo-folga), ${2 * ENTRADA.tituloFolgaRelativa} * var(--hx-parado-moldura))`,
    );
    // Deitado, ao lado do notebook, a folga e a margem de quem fica de lado; em pé, as de cima e de baixo do celular.
    expect(declaracao(corpo(".hero-expansao--entrada"), "--hx-titulo-folga")).toBe(`${ENTRADA.tituloFolgaLado}px`);
    expect(declaracao(corpo(".hero-expansao--entrada"), "--hx-titulo-margem")).toBe(`${ENTRADA.tituloMargemLado}px`);
    const cartaoEmPe = bloco.slice(bloco.indexOf("@media (orientation: portrait) {\n  .hero-expansao--entrada {\n"));
    const corpoEmPe = cartaoEmPe.slice(0, cartaoEmPe.indexOf("}"));
    expect(declaracao(corpoEmPe, "--hx-titulo-folga")).toBe(`${ENTRADA.tituloFolga}px`);
    expect(declaracao(corpoEmPe, "--hx-titulo-margem")).toBe(`${ENTRADA.tituloMargem}px`);
    // A linha 1 termina e a 2 começa a folga da moldura; nunca passam da margem do palco.
    expect(declaracao(parado, "--hx-linha1-x")).toBe(
      "max( calc(-1 * (var(--hx-parado-moldura) + var(--hx-parado-folga)) - 50%), calc(-50cqw + 50% + var(--hx-titulo-margem)) ) !important",
    );
    expect(declaracao(parado, "--hx-linha2-x")).toBe(
      "min( calc(var(--hx-parado-moldura) + var(--hx-parado-folga) + 50%), calc(50cqw - 50% - var(--hx-titulo-margem)) ) !important",
    );
  });

  it("no estado parado, deitado, cada metade vai à altura do tituloY da mídia (o h1 centrado no palco, linhas de 1,05em)", () => {
    const [y1, y2] = ENTRADA.aparelho.deitado.tituloY;
    expect(declaracao(parado, "--hx-linha1-y")).toBe(
      `calc( var(--hx-palco-h) - (720 - ${y1}) * var(--hx-midia-largura) / 1280 - var(--hx-palco-h) / 2 + var(--space-4) / 2 + 0.525em ) !important`,
    );
    expect(declaracao(parado, "--hx-linha2-y")).toBe(
      `calc( var(--hx-palco-h) - (720 - ${y2}) * var(--hx-midia-largura) / 1280 - var(--hx-palco-h) / 2 - var(--space-4) / 2 - 0.525em ) !important`,
    );
  });

  it("no estado parado, em pé, as metades ficam centradas, a 1 acima da moldura e a 2 na mesa abaixo do suporte", () => {
    const { emPe } = ENTRADA.aparelho;
    expect(declaracao(paradoEmPe, "--hx-parado-px")).toBe(`calc(var(--hx-tela-s) * 100cqw / ${emPe.largura})`);
    expect(declaracao(paradoEmPe, "--hx-parado-moldura")).toBe(
      `calc(50cqw * var(--hx-tela-s) + (${emPe.moldura.lado} + ${emPe.moldura.aro} / 2) * var(--hx-parado-px))`,
    );
    expect(declaracao(paradoEmPe, "--hx-linha1-x")).toBe("0px !important");
    expect(declaracao(paradoEmPe, "--hx-linha2-x")).toBe("0px !important");
    expect(declaracao(paradoEmPe, "--hx-linha1-y")).toBe(
      `calc( var(--hx-tela-y) - (${emPe.moldura.topo} + ${emPe.moldura.aro} / 2) * var(--hx-parado-px) - var(--hx-parado-folga) - var(--hx-palco-h) / 2 + var(--space-4) / 2 ) !important`,
    );
    expect(declaracao(paradoEmPe, "--hx-linha2-y")).toBe(
      "calc( max(var(--hx-parado-pe) + var(--hx-parado-folga) + 0.525em, (var(--hx-parado-pe) + var(--hx-palco-h)) / 2) - var(--hx-palco-h) / 2 - var(--space-4) / 2 - 0.525em ) !important",
    );
    expect(declaracao(paradoEmPe, "--hx-parado-pe")).toBe(
      `calc(var(--hx-tela-y) + var(--hx-tela-s) * var(--hx-palco-h) + ${emPe.pe} * var(--hx-parado-px))`,
    );
  });

  it("no estado parado, o h1 encolhe pela fonte (sem medir, sem escala) até as metades caberem no espaço livre", () => {
    // A fonte do h1 de sempre, limitada pelo espaço livre ÷ a largura de cada metade em em (688 e 323 px a 60 px).
    const regraBase = css.slice(css.indexOf(".hero-expansao__titulo h1 {\n"));
    const base = regraBase.slice(0, regraBase.indexOf("}")).match(/font-size: ([^;]*);/)?.[1];
    expect(base).toBeDefined();
    const [em1, em2] = [688 / 60, 323 / 60].map((n) => Math.round(n * 100) / 100);
    const fonte = (corpoDaRegra: string) =>
      corpoDaRegra.slice(corpoDaRegra.indexOf(".hero-expansao--entrada .hero-expansao__titulo h1 {")).match(/font-size: ([^;]*);/)?.[1]?.replace(/\s+/g, " ");
    // Com piso: o piso da fonte de sempre (1,5rem), para o título crescer com o zoom e com a fonte grande do
    // navegador (WCAG 1.4.4) quando o espaço livre, em px CSS, encolhe; abaixo dele a metade encosta na moldura.
    const piso = base?.match(/^clamp\(([^,]+),/)?.[1];
    expect(piso).toBe("1.5rem");
    expect(fonte(parado)).toBe(
      `max( ${piso}, min( ${base}, var(--hx-parado-livre) / ${em1}, var(--hx-parado-livre) / ${em2} ) )`,
    );
    // A regra do deitado vale também em pé (as duas condições da media query); em pé muda só o espaço livre.
    expect(fonte(paradoEmPe)).toBeUndefined();
    expect(declaracao(parado, "--hx-parado-livre")).toBe(
      "calc(50cqw - var(--hx-parado-moldura) - var(--hx-parado-folga) - var(--hx-titulo-margem))",
    );
    expect(declaracao(paradoEmPe, "--hx-parado-livre")).toBe("calc(100cqw - 2 * var(--hx-titulo-margem))");
    expect(declaracao(parado, "--hx-titulo-s")).toBe("1 !important");
  });

  it("na pausa, as metades andam por --hx-linha*-x/-y e escalam por --hx-titulo-s em volta da borda junto do aparelho", () => {
    // A escala vem com a expansão (1 no cartão, --hx-titulo-s na pausa) e fica na aproximação.
    const escala = "scale(calc(1 - var(--hx-e) * (1 - var(--hx-titulo-s))))";
    const linha1 = corpo(".hero-expansao--entrada .hero-expansao__linha--1");
    expect(linha1).toContain("transform-origin: 100% 50%;");
    expect(linha1).toContain(
      "translate( calc(var(--hx-e) * var(--hx-linha1-x) - var(--hx-titulo-saida) * 60vw), calc(var(--hx-e) * var(--hx-linha1-y)) )",
    );
    expect(linha1).toContain(escala);
    const linha2 = corpo(".hero-expansao--entrada .hero-expansao__linha--2");
    expect(linha2).toContain("transform-origin: 0 50%;");
    expect(linha2).toContain(
      "translate( calc(var(--hx-e) * var(--hx-linha2-x) + var(--hx-titulo-saida) * 60vw), calc(var(--hx-e) * var(--hx-linha2-y)) )",
    );
    expect(linha2).toContain(escala);
    // Em pé, as duas ficam centradas (acima e abaixo do celular): a escala em volta do meio.
    expect(bloco).toMatch(
      /@media \(orientation: portrait\) \{\s*\.hero-expansao--entrada \.hero-expansao__linha \{\s*transform-origin: 50% 50%;/,
    );
    // Antes de medir, sem escala e sem deslocamento.
    const cartao = corpo(".hero-expansao--entrada");
    expect(cartao).toContain("--hx-titulo-s: 1;");
    expect(cartao).toContain("--hx-linha1-y: 0px;");
    expect(cartao).toContain("--hx-linha2-y: 0px;");
  });

  it("no cartão, um véu do navy da tela apaga o bloco de chamada atrás do h1 e some até o fim da expansão (crítica de arte N6 r1)", () => {
    // Texto sobre texto no primeiro quadro: o h1 passava em cima da chamada e dos botões em miniatura.
    const veu = corpo(
      '.hero-expansao--entrada:is([data-pin="true"], [data-progress="1.00"]):not([data-expanded="true"]) .hero-expansao__conteudo::after',
    );
    expect(veu).toContain('content: "";');
    expect(veu).toContain("inset: 0;");
    expect(veu).toContain("background-color: var(--surface);");
    // 0,9 no cartão (e = 0), igual até e = 0,65 (P ≈ 0,35) e 0 no fim da expansão (e = 1).
    expect(veu).toContain("opacity: calc(0.9 * min(1, (1 - var(--hx-e)) / 0.35));");
    expect(veu).toContain("pointer-events: none;");
    // Só opacidade: nada de display nem visibility, para o leitor de tela seguir lendo o bloco (§5).
    expect(veu).not.toMatch(/display|visibility/);
  });

  it("no cartão, o fundo de fora escurece na faixa do h1 (MASTER §3.4), por cima do degradê do expansao", () => {
    const fundo = corpo(".hero-expansao--entrada .hero-expansao__fundo::after");
    expect(fundo).toMatch(/radial-gradient\( ellipse min\(40cqw, 520px\) min\(22cqw, 180px\) at 50% 50%,/);
    // O degradê do pé, o do expansao, continua por baixo.
    expect(fundo).toContain("linear-gradient( to bottom, rgb(8 18 29 / 0.1) 0%, rgb(8 18 29 / 0.1) 72%, var(--color-navy-950) 100% )");
  });

  it("o corpo do celular tem um filete de luz fria na borda junto da tela (o brilho dela), sem cobrir a tela", () => {
    const filete = corpo(".hero-expansao--entrada .aparelho-vetor__corpo::after");
    expect(filete).toContain('content: "";');
    // em volta do furo, por fora dele: a tela (por cima) não o cobre
    expect(filete).toContain("inset: calc(-0.8 * var(--av-px));");
    expect(filete).toContain("border: calc(0.8 * var(--av-px)) solid");
    expect(filete).toContain("pointer-events: none;");
  });

  it("não usa 100vw (com a barra de rolagem clássica, passa da janela útil) nem imagem no aparelho", () => {
    expect(bloco).not.toContain("100vw");
    const aparelho = bloco.slice(bloco.indexOf("/* O aparelho em vetor"));
    expect(aparelho).not.toMatch(/url\(/);
  });
});
