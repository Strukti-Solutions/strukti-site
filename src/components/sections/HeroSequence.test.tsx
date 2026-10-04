import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { frameUrl } from "@/lib/heroSequence";
import { HeroSequence } from "./HeroSequence";

// O motion guarda a preferência de reduced motion num cache do módulo (ver
// page.hydration.test.tsx): um matchMedia falso por teste não a troca. Aqui o
// portão de montagem (useCanAnimate) lê uma flag que cada teste liga ou
// desliga, com o mesmo `false` no 1º render do hook real (ADR-004). A
// integração real com o motion fica nos testes de hidratação da página.
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

// Image falsa: guarda cada pedido e deixa o teste decidir quando "chega" ou "falha".
class FakeImage {
  static instances: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decoding = "auto";
  src = "";
  constructor() {
    FakeImage.instances.push(this);
  }
}

const drawImage = vi.fn();

beforeEach(() => {
  FakeImage.instances = [];
  drawImage.mockClear();
  motionGate.canAnimate = true;
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  // jsdom não tem canvas (setup.ts devolve null); aqui o hero precisa de um contexto 2D.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const desktopFrames = siteConfig.heroSequence.desktop.frames;
const section = () => document.getElementById("inicio") as HTMLElement;
const canvas = () => document.querySelector(".hero-estudio__canvas") as HTMLCanvasElement;
const cena = () => document.querySelector(".hero-estudio__cena") as HTMLElement;
const palco = () => document.querySelector(".hero-estudio__palco") as HTMLElement;

// A célula do palco desce até o fim da seção; o giro corre enquanto o palco
// (500 px) fica preso dentro dela.
const CENA_HEIGHT = 2500;
const PALCO_HEIGHT = 500;

/** Rola até a célula do palco ficar com o topo em `top` (px, na tela). */
function scrollHeroTo(top: number) {
  vi.spyOn(cena(), "getBoundingClientRect").mockReturnValue({ top, height: CENA_HEIGHT } as DOMRect);
  vi.spyOn(palco(), "getBoundingClientRect").mockReturnValue({ height: PALCO_HEIGHT } as DOMRect);
  window.dispatchEvent(new Event("scroll"));
}

function loadAllFrames() {
  for (const image of FakeImage.instances) image.onload?.();
}

describe("<HeroSequence />", () => {
  it("mostra o texto aprovado, o pôster sem alt e o selo de ilustração", () => {
    render(<HeroSequence />);
    expect(screen.getByRole("heading", { level: 1, name: landingContent.heroEstudio.headline })).toBeTruthy();
    expect(screen.getByText(landingContent.heroEstudio.illustrationBadge)).toBeTruthy();
    expect(document.querySelector(".hero-estudio__poster")?.getAttribute("alt")).toBe("");
    expect(canvas().getAttribute("aria-hidden")).toBe("true");
  });

  it("com reduced motion fica no pôster e não baixa quadros", async () => {
    motionGate.canAnimate = false;
    render(<HeroSequence />);
    await act(async () => {});
    expect(section().dataset.scrub).toBe("false");
    expect(FakeImage.instances).toHaveLength(0);
  });

  it("sem reduced motion, baixa o conjunto desktop e desenha o quadro 0", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    expect(section().dataset.scrub).toBe("true");
    expect(FakeImage.instances).toHaveLength(desktopFrames);
    expect(FakeImage.instances[0]?.src).toBe(frameUrl("desktop", 0));
    act(() => FakeImage.instances[0]?.onload?.());
    expect(drawImage).toHaveBeenCalledWith(FakeImage.instances[0], 0, 0, 1600, 1000);
    expect(canvas().dataset.frame).toBe("0");
  });

  it("rolagem rápida: pede o meio e desenha o quadro carregado mais próximo", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    // No topo, com o 0 e o 3 já baixados, o canvas mostra o 0. A rolagem
    // rápida pede o 45, que ainda não chegou: o canvas passa ao 3, o mais
    // próximo já baixado (sem o 0 aqui, o 3 já viria antes da rolagem).
    act(() => FakeImage.instances[0]?.onload?.());
    act(() => FakeImage.instances[3]?.onload?.());
    expect(canvas().dataset.frame).toBe("0");
    act(() => scrollHeroTo(-(CENA_HEIGHT - PALCO_HEIGHT) / 2)); // pede o quadro 45
    expect(canvas().dataset.frame).toBe("3");
    expect(drawImage).toHaveBeenLastCalledWith(FakeImage.instances[3], 0, 0, 1600, 1000);
    expect(drawImage).not.toHaveBeenCalledWith(undefined, expect.anything(), expect.anything(), expect.anything(), expect.anything());
  });

  it("quadros que falham (ex.: sem AVIF) devolvem o hero ao pôster", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => FakeImage.instances[0]?.onload?.());
    expect(canvas().dataset.frame).toBe("0");
    act(() => {
      for (const image of FakeImage.instances.slice(1, Math.ceil(desktopFrames * 0.1) + 2)) image.onerror?.();
    });
    expect(section().dataset.scrub).toBe("false");
    // Depois de desistir: o canvas fica sem quadro, nada mais é desenhado
    // (nem por um quadro que chega, nem pela rolagem) e o que faltava baixar para.
    expect(canvas().dataset.frame).toBeUndefined();
    drawImage.mockClear();
    act(() => FakeImage.instances[50]?.onload?.());
    act(() => scrollHeroTo(-(CENA_HEIGHT - PALCO_HEIGHT) / 2));
    expect(drawImage).not.toHaveBeenCalled();
    expect(FakeImage.instances[50]?.src).toBe("");
  });

  it("o giro só começa com o palco preso abaixo da barra e acaba quando ele solta", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    // O que o CSS daria: margem que centra o palco na 1ª tela e o `top` do sticky.
    palco().style.marginTop = "100px";
    palco().style.top = "80px";
    act(loadAllFrames);
    // Palco ainda descendo (topo natural a 85 px, abaixo dos 80 do sticky): quadro 0.
    act(() => scrollHeroTo(-15));
    expect(canvas().dataset.frame).toBe("0");
    // Preso, no meio da faixa presa (2500 − 100 − 500 = 1900 px): o quadro do meio.
    act(() => scrollHeroTo(80 - 100 - 1900 / 2));
    expect(canvas().dataset.frame).toBe("45");
    // No fim da faixa, quando o palco solta: o último quadro.
    act(() => scrollHeroTo(80 - 100 - 1900));
    expect(canvas().dataset.frame).toBe(String(desktopFrames - 1));
  });

  it("girar a tela não baixa os quadros de novo", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => window.dispatchEvent(new Event("resize")));
    expect(FakeImage.instances).toHaveLength(desktopFrames);
  });

  it("com 'economizar dados' fica no pôster e não baixa quadros", async () => {
    Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    try {
      render(<HeroSequence />);
      await act(async () => {});
      expect(section().dataset.scrub).toBe("false");
      expect(FakeImage.instances).toHaveLength(0);
    } finally {
      delete (navigator as Navigator & { connection?: unknown }).connection;
    }
  });

  it("ao desmontar, tira os ouvintes de rolagem e de tamanho da janela", async () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<HeroSequence />);
    await act(async () => {});
    const listeners = added.mock.calls.filter(([type]) => type === "scroll" || type === "resize");
    expect(listeners.map(([type]) => type).sort()).toEqual(["resize", "scroll"]);
    unmount();
    for (const [type, listener] of listeners) {
      expect(removed).toHaveBeenCalledWith(type, listener);
    }
  });
});
