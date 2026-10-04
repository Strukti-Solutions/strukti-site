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
 * é `heroEstudio`.
 */

const WHATSAPP_GENERAL_MESSAGE =
  "Olá! Vim pelo site da Strukti Soluções e quero conversar com vocês.";
const WHATSAPP_REPLAY_MESSAGE =
  "Olá! Vim pelo site da Strukti Soluções e quero agendar uma demonstração do replay para a minha quadra.";
const WHATSAPP_ESTACIONAMENTO_MESSAGE =
  "Olá! Vim pelo site da Strukti Soluções e quero conversar sobre o estacionamento inteligente.";

/**
 * Fase de um produto, mostrada no selo (spec §3.4). O texto de cada selo
 * fica em `landingContent.statusLabels`.
 */
export type ProductStatus = "piloto" | "desenvolvimento" | "emUso" | "emBreve";

/**
 * Um aplicativo da grade de vídeos (`aplicativos.projects`, MASTER §8.8).
 * Vídeos novos são os de lançamento feitos com /brag. `videoTitle` e
 * `highlights` não aparecem na grade; ficam nos dados, como manda a v2.0.
 */
export interface Project {
  slug: string;
  name: string;
  /** Uma frase, para o cartão da grade. */
  summary: string;
  /** Título do vídeo (fora da grade). */
  videoTitle: string;
  video: {
    src: string;
    poster: string;
    accessibleName: string;
    caption: string;
    description: string;
  };
  /** Lista de destaques (fora da grade). */
  highlights?: readonly { lead: string; rest: string }[];
  platforms: readonly string[];
  /** Selo de fase do projeto (rótulo em `landingContent.statusLabels`). */
  status?: ProductStatus;
}

const PROJECTS: readonly Project[] = [
  {
    slug: "rota-de-vendas",
    name: "Rota de Vendas",
    summary:
      "O Rota de Vendas é um aplicativo que construímos para o vendedor externo e para a entrega: do pedido feito na loja do cliente até a porta.",
    videoTitle: "Veja o Rota de Vendas",
    video: {
      src: "/video/brag.mp4",
      poster: "/video/brag.jpg",
      accessibleName: "Vídeo de demonstração do Rota de Vendas",
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
    platforms: ["Android", "Windows"],
    status: "piloto",
  },
  {
    slug: "fleet-analytics-bi",
    name: "Fleet Analytics BI",
    summary:
      "O Fleet Analytics BI é uma plataforma que construímos para quem cuida de uma frota: do rastreador de cada veículo aos chamados de reboque, com custos, abastecimentos e viagens no mesmo lugar.",
    videoTitle: "Veja o Fleet Analytics BI",
    video: {
      src: "/video/fleet-analytics-bi.mp4",
      poster: "/video/fleet-analytics-bi.jpg",
      accessibleName: "Vídeo de demonstração do Fleet Analytics BI",
      caption: "Vídeo de demonstração, só com música.",
      description:
        'Um contador sobe até 1.504 pontos de telemetria: 1 veículo, 1 dia. Aparece o Fleet Analytics BI, com o endereço ifanalitico.com.br e a frase "Transforme dados brutos do rastreador em inteligência operacional". Os menus se abrem: 38 telas em 7 módulos, "do rastreador ao reboque". Depois, cada tela vem com um número em destaque: 167 veículos acompanhados em tempo real; 450 km rodados, separados em autorizado, tolerância e proibido; 20,9% de eficiência por veículo, comparando o tempo ligado com o produtivo; um relatório por veículo com 9 análises; nota de risco 34 de 100; 37 trajetos em um dia, com 264,4 km e R$ 132,21 de custo; 71 alertas de abastecimento com consumo fora do padrão; e o replay de uma viagem de 231 km no mapa, com 10 paradas e máxima de 101 km/h. No módulo de reboque, com 696 chamados, aparecem o despacho, com o mapa dos guinchos; os chamados, com seguradora, origem e destino; a vistoria digital, com avarias, checklist, fotos e assinaturas; o lucro por atendimento; e o faturamento. No fim: "Da telemetria ao reboque. Uma plataforma." Placas, nomes e endereços aparecem borrados.',
    },
    platforms: ["Web", "Celular"],
    status: "emUso",
  },
];

export const landingContent = {
  whatsappMessages: {
    general: WHATSAPP_GENERAL_MESSAGE,
    replay: WHATSAPP_REPLAY_MESSAGE,
    estacionamento: WHATSAPP_ESTACIONAMENTO_MESSAGE,
  },

  statusLabels: {
    piloto: "Piloto gratuito",
    desenvolvimento: "Em desenvolvimento",
    emUso: "Em uso",
    emBreve: "Em breve",
  } satisfies Record<ProductStatus, string>,

  heroEstudio: {
    eyebrow: "Replay para quadras · Aplicativos sob medida",
    headline: "Equipamento e software para problemas que um aplicativo sozinho não resolve.",
    body: "A Strukti Soluções monta o equipamento, escreve o software e cuida da instalação e do suporte. O primeiro produto é o replay para quadras de aluguel: o jogador aperta um botão na beira da quadra e recebe o lance no celular. Estamos procurando as primeiras quadras para um piloto gratuito. Recursos de inteligência artificial, como o destaque por jogador, vêm em breve.",
    primaryCta: "Conhecer o replay",
    whatsappCta: "Falar no WhatsApp",
    illustrationBadge: "Ilustração do conceito",
  },

  produtos: {
    title: "Produtos de hardware",
    intro:
      "Equipamento que fica no seu espaço, com software e suporte da própria Strukti. O selo de cada produto diz em que fase ele está.",
    replay: {
      name: "Replay para quadras",
      oneLiner:
        "Para quadras de aluguel de society, futsal, vôlei e beach tennis: o jogador sai do jogo com o lance no celular, e o time ganha um motivo a mais para voltar à sua quadra.",
      stepsTitle: "Como funciona",
      steps: [
        {
          lead: "Aperta o botão.",
          rest: "Saiu um lance bonito? O jogador aperta o botão na beira da quadra.",
        },
        {
          lead: "O clipe é cortado.",
          rest: "O equipamento da quadra separa os 30 segundos antes do aperto e mais alguns depois.",
        },
        {
          lead: "Chega no celular.",
          rest: "O clipe sobe pelo Wi-Fi da arena, e o jogador vê e compartilha pelo celular. Esta etapa ainda está em construção, e é ela que o piloto vai testar.",
        },
      ],
      specs: [
        { value: "30 s", label: "Antes do aperto" },
        { value: "Wi-Fi", label: "Da própria arena" },
        { value: "PoE", label: "Energia e imagem num cabo só" },
      ],
      cta: "Agendar demonstração",
      // Endereço do site próprio do replay: null até existir (o link some).
      siteUrl: null as string | null,
      siteLinkLabel: "Ver o site do replay",
    },
    estacionamento: {
      name: "Estacionamento inteligente",
      oneLiner:
        "A ideia: sensores ou câmeras que indicam as vagas livres no estacionamento do supermercado. Antes de construir, queremos ouvir gerentes de supermercado.",
      cta: "Quero conversar sobre isso",
    },
  },

  aplicativos: {
    title: "Aplicativos sob medida",
    intro:
      "Também construímos aplicativos para empresas, do jeito que cada uma já trabalha e ligados ao que ela já usa. O primeiro passo é o diagnóstico gratuito: uma conversa sobre a rotina da empresa, com um resumo por escrito do que vale a pena fazer. Sem compromisso de contratar.",
    cta: "Diagnóstico gratuito",
    projects: PROJECTS,
    grid: {
      showMore: "Mostrar mais projetos",
      playLabel: "Assistir ao vídeo: {nome}",
    },
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
          "Antes de falar de equipamento ou de aplicativo, entendemos a rotina e onde o problema aparece. Se a solução não compensar, dizemos isso.",
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
          "Quem instala é quem cuida depois. Você fala com a equipe pelo WhatsApp, sem central de atendimento, e a manutenção não depende de técnico de fora. Os aplicativos seguem com plano mensal de manutenção, suporte e hospedagem.",
      },
    ],
  },

  contato: {
    title: "Fale com a gente",
    intro:
      "Quer agendar uma demonstração do replay, pedir o diagnóstico de um aplicativo ou contar outro problema? Escolha o assunto e escreva em poucas palavras.",
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
            estacionamento: "Estacionamento inteligente",
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
    nav: [
      { label: "Produtos", href: "#produtos" },
      { label: "Apps", href: "#aplicativos" },
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
      "Somos quatro estudantes de engenharia da computação. Você fala direto com quem monta o equipamento e escreve o código.",
  },

  faq: {
    title: "Dúvidas frequentes",
    items: [
      {
        question: "O replay precisa de internet?",
        answer:
          "Precisa. O equipamento da quadra usa o Wi-Fi da própria arena para enviar os clipes. Os jogadores veem os lances no celular, com a internet deles. Se a internet da sua arena for uma dúvida, falamos disso na demonstração.",
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
          "Quem mantém é a Strukti: uma equipe, e não uma pessoa só. No replay, quem instala, dá suporte e faz a manutenção somos nós. Os aplicativos têm plano mensal de manutenção, suporte e hospedagem, que garante alguém cuidando deles hoje e depois da formatura. E cada projeto tem documentação, para não depender da memória de ninguém.",
      },
      {
        question: "Vocês também fazem aplicativos?",
        answer:
          "Fazemos. O aplicativo segue o jeito que a sua empresa já trabalha e se liga ao sistema que você já usa. Quando o sistema não permite, o aplicativo gera os arquivos no formato da empresa, como Excel, PDF ou Word. Tudo começa com o diagnóstico gratuito.",
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
      'Endereço do site próprio do replay (produtos.replay.siteUrl). Enquanto não existir, o link "Ver o site do replay" fica escondido.',
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
