/** O lado maior da imagem, em px: acima disso, a textura pesa mais do que a nitidez ganha. */
export const LADO_MAXIMO = 4096;

/**
 * Desenha um SVG inline numa imagem PNG (data URL) do tamanho de layout dele
 * vezes o devicePixelRatio, com o lado maior em até `LADO_MAXIMO`. O tamanho
 * de layout ignora os transforms dos pais: no aparelho, é o tamanho no fim
 * da aproximação (escala 1), o maior que ele chega a ter, então a imagem só
 * é reduzida no caminho. O SVG precisa se bastar (as pinturas em atributos e
 * nos próprios `<defs>`): o CSS da página não vale dentro da imagem.
 *
 * Fora da thread principal sempre que o navegador deixa (revisão final da
 * fase 3: a 2x, o `drawImage` e o `toDataURL` síncronos de uma imagem de
 * 5,4 MP davam uma tarefa longa de 100 a 400 ms logo depois da hidratação):
 * o SVG vira bitmap pelo `createImageBitmap` e o PNG sai do `toBlob`, os dois
 * assíncronos. Sem eles (Safari que recusa SVG no `createImageBitmap`), cai no
 * `drawImage`, e o PNG continua assíncrono.
 *
 * Devolve `null` se o SVG não está na tela (o aparelho do outro
 * enquadramento, em `display: none`, ainda tem tamanho calculado), se um lado
 * da imagem daria 0 px ou se o navegador não desenha.
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
  if (w < 1 || h < 1) return null;

  const copia = svg.cloneNode(true) as SVGSVGElement;
  copia.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copia.setAttribute("width", String(w));
  copia.setAttribute("height", String(h));
  for (const atributo of ["class", "style", "data-rasterizado", "focusable"]) copia.removeAttribute(atributo);

  const tela = document.createElement("canvas");
  try {
    const imagem = new Image();
    imagem.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copia))}`;
    await carregar(imagem);
    tela.width = w;
    tela.height = h;
    const bitmap = await bitmapDe(imagem);
    const contexto = bitmap ? tela.getContext("bitmaprenderer") : null;
    if (bitmap && contexto) {
      contexto.transferFromImageBitmap(bitmap);
    } else {
      bitmap?.close();
      const ctx = tela.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(imagem, 0, 0, w, h);
    }
    const png = await new Promise<Blob | null>((resolve) => tela.toBlob(resolve, "image/png"));
    return png ? await dataUrlDe(png) : null;
  } catch {
    return null;
  } finally {
    // Solta a memória do canvas na hora (no iOS, o teto de memória de canvas
    // estoura depois de alguns giros se ela esperar o coletor).
    tela.width = 0;
    tela.height = 0;
  }
}

/** Espera a imagem: `decode()` e, se ele recusar (WebKit com SVG), o `load`. */
async function carregar(imagem: HTMLImageElement): Promise<void> {
  try {
    await imagem.decode();
  } catch {
    // Já terminou: carregou (decode recusou só o SVG) ou deu erro, que não dispara de novo.
    if (imagem.complete) {
      if (imagem.naturalWidth > 0) return;
      throw new Error("imagem do SVG não carregou");
    }
    await new Promise<void>((resolve, reject) => {
      imagem.addEventListener("load", () => resolve(), { once: true });
      imagem.addEventListener("error", () => reject(new Error("imagem do SVG não carregou")), { once: true });
    });
  }
}

/** O bitmap do SVG fora da thread principal, ou `null` onde o navegador recusa. */
async function bitmapDe(imagem: HTMLImageElement): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    return await createImageBitmap(imagem);
  } catch {
    return null;
  }
}

function dataUrlDe(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(typeof leitor.result === "string" ? leitor.result : null);
    leitor.onerror = () => resolve(null);
    leitor.readAsDataURL(blob);
  });
}
