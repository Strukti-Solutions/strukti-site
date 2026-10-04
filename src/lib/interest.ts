/**
 * Interesse do formulário de contato (spec 2026-10-03 §6). As chamadas da
 * página (aplicativos, "tem um problema que pede hardware?") levam ao
 * formulário com o interesse já marcado: o link é um `#contato` comum (sem
 * JavaScript, só rola até o formulário) e, no clique, dispara este evento.
 * Nada é guardado.
 */
export const INTERESTS = ["replay", "estacionamento", "aplicativo", "outro"] as const;
export type Interest = (typeof INTERESTS)[number];

const EVENT_NAME = "strukti:interesse";

function isInterest(value: unknown): value is Interest {
  return typeof value === "string" && (INTERESTS as readonly string[]).includes(value);
}

export function selectInterest(interest: Interest): void {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: interest }));
}

export function onInterestSelected(handler: (interest: Interest) => void): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (isInterest(detail)) handler(detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
