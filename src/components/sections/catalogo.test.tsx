import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import type { HeroVariant } from "@/config/site";
import { landingContent, type ProductStatus } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { Produtos } from "./Produtos";
import { Aplicativos } from "./Aplicativos";
import { ChamadaHardware } from "./ChamadaHardware";

const { produtos, aplicativos, chamadaHardware, heroEstudio, statusLabels, whatsappMessages } = landingContent;

// Variante do hero em uso: os passos do replay ficam no hero "estudio" e só
// voltam ao cartão de Produtos nas outras variantes (mesmo mock do page.test).
const heroVariant = vi.hoisted(() => ({ current: "estudio" as HeroVariant }));
vi.mock("@/config/site", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/site")>();
  return {
    ...actual,
    siteConfig: new Proxy(actual.siteConfig, {
      get: (target, key) => (key === "heroVariant" ? heroVariant.current : Reflect.get(target, key)),
    }),
  };
});

/**
 * Selo de cada aplicativo, decisão do Thiago (spec §3.4 e §4): escrito aqui
 * à mão, e não lido do conteúdo, para o teste pegar uma troca de status.
 */
const APP_STATUS: Record<string, ProductStatus> = {
  "rota-de-vendas": "piloto",
  "fleet-analytics-bi": "emUso",
};

describe("<Produtos />", () => {
  beforeEach(() => {
    heroVariant.current = "estudio";
  });

  it("mostra o replay com selo, ilustração do conceito, ficha e o WhatsApp com a mensagem pronta", async () => {
    const { container } = render(<Produtos />);
    const replay = screen.getByRole("article", { name: produtos.replay.name });
    expect(within(replay).getByText(statusLabels.piloto)).toBeTruthy();
    // O vídeo do card é animação do conceito: a spec §10 manda identificá-lo como ilustração.
    expect(within(replay).getByText(heroEstudio.illustrationBadge)).toBeTruthy();
    for (const spec of produtos.replay.specs) expect(within(replay).getByText(spec.value)).toBeTruthy();
    const cta = within(replay).getByRole("link", { name: new RegExp(produtos.replay.cta) });
    expect(cta.getAttribute("href")).toBe(siteConfig.whatsapp.linkWithMessage(whatsappMessages.replay));
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it("o vídeo do replay só carrega quando a pessoa clica em reproduzir", () => {
    const { container } = render(<Produtos />);
    const replay = screen.getByRole("article", { name: produtos.replay.name });
    expect(container.querySelector("video")).toBeNull();

    fireEvent.click(within(replay).getByRole("button", { name: produtos.replay.video.playLabel }));
    const video = within(replay).getByLabelText(produtos.replay.video.accessibleName) as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video.hasAttribute("controls")).toBe(true);
    expect(video.querySelector("source")?.getAttribute("src")).toBe(produtos.replay.video.src);
    expect(within(replay).getByText(produtos.replay.video.caption)).toBeTruthy();
  });

  it('com o hero "estudio", "Como funciona" e os passos ficam só no hero, fora do cartão', () => {
    render(<Produtos />);
    const replay = screen.getByRole("article", { name: produtos.replay.name });
    expect(within(replay).queryByText(produtos.replay.stepsTitle)).toBeNull();
    expect(within(replay).queryAllByRole("listitem")).toHaveLength(0);
  });

  it.each(["video", "classic"] as const)(
    'com o hero "%s", o cartão do replay mostra "Como funciona" e os 3 passos',
    async (variant) => {
      heroVariant.current = variant;
      const { container } = render(<Produtos />);
      const replay = screen.getByRole("article", { name: produtos.replay.name });

      expect(within(replay).getByRole("heading", { level: 4, name: produtos.replay.stepsTitle })).toBeTruthy();
      const list = within(replay).getByRole("list", { name: produtos.replay.stepsTitle });
      expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(
        produtos.replay.steps.map((step) => `${step.lead} ${step.rest}`),
      );
      expect((await axe.run(container)).violations).toEqual([]);
    },
  );

  it("não mostra o link do site do replay enquanto o endereço não existir", () => {
    render(<Produtos />);
    expect(screen.queryByText(produtos.replay.siteLinkLabel)).toBeNull();
  });

  it("mostra o estacionamento como em desenvolvimento, com o WhatsApp próprio", () => {
    render(<Produtos />);
    const card = screen.getByRole("article", { name: produtos.estacionamento.name });
    expect(within(card).getByText(statusLabels.desenvolvimento)).toBeTruthy();
    const cta = within(card).getByRole("link", { name: new RegExp(produtos.estacionamento.cta) });
    expect(cta.getAttribute("href")).toBe(siteConfig.whatsapp.linkWithMessage(whatsappMessages.estacionamento));
  });
});

describe("mensagem pronta do WhatsApp", () => {
  it("codifica acentos, espaços e &", () => {
    expect(siteConfig.whatsapp.linkWithMessage("Olá & até já")).toBe(
      "https://wa.me/5583999683670?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1",
    );
  });
});

describe("<Aplicativos />", () => {
  it("mostra cada app com o seu selo e chama o diagnóstico com o interesse marcado", async () => {
    const { container } = render(<Aplicativos />);
    for (const project of aplicativos.projects) {
      expect(screen.getByRole("heading", { name: project.name })).toBeTruthy();
    }
    expect(screen.getAllByText(/./, { selector: ".selo" })).toHaveLength(aplicativos.projects.length);
    expect(screen.getByRole("link", { name: aplicativos.cta }).getAttribute("href")).toBe("#contato");
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it("o selo de cada cartão é o da decisão do Thiago: Rota de Vendas em piloto, Fleet em uso", () => {
    render(<Aplicativos />);
    expect(aplicativos.projects.map((project) => project.slug).sort()).toEqual(Object.keys(APP_STATUS).sort());

    for (const project of aplicativos.projects) {
      const card = screen.getByRole("heading", { name: project.name }).closest("li");
      expect(card).not.toBeNull();
      const status = APP_STATUS[project.slug]!;
      expect(within(card!).getByText(statusLabels[status], { selector: ".selo" })).toBeTruthy();
    }
  });

  it("só um vídeo toca por vez na página: tocar um app pausa um vídeo de fora da grade", () => {
    // jsdom não implementa reprodução; pause vira espião que atualiza `paused`.
    const pause = vi.fn(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: true });
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as never);

    const { container } = render(
      <>
        <video data-testid="fora" />
        <Aplicativos />
      </>,
    );
    const outside = screen.getByTestId("fora") as HTMLVideoElement;
    Object.defineProperty(outside, "paused", { configurable: true, value: false });

    const first = aplicativos.projects[0]!;
    fireEvent.click(screen.getByRole("button", { name: aplicativos.grid.playLabel.replace("{nome}", first.name) }));
    const appVideo = container.querySelector<HTMLVideoElement>(`video[aria-label="${first.video.accessibleName}"]`)!;
    fireEvent.play(appVideo);

    expect(pause).toHaveBeenCalledTimes(1);
    expect(outside.paused).toBe(true);

    vi.restoreAllMocks();
  });
});

describe("<ChamadaHardware />", () => {
  it("leva ao formulário", async () => {
    const { container } = render(<ChamadaHardware />);
    expect(screen.getByRole("heading", { level: 2, name: chamadaHardware.title })).toBeTruthy();
    expect(screen.getByRole("link", { name: chamadaHardware.cta }).getAttribute("href")).toBe("#contato");
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
