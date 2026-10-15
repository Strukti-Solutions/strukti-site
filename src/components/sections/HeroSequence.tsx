import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { HeroObjetos3D } from "./HeroObjetos3D";

/**
 * Hero "estudio" (MASTER §9.7): o texto aprovado da abertura ao lado dos
 * dois objetos 3D que flutuam (aplicativos e hardware) — docs/superpowers/
 * specs/2026-10-15-hero-triangulo-3d-design.md. Substitui o palco em
 * sequência de quadros (`HeroSequenceScroller`, mantido no repositório sem
 * uso, para referência/rollback).
 */
export function HeroSequence() {
  const { eyebrow, headline, body, primaryCta, whatsappCta } = landingContent.heroEstudio;

  return (
    <section id="inicio" className="hero-objetos-secao surface-space" aria-labelledby="hero-title" data-hides-fab="">
      <div className="hero-objetos-secao__texto">
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
      <HeroObjetos3D />
    </section>
  );
}
