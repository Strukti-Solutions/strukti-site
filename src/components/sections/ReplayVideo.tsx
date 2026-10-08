"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ReplayVideoProps {
  video: {
    src: string;
    poster: string;
    accessibleName: string;
    playLabel: string;
  };
}

/**
 * Vídeo do replay no palco do cartão (no lugar do pôster 3D). Mesmo padrão
 * dos aplicativos (MASTER §8.8): o vídeo só carrega quando a pessoa clica em
 * reproduzir, o pôster dá lugar ao player tocando, com o foco nele, e a regra
 * de um vídeo por vez vale para ele também (ouvinte da grade de apps).
 */
export function ReplayVideo({ video }: ReplayVideoProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (playing) videoRef.current?.focus();
  }, [playing]);

  return (
    <div className="project-card__media">
      {playing ? (
        <video
          ref={videoRef}
          controls
          autoPlay
          preload="metadata"
          poster={video.poster}
          className="portfolio__video"
          aria-label={video.accessibleName}
        >
          <source src={video.src} type="video/mp4" />
        </video>
      ) : (
        <button type="button" className="project-card__play" onClick={() => setPlaying(true)} aria-label={video.playLabel}>
          <Image src={video.poster} alt="" fill sizes="(min-width: 1024px) 760px, 100vw" unoptimized />
          <span className="project-card__play-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" focusable="false">
              <path d="M6 3.5v13l10.5-6.5L6 3.5Z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
