import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
const fundo = () => document.querySelector(".hero-estudio__fundo") as HTMLElement;
const area = () => document.querySelector(".hero-estudio__area") as HTMLElement;
const blocos = () => Array.from(document.querySelectorAll<HTMLElement>(".hero-estudio__bloco"));
const textoDo = (bloco: HTMLElement) => bloco.querySelector(".hero-estudio__bloco-texto") as HTMLElement;
const tituloPassos = () => document.querySelector(".hero-estudio__como-titulo") as HTMLElement;
const ativos = () => blocos().map((bloco) => bloco.dataset.active);

// Geometria falsa (px, na tela): a seção é o trilho (2500 px) do fundo preso
// (500 px); a linha de leitura (centro da área de texto) fica em 400. O texto
// da abertura é alto (600 px, como no celular) e o de cada passo tem 100 px;
// os centros ficam a 400, 1000, 1600 e 2200 px do topo da seção. O título
// "Como funciona" fica preso no alto da coluna, com o pé em 100 (como no
// computador).
const SECTION_HEIGHT = 2500;
const FUNDO_HEIGHT = 500;
const LINHA = 400;
const TEXTO_TOPO = [100, 950, 1550, 2150];
const TEXTO_ALTURA = [600, 100, 100, 100];
const TITULO_PE = 100;

/** Rola até a seção ficar com o topo em `top` (px, na tela). */
function scrollHeroTo(top: number) {
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
    act(() => scrollHeroTo(-(SECTION_HEIGHT - FUNDO_HEIGHT) / 2)); // pede o quadro 45
    expect(canvas().dataset.frame).toBe("3");
    expect(drawImage).toHaveBeenLastCalledWith(FakeImage.instances[3], 0, 0, 1600, 1000);
    expect(drawImage).not.toHaveBeenCalledWith(undefined, expect.anything(), expect.anything(), expect.anything(), expect.anything());
  });

  it("quadros que falham (ex.: sem AVIF) devolvem o hero ao pôster", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => FakeImage.instances[0]?.onload?.());
    expect(canvas().dataset.frame).toBe("0");
    expect(ativos()[0]).toBe("true");
    act(() => {
      for (const image of FakeImage.instances.slice(1, Math.ceil(desktopFrames * 0.1) + 2)) image.onerror?.();
    });
    expect(section().dataset.scrub).toBe("false");
    // Depois de desistir: o canvas fica sem quadro, nada mais é desenhado
    // (nem por um quadro que chega, nem pela rolagem) e o que faltava baixar para.
    expect(canvas().dataset.frame).toBeUndefined();
    expect(document.querySelector("[data-active]")).toBeNull();
    drawImage.mockClear();
    act(() => FakeImage.instances[50]?.onload?.());
    act(() => scrollHeroTo(-(SECTION_HEIGHT - FUNDO_HEIGHT) / 2));
    expect(drawImage).not.toHaveBeenCalled();
    expect(FakeImage.instances[50]?.src).toBe("");
  });

  it("o giro só começa com o fundo preso e acaba quando ele solta", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    // Margem de cima e `top` do sticky do fundo (no CSS são 0; aqui não, para
    // a conta mostrar que usa os dois).
    fundo().style.marginTop = "100px";
    fundo().style.top = "80px";
    act(loadAllFrames);
    // Fundo ainda descendo (topo natural a 85 px, abaixo dos 80 do sticky): quadro 0.
    act(() => scrollHeroTo(-15));
    expect(canvas().dataset.frame).toBe("0");
    // Preso, no meio da faixa presa (2500 − 100 − 500 = 1900 px): o quadro do meio.
    act(() => scrollHeroTo(80 - 100 - 1900 / 2));
    expect(canvas().dataset.frame).toBe("45");
    // No fim da faixa, quando o fundo solta: o último quadro.
    act(() => scrollHeroTo(80 - 100 - 1900));
    expect(canvas().dataset.frame).toBe(String(desktopFrames - 1));
  });

  it.each([
    ["sem", false],
    ["com", true],
  ])("mostra 'Como funciona' e os 3 passos do replay (texto aprovado) %s animação", async (_label, animate) => {
    motionGate.canAnimate = animate;
    render(<HeroSequence />);
    await act(async () => {});
    expect(section().dataset.scrub).toBe(String(animate));
    const { stepsTitle, steps } = landingContent.produtos.replay;
    expect(screen.getByRole("heading", { level: 2, name: stepsTitle })).toBeTruthy();
    const lista = screen.getByRole("list", { name: stepsTitle });
    expect(within(lista).getAllByRole("listitem")).toHaveLength(steps.length);
    for (const step of steps) {
      expect(within(lista).getByText(step.lead)).toBeTruthy();
      expect(within(lista).getByText(step.rest, { exact: false })).toBeTruthy();
    }
    // Sem animação, nenhum bloco é escondido: o realce só existe com o scrub.
    if (!animate) expect(document.querySelector("[data-active]")).toBeNull();
  });

  it("o bloco em foco (data-active) acompanha a rolagem; o título vale para os passos", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => scrollHeroTo(0));
    expect(ativos()).toEqual(["true", "false", "false", "false"]);
    expect(tituloPassos().dataset.active).toBe("false");
    // A abertura (alta) segue em foco enquanto o MEIO dela está mais perto da
    // linha que o meio do 1º passo, mesmo com o topo dela já bem acima.
    act(() => scrollHeroTo(-280));
    expect(ativos()).toEqual(["true", "false", "false", "false"]);
    act(() => scrollHeroTo(-600)); // o 1º passo na linha de leitura
    expect(ativos()).toEqual(["false", "true", "false", "false"]);
    expect(tituloPassos().dataset.active).toBe("true");
    act(() => scrollHeroTo(-1850)); // mais perto do 3º que do 2º
    expect(ativos()).toEqual(["false", "false", "false", "true"]);
    expect(tituloPassos().dataset.active).toBe("true");
  });

  it("nenhum passo em foco passa por cima do título: na troca o foco vai ao seguinte; na saída o título some", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    // O 1º passo ainda é o mais perto da linha (centro a 130 contra 730 do
    // 2º), mas o topo dele (80) já passou do pé do título (100): o foco vai
    // para o 2º, que está abaixo do título, e o título continua à vista.
    act(() => scrollHeroTo(-870));
    expect(ativos()).toEqual(["false", "false", "true", "false"]);
    expect(tituloPassos().dataset.active).toBe("true");
    // Saída do hero: o 3º passo (o último) sobe até o título. Não há passo
    // seguinte, então o título some para os dois não se cruzarem.
    act(() => scrollHeroTo(-2100));
    expect(ativos()).toEqual(["false", "false", "false", "true"]);
    expect(tituloPassos().dataset.active).toBe("false");
    // Voltando, com o 3º passo de novo abaixo do título, o título volta.
    act(() => scrollHeroTo(-1850));
    expect(tituloPassos().dataset.active).toBe("true");
  });

  it("o deslize do bloco escondido (translateY) não devolve o foco a ele: o foco não pisca", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    // O topo do 1º passo (90) já passou do pé do título (100): o foco vai ao 2º.
    act(() => scrollHeroTo(-860));
    expect(ativos()).toEqual(["false", "false", "true", "false"]);
    // Escondido, o 1º passo desliza 16 px para baixo (o topo na tela vai a
    // 106, abaixo do título), mas o lugar dele na página não mudou.
    const passo1 = textoDo(blocos()[1] as HTMLElement);
    passo1.style.transform = "matrix(1, 0, 0, 1, 0, 16)";
    vi.spyOn(passo1, "getBoundingClientRect").mockReturnValue({ top: -860 + 950 + 16, height: 100 } as DOMRect);
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(ativos()).toEqual(["false", "false", "true", "false"]);
  });

  it("girar a tela não baixa os quadros de novo", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => window.dispatchEvent(new Event("resize")));
    expect(FakeImage.instances).toHaveLength(desktopFrames);
    expect(canvas().dataset.conjunto).toBe("desktop");
  });

  it("no celular baixa o conjunto celular (800 × 900) e o marca no canvas, que continua com ele ao girar", async () => {
    vi.stubGlobal("innerWidth", 360);
    render(<HeroSequence />);
    await act(async () => {});
    const { frames, width, height } = siteConfig.heroSequence.celular;
    expect(FakeImage.instances).toHaveLength(frames);
    expect(FakeImage.instances.map((image) => image.src)).toEqual(
      Array.from({ length: frames }, (_, index) => frameUrl("celular", index)),
    );
    expect([canvas().width, canvas().height]).toEqual([width, height]);
    act(() => FakeImage.instances[0]?.onload?.());
    expect(drawImage).toHaveBeenCalledWith(FakeImage.instances[0], 0, 0, width, height);
    // O CSS usa data-conjunto para mostrar o quadro 8:9 inteiro (contain)
    // quando a tela gira para um quadro 16:10.
    expect(canvas().dataset.conjunto).toBe("celular");
    vi.stubGlobal("innerWidth", 844);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(FakeImage.instances).toHaveLength(frames);
    expect(canvas().dataset.conjunto).toBe("celular");
  });

  it("com a página ainda carregando, os quadros só baixam depois do load (o pôster é o LCP)", async () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    render(<HeroSequence />);
    await act(async () => {});
    // A animação já liga (o foco vale sem quadros), mas nada baixa antes do load.
    expect(section().dataset.scrub).toBe("true");
    expect(FakeImage.instances).toHaveLength(0);
    act(() => window.dispatchEvent(new Event("load")));
    expect(FakeImage.instances).toHaveLength(desktopFrames);
  });

  it("desmontar antes do load não baixa quadro nenhum depois", async () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const { unmount } = render(<HeroSequence />);
    await act(async () => {});
    unmount();
    window.dispatchEvent(new Event("load"));
    expect(FakeImage.instances).toHaveLength(0);
  });

  it("ao desmontar, o canvas perde a marca do conjunto", async () => {
    const { unmount } = render(<HeroSequence />);
    await act(async () => {});
    const element = canvas();
    expect(element.dataset.conjunto).toBe("desktop");
    unmount();
    expect(element.dataset.conjunto).toBeUndefined();
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

  describe("link direto para uma âncora (ex.: /#contato)", () => {
    // jsdom não implementa scrollIntoView; guarda em quem foi chamado.
    const scrolled: { target: Element; options: unknown }[] = [];

    beforeEach(() => {
      scrolled.length = 0;
      Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        writable: true,
        value: function (this: Element, options?: unknown) {
          scrolled.push({ target: this, options });
        },
      });
      // Só os temporizadores (o requestAnimationFrame já é falso aqui).
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    });

    afterEach(() => {
      vi.useRealTimers();
      delete (Element.prototype as Partial<Element>).scrollIntoView;
      window.location.hash = "";
    });

    const page = () => (
      <>
        <HeroSequence />
        <section id="contato" />
      </>
    );
    const contato = () => document.getElementById("contato") as HTMLElement;

    /** O navegador move o alvo (ex.: o resto da rolagem suave até a âncora) e avisa com um evento de rolagem. */
    function browserMovesTargetTo(top: number) {
      vi.spyOn(contato(), "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
      window.dispatchEvent(new Event("scroll"));
    }

    it("se o navegador ainda rolava até a âncora (rolagem suave), volta ao alvo de novo quando a rolagem para", async () => {
      window.location.hash = "#contato";
      render(page());
      await act(async () => {});
      expect(scrolled).toHaveLength(1);
      // O resto da rolagem suave do navegador continua depois do salto e se soma a ele.
      act(() => browserMovesTargetTo(-100));
      act(() => vi.advanceTimersByTime(100));
      act(() => browserMovesTargetTo(-231));
      act(() => vi.advanceTimersByTime(100));
      expect(scrolled).toHaveLength(1); // ainda rolando
      act(() => vi.advanceTimersByTime(100)); // a rolagem parou
      expect(scrolled).toEqual([scrolled[0], scrolled[0]]);
      // Depois disso, nada mais.
      act(() => browserMovesTargetTo(-500));
      act(() => vi.advanceTimersByTime(1000));
      expect(scrolled).toHaveLength(2);
    });

    it("sem rolagem depois do salto, não rola de novo", async () => {
      window.location.hash = "#contato";
      render(page());
      await act(async () => {});
      act(() => vi.advanceTimersByTime(1000));
      expect(scrolled).toHaveLength(1);
    });

    it.each(["wheel", "touchstart", "keydown", "pointerdown"])(
      "se a pessoa rola antes de a rolagem parar (%s), não a puxa de volta",
      async (type) => {
        window.location.hash = "#contato";
        render(page());
        await act(async () => {});
        act(() => window.dispatchEvent(new Event(type)));
        act(() => browserMovesTargetTo(-231));
        act(() => vi.advanceTimersByTime(1000));
        expect(scrolled).toHaveLength(1);
      },
    );

    it("depois de a animação ligar (a seção cresce), volta uma vez ao alvo, sem animação", async () => {
      window.location.hash = "#contato";
      const { rerender } = render(page());
      await act(async () => {});
      expect(section().dataset.scrub).toBe("true");
      expect(scrolled).toEqual([{ target: document.getElementById("contato"), options: { behavior: "instant", block: "start" } }]);
      // Uma vez só: rolar, ou a animação desligar e ligar de novo (a pessoa
      // muda a preferência de movimento com a página aberta), não a puxa de volta.
      act(() => scrollHeroTo(-600));
      motionGate.canAnimate = false;
      rerender(page());
      await act(async () => {});
      expect(section().dataset.scrub).toBe("false");
      motionGate.canAnimate = true;
      rerender(page());
      await act(async () => {});
      expect(section().dataset.scrub).toBe("true");
      expect(scrolled).toHaveLength(1);
    });

    it.each([
      ["sem âncora", ""],
      ["com âncora no próprio hero", "#inicio"],
      ["com âncora dentro do hero", "#hero-title"],
      ["com âncora que não existe", "#nada"],
    ])("%s, não rola", async (_label, hash) => {
      window.location.hash = hash;
      render(page());
      await act(async () => {});
      expect(section().dataset.scrub).toBe("true");
      expect(scrolled).toHaveLength(0);
    });

    it("com reduced motion (a seção não cresce), não rola", async () => {
      motionGate.canAnimate = false;
      window.location.hash = "#contato";
      render(page());
      await act(async () => {});
      expect(scrolled).toHaveLength(0);
    });
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
