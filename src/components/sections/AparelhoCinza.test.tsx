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

  it("não usa 100vw (com a barra de rolagem clássica, passa da janela útil)", () => {
    expect(bloco).not.toContain("100vw");
  });
});
