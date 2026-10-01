import { BlackHoleHeroSection } from "@/components/ui/blackhole-hero-section";
import { HeroVisualStatic } from "./HeroVisualStatic";
import type { HeroVisualProps } from "./hero-visual";

/**
 * Paleta da marca (logo) para o disco de acreção. O Nanquim pode ajustar
 * depois (design-system/, public/brand/).
 */
const DISC_HOT = "#E6FBFF";
const DISC_MID = "#00D1D8";
const DISC_COOL = "#0166D2";

/**
 * Buraco negro como fundo do hero. Desktop: buraco à direita, véu à esquerda.
 * Celular (`narrow`): buraco embaixo, véu em cima, e menos passos por raio
 * (desempenho). O H1 do hero não depende deste componente — ele é renderizado
 * pelo servidor, no HeroContent, por cima.
 *
 * HeroVisualStatic fica atrás, sempre: é o que aparece se o navegador não
 * tiver WebGL ou perder o contexto (o próprio BlackHoleHeroSection esconde o
 * canvas nesse caso e não pinta fundo nenhum).
 */
export function HeroVisualBlackhole({ narrow }: HeroVisualProps) {
  return (
    <div className="absolute inset-0 h-full w-full">
      <HeroVisualStatic />
      <BlackHoleHeroSection
        className="absolute inset-0"
        focus={narrow ? [0.5, 0.76] : [0.72, 0.46]}
        scrim={narrow ? "top" : "left"}
        scrimStrength={0.9}
        distance={24}
        elevation={narrow ? -7 : -5.5}
        fov={narrow ? 58 : 42}
        glow={narrow ? 0.85 : 1}
        steps={narrow ? 180 : 300}
        resolution={narrow ? 0.6 : 0.7}
        hotColor={DISC_HOT}
        midColor={DISC_MID}
        coolColor={DISC_COOL}
      />
    </div>
  );
}
