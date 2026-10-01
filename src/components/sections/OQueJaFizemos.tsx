"use client";

import { motion } from "motion/react";
import { landingContent } from "@/content/landing";
import { ScrollTiltCard } from "@/components/ui/scroll-tilt-card";
import { Reveal, RevealStaggerList, RevealStaggerItem } from "@/components/motion/Reveal";
import { useTapHover } from "@/lib/motion";

export function OQueJaFizemos() {
  const {
    title,
    intro,
    highlights,
    videoTitle,
    videoAccessibleName,
    videoCaption,
    videoDescriptionLinkLabel,
    videoDescription,
    videoSrc,
    videoPoster,
    closing,
    button,
  } = landingContent.oQueJaConstruimos;

  const tapHover = useTapHover();

  return (
    <section id="o-que-construimos" className="section section--alt" aria-labelledby="ojc-title">
      <div className="container">
        <ScrollTiltCard
          title={
            <>
              <h2 id="ojc-title" className="section-title">
                {title}
              </h2>
              <p className="section-subtitle" style={{ marginInline: "auto" }}>
                {intro}
              </p>
              <h3 style={{ color: "var(--color-petrol-900)", marginTop: "0.5rem" }}>{videoTitle}</h3>
            </>
          }
        >
          <video
            controls
            preload="none"
            poster={videoPoster}
            className="h-full w-full rounded-2xl object-contain"
            style={{ backgroundColor: "#000" }}
            aria-label={videoAccessibleName}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </ScrollTiltCard>

        <Reveal style={{ marginBottom: "2.5rem" }}>
          <p
            style={{
              margin: "0 0 0.35rem",
              color: "var(--color-ink-muted)",
              fontSize: "0.9rem",
              maxWidth: "720px",
            }}
          >
            {videoCaption}
          </p>

          <details style={{ maxWidth: "720px" }}>
            <summary
              style={{
                cursor: "pointer",
                color: "var(--color-petrol-700)",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              {videoDescriptionLinkLabel}
            </summary>
            <p style={{ margin: "0.5rem 0 0", color: "var(--color-ink-muted)" }}>{videoDescription}</p>
          </details>
        </Reveal>

        <RevealStaggerList
          style={{
            listStyle: "none",
            margin: "0 0 2.5rem",
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {highlights.map((item) => (
            <RevealStaggerItem key={item.lead} style={{ color: "var(--color-ink-muted)" }}>
              <strong style={{ color: "var(--color-petrol-900)" }}>{item.lead}</strong> {item.rest}
            </RevealStaggerItem>
          ))}
        </RevealStaggerList>

        <Reveal>
          <p style={{ color: "var(--color-ink-muted)", maxWidth: "62ch", marginBottom: "1.5rem" }}>
            {closing}
          </p>
          <motion.a
            href="#diagnostico"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.85rem 1.5rem",
              borderRadius: "999px",
              backgroundColor: "var(--color-petrol-800)",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              minHeight: "48px",
            }}
            {...tapHover}
          >
            {button}
          </motion.a>
        </Reveal>
      </div>
    </section>
  );
}
