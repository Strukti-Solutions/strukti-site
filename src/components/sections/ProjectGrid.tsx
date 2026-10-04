"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type Ref } from "react";
import type { Project } from "@/content/landing";
import { Palco } from "@/components/ui/Palco";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { pauseOtherVideos } from "@/lib/videoCoordination";

/** Quantos cartões a grade mostra antes do botão "Mostrar mais projetos". */
export const PROJECT_GRID_STEP = 6;

interface ProjectGridLabels {
  showMore: string;
  /** Nome acessível do botão de reproduzir; `{nome}` vira o nome do projeto. */
  playLabel: string;
}

interface ProjectGridProps {
  projects: readonly Project[];
  labels: ProjectGridLabels;
  descriptionLinkLabel: string;
}

/**
 * Grade dos aplicativos (MASTER §8.8): parede de cartões, cada um com o
 * pôster 16:9 do app num palco (MASTER §8.13) e o nome em H3, sob o H2 da
 * seção. O vídeo só carrega quando a pessoa clica em reproduzir — o pôster dá
 * lugar ao player no mesmo lugar, tocando, com o foco nele — e só um toca
 * por vez. Com mais de 6 projetos, o restante aparece pelo botão "Mostrar
 * mais projetos", sem mudar de página, e o foco vai para o primeiro cartão
 * revelado.
 */
export function ProjectGrid({ projects, labels, descriptionLinkLabel }: ProjectGridProps) {
  const [expanded, setExpanded] = useState(false);
  const [playingSlug, setPlayingSlug] = useState<string | null>(null);
  const firstRevealedRef = useRef<HTMLButtonElement>(null);
  const focusRevealed = useRef(false);

  const visible = expanded ? projects : projects.slice(0, PROJECT_GRID_STEP);
  const hiddenCount = projects.length - visible.length;
  // Layout para poucos projetos (MASTER §8.8): a parede nunca deixa coluna
  // vazia. 3 ou mais cartões: a grade (3 colunas ≥ 1024); 2: duas colunas;
  // 1: o cartão largo, com o pôster ao lado do texto (≥ 1024), para não
  // virar um pôster do tamanho do destaque.
  const wallClass = visible.length >= 3 ? "wall wall--3" : visible.length === 2 ? "wall wall--2" : "wall";
  const wide = visible.length === 1;

  useEffect(() => {
    if (expanded && focusRevealed.current) {
      focusRevealed.current = false;
      firstRevealedRef.current?.focus();
    }
  }, [expanded]);

  // Só um vídeo toca por vez na página (MASTER §8.8), inclusive o hero
  // "video", se estiver em uso. "play" não borbulha: ouvir na captura.
  useEffect(() => {
    const onPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) pauseOtherVideos(event.target);
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);

  return (
    <div className="portfolio__more">
      <ul className={wallClass}>
        {visible.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            playing={playingSlug === project.slug}
            onPlay={() => setPlayingSlug(project.slug)}
            playLabel={labels.playLabel.replace("{nome}", project.name)}
            playButtonRef={index === PROJECT_GRID_STEP ? firstRevealedRef : undefined}
            descriptionLinkLabel={descriptionLinkLabel}
            wide={wide}
          />
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          className="btn btn--outline"
          style={{ marginTop: "var(--space-6)" }}
          onClick={() => {
            focusRevealed.current = true;
            setExpanded(true);
          }}
        >
          {labels.showMore}
        </button>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  playing: boolean;
  onPlay: () => void;
  playLabel: string;
  playButtonRef?: Ref<HTMLButtonElement>;
  descriptionLinkLabel: string;
  /** Único cartão da grade: pôster ao lado do texto a partir de 1024 px. */
  wide: boolean;
}

function ProjectCard({
  project,
  playing,
  onPlay,
  playLabel,
  playButtonRef,
  descriptionLinkLabel,
  wide,
}: ProjectCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (playing) videoRef.current?.focus();
  }, [playing]);

  return (
    <li className={wide ? "project-card project-card--wide" : "project-card"}>
      {/* A tela do app no lugar do objeto, no palco (spec §3.3). */}
      <Palco className="project-card__palco">
        <div className="project-card__media">
          {playing ? (
            <video
              ref={videoRef}
              controls
              autoPlay
              preload="metadata"
              poster={project.video.poster}
              className="portfolio__video"
              aria-label={project.video.accessibleName}
            >
              <source src={project.video.src} type="video/mp4" />
            </video>
          ) : (
            <button
              ref={playButtonRef}
              type="button"
              className="project-card__play"
              onClick={onPlay}
              aria-label={playLabel}
            >
              <Image
                src={project.video.poster}
                alt=""
                fill
                sizes={
                  wide
                    ? "(min-width: 1024px) 700px, 100vw"
                    : "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                }
                unoptimized
              />
              <span className="project-card__play-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" focusable="false">
                  <path d="M6 3.5v13l10.5-6.5L6 3.5Z" fill="currentColor" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </Palco>
      <div className="project-card__body">
        {project.status && <SeloStatus status={project.status} />}
        <h3 className="block-title">{project.name}</h3>
        <p className="project-card__summary">{project.summary}</p>
        {project.platforms.length > 0 && (
          <ul className="tags">
            {project.platforms.map((platform) => (
              <li key={platform}>{platform}</li>
            ))}
          </ul>
        )}
        <div className="portfolio__meta">
          <p className="caption">{project.video.caption}</p>
          <details>
            <summary>{descriptionLinkLabel}</summary>
            <p>{project.video.description}</p>
          </details>
        </div>
      </div>
    </li>
  );
}
