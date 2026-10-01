import { HeroBackground } from "./HeroBackground";
import { HeroContent } from "./HeroContent";

export function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-title">
      <HeroBackground>
        <HeroContent />
      </HeroBackground>
    </section>
  );
}
