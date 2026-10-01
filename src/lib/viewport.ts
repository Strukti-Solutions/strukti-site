import { useEffect, useState } from "react";

const NARROW_QUERY = "(max-width: 767px)";

/**
 * Verdadeiro abaixo do ponto de corte mobile (767px, o mesmo breakpoint `md`
 * do Tailwind). Portão de montagem (ADR-004): `false` no servidor e no 1º
 * render do cliente — sem divergência de hidratação — e só atualiza depois de
 * montar. Como nada aqui ramifica a árvore React (só ajusta props de uma peça
 * visual já client-only), o valor pode mudar depois de montar sem risco de
 * hidratação.
 */
export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(NARROW_QUERY);
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return narrow;
}
