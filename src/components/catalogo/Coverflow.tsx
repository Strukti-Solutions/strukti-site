"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { motion } from "motion/react";
import { catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { CartaoProduto } from "./CartaoProduto";
import { Chevron } from "./ConteudoProduto";
import { deslocamento } from "./estado";

/** Gesto que troca (Review Focus 1): claramente horizontal e de pelo menos 40 px. */
const DESLIZE_MINIMO = 40;
const DESLIZE_PROPORCAO = 1.5;

/**
 * Onde fica o centro do ±1 e do ±2, em larguras de cartão a partir do centro
 * do palco: o `translateX` de cada `data-pos` na CSS (86% e 155%, §3.1). A
 * escala e o giro são em torno do centro do cartão e não o mudam de lugar.
 */
const CENTRO_DOS_LATERAIS = [0.86, 1.55] as const;

/**
 * Até que distância do centro (1 = só o ±1, 2 = os dois) um lateral fica na
 * ordem de Tab: só se o centro dele cai no palco, longe das setas, que ficam
 * por cima. Mais longe, focado, ele ficaria sob a seta ou fora da tela
 * (2.4.11); o teclado tem as setas, as bolinhas e ← →. Medido pelo tamanho
 * do cartão na tela (o palco o calcula pela altura e pela largura) a cada
 * mudança de tamanho do palco. Sem medida (antes de montar, ou sem
 * ResizeObserver), os dois.
 */
function useAlcanceDoTab(palcoRef: RefObject<HTMLElement | null>) {
  const [alcance, setAlcance] = useState<number>(CENTRO_DOS_LATERAIS.length);

  useEffect(() => {
    const palco = palcoRef.current;
    if (!palco || typeof ResizeObserver !== "function") return;
    const medir = () => {
      const cartao = palco.querySelector<HTMLElement>('.catalogo__cartao[data-pos="0"]')?.offsetWidth ?? 0;
      const seta = palco.parentElement?.querySelector<HTMLElement>(".catalogo__seta")?.offsetWidth ?? 0;
      // Escondido (o painel aberto): sem caixa, nada a medir.
      if (cartao === 0) return;
      const livre = palco.clientWidth / 2 - seta;
      setAlcance(CENTRO_DOS_LATERAIS.filter((centro) => centro * cartao <= livre).length);
    };
    const observador = new ResizeObserver(medir);
    observador.observe(palco);
    medir();
    return () => observador.disconnect();
  }, [palcoRef]);

  return alcance;
}

/**
 * Passo de um gesto do dedo ou do mouse (dx, dy em px), ou `null` quando não
 * troca: só vale o gesto claramente horizontal. O dedo para a esquerda traz o
 * próximo. O painel aberto usa a mesma regra.
 */
export function passoDoDeslize(dx: number, dy: number): -1 | 1 | null {
  if (Math.abs(dx) < DESLIZE_MINIMO || Math.abs(dx) <= DESLIZE_PROPORCAO * Math.abs(dy)) return null;
  return dx < 0 ? 1 : -1;
}

/**
 * O clique que o próprio arrasto gera não vale (soltar o mouse sobre um
 * cartão o centralizaria ou abriria). Só esse: o mouse manda o clique logo
 * depois do `pointerup`, na mesma tarefa, e a marca cai na tarefa seguinte.
 * O dedo não gera clique depois de deslizar; uma marca que sobrasse
 * engoliria o próximo Enter/espaço ou a ativação pelo leitor de tela, que
 * chegam como clique sem `pointerdown` antes. O painel usa o mesmo.
 */
export function useCliqueDoArrasto() {
  const arrastouRef = useRef(false);
  const tarefaRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(tarefaRef.current), []);

  /** Chame no `pointerup` do gesto que trocou de produto. */
  const marcarArrasto = useCallback(() => {
    arrastouRef.current = true;
    clearTimeout(tarefaRef.current);
    tarefaRef.current = setTimeout(() => {
      arrastouRef.current = false;
    }, 0);
  }, []);

  const onClickCapture = useCallback((e: MouseEvent<HTMLElement>) => {
    if (!arrastouRef.current) return;
    arrastouRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return { marcarArrasto, onClickCapture };
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
  /** `useCanAnimate()` do catálogo: sem ele, tudo instantâneo (ADR-004). */
  animar: boolean;
  /** A seção está na tela: o loop do centro só toca assim. */
  naTela: boolean;
  /**
   * A seção montou abaixo da dobra: os cartões esperam escondidos e entram
   * em sequência na 1ª vez que ela aparece (`whileInView`, §7).
   */
  esperandoEntrada: boolean;
  /**
   * Painel aberto: o carrossel sai da tela (`hidden`), mas os cartões ficam
   * no DOM, com o `id` da âncora (§3.4) e o cartão de origem para o foco.
   */
  escondido?: boolean;
  /**
   * As trocas levam `focoSegue` quando vieram do teclado num cartão: o foco
   * vai ao novo centro, e o leitor de tela já lê o grupo dele (§8.4).
   */
  aoCentralizar: (slug: string, focoSegue?: boolean) => void;
  aoPasso: (delta: -1 | 1, focoSegue?: boolean) => void;
  aoIrPara: (posicao: "inicio" | "fim", focoSegue?: boolean) => void;
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
  animar,
  naTela,
  esperandoEntrada,
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
  const { marcarArrasto, onClickCapture } = useCliqueDoArrasto();
  const palcoRef = useRef<HTMLDivElement>(null);
  const alcanceDoTab = useAlcanceDoTab(palcoRef);

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
    const focoSegue = dentroDeCartao(e.target);
    const acoes: Record<string, () => void> = {
      ArrowLeft: () => aoPasso(-1, focoSegue),
      ArrowRight: () => aoPasso(1, focoSegue),
      Home: () => aoIrPara("inicio", focoSegue),
      End: () => aoIrPara("fim", focoSegue),
    };
    const acao = acoes[e.key];
    if (!acao) return;
    e.preventDefault();
    focarCentroRef.current = focoSegue;
    acao();
  };

  const ativar = (item: ItemCatalogo, centro: boolean, origem: "clique" | "teclado") => {
    if (centro) {
      aoAbrir();
      return;
    }
    focarCentroRef.current = origem === "teclado";
    aoCentralizar(item.slug, origem === "teclado");
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    inicioRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const inicio = inicioRef.current;
    inicioRef.current = null;
    if (!inicio || total <= 1) return;
    const passo = passoDoDeslize(e.clientX - inicio.x, e.clientY - inicio.y);
    if (passo === null) return;
    marcarArrasto();
    focarCentroRef.current = false;
    aoPasso(passo);
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
        {/* A entrada da seção começa aqui e desce, por variantes, até o
            invólucro de cada cartão (`.catalogo__entrada`). */}
        <motion.div
          ref={palcoRef}
          className="catalogo__palco"
          initial={false}
          animate={esperandoEntrada && animar ? "escondida" : "visivel"}
          whileInView={esperandoEntrada && animar ? "visivel" : undefined}
          viewport={{ once: true, amount: 0.35 }}
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
                // No celular, o ±1 só aparece pela ponta; e, em qualquer
                // largura, o lateral cujo centro cairia sob as setas fica
                // fora do Tab (useAlcanceDoTab). O clique e o dedo continuam.
                naOrdemDeTab={largo && Math.abs(d) <= alcanceDoTab}
                prioridade={item.slug === prioritario}
                // Da esquerda para a direita na tela; os ocultos, sem espera.
                ordem={pos === "oculto" ? 0 : d + 2}
                animar={animar}
                naTela={naTela}
                painelAberto={escondido}
                botaoRef={centro ? botaoCentroRef : undefined}
                aoAtivar={(origem) => ativar(item, centro, origem)}
              />
            );
          })}
        </motion.div>
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
