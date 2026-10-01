import { siteConfig } from "@/config/site";
import { HeroVideoBackground, HeroVideoProvider, HeroVideoToggle } from "./HeroVideoMedia";
import { HeroVideoText } from "./HeroVideoText";
import { HeroWordmark } from "./HeroWordmark";

/**
 * Hero "video" (MASTER §9.6), implementação própria (ADR-005) no estilo
 * pedido pelo cliente: vídeo de fundo numa moldura com margem de espaço,
 * grão e véu do DS por cima, a palavra "Strukti" gigante e o texto aprovado.
 * Pilha de camadas: base → visual (pôster/vídeo) → grão → véu → conteúdo →
 * controle do vídeo. O véu é do DS e garante o AA do texto em qualquer quadro.
 */
export function HeroVideo() {
  const video = siteConfig.heroVideo;

  return (
    <section id="inicio" className="hero-video surface-space" aria-labelledby="hero-title" data-hides-fab="">
      <HeroVideoProvider>
        <div className="hero-video__frame">
          <div className="hero-video__visual" aria-hidden="true">
            {video && <HeroVideoBackground video={video} />}
            <div className="hero-video__grain" />
          </div>
          <div className="hero-video__veil" aria-hidden="true" />
          <div className="container hero-video__content">
            <HeroWordmark />
            <HeroVideoText />
          </div>
          {video && <HeroVideoToggle />}
        </div>
      </HeroVideoProvider>
    </section>
  );
}
