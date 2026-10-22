"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content/landing";

interface VideoDemoProps {
  video: Project["video"];
  /** Nome do botão: "Assistir ao vídeo: {nome} ({duração})", já montado. */
  playLabel: string;
  /** `sizes` do pôster (o espaço que o vídeo ocupa na tela). */
  sizes: string;
  className?: string;
}

/**
 * Vídeo de demonstração que só toca no clique (MASTER §8.8; catálogo §3.2 e
 * §9): até lá, o pôster com o botão "Assistir", e nada do vídeo carrega. No
 * clique, o pôster dá lugar ao player tocando, com o foco nele. A regra de
 * um vídeo por vez fica com quem ouve o `play` na página (o catálogo).
 */
export function VideoDemo({ video, playLabel, sizes, className }: VideoDemoProps) {
  const [tocando, setTocando] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (tocando) videoRef.current?.focus();
  }, [tocando]);

  return (
    <div className={className ? `video-demo ${className}` : "video-demo"}>
      {tocando ? (
        <video
          ref={videoRef}
          controls
          autoPlay
          preload="metadata"
          poster={video.poster}
          className="video-demo__video catalogo__video"
          aria-label={video.accessibleName}
          // O foco vai para o player ao tocar: o `tabIndex` garante que ele
          // aceita o foco em todo navegador (nem todos tornam o <video
          // controls> focável), sem mudar a ordem de Tab.
          tabIndex={0}
        >
          <source src={video.src} type="video/mp4" />
        </video>
      ) : (
        <button type="button" className="video-demo__play" onClick={() => setTocando(true)} aria-label={playLabel}>
          <Image src={video.poster} alt="" fill sizes={sizes} unoptimized />
          <span className="video-demo__icone" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" focusable="false">
              <path d="M6 3.5v13l10.5-6.5L6 3.5Z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
