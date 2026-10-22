/**
 * Todo o texto do site vive aqui, incluindo o aviso de privacidade.
 *
 * Texto aprovado pelo Thiago em docs/landing-copy.md (v2.0, 03/10/2026),
 * copiado com a mesma pontuação e acentuação. Onde o documento ainda marca
 * um dado como pendente, o valor abaixo usa a mesma marcação — não
 * inventar o dado (o `npm run check:placeholders` lista o que falta).
 *
 * `hero` é o texto dos heros "video" e "classic", que seguem no código até
 * a limpeza (fica como na v1.8, conforme a nota da v2.0); o hero da home v3
 * é `heroEstudio` (o hero de marca da v2.2, com as 3 opções em
 * `heroOpcoes`), e o hero padrão desde 15/10/2026 é `heroExpansao`
 * (proposta, aguardando aprovação; reaproveita o texto aprovado do
 * `heroEstudio`).
 */

const WHATSAPP_GENERAL_MESSAGE =
  "Olá! Vim pelo site da Strukti Soluções e quero conversar com vocês.";

/**
 * Fase de um produto, mostrada no selo (spec §3.4). O texto de cada selo
 * fica em `landingContent.statusLabels`.
 */
export type ProductStatus = "piloto" | "desenvolvimento" | "emUso" | "emBreve";

/**
 * Um aplicativo real (`aplicativos.projects`), de onde o catálogo de
 * produtos (src/content/catalogo.ts) tira por referência o nome, a fase, o
 * vídeo e, no Rota de Vendas, a frase. Vídeos novos são os de lançamento
 * feitos com /brag.
 */
export interface Project {
  slug: string;
  name: string;
  /** Uma frase sobre o aplicativo (no catálogo, a do cartão do Rota de Vendas). */
  summary: string;
  video: {
    src: string;
    poster: string;
    accessibleName: string;
    caption: string;
    description: string;
    /** Duração no nome do "Assistir" (catalogoUi.assistir). */
    durationLabel?: string;
    /**
     * Canto do pôster onde fica o botão "Assistir", longe do texto desenhado
     * no pôster (MASTER §8.8). Sem o campo, embaixo à esquerda.
     */
    playCorner?: "bottom-left" | "bottom-right";
  };
  /** Destaques aprovados (v2.0); os benefícios do Rota de Vendas no catálogo partem deles. */
  highlights?: readonly { lead: string; rest: string }[];
  /** Selo de fase do projeto (rótulo em `landingContent.statusLabels`). */
  status: ProductStatus;
}

const PROJECTS: readonly Project[] = [
  {
    slug: "rota-de-vendas",
    name: "Rota de Vendas",
    summary: "Para o vendedor externo e para a entrega: do pedido feito na loja do cliente até a porta.",
    video: {
      src: "/video/brag.mp4",
      poster: "/video/brag.jpg",
      accessibleName: "Vídeo de demonstração do Rota de Vendas",
      durationLabel: "22 s",
      caption:
        "Vídeo de demonstração, só com música. Os clientes, pedidos e endereços que aparecem são fictícios.",
      description:
        'Uma linha de roteiro sai de João Pessoa/PB e passa por sete cidades: 12 paradas, 7 cidades, 1 roteiro. Aparece o Rota de Vendas, "para vendedores externos, no lugar da planilha", com clientes, pedidos e rotas. No computador, o número de pedido 0500 é digitado como veio do sistema do vendedor; um número repetido é recusado com o aviso "Já existe o pedido nº 0001". No roteiro de entrega, os mesmos números aparecem nas paradas, agrupadas por cidade, e o roteiro sai em Word, PDF e Excel. No fim, três telas de celular mostram o app sem internet, com letra grande e em alto contraste. Todos os dados são fictícios.',
    },
    highlights: [
      {
        lead: "Clientes na mão do vendedor.",
        rest: "Busca por nome, cidade ou CNPJ, com botões para ligar, chamar no WhatsApp e abrir no mapa. O mesmo CNPJ não entra duas vezes.",
      },
      {
        lead: "Pedido com o número do sistema que você já usa.",
        rest: "O vendedor digita o número como veio impresso no outro sistema, e número repetido não passa.",
      },
      {
        lead: "Rota de entrega por cidade.",
        rest: "As paradas saem agrupadas por cidade, com o caminho até a porta, a lista de carga e os brindes de cada parada. O roteiro sai em Word, PDF e Excel, com os mesmos números de pedido.",
      },
      {
        lead: "Funciona sem internet.",
        rest: "Tudo fica guardado no aparelho. Sem sinal, o vendedor continua trabalhando.",
      },
      {
        lead: "Fácil de ler na rua.",
        rest: "Letra até duas vezes maior e modo de alto contraste para usar sob o sol.",
      },
      {
        lead: "No celular e no computador.",
        rest: "O mesmo aplicativo no Android do vendedor e no Windows do escritório.",
      },
    ],
    status: "piloto",
  },
  {
    slug: "fleet-analytics-bi",
    name: "Fleet Analytics BI",
    summary:
      "Para quem cuida de uma frota: do rastreador de cada veículo aos chamados de reboque, com custos, abastecimentos e viagens no mesmo lugar.",
    video: {
      src: "/video/fleet-analytics-bi.mp4",
      poster: "/video/fleet-analytics-bi.jpg",
      accessibleName: "Vídeo de demonstração do Fleet Analytics BI",
      durationLabel: "53 s",
      // Embaixo à esquerda, o pôster tem o "167 veículos" desenhado.
      playCorner: "bottom-right",
      caption: "Vídeo de demonstração, só com música.",
      description:
        'Um contador sobe até 1.504 pontos de telemetria: 1 veículo, 1 dia. Aparece o Fleet Analytics BI, com o endereço ifanalitico.com.br e a frase "Transforme dados brutos do rastreador em inteligência operacional". Os menus se abrem: 38 telas em 7 módulos, "do rastreador ao reboque". Depois, cada tela vem com um número em destaque: 167 veículos acompanhados em tempo real; 450 km rodados, separados em autorizado, tolerância e proibido; 20,9% de eficiência por veículo, comparando o tempo ligado com o produtivo; um relatório por veículo com 9 análises; nota de risco 34 de 100; 37 trajetos em um dia, com 264,4 km e R$ 132,21 de custo; 71 alertas de abastecimento com consumo fora do padrão; e o replay de uma viagem de 231 km no mapa, com 10 paradas e máxima de 101 km/h. No módulo de reboque, com 696 chamados, aparecem o despacho, com o mapa dos guinchos; os chamados, com seguradora, origem e destino; a vistoria digital, com avarias, checklist, fotos e assinaturas; o lucro por atendimento; e o faturamento. No fim: "Da telemetria ao reboque. Uma plataforma." Placas, nomes e endereços aparecem borrados.',
    },
    status: "emUso",
  },
];

/** PRÉVIA v2.2: as 3 opções do hero de marca (landing-copy-v2.2 §2). */
const HERO_OPCOES = {
  a: {
    eyebrow: "Strukti Soluções, de João Pessoa",
    headline: "A mesma equipe monta, programa e dá suporte.",
    body: "Fazemos o replay para quadras de aluguel e aplicativos sob medida para empresas, e cuidamos da instalação.",
  },
  b: {
    eyebrow: "Strukti Soluções, de João Pessoa",
    headline: "Replay para quadras e aplicativos sob medida.",
    body: "Montamos o equipamento, escrevemos o software e cuidamos da instalação e do suporte, sempre com a mesma equipe.",
  },
  c: {
    eyebrow: "Replay para quadras e aplicativos sob medida",
    headline: "Você fala direto com quem monta e programa.",
    body: "A Strukti Soluções, de João Pessoa, faz o equipamento e o software e cuida da instalação e do suporte.",
  },
} as const;

/** Hero de marca da v2.2 (a opção B, a padrão); o hero "expansao" reaproveita. */
const HERO_ESTUDIO = {
  ...HERO_OPCOES.b,
  primaryCta: "Ver os produtos",
  whatsappCta: "Falar no WhatsApp",
  illustrationBadge: "Ilustração do conceito",
} as const;

const HERO_EXPANSAO_TITLE_LINES = ["Tecnologia que trabalha", "em silêncio"] as const;

export const landingContent = {
  whatsappMessages: {
    general: WHATSAPP_GENERAL_MESSAGE,
  },

  statusLabels: {
    piloto: "Piloto gratuito",
    desenvolvimento: "Em desenvolvimento",
    emUso: "Em uso",
    emBreve: "Em breve",
  } satisfies Record<ProductStatus, string>,

  /** PRÉVIA v2.2: as 3 opções do hero de marca (landing-copy-v2.2 §2). */
  heroOpcoes: HERO_OPCOES,

  heroEstudio: HERO_ESTUDIO,

  /**
   * Hero "expansao" (MASTER §9.8). PROPOSTA — aguardando aprovação do Thiago
   * (docs/landing-copy.md, "Hero expansao"): o título em duas linhas, a dica
   * de rolagem, a descrição da mídia e os nomes do controle do vídeo. O resto
   * é o texto aprovado do hero de marca da v2.2 (opção B), por referência ao
   * `heroEstudio`; como lá, ?hero=a ou ?hero=c troca a linha de apoio, a
   * chamada e a frase depois de montar (src/components/spike/HeroOpcao.tsx).
   */
  heroExpansao: {
    /** O H1, numa leitura só (o nome acessível). */
    title: HERO_EXPANSAO_TITLE_LINES.join(" "),
    /** As duas partes do H1 que se abrem para os lados com a expansão. */
    titleLines: HERO_EXPANSAO_TITLE_LINES,
    /** Linha de apoio abaixo do quadro (desliza para a esquerda): o sobretítulo aprovado. */
    date: HERO_ESTUDIO.eyebrow,
    /** Dica abaixo do quadro (desliza para a direita); só aparece quando a expansão anda. */
    hint: "Role para expandir",
    /** Nome acessível do quadro com o vídeo (o fundo é decorativo, sem texto). */
    mediaAlt:
      "Fim de expediente: uma mesa junto a uma janela alta na hora azul, com a cidade desfocada lá fora, a luz do abajur, um caderno fechado, uma caneca, um celular mostrando uma rota do Rota de Vendas e a caixa do botão do replay com o LED ciano aceso.",
    /** Nome acessível do controle do vídeo (WCAG 2.2.2), conforme o estado. */
    videoPause: "Pausar o vídeo",
    videoPlay: "Tocar o vídeo",
    /** O conteúdo que aparece com a expansão completa (texto aprovado). */
    headline: HERO_ESTUDIO.headline,
    body: HERO_ESTUDIO.body,
    primaryCta: HERO_ESTUDIO.primaryCta,
    whatsappCta: HERO_ESTUDIO.whatsappCta,
  },

  produtos: {
    title: "Produtos",
    intro:
      "O selo de cada produto diz em que fase ele está. Os aplicativos são feitos sob medida, e o primeiro passo é um diagnóstico gratuito, sem compromisso.",
    replay: {
      name: "Replay para quadras",
      illustrationBadge: "Ilustração do conceito",
      // Animação feita em código (projeto strukti-video), no lugar do pôster 3D.
      video: {
        src: "/video/replay.mp4",
        poster: "/video/replay.jpg",
        accessibleName: "Vídeo de demonstração do replay para quadras",
        durationLabel: "52 s",
        caption:
          "Animação que ilustra o conceito, só com música. A arena, os jogadores e as telas do celular são fictícios.",
        description:
          'Numa arena à noite, o Lucas faz um gol no society e aperta o botão no alambrado: o anel de luz pisca duas vezes. O mesmo gol aparece de novo, visto pela câmera fixa atrás do gol, com a marca "Arena Pôr do Sol 20:37" e o texto "O sistema salva os últimos 30 segundos". Na areia, a Bia aperta o botão depois de um ponto, e o lance volta pela câmera atrás da linha de fundo, às 20:52: "Funciona em qualquer quadra: society, areia, futsal". No bar, o celular mostra a busca do lance, a lista de lances de hoje e o lance das 20:37, com os botões Baixar e Compartilhar e o aviso "Disponível por 7 dias". A TV do bar passa o replay. No fim, o logo da Strukti, a frase "O jogador aperta o botão e o lance chega no celular." e o WhatsApp (83) 99968-3670.',
      },
      // Endereço do site próprio do replay: null até existir (o link some).
      siteUrl: null as string | null,
    },
  },

  aplicativos: {
    title: "Aplicativos sob medida",
    intro:
      "Para a empresa que ainda controla pedidos, rotas ou relatórios na planilha, no papel e no WhatsApp: construímos o aplicativo do jeito que ela já trabalha, ligado ao que ela já usa. O primeiro passo é o diagnóstico gratuito: uma conversa sobre a rotina da empresa, com um resumo por escrito do que vale a pena fazer. Sem compromisso de contratar.",
    projects: PROJECTS,
    videoDescriptionLinkLabel: "Ler a descrição do vídeo",
  },

  chamadaHardware: {
    title: "Tem um problema que pede hardware?",
    body: "Nem todo problema cabe no nosso catálogo. Se o seu precisa de câmera, sensor, botão ou outro equipamento ligado a um software, conte para a gente. Juntamos eletrônica e programação, e dizemos com franqueza se dá para resolver.",
    cta: "Contar o meu problema",
  },

  comoTrabalhamos: {
    title: "Como trabalhamos",
    intro: "Do primeiro contato ao suporte, você fala com a mesma equipe, sem intermediário.",
    items: [
      {
        title: "Diagnóstico",
        description:
          "Antes de falar de equipamento ou de aplicativo, entendemos a rotina e onde o problema aparece. Se a solução não compensar, dizemos isso. Nos aplicativos, o diagnóstico é gratuito e termina com um resumo por escrito do que vale a pena fazer.",
      },
      {
        title: "Protótipo",
        description:
          "Montamos uma primeira versão e testamos com você, em pequena escala, antes da instalação completa.",
      },
      {
        title: "Instalação",
        description:
          "Instalamos o equipamento ou colocamos o aplicativo para funcionar, e acompanhamos a sua equipe até tudo rodar no dia a dia.",
      },
      {
        title: "Suporte direto",
        description:
          "Quem instala é quem cuida depois. Você fala com a equipe pelo WhatsApp, sem central de atendimento, e a manutenção não depende de técnico de fora.",
      },
    ],
  },

  contato: {
    title: "Fale com a gente",
    intro:
      "Quer o piloto do replay na sua quadra, o diagnóstico de um aplicativo ou contar outro problema? Escolha o assunto e escreva em poucas palavras.",
    form: {
      title: "Conte o que você precisa",
      intro: "São cinco campos. Respondemos pelo WhatsApp.",
      requiredNotice: "Todos os campos são obrigatórios.",
      fields: {
        name: {
          label: "Seu nome",
          errorEmpty: "Escreva o seu nome.",
        },
        company: {
          label: "Nome da empresa ou da arena",
          errorEmpty: "Escreva o nome da empresa ou da arena.",
        },
        whatsapp: {
          label: "WhatsApp com DDD",
          help: "É por esse número que vamos responder.",
          errorEmpty: "Informe o seu WhatsApp.",
          errorInvalid: "Confira o número: ele precisa ter o DDD e o telefone completo.",
        },
        interest: {
          label: "Sobre o que você quer falar?",
          placeholder: "Escolha um assunto",
          errorEmpty: "Escolha um assunto.",
          options: {
            replay: "Replay para quadras",
            aplicativo: "Aplicativo sob medida",
            outro: "Outro assunto",
          },
        },
        // A chave continua `problem`; o texto passa a falar de "mensagem".
        problem: {
          label: "Sua mensagem",
          help: "Conte com as suas palavras. Se for o replay, ajuda saber a cidade e quantas quadras você tem. Não precisa colocar dados dos seus clientes.",
          errorEmpty: "Conte em poucas palavras o que você precisa.",
          errorTooLong: "Use no máximo {max} caracteres.",
        },
      },
      consentLabelPrefix: "Li o ",
      consentLinkLabel: "aviso de privacidade",
      consentLabelSuffix:
        " e concordo que a Strukti Soluções use estes dados para responder à minha mensagem.",
      consentError: "Para enviar, marque que você concorda com o uso dos dados.",
      consentHelperLine: "Usamos seus dados só para responder a esta mensagem.",
      submitLabel: "Enviar mensagem",
      submittingLabel: "Enviando…",
      whatsappAlternativePrefix: "Prefere falar agora? ",
      whatsappAlternativeLinkLabel: "Chame no WhatsApp: +55 83 99968-3670",
      errorSummarySingle: "Confira 1 campo antes de enviar.",
      errorSummaryMultiple: "Confira {n} campos antes de enviar.",
      success: {
        title: "Mensagem recebida!",
        text: "Obrigado, {nome}. Respondemos no mesmo dia pelo WhatsApp informado. Se a mensagem chegou fora do horário comercial, respondemos no próximo dia útil.",
        text2: "Se quiser adiantar a conversa, chame a gente agora.",
        button: "Chamar no WhatsApp",
      },
      submitError:
        "Não foi possível enviar agora. Tente de novo em alguns minutos ou fale com a gente pelo WhatsApp.",
      rateLimitError:
        "Foram muitas tentativas seguidas. Espere alguns minutos e tente de novo, ou fale com a gente pelo WhatsApp.",
      honeypotLabel: "Não preencha este campo",
    },
  },

  header: {
    skipLink: "Pular para o conteúdo",
    /**
     * Itens da barra. Na barra do topo (TopBar), "#produtos" vira o botão do
     * menu "Produtos ▾", com os produtos do catálogo agrupados por tipo (spec
     * 2026-10-16, §3.5); o Header clássico lê a lista como links.
     */
    nav: [
      { label: "Produtos", href: "#produtos" },
      { label: "Equipe", href: "#equipe" },
      { label: "Contato", href: "#contato" },
    ],
    whatsappButton: "Falar no WhatsApp",
    /** Botão que abre o menu abaixo de 75em, 1200 px (barra do hero "video"). */
    menuButton: "Menu",
  },

  hero: {
    eyebrow: "Aplicativos sob medida para distribuidoras e indústrias pequenas",
    headline: "Um aplicativo feito do jeito que a sua empresa já trabalha.",
    body: "Pedido que chega em papel, no WhatsApp e na planilha. Rota de entrega montada na mão. Relatório que alguém monta no Excel todo fim de mês. A Strukti Soluções constrói o aplicativo que resolve isso na sua empresa, ligado ao que você já usa e com gente por perto para cuidar dele depois.",
    primaryCta: "Chamar no WhatsApp",
    secondaryCta: "Pedir diagnóstico gratuito",
    supportLine: "Primeiro entendemos o problema. Depois falamos de aplicativo.",
    /** Nome acessível do controle do vídeo de fundo (WCAG 2.2.2), conforme o estado. */
    videoPause: "Pausar o vídeo de fundo",
    videoPlay: "Tocar o vídeo de fundo",
  },

  equipe: {
    title: "Quem faz",
    intro:
      "Somos quatro estudantes de engenharia da computação, em João Pessoa. No WhatsApp e na instalação, você fala direto com quem monta o equipamento e escreve o código.",
    introComHeroC: "Somos quatro estudantes de engenharia da computação.",
  },

  faq: {
    title: "Dúvidas frequentes",
    items: [
      {
        question: "Quanto custa?",
        answer:
          "Depende do produto. O preço do replay ainda está sendo definido, e nesta fase oferecemos um piloto gratuito. Nos aplicativos, depois do diagnóstico gratuito você recebe uma proposta com o que será feito, o prazo e o preço, antes de qualquer compromisso.",
      },
      {
        question: "Vocês atendem a minha cidade?",
        answer:
          "Nos aplicativos, sim: em João Pessoa e região, atendemos presencialmente; no resto do Brasil, por videochamada e pelo WhatsApp. O replay precisa de instalação na quadra, e a região onde vamos começar ainda está sendo definida. Conte a sua cidade na conversa.",
      },
      {
        question: "E quando vocês se formarem, quem mantém tudo funcionando?",
        answer:
          "Quem mantém é a Strukti: uma equipe, e não uma pessoa só. Quem instala o equipamento ou entrega o aplicativo é quem cuida dele depois, hoje e depois da formatura. E cada projeto tem documentação, para não depender da memória de ninguém.",
      },
      {
        question: "O aplicativo se liga ao sistema que eu já uso?",
        answer:
          "Sim, quando o sistema permite. Quando não permite, o aplicativo gera os arquivos no formato da empresa, como Excel, PDF ou Word. Nos dois casos, ele segue o jeito que a sua empresa já trabalha, e tudo começa com o diagnóstico gratuito.",
      },
      {
        question: "O replay precisa de internet?",
        answer:
          "Precisa. O equipamento da quadra usa o Wi-Fi da própria arena para enviar os clipes. Os jogadores veem os lances no celular, com a internet deles. Se a internet da sua arena for uma dúvida, falamos disso na conversa.",
      },
      {
        question: "O replay já usa inteligência artificial?",
        answer:
          "Ainda não. Hoje o clipe é cortado quando o jogador aperta o botão. Cortes automáticos e destaque por jogador, com inteligência artificial, vêm em breve.",
      },
      {
        question: "E a privacidade de quem aparece no vídeo?",
        answer:
          "O replay está sendo construído assim: os clipes vão ficar disponíveis para os jogadores por 7 dias e depois serão apagados, e a quadra vai exibir um aviso de que há gravação.",
      },
      {
        question: "O que acontece com os dados que eu mando pelo formulário?",
        answer: "Usamos só para responder à sua mensagem. Os detalhes estão no aviso de privacidade.",
        answerLinkLabel: "aviso de privacidade",
      },
    ],
    closing: "Ficou alguma dúvida? Pergunte direto para a gente.",
    button: "Chamar no WhatsApp",
  },

  rodape: {
    tagline: "Produtos de hardware e aplicativos sob medida.",
    whatsappLabel: "WhatsApp:",
    emailLabel: "E-mail:",
    location: "João Pessoa/PB",
    privacyLinkLabel: "Aviso de privacidade",
  },

  floatingWhatsapp: {
    desktopLabel: "WhatsApp",
    accessibleName: "Falar com a Strukti Soluções no WhatsApp",
  },

  seo: {
    title: "Replay para quadras e apps sob medida | Strukti Soluções",
    description:
      "Replay para quadras de aluguel, em piloto gratuito: o jogador aperta um botão e recebe o lance no celular. Também fazemos aplicativos sob medida.",
    ogSiteName: "Strukti Soluções",
    ogTitle: "Strukti Soluções: replay para quadras e aplicativos sob medida",
    ogDescription:
      "O jogador aperta o botão e o lance chega no celular. Replay para quadras de aluguel, em piloto gratuito, e aplicativos sob medida para empresas.",
    ogImageAlt: "Strukti Soluções: replay para quadras e aplicativos sob medida",
    // Não alimenta nenhuma tag OG (isso já funciona sozinho via SITE_URL,
    // ver src/lib/siteUrl.ts e layout.tsx): é só o lembrete do
    // check:placeholders de que falta definir o SITE_URL antes de publicar
    // (README, "Pendências que bloqueiam a publicação").
    ogUrl: "[A PREENCHER: endereço do site]",
  },

  // Microcopy de interface (não é claim de marketing nem dado do negócio),
  // aprovada pelo Claudinho em 03/10/2026 e registrada em
  // docs/landing-copy.md v1.8 ("Página não encontrada (404)").
  notFound: {
    title: "Página não encontrada",
    homeLink: "Voltar para o início",
  },

  // Lista de docs/landing-copy.md v2.0, seção "Pendências" (sem a marcação
  // de código do Markdown). Não vai para o site; o README repete as que
  // bloqueiam a publicação.
  pendencias: {
    bloqueiam: [
      "Aviso de privacidade: provedores de hospedagem e de banco de dados, e se guardam dados fora do Brasil.",
      "Endereço do site (seo.ogUrl e mensagem da equipe).",
      "Curso de cada pessoa da equipe (siteConfig.team[].course, ainda pendente nas 4 pessoas).",
    ],
    grupoDecide: ["Fotos da equipe. A página funciona com as iniciais; o grupo decide se publica sem fotos."],
    naoBloqueiam: [
      'Endereço do site próprio do replay (produtos.replay.siteUrl). Enquanto não existir, o link "Ver o site" do painel do replay no catálogo fica escondido.',
    ],
  },

  privacidade: {
    title: "Aviso de privacidade",
    lastUpdatedLabel: "Última atualização:",
    // A data exibida vem de siteConfig.privacyPolicyVersion (fonte única),
    // formatada em src/app/privacidade/page.tsx — nunca duplicar o valor
    // aqui, para não divergir da versão gravada no consentimento.
    intro:
      "Este aviso explica, em linguagem simples, o que a Strukti Soluções faz com os dados que você envia pelo formulário do site.",
    sections: [
      {
        heading: "Quem cuida dos seus dados",
        paragraphs: [
          "O responsável pelos dados enviados pelo formulário é Thiago Guedes, da Strukti Soluções. Contato para assuntos de privacidade: struktisolutions@gmail.com.",
        ],
        // Nota (não vai para o site): quando a Strukti tiver CNPJ, trocar
        // este parágrafo pela razão social e pelo CNPJ.
      },
      {
        heading: "Quais dados coletamos",
        paragraphs: [
          "Pelo formulário: seu nome, o nome da empresa ou da arena, o número de WhatsApp, o assunto que você escolher e a mensagem que você escrever. Só isso. Pedimos que você não coloque na mensagem dados dos seus clientes nem documentos pessoais.",
          "Para bloquear envios automáticos, o site registra por pouco tempo o endereço de internet (IP) de quem envia o formulário.",
        ],
      },
      {
        heading: "Para que usamos",
        paragraphs: [
          "Para responder à sua mensagem e conversar sobre o assunto que você escolheu. Não vendemos, não alugamos e não usamos esses dados para outra finalidade.",
        ],
      },
      {
        heading: "Base legal",
        paragraphs: [
          "O seu consentimento, dado ao marcar a caixa do formulário (Lei Geral de Proteção de Dados, art. 7º, inciso I).",
        ],
      },
      {
        heading: "Com quem compartilhamos",
        paragraphs: [
          "Com ninguém, a não ser os serviços que usamos para manter o site no ar e guardar os dados: [A PREENCHER: nomes dos provedores de hospedagem e de banco de dados, e se guardam os dados fora do Brasil]. Eles só guardam os dados para nós.",
        ],
      },
      {
        heading: "Por quanto tempo guardamos",
        paragraphs: [
          "Por até 12 meses depois do nosso último contato com você. Depois disso, apagamos os dados. Se você pedir, apagamos antes.",
        ],
      },
      {
        heading: "Seus direitos",
        paragraphs: ["Você pode, a qualquer momento:"],
        list: [
          "saber quais dados temos sobre você;",
          "corrigir dados errados;",
          "pedir que apaguemos os seus dados;",
          "retirar o seu consentimento.",
        ],
        paragraphsAfterList: [
          "Basta mandar um e-mail para struktisolutions@gmail.com. Se o seu pedido não for atendido, você também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).",
        ],
      },
      {
        heading: "Cookies e WhatsApp",
        paragraphs: [
          "Este site não usa cookies de rastreamento nem ferramentas de análise de visitas. Se você falar com a gente pelo WhatsApp, a conversa também segue as regras de privacidade do próprio WhatsApp.",
        ],
      },
      {
        heading: "Mudanças neste aviso",
        paragraphs: ["Se este aviso mudar, a data no topo muda junto."],
      },
    ],
    contactEmailLabel: "struktisolutions@gmail.com",
  },
} as const;
