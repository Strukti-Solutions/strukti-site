import type { ReactNode } from "react";

/**
 * Contrato de uma peça de fundo do hero (ver README, "Como trocar o visual do
 * hero"). Uma peça nova só precisa implementar isto e entrar no registro em
 * HeroBackground.tsx — não mexe no HeroContent nem no resto da página.
 */
export interface HeroVisualProps {
  /** Verdadeiro abaixo do ponto de corte mobile da seção (ver useNarrowViewport). */
  narrow: boolean;
}

/**
 * Uma peça de fundo é responsável por preencher sozinha a área do hero —
 * a raiz que ela renderiza deve ocupar `absolute inset-0 h-full w-full` (ou
 * equivalente) por conta própria, já que fica atrás do conteúdo (texto e
 * botões) posicionado por HeroBackground.
 */
export type HeroVisualComponent = (props: HeroVisualProps) => ReactNode;
