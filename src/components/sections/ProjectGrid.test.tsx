import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import type { Project } from "@/content/landing";
import { landingContent } from "@/content/landing";
import { PROJECT_GRID_STEP, ProjectGrid } from "./ProjectGrid";
import { OQueJaFizemos } from "./OQueJaFizemos";

// Projetos fictícios, só para exercitar a grade (o site real tem um projeto).
function makeProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return {
      slug: `projeto-${n}`,
      name: `Projeto de teste ${n}`,
      summary: `Resumo do projeto de teste ${n}.`,
      videoTitle: `Veja o projeto de teste ${n}`,
      video: {
        src: `/video/teste-${n}.mp4`,
        poster: `/video/teste-${n}.jpg`,
        accessibleName: `Vídeo do projeto de teste ${n}`,
        caption: "Legenda de teste.",
        description: "Descrição de teste.",
      },
      platforms: ["Android"],
    };
  });
}

const labels = landingContent.oQueJaConstruimos.grid;
const descriptionLinkLabel = landingContent.oQueJaConstruimos.videoDescriptionLinkLabel;

afterEach(() => {
  cleanup();
});

describe("<ProjectGrid />", () => {
  it(`mostra no máximo ${PROJECT_GRID_STEP} cartões e revela o resto pelo botão, com o foco no primeiro revelado`, () => {
    render(<ProjectGrid projects={makeProjects(8)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />);

    expect(screen.getByRole("heading", { name: "Outros projetos" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(PROJECT_GRID_STEP);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar mais projetos" }));

    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(8);
    expect(screen.queryByRole("button", { name: "Mostrar mais projetos" })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Assistir ao vídeo: Projeto de teste 7" }),
    );
  });

  it("sem botão de mostrar mais quando cabe tudo", () => {
    render(<ProjectGrid projects={makeProjects(3)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />);

    expect(screen.queryByRole("button", { name: "Mostrar mais projetos" })).toBeNull();
  });

  it("o pôster vira o vídeo no mesmo lugar ao reproduzir, e só um vídeo fica aberto por vez", () => {
    const { container } = render(
      <ProjectGrid projects={makeProjects(2)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />,
    );

    expect(container.querySelector("video")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Assistir ao vídeo: Projeto de teste 1" }));
    const first = container.querySelector<HTMLVideoElement>('video[aria-label="Vídeo do projeto de teste 1"]');
    expect(first).toBeTruthy();
    expect(first?.hasAttribute("controls")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Assistir ao vídeo: Projeto de teste 2" }));
    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(container.querySelector('video[aria-label="Vídeo do projeto de teste 2"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Assistir ao vídeo: Projeto de teste 1" })).toBeTruthy();
  });

  it("cada cartão tem nome, resumo, plataformas e a descrição do vídeo em texto", () => {
    render(<ProjectGrid projects={makeProjects(1)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />);

    const card = screen.getByRole("heading", { name: "Projeto de teste 1" }).closest("li");
    expect(card).toBeTruthy();
    const scope = within(card as HTMLElement);
    expect(scope.getByText("Resumo do projeto de teste 1.")).toBeTruthy();
    expect(scope.getByText("Android")).toBeTruthy();
    expect(scope.getByText(descriptionLinkLabel)).toBeTruthy();
  });

  it("não tem violações detectáveis pelo axe-core", async () => {
    const { container } = render(
      <ProjectGrid projects={makeProjects(7)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("<OQueJaFizemos /> com o conteúdo real", () => {
  it("com dois projetos, mostra o Rota de Vendas como destaque e a grade com o Fleet Analytics BI", () => {
    const { container } = render(<OQueJaFizemos />);

    expect(screen.getByRole("heading", { name: "Veja o Rota de Vendas" })).toBeTruthy();
    const featuredVideo = container.querySelector<HTMLVideoElement>(
      'video[aria-label="Vídeo de demonstração do Rota de Vendas"]',
    );
    expect(featuredVideo).toBeTruthy();
    expect(featuredVideo?.getAttribute("preload")).toBe("none");
    expect(featuredVideo?.getAttribute("poster")).toBe("/video/brag.jpg");

    expect(screen.getByRole("heading", { name: "Outros projetos" })).toBeTruthy();
    const card = screen.getByRole("heading", { name: "Fleet Analytics BI" }).closest("li");
    expect(card).toBeTruthy();
    const scope = within(card as HTMLElement);
    const playButton = scope.getByRole("button", {
      name: "Assistir ao vídeo: Fleet Analytics BI",
    });
    expect(playButton).toBeTruthy();
    expect(scope.getByText("Web")).toBeTruthy();
    expect(scope.getByText("Celular")).toBeTruthy();

    const posterImg = card?.querySelector("img");
    expect(posterImg?.getAttribute("src")).toBe("/videos/fleet-analytics-bi.jpg");

    fireEvent.click(playButton);
    const fleetVideo = container.querySelector<HTMLVideoElement>(
      'video[aria-label="Vídeo de demonstração do Fleet Analytics BI"]',
    );
    expect(fleetVideo).toBeTruthy();
    expect(fleetVideo?.getAttribute("poster")).toBe("/videos/fleet-analytics-bi.jpg");
  });
});
