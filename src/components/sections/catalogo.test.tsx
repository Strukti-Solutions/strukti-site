import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { landingContent, type ProductStatus } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { Produtos } from "./Produtos";
import { ChamadaHardware } from "./ChamadaHardware";

const { produtos, aplicativos, chamadaHardware, statusLabels, whatsappMessages } = landingContent;

/**
 * Selo de cada aplicativo, decisão do Thiago (spec §3.4 e §4): escrito aqui
 * à mão, e não lido do conteúdo, para o teste pegar uma troca de status.
 */
const APP_STATUS: Record<string, ProductStatus> = {
  "rota-de-vendas": "piloto",
  "fleet-analytics-bi": "emUso",
};

/** O nome acessível do botão de reproduzir, com a duração (v2.2). */
function playName(name: string, duration?: string) {
  return aplicativos.grid.playLabel.replace("{nome}", name).replace(" ({duração})", duration ? ` (${duration})` : "");
}

/** O cartão (li) pelo nome do produto. */
function card(name: string) {
  const item = screen.getByRole("heading", { level: 3, name }).closest("li");
  expect(item).not.toBeNull();
  return item!;
}

// v2.2 (prévia aprovada para homologação em 13/10/2026): uma seção só,
// "Produtos", com o replay e os 2 aplicativos no mesmo formato de cartão.
describe("<Produtos />", () => {
  it("mostra os 3 produtos na ordem Replay, Rota de Vendas e Fleet Analytics BI, cada um com a sua âncora", async () => {
    const { container } = render(<Produtos />);

    expect(screen.getByRole("heading", { level: 2, name: produtos.title })).toBeTruthy();
    expect(screen.getByText(produtos.intro)).toBeTruthy();
    const names = [produtos.replay.name, ...aplicativos.projects.map((project) => project.name)];
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(names);
    expect([...container.querySelectorAll("li.project-card")].map((item) => item.id)).toEqual([
      "replay",
      "rota-de-vendas",
      "fleet-analytics-bi",
    ]);
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it("o cartão do replay tem o selo de piloto, o de ilustração do conceito e o botão do piloto (WhatsApp com a mensagem do replay)", () => {
    render(<Produtos />);
    const replay = within(card(produtos.replay.name));

    expect(replay.getByText(statusLabels.piloto)).toBeTruthy();
    expect(replay.getByText(produtos.replay.illustrationBadge)).toBeTruthy();
    const cta = replay.getByRole("link", { name: new RegExp(produtos.replay.cta) });
    expect(cta.getAttribute("href")).toBe(siteConfig.whatsapp.linkWithMessage(whatsappMessages.replay));
  });

  it("cada aplicativo tem o selo da decisão do Thiago e o botão do diagnóstico, que leva ao formulário", () => {
    render(<Produtos />);
    expect(aplicativos.projects.map((project) => project.slug).sort()).toEqual(Object.keys(APP_STATUS).sort());

    for (const project of aplicativos.projects) {
      const app = within(card(project.name));
      expect(app.getByText(statusLabels[APP_STATUS[project.slug]!], { selector: ".selo" })).toBeTruthy();
      expect(app.getByRole("link", { name: aplicativos.cta }).getAttribute("href")).toBe("#contato");
    }
  });

  it("os vídeos só carregam quando a pessoa clica em reproduzir, e o nome do botão diz a duração", () => {
    const { container } = render(<Produtos />);
    expect(container.querySelector("video")).toBeNull();

    const replay = within(card(produtos.replay.name));
    fireEvent.click(replay.getByRole("button", { name: playName(produtos.replay.name, produtos.replay.video.durationLabel) }));
    const video = replay.getByLabelText(produtos.replay.video.accessibleName) as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video.querySelector("source")?.getAttribute("src")).toBe(produtos.replay.video.src);

    for (const project of aplicativos.projects) {
      expect(screen.getByRole("button", { name: playName(project.name, project.video.durationLabel) })).toBeTruthy();
    }
  });

  it("sem estacionamento, sem os passos, sem a ficha e sem o link do site do replay (o endereço ainda não existe)", () => {
    const { container } = render(<Produtos />);

    expect(container.textContent).not.toMatch(/Estacionamento|Como funciona/);
    expect(container.querySelector(".ficha")).toBeNull();
    expect(screen.queryByText(produtos.replay.siteLinkLabel)).toBeNull();
  });

  it("só um vídeo toca por vez na página: tocar um produto pausa um vídeo de fora da grade", () => {
    // jsdom não implementa reprodução; pause vira espião que atualiza `paused`.
    const pause = vi.fn(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: true });
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as never);

    const { container } = render(
      <>
        <video data-testid="fora" />
        <Produtos />
      </>,
    );
    const outside = screen.getByTestId("fora") as HTMLVideoElement;
    Object.defineProperty(outside, "paused", { configurable: true, value: false });

    const first = aplicativos.projects[0]!;
    fireEvent.click(screen.getByRole("button", { name: playName(first.name, first.video.durationLabel) }));
    const appVideo = container.querySelector<HTMLVideoElement>(`video[aria-label="${first.video.accessibleName}"]`)!;
    fireEvent.play(appVideo);

    expect(pause).toHaveBeenCalledTimes(1);
    expect(outside.paused).toBe(true);

    vi.restoreAllMocks();
  });
});

describe("mensagem pronta do WhatsApp", () => {
  it("codifica acentos, espaços e &", () => {
    expect(siteConfig.whatsapp.linkWithMessage("Olá & até já")).toBe(
      "https://wa.me/5583999683670?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1",
    );
  });

  it("a mensagem do replay leva as linhas Cidade e Quantas quadras (as quebras viram %0A)", () => {
    expect(whatsappMessages.replay.split("\n")).toEqual([
      "Olá! Vim pelo site da Strukti Soluções e quero o piloto gratuito do replay na minha quadra.",
      "Cidade:",
      "Quantas quadras:",
    ]);
    expect(siteConfig.whatsapp.linkWithMessage(whatsappMessages.replay)).toContain("%0ACidade%3A%0AQuantas%20quadras%3A");
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
