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

export interface HeroStep {
  lead: string;
  rest: string;
}

interface HeroSequenceScrollerProps {
  /** A abertura (sobretítulo, H1, corpo e botões). */
  opening: ReactNode;
  /** "Como funciona" e os passos do replay (landingContent.produtos.replay). */
  stepsTitle: string;
  steps: readonly HeroStep[];
  badge: string;
}

/**
 * Hero "estudio" (MASTER §9.7). O quadro (pôster no HTML; depois, o canvas)
 * ocupa a 1ª tela e, por cima dele, vêm a abertura e, em seguida, "Como
 * funciona" e os passos. Depois de montar, sem reduced motion e sem
 * "economizar dados" (data-scrub="true"), o fundo fica preso na tela inteira,
 * os textos rolam por cima dele, só o bloco em foco aparece (data-active) e o
 * giro acompanha a faixa em que o fundo está preso. O servidor e o 1º render
 * do cliente são iguais (data-scrub="false", ADR-004). O conjunto de quadros
 * é escolhido uma vez, ao montar: girar a tela não baixa tudo de novo.
 */
export function HeroSequenceScroller({ opening, stepsTitle, steps, badge }: HeroSequenceScrollerProps) {
  const canAnimate = useCanAnimate();
  const sectionRef = useRef<HTMLElement>(null);
  const fundoRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrub, setScrub] = useState(false);
  const desktop = siteConfig.heroSequence.desktop;

  useEffect(() => {
    if (!canAnimate || prefersSavingData()) return;
    const section = sectionRef.current;
    const fundo = fundoRef.current;
    const area = areaRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!section || !fundo || !area || !canvas || !context) return;

    const set = pickFrameSet(window.innerWidth);
    const { frames: total, width, height } = siteConfig.heroSequence[set];
    canvas.width = width;
    canvas.height = height;

    // Blocos que entram em foco: a abertura e cada passo. O título "Como
    // funciona" acompanha os passos.
    const blocks = Array.from(section.querySelectorAll<HTMLElement>(".hero-estudio__bloco"));
    const stepsHeading = section.querySelector<HTMLElement>(".hero-estudio__como-titulo");

    const images: HTMLImageElement[] = [];
    const loaded: boolean[] = new Array(total).fill(false);
    let failed = 0;
    let cancelled = false;
    let drawn: number | null = null;
    let focused: number | null = null;
    // Há desenho agendado? Uma flag, e não o id: se o requestAnimationFrame
    // chamar o callback antes de devolver o id (o stub do teste faz isso),
    // `rafId = requestAnimationFrame(draw)` guardaria o id depois de o
    // callback zerá-lo, e nenhuma rolagem seguinte agendaria de novo.
    let scheduled = false;
    let rafId = 0;

    /**
     * O giro corre só enquanto o fundo está preso: do momento em que o topo
     * dele chega ao `top` do sticky até o pé dele chegar ao fim da seção. A
     * margem de cima e o `top` vêm do CSS (hoje, 0 e 0).
     */
    const progress = () => {
      const style = getComputedStyle(fundo);
      const offset = parseFloat(style.marginTop) || 0;
      const stickyTop = parseFloat(style.top) || 0;
      const cell = section.getBoundingClientRect();
      return sectionProgress(cell.top + offset - stickyTop, cell.height - offset, fundo.getBoundingClientRect().height);
    };

    /**
     * Bloco em foco: o que tem o texto mais perto da linha de leitura (o meio
     * da área de texto, que o CSS põe ao lado da peça no computador e embaixo
     * dela no celular). Os outros ganham data-active="false" e somem.
     */
    const focus = () => {
      const zone = area.getBoundingClientRect();
      const line = zone.top + zone.height / 2;
      let best = 0;
      let bestDistance = Infinity;
      blocks.forEach((block, index) => {
        const rect = (block.querySelector(".hero-estudio__bloco-texto") ?? block).getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - line);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      if (best === focused) return;
      focused = best;
      blocks.forEach((block, index) => block.setAttribute("data-active", String(index === best)));
      stepsHeading?.setAttribute("data-active", String(best > 0));
    };

    const draw = () => {
      scheduled = false;
      // Depois de desistir (quadros falharam), o hero fica no pôster.
      if (cancelled) return;
      focus();
      const index = nearestLoadedFrame(loaded, frameForProgress(progress(), total));
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

    /** Para tudo: ouvintes, desenho agendado, realce e os quadros que ainda baixam. */
    const stop = () => {
      cancelled = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", load);
      if (scheduled) cancelAnimationFrame(rafId);
      images.forEach((image, index) => {
        image.onload = null;
        image.onerror = null;
        if (!loaded[index]) image.src = "";
      });
      for (const element of [...blocks, stepsHeading]) element?.removeAttribute("data-active");
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
            stop();
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
    // O foco já vale antes de os quadros chegarem.
    schedule();
    // Os quadros só baixam depois da página: o pôster continua sendo o LCP.
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });

    return () => {
      stop();
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
      {/* O fundo: o quadro (pôster e canvas), o selo e a área de leitura, que
          só serve de régua para o bloco em foco. */}
      <div ref={fundoRef} className="hero-estudio__fundo">
        <div className="hero-estudio__quadro">
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
        </div>
        <p className="selo selo--ilustracao hero-estudio__selo">{badge}</p>
        <div ref={areaRef} className="hero-estudio__area" aria-hidden="true" />
      </div>

      <div className="hero-estudio__textos">
        <div className="hero-estudio__bloco hero-estudio__abertura">
          <div className="hero-estudio__bloco-texto">{opening}</div>
        </div>
        <div className="hero-estudio__como">
          <h2 id="hero-passos-title" className="hero-estudio__como-titulo">
            {stepsTitle}
          </h2>
          {/* role="list": o Safari tira a semântica de lista de um <ol> com list-style: none. */}
          <ol className="hero-estudio__passos" role="list" aria-labelledby="hero-passos-title">
            {steps.map((step, index) => (
              <li key={step.lead} className="hero-estudio__bloco hero-estudio__passo">
                <div className="hero-estudio__bloco-texto">
                  <span className="hero-estudio__passo-num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="hero-estudio__passo-texto">
                    <strong>{step.lead}</strong> {step.rest}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
