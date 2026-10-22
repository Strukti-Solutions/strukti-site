"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { landingContent } from "@/content/landing";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { VideoDemo } from "@/components/ui/VideoDemo";
import { Chevron, PassosProduto, TelasProduto, VisaoGeralTexto } from "./ConteudoProduto";
import { passoDoDeslize } from "./Coverflow";

type Aba = keyof typeof catalogoUi.abas;
const ABAS: readonly Aba[] = ["visaoGeral", "comoFunciona", "telas"];

/**
 * Onde a seta do teclado é do próprio controle (Review Focus 2): trocar de
 * aba, avançar o vídeo, mover o cursor num campo.
 */
const SETA_DO_CONTROLE = '[role="tab"], video, input, textarea, select, [contenteditable]';
/** Onde o arrasto é do controle: a barra do vídeo, a seleção num campo. */
const ARRASTO_DO_CONTROLE = "video, input, textarea, select, [contenteditable]";

/** Espaço do vídeo (ou da arte) na tela: a coluna da esquerda a partir de 768 px. */
const TAMANHOS_MIDIA = "(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw";

interface PainelProdutoProps {
  item: ItemCatalogo;
  /** Lugar do produto no filtro atual: com 1 só, sem setas nem troca. */
  posicao: { indice: number; total: number };
  /** Sentido da última troca (para a animação da Task 7); 0 é salto. */
  direcao: -1 | 0 | 1;
  aoFechar: () => void;
  aoPasso: (d: -1 | 1) => void;
}

/** "Assistir ao vídeo: Replay para quadras (52 s)", como na grade da v2.2. */
function rotuloAssistir(item: ItemCatalogo, duracao: string | undefined) {
  return landingContent.aplicativos.grid.playLabel
    .replace("{nome}", item.nome)
    .replace(" ({duração})", duracao ? ` (${duracao})` : "");
}

/**
 * O painel do estado aberto (spec 2026-10-16, §3.2 e §8.3): o cabeçalho
 * (tipo, selo, nome, link do site, ‹ › e o X) e as abas no padrão APG. O
 * título recebe o foco ao abrir. ← → trocam de produto com o foco no painel,
 * menos nas abas, no vídeo e em campos; o dedo segue a regra do coverflow.
 */
export function PainelProduto({ item, posicao, direcao, aoFechar, aoPasso }: PainelProdutoProps) {
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const [aba, setAba] = useState<Aba>("visaoGeral");
  const painelRef = useRef<HTMLElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);
  const inicioRef = useRef<{ x: number; y: number } | null>(null);
  const arrastouRef = useRef(false);
  // A troca veio daqui (teclado ou dedo): se o foco estava num controle que
  // saiu com o produto anterior (o "Assistir", por exemplo), ele volta ao título.
  const trocouAquiRef = useRef(false);
  const varios = posicao.total > 1;

  // §8.3: ao abrir, o foco vai para o título (sem rolar: o painel está
  // onde estava o coverflow, e o link direto já rola até a seção).
  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!trocouAquiRef.current) return;
    trocouAquiRef.current = false;
    const foco = document.activeElement;
    if (!painelRef.current?.contains(foco)) tituloRef.current?.focus({ preventScroll: true });
  }, [item.slug]);

  // O vídeo não continua tocando escondido atrás de outra aba.
  useEffect(() => {
    if (aba === "visaoGeral") return;
    painelRef.current?.querySelectorAll("video").forEach((video) => {
      if (!video.paused) video.pause();
    });
  }, [aba]);

  const trocar = (d: -1 | 1) => {
    trocouAquiRef.current = true;
    aoPasso(d);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    // Alt+← é o voltar do navegador; com modificador, a tecla não é nossa.
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (!varios || (e.target instanceof Element && e.target.closest(SETA_DO_CONTROLE))) return;
    e.preventDefault();
    trocar(e.key === "ArrowRight" ? 1 : -1);
  };

  // Abas (APG, ativação automática): ← → dão a volta, Home e End vão às pontas.
  const onKeyDownAba = (e: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const destinos: Record<string, number> = {
      ArrowRight: (indice + 1) % ABAS.length,
      ArrowLeft: (indice - 1 + ABAS.length) % ABAS.length,
      Home: 0,
      End: ABAS.length - 1,
    };
    const destino = destinos[e.key];
    const proxima = destino === undefined ? undefined : ABAS[destino];
    if (destino === undefined || proxima === undefined) return;
    e.preventDefault();
    setAba(proxima);
    abasRef.current[destino]?.focus();
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    arrastouRef.current = false;
    inicioRef.current = null;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest(ARRASTO_DO_CONTROLE)) return;
    inicioRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const inicio = inicioRef.current;
    inicioRef.current = null;
    if (!inicio || !varios) return;
    const passo = passoDoDeslize(e.clientX - inicio.x, e.clientY - inicio.y);
    if (passo === null) return;
    arrastouRef.current = true;
    trocar(passo);
  };

  // O clique que o navegador manda depois do arrasto não vale.
  const onClickCapture = (e: MouseEvent<HTMLElement>) => {
    if (!arrastouRef.current) return;
    arrastouRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const idAba = (chave: Aba) => `${id}-aba-${chave}`;
  const idConteudo = (chave: Aba) => `${id}-conteudo-${chave}`;
  const { video } = item.painel;

  return (
    <section
      ref={painelRef}
      className="catalogo__painel"
      aria-labelledby={idTitulo}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        inicioRef.current = null;
      }}
      onClickCapture={onClickCapture}
    >
      <header className="catalogo__painel-cabeca">
        <div className="catalogo__painel-titulo">
          <div className="catalogo__meta">
            <span className="catalogo__tipo">{catalogoUi.tipos[item.tipo]}</span>
            <SeloStatus status={item.fase} />
          </div>
          <h3 ref={tituloRef} id={idTitulo} className="catalogo__painel-nome" tabIndex={-1}>
            {item.nome}
          </h3>
        </div>
        <div className="catalogo__painel-acoes">
          {item.siteUrl && (
            <a className="catalogo__painel-site" href={item.siteUrl}>
              {catalogoUi.siteLink}
            </a>
          )}
          {varios && (
            <>
              <button
                type="button"
                className="catalogo__painel-seta catalogo__painel-seta--anterior"
                aria-label={catalogoUi.anterior}
                onClick={() => aoPasso(-1)}
              >
                <Chevron sentido={-1} />
              </button>
              <button
                type="button"
                className="catalogo__painel-seta catalogo__painel-seta--proxima"
                aria-label={catalogoUi.proximo}
                onClick={() => aoPasso(1)}
              >
                <Chevron sentido={1} />
              </button>
            </>
          )}
          <button type="button" className="catalogo__fechar" aria-label={catalogoUi.fechar} onClick={aoFechar}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="catalogo__abas" role="tablist" aria-labelledby={idTitulo}>
        {ABAS.map((chave, indice) => (
          <button
            key={chave}
            ref={(no) => {
              abasRef.current[indice] = no;
            }}
            id={idAba(chave)}
            type="button"
            role="tab"
            className="catalogo__aba"
            aria-selected={aba === chave}
            aria-controls={idConteudo(chave)}
            tabIndex={aba === chave ? 0 : -1}
            onClick={() => setAba(chave)}
            onKeyDown={(e) => onKeyDownAba(e, indice)}
          >
            {catalogoUi.abas[chave]}
          </button>
        ))}
      </div>

      <div className="catalogo__painel-conteudo" data-direcao={direcao}>
        <div
          id={idConteudo("visaoGeral")}
          role="tabpanel"
          className="catalogo__aba-conteudo catalogo__aba-conteudo--visao"
          aria-labelledby={idAba("visaoGeral")}
          tabIndex={0}
          hidden={aba !== "visaoGeral"}
        >
          <div className="catalogo__painel-midia">
            {video ? (
              <VideoDemo
                key={item.slug}
                video={video}
                playLabel={rotuloAssistir(item, video.durationLabel)}
                sizes={TAMANHOS_MIDIA}
              />
            ) : (
              // Os inventados, sem vídeo: a arte em tamanho grande, com a
              // descrição da cena (aqui ela é a imagem principal, não enfeite).
              <picture>
                <source
                  type="image/avif"
                  srcSet={`${item.arte.base}-480.avif 480w, ${item.arte.base}.avif 800w`}
                  sizes={TAMANHOS_MIDIA}
                />
                <img
                  className="catalogo__painel-arte"
                  src={`${item.arte.base}.jpg`}
                  srcSet={`${item.arte.base}-480.jpg 480w, ${item.arte.base}.jpg 800w`}
                  sizes={TAMANHOS_MIDIA}
                  width={800}
                  height={1200}
                  alt={item.arte.alt}
                  decoding="async"
                />
              </picture>
            )}
          </div>
          <VisaoGeralTexto item={item} />
        </div>
        <div
          id={idConteudo("comoFunciona")}
          role="tabpanel"
          className="catalogo__aba-conteudo"
          aria-labelledby={idAba("comoFunciona")}
          tabIndex={0}
          hidden={aba !== "comoFunciona"}
        >
          <PassosProduto item={item} />
        </div>
        <div
          id={idConteudo("telas")}
          role="tabpanel"
          className="catalogo__aba-conteudo"
          aria-labelledby={idAba("telas")}
          tabIndex={0}
          hidden={aba !== "telas"}
        >
          <TelasProduto key={item.slug} item={item} navegavel />
        </div>
      </div>
    </section>
  );
}
