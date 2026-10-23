import { act, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { HeroExpansao } from "./HeroExpansao";

/**
 * Hero "expansao" (MASTER §9.8, ADR-010): o contrato do HTML, o estado
 * parado (servidor, sem JavaScript, reduced motion) e a expansão com roda,
 * toque e teclado, com as garantias de âncora, rolagem, foco, zoom e menu.
 */

// prefers-reduced-motion por uma media query falsa que o teste liga e
// desliga (com o evento "change", como o navegador): o portão de montagem
// de verdade (useCanAnimate) lê e acompanha esta preferência. As outras
// media queries (as do motion, por exemplo) não casam.
const reducedMotion = (() => {
  const listeners = new Set<() => void>();
  const query = {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  };
  const other = (media: string) => ({ ...query, media, matches: false, addEventListener() {}, removeEventListener() {} });
  return {
    query,
    matchMedia: (media: string) => (media.includes("prefers-reduced-motion") ? query : other(media)),
    /** Troca a preferência e avisa quem ouve ("change"). */
    set(reduce: boolean) {
      query.matches = reduce;
      listeners.forEach((listener) => listener());
    },
    reset() {
      query.matches = false;
      listeners.clear();
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
  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
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

const { heroExpansao, whatsappMessages } = landingContent;
let scrollTo: ReturnType<typeof vi.fn>;
let play: ReturnType<typeof vi.fn>;

// Os quadros (requestAnimationFrame) ficam numa fila, com um relógio falso:
// `frame()` roda os que estão na fila com o tempo `ms` adiante (o que for
// pedido durante o quadro fica para o próximo, como no navegador), e
// `settle()` roda quadros até a fila esvaziar (a animação da roda assentou).
let frameQueue = new Map<number, FrameRequestCallback>();
let lastFrameId = 0;
let frameClock = 0;

function frame(ms = 16) {
  frameClock += ms;
  const due = [...frameQueue.values()];
  frameQueue = new Map();
  act(() => {
    for (const callback of due) callback(frameClock);
  });
}

function settle(limit = 200) {
  for (let i = 0; i < limit && frameQueue.size > 0; i++) frame();
  if (frameQueue.size > 0) throw new Error(`a animação não assentou em ${limit} quadros`);
}

function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
}

beforeEach(() => {
  reducedMotion.reset();
  vi.stubGlobal("matchMedia", vi.fn(reducedMotion.matchMedia));
  setScrollY(0);
  window.history.replaceState(null, "", "/");
  frameQueue = new Map();
  frameClock = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frameQueue.set(++lastFrameId, callback);
    return lastFrameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frameQueue.delete(id));
  scrollTo = vi.fn();
  vi.stubGlobal("scrollTo", scrollTo);
  SpyIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", SpyIntersectionObserver);
  // jsdom não reproduz mídia: play/pause viram espiões que atualizam
  // `paused` e disparam os eventos, como um navegador faria.
  play = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: false });
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { configurable: true, value: true });
    this.dispatchEvent(new Event("pause"));
  } as never);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setScrollY(0);
  window.history.replaceState(null, "", "/");
});

const hero = () => document.getElementById("inicio") as HTMLElement;
/** O progresso desenhado, como número (o `--hx-p` da seção). */
const hxp = () => Number(hero().style.getPropertyValue("--hx-p"));
const state = () => ({
  pin: hero().dataset.pin,
  expanded: hero().dataset.expanded,
  progress: hero().dataset.progress,
  content: hero().dataset.content,
});

/** O painel do menu da barra, aberto (abaixo de 75em). */
const openMenu = (
  <header className="topbar" data-open="true">
    <nav className="topbar__nav">
      <a href="#produtos">Produtos</a>
    </nav>
  </header>
);

/** Monta o hero (e o que vier junto) e espera a expansão ligar. */
async function mount(extra?: ReactNode) {
  const result = render(
    <>
      <HeroExpansao />
      {extra}
    </>,
  );
  await act(async () => {});
  settle();
  return result;
}

/** Um evento de roda e o quadro seguinte (a pintura; na roda de mouse, o 1º passo da animação). */
function wheel(deltaY: number, init: WheelEventInit = {}, target: EventTarget = window) {
  const event = new WheelEvent("wheel", { deltaY, cancelable: true, bubbles: true, ...init });
  act(() => {
    target.dispatchEvent(event);
  });
  frame();
  return event;
}

/** Cliques de roda de mouse (deltaY 100) até expandir, e a animação assentada. */
function expandWithWheel() {
  for (let index = 0; index < 15; index++) wheel(100);
  settle();
}

/** Toque com um dedo em `clientY` (ou nenhum, no touchend). */
function touch(type: "touchstart" | "touchmove" | "touchend" | "touchcancel", clientY?: number, target: EventTarget = window) {
  return touches(type, clientY === undefined ? [] : [clientY], target);
}

/** Toque com um dedo por item de `clientYs` (dois = pinça). */
function touches(
  type: "touchstart" | "touchmove" | "touchend" | "touchcancel",
  clientYs: number[],
  target: EventTarget = window,
) {
  const event = new Event(type, { cancelable: true, bubbles: true });
  Object.defineProperty(event, "touches", { value: clientYs.map((clientY) => ({ clientY })) });
  act(() => {
    target.dispatchEvent(event);
  });
  frame();
  return event;
}

function key(keyName: string, target: Element = document.body, init: KeyboardEventInit = {}) {
  let notPrevented = true;
  act(() => {
    notPrevented = fireEvent.keyDown(target, { key: keyName, ...init });
  });
  frame();
  return { prevented: !notPrevented };
}

function scrollPage(y: number) {
  setScrollY(y);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
  frame();
}

describe("<HeroExpansao /> — HTML do servidor (estado parado)", () => {
  function serverDom() {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<HeroExpansao />);
    return container;
  }

  it("seção #inicio com o contrato do hero e os ganchos de estado parados", () => {
    const section = serverDom().querySelector("section#inicio") as HTMLElement;

    expect(section).not.toBeNull();
    expect(section.classList.contains("hero-expansao")).toBe(true);
    expect(section.classList.contains("surface-space")).toBe(true);
    expect(section.getAttribute("aria-labelledby")).toBe("hero-title");
    expect(section.hasAttribute("data-hides-fab")).toBe(true);
    expect(section.dataset).toMatchObject({ pin: "false", expanded: "false", progress: "0.00", content: "visible" });
    for (const part of ["fundo", "palco", "midia", "titulo", "data", "dica", "conteudo"]) {
      expect(section.querySelectorAll(`.hero-expansao__${part}`)).toHaveLength(1);
    }
  });

  it("um único H1 (#hero-title) com as duas linhas numa leitura só; a dica fica fora da leitura", () => {
    const container = serverDom();
    const headings = container.querySelectorAll("h1");

    expect(headings).toHaveLength(1);
    expect(headings[0]?.id).toBe("hero-title");
    expect(headings[0]?.textContent).toBe(heroExpansao.title);
    expect([...container.querySelectorAll(".hero-expansao__linha")].map((line) => line.textContent)).toEqual([
      ...heroExpansao.titleLines,
    ]);
    expect(container.querySelector(".hero-expansao__data")?.textContent).toBe(heroExpansao.date);
    expect(container.querySelector(".hero-expansao__dica")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".hero-expansao__titulo h2, .hero-expansao__palco h2")).toBeNull();
  });

  it("os dois botões já vêm no HTML: Produtos e o WhatsApp com a mensagem geral", () => {
    const conteudo = within(serverDom().querySelector<HTMLElement>(".hero-expansao__conteudo")!);

    expect(conteudo.getByRole("heading", { level: 2, name: heroExpansao.headline })).toBeTruthy();
    expect(conteudo.getByRole("link", { name: heroExpansao.primaryCta }).getAttribute("href")).toBe("#produtos");
    expect(conteudo.getByRole("link", { name: heroExpansao.whatsappCta }).getAttribute("href")).toBe(
      siteConfig.whatsapp.linkWithMessage(whatsappMessages.general),
    );
  });

  it.each(["a", "c"] as const)(
    "com ?hero=%s, a linha de apoio, o H2 e a frase trocam pela opção depois de montar (o H1 e os botões não)",
    async (opcao) => {
      window.history.replaceState(null, "", `/?hero=${opcao}`);
      const { container } = await mount();
      const { eyebrow, headline, body } = landingContent.heroOpcoes[opcao];
      const conteudo = within(container.querySelector<HTMLElement>(".hero-expansao__conteudo")!);

      expect(container.querySelector(".hero-expansao__data")?.textContent).toBe(eyebrow);
      expect(conteudo.getByRole("heading", { level: 2 }).textContent).toBe(headline);
      expect(conteudo.getByText(body)).toBeTruthy();
      expect(container.querySelector("h1")?.textContent).toBe(heroExpansao.title);
      expect(conteudo.getByRole("link", { name: heroExpansao.primaryCta })).toBeTruthy();
    },
  );

  it("mídia local e decorativa; o vídeo sem autoplay e sem preload, fora do Tab, WebM antes do MP4; o controle só depois de montar", () => {
    const container = serverDom();
    const video = container.querySelector("video") as HTMLVideoElement;
    const fundo = container.querySelector(".hero-expansao__fundo") as HTMLElement;

    expect(video.hasAttribute("autoplay")).toBe(false);
    expect(video.hasAttribute("data-hero-video")).toBe(true);
    // Nada baixa antes do play(): quem não vê o vídeo tocar não o baixa.
    expect(video.getAttribute("preload")).toBe("none");
    expect(video.getAttribute("tabindex")).toBe("-1");
    expect(video.hasAttribute("loop")).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
    // Invisível só até o 1º quadro tocar.
    expect(video.dataset.started).toBe("false");
    expect([...video.querySelectorAll("source")].map((source) => source.getAttribute("type"))).toEqual([
      "video/webm",
      "video/mp4",
    ]);
    expect(fundo.getAttribute("aria-hidden")).toBe("true");
    expect(fundo.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(container.querySelector(".hero-expansao__quadro")?.getAttribute("aria-label")).toBe(heroExpansao.mediaAlt);
    const urls = [...container.querySelectorAll("img, source")].map(
      (element) => element.getAttribute("src") ?? element.getAttribute("srcset") ?? "",
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url.startsWith("/hero/expansao/")).toBe(true);
    expect((container.querySelector(".hero-video__toggle") as HTMLButtonElement).hidden).toBe(true);
  });

  it("o LCP é o pôster do quadro (prioridade alta); o fundo, que cobre a tela e não conta, não disputa banda", () => {
    const container = serverDom();

    expect(container.querySelector("img.hero-expansao__poster")?.getAttribute("fetchpriority")).toBe("high");
    expect(container.querySelector(".hero-expansao__fundo img")?.hasAttribute("fetchpriority")).toBe(false);
  });

  it("não tem violações detectáveis pelo axe-core", async () => {
    reducedMotion.set(true);
    const { container } = render(<HeroExpansao />);
    await act(async () => {});
    expect((await axe.run(container)).violations).toEqual([]);
  }, 20_000);
});

describe("<HeroExpansao /> — expansão com roda, toque e teclado", () => {
  it("depois de montar, no topo e sem reduced motion: prende em p = 0 e esconde o conteúdo até expandir", async () => {
    await mount();
    expect(state()).toEqual({ pin: "true", expanded: "false", progress: "0.00", content: "hidden" });
  });

  it("roda de mouse: cada clique (deltaY 100) soma 0,07 ao alvo (× 0,0007) e segura a página; 15 cliques expandem, e a página volta a rolar", async () => {
    await mount();

    const first = wheel(100);
    expect(first.defaultPrevented).toBe(true);
    // Um quadro depois, o quadro desenhado está a caminho do alvo, sem saltar.
    expect(hxp()).toBeGreaterThan(0);
    expect(hxp()).toBeLessThan(0.07);
    expect(hero().dataset.input).toBe("wheel");
    settle();
    expect(hxp()).toBe(0.07);
    expect(state()).toMatchObject({ pin: "true", progress: "0.07", content: "hidden" });

    for (let index = 0; index < 13; index++) wheel(100);
    settle();
    expect(state()).toMatchObject({ pin: "true", expanded: "false", progress: "0.98" });
    wheel(100);
    settle();
    expect(state()).toEqual({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });

    // Expandido: rolar para baixo é a página (sem preventDefault).
    expect(wheel(100).defaultPrevented).toBe(false);
    expect(state().expanded).toBe("true");
  });

  it("roda de mouse: suavização exponencial pelo tempo (τ = 120 ms), que assenta no alvo e para de pedir quadros", async () => {
    await mount();

    // O 1º quadro da animação vale 1/60 s (não há quadro anterior para medir).
    wheel(100);
    const p1 = hxp();
    expect(p1).toBeCloseTo(0.07 * (1 - Math.exp(-1000 / 60 / 120)), 5);
    // Depende do tempo, não do número de quadros: um quadro de 100 ms anda
    // o mesmo que seis de 16,7 ms.
    frame(100);
    expect(hxp()).toBeCloseTo(p1 + (0.07 - p1) * (1 - Math.exp(-100 / 120)), 5);

    let frames = 0;
    while (frameQueue.size > 0 && frames < 100) {
      frame();
      frames++;
    }
    expect(hxp()).toBe(0.07);
    expect(frameQueue.size).toBe(0);
    // Menos de ~0,7 s no total (o resto do caminho abaixo de 0,0005 encosta).
    expect(16 + 100 + frames * 16).toBeLessThan(700);
  });

  it("roda de mouse: dois cliques seguidos redirecionam do ponto atual (sem voltar nem recomeçar); um clique para cima no meio volta dali", async () => {
    await mount();

    wheel(100);
    frame();
    frame();
    const before = hxp();
    wheel(100);
    const path = [hxp()];
    expect(path[0]).toBeGreaterThan(before);
    expect(path[0]).toBeLessThan(0.14);
    while (frameQueue.size > 0) {
      frame();
      path.push(hxp());
    }
    for (let i = 1; i < path.length; i++) expect(path[i]).toBeGreaterThanOrEqual(path[i - 1]!);
    expect(path.at(-1)).toBe(0.14);

    // Para cima no meio da subida: o desenhado desce dali, sem pular para o alvo.
    wheel(100);
    frame();
    const mid = hxp();
    wheel(-100);
    frame();
    expect(hxp()).toBeLessThan(mid);
    expect(hxp()).toBeGreaterThan(0.14);
    settle();
    expect(hxp()).toBe(0.14);
  });

  it("trackpad (passos de menos de 40 px) anda na hora, sem animação; 40 px ou mais, ou em linhas e páginas, é clique de mouse (suavizado)", async () => {
    await mount();

    wheel(4); // trackpad: 4 px × 0,0007, já no quadro seguinte
    expect(hxp()).toBeCloseTo(0.0028, 6);
    expect(frameQueue.size).toBe(0);
    wheel(39); // ainda trackpad
    expect(hxp()).toBeCloseTo(0.0301, 6);
    expect(frameQueue.size).toBe(0);

    wheel(40); // clique de mouse
    expect(hxp()).toBeGreaterThan(0.0301);
    expect(hxp()).toBeLessThan(0.0581);
    expect(frameQueue.size).toBe(1);
    settle();
    expect(hxp()).toBeCloseTo(0.0581, 6);

    wheel(1, { deltaMode: 1 }); // 1 linha = 16 px, mas em linhas: mouse (Firefox)
    expect(hxp()).toBeLessThan(0.0693);
    settle();
    expect(hxp()).toBeCloseTo(0.0693, 6);

    wheel(-0.05, { deltaMode: 2 }); // páginas: × innerHeight (768 no jsdom)
    expect(hxp()).toBeGreaterThan(0.0424);
    settle();
    expect(hxp()).toBeCloseTo(0.0693 - 0.05 * 768 * 0.0007, 6);
  });

  it("trackpad: 1429 px para expandir (36 passos de 39 px não bastam; o 37º expande na hora)", async () => {
    await mount();

    for (let index = 0; index < 36; index++) wheel(39);
    expect(state()).toMatchObject({ pin: "true", expanded: "false", progress: "0.98" });
    wheel(39);
    expect(frameQueue.size).toBe(0);
    expect(state()).toEqual({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });
  });

  it("trackpad no meio da animação da roda divide o mesmo alvo: soma na hora, sem saltar para o alvo, e tudo assenta na soma", async () => {
    await mount();

    wheel(100);
    const p1 = hxp();
    wheel(20); // +0,014 direto, e a animação continua
    expect(hxp()).toBeGreaterThan(p1 + 0.014);
    expect(hxp()).toBeLessThan(0.084);
    settle();
    expect(hxp()).toBeCloseTo(0.084, 6);
  });

  it("data-expanded só vira true quando o quadro desenhado chega a 1: com o alvo já em 1 e o quadro crescendo, a página continua segura", async () => {
    await mount();

    for (let index = 0; index < 16; index++) wheel(100);
    expect(state()).toMatchObject({ pin: "true", expanded: "false", content: "hidden" });
    expect(hxp()).toBeLessThan(1);
    // Mais um clique para baixo ainda é do hero: a página não rola com o quadro crescendo.
    expect(wheel(100).defaultPrevented).toBe(true);

    let frames = 0;
    while (state().progress !== "1.00" && frames < 200) {
      expect(state()).toMatchObject({ pin: "true", expanded: "false" });
      frame();
      frames++;
    }
    expect(state()).toEqual({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });
    expect(frameQueue.size).toBe(0);
  });

  it("roda em linhas (Firefox) vale 16 px por linha; Ctrl + roda (zoom) e o painel aberto do menu ficam com o navegador", async () => {
    const { container } = await mount(openMenu);

    wheel(3, { deltaMode: 1 }); // 48 px × 0,0007
    settle();
    expect(state().progress).toBe("0.03");
    expect(hxp()).toBeCloseTo(0.0336, 6);

    expect(wheel(100, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(wheel(100, {}, container.querySelector(".topbar__nav a")!).defaultPrevented).toBe(false);
    settle();
    expect(hxp()).toBeCloseTo(0.0336, 6);
  });

  it("roda só de lado (o gesto de voltar e avançar do trackpad) fica com o navegador e não mexe no hero", async () => {
    await mount();
    wheel(100);
    settle();
    const input = hero().dataset.input;

    const sideways = wheel(0, { deltaX: 100 });
    expect(sideways.defaultPrevented).toBe(false);
    expect(state()).toMatchObject({ pin: "true", progress: "0.07" });
    expect(hero().dataset.input).toBe(input);
  });

  it("teclado no meio da animação da roda: parte do alvo, com a transição do CSS, e a animação da roda para", async () => {
    await mount();

    wheel(100);
    expect(hxp()).toBeLessThan(0.07);
    key("ArrowDown");
    expect(hero().dataset.input).toBe("key");
    expect(hxp()).toBeCloseTo(0.17, 6);
    expect(frameQueue.size).toBe(0);
  });

  it("expandido, roda para cima no topo recolhe (de volta ao topo, instantâneo) e as próximas voltam o progresso", async () => {
    await mount();
    expandWithWheel();
    expect(state().expanded).toBe("true");

    // Fora do topo, roda para cima é só a página subindo.
    setScrollY(300);
    expect(wheel(-100).defaultPrevented).toBe(false);
    expect(state().expanded).toBe("true");

    setScrollY(3);
    expect(wheel(-100).defaultPrevented).toBe(true);
    expect(state()).toEqual({ pin: "true", expanded: "false", progress: "1.00", content: "visible" });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    setScrollY(0);

    wheel(-100);
    settle();
    expect(state()).toMatchObject({ progress: "0.93", content: "visible" });
    for (let index = 0; index < 3; index++) wheel(-100);
    settle();
    expect(state()).toMatchObject({ progress: "0.72", content: "hidden" });
  });

  it("expandido e rolado além de uma tela, a roda e o touchmove (não passivos) saem da window; voltam antes do topo", async () => {
    await mount();
    expandWithWheel();
    expect(state().expanded).toBe("true");
    const removed = vi.spyOn(window, "removeEventListener");
    const added = vi.spyOn(window, "addEventListener");

    scrollPage(2000);
    expect(removed.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(["wheel", "touchmove"]));
    // Fora da window de fato: mesmo em scrollY 3 sem passar pelo scroll, a
    // roda para cima não é mais do hero.
    setScrollY(3);
    expect(wheel(-100).defaultPrevented).toBe(false);
    expect(state().expanded).toBe("true");

    // A rolagem de volta (o scroll é passivo e fica) os põe de novo, a tempo de recolher.
    scrollPage(3);
    expect(added.mock.calls.filter(([type]) => type === "wheel" || type === "touchmove")).toHaveLength(2);
    expect(added.mock.calls.find(([type]) => type === "wheel")?.[2]).toEqual({ passive: false });
    expect(wheel(-100).defaultPrevented).toBe(true);
    expect(state()).toMatchObject({ pin: "true", expanded: "false" });
  });

  it("toque: arrastar para cima expande (× 0,0039) e para baixo recolhe, mais rápido (× 0,0062), na hora; expandido, puxar mais de 20 px no topo recolhe", async () => {
    await mount();

    touch("touchstart", 500);
    const move = touch("touchmove", 400); // +100 px × 0,0039, sem animação
    expect(move.defaultPrevented).toBe(true);
    expect(hxp()).toBeCloseTo(0.39, 6);
    expect(frameQueue.size).toBe(0);
    touch("touchmove", 420); // −20 px × 0,0062
    expect(hxp()).toBeCloseTo(0.266, 6);
    touch("touchmove", 232); // +188 px × 0,0039 = 0,7332: 0,9992, ainda não
    expect(state()).toMatchObject({ expanded: "false", progress: "0.99" });
    touch("touchmove", 231); // +1 px → 1
    expect(state()).toMatchObject({ expanded: "true", content: "visible" });
    touch("touchend");

    touch("touchstart", 300);
    expect(touch("touchmove", 310).defaultPrevented).toBe(false); // −10 px: ainda não
    expect(state().expanded).toBe("true");
    expect(touch("touchmove", 330).defaultPrevented).toBe(true); // −30 px no topo: recolhe
    expect(state()).toMatchObject({ pin: "true", expanded: "false" });
    // Como no original: o início do toque não andou enquanto expandido.
    touch("touchmove", 350); // −50 px × 0,0062
    expect(state()).toMatchObject({ progress: "0.69", content: "hidden" });
  });

  it("toque: o touchcancel esquece o início, e um toque que começa no painel aberto do menu fica com o navegador", async () => {
    const { container } = await mount(openMenu);

    touch("touchstart", 500);
    touch("touchcancel");
    expect(touch("touchmove", 400).defaultPrevented).toBe(false);
    expect(state().progress).toBe("0.00");

    const link = container.querySelector(".topbar__nav a")!;
    touch("touchstart", 500, link);
    expect(touch("touchmove", 400, link).defaultPrevented).toBe(false);
    expect(state().progress).toBe("0.00");
  });

  it("pinça (dois dedos): nada é segurado, e a rolagem que o zoom causa (até 300 ms depois) não completa a expansão", async () => {
    let now = 1_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    await mount();

    touches("touchstart", [400, 500]);
    expect(touches("touchmove", [380, 520]).defaultPrevented).toBe(false);
    expect(state().progress).toBe("0.00");
    // O zoom arrasta a página uns pixels: o título que a pessoa amplia fica.
    scrollPage(5);
    expect(state()).toMatchObject({ pin: "true", progress: "0.00" });

    touches("touchend", [380]);
    touches("touchend", []);
    now += 200;
    scrollPage(6);
    expect(state().pin).toBe("true");

    // Passada a pinça, uma rolagem que o hero não causou completa, como sempre.
    now += 200;
    scrollPage(40);
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
  });

  it("com a página ampliada (visualViewport.scale > 1), roda e toque movem a lupa, não o hero", async () => {
    vi.stubGlobal("visualViewport", { scale: 2 });
    await mount();

    expect(wheel(100).defaultPrevented).toBe(false);
    touch("touchstart", 500);
    expect(touch("touchmove", 400).defaultPrevented).toBe(false);
    expect(state()).toMatchObject({ pin: "true", progress: "0.00" });
  });

  it("teclado: seta ±0,1, Page Down e Espaço +0,34, End expande; campos e o Espaço num botão ficam de fora", async () => {
    const { container } = await mount(<input aria-label="Campo fora do hero" />);

    expect(key("ArrowDown").prevented).toBe(true);
    expect(state().progress).toBe("0.10");
    key("PageDown");
    expect(state().progress).toBe("0.44");
    key(" ");
    expect(state().progress).toBe("0.78");
    key("ArrowUp");
    expect(state().progress).toBe("0.68");
    // Shift + Espaço sobe uma página.
    expect(key(" ", document.body, { shiftKey: true }).prevented).toBe(true);
    expect(state().progress).toBe("0.34");

    expect(key("ArrowDown", container.querySelector("input")!).prevented).toBe(false);
    const toggle = container.querySelector(".hero-video__toggle")!;
    expect(key(" ", toggle).prevented).toBe(false);
    expect(state().progress).toBe("0.34");

    key("End");
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
    expect(hero().dataset.input).toBe("key");

    // Expandido: para baixo é a página; para cima, no topo, recolhe como a roda.
    expect(key("PageDown").prevented).toBe(false);
    expect(key("Home").prevented).toBe(true);
    expect(state()).toMatchObject({ pin: "true", expanded: "false" });
  });

  it("teclado: Alt, Ctrl, Meta, Shift (seleção, menos o Espaço), composição e tecla já tratada ficam com o navegador", async () => {
    await mount();

    for (const modifier of ["altKey", "ctrlKey", "metaKey"] as const) {
      expect(key("ArrowDown", document.body, { [modifier]: true }).prevented).toBe(false);
      expect(key("End", document.body, { [modifier]: true }).prevented).toBe(false);
    }
    for (const keyName of ["ArrowDown", "PageDown", "End", "Home"]) {
      expect(key(keyName, document.body, { shiftKey: true }).prevented).toBe(false);
    }
    expect(key("ArrowDown", document.body, { isComposing: true }).prevented).toBe(false);
    const handled = (event: Event) => event.preventDefault();
    document.body.addEventListener("keydown", handled);
    key("PageDown");
    document.body.removeEventListener("keydown", handled);

    expect(state()).toMatchObject({ pin: "true", progress: "0.00" });
  });

  it("teclado: com o painel do menu aberto, as teclas ficam com a página (como a roda)", async () => {
    await mount(openMenu);

    expect(key("ArrowDown").prevented).toBe(false);
    expect(key("End").prevented).toBe(false);
    expect(state()).toMatchObject({ pin: "true", progress: "0.00" });
  });

  it("teclado: dez setas para baixo expandem (sem a deriva do ponto flutuante: 10 × 0,1 = 0,999…)", async () => {
    await mount();
    for (let i = 0; i < 9; i++) key("ArrowDown");
    expect(state()).toMatchObject({ expanded: "false", progress: "0.90" });
    key("ArrowDown");
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });
  });

  it("uma rolagem que o hero não causou (âncora, barra de rolagem, busca) completa a expansão, sem voltar ao topo, e cancela a animação da roda", async () => {
    await mount();
    wheel(100);
    expect(frameQueue.size).toBe(1);

    scrollPage(640);
    expect(state()).toEqual({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });
    expect(hero().dataset.input).toBe("auto");
    expect(frameQueue.size).toBe(0);
    for (let index = 0; index < 5; index++) frame();
    expect(hxp()).toBe(1);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("desmontar no meio da animação da roda cancela o quadro pendente", async () => {
    const { unmount } = await mount();
    wheel(100);
    expect(frameQueue.size).toBe(1);

    unmount();
    expect(frameQueue.size).toBe(0);
  });

  it("link direto para uma âncora fora do hero (/#contato): começa expandido, sem prender", async () => {
    window.history.replaceState(null, "", "/#contato");
    await mount(<section id="contato" />);
    expect(state()).toEqual({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });
  });

  it("página já rolada ao montar (posição restaurada): começa expandido", async () => {
    setScrollY(1200);
    await mount();
    expect(state()).toMatchObject({ pin: "false", expanded: "true" });
  });

  it("âncora do próprio hero (/#inicio) prende normalmente; trocar para uma âncora de fora (hashchange) completa", async () => {
    window.history.replaceState(null, "", "/#inicio");
    await mount(<section id="contato" />);
    expect(state().pin).toBe("true");

    window.history.replaceState(null, "", "/#contato");
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(state()).toMatchObject({ pin: "false", expanded: "true", content: "visible" });
  });

  it("foco num botão do conteúdo completa a expansão; foco no controle do vídeo ou na própria mídia, não", async () => {
    const { container } = await mount();
    const toggle = screen.getByRole("button", { name: heroExpansao.videoPlay });

    act(() => toggle.focus());
    expect(state().pin).toBe("true");

    // O <video tabindex="-1"> ganha foco num clique (no navegador, o CSS
    // tira o clique da mídia; aqui, o foco direto).
    const video = container.querySelector("video") as HTMLVideoElement;
    act(() => video.focus());
    expect(document.activeElement).toBe(video);
    expect(state()).toMatchObject({ pin: "true", progress: "0.00" });

    act(() => screen.getByRole("link", { name: heroExpansao.primaryCta }).focus());
    expect(state()).toMatchObject({ pin: "false", expanded: "true", content: "visible" });
  });

  it("com reduced motion (ou antes de montar) nunca prende: a roda, o toque e as teclas ficam com a página", async () => {
    reducedMotion.set(true);
    await mount();

    expect(state()).toEqual({ pin: "false", expanded: "false", progress: "0.00", content: "visible" });
    expect(wheel(100).defaultPrevented).toBe(false);
    touch("touchstart", 500);
    expect(touch("touchmove", 300).defaultPrevented).toBe(false);
    expect(key("PageDown").prevented).toBe(false);
    expect(state().progress).toBe("0.00");
    expect(hero().style.getPropertyValue("--hx-p")).toBe("");
  });

  it("reduced motion ligado no meio da visita (o portão de verdade, pelo 'change'): solta a página e pausa o vídeo; desligado, prende de novo", async () => {
    const { container, unmount } = await mount();
    const video = container.querySelector("video") as HTMLVideoElement;
    act(() => SpyIntersectionObserver.fire(video, true));
    expect(video.paused).toBe(false);
    // A roda no meio da animação: desarmar cancela o quadro pendente.
    wheel(100);
    expect(state()).toMatchObject({ pin: "true", progress: "0.01" });
    expect(frameQueue.size).toBe(1);

    act(() => reducedMotion.set(true));
    expect(frameQueue.size).toBe(0);
    expect(state()).toEqual({ pin: "false", expanded: "false", progress: "0.00", content: "visible" });
    expect(hero().style.getPropertyValue("--hx-p")).toBe("");
    expect(wheel(100).defaultPrevented).toBe(false);
    expect(key("PageDown").prevented).toBe(false);
    expect(video.paused).toBe(true);

    act(() => reducedMotion.set(false));
    expect(state()).toMatchObject({ pin: "true", progress: "0.00" });
    unmount();
    expect(wheel(100).defaultPrevented).toBe(false);
  });

  it("a roda, o toque e as teclas conferem o reduced motion na hora do evento (antes de o React desligar a expansão)", async () => {
    await mount();
    // A preferência mudou, mas o "change" ainda não chegou ao React.
    reducedMotion.query.matches = true;

    expect(wheel(100).defaultPrevented).toBe(false);
    touch("touchstart", 500);
    expect(touch("touchmove", 400).defaultPrevented).toBe(false);
    expect(key("PageDown").prevented).toBe(false);
    expect(state().progress).toBe("0.00");
  });
});

describe("<HeroExpansao /> — vídeo do quadro (MASTER §9.6)", () => {
  it("toca só depois de montar e com o quadro na tela; o controle pausa de vez (WCAG 2.2.2)", async () => {
    const { container } = await mount();
    const video = container.querySelector("video") as HTMLVideoElement;

    expect(video.muted).toBe(true);
    expect(play).not.toHaveBeenCalled();

    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).toHaveBeenCalledTimes(1);
    const pause = screen.getByRole("button", { name: heroExpansao.videoPause });

    fireEvent.click(pause);
    expect(video.paused).toBe(true);
    expect(screen.getByRole("button", { name: heroExpansao.videoPlay })).toBeTruthy();
    act(() => SpyIntersectionObserver.fire(video, false));
    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("depois do 1º quadro, pausar deixa o quadro parado à vista (data-started fica), sem voltar ao pôster", async () => {
    const { container } = await mount();
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.dataset).toMatchObject({ started: "false", playing: "false" });

    act(() => SpyIntersectionObserver.fire(video, true));
    expect(video.dataset).toMatchObject({ started: "true", playing: "true" });

    fireEvent.click(screen.getByRole("button", { name: heroExpansao.videoPause }));
    expect(video.dataset).toMatchObject({ started: "true", playing: "false" });
  });

  it("com reduced motion fica o pôster: não toca sozinho", async () => {
    reducedMotion.set(true);
    const { container } = await mount();
    const video = container.querySelector("video") as HTMLVideoElement;

    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).not.toHaveBeenCalled();
  });
});
