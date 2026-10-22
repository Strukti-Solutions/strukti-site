"use client";

import type { KeyboardEvent, MouseEvent, Ref } from "react";
import { catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { PassosProduto, TelasProduto, VisaoGeralTexto } from "./ConteudoProduto";

/**
 * Tamanho do cartão na tela, para o navegador escolher entre 480 e 800 px:
 * o do centro tem ~86% da altura do palco no computador (até ~430 px de
 * largura) e ~70% da largura no celular (§3.1).
 */
const TAMANHOS = "(min-width: 768px) 430px, 70vw";

interface CartaoProdutoProps {
  item: ItemCatalogo;
  /** `data-pos`: "-2" a "2", ou "oculto". */
  pos: string;
  /** "3 de 10: Rota de Vendas" (§8.1). */
  rotulo: string;
  /** Depois de montar (`data-js="true"`): o coverflow está ligado. */
  js: boolean;
  /** Fora do coverflow agora: `inert` e `aria-hidden` (só com JS). */
  oculto: boolean;
  /** O centro inicial: a arte carrega sem `loading="lazy"` (§9). */
  prioridade: boolean;
  botaoRef?: Ref<HTMLButtonElement>;
  /** Clique ou Enter/espaço: o coverflow decide (lateral centraliza, centro abre). */
  aoAtivar: (origem: "clique" | "teclado") => void;
}

/**
 * Um cartão do coverflow (spec 2026-10-16, §3.1 e §8.1). O do centro mostra a
 * etiqueta do tipo, o selo, o nome, a frase e "Ver detalhes"; os laterais, só
 * a arte e o nome (Q38; o resto a CSS esconde). O `<details>` no fim é o
 * painel de quem está sem JS (§8.5); com JS, a CSS o esconde.
 */
export function CartaoProduto({ item, pos, rotulo, js, oculto, prioridade, botaoRef, aoAtivar }: CartaoProdutoProps) {
  const centro = pos === "0";
  const fora = js && oculto;
  const detalhesDe = catalogoUi.verDetalhesDe.replace("{nome}", item.nome);
  const { base } = item.arte;

  const onClick = (e: MouseEvent<HTMLElement>) => {
    // O botão e os links do cartão cuidam do próprio clique.
    if (!js || (e.target instanceof Element && e.target.closest("a, button, summary"))) return;
    aoAtivar("clique");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    // Só no próprio cartão (o lateral, que está na ordem de Tab); o Enter no
    // "Ver detalhes" já é o clique do botão.
    if (!js || e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    aoAtivar("teclado");
  };

  return (
    // Um `div` e não um `article`: o ARIA in HTML não deixa o `article` virar
    // `group`, e o padrão do carrossel (APG) pede o grupo.
    <div
      id={item.slug}
      className="catalogo__cartao"
      data-pos={pos}
      role="group"
      aria-roledescription={catalogoUi.roledescProduto}
      aria-label={rotulo}
      inert={fora}
      aria-hidden={fora ? true : undefined}
      // Com JS, o lateral entra no Tab (Enter o centraliza); o do centro só
      // recebe foco por programação, e o Tab vai para o "Ver detalhes" dele.
      tabIndex={js && !fora ? (centro ? -1 : 0) : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="catalogo__superficie">
        {/* A arte é decorativa: o nome está logo abaixo. */}
        <picture>
          <source type="image/avif" srcSet={`${base}-480.avif 480w, ${base}.avif 800w`} sizes={TAMANHOS} />
          <img
            className="catalogo__arte"
            src={`${base}.jpg`}
            srcSet={`${base}-480.jpg 480w, ${base}.jpg 800w`}
            sizes={TAMANHOS}
            width={800}
            height={1200}
            alt=""
            loading={prioridade ? undefined : "lazy"}
            decoding="async"
            draggable={false}
          />
        </picture>
        <div className="catalogo__info">
          <div className="catalogo__meta">
            <span className="catalogo__tipo">{catalogoUi.tipos[item.tipo]}</span>
            <SeloStatus status={item.fase} />
          </div>
          <h3 className="catalogo__nome">{item.nome}</h3>
          <p className="catalogo__frase">{item.frase}</p>
          {centro && (
            <button ref={botaoRef} type="button" className="btn btn--primary catalogo__ver" onClick={() => aoAtivar("clique")}>
              {catalogoUi.verDetalhes}{" "}
              <span className="visually-hidden">{detalhesDe}</span>
            </button>
          )}
        </div>
      </div>
      <details className="catalogo__ficha">
        <summary>
          {catalogoUi.verDetalhes}{" "}
          <span className="visually-hidden">{detalhesDe}</span>
        </summary>
        <div className="catalogo__ficha-corpo">
          <VisaoGeralTexto item={item} />
          {item.siteUrl && (
            <p className="catalogo__site">
              <a href={item.siteUrl}>{catalogoUi.siteLink}</a>
            </p>
          )}
          <h4 className="catalogo__subtitulo">{catalogoUi.abas.comoFunciona}</h4>
          <PassosProduto item={item} />
          <h4 className="catalogo__subtitulo">{catalogoUi.abas.telas}</h4>
          <TelasProduto item={item} />
        </div>
      </details>
    </div>
  );
}
