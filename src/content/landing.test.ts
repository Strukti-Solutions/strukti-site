import { describe, expect, it } from "vitest";
import { landingContent, type ProductStatus } from "./landing";

/** Selo de cada aplicativo, decisão do Thiago (spec §3.4 e §4). */
const APP_STATUS: Record<string, ProductStatus> = {
  "rota-de-vendas": "piloto",
  "fleet-analytics-bi": "emUso",
};

describe("landingContent v2.0", () => {
  it("tem os quatro rótulos de status exatamente como na spec", () => {
    expect(landingContent.statusLabels).toEqual({
      piloto: "Piloto gratuito",
      desenvolvimento: "Em desenvolvimento",
      emUso: "Em uso",
      emBreve: "Em breve",
    });
  });

  it("o replay tem 3 passos e a ficha com Wi-Fi (nunca 4G)", () => {
    const { replay } = landingContent.produtos;
    expect(replay.steps).toHaveLength(3);
    expect(replay.specs.map((spec) => spec.value)).toContain("Wi-Fi");
    expect(JSON.stringify(landingContent)).not.toMatch(/\b4G\b/);
  });

  it("o hero identifica o 3D como ilustração do conceito", () => {
    expect(landingContent.heroEstudio.illustrationBadge).toBe("Ilustração do conceito");
  });

  it("todo aplicativo tem um status da lista, e a lista de aplicativos não vem vazia", () => {
    const { projects } = landingContent.aplicativos;
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(Object.keys(landingContent.statusLabels)).toContain(project.status);
    }
  });

  it("o selo de cada aplicativo é o da decisão do Thiago: Rota de Vendas em piloto, Fleet em uso", () => {
    const statusBySlug = Object.fromEntries(
      landingContent.aplicativos.projects.map((project) => [project.slug, project.status]),
    );
    expect(statusBySlug).toEqual(APP_STATUS);
  });

  it("o formulário tem as quatro opções de interesse", () => {
    expect(Object.keys(landingContent.contato.form.fields.interest.options).sort()).toEqual(
      ["aplicativo", "estacionamento", "outro", "replay"],
    );
  });
});
