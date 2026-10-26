import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A dica "Role para expandir" do hero "expansao" (MASTER §9.8): parada, ela
 * fica com opacidade 0, o único valor do hero que difere do inicial (1). Com
 * a transição de opacidade na regra de sempre, o carregamento a fazia piscar
 * e sumir em 450 ms (o check:browser, sem JavaScript, mediu 0,66 logo no
 * load, também na main). A transição só existe com o hero armado, que é
 * quando a dica entra e sai.
 */
describe("globals.css — a transição da dica do hero expansao", () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");
  const regras = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, seletor, corpo]) => ({
    seletor: seletor.trim().replace(/\s+/g, " "),
    corpo,
  }));
  const comTransicaoDeOpacidade = regras.filter(
    (r) => r.seletor.includes(".hero-expansao__dica") && /transition:[^;]*opacity/.test(r.corpo),
  );

  it("existe uma transição de opacidade na dica", () => {
    expect(comTransicaoDeOpacidade.length).toBeGreaterThan(0);
  });

  it("só com o hero armado (data-pin ou data-expanded), nunca no estado do servidor", () => {
    for (const r of comTransicaoDeOpacidade) {
      expect(r.seletor, r.seletor).toMatch(/\[data-pin="true"\]|\[data-expanded="true"\]|\[data-input=/);
    }
  });
});
