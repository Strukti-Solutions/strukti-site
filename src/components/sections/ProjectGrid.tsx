"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type Ref } from "react";
import type { Project } from "@/content/landing";

/** Quantos cartões a grade mostra antes do botão "Mostrar mais projetos". */
export const PROJECT_GRID_STEP = 6;

interface ProjectGridLabels {
  title: string;
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
 * Grade de projetos do portfólio (MASTER §8.8): parede de cartões com pôster
 * 16:9. O vídeo só carrega quando a pessoa clica em reproduzir — o pôster dá
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
  // Colunas pelo tanto de cartões visíveis: com menos de 3, "wall--3" deixa
  // coluna(s) vazia(s) na parede (painel escuro ao lado do cartão).
  const wallClass = visible.length >= 3 ? "wall wall--3" : visible.length === 2 ? "wall wall--2" : "wall";

  useEffect(() => {
    if (expanded && focusRevealed.current) {
      focusRevealed.current = false;
      firstRevealedRef.current?.focus();
    }
  }, [expanded]);

  return (
    <div className="portfolio__more">
      <h3 className="block-title portfolio__more-title">{labels.title}</h3>
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
}

function ProjectCard({ project, playing, onPlay, playLabel, playButtonRef, descriptionLinkLabel }: ProjectCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (playing) videoRef.current?.focus();
  }, [playing]);

  return (
    <li className="project-card">
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
              sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
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
      <div className="project-card__body">
        <h4 className="block-title">{project.name}</h4>
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
