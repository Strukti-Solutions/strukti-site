import { useEffect, useState } from "react";

const NARROW_QUERY = "(max-width: 1023px)";

/**
 * Verdadeiro abaixo do ponto de corte da composição do hero (1023px, o
 * breakpoint `lg` do Tailwind): abaixo dele o visual vai para a faixa embaixo
 * do texto (design-system/strukti-solucoes/MASTER.md, §9.2).
 *
 * Portão de montagem (ADR-004): `false` no servidor e no 1º render do
 * cliente — sem divergência de hidratação — e só atualiza depois de montar.
 * Como nada aqui ramifica a árvore React (só ajusta props de uma peça visual
 * já client-only), o valor pode mudar depois de montar sem risco de
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
