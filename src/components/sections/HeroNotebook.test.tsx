import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, within } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { HeroNotebook } from "./HeroNotebook";

/**
 * Hero "notebook" (protótipo da entrada pelo notebook): é o `HeroExpansao`
 * com `entrada={{ aparelho: <AparelhoVetor /> }}`. Aqui só o contrato do
 * HTML (a mecânica de câmera está em scroll-expansion-hero.test.tsx e
 * heroEntrada.test.ts).
 */

const { heroExpansao, whatsappMessages } = landingContent;

beforeEach(() => {
  // O portão de montagem lê prefers-reduced-motion; sem matchMedia no jsdom,
  // o hero fica no estado parado, o que basta para conferir o HTML.
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: false,
      media,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })),
  );
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation((() => Promise.resolve()) as never);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation((() => {}) as never);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function mount() {
  const result = render(<HeroNotebook />);
  await act(async () => {});
  return result;
}

describe("<HeroNotebook />", () => {
  it("tem um só h1 (#hero-title) e a section #inicio", async () => {
    const { container } = await mount();

    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.id).toBe("hero-title");
    expect(container.querySelector("section#inicio")).not.toBeNull();
  });

  it("o h2, o link #produtos e o WhatsApp ficam dentro de #inicio, no bloco de chamada", async () => {
    const { container } = await mount();
    const conteudo = container.querySelector<HTMLElement>("#inicio .hero-expansao__conteudo");

    expect(conteudo).not.toBeNull();
    const dentro = within(conteudo!);
    expect(dentro.getAllByRole("heading", { level: 2, hidden: true }).length).toBeGreaterThanOrEqual(1);
    expect(dentro.getByText(heroExpansao.primaryCta, { selector: "a" }).getAttribute("href")).toBe("#produtos");
    expect(dentro.getByText(heroExpansao.whatsappCta, { selector: "a" }).getAttribute("href")).toBe(
      siteConfig.whatsapp.linkWithMessage(whatsappMessages.general),
    );
  });

  it("a section tem o modificador hero-expansao--entrada e o aparelho em vetor no palco", async () => {
    const { container } = await mount();
    const section = container.querySelector("#inicio");

    expect(section?.classList.contains("hero-expansao")).toBe(true);
    expect(section?.classList.contains("hero-expansao--entrada")).toBe(true);
    expect(section?.querySelector(".aparelho-vetor")).not.toBeNull();
    expect(section?.querySelector(".aparelho-cinza")).toBeNull();
  });

  it("a mídia é a do siteConfig.heroNotebook, por enquadramento: o fundo e o pôster da mesa com o notebook, o retrato só em <source media>", async () => {
    const { container } = await mount();
    const { fundo, midia, midiaRetrato } = siteConfig.heroNotebook;
    const retrato = "(orientation: portrait)";

    const fundoImg = container.querySelector("img.hero-expansao__fundo-img");
    expect(fundoImg?.getAttribute("src")).toBe(fundo.deitado.posterJpg);
    const fundoSources = [...(fundoImg?.parentElement?.querySelectorAll("source") ?? [])].map((s) => [
      s.getAttribute("media"),
      s.getAttribute("srcset"),
    ]);
    expect(fundoSources).toEqual([
      [retrato, fundo.retrato.posterAvif],
      [retrato, fundo.retrato.posterJpg],
      [null, fundo.deitado.posterAvif],
    ]);

    const poster = container.querySelector("img.hero-expansao__poster");
    expect(poster?.getAttribute("src")).toBe(midia.posterJpg);
    expect(poster?.getAttribute("fetchpriority")).toBe("high");
    const posterSources = [...(poster?.parentElement?.querySelectorAll("source") ?? [])].map((s) => [
      s.getAttribute("media"),
      s.getAttribute("srcset"),
    ]);
    expect(posterSources).toEqual([
      [retrato, midiaRetrato.posterAvif],
      [retrato, midiaRetrato.posterJpg],
      [null, midia.posterAvif],
    ]);
    // Nada do expansao: as duas cenas (deitada e em pé) são as do notebook.
    const urls = [...container.querySelectorAll("[src], [srcset]")].map(
      (el) => el.getAttribute("src") ?? el.getAttribute("srcset"),
    );
    expect(urls.filter((url) => url?.includes("/hero/expansao/"))).toEqual([]);
    expect(urls.filter((url) => url?.includes("-retrato"))).toEqual([
      fundo.retrato.posterAvif,
      fundo.retrato.posterJpg,
      midiaRetrato.posterAvif,
      midiaRetrato.posterJpg,
    ]);
    // Sem vídeo na configuração (só o pôster): o <video> fica, sem fonte.
    const video = container.querySelector("video");
    expect(video?.hasAttribute("src")).toBe(false);
    expect(video?.querySelectorAll("source")).toHaveLength(0);
  });

  it("no DOM, o controle do vídeo vem antes do bloco de chamada (o Tab chega ao controle primeiro)", async () => {
    const { container } = await mount();
    const controle = container.querySelector(".hero-expansao__controle");
    const conteudo = container.querySelector(".hero-expansao__conteudo");

    expect(controle).not.toBeNull();
    expect(conteudo).not.toBeNull();
    expect(controle!.compareDocumentPosition(conteudo!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
