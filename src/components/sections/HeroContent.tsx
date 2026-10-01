"use client";

import { motion } from "motion/react";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useTapHover } from "@/lib/motion";

/**
 * Texto e botões do hero. Sem fundo próprio — fica por cima de qualquer peça
 * visual escolhida em HeroBackground, por isso as cores aqui já contam com um
 * fundo escuro (ver README, "Como trocar o visual do hero"). Trocar o visual
 * não mexe neste componente.
 */
export function HeroContent() {
  const { eyebrow, headline, body, primaryCta, secondaryCta, supportLine } = landingContent.hero;
  const tapHover = useTapHover();

  return (
    <>
      <p style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, marginBottom: "0.75rem" }}>
        {eyebrow}
      </p>
      <h1
        id="hero-title"
        style={{
          fontSize: "2.25rem",
          lineHeight: 1.15,
          margin: "0 0 1rem",
          color: "#ffffff",
        }}
      >
        {headline}
      </h1>
      <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", margin: "0 0 2rem" }}>
        {body}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <WhatsAppButton message={landingContent.whatsappMessages.general}>
          {primaryCta}
        </WhatsAppButton>
        <motion.a
          href="#diagnostico"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.85rem 1.5rem",
            borderRadius: "999px",
            border: "2px solid rgba(255,255,255,0.55)",
            color: "#ffffff",
            fontWeight: 600,
            textDecoration: "none",
            minHeight: "48px",
          }}
          {...tapHover}
        >
          {secondaryCta}
        </motion.a>
      </div>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem" }}>{supportLine}</p>
    </>
  );
}
