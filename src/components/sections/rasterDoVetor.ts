/** O lado maior da imagem, em px: acima disso, a textura pesa mais do que a nitidez ganha. */
export const LADO_MAXIMO = 4096;

/**
 * Desenha um SVG inline numa imagem PNG (data URL) do tamanho de layout dele
 * vezes o devicePixelRatio, com o lado maior em até `LADO_MAXIMO`. O tamanho
 * de layout ignora os transforms dos pais: no aparelho, é o tamanho no fim
 * da aproximação (escala 1), o maior que ele chega a ter, então a imagem só
 * é reduzida no caminho. O SVG precisa se bastar (as pinturas em atributos e
 * nos próprios `<defs>`): o CSS da página não vale dentro da imagem.
 * Devolve `null` se o SVG não está na tela (o aparelho do outro
 * enquadramento, em `display: none`, ainda tem tamanho calculado), se não tem
 * tamanho ou se o navegador não desenha.
 */
export async function rasterizarSvg(svg: SVGSVGElement): Promise<string | null> {
  if (svg.getClientRects().length === 0) return null;
  const estilo = getComputedStyle(svg);
  const largura = parseFloat(estilo.width);
  const altura = parseFloat(estilo.height);
  if (!(largura > 0 && altura > 0)) return null;
  const escala = Math.min(window.devicePixelRatio || 1, LADO_MAXIMO / Math.max(largura, altura));
  const w = Math.round(largura * escala);
  const h = Math.round(altura * escala);

  const copia = svg.cloneNode(true) as SVGSVGElement;
  copia.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copia.setAttribute("width", String(w));
  copia.setAttribute("height", String(h));
  for (const atributo of ["class", "style", "data-rasterizado", "focusable"]) copia.removeAttribute(atributo);

  try {
    const imagem = new Image();
    imagem.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copia))}`;
    await imagem.decode();
    const tela = document.createElement("canvas");
    tela.width = w;
    tela.height = h;
    const ctx = tela.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(imagem, 0, 0, w, h);
    return tela.toDataURL("image/png");
  } catch {
    return null;
  }
}
