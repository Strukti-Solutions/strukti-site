"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { useCanAnimate } from "@/lib/motion";
import {
  CELULAR_MAX_WIDTH,
  frameForProgress,
  frameUrl,
  nearestLoadedFrame,
  pickFrameSet,
  posterUrl,
  sectionProgress,
} from "@/lib/heroSequence";

/** Mais que isto de quadros com erro (ex.: navegador sem AVIF) e o hero fica no pôster. */
const MAX_FAILED_RATIO = 0.1;

/** `navigator.connection.saveData`: a pessoa pediu para economizar dados. */
function prefersSavingData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Hero "estudio" (MASTER §9.7): o pôster (quadro 0) vem no HTML; depois de
 * montar, sem reduced motion e sem "economizar dados", a seção ganha a
 * altura de rolagem (data-scrub) e o canvas desenha o quadro que a rolagem
 * pede. O servidor e o 1º render do cliente são iguais (data-scrub="false",
 * ADR-004). O conjunto de quadros é escolhido uma vez, ao montar: girar a
 * tela não baixa tudo de novo (o canvas usa object-fit: cover).
 */
export function HeroSequenceScroller({ text, badge }: { text: ReactNode; badge: string }) {
  const canAnimate = useCanAnimate();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrub, setScrub] = useState(false);
  const desktop = siteConfig.heroSequence.desktop;

  useEffect(() => {
    if (!canAnimate || prefersSavingData()) return;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!section || !canvas || !context) return;

    const set = pickFrameSet(window.innerWidth);
    const { frames: total, width, height } = siteConfig.heroSequence[set];
    canvas.width = width;
    canvas.height = height;

    const images: HTMLImageElement[] = [];
    const loaded: boolean[] = new Array(total).fill(false);
    let failed = 0;
    let cancelled = false;
    let drawn: number | null = null;
    // Há desenho agendado? Uma flag, e não o id: se o requestAnimationFrame
    // chamar o callback antes de devolver o id (o stub do teste faz isso),
    // `rafId = requestAnimationFrame(draw)` guardaria o id depois de o
    // callback zerá-lo, e nenhuma rolagem seguinte agendaria de novo.
    let scheduled = false;
    let rafId = 0;

    const draw = () => {
      scheduled = false;
      // Depois de desistir (quadros falharam), o hero fica no pôster.
      if (cancelled) return;
      const rect = section.getBoundingClientRect();
      const target = frameForProgress(sectionProgress(rect.top, rect.height, window.innerHeight), total);
      const index = nearestLoadedFrame(loaded, target);
      if (index === null || index === drawn) return;
      const image = images[index];
      if (!image) return;
      context.drawImage(image, 0, 0, width, height);
      drawn = index;
      canvas.dataset.frame = String(index);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      rafId = requestAnimationFrame(draw);
    };

    const load = () => {
      for (let index = 0; index < total; index++) {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          if (cancelled) return;
          loaded[index] = true;
          schedule();
        };
        image.onerror = () => {
          if (cancelled) return;
          failed += 1;
          if (failed > total * MAX_FAILED_RATIO) {
            cancelled = true;
            delete canvas.dataset.frame;
            setScrub(false);
          }
        };
        image.src = frameUrl(set, index);
        images[index] = image;
      }
    };

    setScrub(true);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Os quadros só baixam depois da página: o pôster continua sendo o LCP.
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", load);
      if (scheduled) cancelAnimationFrame(rafId);
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
      delete canvas.dataset.frame;
      setScrub(false);
    };
  }, [canAnimate]);

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="hero-estudio surface-space"
      aria-labelledby="hero-title"
      data-scrub={scrub ? "true" : "false"}
      data-hides-fab=""
    >
      <div className="hero-estudio__sticky">
        <div className="container hero-estudio__grid">
          {text}
          <div className="palco hero-estudio__palco">
            <div className="palco__luz" aria-hidden="true" />
            <picture>
              <source media={`(max-width: ${CELULAR_MAX_WIDTH}px)`} type="image/avif" srcSet={posterUrl("celular", "avif")} />
              <source media={`(max-width: ${CELULAR_MAX_WIDTH}px)`} type="image/jpeg" srcSet={posterUrl("celular", "jpg")} />
              <source type="image/avif" srcSet={posterUrl("desktop", "avif")} />
              <img
                className="hero-estudio__poster"
                src={posterUrl("desktop", "jpg")}
                alt=""
                width={desktop.width}
                height={desktop.height}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <canvas ref={canvasRef} className="hero-estudio__canvas" aria-hidden="true" />
            <p className="selo selo--ilustracao">{badge}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
