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
 * toque e teclado, com as garantias de âncora, rolagem e foco.
 */

// Portão de montagem (useCanAnimate) com uma flag por teste, com o mesmo
// `false` no 1º render do hook real (ADR-004), como no HeroSequence.test.
// O motion guarda a preferência num cache do módulo; a integração real com
// ele fica nos testes de hidratação da página.
const motionGate = vi.hoisted(() => ({ canAnimate: true }));
vi.mock("@/lib/motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/motion")>();
  const { useEffect, useState } = await import("react");
  return {
    ...actual,
    useCanAnimate: () => {
      const [mounted, setMounted] = useState(false);
      useEffect(() => setMounted(true), []);
      return mounted && motionGate.canAnimate;
    },
  };
});

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

function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
}

beforeEach(() => {
  motionGate.canAnimate = true;
  setScrollY(0);
  window.history.replaceState(null, "", "/");
  // A pintura (requestAnimationFrame) roda na hora, como no HeroSequence.test.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
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
const state = () => ({
  pin: hero().dataset.pin,
  expanded: hero().dataset.expanded,
  progress: hero().dataset.progress,
  content: hero().dataset.content,
});

/** Monta o hero (e o que vier junto) e espera a expansão ligar. */
async function mount(extra?: ReactNode) {
  const result = render(
    <>
      <HeroExpansao />
      {extra}
    </>,
  );
  await act(async () => {});
  return result;
}

function wheel(deltaY: number, init: WheelEventInit = {}, target: EventTarget = window) {
  const event = new WheelEvent("wheel", { deltaY, cancelable: true, bubbles: true, ...init });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

/** Toque com um dedo em `clientY` (ou nenhum, no touchend). */
function touch(type: "touchstart" | "touchmove" | "touchend", clientY?: number) {
  const event = new Event(type, { cancelable: true, bubbles: true });
  Object.defineProperty(event, "touches", { value: clientY === undefined ? [] : [{ clientY }] });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

function key(keyName: string, target: Element = document.body, init: KeyboardEventInit = {}) {
  let notPrevented = true;
  act(() => {
    notPrevented = fireEvent.keyDown(target, { key: keyName, ...init });
  });
  return { prevented: !notPrevented };
}

function scrollPage(y: number) {
  setScrollY(y);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
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

  it("mídia local e decorativa; o vídeo sem autoplay, fora do Tab, WebM antes do MP4; o controle só depois de montar", () => {
    const container = serverDom();
    const video = container.querySelector("video") as HTMLVideoElement;
    const fundo = container.querySelector(".hero-expansao__fundo") as HTMLElement;

    expect(video.hasAttribute("autoplay")).toBe(false);
    expect(video.hasAttribute("data-hero-video")).toBe(true);
    expect(video.getAttribute("preload")).toBe("metadata");
    expect(video.getAttribute("tabindex")).toBe("-1");
    expect(video.hasAttribute("loop")).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect([...video.querySelectorAll("source")].map((source) => source.getAttribute("type"))).toEqual([
      "video/webm",
      "video/mp4",
    ]);
    expect(fundo.getAttribute("aria-hidden")).toBe("true");
    expect(fundo.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(fundo.querySelector("img")?.getAttribute("fetchpriority")).toBe("high");
    expect(container.querySelector(".hero-expansao__quadro")?.getAttribute("aria-label")).toBe(heroExpansao.mediaAlt);
    const urls = [...container.querySelectorAll("img, source")].map(
      (element) => element.getAttribute("src") ?? element.getAttribute("srcset") ?? "",
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url.startsWith("/hero/expansao/")).toBe(true);
    expect((container.querySelector(".hero-video__toggle") as HTMLButtonElement).hidden).toBe(true);
  });

  it("não tem violações detectáveis pelo axe-core", async () => {
    motionGate.canAnimate = false;
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

  it("a roda soma deltaY × 0,0009, segura a página e expande em p = 1; depois a página volta a rolar", async () => {
    await mount();

    const first = wheel(100);
    expect(first.defaultPrevented).toBe(true);
    expect(state()).toMatchObject({ pin: "true", progress: "0.09", content: "hidden" });
    expect(hero().style.getPropertyValue("--hx-p")).toMatch(/^0\.09/);

    for (let index = 0; index < 11; index++) wheel(100);
    expect(state()).toEqual({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });

    // Expandido: rolar para baixo é a página (sem preventDefault).
    expect(wheel(100).defaultPrevented).toBe(false);
    expect(state().expanded).toBe("true");
  });

  it("roda em linhas (Firefox) vale 16 px por linha; Ctrl + roda (zoom) e o painel aberto do menu ficam com o navegador", async () => {
    const menu = (
      <header className="topbar" data-open="true">
        <nav className="topbar__nav">
          <a href="#produtos">Produtos</a>
        </nav>
      </header>
    );
    const { container } = await mount(menu);

    wheel(3, { deltaMode: 1 }); // 48 px × 0,0009
    expect(state().progress).toBe("0.04");

    expect(wheel(100, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(wheel(100, {}, container.querySelector(".topbar__nav a")!).defaultPrevented).toBe(false);
    expect(state().progress).toBe("0.04");
  });

  it("expandido, roda para cima no topo recolhe (de volta ao topo, instantâneo) e as próximas voltam o progresso", async () => {
    await mount();
    for (let index = 0; index < 12; index++) wheel(100);
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
    expect(state()).toMatchObject({ progress: "0.91", content: "visible" });
    for (let index = 0; index < 2; index++) wheel(-100);
    expect(state()).toMatchObject({ progress: "0.73", content: "hidden" });
  });

  it("toque: arrastar para cima expande (× 0,005) e para baixo recolhe (× 0,008); expandido, puxar mais de 20 px no topo recolhe", async () => {
    await mount();

    touch("touchstart", 500);
    const move = touch("touchmove", 400); // +100 px × 0,005
    expect(move.defaultPrevented).toBe(true);
    expect(state().progress).toBe("0.50");
    touch("touchmove", 425); // −25 px × 0,008
    expect(state().progress).toBe("0.30");
    touch("touchmove", 270); // +155 px × 0,005 → 1
    expect(state()).toMatchObject({ expanded: "true", content: "visible" });
    touch("touchend");

    touch("touchstart", 300);
    expect(touch("touchmove", 310).defaultPrevented).toBe(false); // −10 px: ainda não
    expect(state().expanded).toBe("true");
    expect(touch("touchmove", 330).defaultPrevented).toBe(true); // −30 px no topo: recolhe
    expect(state()).toMatchObject({ pin: "true", expanded: "false" });
    // Como no original: o início do toque não andou enquanto expandido.
    touch("touchmove", 340); // −40 px × 0,008
    expect(state()).toMatchObject({ progress: "0.68", content: "hidden" });
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

    expect(key("ArrowDown", container.querySelector("input")!).prevented).toBe(false);
    const toggle = container.querySelector(".hero-video__toggle")!;
    expect(key(" ", toggle).prevented).toBe(false);
    expect(state().progress).toBe("0.68");

    key("End");
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00" });
    expect(hero().dataset.input).toBe("key");

    // Expandido: para baixo é a página; para cima, no topo, recolhe como a roda.
    expect(key("PageDown").prevented).toBe(false);
    expect(key("Home").prevented).toBe(true);
    expect(state()).toMatchObject({ pin: "true", expanded: "false" });
  });

  it("teclado: dez setas para baixo expandem (sem a deriva do ponto flutuante: 10 × 0,1 = 0,999…)", async () => {
    await mount();
    for (let i = 0; i < 9; i++) key("ArrowDown");
    expect(state()).toMatchObject({ expanded: "false", progress: "0.90" });
    key("ArrowDown");
    expect(state()).toMatchObject({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });
  });

  it("uma rolagem que o hero não causou (âncora, barra de rolagem, busca) completa a expansão, sem voltar ao topo", async () => {
    await mount();
    wheel(100);

    scrollPage(640);
    expect(state()).toEqual({ pin: "false", expanded: "true", progress: "1.00", content: "visible" });
    expect(scrollTo).not.toHaveBeenCalled();
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

  it("foco num botão do conteúdo completa a expansão; foco no controle do vídeo, não", async () => {
    await mount();
    const toggle = screen.getByRole("button", { name: heroExpansao.videoPlay });

    act(() => toggle.focus());
    expect(state().pin).toBe("true");

    act(() => screen.getByRole("link", { name: heroExpansao.primaryCta }).focus());
    expect(state()).toMatchObject({ pin: "false", expanded: "true", content: "visible" });
  });

  it("com reduced motion (ou antes de montar) nunca prende: a roda, o toque e as teclas ficam com a página", async () => {
    motionGate.canAnimate = false;
    await mount();

    expect(state()).toEqual({ pin: "false", expanded: "false", progress: "0.00", content: "visible" });
    expect(wheel(100).defaultPrevented).toBe(false);
    touch("touchstart", 500);
    expect(touch("touchmove", 300).defaultPrevented).toBe(false);
    expect(key("PageDown").prevented).toBe(false);
    expect(state().progress).toBe("0.00");
    expect(hero().style.getPropertyValue("--hx-p")).toBe("");
  });

  it("reduced motion ligado depois (ou desmontar): volta ao estado parado e solta a página", async () => {
    const { rerender, unmount } = await mount();
    wheel(100);
    expect(state().pin).toBe("true");

    motionGate.canAnimate = false;
    rerender(<HeroExpansao />);
    await act(async () => {});
    expect(state()).toEqual({ pin: "false", expanded: "false", progress: "0.00", content: "visible" });
    expect(hero().style.getPropertyValue("--hx-p")).toBe("");
    expect(wheel(100).defaultPrevented).toBe(false);

    motionGate.canAnimate = true;
    rerender(<HeroExpansao />);
    await act(async () => {});
    unmount();
    expect(wheel(100).defaultPrevented).toBe(false);
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

  it("com reduced motion fica o pôster: não toca sozinho", async () => {
    motionGate.canAnimate = false;
    const { container } = await mount();
    const video = container.querySelector("video") as HTMLVideoElement;

    act(() => SpyIntersectionObserver.fire(video, true));
    expect(play).not.toHaveBeenCalled();
  });
});
