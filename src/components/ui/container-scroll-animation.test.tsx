import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { render, screen } from "@testing-library/react";
import { ContainerScroll } from "./container-scroll-animation";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const scrollCard = (
  <ContainerScroll titleComponent={<h2>Veja o Rota de Vendas</h2>}>
    <p>Conteúdo do cartão</p>
  </ContainerScroll>
);

describe("<ContainerScroll /> — prefers-reduced-motion", () => {
  it("a redução de movimento é só CSS (motion-reduce:), não muda a árvore React", () => {
    // Sem isso, useReducedMotion() (null no servidor, resolvido só no 1º
    // render do cliente) causava hidratação divergente — ver docs/DECISOES.md.
    render(scrollCard);

    const transformed = document.querySelector('[style*="rotateX"]');
    expect(transformed).not.toBeNull();
    expect(transformed?.className).toContain("motion-reduce:transform-none!");

    const root = document.querySelector('[class*="motion-reduce:h-auto"]');
    expect(root).not.toBeNull();
  });

  it("hidrata sem erro mesmo quando o cliente prefere menos movimento (regressão)", async () => {
    // SSR "de verdade": sem matchMedia no ambiente (como no servidor Next).
    const html = renderToString(scrollCard);

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    // O cliente, ao hidratar, prefere menos movimento.
    stubMatchMedia(true);

    const recoverableErrors: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, scrollCard, {
        onRecoverableError: (error) => {
          recoverableErrors.push(error);
        },
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(screen.getByText("Conteúdo do cartão")).toBeTruthy();

    document.body.removeChild(container);
  });
});
