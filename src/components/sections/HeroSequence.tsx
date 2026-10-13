import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { HeroSequenceScroller } from "./HeroSequenceScroller";

/**
 * Hero "estudio" (MASTER §9.7): o produto em tela inteira e, por cima, o texto
 * aprovado da abertura e os passos do replay ("Como funciona", que saíram do
 * cartão do replay em Produtos para não repetir).
 */
export function HeroSequence() {
  const { eyebrow, headline, body, primaryCta, secondaryLink, illustrationBadge } = landingContent.heroEstudio;

  return (
    <HeroSequenceScroller
      badge={illustrationBadge}
      stepsTitle=""
      steps={[]}
      opening={
        <>
          <p className="hero-estudio__eyebrow">{eyebrow}</p>
          <h1 id="hero-title" className="hero-estudio__title">
            {headline}
          </h1>
          <p className="lead">{body}</p>
          <div className="hero-estudio__actions">
            <WhatsAppButton message={landingContent.whatsappMessages.replay}>{primaryCta}</WhatsAppButton>
            <a href="#replay" className="hero-estudio__link">
              {secondaryLink}
            </a>
          </div>
        </>
      }
    />
  );
}
