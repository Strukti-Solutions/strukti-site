"use client";

import { useEffect, useRef } from "react";
import { useCanAnimate } from "@/lib/motion";
import { isAnyOtherVideoPlaying } from "@/lib/videoCoordination";

/** O loop toca uma vez e para (WCAG 2.2.2: nada se move sozinho por mais de 5 s). */
const DURACAO_MS = 5000;

interface CartaoLoopProps {
  loop: { webm: string; mp4: string };
  /** O quadro 0 do loop, que é a própria arte do cartão (§6.2). */
  poster: string;
  /** No centro (ou com o mouse ou o foco), com a seção na tela e o painel fechado. */
  ativo: boolean;
}

/**
 * O loop de 5 s dos 3 produtos reais (spec 2026-10-16, §6.2, §7 e §9). O
 * `<video>` só existe enquanto o cartão está ativo e há movimento: sem isso,
 * fica a arte (e, com `preload="none"`, nada do vídeo carrega antes).
 *
 * Toca uma vez, sem o atributo `loop`, e não começa por cima de outro vídeo
 * que esteja tocando: o que a pessoa pôs para tocar ou o do hero (§9). No `ended` ou 5 s depois de começar a se mexer
 * (o `playing`), o que vier primeiro, pausa e volta ao quadro 0, que é igual
 * à arte. Ao perder o `ativo` (outro centro, o painel abrindo), para e sai.
 * A regra de um vídeo por vez fica com quem ouve o `play` na página (o
 * `CatalogoInterativo`). Decorativo como a arte: fora da árvore de
 * acessibilidade.
 */
export function CartaoLoop({ loop, poster, ativo }: CartaoLoopProps) {
  const animar = useCanAnimate();
  const mostrar = ativo && animar;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!mostrar || !video) return;
    // Sem som, sempre (a política de autoplay olha a propriedade).
    video.defaultMuted = true;
    video.muted = true;
    let limite: number | undefined;

    const parar = () => {
      window.clearTimeout(limite);
      video.pause();
      video.currentTime = 0;
    };
    // Conta uma vez só: um `playing` depois de uma pausa para carregar não
    // reinicia os 5 s.
    const contar = () => {
      video.removeEventListener("playing", contar);
      limite = window.setTimeout(parar, DURACAO_MS);
    };

    video.addEventListener("ended", parar);
    // Enfeite: não começa por cima de nenhum outro vídeo, nem do hero (§9),
    // que pararia (um por vez) e não voltaria a tocar enquanto à vista.
    if (!isAnyOtherVideoPlaying(video)) {
      video.addEventListener("playing", contar);
      // O navegador pode recusar (economia de energia, política): fica a arte.
      video.play()?.catch(() => {});
    }

    return () => {
      window.clearTimeout(limite);
      video.removeEventListener("ended", parar);
      video.removeEventListener("playing", contar);
      if (!video.paused) video.pause();
    };
  }, [mostrar]);

  if (!mostrar) return null;

  return (
    <video
      ref={videoRef}
      className="catalogo__loop"
      muted
      playsInline
      preload="none"
      poster={poster}
      aria-hidden="true"
    >
      <source src={loop.webm} type="video/webm" />
      <source src={loop.mp4} type="video/mp4" />
    </video>
  );
}
