"use client";

import { catalogoUi } from "@/content/catalogo";
import type { Filtro } from "./estado";

/** As pílulas, na ordem da §3.3 (Q19). */
const FILTROS: readonly Filtro[] = ["todos", "hardware", "aplicativo", "site"];

/**
 * Filtro por tipo (spec 2026-10-16, §3.3): pílulas com `aria-pressed`,
 * acima do palco. Fica fora da região do carrossel, para as setas do
 * teclado nas pílulas não trocarem o produto.
 */
export function FiltroTipo({ filtro, aoFiltrar }: { filtro: Filtro; aoFiltrar: (filtro: Filtro) => void }) {
  return (
    <div className="catalogo__filtro" role="group" aria-label={catalogoUi.rotuloFiltro}>
      {FILTROS.map((opcao) => (
        <button
          key={opcao}
          type="button"
          aria-pressed={opcao === filtro}
          onClick={() => aoFiltrar(opcao)}
        >
          {catalogoUi.filtros[opcao]}
        </button>
      ))}
    </div>
  );
}
