import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("<ContainerScroll /> — prefers-reduced-motion", () => {
  it("com reduced motion ligado, mostra o conteúdo sem rotate, scale ou translate", () => {
    stubMatchMedia(true);

    render(
      <ContainerScroll titleComponent={<h2>Veja o Rota de Vendas</h2>}>
        <p>Conteúdo do cartão</p>
      </ContainerScroll>,
    );

    expect(screen.getByText("Veja o Rota de Vendas")).toBeTruthy();
    expect(screen.getByText("Conteúdo do cartão")).toBeTruthy();

    const transformed = document.querySelector(
      '[style*="rotateX"], [style*="scale"], [style*="translate"]',
    );
    expect(transformed).toBeNull();
  });
});
