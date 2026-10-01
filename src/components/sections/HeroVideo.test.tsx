import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { HeroVideo } from "./HeroVideo";

/**
 * Regras do vídeo de fundo (MASTER §9.6): sem `autoplay` no HTML; só toca
 * por JavaScript, sem reduced motion e com o hero na tela; com reduced
 * motion fica o pôster; o controle (WCAG 2.2.2) pausa e toca.
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

/** IntersectionObserver que o teste dispara à mão (o stub padrão nunca dispara). */
class SpyIntersectionObserver {
  static instances: SpyIntersectionObserver[] = [];
  elements = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
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
  static fire(target: Element, isIntersecting: boolean) {
    for (const instance of SpyIntersectionObserver.instances) {
      if (instance.elements.has(target)) {
        instance.callback([{ target, isIntersecting } as IntersectionObserverEntry], instance as unknown as IntersectionObserver);
      }
    }
  }
}

let play: ReturnType<typeof vi.fn>;
let pause: ReturnType<typeof vi.fn>;

beforeAll(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => reducedMotion.query));
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  SpyIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", SpyIntersectionObserver);
  // jsdom não implementa reprodução de mídia: play/pause viram espiões que
  // atualizam `paused` e disparam os eventos, como um navegador faria.
  play = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: false });
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  });
  pause = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: true });
    this.dispatchEvent(new Event("pause"));
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as never);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  reducedMotion.set(false);
});

function getVideo(container: HTMLElement) {
  const video = container.querySelector("video");
  if (!video) throw new Error("sem <video>");
  return video;
}

describe("HeroVideo", () => {
  it("mantém o H1 aprovado e a palavra gigante fora da leitura", () => {
    const { container } = render(<HeroVideo />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(landingContent.hero.headline);
    expect(container.querySelector(".hero-wordmark")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("section#inicio")?.hasAttribute("data-hides-fab")).toBe(true);
  });

  it("o vídeo é decorativo, sem autoplay, sem pré-carga e sem som; o pôster vem antes", () => {
    const { container } = render(<HeroVideo />);
    const video = getVideo(container);

    expect(video.hasAttribute("autoplay")).toBe(false);
    expect(video.getAttribute("preload")).toBe("none");
    expect(video.muted).toBe(true);
    expect(video.getAttribute("tabindex")).toBe("-1");
    expect(video.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("picture img")?.getAttribute("alt")).toBe("");
    for (const source of video.querySelectorAll("source")) {
      expect(source.getAttribute("src")).toMatch(/^\/video\/hero\//);
    }
  });

  it("sem reduced motion, toca quando o hero entra na tela e pausa quando sai", () => {
    const { container } = render(<HeroVideo />);
    const video = getVideo(container);

    expect(play).not.toHaveBeenCalled();
    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: landingContent.hero.videoPause })).toBeTruthy();

    act(() => SpyIntersectionObserver.fire(video, false));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("não toca sozinho por cima de um vídeo do portfólio, e volta quando ele para (MASTER §8.8, videoCoordination.ts)", () => {
    // Fica fora do render de <HeroVideo />: representa o vídeo com `controls`
    // do Rota de Vendas ou do Fleet Analytics BI, noutra seção da página.
    const portfolioVideo = document.createElement("video");
    portfolioVideo.controls = true;
    Object.defineProperty(portfolioVideo, "paused", { configurable: true, value: false });
    document.body.appendChild(portfolioVideo);

    const { container } = render(<HeroVideo />);
    const video = getVideo(container);

    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).not.toHaveBeenCalled();

    // O vídeo do portfólio termina (ou a pessoa pausa): o hero reavalia pelo
    // useSyncExternalStore e volta a tocar sozinho.
    Object.defineProperty(portfolioVideo, "paused", { configurable: true, value: true });
    act(() => fireEvent.pause(portfolioVideo));
    expect(play).toHaveBeenCalledTimes(1);

    document.body.removeChild(portfolioVideo);
  });

  it("com reduced motion, fica o pôster; o controle toca só se a pessoa pedir", () => {
    reducedMotion.set(true);
    const { container } = render(<HeroVideo />);
    const video = getVideo(container);

    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: landingContent.hero.videoPlay }));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("o controle pausa o vídeo e ele não volta sozinho", () => {
    const { container } = render(<HeroVideo />);
    const video = getVideo(container);
    act(() => SpyIntersectionObserver.fire(video, true));

    fireEvent.click(screen.getByRole("button", { name: landingContent.hero.videoPause }));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: landingContent.hero.videoPlay })).toBeTruthy();

    act(() => SpyIntersectionObserver.fire(video, false));
    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).toHaveBeenCalledTimes(1);
  });
});
