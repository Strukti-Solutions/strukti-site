import { siteConfig } from "@/config/site";
import { HeroVideoBackground, HeroVideoProvider, HeroVideoToggle } from "./HeroVideoMedia";
import { HeroVideoText } from "./HeroVideoText";
import { HeroWordmark } from "./HeroWordmark";

/**
 * Hero "video" (MASTER §9.6), implementação própria (ADR-005) no estilo
 * pedido pelo cliente: vídeo de fundo numa moldura com margem de espaço,
 * grão e véu do DS por cima, a palavra "Strukti" gigante e o texto aprovado.
 * Pilha de camadas, de baixo para cima: base → visual (pôster/vídeo, com
 * grão; no lado a lado, mascarado antes da coluna de texto) → véu →
 * conteúdo → controle do vídeo (por cima de tudo, mas antes do conteúdo no
 * DOM, para vir logo depois da barra no Tab). A máscara e o véu são do DS e
 * garantem o AA do texto em qualquer quadro.
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
          {/* Antes do texto no DOM: no Tab, o controle que para o movimento
              vem logo depois da barra (WCAG 2.2.2, técnica G4). */}
          {video && <HeroVideoToggle />}
          <div className="container hero-video__content">
            <HeroWordmark />
            <HeroVideoText />
          </div>
        </div>
      </HeroVideoProvider>
    </section>
  );
}
