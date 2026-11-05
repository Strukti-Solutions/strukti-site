/**
 * Dados do catálogo de produtos (spec 2026-10-16, §5): os 11 itens do
 * coverflow e do painel, e a microcopy de interface (`catalogoUi`).
 *
 * Os 4 produtos reais vêm primeiro. Replay, Rota de Vendas e Fleet
 * reaproveitam por referência o que já está aprovado em `landingContent`
 * (nome, vídeo, a fase dos aplicativos e, no Rota de Vendas, a frase), sem
 * duplicar. Os textos novos deles (frase do replay e do Fleet, para quem é,
 * benefícios e como funciona) são PROPOSTA — aguardando aprovação do Thiago
 * (docs/landing-copy.md, "Catálogo"), e só usam fatos que já estão no site:
 * nada de cliente, quadra instalada ou resultado medido. O Air Central não
 * está em `landingContent`: todos os textos dele são PROPOSTA, e os fatos vêm
 * do código do projeto (github.com/Segunddo/Air_Central), não do site.
 *
 * Os outros 7 são inventados para mostrar a escala do catálogo (Q14/Q25/Q28):
 * levam `ficticio: true` (procure por isto para trocar) e nunca o marcador de
 * dado pendente, para o check:placeholders não falhar por eles.
 *
 * A arte e as telas apontam para `public/catalogo/<slug>/` (contrato da §6.1).
 * A arte dos cartões é a final (22/10/2026, `scripts/catalogo-arte/`; a do
 * Air Central veio depois, no mesmo kit); as telas seguem ilustrativas (§5.4)
 * até chegarem as capturas reais, que trocam os arquivos com os mesmos nomes,
 * sem mexer aqui.
 */
import type { Interest } from "@/lib/interest";
import { landingContent, type ProductStatus, type Project } from "./landing";

export type TipoProduto = "hardware" | "aplicativo" | "site";

export interface Passo {
  titulo: string;
  texto: string;
}

/** Tela do painel (§5.4): ilustrativa até chegarem as capturas reais. */
export interface TelaIlustrativa {
  src: string;
  alt: string;
  moldura: "celular" | "navegador";
}

export interface ItemCatalogo {
  /** Também o id do cartão e a âncora (`#slug`). */
  slug: string;
  tipo: TipoProduto;
  nome: string;
  /** Uma frase, no cartão do centro (até ~110 caracteres, §5.3). */
  frase: string;
  /** Rótulo em `landingContent.statusLabels`. */
  fase: ProductStatus;
  /**
   * Selo "Ilustração do conceito", ao lado do selo de fase no cartão e no
   * painel: o replay e o Air Central, cuja arte mostra uma caixa que ainda é
   * conceito (ADR-009, item 4, e ADR-011, revisão de 05/11/2026: o site a identifica sempre assim; MASTER §8.14).
   */
  seloConceito?: string;
  /** Item inventado (Q28): procurar por isto para trocar. */
  ficticio?: true;
  arte: {
    /** "/catalogo/<slug>/cartao" (+ .avif/.jpg, -480). */
    base: string;
    alt: string;
    /** Só quem tem loop (os reais). */
    loop?: { webm: string; mp4: string };
    /**
     * Corte da arte grande no painel (`object-position`), nos itens sem vídeo.
     * O quadro 16:9 mostra só ~37% da altura do retrato, e o corte do centro
     * (o padrão) perde um objeto que fica no alto do cartão.
     */
    posicaoPainel?: string;
  };
  painel: {
    /**
     * Replay, Rota de Vendas e Fleet reaproveitam os vídeos atuais; o Air
     * Central (ainda sem vídeo) e os inventados mostram a arte grande.
     */
    video?: Project["video"];
    paraQuem: string;
    /** 3 a 4. */
    beneficios: readonly string[];
    comoFunciona: readonly [Passo, Passo, Passo];
    telas: readonly TelaIlustrativa[];
  };
  siteUrl?: string | null;
  interesse: Interest;
}

/** Um aplicativo de `landingContent.aplicativos.projects`, pelo slug. */
function projeto(slug: string): Project {
  const encontrado = landingContent.aplicativos.projects.find((p) => p.slug === slug);
  if (!encontrado) throw new Error(`Projeto "${slug}" não está em landingContent.aplicativos.projects`);
  return encontrado;
}

function arte(slug: string, alt: string, comLoop = false): ItemCatalogo["arte"] {
  const base = `/catalogo/${slug}/cartao`;
  return comLoop ? { base, alt, loop: { webm: `${base}-loop.webm`, mp4: `${base}-loop.mp4` } } : { base, alt };
}

/** As 3 telas de um item; o `alt` de cada uma diz que ela é ilustrativa (§5.4). */
function telas(
  slug: string,
  moldura: TelaIlustrativa["moldura"],
  descricoes: readonly [string, string, string],
): readonly TelaIlustrativa[] {
  return descricoes.map((descricao, i) => ({
    src: `/catalogo/${slug}/tela-${i + 1}.svg`,
    alt: `Tela ilustrativa: ${descricao}`,
    moldura,
  }));
}

const REPLAY = landingContent.produtos.replay;
const ROTA = projeto("rota-de-vendas");
const FLEET = projeto("fleet-analytics-bi");

/**
 * O rótulo aprovado do selo de conceito (ADR-009, item 4) mora no replay, onde
 * nasceu; o Air Central usa o mesmo texto, porque a caixa dele também é conceito.
 */
const SELO_CONCEITO = REPLAY.illustrationBadge;

/** Ordem da §5.2: os 4 reais primeiro, depois os inventados, alternando os tipos. */
export const CATALOGO: readonly ItemCatalogo[] = [
  // ── Reais ────────────────────────────────────────────────────────────────
  {
    slug: "replay",
    tipo: "hardware",
    nome: REPLAY.name,
    // A frase do cartão da v2.2 (130 caracteres) passa do limite da §5.3.
    frase: "Para quadras de aluguel: o jogador aperta um botão na beira da quadra e leva o lance no celular.",
    fase: "piloto",
    seloConceito: SELO_CONCEITO,
    arte: arte(
      "replay",
      "A caixa do botão do replay no alambrado de uma quadra vazia à noite, com névoa dos refletores e o LED ciano aceso.",
      true,
    ),
    painel: {
      video: REPLAY.video,
      paraQuem: "Donos de quadras de aluguel que querem dar ao jogador mais um motivo para voltar.",
      beneficios: [
        "Salva os últimos 30 segundos, na hora em que o jogador aperta.",
        "O lance chega no celular, pronto para baixar e compartilhar.",
        "Funciona em qualquer quadra: society, areia e futsal.",
        "Usa o Wi-Fi da própria arena.",
      ],
      comoFunciona: [
        { titulo: "O jogador aperta o botão", texto: "Saiu um lance bonito? Ele aperta o botão na beira da quadra." },
        {
          titulo: "O sistema salva o lance",
          texto: "A câmera da quadra guarda os últimos 30 segundos e envia pelo Wi-Fi da arena.",
        },
        {
          titulo: "O lance chega no celular",
          texto: "O jogador baixa ou compartilha o lance, que fica disponível por 7 dias.",
        },
      ],
      telas: telas("replay", "celular", [
        "a busca do lance.",
        "a lista de lances do dia.",
        "o lance aberto, com os botões de baixar e compartilhar.",
      ]),
    },
    siteUrl: REPLAY.siteUrl,
    interesse: "replay",
  },
  {
    slug: "rota-de-vendas",
    tipo: "aplicativo",
    nome: ROTA.name,
    frase: ROTA.summary,
    fase: ROTA.status,
    arte: arte(
      "rota-de-vendas",
      "Um celular com a rota do Rota de Vendas no suporte do painel de um carro parado, com a cidade desfocada no para-brisa.",
      true,
    ),
    painel: {
      video: ROTA.video,
      paraQuem:
        "Empresas com vendedor externo e entrega própria que ainda controlam pedidos e rotas na planilha, no papel ou no WhatsApp.",
      // Partem dos `highlights[].lead` do Rota de Vendas, que já estão aprovados.
      beneficios: [
        "Clientes na mão do vendedor, com botões para ligar e abrir no mapa.",
        "Pedido com o número do sistema que você já usa.",
        "Rota de entrega por cidade, com o roteiro em Word, PDF e Excel.",
        "Funciona sem internet: tudo fica guardado no aparelho.",
      ],
      comoFunciona: [
        {
          titulo: "O vendedor acha o cliente",
          texto: "Busca por nome, cidade ou CNPJ, no celular, mesmo sem sinal.",
        },
        {
          titulo: "O pedido entra",
          texto: "Com o número do sistema que a empresa já usa. Número repetido não passa.",
        },
        {
          titulo: "A entrega sai na rota",
          texto: "As paradas saem agrupadas por cidade, com a lista de carga de cada uma.",
        },
      ],
      telas: telas("rota-de-vendas", "celular", [
        "a lista de clientes, com a busca.",
        "um pedido com o número do outro sistema.",
        "a rota de entrega, com as paradas agrupadas por cidade.",
      ]),
    },
    siteUrl: null,
    interesse: "aplicativo",
  },
  {
    // Fatos do código do projeto (github.com/Segunddo/Air_Central): a central
    // de computador, os módulos ESP em rede mesh, os comandos aprendidos do
    // controle remoto e a grade das aulas virando regras de ligar e desligar.
    // A caixinha impressa em 3D ainda é conceito: daí o selo (ADR-009, item 4; ADR-011, revisão de 05/11/2026).
    slug: "air-central",
    tipo: "hardware",
    nome: "Air Central",
    frase: "Para faculdades e escolas: o ar de cada sala liga e desliga sozinho, no horário das aulas.",
    fase: "desenvolvimento",
    seloConceito: SELO_CONCEITO,
    arte: {
      ...arte(
        "air-central",
        "O módulo do Air Central, uma caixinha impressa em 3D com o LED ciano aceso, numa prateleira sob o ar-condicionado desligado de uma sala de aula vazia à noite.",
        true,
      ),
      // O módulo fica a 16–28% da altura (para o texto do cartão não cobri-lo):
      // no painel, o corte sobe para mostrar o ar, o módulo e a prateleira.
      posicaoPainel: "50% 6%",
    },
    painel: {
      paraQuem: "Faculdades e escolas com muitas salas climatizadas, onde o ar-condicionado fica ligado com a sala vazia.",
      beneficios: [
        "Cada ar-condicionado liga no início da aula e desliga no fim.",
        "Importa a grade do sistema acadêmico, com integração sob medida.",
        "Aprende os comandos do controle remoto do ar-condicionado.",
        "Módulos em rede mesh, sem cabo entre as salas.",
      ],
      comoFunciona: [
        {
          titulo: "Um módulo em cada sala",
          // No código, a central aprende os comandos (um jogo só) e grava todos
          // na memória de cada módulo: não é cada módulo que lê o controle da sala.
          texto: "Ele guarda os comandos do controle remoto do ar-condicionado, aprendidos pela central.",
        },
        {
          titulo: "A grade vira automação",
          texto: "A central importa os horários das aulas e cria as regras de ligar e desligar.",
        },
        {
          titulo: "O ar segue as aulas",
          texto: "Cada módulo liga o ar no início da aula e desliga quando ela termina.",
        },
      ],
      // A central é um programa de computador: moldura de navegador, como nos sites.
      telas: telas("air-central", "navegador", [
        "a lista de salas, com os módulos da rede.",
        "o cadastro dos comandos do controle remoto.",
        "os horários de ligar e desligar de uma sala.",
      ]),
    },
    siteUrl: null,
    interesse: "outro",
  },
  {
    slug: "fleet-analytics-bi",
    tipo: "aplicativo",
    nome: FLEET.name,
    // O resumo da v2.2 (137 caracteres) passa do limite da §5.3.
    frase: "Para quem cuida de uma frota: do rastreador de cada veículo aos chamados de reboque, no mesmo lugar.",
    fase: FLEET.status,
    arte: arte(
      "fleet-analytics-bi",
      "O painel do Fleet Analytics BI num monitor de um escritório escuro, com o mapa da frota e a janela para a cidade.",
      true,
    ),
    painel: {
      video: FLEET.video,
      paraQuem:
        "Empresas que cuidam de uma frota e querem rastreador, custos, abastecimentos, viagens e chamados de reboque num lugar só.",
      beneficios: [
        "Cada veículo acompanhado em tempo real, a partir do rastreador.",
        "Custos, abastecimentos e viagens no mesmo lugar.",
        "Alerta de abastecimento com consumo fora do padrão.",
        "Chamados de reboque com despacho, vistoria digital e faturamento.",
      ],
      comoFunciona: [
        {
          titulo: "O rastreador manda os dados",
          texto: "Cada veículo envia a posição, e o mapa mostra a frota em tempo real.",
        },
        {
          titulo: "Os números se juntam",
          texto: "Trajetos, custos e abastecimentos de cada veículo aparecem na mesma tela.",
        },
        {
          titulo: "O reboque também entra",
          texto: "Do despacho à vistoria digital e ao faturamento, cada chamado fica registrado.",
        },
      ],
      telas: telas("fleet-analytics-bi", "celular", [
        "o mapa da frota em tempo real.",
        "os custos e as viagens de um veículo.",
        "a lista de chamados de reboque.",
      ]),
    },
    siteUrl: null,
    interesse: "aplicativo",
  },

  // ── Inventados (ficticio: true) ─────────────────────────────────────────
  {
    slug: "placar-conectado",
    tipo: "hardware",
    nome: "Placar conectado para quadras",
    frase: "Para quadras de aluguel: o placar do jogo numa tela na parede, marcado pelo celular.",
    fase: "desenvolvimento",
    ficticio: true,
    arte: arte("placar-conectado", "Um placar de pontos acesos, suspenso diante da janela, com a cidade desfocada à noite."),
    painel: {
      paraQuem: "Arenas que querem um placar que todo mundo vê, da quadra e da arquibancada, sem placa de virar.",
      beneficios: [
        "Placar grande, visível de qualquer ponto da quadra.",
        "Pontos marcados pelo celular, sem sair do jogo.",
        "Tempo de jogo e de aluguel na mesma tela.",
        "Usa o Wi-Fi da própria arena.",
      ],
      comoFunciona: [
        { titulo: "Instalamos o placar", texto: "Fixamos a tela na parede e ligamos ao Wi-Fi da arena." },
        { titulo: "Marque pelo celular", texto: "Quem joga marca os pontos e o tempo pelo celular, sem sair da quadra." },
        { titulo: "Todo mundo acompanha", texto: "O placar aparece grande na tela, para quem joga e para quem assiste." },
      ],
      telas: telas("placar-conectado", "celular", [
        "o placar do jogo no celular.",
        "o tempo de aluguel da quadra.",
        "os jogos do dia.",
      ]),
    },
    siteUrl: null,
    interesse: "outro",
  },
  {
    slug: "agenda-de-quadras",
    tipo: "aplicativo",
    nome: "Agenda de quadras",
    frase: "Para arenas: os horários das quadras num lugar só, com reserva pelo celular.",
    fase: "desenvolvimento",
    ficticio: true,
    arte: arte(
      "agenda-de-quadras",
      "Um celular num suporte de mesa com a grade de horários das quadras, diante da janela, à noite.",
    ),
    painel: {
      paraQuem: "Arenas e quadras de aluguel que ainda marcam horário pelo WhatsApp, no caderno ou na planilha.",
      beneficios: [
        "Horários de todas as quadras numa tela só.",
        "Reserva pelo celular, sem troca de mensagens.",
        "Aviso para o cliente antes do horário.",
      ],
      comoFunciona: [
        { titulo: "Cadastre as quadras", texto: "Você informa as quadras, os horários e o valor de cada um." },
        { titulo: "O cliente reserva", texto: "Ele escolhe um horário livre no celular e recebe a confirmação." },
        { titulo: "Acompanhe a semana", texto: "A agenda mostra o que está reservado, o que está livre e quem vai jogar." },
      ],
      telas: telas("agenda-de-quadras", "celular", [
        "a agenda da semana.",
        "a escolha de um horário livre.",
        "a confirmação da reserva.",
      ]),
    },
    siteUrl: null,
    interesse: "aplicativo",
  },
  {
    slug: "site-clinicas",
    tipo: "site",
    nome: "Site para clínicas",
    frase: "Um site simples para a clínica: especialidades, endereço e um botão para marcar pelo WhatsApp.",
    fase: "desenvolvimento",
    ficticio: true,
    arte: arte(
      "site-clinicas",
      "Um notebook aberto com a página de uma clínica, com as especialidades e o mapa, sobre a mesa à noite.",
    ),
    painel: {
      paraQuem: "Clínicas e consultórios que ainda não têm site, ou têm um que não funciona bem no celular.",
      beneficios: [
        "Feito primeiro para o celular.",
        "Botão para marcar a consulta pelo WhatsApp.",
        "Especialidades, equipe e endereço com mapa.",
      ],
      comoFunciona: [
        {
          titulo: "Conversa sobre a clínica",
          texto: "Entendemos o que o paciente precisa achar: especialidades, convênios e endereço.",
        },
        { titulo: "Montamos o site", texto: "Você vê uma primeira versão e pede os ajustes antes de publicar." },
        { titulo: "No ar, com suporte", texto: "Publicamos o site e cuidamos dele depois, com a mesma equipe." },
      ],
      telas: telas("site-clinicas", "navegador", [
        "a página inicial da clínica.",
        "a lista de especialidades.",
        "o endereço com o mapa e o botão do WhatsApp.",
      ]),
    },
    siteUrl: null,
    interesse: "outro",
  },
  {
    slug: "totem-check-in",
    tipo: "hardware",
    nome: "Totem de check-in para academias",
    frase: "Para academias: o aluno faz o check-in no totem da entrada, e a recepção vê quem chegou.",
    fase: "desenvolvimento",
    ficticio: true,
    arte: arte("totem-check-in", "Um totem de check-in com a tela acesa, de pé diante de uma parede de vidro, à noite."),
    painel: {
      paraQuem: "Academias e estúdios que controlam a entrada no caderno, na ficha de papel ou de cabeça.",
      beneficios: [
        "Check-in na entrada, sem fila na recepção.",
        "Lista de quem está treinando agora.",
        "Aviso de mensalidade vencida na hora do check-in.",
        "Usa o Wi-Fi da própria academia.",
      ],
      comoFunciona: [
        { titulo: "Instalamos o totem", texto: "Fixamos o totem na entrada e ligamos ao Wi-Fi da academia." },
        {
          titulo: "O aluno se identifica",
          texto: "Ele digita o código ou aproxima o celular, e a entrada fica registrada.",
        },
        {
          titulo: "A recepção acompanha",
          texto: "O painel mostra quem chegou, a que horas e quem está com a mensalidade em dia.",
        },
      ],
      telas: telas("totem-check-in", "celular", [
        "a lista de quem chegou hoje.",
        "a ficha de um aluno.",
        "os horários de mais movimento.",
      ]),
    },
    siteUrl: null,
    interesse: "outro",
  },
  {
    slug: "estoque-oficinas",
    tipo: "aplicativo",
    nome: "Estoque para oficinas",
    frase: "Para oficinas: cada peça que entra e sai fica registrada, e o aviso de reposição chega antes de faltar.",
    fase: "desenvolvimento",
    ficticio: true,
    arte: arte(
      "estoque-oficinas",
      "Um celular com a lista de peças, encostado num gaveteiro de oficina sobre a mesa, à noite.",
    ),
    painel: {
      paraQuem: "Oficinas mecânicas que controlam as peças de memória, no caderno ou numa planilha que ninguém atualiza.",
      beneficios: [
        "Entrada e saída de peças pelo celular.",
        "Aviso quando uma peça está acabando.",
        "Cada peça ligada à ordem de serviço.",
        "No celular e no computador.",
      ],
      comoFunciona: [
        { titulo: "Cadastre as peças", texto: "Você registra as peças, com a quantidade e o mínimo de cada uma." },
        { titulo: "Registre o uso", texto: "Cada peça usada no serviço sai do estoque pelo celular." },
        { titulo: "Reponha a tempo", texto: "O aplicativo avisa o que está acabando e monta a lista de compra." },
      ],
      telas: telas("estoque-oficinas", "celular", [
        "a lista de peças, com a quantidade de cada uma.",
        "a saída de uma peça para a ordem de serviço.",
        "a lista de compra.",
      ]),
    },
    siteUrl: null,
    interesse: "aplicativo",
  },
  {
    slug: "vitrine-lojas",
    tipo: "site",
    nome: "Vitrine para lojas de bairro",
    frase: "Para lojas de bairro: os produtos numa vitrine na internet, com pedido pelo WhatsApp.",
    fase: "desenvolvimento",
    ficticio: true,
    arte: arte(
      "vitrine-lojas",
      "Um tablet num suporte com a vitrine de uma loja e uma sacola de papel atrás, sobre a mesa à noite.",
    ),
    painel: {
      paraQuem:
        "Lojas de bairro que vendem pelo WhatsApp e pelo Instagram e querem mostrar os produtos num endereço só.",
      beneficios: [
        "Produtos com foto, preço e disponibilidade.",
        "Pedido pelo WhatsApp, com a lista pronta.",
        "Feita primeiro para o celular.",
        "Endereço e horário da loja à mostra.",
      ],
      comoFunciona: [
        { titulo: "Conversa sobre a loja", texto: "Entendemos o que você vende e como o cliente costuma pedir." },
        { titulo: "Montamos a vitrine", texto: "Você vê uma primeira versão e pede os ajustes antes de publicar." },
        { titulo: "No ar, com suporte", texto: "Publicamos a vitrine e cuidamos dela depois, com a mesma equipe." },
      ],
      telas: telas("vitrine-lojas", "navegador", [
        "a vitrine com os produtos em grade.",
        "a página de um produto.",
        "o pedido pronto para enviar pelo WhatsApp.",
      ]),
    },
    siteUrl: null,
    interesse: "outro",
  },
  {
    slug: "contador-de-fluxo",
    tipo: "hardware",
    nome: "Contador de fluxo para lojas",
    frase: "Para lojas: um sensor sobre a porta conta quem entra, hora a hora, e mostra no celular.",
    fase: "desenvolvimento",
    ficticio: true,
    arte: arte("contador-de-fluxo", "Um sensor sobre a porta de vidro de uma loja, com o leque de detecção ciano aceso, à noite."),
    painel: {
      paraQuem: "Lojas que querem saber os horários de mais movimento para montar a escala e as promoções.",
      beneficios: [
        "Contagem de quem entra, hora a hora.",
        "Horários de pico no celular.",
        "Comparação entre dias e semanas.",
        "Conta as pessoas sem gravar imagem.",
      ],
      comoFunciona: [
        { titulo: "Instalamos o sensor", texto: "Fixamos o sensor sobre a porta e ligamos ao Wi-Fi da loja." },
        { titulo: "Ele conta as entradas", texto: "Cada pessoa que entra é contada, sem gravar imagem de ninguém." },
        { titulo: "Veja no celular", texto: "O aplicativo mostra o movimento por hora, por dia e por semana." },
      ],
      telas: telas("contador-de-fluxo", "celular", [
        "o movimento do dia, hora a hora.",
        "a comparação entre as semanas.",
        "os horários de pico.",
      ]),
    },
    siteUrl: null,
    interesse: "outro",
  },
];

/**
 * Microcopy de interface do catálogo (não é claim de marketing nem dado do
 * negócio; spec §3 e §8). `{i}`, `{n}` e `{nome}` são preenchidos pelo site.
 */
export const catalogoUi = {
  // Não "Produtos" (§8.1): a seção #produtos já é a região com esse nome, e
  // duas regiões com o mesmo nome confundem a lista de regiões do leitor.
  rotuloCarrossel: "Catálogo de produtos",
  roledescCarrossel: "carrossel",
  roledescProduto: "produto",
  posicao: "{i} de {n}: {nome}",
  /** A posição na descrição do título do painel, que já diz o nome. */
  posicaoCurta: "{i} de {n}",
  /** O "Assistir" do vídeo no painel e o link para ele na ficha sem JS. */
  assistir: "Assistir ao vídeo: {nome} ({duração})",
  verDetalhes: "Ver detalhes",
  saberMais: "Quero saber mais",
  /**
   * Fim do nome acessível de "Ver detalhes" e "Quero saber mais", em texto
   * visualmente oculto: há um de cada por produto no HTML, e o nome diz de
   * qual produto cada um é (WCAG 2.4.4/2.4.9).
   */
  verDetalhesDe: "de {nome}",
  saberMaisSobre: "sobre {nome}",
  rotuloFiltro: "Filtrar por tipo",
  fechar: "Fechar",
  anterior: "Produto anterior",
  proximo: "Próximo produto",
  irPara: "Ir para {nome}",
  /** Grupo das miniaturas do estado aberto. */
  rotuloFita: "Escolher produto",
  abas: { visaoGeral: "Visão geral", comoFunciona: "Como funciona", telas: "Telas" },
  paraQuem: "Para quem é",
  siteLink: "Ver o site",
  telaAnterior: "Tela anterior",
  proximaTela: "Próxima tela",
  filtros: { todos: "Todos", hardware: "Hardware", aplicativo: "Aplicativos", site: "Sites" },
  tipos: { hardware: "Hardware", aplicativo: "Aplicativo", site: "Site" },
} as const;
