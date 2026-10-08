import { lerConfigBancada } from "./config";

/** Botão da barra do topo que leva à aba provisória `/bancada`. */
export interface LinkBancada {
  label: string;
  href: string;
}

export const LINK_BANCADA: LinkBancada = { label: "Bancada de testes", href: "/bancada" };

/**
 * Só mostra o botão quando a bancada está ligada (todas as variáveis
 * presentes): sem elas, `/bancada` responde 404 e o botão levaria a uma
 * página de erro. Lido no servidor; a home é estática, então na Vercel vale
 * o que estiver configurado no build.
 */
export function linkBancadaSeAtiva(): LinkBancada | undefined {
  return lerConfigBancada() ? LINK_BANCADA : undefined;
}
