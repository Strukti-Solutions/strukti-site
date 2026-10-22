"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ItemCatalogo } from "@/content/catalogo";
import { useCanAnimate } from "@/lib/motion";
import { pauseOtherVideos } from "@/lib/videoCoordination";
import { Coverflow, textoPosicao } from "./Coverflow";
import type { EventoCatalogo } from "./estado";
import { FiltroTipo } from "./FiltroTipo";
import { FitaMiniaturas } from "./FitaMiniaturas";
import { FundoAmbiente } from "./FundoAmbiente";
import { PainelProduto } from "./PainelProduto";
import { slugDaUrl, useCatalogo } from "./useCatalogo";

/** A partir daqui os ±2 aparecem (§3.1); abaixo, a CSS os esconde e eles ficam `inert`. */
const LARGO_QUERY = "(min-width: 768px)";
/** Quanto da seção precisa estar na tela para o loop do centro tocar. */
const NA_TELA_LIMIAR = 0.35;

/**
 * Raiz cliente do catálogo (spec 2026-10-16, §3): filtro, palco (o coverflow
 * fechado, ou o painel e a fita abertos) e a live region. `data-js` é
 * "false" no servidor e no 1º render do cliente (o mesmo HTML, sem divergir
 * na hidratação) e "true" depois de montar: só aí a CSS liga o coverflow.
 * Sem JS, fica a fileira com rolagem para o lado e o `<details>` de cada
 * cartão (§8.5).
 *
 * O movimento (§7) vem do `useCanAnimate()` daqui, montado antes do painel
 * e da fita: com movimento reduzido, as mesmas peças, com transições
 * instantâneas, sem loop e sem entrada em sequência (ADR-004).
 */
export function CatalogoInterativo({ itens }: { itens: readonly ItemCatalogo[] }) {
  // O hook rola até o topo da seção (§3.4): o `<section>` em volta, que é do
  // servidor (`Catalogo`).
  const secaoRef = useRef<HTMLElement | null>(null);
  const raizNoRef = useRef<HTMLDivElement | null>(null);
  const raizRef = useCallback((no: HTMLDivElement | null) => {
    raizNoRef.current = no;
    secaoRef.current = no?.closest("section") ?? no;
  }, []);
  const { estado, visiveis, despachar } = useCatalogo(itens, secaoRef);
  const [js, setJs] = useState(false);
  const [largo, setLargo] = useState(true);
  const animar = useCanAnimate();
  // Fora da tela, o loop do centro não carrega nem toca: tocar pausaria o
  // vídeo do hero (um vídeo por vez).
  const [naTela, setNaTela] = useState(false);
  const [esperandoEntrada, setEsperandoEntrada] = useState(false);
  const entradaDecididaRef = useRef(false);
  // A live region nasce vazia e só fala depois da 1ª troca feita aqui (§8.4).
  // Uma vez só: quando o foco segue o novo centro (teclado num cartão), quem
  // fala é o leitor, ao chegar ao grupo "N de M: Nome", e ela fica vazia
  // nessa troca (esvaziar não é anunciado; a troca seguinte fala de novo).
  const [anunciar, setAnunciar] = useState(false);
  // Fechou pelo X ou pelo Esc: o foco volta ao cartão de origem (§8.3).
  const focarCartaoRef = useRef(false);
  const abertoAntesRef = useRef(estado.aberto);

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

  useEffect(() => {
    const raiz = raizNoRef.current;
    if (!raiz) return;
    if (typeof IntersectionObserver !== "function") {
      setNaTela(true);
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        const ultima = entradas[entradas.length - 1];
        if (ultima) setNaTela(ultima.isIntersecting);
      },
      { threshold: NA_TELA_LIMIAR },
    );
    observador.observe(raiz);
    return () => observador.disconnect();
  }, []);

  // A entrada em sequência (§7) só quando a seção monta abaixo da dobra (o
  // caso comum, vindo do hero): quem chega com ela já na tela (um link
  // direto) não vê os cartões sumirem para entrar de novo. Decide uma vez.
  useEffect(() => {
    const raiz = raizNoRef.current;
    if (!animar || !raiz || entradaDecididaRef.current) return;
    entradaDecididaRef.current = true;
    if (raiz.getBoundingClientRect().top > window.innerHeight) setEsperandoEntrada(true);
  }, [animar]);

  // Só um vídeo toca por vez na página (MASTER §8.8): o do painel, o do hero
  // e os loops dos cartões. "play" não borbulha: ouvir na captura.
  useEffect(() => {
    const onPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) pauseOtherVideos(event.target);
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);

  const navegar = useCallback(
    (evento: EventoCatalogo, focoSegue = false) => {
      setAnunciar(!focoSegue);
      despachar(evento);
    },
    [despachar],
  );

  const fechar = useCallback(() => {
    focarCartaoRef.current = true;
    despachar({ tipo: "fechar" });
  }, [despachar]);

  // Esc fecha, com o ouvinte no documento só enquanto o painel está aberto.
  useEffect(() => {
    if (!estado.aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) fechar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [estado.aberto, fechar]);

  // Depois de fechar (já com o coverflow de volta), o foco vai ao cartão do
  // centro: pelo X ou pelo Esc, se ele estava no catálogo; e sempre que
  // ele se perdeu com o painel (o voltar do navegador, por exemplo). Quem
  // fechou com um link de outra seção (#contato, inclusive o "Quero saber
  // mais" de dentro do painel, que sai com ele e perde o foco) fica onde
  // está: o navegador já rolou até a âncora. Sem rolar a página, nunca.
  useEffect(() => {
    const abertoAntes = abertoAntesRef.current;
    abertoAntesRef.current = estado.aberto;
    if (!abertoAntes || estado.aberto) return;
    const pedido = focarCartaoRef.current;
    focarCartaoRef.current = false;
    const raiz = raizNoRef.current;
    const foco = document.activeElement;
    const ancora = slugDaUrl();
    const outraSecao = ancora !== null && !itens.some((item) => item.slug === ancora);
    const perdido = (foco === null || foco === document.body) && !outraSecao;
    if (!raiz || !(perdido || (pedido && raiz.contains(foco)))) return;
    raiz.querySelector<HTMLElement>('.catalogo__cartao[data-pos="0"]')?.focus({ preventScroll: true });
  }, [estado.aberto, itens]);

  const indiceAtivo = Math.max(0, visiveis.findIndex((item) => item.slug === estado.ativo));
  const itemAtivo = visiveis[indiceAtivo];
  const aberto = estado.aberto && itemAtivo !== undefined;

  return (
    <div ref={raizRef} className="catalogo" data-js={js ? "true" : "false"} data-estado={aberto ? "aberto" : "fechado"}>
      {itemAtivo && <FundoAmbiente src={`${itemAtivo.arte.base}-480.jpg`} />}
      <div className="catalogo__corpo">
        <FiltroTipo filtro={estado.filtro} aoFiltrar={(filtro) => navegar({ tipo: "filtrar", filtro })} />
        <Coverflow
          itens={visiveis}
          ativo={estado.ativo}
          js={js}
          largo={largo}
          prioritario={itens[0]?.slug ?? ""}
          animar={animar}
          naTela={naTela}
          esperandoEntrada={esperandoEntrada}
          escondido={aberto}
          aoCentralizar={(slug, focoSegue) => navegar({ tipo: "centralizar", slug }, focoSegue)}
          aoPasso={(delta, focoSegue) => navegar({ tipo: "passo", delta }, focoSegue)}
          aoIrPara={(posicao, focoSegue) => navegar({ tipo: "irPara", posicao }, focoSegue)}
          aoAbrir={() => despachar({ tipo: "abrir" })}
        />
        {aberto && (
          <>
            <PainelProduto
              item={itemAtivo}
              posicao={{ indice: indiceAtivo, total: visiveis.length }}
              direcao={estado.direcao}
              animar={animar}
              aoFechar={fechar}
              aoPasso={(delta) => navegar({ tipo: "passo", delta })}
            />
            <FitaMiniaturas
              itens={visiveis}
              ativo={estado.ativo}
              animar={animar}
              aoEscolher={(slug) => navegar({ tipo: "centralizar", slug })}
            />
          </>
        )}
      </div>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {anunciar && itemAtivo ? textoPosicao(indiceAtivo, visiveis.length, itemAtivo.nome) : ""}
      </p>
    </div>
  );
}
