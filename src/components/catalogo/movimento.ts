import type { Transition } from "motion/react";

/**
 * Durações e curva do movimento do catálogo (spec 2026-10-16, §7), num
 * lugar só. Com movimento reduzido (`useCanAnimate() === false`), toda
 * transição vira `{ duration: 0 }`: a árvore é a mesma (ADR-004), só o
 * tempo muda.
 */

/** `cubic-bezier(.25,1,.5,1)`, a curva do coverflow (a da CSS também). */
export const CURVA = [0.25, 1, 0.5, 1] as const;

/** Cartão → painel e o caminho inverso (a superfície compartilhada). */
export const CARTAO_PAINEL: Transition = { duration: 0.6, ease: CURVA };

/** O conteúdo do painel aparece depois que ele termina de crescer. */
export const CONTEUDO_APOS_CRESCER: Transition = { delay: 0.6, duration: 0.25, ease: "easeOut" };

/** Troca de produto com o painel aberto (deslize ou crossfade). */
export const TROCA_PAINEL: Transition = { duration: 0.35, ease: CURVA };

/** Texto do cartão do centro: sobe e aparece. */
export const TEXTO_CENTRO: Transition = { duration: 0.5, ease: "easeOut" };

/** A fita entra em cascata: este passo por índice, com a duração do cartão → painel. */
export const CASCATA_FITA = 0.04;

/** Entrada da seção: um cartão a cada 70 ms. */
export const CASCATA_ENTRADA = 0.07;

/** A transição pedida, ou nenhuma (instantânea) com movimento reduzido. */
export function transicao(animar: boolean, t: Transition): Transition {
  return animar ? t : { duration: 0 };
}

/** O `layoutId` da superfície que o cartão e o painel dividem (cartão → painel). */
export function superficieId(slug: string) {
  return `catalogo-${slug}`;
}

/**
 * `layoutDependency` da superfície compartilhada. O motion só mede o cartão
 * quando o valor muda (o centro entrando no painel ou voltando dele): na
 * troca do coverflow quem anima é a CSS, sem disputa. E ele só passa a
 * animação de uma superfície para a outra quando os valores diferem: o
 * painel usa o mesmo valor dos laterais, então, ao trocar de produto com
 * ele aberto, a superfície que sai não anima o cartão antigo (escondido e
 * agora lateral); ao fechar, o centro, com outro valor, recebe o caminho
 * inverso.
 */
export const ELO_SUPERFICIE = {
  lateral: "lateral",
  centro: "centro",
  centroNoPainel: "centro-no-painel",
} as const;
