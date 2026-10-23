import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { HeroVariant } from "@/config/site";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { CATALOGO } from "@/content/catalogo";
import Home from "./page";

// Estrutura da home na v2.2 do texto (prévia aprovada para homologação em 13/10/2026):
// 7 capítulos até o Contato, com Dúvidas antes dele e os 3 produtos numa seção só,
// com o hero "expansao" (o padrão desde 15/10/2026), o "estudio" (o hero de
// marca da v2.2) e o "notebook" (o protótipo da entrada pelo notebook, que usa
// o mesmo texto do "expansao"). (Antes: spec 2026-10-03 §4.) As âncoras rodam
// com as cinco versões do topo, como o page.axe.test.tsx: os heros "video" e "classic"
// seguem no código até a limpeza e também não podem apontar para uma seção
// que saiu da página.
const heroVariant = vi.hoisted(() => ({ current: "expansao" as HeroVariant }));
vi.mock("@/config/site", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/site")>();
  return {
    ...actual,
    siteConfig: new Proxy(actual.siteConfig, {
      get: (target, key) => (key === "heroVariant" ? heroVariant.current : Reflect.get(target, key)),
    }),
  };
});

/** Marcação de dado pendente, montada em partes (o check:placeholders procura o literal). */
const PENDENTE = ["[A", "PREENCHER"].join(" ");

/** Ordem das seções da v2.2 (a barra do topo e o rodapé ficam fora do <main>). */
const SECTION_ORDER = ["inicio", "produtos", "sob-medida", "como-trabalhamos", "equipe", "duvidas", "contato"];

describe.each(["expansao", "estudio", "notebook"] as const)("home v3 (hero %s) — estrutura", (variant) => {
  beforeEach(() => {
    heroVariant.current = variant;
  });

  it("tem as seções na ordem da spec e um único H1", () => {
    const { container } = render(<Home />);

    expect([...container.querySelectorAll("main > section[id]")].map((section) => section.id)).toEqual(SECTION_ORDER);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("o menu tem Produtos, Equipe e Contato, e cada item (e cada produto do menu Produtos) aponta para algo da página", () => {
    const { container } = render(<Home />);

    expect(landingContent.header.nav.map((item) => item.href)).toEqual(["#produtos", "#equipe", "#contato"]);
    for (const item of landingContent.header.nav) {
      expect(container.querySelector(`main ${item.href}`)).not.toBeNull();
    }
    for (const item of CATALOGO) {
      expect(container.querySelector(`main #${item.slug}`)).not.toBeNull();
    }
  });

  it("nenhuma marcação de dado pendente aparece na página", () => {
    const { container } = render(<Home />);

    expect(container.textContent).not.toContain(PENDENTE);
    expect(container.querySelector("mark.rascunho")).toBeNull();
  });

  it("a equipe mostra o curso logo abaixo do nome só quando o dado existe (sem marcação de rascunho)", () => {
    const { container } = render(<Home />);
    const equipe = within(container.querySelector<HTMLElement>("#equipe")!);

    for (const member of siteConfig.team) {
      const name = equipe.getByRole("heading", { level: 3, name: member.name });
      if (member.course.includes(PENDENTE)) {
        expect(name.nextElementSibling).toBeNull();
      } else {
        expect(name.nextElementSibling?.textContent).toBe(member.course);
      }
    }
  });

  it("Como trabalhamos mostra as etapas da v2.0 numa lista ordenada", () => {
    const { container } = render(<Home />);
    const list = container.querySelector("#como-trabalhamos ol");

    expect(list).not.toBeNull();
    expect([...list!.querySelectorAll("li h3")].map((title) => title.textContent)).toEqual(
      landingContent.comoTrabalhamos.items.map((item) => item.title),
    );
  });

  it("os botões do hero levam a Produtos e ao WhatsApp com a mensagem geral", () => {
    const { container } = render(<Home />);
    const hero = within(container.querySelector<HTMLElement>("#inicio")!);
    const { primaryCta, whatsappCta } = variant === "estudio" ? landingContent.heroEstudio : landingContent.heroExpansao;

    expect(hero.getByRole("link", { name: primaryCta }).getAttribute("href")).toBe("#produtos");
    expect(hero.getByRole("link", { name: whatsappCta }).getAttribute("href")).toBe(
      siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general),
    );
  });

  it('as chamadas marcam o assunto no formulário: "Quero saber mais" do Rota de Vendas (catálogo) → aplicativo; "Contar o meu problema" → outro', () => {
    const { container } = render(<Home />);
    const select = screen.getByLabelText(landingContent.contato.form.fields.interest.label) as HTMLSelectElement;
    expect(select.value).toBe("");

    // O link fica no <details> do cartão (o painel sem JS), que a CSS esconde com JS.
    const rota = within(container.querySelector<HTMLElement>("#rota-de-vendas")!);
    fireEvent.click(rota.getByRole("link", { name: "Quero saber mais sobre Rota de Vendas", hidden: true }));
    expect(select.value).toBe("aplicativo");

    fireEvent.click(screen.getByRole("link", { name: landingContent.chamadaHardware.cta }));
    expect(select.value).toBe("outro");
  });
});

describe.each(["expansao", "estudio", "video", "classic", "notebook"] as const)("home (hero %s) — variante e âncoras", (variant) => {
  beforeEach(() => {
    heroVariant.current = variant;
  });

  it("o <main> diz qual variante do hero está em uso (o check:browser lê esse marcador)", () => {
    const { container } = render(<Home />);

    expect(container.querySelector("main")?.getAttribute("data-hero-variant")).toBe(variant);
  });

  it("todo link de âncora aponta para um id que existe na página", () => {
    const { container } = render(<Home />);
    const hrefs = [...container.querySelectorAll("a[href^='#']")].map((link) => link.getAttribute("href") ?? "");

    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((href) => href.length > 1 && !container.querySelector(href))).toEqual([]);
  });

  it("o hero (#inicio) é filho direto do <main> e esconde o WhatsApp flutuante (data-hides-fab)", () => {
    const { container } = render(<Home />);

    expect(container.querySelector("main > section#inicio")?.hasAttribute("data-hides-fab")).toBe(true);
  });

  it("o estacionamento e os passos do replay saíram do site (v2.2)", () => {
    const { container } = render(<Home />);

    expect(container.textContent).not.toMatch(/estacionamento/i);
    // "Como funciona" agora só existe no conteúdo de cada produto do catálogo.
    const foraDoCatalogo = [...container.querySelectorAll("main > section:not(#produtos)")];
    expect(foraDoCatalogo.filter((secao) => within(secao as HTMLElement).queryByText("Como funciona"))).toEqual([]);
  });
});
