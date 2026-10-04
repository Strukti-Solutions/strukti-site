import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { HeroSequenceScroller } from "./HeroSequenceScroller";

/** Hero "estudio" (MASTER §9.7): texto aprovado à esquerda, produto no palco à direita. */
export function HeroSequence() {
  const { eyebrow, headline, body, primaryCta, whatsappCta, illustrationBadge } = landingContent.heroEstudio;

  return (
    <HeroSequenceScroller
      badge={illustrationBadge}
      text={
        <div className="hero-estudio__text">
          <p className="hero-estudio__eyebrow">{eyebrow}</p>
          <h1 id="hero-title" className="hero-estudio__title">
            {headline}
          </h1>
          <p className="lead">{body}</p>
          <div className="hero-estudio__actions">
            <a href="#produtos" className="btn btn--primary">
              {primaryCta}
            </a>
            <WhatsAppButton message={landingContent.whatsappMessages.general}>{whatsappCta}</WhatsAppButton>
          </div>
        </div>
      }
    />
  );
}
