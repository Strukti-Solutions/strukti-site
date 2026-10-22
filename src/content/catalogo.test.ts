// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { CATALOGO, catalogoUi, type ItemCatalogo } from "./catalogo";
import { landingContent } from "./landing";

// Marca de dado pendente, montada em partes: o check:placeholders procura o
// texto inteiro em src/ e não pode achar este teste.
const PLACEHOLDER = ["[A", "PREENCHER"].join(" ");

// Os 3 reais primeiro; depois os inventados, alternando os tipos (spec §5.2).
const ORDEM = [
  "replay",
  "rota-de-vendas",
  "fleet-analytics-bi",
  "placar-conectado",
  "agenda-de-quadras",
  "site-clinicas",
  "totem-check-in",
  "estoque-oficinas",
  "vitrine-lojas",
  "contador-de-fluxo",
];
const REAIS = ["replay", "rota-de-vendas", "fleet-analytics-bi"];

const porSlug = (slug: string): ItemCatalogo => {
  const item = CATALOGO.find((i) => i.slug === slug);
  if (!item) throw new Error(`Item ${slug} fora do catálogo`);
  return item;
};
const projeto = (slug: string) => {
  const p = landingContent.aplicativos.projects.find((x) => x.slug === slug);
  if (!p) throw new Error(`Projeto ${slug} fora do landingContent`);
  return p;
};
const rota = projeto("rota-de-vendas");
const fleet = projeto("fleet-analytics-bi");

/** Todos os textos de um item (inclusive os do painel), para varrer. */
function textos(item: ItemCatalogo): string[] {
  const { painel } = item;
  return [
    item.nome,
    item.frase,
    item.arte.alt,
    painel.paraQuem,
    ...painel.beneficios,
    ...painel.comoFunciona.flatMap((p) => [p.titulo, p.texto]),
    ...painel.telas.map((t) => t.alt),
  ];
}

describe("CATALOGO (spec §5)", () => {
  it("tem os 10 itens na ordem da §5.2, com slugs únicos", () => {
    expect(CATALOGO.map((i) => i.slug)).toEqual(ORDEM);
    expect(new Set(CATALOGO.map((i) => i.slug)).size).toBe(CATALOGO.length);
  });

  it("os tipos são os da §5.2", () => {
    expect(Object.fromEntries(CATALOGO.map((i) => [i.slug, i.tipo]))).toEqual({
      replay: "hardware",
      "rota-de-vendas": "aplicativo",
      "fleet-analytics-bi": "aplicativo",
      "placar-conectado": "hardware",
      "agenda-de-quadras": "aplicativo",
      "site-clinicas": "site",
      "totem-check-in": "hardware",
      "estoque-oficinas": "aplicativo",
      "vitrine-lojas": "site",
      "contador-de-fluxo": "hardware",
    });
  });

  it("só os 7 inventados têm ficticio: true; todos têm fase desenvolvimento", () => {
    for (const item of CATALOGO) {
      if (REAIS.includes(item.slug)) {
        expect(item.ficticio, item.slug).toBeUndefined();
      } else {
        expect(item.ficticio, item.slug).toBe(true);
        expect(item.fase, item.slug).toBe("desenvolvimento");
      }
    }
    expect(CATALOGO.filter((i) => i.ficticio)).toHaveLength(7);
  });

  it("as fases dos reais são piloto, piloto e emUso", () => {
    expect(REAIS.map((slug) => porSlug(slug).fase)).toEqual(["piloto", "piloto", "emUso"]);
  });

  it("a fase dos aplicativos reais vem do status do projeto em landingContent (uma fonte só)", async () => {
    // O Rota de Vendas sai do piloto em landing.ts: o selo do catálogo acompanha.
    vi.resetModules();
    vi.doMock("./landing", async (importOriginal) => {
      const original = await importOriginal<typeof import("./landing")>();
      const projects = original.landingContent.aplicativos.projects.map((p) =>
        p.slug === "rota-de-vendas" ? { ...p, status: "emUso" as const } : p.slug === "fleet-analytics-bi" ? { ...p, status: "piloto" as const } : p,
      );
      return {
        ...original,
        landingContent: { ...original.landingContent, aplicativos: { ...original.landingContent.aplicativos, projects } },
      };
    });
    try {
      const { CATALOGO: outro } = await import("./catalogo");
      const fase = (slug: string) => outro.find((i) => i.slug === slug)?.fase;
      expect(fase("rota-de-vendas")).toBe("emUso");
      expect(fase("fleet-analytics-bi")).toBe("piloto");
    } finally {
      vi.doUnmock("./landing");
      vi.resetModules();
    }
  });

  it("os reais reaproveitam nome e vídeo do landingContent (mesma referência); a frase só no Rota de Vendas", () => {
    const replayItem = porSlug("replay");
    const rotaItem = porSlug("rota-de-vendas");
    const fleetItem = porSlug("fleet-analytics-bi");
    expect(replayItem.nome).toBe(landingContent.produtos.replay.name);
    expect(replayItem.painel.video).toBe(landingContent.produtos.replay.video);
    // ADR-009: o replay é sempre identificado como ilustração do conceito.
    expect(replayItem.seloConceito).toBe(landingContent.produtos.replay.illustrationBadge);
    expect(replayItem.seloConceito).toBe("Ilustração do conceito");
    expect(CATALOGO.filter((i) => i.seloConceito).map((i) => i.slug)).toEqual(["replay"]);
    expect(rotaItem.nome).toBe(rota.name);
    expect(rotaItem.painel.video).toBe(rota.video);
    expect(rotaItem.frase).toBe(rota.summary);
    expect(fleetItem.nome).toBe(fleet.name);
    expect(fleetItem.painel.video).toBe(fleet.video);
    // O resumo do Fleet (137 caracteres) passa do limite da §5.3.
    expect(fleetItem.frase).not.toBe(fleet.summary);
  });

  it("os benefícios do Rota de Vendas partem dos destaques que já existem", () => {
    const leads = (rota.highlights ?? []).map((h) => h.lead.replace(/\.$/, ""));
    for (const beneficio of porSlug("rota-de-vendas").painel.beneficios) {
      expect(leads.some((lead) => beneficio.startsWith(lead)), beneficio).toBe(true);
    }
  });

  it("o link do site: o do replay vem do landingContent; os outros não têm", () => {
    expect(porSlug("replay").siteUrl).toBe(landingContent.produtos.replay.siteUrl);
    for (const item of CATALOGO.slice(1)) expect(item.siteUrl, item.slug).toBeNull();
  });

  it("só os 3 reais têm vídeo no painel; os inventados mostram a arte grande", () => {
    for (const item of CATALOGO) {
      if (REAIS.includes(item.slug)) expect(item.painel.video, item.slug).toBeDefined();
      else expect(item.painel.video, item.slug).toBeUndefined();
    }
  });

  it("respeita os limites de texto da §5.3", () => {
    for (const { slug, frase, painel } of CATALOGO) {
      expect(frase.length, `${slug}: frase`).toBeLessThanOrEqual(110);
      expect(painel.paraQuem.length, `${slug}: para quem é`).toBeLessThanOrEqual(140);
      expect(painel.beneficios.length, `${slug}: benefícios`).toBeGreaterThanOrEqual(3);
      expect(painel.beneficios.length, `${slug}: benefícios`).toBeLessThanOrEqual(4);
      for (const b of painel.beneficios) expect(b.length, `${slug}: ${b}`).toBeLessThanOrEqual(70);
      expect(painel.comoFunciona).toHaveLength(3);
      for (const passo of painel.comoFunciona) {
        expect(passo.titulo.length, `${slug}: ${passo.titulo}`).toBeLessThanOrEqual(30);
        expect(passo.texto.length, `${slug}: ${passo.texto}`).toBeLessThanOrEqual(90);
      }
    }
  });

  it("interesse: hardware replay→replay, aplicativo→aplicativo, site e outros hardwares→outro", () => {
    for (const item of CATALOGO) {
      const esperado = item.slug === "replay" ? "replay" : item.tipo === "aplicativo" ? "aplicativo" : "outro";
      expect(item.interesse, item.slug).toBe(esperado);
    }
  });

  it("3 telas por item em /catalogo/<slug>/tela-N.svg; moldura navegador só para sites; alt contém 'ilustrativa'", () => {
    for (const { slug, tipo, painel } of CATALOGO) {
      expect(painel.telas.map((t) => t.src)).toEqual([1, 2, 3].map((n) => `/catalogo/${slug}/tela-${n}.svg`));
      for (const tela of painel.telas) {
        expect(tela.moldura, slug).toBe(tipo === "site" ? "navegador" : "celular");
        expect(tela.alt, slug).toContain("ilustrativa");
      }
    }
  });

  it("arte.base é /catalogo/<slug>/cartao; loop só nos 3 reais, com webm e mp4", () => {
    for (const { slug, arte } of CATALOGO) {
      expect(arte.base).toBe(`/catalogo/${slug}/cartao`);
      expect(arte.alt, slug).toMatch(/\S/);
      if (REAIS.includes(slug)) {
        expect(arte.loop).toEqual({
          webm: `/catalogo/${slug}/cartao-loop.webm`,
          mp4: `/catalogo/${slug}/cartao-loop.mp4`,
        });
      } else {
        expect(arte.loop, slug).toBeUndefined();
      }
    }
  });

  it("nenhum texto tem a marca de dado pendente nem vem vazio", () => {
    for (const item of CATALOGO) {
      for (const texto of textos(item)) {
        expect(texto, item.slug).toMatch(/\S/);
        expect(texto, item.slug).not.toContain(PLACEHOLDER);
      }
    }
    expect(JSON.stringify(catalogoUi)).not.toContain(PLACEHOLDER);
  });

  it("nada fala de 4G (o replay usa o Wi-Fi da arena)", () => {
    expect(JSON.stringify(CATALOGO)).not.toMatch(/\b4G\b/);
  });
});

describe("catalogoUi", () => {
  it("tem um rótulo por filtro e por tipo, e os modelos com as variáveis certas", () => {
    expect(Object.keys(catalogoUi.filtros)).toEqual(["todos", "hardware", "aplicativo", "site"]);
    expect(Object.keys(catalogoUi.tipos)).toEqual(["hardware", "aplicativo", "site"]);
    expect(catalogoUi.posicao).toBe("{i} de {n}: {nome}");
    expect(catalogoUi.irPara).toBe("Ir para {nome}");
  });
});
