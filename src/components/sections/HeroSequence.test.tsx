import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { HeroSequence } from "./HeroSequence";

/**
 * Hero "estudio" (docs/superpowers/specs/2026-10-15-hero-triangulo-3d-design.md):
 * o texto aprovado ao lado dos dois objetos 3D que flutuam (aplicativos e
 * hardware). A flutuação só liga depois de montar e sem reduced motion
 * (ADR-004, mesmo padrão de `useCanAnimate`/`Reveal`).
 */

// O motion guarda a preferência de movimento num cache do módulo e só a
// atualiza pelo evento "change" da media query (ver page.hydration.test.tsx).
const reducedMotion = (() => {
  const listeners = new Set<() => void>();
  const query = {
    matches: false,
    media: "(prefers-reduced-motion)",
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  };
  return {
    query,
    set(reduce: boolean) {
      query.matches = reduce;
      listeners.forEach((listener) => listener());
    },
  };
})();

beforeAll(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => reducedMotion.query));
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  reducedMotion.set(false);
});

describe("<HeroSequence />", () => {
  const { heroEstudio, whatsappMessages } = landingContent;
  const { aplicativos, hardware } = heroEstudio.objetos;

  it("mostra o texto aprovado e os botões", async () => {
    const { container } = render(<HeroSequence />);
    await act(async () => {});

    expect(screen.getByRole("heading", { level: 1, name: heroEstudio.headline })).toBeTruthy();
    expect(screen.getByText(heroEstudio.eyebrow)).toBeTruthy();
    expect(screen.getByText(heroEstudio.body)).toBeTruthy();

    const primary = screen.getByRole("link", { name: heroEstudio.primaryCta });
    expect(primary.getAttribute("href")).toBe("#produtos");

    const whatsapp = screen.getByRole("link", { name: new RegExp(heroEstudio.whatsappCta) });
    expect(whatsapp.getAttribute("href")).toBe(siteConfig.whatsapp.linkWithMessage(whatsappMessages.general));

    expect((await axe.run(container)).violations).toEqual([]);
  });

  it("mostra os dois objetos (aplicativos e hardware), cada um linkando para a seção certa", async () => {
    render(<HeroSequence />);
    await act(async () => {});

    const linkAplicativos = screen.getByRole("link", { name: new RegExp(aplicativos.label) });
    expect(linkAplicativos.getAttribute("href")).toBe(aplicativos.href);
    expect(within(linkAplicativos).getByText(aplicativos.desc)).toBeTruthy();

    const linkHardware = screen.getByRole("link", { name: new RegExp(hardware.label) });
    expect(linkHardware.getAttribute("href")).toBe(hardware.href);
    expect(within(linkHardware).getByText(hardware.desc)).toBeTruthy();
  });

  it("sem reduced motion, os objetos flutuam depois de montar", async () => {
    const { container } = render(<HeroSequence />);
    await act(async () => {});
    expect(container.querySelector(".hero-objetos")?.getAttribute("data-animate")).toBe("true");
  });

  it("com reduced motion, os objetos não flutuam", async () => {
    reducedMotion.set(true);
    const { container } = render(<HeroSequence />);
    await act(async () => {});
    expect(container.querySelector(".hero-objetos")?.getAttribute("data-animate")).toBe("false");
  });
});
