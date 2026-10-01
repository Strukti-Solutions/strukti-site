"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { landingContent } from "@/content/landing";
import { ScrollTiltCard } from "@/components/ui/scroll-tilt-card";
import { Reveal, RevealStaggerList, RevealStaggerItem } from "@/components/motion/Reveal";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { useTapHover } from "@/lib/motion";
import { pauseOtherVideos } from "@/lib/videoCoordination";

/**
 * Portfólio de vídeos (MASTER §8.8), na superfície "noite" (sala de
 * projeção). O projeto em destaque usa o cartão 3D da rolagem; os demais
 * formam a grade, que só aparece com dois projetos ou mais — com um projeto
 * só, não há grade vazia nem cartão fictício.
 */
export function OQueJaFizemos() {
  const { title, intro, projects, videoDescriptionLinkLabel, grid, closing, button } =
    landingContent.oQueJaConstruimos;
  const featured = projects.find((project) => project.featured) ?? projects[0];
  const others = projects.filter((project) => project !== featured);

  const tapHover = useTapHover();

  // Só um vídeo toca por vez na página (MASTER §8.8): o destaque, os
  // cartões da grade e o vídeo de fundo do hero dividem a mesma regra, mas
  // cada <video> toca sem saber dos outros. "play" não borbulha, então o
  // listener vai na captura, no documento inteiro (o hero fica em outra
  // seção).
  useEffect(() => {
    const onPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) pauseOtherVideos(event.target);
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);

  return (
    <section
      id="o-que-construimos"
      className="section surface-night"
      aria-labelledby="ojc-title"
      // Inclinado em 3D, o cartão projeta a borda de baixo mais larga que a
      // coluna; `clip` corta isso sem criar rolagem horizontal na página.
      style={{ overflowX: "clip" }}
    >
      <div className="container">
        {featured && (
          <>
            <ScrollTiltCard
              title={
                <>
                  <h2 id="ojc-title" className="section-title">
                    {title}
                  </h2>
                  <p className="lead" style={{ marginTop: "var(--space-4)" }}>
                    {intro}
                  </p>
                  <h3 className="block-title portfolio__video-title">{featured.videoTitle}</h3>
                </>
              }
            >
              <video
                controls
                preload="none"
                poster={featured.video.poster}
                className="portfolio__video"
                aria-label={featured.video.accessibleName}
                // O botão flutuante do WhatsApp some enquanto o vídeo está na
                // tela (FloatingWhatsApp.tsx, MASTER §8.12).
                data-hides-fab=""
              >
                <source src={featured.video.src} type="video/mp4" />
              </video>
            </ScrollTiltCard>

            <Reveal className="portfolio__meta">
              <p className="caption">{featured.video.caption}</p>
              <details>
                <summary>{videoDescriptionLinkLabel}</summary>
                <p>{featured.video.description}</p>
              </details>
            </Reveal>

            {featured.highlights && featured.highlights.length > 0 && (
              <RevealStaggerList className="highlights">
                {featured.highlights.map((item) => (
                  <RevealStaggerItem key={item.lead}>
                    <strong>{item.lead}</strong> {item.rest}
                  </RevealStaggerItem>
                ))}
              </RevealStaggerList>
            )}
          </>
        )}

        <Reveal className="section-actions">
          <p className="body-muted" style={{ maxWidth: "62ch" }}>
            {closing}
          </p>
          <motion.a href="#diagnostico" className="btn btn--primary" {...tapHover}>
            {button}
          </motion.a>
        </Reveal>

        {others.length > 0 && (
          <ProjectGrid projects={others} labels={grid} descriptionLinkLabel={videoDescriptionLinkLabel} />
        )}
      </div>
    </section>
  );
}
