"use client";

/**
 * Origem: 21st.dev, componente "Container Scroll Animation" (autor
 * Aceternity / manuarora700), https://21st.dev/@manuarora700/components/container-scroll-animation
 * Licença conferida: componente público e gratuito do catálogo 21st.dev,
 * adaptação permitida — ver docs/DECISOES.md (ADR-001).
 *
 * Adaptado para este projeto:
 * - framer-motion → motion/react (ADR-002);
 * - tipos estritos (sem `any`);
 * - com prefers-reduced-motion ligado, o cartão não gira, não muda de
 *   escala e não translada: renderiza estático;
 * - cores do tema (var(--color-petrol-*) / var(--color-surface-alt)) no
 *   lugar dos valores fixos (#222222, #6C6C6C, gray) do componente original;
 * - sem a imagem de exemplo da aceternity.com — este componente só define o
 *   efeito, o conteúdo é passado por quem o usa.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionStyle,
  type MotionValue,
} from "motion/react";

const CARD_SHADOW =
  "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003";

interface ContainerScrollProps {
  titleComponent: ReactNode;
  children: ReactNode;
}

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleRange: [number, number] = isMobile ? [0.7, 0.9] : [1.05, 1];

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  if (prefersReducedMotion) {
    // O ref continua anexado aqui mesmo sem usar o scroll, porque o hook
    // useScroll (chamado acima, incondicionalmente) espera que o elemento
    // associado a ele seja montado — sem isso, o motion lança
    // "Target ref is defined but not hydrated" ao processar o próximo frame.
    return (
      <div ref={containerRef} className="relative flex flex-col items-center justify-center p-2 md:p-20">
        <div className="mx-auto max-w-5xl text-center">{titleComponent}</div>
        <StaticCard>{children}</StaticCard>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20">
      <div className="relative w-full py-10 md:py-40" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

interface HeaderProps {
  translate: MotionValue<number>;
  titleComponent: ReactNode;
}

function Header({ translate, titleComponent }: HeaderProps) {
  const style: MotionStyle = { translateY: translate };
  return (
    <motion.div style={style} className="mx-auto max-w-5xl text-center">
      {titleComponent}
    </motion.div>
  );
}

interface CardProps {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: ReactNode;
}

function Card({ rotate, scale, children }: CardProps) {
  const style: MotionStyle = {
    rotateX: rotate,
    scale,
    boxShadow: CARD_SHADOW,
  };

  return (
    <motion.div
      style={style}
      className="mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[var(--color-petrol-600)] bg-[var(--color-petrol-900)] p-2 shadow-2xl md:h-[40rem] md:p-6"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] md:p-4">
        {children}
      </div>
    </motion.div>
  );
}

function StaticCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mt-8 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[var(--color-petrol-600)] bg-[var(--color-petrol-900)] p-2 shadow-2xl md:h-[40rem] md:p-6">
      <div className="h-full w-full overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] md:p-4">
        {children}
      </div>
    </div>
  );
}
