/**
 * Liga o redutor do catálogo (`estado.ts`) ao navegador (spec 2026-10-16,
 * §3.4): aplica o efeito no `history`, transforma a âncora da URL (ao montar,
 * no `hashchange` e no `popstate`) no evento `hash` e, quando a âncora é de
 * um produto e veio do load ou de um link, rola até o topo da seção.
 *
 * Link e travessia (voltar/avançar) disparam a mesma sequência no navegador:
 * `popstate` e depois `hashchange`, com a mesma URL (HTML, "navigate to a
 * fragment"). O que separa os dois é o clique no link, que o hook anota.
 *
 * O `history.back()` do fechar é assíncrono (Review Focus 5): até o
 * `popstate` dele chegar, o hook está "voltando". Reabrir nesse meio-tempo
 * abre na hora, mas a entrada nova (`pushState`) espera a volta: criada
 * antes, a volta pendente a desfaria, e o `popstate` atrasado, com a URL de
 * antes de abrir, fecharia o painel recém-aberto.
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
export function slugDaUrl(): string | null {
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
      criarEntrada(efeito.slug);
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

function criarEntrada(slug: string) {
  window.history.pushState(null, "", `#${slug}`);
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
  // URL do último `popstate` que não veio de link: o `hashchange` da mesma
  // travessia (voltar ou avançar do navegador) não rola até a seção.
  const travessiaRef = useRef<string | null>(null);
  // URL do último link `#...` desta página clicado (menu da barra, links da
  // página): o `popstate` que ele causa não é travessia.
  const linkRef = useRef<string | null>(null);
  // O `back()` do fechar foi pedido e o `popstate` dele ainda não chegou.
  const voltandoRef = useRef(false);
  // Reabriu enquanto voltava: o slug da entrada a criar quando a volta
  // terminar (troca de produto antes disso só muda o slug).
  const entradaPendenteRef = useRef<string | null>(null);

  const despachar = useCallback(
    (evento: EventoCatalogo) => {
      const { estado: novo, historico } = reduzir(itens, estadoRef.current, evento);
      if (novo !== estadoRef.current) {
        estadoRef.current = novo;
        setEstado(novo);
      }
      if (!historico) return;
      if (voltandoRef.current) {
        // A entrada atual é a que o `back()` pendente vai deixar.
        if (historico.tipo === "push") {
          entradaPendenteRef.current = historico.slug;
          return;
        }
        if (entradaPendenteRef.current !== null) {
          // Fechar de novo: a entrada nem chegou a existir, e a volta
          // pendente já leva para antes de abrir.
          if (historico.tipo === "back") {
            entradaPendenteRef.current = null;
            return;
          }
          if (historico.tipo === "replace") {
            entradaPendenteRef.current = historico.slug;
            return;
          }
        }
      }
      // A URL mudou por nós: as marcas, se sobraram, não valem mais.
      travessiaRef.current = null;
      linkRef.current = null;
      if (historico.tipo === "back") voltandoRef.current = true;
      aplicarHistorico(historico);
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

    const semAncora = (url: string) => url.split("#")[0];

    // Clique num link para uma âncora desta página. Fica em `window`, na fase
    // de bolha, para rodar depois dos `onClick` do React e enxergar um
    // `preventDefault` (link que não navega não deixa marca).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || !link.hash) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      if (semAncora(link.href) !== semAncora(window.location.href)) return;
      if (link.href === window.location.href) {
        // A mesma âncora: não vem `hashchange` e o navegador só rola até o
        // cartão. O quadro pedido aqui roda depois dessa rolagem.
        sincronizar(true);
        return;
      }
      linkRef.current = link.href;
    };

    // Chegou a volta do `back()` do fechar. Se a pessoa reabriu nesse
    // meio-tempo, o painel já está como ela quer: a URL de antes de abrir não
    // vale, e a entrada que esperava é criada agora. O `hashchange` dessa
    // volta, se vier, encontra a URL nova marcada como travessia (não rola).
    const concluirVolta = () => {
      if (!voltandoRef.current) return false;
      voltandoRef.current = false;
      const slug = entradaPendenteRef.current;
      entradaPendenteRef.current = null;
      if (slug === null) return false;
      criarEntrada(slug);
      travessiaRef.current = window.location.href;
      linkRef.current = null;
      return true;
    };

    // Voltar/avançar do navegador: abre ou fecha, sem mexer na rolagem (o
    // navegador restaura a posição daquela entrada). O `popstate` de um link
    // também não rola: quem rola é o `hashchange` que vem logo depois.
    const onPopState = () => {
      if (concluirVolta()) return;
      const href = window.location.href;
      travessiaRef.current = linkRef.current === href ? null : href;
      linkRef.current = null;
      sincronizar(false);
    };

    // Link ou menu da barra: abre e rola. O `hashchange` que vem logo depois
    // do `popstate` na mesma travessia não rola.
    const onHashChange = () => {
      // Navegador que não dispara `popstate` na volta: vale o `hashchange`.
      if (concluirVolta()) return;
      linkRef.current = null;
      const daTravessia = travessiaRef.current === window.location.href;
      travessiaRef.current = null;
      sincronizar(!daTravessia);
    };

    // Carregar `/#slug`.
    sincronizar(true);
    window.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
      cancelAnimationFrame(quadro);
    };
  }, [despachar, itens, secaoRef]);

  const visiveis = useMemo(() => filtrar(itens, estado.filtro), [itens, estado.filtro]);

  return { estado, visiveis, despachar };
}
