import { useEffect, useState } from "react";
import { useReducedMotion, type Transition, type TargetAndTransition } from "motion/react";

/**
 * Portão de montagem (ADR-004): só libera animação depois de montar no
 * cliente e sem prefers-reduced-motion. Antes de montar, vale `false` no
 * servidor e no 1º render do cliente — o HTML dos dois é igual, sem erro
 * de hidratação — e, sem JavaScript, nada depende de animação para aparecer.
 */
export function useCanAnimate() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && !prefersReducedMotion;
}

interface TapHoverProps {
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  transition?: Transition;
}

/**
 * Micro-interação padrão de botões e links do site: leve destaque no hover
 * e leve recolhimento no toque/clique. Some com prefers-reduced-motion e só
 * entra depois de montar (ver useCanAnimate).
 */
export function useTapHover(): TapHoverProps {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return {};
  }

  return {
    whileHover: { scale: 1.03, y: -2 },
    whileTap: { scale: 0.96, y: 0 },
    transition: { duration: 0.15, ease: "easeOut" },
  };
}
