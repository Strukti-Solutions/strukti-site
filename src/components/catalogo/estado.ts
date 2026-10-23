/**
 * Estado do catálogo (spec 2026-10-16, §3): filtro, produto do centro,
 * painel aberto ou fechado e o que fazer com o histórico. Tudo aqui é puro e
 * sem React; o hook (`useCatalogo`) aplica o `historico` devolvido no
 * `history` do navegador e manda o `hashchange`/`popstate` como evento `hash`.
 *
 * Regra de "sem mudança": quando um evento não muda nada, `reduzir` devolve o
 * mesmo objeto de estado (o React não renderiza de novo) e `historico: null`.
 */
import type { ItemCatalogo, TipoProduto } from "@/content/catalogo";

export type Filtro = "todos" | TipoProduto;

export interface EstadoCatalogo {
  filtro: Filtro;
  /** Slug do produto do centro (ou do painel, quando aberto). */
  ativo: string;
  aberto: boolean;
  /** A abertura criou uma entrada no histórico: fechar faz `history.back()`. */
  entradaPropria: boolean;
  /** Sentido da última troca, para a animação; 0 é salto sem sentido. */
  direcao: -1 | 0 | 1;
}

/**
 * O que o hook faz no `history` (§3.4): `push` ao abrir por clique, `replace`
 * ao trocar com o painel aberto, `back` ao fechar o que a gente abriu e
 * `limpar` (tira a âncora sem criar entrada) ao fechar o que veio por link.
 */
export type EfeitoHistorico =
  | { tipo: "push" | "replace"; slug: string }
  | { tipo: "back" }
  | { tipo: "limpar" }
  | null;

export type EventoCatalogo =
  | { tipo: "centralizar"; slug: string }
  | { tipo: "passo"; delta: -1 | 1 }
  | { tipo: "irPara"; posicao: "inicio" | "fim" }
  | { tipo: "abrir" }
  | { tipo: "fechar" }
  | { tipo: "filtrar"; filtro: Filtro }
  /** Âncora atual da página (sem o `#`); `null` quando não há. */
  | { tipo: "hash"; slug: string | null };

interface Resultado {
  estado: EstadoCatalogo;
  historico: EfeitoHistorico;
}

export function estadoInicial(itens: readonly ItemCatalogo[]): EstadoCatalogo {
  const primeiro = itens[0];
  if (!primeiro) throw new Error("O catálogo precisa de pelo menos 1 item");
  return { filtro: "todos", ativo: primeiro.slug, aberto: false, entradaPropria: false, direcao: 0 };
}

/** Itens do filtro, na ordem do catálogo. "Todos" devolve a própria lista. */
export function filtrar(itens: readonly ItemCatalogo[], filtro: Filtro): readonly ItemCatalogo[] {
  return filtro === "todos" ? itens : itens.filter((item) => item.tipo === filtro);
}

/**
 * Posição do cartão `indice` em relação ao do centro, dando a volta: fica em
 * (−total/2, total/2]. O intervalo é aberto à esquerda para que, com total
 * par, o cartão oposto fique só em +total/2. Assim, com 2 itens, o lateral é
 * sempre +1, nunca −1 e +1 ao mesmo tempo (sem cartão duplicado, §3.1).
 */
export function deslocamento(indice: number, indiceAtivo: number, total: number): number {
  if (total <= 1) return 0;
  const d = (((indice - indiceAtivo) % total) + total) % total;
  return d > total / 2 ? d - total : d;
}

/** Resultado sem efeito no histórico (sendo o mesmo objeto, é "sem mudança"). */
const semEfeito = (estado: EstadoCatalogo): Resultado => ({ estado, historico: null });

/** Índice do ativo na lista; fora dela (não deveria acontecer), o 1º. */
function indiceDe(lista: readonly ItemCatalogo[], slug: string): number {
  return Math.max(0, lista.findIndex((item) => item.slug === slug));
}

/** Sentido do caminho mais curto de `de` até `para` no carrossel. */
function sentido(lista: readonly ItemCatalogo[], de: string, para: string): -1 | 0 | 1 {
  return Math.sign(deslocamento(indiceDe(lista, para), indiceDe(lista, de), lista.length)) as -1 | 0 | 1;
}

/**
 * Troca o ativo dentro do filtro atual. Com o painel aberto, a entrada do
 * histórico é substituída pelo novo `#slug`; fechado, o histórico não muda.
 */
function trocarAtivo(estado: EstadoCatalogo, slug: string, direcao: -1 | 0 | 1): Resultado {
  if (slug === estado.ativo) return semEfeito(estado);
  return {
    estado: { ...estado, ativo: slug, direcao },
    historico: estado.aberto ? { tipo: "replace", slug } : null,
  };
}

export function reduzir(
  itens: readonly ItemCatalogo[],
  estado: EstadoCatalogo,
  evento: EventoCatalogo,
): Resultado {
  const lista = filtrar(itens, estado.filtro);

  switch (evento.tipo) {
    case "centralizar": {
      // Slug desconhecido ou fora do filtro: nada muda.
      if (!lista.some((item) => item.slug === evento.slug)) return semEfeito(estado);
      return trocarAtivo(estado, evento.slug, sentido(lista, estado.ativo, evento.slug));
    }

    case "passo": {
      const total = lista.length;
      const novo = lista[(indiceDe(lista, estado.ativo) + evento.delta + total) % total];
      // Com 1 item (ou nenhum) não há para onde ir.
      if (total <= 1 || !novo) return semEfeito(estado);
      // A direção é a do passo: com 2 itens o caminho mais curto é sempre +1.
      return trocarAtivo(estado, novo.slug, evento.delta);
    }

    case "irPara": {
      const novo = evento.posicao === "inicio" ? lista[0] : lista[lista.length - 1];
      if (!novo) return semEfeito(estado);
      return trocarAtivo(estado, novo.slug, sentido(lista, estado.ativo, novo.slug));
    }

    case "abrir": {
      // Um 2º "abrir" (duplo clique) não cria outra entrada no histórico.
      if (estado.aberto) return semEfeito(estado);
      return {
        estado: { ...estado, aberto: true, entradaPropria: true, direcao: 0 },
        historico: { tipo: "push", slug: estado.ativo },
      };
    }

    case "fechar": {
      if (!estado.aberto) return semEfeito(estado);
      return {
        estado: { ...estado, aberto: false, entradaPropria: false, direcao: 0 },
        historico: estado.entradaPropria ? { tipo: "back" } : { tipo: "limpar" },
      };
    }

    case "filtrar": {
      if (evento.filtro === estado.filtro) return semEfeito(estado);
      const novaLista = filtrar(itens, evento.filtro);
      const primeiro = novaLista[0];
      // Filtro sem itens não tem o que mostrar: fica como está.
      if (!primeiro) return semEfeito(estado);
      const mantem = novaLista.some((item) => item.slug === estado.ativo);
      const ativo = mantem ? estado.ativo : primeiro.slug;
      return {
        estado: { ...estado, filtro: evento.filtro, ativo, direcao: 0 },
        // §3.3: aberto, o produto que saiu do filtro dá lugar ao 1º do novo.
        historico: estado.aberto && !mantem ? { tipo: "replace", slug: ativo } : null,
      };
    }

    case "hash": {
      const item = evento.slug === null ? undefined : itens.find((i) => i.slug === evento.slug);
      if (!item) {
        // Sem âncora (voltar do navegador) ou âncora de outra seção, como
        // `#contato` (Review Focus 3): fecha sem `history.back()`, para a
        // página seguir até a âncora. Fechado, a âncora é ignorada.
        if (!estado.aberto) return semEfeito(estado);
        return semEfeito({ ...estado, aberto: false, entradaPropria: false, direcao: 0 });
      }
      if (estado.aberto && estado.ativo === item.slug) return semEfeito(estado);
      // §3.3: link direto para fora do filtro volta o filtro para "Todos".
      const filtro = lista.some((i) => i.slug === item.slug) ? estado.filtro : "todos";
      const direcao = estado.aberto && filtro === estado.filtro ? sentido(lista, estado.ativo, item.slug) : 0;
      // A entrada foi criada pelo navegador (link ou menu), não pela gente:
      // fechar depois só limpa a âncora.
      return semEfeito({ filtro, ativo: item.slug, aberto: true, entradaPropria: false, direcao });
    }
  }
}
