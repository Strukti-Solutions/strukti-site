import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import type { HeroVariant } from "@/config/site";
import Home from "./page";

// Roda com as três versões do topo (siteConfig.heroVariant): "estudio", o
// padrão, e "video" e "classic", que seguem no código (revisão HR1 da Crivo).
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

describe.each(["estudio", "video", "classic"] as const)("página inicial (hero %s) — acessibilidade", (variant) => {
  beforeEach(() => {
    heroVariant.current = variant;
  });

  it("não tem violações detectáveis pelo axe-core", async () => {
    const { container } = render(<Home />);

    // Confere que a versão pedida é a que renderizou.
    expect(container.querySelector(variant === "classic" ? "header.site-header" : "header.topbar")).not.toBeNull();

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  }, 20_000);
});
