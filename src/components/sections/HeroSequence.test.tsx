import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { frameUrl } from "@/lib/heroSequence";
import { HeroSequence } from "./HeroSequence";
import {
  FakeImage,
  FUNDO_HEIGHT,
  SECTION_HEIGHT,
  ativos,
  blocos,
  canvas,
  desktopFrames,
  drawImage,
  fundo,
  loadAllFrames,
  motionGate,
  scrollHeroTo,
  section,
  setupHeroSequenceTests,
  textoDo,
  tituloPassos,
} from "./heroSequence.testkit";

// Portão de animação falso, Image e canvas falsos: ver heroSequence.testkit.tsx.
vi.mock("@/lib/motion", async (importOriginal) => (await import("./heroSequence.testkit")).mockMotion(importOriginal));
setupHeroSequenceTests();

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
