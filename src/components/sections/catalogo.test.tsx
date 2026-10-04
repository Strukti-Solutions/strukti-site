import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { Produtos } from "./Produtos";
import { Aplicativos } from "./Aplicativos";
import { ChamadaHardware } from "./ChamadaHardware";

const { produtos, aplicativos, chamadaHardware, statusLabels, whatsappMessages } = landingContent;

describe("<Produtos />", () => {
  it("mostra o replay com selo, 3 passos, ficha e o WhatsApp com a mensagem pronta", async () => {
    const { container } = render(<Produtos />);
    const replay = screen.getByRole("article", { name: produtos.replay.name });
    expect(within(replay).getByText(statusLabels.piloto)).toBeTruthy();
    expect(within(replay).getAllByRole("listitem")).toHaveLength(3);
    for (const spec of produtos.replay.specs) expect(within(replay).getByText(spec.value)).toBeTruthy();
    const cta = within(replay).getByRole("link", { name: new RegExp(produtos.replay.cta) });
    expect(cta.getAttribute("href")).toBe(siteConfig.whatsapp.linkWithMessage(whatsappMessages.replay));
    expect((await axe.run(container)).violations).toEqual([]);
  });

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
