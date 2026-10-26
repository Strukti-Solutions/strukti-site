import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const rasterizar = vi.fn();
vi.mock("./rasterDoVetor", () => ({ rasterizarSvg: (...a: unknown[]) => rasterizar(...a) }));

const { VetorRasterizado } = await import("./VetorRasterizado");

function midia(consultas: Record<string, boolean>) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: consultas[q] ?? false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
}

function Base() {
  return (
    <VetorRasterizado className="aparelho-vetor__base" viewBox="0 0 10 5" style={{ "--av-w": 10 } as React.CSSProperties}>
      <rect className="aparelho-vetor__tampo" width={10} height={5} fill="#123" />
    </VetorRasterizado>
  );
}

/** Deixa o agendamento (requestIdleCallback ou setTimeout) e as promessas correrem. */
async function esperar() {
  await act(async () => {
    vi.runAllTimers();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("<VetorRasterizado />", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    rasterizar.mockReset();
    rasterizar.mockResolvedValue("data:image/png;base64,AAAA");
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("no servidor é só o SVG, sem imagem", () => {
    const html = renderToString(<Base />);
    expect(html).toMatch(/^<svg[^>]*class="aparelho-vetor__base"/);
    expect(html).toContain('focusable="false"');
    expect(html).not.toMatch(/<img/);
  });

  it("com movimento, troca o SVG por uma imagem com a mesma classe e o mesmo estilo, uma vez", async () => {
    midia({});
    const { container } = render(<Base />);
    await esperar();
    const svg = container.querySelector("svg")!;
    expect(rasterizar).toHaveBeenCalledTimes(1);
    expect(rasterizar.mock.calls[0]?.[0]).toBe(svg);
    const img = container.querySelector("img")!;
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("data:image/png;base64,AAAA");
    expect(img.getAttribute("alt")).toBe("");
    expect(img.className).toBe("aparelho-vetor__base");
    expect(img.style.getPropertyValue("--av-w")).toBe("10");
    // O SVG só sai da pintura depois que a imagem carregou.
    expect(svg.dataset.rasterizado).toBeUndefined();
    await act(async () => {
      img.dispatchEvent(new Event("load"));
    });
    expect(svg.dataset.rasterizado).toBe("true");
    // Logo depois do SVG, para empilhar no mesmo lugar dele.
    expect(svg.nextElementSibling).toBe(img);
  });

  it("com reduced motion, fica o SVG (nada se move)", async () => {
    midia({ "(prefers-reduced-motion: reduce)": true });
    const { container } = render(<Base />);
    await esperar();
    expect(rasterizar).not.toHaveBeenCalled();
    expect(container.querySelector("img")).toBeNull();
  });

  it("com cores forçadas, fica o SVG (o CSS ajusta os traços dele)", async () => {
    midia({ "(forced-colors: active)": true });
    const { container } = render(<Base />);
    await esperar();
    expect(rasterizar).not.toHaveBeenCalled();
    expect(container.querySelector("img")).toBeNull();
  });

  it("se a rasterização falha (ou o SVG não tem tamanho), fica o SVG", async () => {
    midia({});
    rasterizar.mockResolvedValue(null);
    const { container } = render(<Base />);
    await esperar();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")!.dataset.rasterizado).toBeUndefined();
  });

  it("refaz a imagem quando o tamanho do SVG muda", async () => {
    midia({});
    let aoMudar: () => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          aoMudar = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<Base />);
    await esperar();
    expect(rasterizar).toHaveBeenCalledTimes(1);
    // Um aviso sem mudança de tamanho não redesenha.
    act(() => aoMudar());
    await esperar();
    expect(rasterizar).toHaveBeenCalledTimes(1);
    rasterizar.mockResolvedValue("data:image/png;base64,BBBB");
    container.querySelector("svg")!.style.width = "20px";
    act(() => aoMudar());
    await esperar();
    expect(rasterizar).toHaveBeenCalledTimes(2);
    expect(document.querySelector("img")!.getAttribute("src")).toBe("data:image/png;base64,BBBB");
  });

  it("uma imagem velha que termina depois da nova não a substitui", async () => {
    midia({});
    let aoMudar: () => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          aoMudar = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    let terminarVelha: (src: string) => void = () => {};
    rasterizar.mockReturnValueOnce(new Promise<string>((r) => (terminarVelha = r)));
    rasterizar.mockResolvedValueOnce("data:image/png;base64,NOVA");
    const { container } = render(<Base />);
    await esperar();
    container.querySelector("svg")!.style.width = "20px";
    act(() => aoMudar());
    await esperar();
    expect(rasterizar).toHaveBeenCalledTimes(2);
    expect(container.querySelector("img")!.getAttribute("src")).toBe("data:image/png;base64,NOVA");
    await act(async () => {
      terminarVelha("data:image/png;base64,VELHA");
      await Promise.resolve();
    });
    expect(container.querySelector("img")!.getAttribute("src")).toBe("data:image/png;base64,NOVA");
  });

  it("desmontada no meio do desenho, não mexe em nada", async () => {
    midia({});
    let terminar: (src: string) => void = () => {};
    rasterizar.mockReturnValueOnce(new Promise<string>((r) => (terminar = r)));
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<Base />);
    await esperar();
    unmount();
    await act(async () => {
      terminar("data:image/png;base64,TARDE");
      await Promise.resolve();
    });
    expect(erro).not.toHaveBeenCalled();
    erro.mockRestore();
  });

  it("se a imagem quebra, o SVG volta à vista", async () => {
    midia({});
    const { container } = render(<Base />);
    await esperar();
    const img = container.querySelector("img")!;
    await act(async () => {
      img.dispatchEvent(new Event("load"));
    });
    expect(container.querySelector("svg")!.dataset.rasterizado).toBe("true");
    await act(async () => {
      img.dispatchEvent(new Event("error"));
    });
    expect(container.querySelector("svg")!.dataset.rasterizado).toBeUndefined();
    expect(container.querySelector("img")).toBeNull();
  });

  it("refaz a imagem quando só a densidade da tela muda (outro monitor)", async () => {
    const avisos = new Map<string, () => void>();
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: false,
      media: q,
      addEventListener: (_: string, f: () => void) => avisos.set(q, f),
      removeEventListener: () => avisos.delete(q),
      addListener() {},
      removeListener() {},
    }));
    render(<Base />);
    await esperar();
    expect(rasterizar).toHaveBeenCalledTimes(1);
    const resolucao = [...avisos.keys()].find((q) => q.includes("resolution"));
    expect(resolucao).toBeDefined();
    act(() => avisos.get(resolucao!)!());
    await esperar();
    expect(rasterizar).toHaveBeenCalledTimes(2);
  });
});

describe('globals.css, bloco Hero "entrada" — o aparelho em imagem', () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");
  const corpo = (cabeca: string) => {
    const i = css.indexOf(`${cabeca} {`);
    expect(i, cabeca).toBeGreaterThan(-1);
    return css.slice(i, css.indexOf("}", i));
  };

  it("com a imagem carregada, o SVG sai da pintura", () => {
    expect(corpo('.hero-expansao--entrada svg[data-rasterizado="true"]')).toMatch(/visibility:\s*hidden/);
  });

  it("a imagem não leva o max-width do reset (mais larga que a tela, sairia espremida)", () => {
    expect(corpo(".hero-expansao--entrada img:is(.aparelho-vetor__base, .aparelho-vetor__suporte)")).toMatch(/max-width:\s*none/);
  });

  it("com cores forçadas ligadas depois do desenho, volta o SVG (o CSS da §8 só vale nele)", () => {
    const bloco = css
      .split("@media (forced-colors: active)")
      .slice(1)
      .map((resto) => resto.slice(0, resto.indexOf("\n}\n")))
      .join("\n");
    expect(bloco).not.toBe("");
    expect(bloco).toMatch(/svg\[data-rasterizado="true"\]\s*\{\s*visibility:\s*visible/);
    expect(bloco).toMatch(/img:is\(\.aparelho-vetor__base, \.aparelho-vetor__suporte\)\s*\{\s*display:\s*none/);
  });
});
