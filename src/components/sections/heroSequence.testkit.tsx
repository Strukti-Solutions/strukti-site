// Preparação comum aos testes do hero "estudio" (HeroSequence*.test.tsx):
// portão de animação falso, Image falsa, canvas 2D falso e geometria de rolagem.
// Não é um arquivo de teste; cada teste chama setupHeroSequenceTests() e delega
// o vi.mock de "@/lib/motion" para mockMotion().
import { afterEach, beforeEach, vi } from "vitest";
import { siteConfig } from "@/config/site";

// O motion guarda a preferência de reduced motion num cache do módulo (ver
// page.hydration.test.tsx): um matchMedia falso por teste não a troca. Aqui o
// portão de montagem (useCanAnimate) lê uma flag que cada teste liga ou
// desliga, com o mesmo `false` no 1º render do hook real (ADR-004). A
// integração real com o motion fica nos testes de hidratação da página.
export const motionGate = { canAnimate: true };

/** Fábrica do vi.mock("@/lib/motion"): troca só o useCanAnimate. */
export async function mockMotion(importOriginal: <T>() => Promise<T>) {
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
}

// Image falsa: guarda cada pedido e deixa o teste decidir quando "chega" ou "falha".
export class FakeImage {
  static instances: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decoding = "auto";
  src = "";
  constructor() {
    FakeImage.instances.push(this);
  }
}

export const drawImage = vi.fn();

/** Registra o beforeEach/afterEach comum; chamar no topo de cada arquivo de teste. */
export function setupHeroSequenceTests() {
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
}

export const desktopFrames = siteConfig.heroSequence.desktop.frames;
export const section = () => document.getElementById("inicio") as HTMLElement;
export const canvas = () => document.querySelector(".hero-estudio__canvas") as HTMLCanvasElement;
export const fundo = () => document.querySelector(".hero-estudio__fundo") as HTMLElement;
export const area = () => document.querySelector(".hero-estudio__area") as HTMLElement;
export const blocos = () => Array.from(document.querySelectorAll<HTMLElement>(".hero-estudio__bloco"));
export const textoDo = (bloco: HTMLElement) => bloco.querySelector(".hero-estudio__bloco-texto") as HTMLElement;
export const tituloPassos = () => document.querySelector(".hero-estudio__como-titulo") as HTMLElement;
export const ativos = () => blocos().map((bloco) => bloco.dataset.active);

// Geometria falsa (px, na tela): a seção é o trilho (2500 px) do fundo preso
// (500 px); a linha de leitura (centro da área de texto) fica em 400. O texto
// da abertura é alto (600 px, como no celular) e o de cada passo tem 100 px;
// os centros ficam a 400, 1000, 1600 e 2200 px do topo da seção. O título
// "Como funciona" fica preso no alto da coluna, com o pé em 100 (como no
// computador).
export const SECTION_HEIGHT = 2500;
export const FUNDO_HEIGHT = 500;
export const LINHA = 400;
export const TEXTO_TOPO = [100, 950, 1550, 2150];
export const TEXTO_ALTURA = [600, 100, 100, 100];
export const TITULO_PE = 100;

/** Rola até a seção ficar com o topo em `top` (px, na tela). */
export function scrollHeroTo(top: number) {
  vi.spyOn(section(), "getBoundingClientRect").mockReturnValue({ top, height: SECTION_HEIGHT } as DOMRect);
  vi.spyOn(fundo(), "getBoundingClientRect").mockReturnValue({ top: 0, height: FUNDO_HEIGHT } as DOMRect);
  vi.spyOn(area(), "getBoundingClientRect").mockReturnValue({ top: LINHA - 100, height: 200 } as DOMRect);
  vi.spyOn(tituloPassos(), "getBoundingClientRect").mockReturnValue({ top: TITULO_PE - 30, bottom: TITULO_PE, height: 30 } as DOMRect);
  blocos().forEach((bloco, index) => {
    vi.spyOn(textoDo(bloco), "getBoundingClientRect").mockReturnValue({
      top: top + (TEXTO_TOPO[index] ?? 0),
      height: TEXTO_ALTURA[index] ?? 0,
    } as DOMRect);
  });
  window.dispatchEvent(new Event("scroll"));
}

export function loadAllFrames() {
  for (const image of FakeImage.instances) image.onload?.();
}
