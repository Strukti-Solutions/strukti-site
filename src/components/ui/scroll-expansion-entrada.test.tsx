import { act, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ENTRADA } from "@/lib/heroEntrada";
import { ScrollExpandMedia } from "./scroll-expansion-hero";

/**
 * Modo `entrada` do ScrollExpandMedia (spec 2026-10-23, §3–§5): as três fases
 * sobre um progresso só, a câmera escrita em variáveis CSS, a liberação no
 * topo da tela (caminho B: a tela no fluxo, a página rola até ela) e a volta.
 * Sem a prop `entrada`, o componente é o do hero "expansao" (os testes dele
 * em HeroExpansao.test.tsx, sem edição).
 */

/**
 * Uma media query falsa que o teste liga e desliga (com o evento "change",
 * como o navegador): a do movimento reduzido (o portão de verdade,
 * useCanAnimate) e a da orientação, `(orientation: portrait)`. As outras não
 * casam.
 */
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
    /** Troca o valor e avisa quem ouve ("change"). */
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

const reducedMotion = consultaFalsa("(prefers-reduced-motion: reduce)");
const orientation = consultaFalsa("(orientation: portrait)");

function matchMedia(media: string) {
  if (media.includes("prefers-reduced-motion")) return reducedMotion.query;
  if (media.includes("orientation: portrait")) return orientation.query;
  return { ...reducedMotion.query, media, matches: false, addEventListener() {}, removeEventListener() {} };
}

/** A altura do palco (100svh) no jsdom, que não faz layout: a da janela, 768. */
const PALCO = 768;

let scrollTo: ReturnType<typeof vi.fn>;
/** O `data-expanded` da seção na hora de cada `scrollTo` (antes de o React render). */
let expandidoNoScroll: (string | undefined)[];

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
  orientation.reset();
  vi.stubGlobal("matchMedia", vi.fn(matchMedia));
  setScrollY(0);
  window.history.replaceState(null, "", "/");
  frameQueue = new Map();
  frameClock = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frameQueue.set(++lastFrameId, callback);
    return lastFrameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frameQueue.delete(id));
  expandidoNoScroll = [];
  scrollTo = vi.fn(() => {
    expandidoNoScroll.push(hero().dataset.expanded);
  });
  vi.stubGlobal("scrollTo", scrollTo);
  // O jsdom não faz layout: o palco ganha a altura de uma janela.
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("hero-expansao__palco") ? PALCO : 0;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setScrollY(0);
  window.history.replaceState(null, "", "/");
});

const hero = () => document.getElementById("inicio") as HTMLElement;
const variavel = (nome: string) => hero().style.getPropertyValue(nome);
/** O progresso desenhado, como número (o `--hx-p` da seção). */
const hxp = () => Number(variavel("--hx-p"));
const state = () => ({
  pin: hero().dataset.pin,
  expanded: hero().dataset.expanded,
  progress: hero().dataset.progress,
  content: hero().dataset.content,
});

function Hero() {
  return (
    <ScrollExpandMedia
      id="inicio"
      titleId="hero-title"
      title={["Tecnologia que trabalha", "em silêncio"]}
      date="Linha de apoio"
      scrollToExpand="Role para expandir"
      background={<div className="fundo-cinza" />}
      media={<div className="sala-cinza" />}
      mediaLabel="A sala"
      mediaControl={<button type="button">Pausar</button>}
      entrada={{ aparelho: <div className="cinza" /> }}
    >
      <h2>A chamada</h2>
      <a href="#produtos">Ver produtos</a>
      <a href="https://wa.me/5500000000000">WhatsApp</a>
    </ScrollExpandMedia>
  );
}

/** Monta o hero (e o que vier junto) e espera a entrada ligar. */
async function mount(extra?: ReactNode) {
  const result = render(
    <>
      <Hero />
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

/** Cliques de roda de 100 px que expandem com os ganhos ÷ ENTRADA.ganho (≈ 27). */
const CLIQUES_PARA_EXPANDIR = Math.ceil((1429 * ENTRADA.ganho) / 100);

/** Cliques de roda de mouse (deltaY 100) até expandir, e a animação assentada. */
function expandWithWheel() {
  for (let index = 0; index < CLIQUES_PARA_EXPANDIR; index++) wheel(100);
  settle();
}

/** Toque com um dedo em `clientY` (ou nenhum, no touchend). */
function touch(type: "touchstart" | "touchmove" | "touchend" | "touchcancel", clientY?: number, target: EventTarget = window) {
  const event = new Event(type, { cancelable: true, bubbles: true });
  Object.defineProperty(event, "touches", { value: clientY === undefined ? [] : [{ clientY }] });
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

describe("<ScrollExpandMedia entrada /> — HTML do servidor", () => {
  it("a seção ganha o modificador; o aparelho fica no quadro, fora da leitura; o conteúdo à vista e sem orientação", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Hero />);
    const section = container.querySelector("section#inicio") as HTMLElement;

    expect(section.classList.contains("hero-expansao")).toBe(true);
    expect(section.classList.contains("hero-expansao--entrada")).toBe(true);
    const aparelhos = section.querySelectorAll(".hero-expansao__aparelho");
    expect(aparelhos).toHaveLength(1);
    expect(aparelhos[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(aparelhos[0]?.parentElement?.classList.contains("hero-expansao__quadro")).toBe(true);
    expect(aparelhos[0]?.querySelector(".cinza")).not.toBeNull();
    // Depois da mídia, no quadro.
    const quadro = section.querySelector(".hero-expansao__quadro")!;
    const filhos = [...quadro.children];
    expect(filhos.indexOf(quadro.querySelector(".sala-cinza")!)).toBeLessThan(filhos.indexOf(aparelhos[0]!));
    expect(section.dataset.content).toBe("visible");
    expect(section.hasAttribute("data-orientacao")).toBe(false);
  });
});

describe("<ScrollExpandMedia entrada /> — fases, liberação e volta", () => {
  it("montado: prende em P = 0, com a tela pequena na cena e a orientação medida", async () => {
    await mount();

    expect(state()).toEqual({ pin: "true", expanded: "false", progress: "0.00", content: "visible" });
    expect(variavel("--hx-p")).toBe("0");
    const s = Number(variavel("--hx-tela-s"));
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
    expect(hero().dataset.orientacao).toBe("deitado");
    for (const nome of [
      "--hx-e",
      "--hx-k",
      "--hx-tela-x",
      "--hx-tela-y",
      "--hx-sala-z",
      "--hx-sala-ox",
      "--hx-sala-oy",
      "--hx-sala-tx",
      "--hx-sala-ty",
      "--hx-sala-blur",
      "--hx-quadro-w",
      "--hx-quadro-h",
      "--hx-linha1-x",
      "--hx-linha2-x",
      "--hx-titulo-saida",
    ]) {
      expect(variavel(nome), nome).not.toBe("");
    }
    expect(variavel("--hx-quadro-w")).toBe("300px");
    expect(variavel("--hx-sala-blur")).toBe("0px");
  });

  it("ganho da roda ÷ ENTRADA.ganho: ceil(1429 × 1,85 / 100) cliques expandem, um a menos não", async () => {
    await mount();
    expect(CLIQUES_PARA_EXPANDIR).toBe(27);

    for (let index = 0; index < CLIQUES_PARA_EXPANDIR - 1; index++) wheel(100);
    settle();
    expect(state()).toMatchObject({ pin: "true", expanded: "false" });
    expect(hxp()).toBeCloseTo(((CLIQUES_PARA_EXPANDIR - 1) * 100 * 0.0007) / ENTRADA.ganho, 5);

    wheel(100);
    settle();
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
  });

  it("toque: o ganho também cai ÷ ENTRADA.ganho", async () => {
    await mount();

    touch("touchstart", 500);
    expect(touch("touchmove", 400).defaultPrevented).toBe(true);
    expect(hxp()).toBeCloseTo((100 * 0.0039) / ENTRADA.ganho, 6);
    touch("touchmove", 420);
    expect(hxp()).toBeCloseTo((100 * 0.0039 - 20 * 0.0062) / ENTRADA.ganho, 6);
  });

  it("teclado: segue por P total (seta 0,1, página 0,34)", async () => {
    await mount();

    key("ArrowDown");
    expect(state().progress).toBe("0.10");
    key("PageDown");
    expect(state().progress).toBe("0.44");
  });

  it("pausa: com P entre E e E + Pa, a tela não muda entre dois cliques (e mudou antes dela)", async () => {
    await mount();
    for (let index = 0; index < 10; index++) wheel(100);
    settle();
    const naExpansao = variavel("--hx-tela-s");

    for (let index = 0; index < 5; index++) wheel(100);
    settle();
    const p1 = hxp();
    const s1 = variavel("--hx-tela-s");
    wheel(100);
    settle();
    const p2 = hxp();

    for (const p of [p1, p2]) {
      expect(p).toBeGreaterThan(ENTRADA.E);
      expect(p).toBeLessThan(ENTRADA.E + ENTRADA.Pa);
    }
    expect(p2).toBeGreaterThan(p1);
    expect(variavel("--hx-tela-s")).toBe(s1);
    expect(variavel("--hx-e")).toBe("1");
    expect(variavel("--hx-k")).toBe("0");
    expect(s1).not.toBe(naExpansao);
  });

  it("liberação: no quadro em que o desenhado chega a 1, data-expanded vira true antes do React e a página rola até o topo da tela, instantâneo", async () => {
    await mount();
    for (let index = 0; index < CLIQUES_PARA_EXPANDIR; index++) wheel(100);

    // Quadro a quadro: até o desenhado chegar a 1, nada de soltar nem rolar.
    let quadros = 0;
    while (state().progress !== "1.00") {
      expect(state().expanded).toBe("false");
      expect(scrollTo).not.toHaveBeenCalled();
      frame();
      if (++quadros > 200) throw new Error("não chegou a 1");
    }
    expect(state()).toMatchObject({ pin: "false", expanded: "true" });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: PALCO, left: 0, behavior: "instant" });
    // Síncrono: na hora do scrollTo, a seção já dizia "expandido" (o CSS
    // tira o transform da tela no mesmo quadro).
    expect(expandidoNoScroll).toEqual(["true"]);
    settle();
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("volta pela roda: expandido no topo da tela, roda para cima recolhe com P em 1; as próximas fazem P cair", async () => {
    await mount();
    expandWithWheel();
    scrollTo.mockClear();
    expandidoNoScroll = [];

    // Abaixo do topo da tela, roda para cima é só a página subindo.
    setScrollY(PALCO + 200);
    expect(wheel(-100).defaultPrevented).toBe(false);
    expect(state().expanded).toBe("true");

    setScrollY(PALCO);
    expect(wheel(-100).defaultPrevented).toBe(true);
    expect(state()).toEqual({ pin: "true", expanded: "false", progress: "1.00", content: "visible" });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(expandidoNoScroll).toEqual(["false"]);
    setScrollY(0);

    for (let index = 0; index < 3; index++) wheel(-100);
    settle();
    expect(hxp()).toBeLessThan(1);
    expect(state()).toMatchObject({ pin: "true", expanded: "false" });
  });

  it("volta pelo toque e pelo teclado no topo da tela", async () => {
    await mount();
    key("End");
    expect(state().expanded).toBe("true");
    setScrollY(PALCO + 3);
    expect(key("Home").prevented).toBe(true);
    expect(state()).toMatchObject({ pin: "true", expanded: "false", progress: "1.00" });

    setScrollY(0);
    key("End");
    expect(state().expanded).toBe("true");
    setScrollY(PALCO);
    touch("touchstart", 300);
    expect(touch("touchmove", 330).defaultPrevented).toBe(true);
    expect(state()).toMatchObject({ pin: "true", expanded: "false", progress: "1.00" });
  });

  it("volta pela barra de rolagem (ou o Home do navegador): expandido, rolar para acima do topo da tela recolhe com P em 1", async () => {
    await mount();
    expandWithWheel();
    scrollTo.mockClear();

    // No topo da tela (com a folga) nada muda.
    scrollPage(PALCO - 3);
    expect(state().expanded).toBe("true");
    expect(scrollTo).not.toHaveBeenCalled();

    scrollPage(300);
    expect(state()).toEqual({ pin: "true", expanded: "false", progress: "1.00", content: "visible" });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(hxp()).toBe(1);
  });

  it("uma rolagem que o hero não causou completa: dentro do palco, rola até a tela; além dele, fica onde está", async () => {
    await mount();
    scrollPage(300);
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
    expect(scrollTo).toHaveBeenCalledWith({ top: PALCO, left: 0, behavior: "instant" });
    cleanup();

    setScrollY(0);
    scrollTo.mockClear();
    await mount();
    scrollPage(2000);
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("expandido e rolado além de uma tela abaixo do topo da tela, a roda e o touchmove saem da window; voltam antes", async () => {
    await mount();
    expandWithWheel();
    const removed = vi.spyOn(window, "removeEventListener");
    const added = vi.spyOn(window, "addEventListener");

    scrollPage(PALCO + window.innerHeight + 1);
    expect(removed.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(["wheel", "touchmove"]));

    scrollPage(PALCO + window.innerHeight);
    expect(added.mock.calls.filter(([type]) => type === "wheel" || type === "touchmove")).toHaveLength(2);
  });

  it("montagem com âncora fora do hero: começa expandido, sem rolar", async () => {
    window.history.replaceState(null, "", "/#fora");
    await mount(<div id="fora" />);

    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("montagem com a página rolada dentro do palco: começa expandido e rola até o topo da tela", async () => {
    setScrollY(300);
    await mount();

    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: PALCO, left: 0, behavior: "instant" });
  });

  it("montagem com a página rolada além do palco: começa expandido, sem rolar", async () => {
    setScrollY(PALCO + 400);
    await mount();

    expect(state()).toMatchObject({ pin: "false", expanded: "true" });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("foco num botão da tela com P = 0: completa na hora (auto), solta e rola uma vez só", async () => {
    await mount();

    act(() => screen.getByRole("button", { name: "Pausar" }).focus());
    expect(state().pin).toBe("true");

    act(() => screen.getByRole("link", { name: "Ver produtos" }).focus());
    frame();
    expect(hero().dataset.input).toBe("auto");
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: PALCO, left: 0, behavior: "instant" });
  });

  it("redimensionar e girar: a geometria é medida de novo e pede um quadro", async () => {
    await mount();
    const x = variavel("--hx-tela-x");
    const s = variavel("--hx-tela-s");

    Object.defineProperty(hero(), "clientWidth", { configurable: true, value: 1440 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(frameQueue.size).toBe(1);
    frame();
    expect(variavel("--hx-tela-x")).not.toBe(x);

    act(() => orientation.set(true));
    expect(frameQueue.size).toBe(1);
    frame();
    expect(hero().dataset.orientacao).toBe("em-pe");
    expect(variavel("--hx-tela-s")).not.toBe(s);
    expect(frameQueue.size).toBe(0);
  });

  it("com movimento reduzido: não prende e não escreve a câmera", async () => {
    reducedMotion.set(true);
    await mount();

    expect(state()).toMatchObject({ pin: "false", expanded: "false", content: "visible" });
    expect(variavel("--hx-p")).toBe("");
    for (let index = 0; index < hero().style.length; index++) {
      expect(hero().style.item(index).startsWith("--hx-")).toBe(false);
    }
    expect(wheel(100).defaultPrevented).toBe(false);
  });

  it("movimento reduzido ligado no meio da visita: apaga as variáveis da cena e solta", async () => {
    await mount();
    expandWithWheel();
    expect(variavel("--hx-tela-s")).not.toBe("");

    act(() => reducedMotion.set(true));
    expect(state()).toMatchObject({ pin: "false", expanded: "false", progress: "0.00" });
    for (let index = 0; index < hero().style.length; index++) {
      expect(hero().style.item(index).startsWith("--hx-")).toBe(false);
    }
    expect(frameQueue.size).toBe(0);
  });

  it("desmontar cancela o quadro pendente e não deixa ouvinte de resize", async () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const { unmount } = await mount();
    wheel(100);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(frameQueue.size).toBeGreaterThan(0);

    unmount();
    expect(frameQueue.size).toBe(0);
    const resizeAdded = added.mock.calls.filter(([type]) => type === "resize").map(([, listener]) => listener);
    const resizeRemoved = removed.mock.calls.filter(([type]) => type === "resize").map(([, listener]) => listener);
    expect(resizeAdded.length).toBeGreaterThan(0);
    for (const listener of resizeAdded) expect(resizeRemoved).toContain(listener);
  });
});
