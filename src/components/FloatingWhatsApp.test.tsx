import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

/**
 * Stub de IntersectionObserver que guarda os alvos observados e deixa o
 * teste disparar o callback manualmente — o stub padrão do projeto
 * (src/test/setup.ts) nunca dispara sozinho. As caixas (getBoundingClientRect)
 * no jsdom são sempre zeradas, então o cruzamento com controle focável
 * (ver FloatingWhatsApp.tsx) nunca acontece aqui: só o check:browser cobre
 * essa regra, em navegador de verdade (achado da Crivo, revisão DS1).
 */
class SpyIntersectionObserver {
  static instances: SpyIntersectionObserver[] = [];
  elements = new Set<Element>();
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    SpyIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.elements.add(el);
  }

  unobserve(el: Element) {
    this.elements.delete(el);
  }

  disconnect() {
    this.elements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  fire(target: Element, isIntersecting: boolean) {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function fireIntersecting(target: Element, isIntersecting: boolean) {
  for (const instance of SpyIntersectionObserver.instances) {
    if (instance.elements.has(target)) instance.fire(target, isIntersecting);
  }
}

function addHidesFabMarker() {
  const marker = document.createElement("section");
  marker.setAttribute("data-hides-fab", "");
  document.body.appendChild(marker);
  return marker;
}

describe("FloatingWhatsApp", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    SpyIntersectionObserver.instances = [];
    vi.unstubAllGlobals();
  });

  it("no carregamento, com um alvo [data-hides-fab] na página, vem oculto e inert", () => {
    vi.stubGlobal("IntersectionObserver", SpyIntersectionObserver);
    addHidesFabMarker();

    const { container } = render(<FloatingWhatsApp />);
    const fab = container.querySelector("a.fab-whatsapp")!;

    // Antes de o observer disparar (nunca dispara sozinho aqui), o estado
    // inicial vale — igual no servidor e no 1º render do cliente.
    expect(fab.getAttribute("data-visible")).toBe("false");
    expect(fab.hasAttribute("inert")).toBe(true);
  });

  it("fica visível quando o alvo [data-hides-fab] sai da tela", async () => {
    vi.stubGlobal("IntersectionObserver", SpyIntersectionObserver);
    const marker = addHidesFabMarker();

    const { container } = render(<FloatingWhatsApp />);
    const fab = container.querySelector("a.fab-whatsapp")!;

    fireIntersecting(marker, false);

    await waitFor(() => expect(fab.getAttribute("data-visible")).toBe("true"));
    expect(fab.hasAttribute("inert")).toBe(false);
  });

  it("volta a ocultar quando o alvo [data-hides-fab] reaparece na tela", async () => {
    vi.stubGlobal("IntersectionObserver", SpyIntersectionObserver);
    const marker = addHidesFabMarker();

    const { container } = render(<FloatingWhatsApp />);
    const fab = container.querySelector("a.fab-whatsapp")!;

    fireIntersecting(marker, false);
    await waitFor(() => expect(fab.getAttribute("data-visible")).toBe("true"));

    fireIntersecting(marker, true);

    await waitFor(() => expect(fab.getAttribute("data-visible")).toBe("false"));
    expect(fab.hasAttribute("inert")).toBe(true);
  });

  it("sem nenhum alvo [data-hides-fab] na página, fica visível", async () => {
    vi.stubGlobal("IntersectionObserver", SpyIntersectionObserver);

    const { container } = render(<FloatingWhatsApp />);
    const fab = container.querySelector("a.fab-whatsapp")!;

    await waitFor(() => expect(fab.getAttribute("data-visible")).toBe("true"));
    expect(fab.hasAttribute("inert")).toBe(false);
  });
});
