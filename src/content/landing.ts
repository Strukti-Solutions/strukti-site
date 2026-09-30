/**
 * Todo o texto do site vive aqui (exceto o aviso de privacidade completo,
 * que tem seu próprio módulo em src/content/privacy.ts por ser texto
 * jurídico com aprovação separada).
 *
 * Texto aprovado pelo cliente em docs/landing-copy.md (v1.1, 30/09/2026),
 * copiado com a mesma pontuação e acentuação. Onde o documento ainda tem
 * `[A PREENCHER: ...]`, o valor abaixo usa a mesma marcação — não
 * inventar o dado.
 */

const WHATSAPP_GENERAL_MESSAGE =
  "Olá! Vim pelo site da Strukti Soluções e quero conversar sobre um aplicativo para a minha empresa.";
const WHATSAPP_DIAGNOSTICO_MESSAGE =
  "Olá! Vim pelo site da Strukti Soluções e quero pedir o diagnóstico gratuito.";

export const landingContent = {
  whatsappMessages: {
    general: WHATSAPP_GENERAL_MESSAGE,
    diagnostico: WHATSAPP_DIAGNOSTICO_MESSAGE,
  },

  header: {
    skipLink: "Pular para o conteúdo",
    nav: [
      { label: "Problemas", href: "#problemas" },
      { label: "Como trabalhamos", href: "#como-trabalhamos" },
      { label: "O que já construímos", href: "#o-que-construimos" },
      { label: "Diagnóstico", href: "#diagnostico" },
      { label: "Dúvidas", href: "#duvidas" },
    ],
    whatsappButton: "Falar no WhatsApp",
  },

  hero: {
    eyebrow: "Aplicativos sob medida para distribuidoras e indústrias pequenas",
    headline: "Um aplicativo feito do jeito que a sua empresa já trabalha.",
    body: "Pedido que chega em papel, no WhatsApp e na planilha. Rota de entrega montada na mão. Relatório que alguém monta no Excel todo fim de mês. A Strukti Soluções constrói o aplicativo que resolve isso na sua empresa, ligado ao que você já usa e com gente por perto para cuidar dele depois.",
    primaryCta: "Chamar no WhatsApp",
    secondaryCta: "Pedir diagnóstico gratuito",
    supportLine: "Primeiro entendemos o problema. Depois falamos de aplicativo.",
  },

  problemas: {
    title: "Isso acontece na sua empresa?",
    items: [
      {
        title: "Pedido espalhado em papel, WhatsApp e planilha",
        description:
          "O vendedor anota no talão, manda foto no WhatsApp, e alguém no escritório digita tudo de novo. Quando some um pedido, ninguém sabe onde ele ficou.",
      },
      {
        title: "Erro de digitação que só aparece na entrega",
        description:
          "Um número trocado, um item a mais, um preço errado. Quem descobre é o cliente, na hora de receber.",
      },
      {
        title: "Rota de entrega montada na mão",
        description:
          "Todo dia alguém separa os pedidos por cidade e escreve o roteiro do entregador. Entrou pedido novo, refaz a lista.",
      },
      {
        title: "Vendedor sem internet na rua",
        description:
          "Na estrada e no interior o sinal cai. O vendedor fica sem o cadastro do cliente e deixa o pedido para passar depois.",
      },
      {
        title: "Relatório feito à mão no Excel",
        description:
          "Para saber quanto vendeu no mês, por vendedor ou por cidade, alguém junta planilha por planilha. Quando termina, o número já mudou.",
      },
      {
        title: "Sistema pronto que não se adapta",
        description:
          "Você testou um sistema pronto, mas ele exige outro jeito de trabalhar. Sobram funções que ninguém usa e falta justo o que a sua equipe precisa.",
      },
    ],
    closing: "Se alguma dessas é a rotina da sua empresa, vale uma conversa.",
    button: "Chamar no WhatsApp",
  },

  comoResolvemos: {
    title: "Como a Strukti resolve",
    intro:
      "Não vendemos sistema pronto. Construímos o aplicativo que a sua empresa precisa, e só o que ela precisa.",
    items: [
      {
        title: "Feito do jeito da sua empresa",
        description:
          "Começamos pela rotina: como o pedido nasce, quem digita, como a entrega sai. O aplicativo segue esse caminho, com os nomes, os campos e os documentos que a sua equipe já conhece.",
      },
      {
        title: "Ligado ao que você já usa",
        description:
          "Não precisa jogar fora o sistema, a planilha ou o modelo de documento que já funciona. Quando o seu sistema permite, ligamos um ao outro. Quando não permite, o aplicativo gera os arquivos no formato que a empresa já usa: Excel, PDF ou Word.",
      },
      {
        title: "Perto de você",
        description:
          "Você fala direto com quem constrói, pelo WhatsApp, sem central de atendimento. Em João Pessoa e região, vamos até a sua empresa. No resto do Brasil, atendemos por videochamada.",
      },
      {
        title: "Preço pensado para empresa pequena",
        description:
          "Você paga pelo que a sua empresa vai usar, não por um pacote cheio de funções. O preço vem na proposta, junto com o que será feito e o prazo, antes de qualquer compromisso.",
      },
      {
        title: "Manutenção todo mês",
        description:
          "Aplicativo pronto não fica largado. Com o plano mensal de manutenção, suporte e hospedagem, fazemos os ajustes, resolvemos os problemas e mantemos tudo funcionando.",
      },
    ],
  },

  oQueJaConstruimos: {
    title: "O que já construímos",
    intro:
      "O Rota de Vendas é um aplicativo que construímos para o vendedor externo e para a entrega: do pedido feito na loja do cliente até a porta. Ele não é um sistema de prateleira; mostra como trabalhamos.",
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
    videoTitle: "Veja o Rota de Vendas",
    videoAccessibleName: "Vídeo de demonstração do Rota de Vendas",
    videoCaption:
      "Vídeo de demonstração, só com música. Os clientes, pedidos e endereços que aparecem são fictícios.",
    videoDescriptionLinkLabel: "Ler a descrição do vídeo",
    videoDescription:
      'Uma linha de roteiro sai de João Pessoa/PB e passa por sete cidades: 12 paradas, 7 cidades, 1 roteiro. Aparece o Rota de Vendas, "para vendedores externos, no lugar da planilha", com clientes, pedidos e rotas. No computador, o número de pedido 0500 é digitado como veio do sistema do vendedor; um número repetido é recusado com o aviso "Já existe o pedido nº 0001". No roteiro de entrega, os mesmos números aparecem nas paradas, agrupadas por cidade, e o roteiro sai em Word, PDF e Excel. No fim, três telas de celular mostram o app sem internet, com letra grande e em alto contraste. Todos os dados são fictícios.',
    videoSrc: "/video/brag.mp4",
    videoPoster: "/video/brag.jpg",
    closing: "O Rota de Vendas é um exemplo. O aplicativo da sua empresa começa pelo problema dela.",
    button: "Pedir diagnóstico gratuito",
    screenshots: [
      {
        src: "/capturas/cliente-detalhe.png",
        alt: "Rota de Vendas no celular: cadastro de um cliente, com botões para ligar, chamar no WhatsApp e abrir no mapa.",
        width: 576,
        height: 1280,
      },
      {
        src: "/capturas/duplicado.png",
        alt: 'Rota de Vendas no computador: ao digitar um número de pedido que já existe, o aplicativo avisa "Já existe o pedido nº 0001" e oferece abrir o pedido.',
        width: 1600,
        height: 900,
      },
      {
        src: "/capturas/roteiro-entrega.png",
        alt: "Primeira página de um roteiro de entrega do Rota de Vendas: resumo com 12 paradas em 7 cidades, lista de carga, brindes a levar e as paradas da primeira cidade, cada uma com os números dos pedidos e o caminho até a porta.",
        width: 1654,
        height: 2339,
      },
      {
        src: "/capturas/funciona-offline.png",
        alt: 'Rota de Vendas sem internet: o cadastro de cliente avisa "Sem internet agora. Preencha o endereço manualmente." e continua funcionando.',
        width: 576,
        height: 1280,
      },
      {
        src: "/capturas/pedido-formulario.png",
        alt: "Rota de Vendas no celular com a letra ampliada: o formulário de novo pedido continua legível, sem texto cortado.",
        width: 576,
        height: 1280,
      },
    ],
    screenshotsDisclaimer: "Todas as capturas usam dados fictícios.",
  },

  diagnostico: {
    title: "Diagnóstico gratuito",
    intro:
      "Uma conversa de cerca de uma hora, por videochamada ou na sua empresa, para entender como os pedidos, as entregas e os relatórios funcionam hoje e onde se perde tempo. No fim, você recebe um resumo por escrito com os problemas que encontramos e o que sugerimos fazer, inclusive o que não vale a pena. Sem compromisso de contratar.",
    highlight: "Estamos começando com poucas empresas, para acompanhar cada projeto de perto.",
    howItWorksTitle: "Como funciona",
    steps: [
      { lead: "Você conta o problema.", rest: "Pelo WhatsApp ou pelo formulário abaixo." },
      {
        lead: "Diagnóstico gratuito.",
        rest: "Conversamos sobre a rotina da empresa e você recebe o resumo por escrito.",
      },
      {
        lead: "Proposta.",
        rest: "Você recebe o que será feito, o prazo e o preço antes de decidir.",
      },
      {
        lead: "Aplicativo funcionando.",
        rest: "Construímos, colocamos para funcionar com a sua equipe e seguimos cuidando dele com o plano mensal.",
      },
    ],
    form: {
      title: "Peça o seu diagnóstico",
      intro: "São quatro campos. Respondemos pelo WhatsApp.",
      requiredNotice: "Todos os campos são obrigatórios.",
      fields: {
        name: {
          label: "Seu nome",
          errorEmpty: "Escreva o seu nome.",
        },
        company: {
          label: "Nome da empresa",
          errorEmpty: "Escreva o nome da empresa.",
        },
        whatsapp: {
          label: "WhatsApp com DDD",
          help: "É por esse número que vamos responder.",
          errorEmpty: "Informe o seu WhatsApp.",
          errorInvalid: "Confira o número: ele precisa ter o DDD e o telefone completo.",
        },
        problem: {
          label: "Qual problema você quer resolver?",
          help: "Conte com as suas palavras. Por exemplo: os pedidos chegam pelo WhatsApp e alguém digita tudo de novo no sistema. Não precisa colocar dados dos seus clientes.",
          errorEmpty: "Conte em poucas palavras qual é o problema.",
          errorTooLong: "Use no máximo {max} caracteres.",
        },
      },
      consentLabelPrefix: "Li o ",
      consentLinkLabel: "aviso de privacidade",
      consentLabelSuffix:
        " e concordo que a Strukti Soluções use estes dados para responder ao meu pedido de diagnóstico.",
      consentError: "Para enviar, marque que você concorda com o uso dos dados.",
      consentHelperLine: "Usamos seus dados só para responder a este pedido.",
      submitLabel: "Pedir diagnóstico gratuito",
      submittingLabel: "Enviando…",
      whatsappAlternativePrefix: "Prefere falar agora? ",
      whatsappAlternativeLinkLabel: "Chame no WhatsApp: +55 83 99968-3670",
      errorSummarySingle: "Confira 1 campo antes de enviar.",
      errorSummaryMultiple: "Confira {n} campos antes de enviar.",
      success: {
        title: "Pedido recebido!",
        text: "Obrigado, {nome}. Respondemos no mesmo dia pelo WhatsApp informado. Se o pedido chegou fora do horário comercial, respondemos no próximo dia útil.",
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

  equipe: {
    title: "Quem faz",
    intro:
      "Somos quatro amigos da faculdade que constroem aplicativos para empresas. Você fala direto com a equipe que constrói, sem intermediário.",
  },

  faq: {
    title: "Dúvidas frequentes",
    items: [
      {
        question: "E quando vocês se formarem, quem mantém o aplicativo?",
        answer:
          "Quem mantém é a Strukti, pelo plano mensal de manutenção, suporte e hospedagem. É esse plano que garante que alguém cuida do aplicativo hoje e depois da formatura. E cada projeto tem documentação, para não depender da memória de uma pessoa só.",
      },
      {
        question: "Quanto custa?",
        answer:
          "Depende do que a sua empresa precisa, por isso não temos tabela. Depois do diagnóstico gratuito, você recebe uma proposta com o que será feito, o prazo e o preço, antes de qualquer compromisso. Com o aplicativo pronto, entra o plano mensal de manutenção, suporte e hospedagem.",
      },
      {
        question: "Por que não usar um sistema pronto?",
        answer:
          "Às vezes o pronto resolve e, se for o seu caso, falamos isso no diagnóstico. O sob medida vale quando a empresa tem um jeito próprio de trabalhar: um número de pedido que vem de outro sistema, um roteiro no formato que o entregador já conhece, um relatório que o sistema pronto não tira. Aí o aplicativo se encaixa na rotina, em vez de mudar a rotina.",
      },
      {
        question: "Preciso trocar o sistema que já uso?",
        answer:
          "Não. O aplicativo trabalha junto com o que você já tem. Quando o seu sistema permite, ligamos um ao outro. Quando não permite, o aplicativo gera os arquivos no formato que a empresa já usa, como Excel, PDF ou Word.",
      },
      {
        question: "Em quanto tempo fica pronto?",
        answer: "Depende do tamanho do problema. O prazo vem escrito na proposta, junto com o preço, antes de você decidir.",
      },
      {
        question: "O aplicativo funciona sem internet?",
        answer:
          "Pode funcionar. O Rota de Vendas, por exemplo, guarda tudo no aparelho e funciona sem sinal. No seu aplicativo, isso é combinado no diagnóstico, conforme a rotina da equipe.",
      },
      {
        question: "Vocês atendem a minha cidade?",
        answer:
          "Em João Pessoa e região, atendemos presencialmente. No resto do Brasil, atendemos por videochamada e pelo WhatsApp.",
      },
      {
        question: "O que acontece com os dados que eu mando pelo formulário?",
        answer: "Usamos só para responder ao seu pedido. Os detalhes estão no aviso de privacidade.",
        answerLinkLabel: "aviso de privacidade",
      },
    ],
    closing: "Ficou alguma dúvida? Pergunte direto para a gente.",
    button: "Chamar no WhatsApp",
  },

  rodape: {
    tagline: "Aplicativos sob medida para distribuidoras e indústrias pequenas.",
    location: "João Pessoa/PB · Atendimento presencial na região e a distância para todo o Brasil",
    privacyLinkLabel: "Aviso de privacidade",
  },

  floatingWhatsapp: {
    desktopLabel: "WhatsApp",
    accessibleName: "Falar com a Strukti Soluções no WhatsApp",
  },

  seo: {
    title: "Aplicativo sob medida para distribuidoras | Strukti Soluções",
    description:
      "Pedido em papel ou planilha? Rota de entrega montada na mão? Aplicativo sob medida para distribuidoras e indústrias pequenas. Diagnóstico gratuito.",
    ogSiteName: "Strukti Soluções",
    ogTitle: "Aplicativos sob medida para distribuidoras e indústrias pequenas",
    ogDescription:
      "Chega de pedido em papel e rota de entrega montada na mão. Fazemos o aplicativo do jeito que a sua empresa trabalha. Peça um diagnóstico gratuito.",
    ogImageAlt: "Strukti Soluções: aplicativos sob medida para distribuidoras e indústrias pequenas",
    // [A PREENCHER: endereço do site] — pendência de publicação, ver README.
    ogUrl: "[A PREENCHER: endereço do site]",
  },

  pendencias: [
    "Aviso de privacidade: provedores de hospedagem e de banco de dados, e se guardam dados fora do Brasil.",
    "Endereço do site (compartilhamento e mensagem da equipe).",
  ],

  privacidade: {
    title: "Aviso de privacidade",
    lastUpdatedLabel: "Última atualização:",
    // A data do próprio aviso, não do build. Ajustar se este texto mudar.
    lastUpdatedDate: "30/09/2026",
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
          "Pelo formulário: seu nome, o nome da empresa, o número de WhatsApp e a descrição do problema que você escrever. Só isso. Pedimos que você não coloque na descrição dados dos seus clientes nem documentos pessoais.",
          "Para bloquear envios automáticos, o site registra por pouco tempo o endereço de internet (IP) de quem envia o formulário.",
        ],
      },
      {
        heading: "Para que usamos",
        paragraphs: [
          "Para responder ao seu pedido e conversar sobre o diagnóstico gratuito. Não vendemos, não alugamos e não usamos esses dados para outra finalidade.",
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
