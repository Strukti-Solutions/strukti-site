// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { rasterizarSvg } from "./rasterDoVetor";

describe("rasterizarSvg", () => {
  it("não desenha um SVG que não está na tela (o aparelho do outro enquadramento)", async () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.width = "200px";
    svg.style.height = "100px";
    document.body.append(svg);
    // O jsdom não faz layout: getClientRects vem vazio, como num pai em display: none.
    expect(svg.getClientRects().length).toBe(0);
    await expect(rasterizarSvg(svg)).resolves.toBeNull();
    svg.remove();
  });
});
