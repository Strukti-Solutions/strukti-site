import { BlackHoleHeroSection } from "@/components/ui/blackhole-hero-section";
import { HeroVisualStatic } from "./HeroVisualStatic";
import type { HeroVisualProps } from "./hero-visual";

/**
 * Disco de acreção na paleta da marca (MASTER §9.3): borda interna quase
 * branca tingida de ciano, corpo no ciano do logo (cyan-400) e borda externa
 * no azul do logo (electric-700), que se apaga no espaço. Sem laranja nem
 * roxo.
 */
const DISC_HOT = "#E9FDFF";
const DISC_MID = "#00D1D8";
const DISC_COOL = "#0166D2";

/**
 * Buraco negro como fundo do hero. Lado a lado (≥ 1024 px): buraco à
 * direita. Faixa (`narrow`, < 1024 px): buraco na faixa reservada embaixo do
 * texto, com menos passos por raio (desempenho). O véu é do design system
 * (HeroBackground), por isso `scrim="none"`; sem estrelas (clichê e compete
 * com o texto). O componente já congela num quadro com reduced motion e
 * para fora da tela ou com a aba oculta.
 *
 * O canvas entra em `mix-blend-mode: screen` (globals.css): o céu quase preto
 * do shader vira a cor do espaço. HeroVisualStatic fica por baixo, escondido;
 * se o WebGL faltar ou falhar, o componente marca `data-webgl` e o CSS mostra
 * o visual estático inteiro.
 */
export function HeroVisualBlackhole({ narrow }: HeroVisualProps) {
  return (
    <div className="hero-blackhole">
      <HeroVisualStatic />
      <BlackHoleHeroSection
        className="hero-blackhole__canvas"
        focus={narrow ? [0.5, 0.84] : [0.76, 0.48]}
        scrim="none"
        starBrightness={0}
        distance={24}
        elevation={narrow ? -7 : -5.5}
        fov={narrow ? 72 : 42}
        glow={narrow ? 0.7 : 0.8}
        steps={narrow ? 180 : 300}
        resolution={narrow ? 0.6 : 0.7}
        maxDpr={narrow ? 1.25 : 1.5}
        hotColor={DISC_HOT}
        midColor={DISC_MID}
        coolColor={DISC_COOL}
      />
    </div>
  );
}
