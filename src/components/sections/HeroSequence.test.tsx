import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { HeroSequence } from "./HeroSequence";

// Prévia aprovada para homologação (13/10/2026): o hero é de marca (texto da
// v2.2, opção B por padrão) e o símbolo é desenhado pelo fio (FioPrototipo).
// O giro do 3D em quadros está desligado: os testes dele saíram junto com o
// giro; o código do HeroSequenceScroller fica até a implementação definitiva
// do fio (spec docs/superpowers/specs/2026-10-13-fio-condutor-design.md).

// O portão de montagem liga sempre: se o giro estivesse ligado, baixaria os quadros.
vi.mock("@/lib/motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/motion")>();
  const { useEffect, useState } = await import("react");
  return {
    ...actual,
    useCanAnimate: () => {
      const [mounted, setMounted] = useState(false);
      useEffect(() => setMounted(true), []);
      return mounted;
    },
  };
});

class FakeImage {
  static instances: FakeImage[] = [];
  src = "";
  constructor() {
    FakeImage.instances.push(this);
  }
}

beforeEach(() => {
  FakeImage.instances = [];
  vi.stubGlobal("Image", FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("<HeroSequence /> (prévia v2.2)", () => {
  it("mostra a opção B por padrão: sobretítulo, um H1 e a frase", () => {
    render(<HeroSequence />);
    const { eyebrow, headline, body } = landingContent.heroOpcoes.b;

    expect(screen.getByText(eyebrow)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(headline);
    expect(screen.getByText(body)).toBeTruthy();
  });

  it('"Ver os produtos" leva a #produtos e "Falar no WhatsApp" abre a mensagem geral', () => {
    render(<HeroSequence />);
    const { primaryCta, whatsappCta } = landingContent.heroEstudio;

    expect(screen.getByRole("link", { name: primaryCta }).getAttribute("href")).toBe("#produtos");
    expect(screen.getByRole("link", { name: whatsappCta }).getAttribute("href")).toBe(
      siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general),
    );
  });

  it.each(["a", "c"] as const)("com ?hero=%s, troca o texto depois de montar (o 1º render é sempre a B)", async (opcao) => {
    window.history.replaceState(null, "", `/?hero=${opcao}`);
    await act(async () => {
      render(<HeroSequence />);
    });

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(landingContent.heroOpcoes[opcao].headline);
  });

  it("não baixa os quadros do 3D nem liga o giro, e não tem os passos do replay", async () => {
    const { container } = await act(async () => render(<HeroSequence />));

    expect(FakeImage.instances).toHaveLength(0);
    expect(container.querySelector(".hero-estudio")?.getAttribute("data-scrub")).toBe("false");
    expect(container.textContent).not.toContain("Como funciona");
    expect(container.querySelector("ol")).toBeNull();
  });
});
