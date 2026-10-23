import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AparelhoCinza } from "./AparelhoCinza";

describe("<AparelhoCinza />", () => {
  it("no HTML do servidor: o notebook (tampa e base) e o celular, sem texto nem nada focável", () => {
    const html = renderToString(<AparelhoCinza />);
    const host = document.createElement("div");
    host.innerHTML = html;

    const raiz = host.querySelector(".aparelho-cinza");
    expect(raiz).not.toBeNull();
    for (const gancho of ["__notebook", "__tampa", "__base", "__celular", "__corpo", "__suporte"]) {
      expect(raiz?.querySelector(`.aparelho-cinza${gancho}`), gancho).not.toBeNull();
    }
    expect(raiz?.querySelector(".aparelho-cinza__notebook > .aparelho-cinza__tampa")).not.toBeNull();
    expect(raiz?.querySelector(".aparelho-cinza__notebook > .aparelho-cinza__base")).not.toBeNull();
    expect(raiz?.querySelector(".aparelho-cinza__celular > .aparelho-cinza__corpo")).not.toBeNull();
    expect(raiz?.querySelector(".aparelho-cinza__celular > .aparelho-cinza__suporte")).not.toBeNull();

    expect(host.textContent).toBe("");
    expect(host.querySelector("a, button, input, select, textarea, [tabindex], video, audio")).toBeNull();
  });
});

describe('globals.css, bloco Hero "entrada"', () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");
  const start = css.indexOf('/* Hero "entrada" (protótipo)');
  const end = css.indexOf("/* SPIKE: prévia", start);
  const bloco = css.slice(start, end);

  it("existe, logo depois do bloco do hero expansao", () => {
    expect(start).toBeGreaterThan(css.indexOf('/* Hero "expansao" (MASTER §9.8, ADR-010)'));
    expect(end).toBeGreaterThan(start);
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
    const corpo = (seletor: string) => {
      const i = bloco.indexOf(`${seletor} {\n`);
      expect(i, seletor).toBeGreaterThan(-1);
      return bloco.slice(i, bloco.indexOf("}", i)).replace(/\s+/g, " ");
    };
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

  it("não usa 100vw (com a barra de rolagem clássica, passa da janela útil)", () => {
    expect(bloco).not.toContain("100vw");
  });
});
