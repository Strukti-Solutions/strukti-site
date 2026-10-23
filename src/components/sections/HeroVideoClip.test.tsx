import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MidiaCobertaContext } from "@/components/ui/midia-coberta";
import { HeroVideoClip, HeroVideoProvider, HeroVideoToggle, type HeroVideoClipSource } from "./HeroVideoMedia";

/**
 * O `HeroVideoClip` por enquadramento (hero "notebook", fase 2 da arte): com
 * `clipRetrato`, o pôster escolhe o recorte pelo `<picture>` (só um baixa) e
 * o vídeo ganha o `src` num efeito, pelo `matchMedia("(orientation:
 * portrait)")`, nunca na 1ª renderização; sem vídeo para o enquadramento, não
 * toca. E a sala coberta pela tela (`MidiaCobertaContext`) pausa o vídeo, que
 * volta a tocar ao descobrir, se a pessoa não o pausou. Sem `clipRetrato`
 * (o hero "expansao"), nada muda: os testes dele em HeroExpansao.test.tsx.
 */

/** Media query falsa que o teste liga e desliga, com o evento "change". */
function consultaFalsa(media: string) {
  const listeners = new Set<() => void>();
  const query = {
    matches: false,
    media,
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  };
  return {
    query,
    set(matches: boolean) {
      query.matches = matches;
      listeners.forEach((listener) => listener());
    },
    reset() {
      query.matches = false;
      listeners.clear();
    },
  };
}

const orientation = consultaFalsa("(orientation: portrait)");
const reducedMotion = consultaFalsa("(prefers-reduced-motion: reduce)");

/** IntersectionObserver que o teste dispara à mão (o stub do setup nunca dispara). */
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

const DEITADO: HeroVideoClipSource = {
  webm: "/t/deitado.webm",
  mp4: "/t/deitado.mp4",
  posterAvif: "/t/deitado.avif",
  posterJpg: "/t/deitado.jpg",
  width: 1280,
  height: 720,
};
const RETRATO: HeroVideoClipSource = {
  webm: "/t/retrato.webm",
  mp4: "/t/retrato.mp4",
  posterAvif: "/t/retrato.avif",
  posterJpg: "/t/retrato.jpg",
  width: 720,
  height: 1280,
};
const SO_POSTER: HeroVideoClipSource = {
  posterAvif: "/t/so-poster.avif",
  posterJpg: "/t/so-poster.jpg",
  width: 720,
  height: 1280,
};

let play: ReturnType<typeof vi.fn>;
let pause: ReturnType<typeof vi.fn>;
let load: ReturnType<typeof vi.fn>;
/** O que `canPlayType("video/webm…")` responde (o jsdom responde ""). */
let webm = "";

beforeEach(() => {
  orientation.reset();
  reducedMotion.reset();
  webm = "";
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => (media.includes("orientation: portrait") ? orientation.query : reducedMotion.query)),
  );
  SpyIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", SpyIntersectionObserver);
  // jsdom não toca mídia: play/pause/load viram espiões que mexem no
  // `paused` e disparam os eventos, como um navegador faria (o load de um
  // vídeo que tocava o deixa pausado, sem evento "pause").
  play = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: false });
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  });
  pause = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: true });
    this.dispatchEvent(new Event("pause"));
  });
  load = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: true });
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as never);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(load as never);
  vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockImplementation((type: string) =>
    type.startsWith("video/webm") ? (webm as CanPlayTypeResult) : "maybe",
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function Clip({ coberta = false, retrato = RETRATO }: { coberta?: boolean; retrato?: HeroVideoClipSource }) {
  return (
    <HeroVideoProvider>
      <MidiaCobertaContext.Provider value={coberta}>
        <HeroVideoClip clip={DEITADO} clipRetrato={retrato} posterClassName="poster" videoClassName="video" posterPriority />
      </MidiaCobertaContext.Provider>
      <HeroVideoToggle labels={{ videoPause: "Pausar", videoPlay: "Tocar" }} />
    </HeroVideoProvider>
  );
}

function video(container: HTMLElement) {
  const el = container.querySelector("video");
  if (!el) throw new Error("sem <video>");
  return el;
}

/** O vídeo de fato com o src (o jsdom resolve o `.src`; o atributo é o caminho). */
const srcDe = (el: HTMLVideoElement) => el.getAttribute("src");

describe("HeroVideoClip por enquadramento: o pôster", () => {
  it("é um <picture>: o retrato só como <source media=(orientation: portrait)>, o deitado no <img>; nada mais pede imagem", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(<Clip />);

    const imgs = host.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    const img = imgs[0]!;
    expect(img.getAttribute("src")).toBe(DEITADO.posterJpg);
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.parentElement?.tagName).toBe("PICTURE");
    const sources = [...host.querySelectorAll("picture > source")].map((s) => ({
      media: s.getAttribute("media"),
      type: s.getAttribute("type"),
      srcset: s.getAttribute("srcset"),
    }));
    expect(sources).toEqual([
      { media: "(orientation: portrait)", type: "image/avif", srcset: RETRATO.posterAvif },
      { media: "(orientation: portrait)", type: "image/jpeg", srcset: RETRATO.posterJpg },
      { media: null, type: "image/avif", srcset: DEITADO.posterAvif },
    ]);
    // Fora dos <source media> do retrato, nada aponta para os pôsteres do
    // retrato, e o deitado só no <img> e no <source> AVIF (o navegador escolhe um só).
    const urls = [...host.querySelectorAll("[src], [srcset], [poster], link")]
      .filter((el) => !el.matches("source[media]"))
      .map((el) => el.getAttribute("src") ?? el.getAttribute("srcset") ?? el.getAttribute("poster") ?? el.getAttribute("href"));
    expect(urls.filter((url) => url?.startsWith("/t/retrato"))).toEqual([]);
    expect(urls.filter((url) => url?.startsWith("/t/deitado"))).toEqual([DEITADO.posterAvif, DEITADO.posterJpg]);
  });
});

describe("HeroVideoClip por enquadramento: o vídeo", () => {
  it("no HTML do servidor (a 1ª renderização), o vídeo não tem src nem <source>", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(<Clip />);
    const el = host.querySelector("video")!;

    expect(el.hasAttribute("src")).toBe(false);
    expect(el.querySelectorAll("source")).toHaveLength(0);
    expect(el.getAttribute("preload")).toBe("none");
    expect(el.hasAttribute("autoplay")).toBe(false);
  });

  it("com o matchMedia falso (deitado), pega o clipe deitado; WebM se o navegador toca, senão MP4", () => {
    const { container, unmount } = render(<Clip />);
    expect(srcDe(video(container))).toBe(DEITADO.mp4);
    unmount();

    webm = "probably";
    const outro = render(<Clip />);
    expect(srcDe(video(outro.container))).toBe(DEITADO.webm);
  });

  it("ao girar para em pé e de volta, troca o clipe e mantém tocando", () => {
    const { container } = render(<Clip />);
    const el = video(container);
    act(() => SpyIntersectionObserver.fire(el, true));
    expect(play).toHaveBeenCalledTimes(1);
    expect(el.paused).toBe(false);

    act(() => orientation.set(true));
    expect(srcDe(el)).toBe(RETRATO.mp4);
    expect(play).toHaveBeenCalledTimes(2);
    expect(el.paused).toBe(false);
    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();

    act(() => orientation.set(false));
    expect(srcDe(el)).toBe(DEITADO.mp4);
    expect(play).toHaveBeenCalledTimes(3);
  });

  it("pausado pela pessoa, girar troca o clipe e continua pausado, com o pôster à vista", () => {
    const { container } = render(<Clip />);
    const el = video(container);
    act(() => SpyIntersectionObserver.fire(el, true));
    expect(el.dataset.started).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(el.paused).toBe(true);
    const tocadas = play.mock.calls.length;

    act(() => orientation.set(true));
    expect(srcDe(el)).toBe(RETRATO.mp4);
    expect(play).toHaveBeenCalledTimes(tocadas);
    expect(el.paused).toBe(true);
    // O quadro parado do clipe velho não fica à vista: o pôster (do novo enquadramento) volta.
    expect(el.dataset.started).toBe("false");
    expect(screen.getByRole("button", { name: "Tocar" })).toBeTruthy();
  });

  it("sem vídeo para o enquadramento, não há vídeo tocando; voltar ao que tem vídeo toca de novo", () => {
    const { container } = render(<Clip retrato={SO_POSTER} />);
    const el = video(container);
    act(() => SpyIntersectionObserver.fire(el, true));
    expect(play).toHaveBeenCalledTimes(1);

    act(() => orientation.set(true));
    expect(el.hasAttribute("src")).toBe(false);
    expect(el.paused).toBe(true);
    expect(load).toHaveBeenCalled();
    expect(play).toHaveBeenCalledTimes(1);
    // O controle não faz o vídeo vazio tocar.
    fireEvent.click(screen.getByRole("button", { name: "Tocar" }));
    expect(play).toHaveBeenCalledTimes(1);

    act(() => orientation.set(false));
    expect(srcDe(el)).toBe(DEITADO.mp4);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("montado já em pé, sem vídeo em pé, nunca chama play()", () => {
    orientation.query.matches = true;
    const { container } = render(<Clip retrato={SO_POSTER} />);
    const el = video(container);
    act(() => SpyIntersectionObserver.fire(el, true));

    expect(el.hasAttribute("src")).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });
});

describe("HeroVideoClip: a sala coberta pela tela (M2 da revisão da fase 1)", () => {
  it("coberta, o vídeo pausa; descoberta, volta a tocar", () => {
    const { container, rerender } = render(<Clip />);
    const el = video(container);
    act(() => SpyIntersectionObserver.fire(el, true));
    expect(el.paused).toBe(false);

    rerender(<Clip coberta />);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(el.paused).toBe(true);

    rerender(<Clip />);
    expect(play).toHaveBeenCalledTimes(2);
    expect(el.paused).toBe(false);
  });

  it("pausado pela pessoa, descobrir não volta a tocar", () => {
    const { container, rerender } = render(<Clip />);
    const el = video(container);
    act(() => SpyIntersectionObserver.fire(el, true));
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    const tocadas = play.mock.calls.length;

    rerender(<Clip coberta />);
    rerender(<Clip />);
    expect(play).toHaveBeenCalledTimes(tocadas);
    expect(el.paused).toBe(true);
  });

  it("montado coberto, não toca até descobrir", () => {
    const { container, rerender } = render(<Clip coberta />);
    const el = video(container);
    act(() => SpyIntersectionObserver.fire(el, true));
    expect(play).not.toHaveBeenCalled();

    rerender(<Clip />);
    expect(play).toHaveBeenCalledTimes(1);
  });
});
