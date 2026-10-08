import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { HeroSequence } from "./HeroSequence";
import { motionGate, scrollHeroTo, section, setupHeroSequenceTests } from "./heroSequence.testkit";

// Portão de animação falso, Image e canvas falsos: ver heroSequence.testkit.tsx.
vi.mock("@/lib/motion", async (importOriginal) => (await import("./heroSequence.testkit")).mockMotion(importOriginal));
setupHeroSequenceTests();

describe("<HeroSequence />: link direto para uma âncora (ex.: /#contato)", () => {
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
