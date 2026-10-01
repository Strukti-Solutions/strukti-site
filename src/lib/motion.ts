import { useReducedMotion, type Transition, type TargetAndTransition } from "motion/react";

interface TapHoverProps {
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  transition?: Transition;
}

/**
 * Micro-interação padrão de botões e links do site: leve destaque no hover
 * e leve recolhimento no toque/clique. Some com prefers-reduced-motion.
 */
export function useTapHover(): TapHoverProps {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {};
  }

  return {
    whileHover: { scale: 1.03, y: -2 },
    whileTap: { scale: 0.96, y: 0 },
    transition: { duration: 0.15, ease: "easeOut" },
  };
}
