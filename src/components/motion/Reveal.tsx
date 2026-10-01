"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

/**
 * Só começa a animar depois de montar no cliente, para que, sem
 * JavaScript, o conteúdo renderize visível direto (sem depender de JS para
 * "revelar"). Some também com prefers-reduced-motion.
 */
function useCanAnimate() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && !prefersReducedMotion;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Revelação suave (fade + leve subida) de um bloco ao entrar na tela. */
export function Reveal({ children, className, style }: RevealProps) {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/** Lista (`<ul>`) cujos `<RevealStaggerItem>` revelam em cascata ao rolar. */
export function RevealStaggerList({ children, className, style }: RevealProps) {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return (
      <ul className={className} style={style}>
        {children}
      </ul>
    );
  }

  return (
    <motion.ul
      className={className}
      style={style}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.ul>
  );
}

export function RevealStaggerItem({ children, className, style }: RevealProps) {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return (
      <li className={className} style={style}>
        {children}
      </li>
    );
  }

  return (
    <motion.li className={className} style={style} variants={staggerItem}>
      {children}
    </motion.li>
  );
}
