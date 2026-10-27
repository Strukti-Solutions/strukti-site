"use client";

import { useState } from "react";
import { catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { landingContent } from "@/content/landing";
import { InterestLink } from "@/components/InterestLink";

/**
 * Conteúdo do produto (spec 2026-10-16, §3.2), o mesmo em dois lugares: no
 * `<details>` de cada cartão, que é o painel do HTML do servidor e de quem
 * está sem JS (§8.5), e nas abas do painel aberto. Por isso nada aqui
 * depende de estado do catálogo.
 */

type VideoProduto = NonNullable<ItemCatalogo["painel"]["video"]>;

/** "Assistir ao vídeo: Replay para quadras (52 s)": o "Assistir" do painel e o link da ficha. */
export function rotuloAssistir(item: ItemCatalogo, duracao: string | undefined) {
  return catalogoUi.assistir
    .replace("{nome}", item.nome)
    .replace(" ({duração})", duracao ? ` (${duracao})` : "");
}

/**
 * A alternativa em texto do vídeo (WCAG 1.2.1 e 1.2.3: os vídeos só têm
 * música): a legenda e a descrição, recolhida num `<details>`. No painel,
 * abaixo do vídeo; na ficha sem JS, abaixo do link para ele (§8.5).
 */
export function TextoDoVideo({ video }: { video: VideoProduto }) {
  return (
    <div className="catalogo__video-texto">
      <p className="caption">{video.caption}</p>
      <details>
        <summary>{landingContent.aplicativos.videoDescriptionLinkLabel}</summary>
        <p>{video.description}</p>
      </details>
    </div>
  );
}

/**
 * Visão geral (lado do texto): para quem é, benefícios e "Quero saber mais"
 * (a página própria do produto, se houver; senão, o formulário).
 */
export function VisaoGeralTexto({ item }: { item: ItemCatalogo }) {
  const saberMais = (
    <>
      {catalogoUi.saberMais}{" "}
      <span className="visually-hidden">{catalogoUi.saberMaisSobre.replace("{nome}", item.nome)}</span>
    </>
  );
  return (
    <div className="catalogo__visao">
      <h4 className="catalogo__subtitulo">{catalogoUi.paraQuem}</h4>
      <p className="catalogo__para-quem">{item.painel.paraQuem}</p>
      <ul className="catalogo__beneficios">
        {item.painel.beneficios.map((beneficio) => (
          <li key={beneficio}>{beneficio}</li>
        ))}
      </ul>
      {item.siteUrl ? (
        // Produto com página própria (o replay): o botão leva a ela.
        <a href={item.siteUrl} className="btn btn--primary catalogo__saber-mais">
          {saberMais}
        </a>
      ) : (
        // §3.6: um #contato comum (sem JS, só rola) que marca o interesse.
        <InterestLink interest={item.interesse} className="btn btn--primary catalogo__saber-mais">
          {saberMais}
        </InterestLink>
      )}
    </div>
  );
}

/** Como funciona: os 3 passos numerados. */
export function PassosProduto({ item }: { item: ItemCatalogo }) {
  return (
    <ol className="catalogo__passos">
      {item.painel.comoFunciona.map((passo) => (
        <li key={passo.titulo}>
          <span className="catalogo__passo-titulo">{passo.titulo}</span>
          <p className="catalogo__passo-texto">{passo.texto}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * As 3 telas ilustrativas (§5.4), na moldura do tipo. Com `navegavel` (o
 * painel aberto), uma por vez, com as setas para passar entre elas (dando a
 * volta); sem, as 3 em lista.
 */
export function TelasProduto({ item, navegavel = false }: { item: ItemCatalogo; navegavel?: boolean }) {
  const [atual, setAtual] = useState(0);
  const { telas } = item.painel;
  const passar = (delta: -1 | 1) => setAtual((i) => (i + delta + telas.length) % telas.length);

  return (
    <div className="catalogo__telas" data-navegavel={navegavel ? "true" : "false"}>
      <ul className="catalogo__telas-lista">
        {telas.map((tela, i) => {
          const celular = tela.moldura === "celular";
          return (
            <li
              key={tela.src}
              className={`catalogo__tela catalogo__tela--${tela.moldura}`}
              hidden={navegavel && i !== atual}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG local e pequeno: o otimizador do next/image não faz nada com ele */}
              <img
                src={tela.src}
                alt={tela.alt}
                width={celular ? 360 : 960}
                height={celular ? 720 : 600}
                loading="lazy"
                decoding="async"
              />
            </li>
          );
        })}
      </ul>
      {navegavel && telas.length > 1 && (
        <div className="catalogo__telas-setas">
          <button type="button" className="catalogo__tela-seta" aria-label={catalogoUi.telaAnterior} onClick={() => passar(-1)}>
            <Chevron sentido={-1} />
          </button>
          <button type="button" className="catalogo__tela-seta" aria-label={catalogoUi.proximaTela} onClick={() => passar(1)}>
            <Chevron sentido={1} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Seta ‹ ou › desenhada em SVG (cor do texto; visível em cores forçadas). */
export function Chevron({ sentido }: { sentido: -1 | 1 }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d={sentido === -1 ? "M12.5 4 6.5 10l6 6" : "M7.5 4l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
