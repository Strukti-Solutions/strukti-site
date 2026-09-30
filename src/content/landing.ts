/**
 * TEXTO PROVISÓRIO.
 * Este conteúdo é um rascunho de trabalho, ainda não aprovado pelo cliente.
 * Quando o texto de docs/landing-copy.md for aprovado, substitua os campos
 * abaixo por ele (mantendo esta mesma estrutura) e remova este aviso.
 */
export const landingContent = {
  hero: {
    eyebrow: "Software sob medida para distribuidoras e indústrias pequenas",
    headline: "Menos planilha, menos retrabalho, mais controle do seu time externo",
    subheadline:
      "Criamos aplicativos sob medida para quem vende e entrega fora do escritório: clientes, pedidos e rotas de entrega organizados num só lugar, do jeito que a sua operação já funciona.",
    primaryCta: "Pedir diagnóstico gratuito",
    secondaryCta: "Falar no WhatsApp",
  },

  problemas: {
    title: "Problemas que a gente ouve toda vez que conversa com uma distribuidora",
    subtitle:
      "Se algum destes pontos é familiar, provavelmente dá para resolver sem trocar toda a sua operação.",
    items: [
      {
        title: "Planilha vira gargalo",
        description:
          "Cliente, pedido e entrega espalhados em planilhas diferentes, sem histórico confiável e sujeitos a erro de digitação.",
      },
      {
        title: "Cadastro de cliente duplicado",
        description:
          "Sem checagem de CNPJ ou CPF, o mesmo cliente acaba cadastrado duas vezes — e cada versão com um dado diferente.",
      },
      {
        title: "Vendedor externo sem internet",
        description:
          "Em área rural ou galpão sem sinal, um app que depende de internet trava a venda justamente na hora de fechar.",
      },
      {
        title: "Roteiro de entrega manual",
        description:
          "Montar a rota do entregador na mão, cidade por cidade, cliente por cliente, consome tempo todo dia — e erra fácil.",
      },
      {
        title: "Pedido sem número de controle",
        description:
          "Sem um número de pedido único e rastreável, fica difícil conferir o que foi combinado com o que foi entregue.",
      },
      {
        title: "Exportar para o contador ou para o Excel",
        description:
          "Sistema fechado que não exporta pro formato que a sua contabilidade e o seu time já usam todo mês.",
      },
    ],
  },

  comoResolvemos: {
    title: "Como resolvemos",
    subtitle:
      "Não vendemos um sistema pronto de prateleira. Construímos em cima do que a sua equipe já faz.",
    items: [
      {
        title: "Sob medida, não sob encaixe",
        description:
          "O aplicativo é desenhado para o seu processo real, não o contrário. Você não muda a operação para caber no sistema.",
      },
      {
        title: "Integra com o que você já usa",
        description:
          "Exportação para Excel, PDF e Word, e integração com as ferramentas que já fazem parte da rotina do seu time.",
      },
      {
        title: "Perto de quem usa",
        description:
          "Somos uma equipe pequena e acessível: você fala direto com quem desenvolve, sem central de atendimento.",
      },
      {
        title: "Manutenção contínua",
        description:
          "Depois da entrega, seguimos com planos de manutenção, suporte e hospedagem — o sistema não fica órfão.",
      },
    ],
  },

  oQueJaFizemos: {
    title: "O que já fizemos",
    subtitle:
      "Ainda não temos cases publicados — nosso primeiro projeto real é o Rota de Vendas, um aplicativo para vendedores externos e entregas.",
    appName: "Rota de Vendas",
    appDescription:
      "Aplicativo para representantes comerciais e entregadores: cadastro de clientes, pedidos com número do sistema do vendedor e rotas de entrega organizadas por cidade, com roteiro exportado em Word, PDF e Excel. Funciona sem internet, pensado para acessibilidade, e roda em Android e Windows.",
    videoSrc: "/video/brag.mp4",
    videoPoster: "/video/brag.jpg",
    disclaimer: "Capturas de tela com dados fictícios, apenas para demonstração.",
    screenshots: [
      {
        src: "/capturas/pedido-formulario.png",
        alt: "Formulário de pedido do Rota de Vendas, com cálculo automático de total",
      },
      {
        src: "/capturas/cliente-detalhe.png",
        alt: "Tela de detalhe do cliente, com dados de contato e histórico",
      },
      {
        src: "/capturas/numero-pedido.png",
        alt: "Pedido exibindo o número do sistema do vendedor",
      },
      {
        src: "/capturas/personalizacao-logo.png",
        alt: "Configuração da empresa com logo para os documentos exportados",
      },
      {
        src: "/capturas/funciona-offline.png",
        alt: "Cadastro de endereço funcionando sem conexão com a internet",
      },
    ],
  },

  diagnostico: {
    title: "Diagnóstico gratuito",
    subtitle:
      "Conte um pouco do seu processo e a gente responde com um diagnóstico gratuito, sem compromisso, sobre onde um aplicativo sob medida ajudaria.",
    form: {
      nameLabel: "Nome",
      companyLabel: "Empresa",
      whatsappLabel: "WhatsApp",
      problemLabel: "Qual o seu maior problema hoje?",
      consentLabel: "Concordo com o tratamento dos meus dados conforme o",
      consentLinkLabel: "aviso de privacidade",
      submitLabel: "Enviar e pedir diagnóstico",
      successMessage: "Recebemos sua mensagem. Vamos responder em breve pelo WhatsApp ou e-mail.",
      errorMessage: "Não foi possível enviar agora. Tente novamente em instantes.",
    },
  },

  equipe: {
    title: "Equipe",
    subtitle:
      "Somos um grupo de amigos da faculdade que desenvolve aplicativos sob medida para empresas.",
  },

  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "Vocês são uma empresa de software pronto ou sob medida?",
        answer:
          "Desenvolvemos sob medida, a partir do processo real de cada cliente, e não vendemos um sistema fechado de prateleira.",
      },
      {
        question: "E quando vocês se formarem, quem mantém o sistema?",
        answer:
          "O projeto inclui planos mensais de manutenção, suporte e hospedagem, justamente para que o sistema continue funcionando e evoluindo depois da entrega.",
      },
      {
        question: "Preciso trocar minha planilha ou meu sistema atual de uma vez?",
        answer:
          "Não. Começamos com um piloto de escopo pequeno para validar o ganho antes de qualquer troca maior.",
      },
      {
        question: "Vocês já têm clientes nesse segmento?",
        answer:
          "Ainda não temos clientes fechados — estamos na fase de validar a ideia com distribuidoras e indústrias pequenas. O que já existe é o aplicativo Rota de Vendas, pronto e demonstrável.",
      },
    ],
  },

  rodape: {
    privacyNotice:
      "Os dados enviados pelo formulário são usados apenas para retornar o contato sobre o diagnóstico solicitado.",
    privacyLinkLabel: "Aviso de privacidade",
  },
} as const;
