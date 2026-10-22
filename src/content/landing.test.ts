import { describe, expect, it } from "vitest";
import { landingContent, type ProductStatus } from "./landing";

// Marca de dado pendente, montada em partes: o check:placeholders procura o
// texto inteiro em src/ e não pode achar este teste.
const PLACEHOLDER = ["[A", "PREENCHER"].join(" ");

/** Selo de cada aplicativo, decisão do Thiago (spec §3.4 e §4). */
const APP_STATUS: Record<string, ProductStatus> = {
  "rota-de-vendas": "piloto",
  "fleet-analytics-bi": "emUso",
};

describe("landingContent v2.2", () => {
  it("tem os quatro rótulos de status exatamente como na spec", () => {
    expect(landingContent.statusLabels).toEqual({
      piloto: "Piloto gratuito",
      desenvolvimento: "Em desenvolvimento",
      emUso: "Em uso",
      emBreve: "Em breve",
    });
  });

  it("nada fala de 4G (o replay usa o Wi-Fi da arena)", () => {
    expect(JSON.stringify(landingContent)).not.toMatch(/\b4G\b/);
  });

  it("o hero tem as 3 opções da v2.2, e a padrão (heroEstudio) é a B", () => {
    expect(Object.keys(landingContent.heroOpcoes).sort()).toEqual(["a", "b", "c"]);
    const { eyebrow, headline, body } = landingContent.heroEstudio;
    expect({ eyebrow, headline, body }).toEqual(landingContent.heroOpcoes.b);
  });

  it('o hero "expansao": o H1 é as duas linhas numa leitura só, e o resto reaproveita o texto aprovado', () => {
    const { heroExpansao, heroEstudio } = landingContent;
    expect(heroExpansao.titleLines).toHaveLength(2);
    expect(heroExpansao.title).toBe(heroExpansao.titleLines.join(" "));
    expect(heroExpansao.date).toBe(heroEstudio.eyebrow);
    expect(heroExpansao.headline).toBe(heroEstudio.headline);
    expect(heroExpansao.body).toBe(heroEstudio.body);
    expect(heroExpansao.primaryCta).toBe(heroEstudio.primaryCta);
    expect(heroExpansao.whatsappCta).toBe(heroEstudio.whatsappCta);
    for (const text of Object.values(heroExpansao).flat()) {
      expect(text).toMatch(/\S/);
      expect(text).not.toContain(PLACEHOLDER);
    }
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

  it("o formulário tem as três opções de interesse (o estacionamento saiu do site)", () => {
    expect(Object.keys(landingContent.contato.form.fields.interest.options).sort()).toEqual(["aplicativo", "outro", "replay"]);
  });
});
