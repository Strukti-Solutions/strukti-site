"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { CartaoProduto } from "./CartaoProduto";
import { Chevron } from "./ConteudoProduto";
import { deslocamento } from "./estado";

/** Gesto que troca (Review Focus 1): claramente horizontal e de pelo menos 40 px. */
const DESLIZE_MINIMO = 40;
const DESLIZE_PROPORCAO = 1.5;

/**
 * Passo de um gesto do dedo ou do mouse (dx, dy em px), ou `null` quando não
 * troca: só vale o gesto claramente horizontal. O dedo para a esquerda traz o
 * próximo. O painel aberto usa a mesma regra.
 */
export function passoDoDeslize(dx: number, dy: number): -1 | 1 | null {
  if (Math.abs(dx) < DESLIZE_MINIMO || Math.abs(dx) <= DESLIZE_PROPORCAO * Math.abs(dy)) return null;
  return dx < 0 ? 1 : -1;
}

/** "3 de 10: Rota de Vendas" (§8.1), no rótulo do cartão e na live region. */
export function textoPosicao(indice: number, total: number, nome: string) {
  return catalogoUi.posicao
    .replace("{i}", String(indice + 1))
    .replace("{n}", String(total))
    .replace("{nome}", nome);
}

interface CoverflowProps {
  /** Os itens do filtro atual, na ordem do catálogo. */
  itens: readonly ItemCatalogo[];
  /** Slug do centro. */
  ativo: string;
  js: boolean;
  /** ≥ 768 px: os ±2 aparecem; abaixo, ficam `inert` como os ocultos. */
  largo: boolean;
  /** Slug do centro inicial, cuja arte carrega sem `lazy`. */
  prioritario: string;
  /**
   * Painel aberto: o carrossel sai da tela (`hidden`), mas os cartões ficam
   * no DOM, com o `id` da âncora (§3.4) e o cartão de origem para o foco.
   */
  escondido?: boolean;
  aoCentralizar: (slug: string) => void;
  aoPasso: (delta: -1 | 1) => void;
  aoIrPara: (posicao: "inicio" | "fim") => void;
  aoAbrir: () => void;
}

/**
 * Estado fechado do catálogo (spec 2026-10-16, §3.1 e §8.1-2): a região do
 * carrossel com os cartões, as setas e as bolinhas. A posição de cada cartão
 * vai no `data-pos` e a CSS faz o resto (transform, opacidade, brilho). Não
 * gira sozinho (Q37). As setas do teclado só valem com o foco aqui dentro.
 */
export function Coverflow({
  itens,
  ativo,
  js,
  largo,
  prioritario,
  escondido = false,
  aoCentralizar,
  aoPasso,
  aoIrPara,
  aoAbrir,
}: CoverflowProps) {
  const total = itens.length;
  const indiceAtivo = Math.max(0, itens.findIndex((item) => item.slug === ativo));
  const botaoCentroRef = useRef<HTMLButtonElement>(null);
  // A troca veio do teclado num cartão: o foco segue o novo centro (o botão
  // que tinha o foco pode ter saído do centro, e a CSS o esconde).
  const focarCentroRef = useRef(false);
  const inicioRef = useRef<{ x: number; y: number } | null>(null);
  // O último gesto trocou de produto: o clique que vem depois não vale.
  const arrastouRef = useRef(false);

  useEffect(() => {
    if (!focarCentroRef.current) return;
    focarCentroRef.current = false;
    const foco = document.activeElement;
    // Só se o foco ainda estava num cartão (ou se perdeu com o botão).
    if (foco === null || foco === document.body || foco.closest(".catalogo__cartao")) botaoCentroRef.current?.focus();
  }, [ativo]);

  const dentroDeCartao = (alvo: EventTarget) => alvo instanceof Element && alvo.closest(".catalogo__cartao") !== null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Alt+← é o voltar do navegador; com modificador, a tecla não é nossa.
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const acoes: Record<string, () => void> = {
      ArrowLeft: () => aoPasso(-1),
      ArrowRight: () => aoPasso(1),
      Home: () => aoIrPara("inicio"),
      End: () => aoIrPara("fim"),
    };
    const acao = acoes[e.key];
    if (!acao) return;
    e.preventDefault();
    focarCentroRef.current = dentroDeCartao(e.target);
    acao();
  };

  const ativar = (item: ItemCatalogo, centro: boolean, origem: "clique" | "teclado") => {
    if (centro) {
      aoAbrir();
      return;
    }
    focarCentroRef.current = origem === "teclado";
    aoCentralizar(item.slug);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    arrastouRef.current = false;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    inicioRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const inicio = inicioRef.current;
    inicioRef.current = null;
    if (!inicio || total <= 1) return;
    const passo = passoDoDeslize(e.clientX - inicio.x, e.clientY - inicio.y);
    if (passo === null) return;
    arrastouRef.current = true;
    focarCentroRef.current = false;
    aoPasso(passo);
  };

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!arrastouRef.current) return;
    arrastouRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const navegar = (acao: () => void) => () => {
    focarCentroRef.current = false;
    acao();
  };

  return (
    <div
      className="catalogo__carrossel"
      role="region"
      aria-roledescription={catalogoUi.roledescCarrossel}
      aria-label={catalogoUi.rotuloCarrossel}
      hidden={escondido}
      onKeyDown={onKeyDown}
    >
      <div className="catalogo__cena">
        {total > 1 && (
          <button
            type="button"
            className="catalogo__seta catalogo__seta--anterior"
            aria-label={catalogoUi.anterior}
            onClick={navegar(() => aoPasso(-1))}
          >
            <Chevron sentido={-1} />
          </button>
        )}
        <div
          className="catalogo__palco"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            inicioRef.current = null;
          }}
          onClickCapture={onClickCapture}
        >
          {itens.map((item, indice) => {
            const d = deslocamento(indice, indiceAtivo, total);
            const pos = Math.abs(d) <= 2 ? String(d) : "oculto";
            const centro = d === 0;
            return (
              <CartaoProduto
                key={item.slug}
                item={item}
                pos={pos}
                rotulo={textoPosicao(indice, total, item.nome)}
                js={js}
                oculto={pos === "oculto" || (!largo && Math.abs(d) === 2)}
                prioridade={item.slug === prioritario}
                botaoRef={centro ? botaoCentroRef : undefined}
                aoAtivar={(origem) => ativar(item, centro, origem)}
              />
            );
          })}
        </div>
        {total > 1 && (
          <button
            type="button"
            className="catalogo__seta catalogo__seta--proxima"
            aria-label={catalogoUi.proximo}
            onClick={navegar(() => aoPasso(1))}
          >
            <Chevron sentido={1} />
          </button>
        )}
      </div>
      {total > 1 && (
        <div className="catalogo__bolinhas">
          {itens.map((item) => (
            <button
              key={item.slug}
              type="button"
              aria-label={catalogoUi.irPara.replace("{nome}", item.nome)}
              aria-current={item.slug === ativo ? "true" : undefined}
              onClick={navegar(() => aoCentralizar(item.slug))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
