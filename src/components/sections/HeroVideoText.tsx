"use client";

import { motion } from "motion/react";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useTapHover } from "@/lib/motion";

/**
 * Texto e botões do hero "video" (MASTER §9.6): o mesmo texto aprovado do
 * hero "classic", com o H1 semântico. Os dois botões são pílulas só aqui
 * (exceção da ADR-007): o WhatsApp verde, com o ícone, segue o de maior
 * destaque; o diagnóstico é de contorno, com a seta num círculo azul.
 */
export function HeroVideoText() {
  const { eyebrow, headline, body, primaryCta, secondaryCta, supportLine } = landingContent.hero;
  const tapHover = useTapHover();

  return (
    <div className="hero-video__text">
      <p className="hero-video__eyebrow">{eyebrow}</p>
      <h1 id="hero-title" className="hero-video__title">
        {headline}
      </h1>
      <p className="hero-video__body">{body}</p>
      <div className="hero-video__actions">
        <WhatsAppButton message={landingContent.whatsappMessages.general} className="btn--pill">
          {primaryCta}
        </WhatsAppButton>
        <motion.a href="#contato" className="btn btn--outline btn--pill btn--arrow" {...tapHover}>
          {secondaryCta}
          <span className="btn__arrow" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18" focusable="false">
              <path
                d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.a>
      </div>
      <p className="hero-video__support">{supportLine}</p>
    </div>
  );
}
