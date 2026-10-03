/**
 * Matemática do hero "estudio" (MASTER §9.7, spec 2026-10-03 §5.2): tudo o
 * que não depende de DOM fica aqui, em funções puras e testadas. O
 * componente (HeroSequenceScroller) só cuida de carregar e desenhar.
 */

export type FrameSetName = "desktop" | "celular";

/** Até esta largura o hero usa os quadros "celular" (mesmo corte do CSS). */
export const CELULAR_MAX_WIDTH = 767;

/** Índice do quadro para um progresso de 0 a 1 (fora disso, prende nas pontas). */
export function frameForProgress(progress: number, totalFrames: number): number {
  if (totalFrames <= 1 || !Number.isFinite(progress)) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(totalFrames - 1, Math.round(clamped * (totalFrames - 1)));
}

/**
 * Quanto da seção já rolou, de 0 a 1: 0 com o topo dela no topo da tela, 1
 * quando o fim dela chega ao fim da tela. Seção sem altura extra: 0.
 */
export function sectionProgress(top: number, height: number, viewportHeight: number): number {
  const scrollable = height - viewportHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, -top / scrollable));
}

export function pickFrameSet(viewportWidth: number): FrameSetName {
  return viewportWidth <= CELULAR_MAX_WIDTH ? "celular" : "desktop";
}

export function frameUrl(set: FrameSetName, index: number): string {
  return `/hero/sequencia/${set}/f${String(index).padStart(3, "0")}.avif`;
}

export function posterUrl(set: FrameSetName, format: "avif" | "jpg"): string {
  return `/hero/sequencia/${set}/poster.${format}`;
}

/**
 * O quadro já carregado mais perto do pedido (no empate, o anterior), para o
 * canvas nunca ficar em branco numa rolagem mais rápida que o download.
 */
export function nearestLoadedFrame(loaded: readonly boolean[], target: number): number | null {
  for (let distance = 0; distance < loaded.length; distance++) {
    const before = target - distance;
    if (before >= 0 && before < loaded.length && loaded[before]) return before;
    const after = target + distance;
    if (after >= 0 && after < loaded.length && loaded[after]) return after;
  }
  return null;
}
