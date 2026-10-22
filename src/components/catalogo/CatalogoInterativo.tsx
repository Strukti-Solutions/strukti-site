"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ItemCatalogo } from "@/content/catalogo";
import { Coverflow, textoPosicao } from "./Coverflow";
import type { EventoCatalogo } from "./estado";
import { FiltroTipo } from "./FiltroTipo";
import { useCatalogo } from "./useCatalogo";

/** A partir daqui os ±2 aparecem (§3.1); abaixo, a CSS os esconde e eles ficam `inert`. */
const LARGO_QUERY = "(min-width: 768px)";

/**
 * Raiz cliente do catálogo (spec 2026-10-16, §3): filtro, palco e a live
 * region. `data-js` é "false" no servidor e no 1º render do cliente (o
 * mesmo HTML, sem divergir na hidratação) e "true" depois de montar: só aí a
 * CSS liga o coverflow. Sem JS, fica a fileira com rolagem para o lado e o
 * `<details>` de cada cartão (§8.5).
 */
export function CatalogoInterativo({ itens }: { itens: readonly ItemCatalogo[] }) {
  // O hook rola até o topo da seção (§3.4): o `<section>` em volta, que é do
  // servidor (`Catalogo`).
  const secaoRef = useRef<HTMLElement | null>(null);
  const raizRef = useCallback((no: HTMLDivElement | null) => {
    secaoRef.current = no?.closest("section") ?? no;
  }, []);
  const { estado, visiveis, despachar } = useCatalogo(itens, secaoRef);
  const [js, setJs] = useState(false);
  const [largo, setLargo] = useState(true);
  // A live region nasce vazia e só fala depois da 1ª troca feita aqui (§8.4).
  const [anunciar, setAnunciar] = useState(false);

  useEffect(() => {
    setJs(true);
  }, []);

  // O `inert` dos ±2 no celular vem daqui; a CSS só os esconde.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(LARGO_QUERY);
    const sincronizar = () => setLargo(query.matches);
    sincronizar();
    query.addEventListener("change", sincronizar);
    return () => query.removeEventListener("change", sincronizar);
  }, []);

  const navegar = useCallback(
    (evento: EventoCatalogo) => {
      setAnunciar(true);
      despachar(evento);
    },
    [despachar],
  );

  const indiceAtivo = Math.max(0, visiveis.findIndex((item) => item.slug === estado.ativo));
  const itemAtivo = visiveis[indiceAtivo];

  return (
    <div ref={raizRef} className="catalogo" data-js={js ? "true" : "false"} data-estado={estado.aberto ? "aberto" : "fechado"}>
      <div className="catalogo__corpo">
        <FiltroTipo filtro={estado.filtro} aoFiltrar={(filtro) => navegar({ tipo: "filtrar", filtro })} />
        <Coverflow
          itens={visiveis}
          ativo={estado.ativo}
          js={js}
          largo={largo}
          prioritario={itens[0]?.slug ?? ""}
          aoCentralizar={(slug) => navegar({ tipo: "centralizar", slug })}
          aoPasso={(delta) => navegar({ tipo: "passo", delta })}
          aoIrPara={(posicao) => navegar({ tipo: "irPara", posicao })}
          aoAbrir={() => despachar({ tipo: "abrir" })}
        />
      </div>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {anunciar && itemAtivo ? textoPosicao(indiceAtivo, visiveis.length, itemAtivo.nome) : ""}
      </p>
    </div>
  );
}
