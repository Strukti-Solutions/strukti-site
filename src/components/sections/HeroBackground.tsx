"use client";

import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { useNarrowViewport } from "@/lib/viewport";
import { HeroVisualBlackhole } from "./HeroVisualBlackhole";
import { HeroVisualStatic } from "./HeroVisualStatic";
import type { HeroVisual } from "@/config/site";
import type { HeroVisualComponent } from "./hero-visual";

/**
 * Registro das peças de fundo do hero. Trocar o visual em uso é mudar
 * `siteConfig.heroVisual` (uma linha, em src/config/site.ts); um visual novo
 * é um componente que implemente HeroVisualProps (ver hero-visual.ts) mais
 * uma entrada aqui. Em nenhum dos dois casos o HeroContent ou o resto da
 * página mudam. Ver README, "Como trocar o visual do hero".
 */
const HERO_VISUALS: Record<HeroVisual, HeroVisualComponent> = {
  blackhole: HeroVisualBlackhole,
  static: HeroVisualStatic,
};

interface HeroBackgroundProps {
  children: ReactNode;
}

/**
 * Pilha de camadas do hero (design-system/strukti-solucoes/MASTER.md, §9.1).
 * Só a camada do visual é trocável; a base (navy-950), o fade e o véu são do
 * design system, por isso o contraste do texto e o fundo do resto da página
 * não dependem do visual escolhido. A composição (lado a lado ≥ 1024 px,
 * faixa embaixo abaixo disso) está em globals.css, seção "Hero".
 */
export function HeroBackground({ children }: HeroBackgroundProps) {
  const narrow = useNarrowViewport();
  const Visual = HERO_VISUALS[siteConfig.heroVisual];

  return (
    <div className="hero">
      <div className="hero__visual" aria-hidden="true">
        <Visual narrow={narrow} />
      </div>
      <div className="hero__veil" aria-hidden="true" />
      <div className="container hero__content">{children}</div>
    </div>
  );
}
