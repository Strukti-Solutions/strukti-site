import { HeroBackground } from "./HeroBackground";
import { HeroContent } from "./HeroContent";

export function Hero() {
  return (
    <section id="inicio" className="surface-space" aria-labelledby="hero-title" data-hides-fab="">
      <HeroBackground>
        <HeroContent />
      </HeroBackground>
    </section>
  );
}
