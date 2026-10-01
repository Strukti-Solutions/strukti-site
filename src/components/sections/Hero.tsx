import { HeroBackground } from "./HeroBackground";
import { HeroContent } from "./HeroContent";

export function Hero() {
  return (
    <section id="inicio" className="surface-space" aria-labelledby="hero-title">
      <HeroBackground>
        <HeroContent />
      </HeroBackground>
    </section>
  );
}
