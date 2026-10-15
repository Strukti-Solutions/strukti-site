"use client";

import { useCanAnimate } from "@/lib/motion";
import { landingContent } from "@/content/landing";

/**
 * Os dois objetos que flutuam ao lado do texto do hero: um celular
 * (aplicativos sob medida) e uma placa (produtos de hardware). Técnica
 * 100% CSS (perspective + rotateX/rotateY + sombras em camadas simulando
 * espessura, sem three.js/WebGL) — docs/superpowers/specs/
 * 2026-10-15-hero-triangulo-3d-design.md.
 *
 * A flutuação (translateY em loop) só liga depois de montar e sem
 * prefers-reduced-motion (`data-animate`, mesmo padrão de `useCanAnimate`
 * usado em `Reveal`): servidor e 1º render do cliente são iguais, sem
 * ramificar a árvore (ADR-004).
 */
export function HeroObjetos3D() {
  const canAnimate = useCanAnimate();
  const { aplicativos, hardware } = landingContent.heroEstudio.objetos;

  return (
    <div className="hero-objetos" data-animate={canAnimate ? "true" : "false"}>
      <a className="hero-objetos__item" href={aplicativos.href}>
        <span className="hero-objetos__palco" aria-hidden="true">
          <span className="hero-objetos__figura hero-objetos__figura--celular">
            <span className="hero-objetos__celular-notch" />
            <span className="hero-objetos__celular-grade">
              <span />
              <span />
              <span />
              <span />
            </span>
          </span>
        </span>
        <span className="hero-objetos__rotulo">{aplicativos.label}</span>
        <span className="hero-objetos__desc">{aplicativos.desc}</span>
      </a>

      <a className="hero-objetos__item" href={hardware.href}>
        <span className="hero-objetos__palco" aria-hidden="true">
          <span className="hero-objetos__figura hero-objetos__figura--placa">
            <span className="hero-objetos__placa-pino hero-objetos__placa-pino--topo" />
            <span className="hero-objetos__placa-pino hero-objetos__placa-pino--base" />
            <span className="hero-objetos__placa-pino hero-objetos__placa-pino--esquerda" />
            <span className="hero-objetos__placa-pino hero-objetos__placa-pino--direita" />
            <span className="hero-objetos__placa-grade">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
          </span>
        </span>
        <span className="hero-objetos__rotulo">{hardware.label}</span>
        <span className="hero-objetos__desc">{hardware.desc}</span>
      </a>
    </div>
  );
}
