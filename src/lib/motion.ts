import { useEffect, useState, useSyncExternalStore } from "react";
import type { Transition, TargetAndTransition } from "motion/react";

/** A media query da preferência (também conferida na hora do evento pelo hero "expansao"). */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** A preferência agora; sem `matchMedia` (servidor, navegador antigo), sem preferência. */
function prefersReducedMotionNow() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false;
}

/** Avisa quando a preferência muda (o `addListener` é o dos Safari antigos). */
function subscribeToReducedMotion(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }
  query.addListener?.(onChange);
  return () => query.removeListener?.(onChange);
}

/**
 * Portão de montagem (ADR-004): só libera animação depois de montar no
 * cliente e sem prefers-reduced-motion. Antes de montar, vale `false` no
 * servidor e no 1º render do cliente — o HTML dos dois é igual, sem erro
 * de hidratação — e, sem JavaScript, nada depende de animação para aparecer.
 *
 * Acompanha a preferência ao vivo (`matchMedia` + "change", pelo
 * `useSyncExternalStore`, com `false` no servidor): quem liga o reduced
 * motion no meio da visita para a animação na hora (o hero "expansao" solta
 * a página e o vídeo do hero pausa). Sem o `useReducedMotion` do motion, que
 * guarda o valor do 1º render e nunca o atualiza. Quem troca a árvore pelo
 * valor (o `Reveal`) usa o `useCanAnimateOnce`.
 */
export function useCanAnimate() {
  const prefersReducedMotion = useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotionNow, () => false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && !prefersReducedMotion;
}

/**
 * O mesmo portão, decidido uma vez ao montar: para quem troca de elemento
 * pelo valor (`Reveal`: `div` ↔ `motion.div`). Trocar no meio da visita
 * remontaria o que está dentro (um `<details>` aberto fecharia, o foco se
 * perderia); a entrada já aconteceu, então ela fica como montou.
 */
export function useCanAnimateOnce() {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    setCanAnimate(!prefersReducedMotionNow());
  }, []);

  return canAnimate;
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
