import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { render, screen } from "@testing-library/react";
import { ScrollTiltCard } from "./scroll-tilt-card";

function stubReducedMotion(matches: boolean) {
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
  document.body.innerHTML = "";
});

const card = (
  <ScrollTiltCard title={<h2>Veja o Rota de Vendas</h2>}>
    <p>Conteúdo do cartão</p>
  </ScrollTiltCard>
);

describe("<ScrollTiltCard />", () => {
  it("mostra o título e o conteúdo", () => {
    render(card);

    expect(screen.getByRole("heading", { name: "Veja o Rota de Vendas" })).toBeTruthy();
    expect(screen.getByText("Conteúdo do cartão")).toBeTruthy();
  });

  it("com reduced motion, o conteúdo aparece sem transformação: título e cartão levam motion-reduce:transform-none!", () => {
    render(card);

    const tiltedCard = document.querySelector('[style*="rotateX"]');
    const risingTitle = document.querySelector('[style*="translateY"]');

    expect(tiltedCard?.className).toContain("motion-reduce:transform-none!");
    expect(risingTitle?.className).toContain("motion-reduce:transform-none!");
  });

  it("hidrata sem erro quando o cliente prefere menos movimento (regressão ADR-004)", async () => {
    const html = renderToString(card);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    stubReducedMotion(true);

    const recoverableErrors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, card, {
        onRecoverableError: (error) => {
          recoverableErrors.push(error);
        },
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(screen.getByText("Conteúdo do cartão")).toBeTruthy();

    act(() => root?.unmount());
  });
});
