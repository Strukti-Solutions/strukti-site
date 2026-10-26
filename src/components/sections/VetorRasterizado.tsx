"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { rasterizarSvg } from "./rasterDoVetor";

/**
 * Um SVG do aparelho em vetor (a base, o suporte) que, depois de montar,
 * vira uma imagem com o mesmo desenho (desempenho, rolagem a 144 Hz): na
 * aproximação o aparelho escala a cada quadro, e o navegador redesenhava os
 * caminhos e os ladrilhos de grão do SVG a cada escala nova, 1,5 a 2 ms de
 * GPU por quadro. Uma imagem só é reamostrada.
 *
 * - No servidor, e até a imagem carregar, é o SVG de sempre (sem JavaScript,
 *   o estado parado é ele).
 * - A imagem tem a classe e o estilo do SVG e vem logo depois dele: cai no
 *   mesmo lugar, na mesma ordem de empilhamento. Carregada, o SVG ganha
 *   `data-rasterizado` e sai da pintura (globals.css).
 * - O desenho é do tamanho de layout do SVG (ver `rasterizarSvg`), refeito
 *   quando ele muda (resize, giro).
 * - Com reduced motion nada se move, e com cores forçadas o CSS ajusta os
 *   traços do SVG: nos dois, fica o SVG.
 */
export function VetorRasterizado({
  className,
  viewBox,
  style,
  children,
}: {
  className: string;
  viewBox: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [carregada, setCarregada] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(forced-colors: active)").matches) return;

    let vivo = true;
    let agendado: ReturnType<typeof setTimeout> | undefined;
    let ocioso: number | undefined;
    // Cada desenho tem um número: um mais velho que termine depois do novo é descartado.
    let geracao = 0;
    // Na tela, o tamanho e a densidade: o giro que mostra o aparelho do outro
    // enquadramento e a troca de monitor também redesenham.
    const medida = () => {
      const estilo = getComputedStyle(svg);
      return `${svg.getClientRects().length > 0}:${estilo.width}x${estilo.height}@${window.devicePixelRatio || 1}`;
    };
    let tamanho = medida();

    const desenhar = async () => {
      const esta = ++geracao;
      const novo = await rasterizarSvg(svg);
      if (vivo && esta === geracao && novo) setSrc(novo);
    };
    const cancelarOcioso = () => {
      if (ocioso !== undefined && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(ocioso);
      ocioso = undefined;
    };
    // Fora do caminho do carregamento: quando o navegador estiver ocioso.
    const agendar = (atraso: number) => {
      clearTimeout(agendado);
      cancelarOcioso();
      agendado = setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") ocioso = window.requestIdleCallback(() => void desenhar());
        else void desenhar();
      }, atraso);
    };
    const mudou = () => {
      const agora = medida();
      if (agora === tamanho) return;
      tamanho = agora;
      agendar(150);
    };

    agendar(0);

    // A densidade não muda o tamanho em CSS (o ResizeObserver não avisa): uma
    // consulta da densidade de agora avisa quando ela deixa de valer.
    let densidade: MediaQueryList | null = null;
    const aoMudarDensidade = () => {
      vigiarDensidade();
      tamanho = "";
      mudou();
    };
    const vigiarDensidade = () => {
      densidade?.removeEventListener?.("change", aoMudarDensidade);
      densidade = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      densidade.addEventListener?.("change", aoMudarDensidade);
    };
    vigiarDensidade();
    // O 1º aviso do observador é o tamanho de agora: só uma mudança redesenha.
    // Sem ResizeObserver (Safari antigo), a imagem fica do tamanho da montagem.
    const observador = typeof ResizeObserver === "function" ? new ResizeObserver(mudou) : null;
    observador?.observe(svg);
    return () => {
      vivo = false;
      clearTimeout(agendado);
      cancelarOcioso();
      observador?.disconnect();
      densidade?.removeEventListener?.("change", aoMudarDensidade);
    };
  }, []);

  return (
    <>
      <svg
        ref={svgRef}
        className={className}
        viewBox={viewBox}
        style={style}
        focusable="false"
        data-rasterizado={carregada ? "true" : undefined}
      >
        {children}
      </svg>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL desenhada no cliente, sem otimização a fazer
        <img
          className={className}
          style={style}
          src={src}
          alt=""
          decoding="async"
          onLoad={() => setCarregada(true)}
          // Quebrada, a imagem sai e o SVG volta.
          onError={() => {
            setCarregada(false);
            setSrc(null);
          }}
        />
      )}
    </>
  );
}
