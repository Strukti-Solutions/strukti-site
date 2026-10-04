import { describe, expect, it } from "vitest";
import { landingContent } from "./landing";

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

  it("todo aplicativo tem um status da lista", () => {
    for (const project of landingContent.aplicativos.projects) {
      expect(Object.keys(landingContent.statusLabels)).toContain(project.status);
    }
  });

  it("o formulário tem as quatro opções de interesse", () => {
    expect(Object.keys(landingContent.contato.form.fields.interest.options).sort()).toEqual(
      ["aplicativo", "estacionamento", "outro", "replay"],
    );
  });
});
