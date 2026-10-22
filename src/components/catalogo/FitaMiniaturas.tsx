"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { CARTAO_PAINEL, CASCATA_FITA, transicao } from "./movimento";

interface FitaMiniaturasProps {
  /** Os itens do filtro atual, na ordem do catálogo. */
  itens: readonly ItemCatalogo[];
  /** Slug do produto aberto no painel. */
  ativo: string;
  /** `useCanAnimate()` do catálogo: sem ele, a fita aparece de uma vez. */
  animar: boolean;
  aoEscolher: (slug: string) => void;
}

/**
 * A fita de miniaturas do estado aberto (spec 2026-10-16, §3.2 e §8.3):
 * um botão por produto, com a arte de 480 px e o nome. O ativo tem
 * `aria-current` e o contorno elétrico, e a fita rola para mantê-lo no
 * centro. Ao abrir, as miniaturas descem para o lugar em cascata (§7).
 */
export function FitaMiniaturas({ itens, ativo, animar, aoEscolher }: FitaMiniaturasProps) {
  const fitaRef = useRef<HTMLDivElement>(null);

  // Centraliza o ativo mexendo só na rolagem da própria fita: o
  // `scrollIntoView` rolaria também a página na vertical quando a fita não
  // está inteira na tela (zoom, tela baixa). A suavidade vem da CSS
  // (`scroll-behavior`), que a desliga com movimento reduzido.
  useEffect(() => {
    const fita = fitaRef.current;
    const botao = fita?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!fita || !botao) return;
    // Pelas caixas na tela (o `offsetLeft` é do ancestral posicionado, não da fita).
    const deslocado = botao.getBoundingClientRect().left - fita.getBoundingClientRect().left + fita.scrollLeft;
    fita.scrollLeft = deslocado - (fita.clientWidth - botao.offsetWidth) / 2;
  }, [ativo, itens]);

  return (
    <div ref={fitaRef} className="catalogo__fita" role="group" aria-label={catalogoUi.rotuloFita}>
      {itens.map((item, indice) => {
        const { base } = item.arte;
        return (
          <motion.button
            key={item.slug}
            type="button"
            className="catalogo__miniatura"
            aria-current={item.slug === ativo ? "true" : undefined}
            onClick={() => aoEscolher(item.slug)}
            // De cima (onde estavam os cartões) para a fita: a rolagem da fita
            // não cresce com o que passa por cima dela.
            initial={animar ? { opacity: 0, y: -24 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={transicao(animar, { ...CARTAO_PAINEL, delay: indice * CASCATA_FITA })}
          >
            {/* Decorativa: o nome está logo abaixo, no próprio botão. */}
            <picture>
              <source type="image/avif" srcSet={`${base}-480.avif`} />
              <img
                className="catalogo__miniatura-arte"
                src={`${base}-480.jpg`}
                width={480}
                height={720}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </picture>
            <span className="catalogo__miniatura-nome">{item.nome}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
