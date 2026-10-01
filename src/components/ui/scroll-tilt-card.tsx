"use client";

/**
 * Cartão que entra inclinado em 3D e se endireita conforme a página rola,
 * com o título subindo até o lugar. Código próprio, escrito com as APIs
 * documentadas do motion (https://motion.dev/docs/react-use-scroll e
 * https://motion.dev/docs/react-use-transform) — ver docs/DECISOES.md,
 * ADR-005.
 *
 * O progresso vai de 0 (topo do bloco entrando por baixo da tela) a 1
 * (centro do bloco no centro da tela): o cartão fica reto exatamente quando
 * está no meio da tela, que é quando a pessoa vai assistir ao vídeo.
 *
 * Redução de movimento só por CSS (`motion-reduce:`), numa árvore única,
 * para o HTML do servidor e o do cliente serem iguais (ADR-004).
 */

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface ScrollTiltCardProps {
  title: ReactNode;
  children: ReactNode;
}

export function ScrollTiltCard({ title, children }: ScrollTiltCardProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: blockRef,
    offset: ["start end", "center center"],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [48, 0]);
  const tilt = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <div ref={blockRef} className="pb-6 md:pb-12" style={{ perspective: "1200px" }}>
      {/* Aparência da moldura: globals.css, "Portfólio de vídeos" (MASTER §8.8). */}
      <motion.div style={{ y: titleY }} className="tilt-card__title motion-reduce:transform-none!">
        {title}
      </motion.div>
      <motion.div
        style={{ rotateX: tilt, scale, transformOrigin: "center top" }}
        className="tilt-card__frame motion-reduce:transform-none!"
      >
        <div className="tilt-card__screen">{children}</div>
      </motion.div>
    </div>
  );
}
