import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, within } from "@testing-library/react";
import type { HeroVariant } from "@/config/site";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import Home from "./page";

// Estrutura da home v3 (spec 2026-10-03 §4). As âncoras rodam com as três
// versões do topo, como o page.axe.test.tsx: os heros "video" e "classic"
// seguem no código até a limpeza e também não podem apontar para uma seção
// que saiu da página.
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

/** Ordem das seções da spec §4 (a barra do topo e o rodapé ficam fora do <main>). */
const SECTION_ORDER = [
  "inicio",
  "produtos",
  "aplicativos",
  "sob-medida",
  "como-trabalhamos",
  "equipe",
  "contato",
  "duvidas",
];

describe("home v3 (hero estudio) — estrutura", () => {
  beforeEach(() => {
    heroVariant.current = "estudio";
  });

  it("tem as seções na ordem da spec e um único H1", () => {
    const { container } = render(<Home />);

    expect([...container.querySelectorAll("main > section[id]")].map((section) => section.id)).toEqual(SECTION_ORDER);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("o menu tem os quatro itens da v2.0, e cada um aponta para uma seção da página", () => {
    const { container } = render(<Home />);

    expect(landingContent.header.nav.map((item) => item.href)).toEqual(["#produtos", "#aplicativos", "#equipe", "#contato"]);
    for (const item of landingContent.header.nav) {
      expect(container.querySelector(`main > section${item.href}`)).not.toBeNull();
    }
  });

  it("a equipe mostra o curso de cada pessoa logo abaixo do nome", () => {
    const { container } = render(<Home />);
    const equipe = within(container.querySelector<HTMLElement>("#equipe")!);

    for (const member of siteConfig.team) {
      expect(member.course).toMatch(/\S/);
      const name = equipe.getByRole("heading", { level: 3, name: member.name });
      expect(name.nextElementSibling).not.toBeNull();
      expect(name.nextElementSibling?.textContent).toBe(member.course);
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
});

describe.each(["estudio", "video", "classic"] as const)("home (hero %s) — variante e âncoras", (variant) => {
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
});
