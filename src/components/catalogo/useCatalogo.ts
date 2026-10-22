/**
 * Liga o redutor do catálogo (`estado.ts`) ao navegador (spec 2026-10-16,
 * §3.4): aplica o efeito no `history`, transforma a âncora da URL (ao montar,
 * no `hashchange` e no `popstate`) no evento `hash` e, quando a âncora é de
 * um produto, rola até o topo da seção.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { ItemCatalogo } from "@/content/catalogo";
import {
  estadoInicial,
  filtrar,
  reduzir,
  type EfeitoHistorico,
  type EstadoCatalogo,
  type EventoCatalogo,
} from "./estado";

/** Âncora atual, sem o `#` e decodificada; `null` quando não há. */
function slugDaUrl(): string | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    return decodeURIComponent(hash);
  } catch {
    // Âncora mal codificada: vale como veio (e o redutor a ignora).
    return hash;
  }
}

/**
 * Aplica no `history` o que o redutor pediu. O `pushState`/`replaceState`
 * não disparam `hashchange` nem `popstate`; o `back()` dispara depois, e o
 * evento `hash` que chega encontra o painel já fechado (sem mudança).
 */
function aplicarHistorico(efeito: NonNullable<EfeitoHistorico>) {
  switch (efeito.tipo) {
    case "push":
      window.history.pushState(null, "", `#${efeito.slug}`);
      break;
    case "replace":
      window.history.replaceState(null, "", `#${efeito.slug}`);
      break;
    case "back":
      window.history.back();
      break;
    case "limpar":
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      break;
  }
}

/**
 * Estado do catálogo, os itens do filtro atual e o `despachar`. `itens` deve
 * ser estável (o `CATALOGO`): trocar a lista refaz os ouvintes e relê a âncora.
 */
export function useCatalogo(
  itens: readonly ItemCatalogo[],
  secaoRef: RefObject<HTMLElement | null>,
): { estado: EstadoCatalogo; visiveis: readonly ItemCatalogo[]; despachar: (e: EventoCatalogo) => void } {
  const [estado, setEstado] = useState(() => estadoInicial(itens));
  // O redutor roda sobre o ref, não sobre o estado do último render: dois
  // eventos no mesmo quadro (duplo clique, setas rápidas) não se perdem.
  const estadoRef = useRef(estado);
  // URL do último `popstate`: o `hashchange` da mesma travessia (voltar ou
  // avançar do navegador) não rola até a seção.
  const travessiaRef = useRef<string | null>(null);

  const despachar = useCallback(
    (evento: EventoCatalogo) => {
      const { estado: novo, historico } = reduzir(itens, estadoRef.current, evento);
      if (novo !== estadoRef.current) {
        estadoRef.current = novo;
        setEstado(novo);
      }
      if (historico) {
        // A URL mudou por nós: a marca de travessia, se sobrou, não vale mais.
        travessiaRef.current = null;
        aplicarHistorico(historico);
      }
    },
    [itens],
  );

  useEffect(() => {
    let quadro = 0;

    // §3.4: o topo da seção, não o cartão (que é para onde o navegador já
    // rolou pela âncora). Um quadro depois, porque o hero "expansao" completa
    // a expansão no mesmo `hashchange` e muda a altura do que fica acima.
    const rolarAteSecao = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        secaoRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    };

    const sincronizar = (rolar: boolean) => {
      const slug = slugDaUrl();
      despachar({ tipo: "hash", slug });
      if (rolar && slug !== null && itens.some((item) => item.slug === slug)) rolarAteSecao();
    };

    // Voltar/avançar do navegador: abre ou fecha, sem mexer na rolagem (o
    // navegador restaura a posição daquela entrada).
    const onPopState = () => {
      travessiaRef.current = window.location.href;
      sincronizar(false);
    };

    // Link ou menu da barra: abre e rola. O `hashchange` que vem logo depois
    // do `popstate` na mesma travessia não rola.
    const onHashChange = () => {
      const daTravessia = travessiaRef.current === window.location.href;
      travessiaRef.current = null;
      sincronizar(!daTravessia);
    };

    // Carregar `/#slug`.
    sincronizar(true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
      cancelAnimationFrame(quadro);
    };
  }, [despachar, itens, secaoRef]);

  const visiveis = useMemo(() => filtrar(itens, estado.filtro), [itens, estado.filtro]);

  return { estado, visiveis, despachar };
}
