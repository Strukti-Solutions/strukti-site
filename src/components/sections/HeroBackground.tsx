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

export function HeroBackground({ children }: HeroBackgroundProps) {
  const narrow = useNarrowViewport();
  const Visual = HERO_VISUALS[siteConfig.heroVisual];

  return (
    <div className="relative isolate min-h-[92svh] w-full overflow-hidden md:min-h-[720px]">
      <Visual narrow={narrow} />
      <div className="relative z-10 flex h-full min-h-[92svh] items-start px-6 pt-14 sm:px-10 md:min-h-[720px] md:items-center md:pt-0 lg:px-20">
        <div className="max-w-[34rem]">{children}</div>
      </div>
    </div>
  );
}
