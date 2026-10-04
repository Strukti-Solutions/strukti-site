"use client";

import { motion } from "motion/react";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useTapHover } from "@/lib/motion";

/**
 * Texto e botões do hero. Sem fundo próprio — fica por cima de qualquer peça
 * visual escolhida em HeroBackground; o véu do design system garante o
 * contraste (MASTER §9). Trocar o visual não mexe neste componente.
 */
export function HeroContent() {
  const { eyebrow, headline, body, primaryCta, secondaryCta, supportLine } = landingContent.hero;
  const tapHover = useTapHover();

  return (
    <div className="hero__text">
      <p className="hero__eyebrow">{eyebrow}</p>
      <h1 id="hero-title" className="display">
        {headline}
      </h1>
      <p className="lead hero__body">{body}</p>
      <div className="hero__actions">
        <WhatsAppButton message={landingContent.whatsappMessages.general}>{primaryCta}</WhatsAppButton>
        <motion.a href="#contato" className="btn btn--outline" {...tapHover}>
          {secondaryCta}
        </motion.a>
      </div>
      <p className="hero__support">{supportLine}</p>
    </div>
  );
}
