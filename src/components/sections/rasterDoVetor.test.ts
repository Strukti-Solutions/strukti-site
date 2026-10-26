// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
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

  it("não desenha uma imagem de 0 px (um lado abaixo de meio pixel, que o arredondamento zera)", async () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.width = "200px";
    svg.style.height = "0.3px";
    document.body.append(svg);
    // Na tela (o jsdom não faz layout).
    svg.getClientRects = () => [{}] as unknown as DOMRectList;
    // A imagem do SVG carrega (o jsdom não decodifica): o que barra tem de ser o tamanho.
    Object.defineProperty(HTMLImageElement.prototype, "decode", { value: () => Promise.resolve(), configurable: true });
    const decode = { mockRestore: () => delete (HTMLImageElement.prototype as { decode?: unknown }).decode };
    const criar = vi.spyOn(document, "createElement");
    await expect(rasterizarSvg(svg)).resolves.toBeNull();
    expect(criar).not.toHaveBeenCalledWith("canvas");
    criar.mockRestore();
    decode.mockRestore();
    svg.remove();
  });
});
