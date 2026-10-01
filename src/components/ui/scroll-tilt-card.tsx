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
    <div ref={blockRef} className="py-6 md:py-12" style={{ perspective: "1200px" }}>
      <motion.div
        style={{ y: titleY }}
        className="mx-auto max-w-3xl text-center motion-reduce:transform-none!"
      >
        {title}
      </motion.div>
      <motion.div
        style={{ rotateX: tilt, scale, transformOrigin: "center top" }}
        className="mx-auto mt-8 aspect-video w-full max-w-5xl rounded-3xl border-4 border-[var(--color-petrol-600)] bg-[var(--color-petrol-900)] p-1.5 shadow-[0_30px_60px_-20px_rgba(11,46,56,0.5)] motion-reduce:transform-none! md:p-3"
      >
        <div className="h-full w-full overflow-hidden rounded-2xl bg-black">{children}</div>
      </motion.div>
    </div>
  );
}
