import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import type { Project } from "@/content/landing";
import { landingContent } from "@/content/landing";
import { PROJECT_GRID_STEP, ProjectGrid } from "./ProjectGrid";

// Projetos fictícios, só para exercitar a grade (o site real tem dois).
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

// Os textos reais da grade de aplicativos: sem título próprio, a grade fica
// sob o H2 da seção, e o nome de cada app é H3.
const labels = landingContent.aplicativos.grid;
const descriptionLinkLabel = landingContent.aplicativos.videoDescriptionLinkLabel;

afterEach(() => {
  cleanup();
});

describe("<ProjectGrid />", () => {
  it(`mostra no máximo ${PROJECT_GRID_STEP} cartões e revela o resto pelo botão, com o foco no primeiro revelado`, () => {
    render(<ProjectGrid projects={makeProjects(8)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(PROJECT_GRID_STEP);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar mais projetos" }));

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
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

  // Layout para poucos projetos (MASTER §8.8): 1 cartão vira o cartão largo
  // (pôster ao lado do texto a partir de 1024 px); 2, duas colunas; 3 ou
  // mais, a grade. Nunca sobra coluna vazia na parede.
  it("1 cartão: parede de uma coluna com o cartão largo", () => {
    const { container } = render(
      <ProjectGrid projects={makeProjects(1)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />,
    );
    expect(container.querySelector("ul")?.className).toBe("wall");
    expect(container.querySelector("li")?.className).toBe("project-card project-card--wide");
  });

  it("2 cartões: duas colunas; 3 ou mais: a grade de três, sem cartão largo", () => {
    const { container: withTwo } = render(
      <ProjectGrid projects={makeProjects(2)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />,
    );
    expect(withTwo.querySelector("ul")?.className).toBe("wall wall--2");
    expect(withTwo.querySelector(".project-card--wide")).toBeNull();

    const { container: withThree } = render(
      <ProjectGrid projects={makeProjects(3)} labels={labels} descriptionLinkLabel={descriptionLinkLabel} />,
    );
    expect(withThree.querySelector("ul")?.className).toBe("wall wall--3");
    expect(withThree.querySelector(".project-card--wide")).toBeNull();
  });
});
