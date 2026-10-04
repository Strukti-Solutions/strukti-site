# Texto da landing page: Strukti Soluções

Status: **aprovado pelo Thiago em 03/10/2026** · Versão 2.0 · 03/10/2026 · Home nova da marca-mãe (hardware + IA), ADR-009.

*Nota: a v2.0 reescreve a home inteira para o novo rumo (spec `docs/superpowers/specs/2026-10-03-identidade-estudio-design.md`). O histórico até a v1.8 está no git (`git log -- docs/landing-copy.md`).*

## Como ler este documento

- O texto depois de cada rótulo em negrito (**Título (H1):**, **Botão:** etc.) é o **texto final** e vai para o site exatamente assim, com a mesma pontuação e acentuação.
- Na v2.0, todo rótulo de texto que vai para `landingContent` (`src/content/landing.ts`) começa pelo **nome da chave**, entre crases. Ex.: **`heroEstudio.headline` (título, H1):** é o texto que vai em `landingContent.heroEstudio.headline`. Em listas, o índice entre colchetes diz a posição (`steps[0]` é o primeiro passo).
- Linhas que começam com *Nota:* orientam o Dev e o cliente. **Não vão para o site.**
- `[A PREENCHER: ...]` é um dado que ainda falta. **Não publicar enquanto houver algum.** A lista completa está no fim.
- `{nome}`, `{n}` e `{max}` são valores que o site preenche sozinho.

## Ângulo

**"Equipamento e software para problemas que um aplicativo sozinho não resolve."**

A página é a vitrine da Strukti Soluções, agora focada em produtos que juntam hardware e IA. Ela fala com quem pode usar um produto da Strukti: o dono de quadra ou arena (replay), o gerente de supermercado (estacionamento inteligente, ainda em estudo) e a empresa que precisa de um aplicativo sob medida. Fala também com quem tem um problema que pede equipamento e não achou no catálogo.

O replay vem na frente; os aplicativos continuam, em segundo plano. Todo caminho termina numa conversa: WhatsApp com mensagem pronta ou formulário com o assunto já marcado.

O texto é honesto sobre a fase de cada coisa: o selo de status diz em que pé está cada produto; inteligência artificial aparece só como "em breve"; o 3D é sempre "ilustração do conceito"; o replay usa o Wi-Fi da arena; nenhum cliente, número de uso, preço ou prazo é inventado; a região de instalação do replay ainda não está definida e o texto não promete nenhuma.

## Mapa da página

Ordem e fundos conforme a spec §4.

| # | Seção | Âncora | Fundo | Chamada para ação |
|---|---|---|---|---|
| 1 | Barra do topo | — | escuro | WhatsApp (mensagem geral) |
| 2 | Abertura (hero) | `#inicio` | escuro | "Conhecer o replay" (âncora `#produtos`) e "Falar no WhatsApp" |
| 3 | Produtos de hardware | `#produtos` | escuro, palcos | Replay: WhatsApp (mensagem do replay). Estacionamento: WhatsApp (mensagem do estacionamento) |
| 4 | Aplicativos | `#aplicativos` | escuro, palcos | "Diagnóstico gratuito" → formulário com o assunto "Aplicativo" |
| 5 | Tem um problema que pede hardware? | `#sob-medida` | claro | Formulário com o assunto "Outro" |
| 6 | Como trabalhamos | `#como-trabalhamos` | claro | — |
| 7 | Equipe | `#equipe` | claro | — |
| 8 | Contato | `#contato` | claro | Formulário único |
| 9 | Dúvidas frequentes | `#duvidas` | claro | WhatsApp (mensagem geral) |
| 10 | Rodapé | — | escuro | WhatsApp, e-mail, aviso de privacidade |
| — | Aviso de privacidade | `/privacidade` | claro | — |
| — | Botão flutuante do WhatsApp | em todas as telas | — | WhatsApp (mensagem geral) |

*Nota: saem da home as seções "Problemas" (dores das distribuidoras) e "Diagnóstico gratuito" como seção própria. O diagnóstico vira a chamada dos aplicativos e uma opção do campo de assunto do formulário.*

---

## Selos de status

Os quatro rótulos são fixos (spec §3.4). O texto do selo sempre aparece escrito; a cor só reforça.

- **`statusLabels.piloto`:** Piloto gratuito
- **`statusLabels.desenvolvimento`:** Em desenvolvimento
- **`statusLabels.emUso`:** Em uso
- **`statusLabels.emBreve`:** Em breve

Quem leva cada selo nesta home:

| Produto | Chave do status | Selo |
|---|---|---|
| Replay para quadras | `piloto` | Piloto gratuito |
| Estacionamento inteligente | `desenvolvimento` | Em desenvolvimento |
| Rota de Vendas (`aplicativos`, projeto `rota-de-vendas`) | `piloto` | Piloto gratuito |
| Fleet Analytics BI (`aplicativos`, projeto `fleet-analytics-bi`) | `emUso` | Em uso |
| Recursos de IA (cortes automáticos, destaque por jogador) | `emBreve` | Em breve |

*Nota: nesta home, os recursos de IA aparecem só no texto, sempre com "em breve" escrito (hero e dúvidas). Nenhum card mostra o selo "Em breve" por enquanto.*

---

## Mensagens prontas do WhatsApp

Número: +55 83 99968-3670. O link é montado por `siteConfig.whatsapp.linkWithMessage(mensagem)`.

**`whatsappMessages.general`:** Olá! Vim pelo site da Strukti Soluções e quero conversar com vocês.

*Nota: usada na barra do topo, no botão "Falar no WhatsApp" do hero, nas dúvidas, no rodapé, no botão flutuante, na tela de sucesso do formulário e na página 404. Link para testar: `https://wa.me/5583999683670?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Strukti%20Solu%C3%A7%C3%B5es%20e%20quero%20conversar%20com%20voc%C3%AAs.`*

**`whatsappMessages.replay`:** Olá! Vim pelo site da Strukti Soluções e quero agendar uma demonstração do replay para a minha quadra.

*Nota: usada no botão "Agendar demonstração" do card do replay. Link para testar: `https://wa.me/5583999683670?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Strukti%20Solu%C3%A7%C3%B5es%20e%20quero%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20do%20replay%20para%20a%20minha%20quadra.`*

**`whatsappMessages.estacionamento`:** Olá! Vim pelo site da Strukti Soluções e quero conversar sobre o estacionamento inteligente.

*Nota: usada no botão "Quero conversar sobre isso" do card do estacionamento. Link para testar: `https://wa.me/5583999683670?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Strukti%20Solu%C3%A7%C3%B5es%20e%20quero%20conversar%20sobre%20o%20estacionamento%20inteligente.`*

*Nota: a mensagem pronta de aplicativo (`whatsappMessages.aplicativo`) foi removida na Tarefa 10, porque ficou sem uso: o formulário único serve a todos os assuntos, e o link "Chame no WhatsApp" ao lado dele e a mensagem de falha no envio usam a mensagem geral. O texto antigo está no histórico do git.*

*Nota: cada mensagem mostra de onde veio a conversa sem precisar de analytics.*

---

## 1. Barra do topo

**`header.skipLink` (link de acessibilidade, primeiro item da página):** Pular para o conteúdo

**Marca:** Strukti Soluções

**Menu:**

- **`header.nav[0].label` (`href: "#produtos"`):** Produtos
- **`header.nav[1].label` (`href: "#aplicativos"`):** Apps
- **`header.nav[2].label` (`href: "#equipe"`):** Equipe
- **`header.nav[3].label` (`href: "#contato"`):** Contato

**`header.whatsappButton` (botão):** Falar no WhatsApp

**`header.menuButton` (botão que abre o menu abaixo de 1200 px, 75em):** Menu

*Nota: `skipLink`, `whatsappButton` e `menuButton` não mudam (v1.8). Só o menu muda: saem Problemas, Como trabalhamos, O que já construímos, Diagnóstico e Dúvidas; entram os quatro itens acima, conforme a spec §4.*

---

## 2. Abertura (hero "estudio")

**`heroEstudio.eyebrow` (sobretítulo):** Replay para quadras · Aplicativos sob medida

**`heroEstudio.headline` (título, H1):** Equipamento e software para problemas que um aplicativo sozinho não resolve.

**`heroEstudio.body` (texto):** A Strukti Soluções monta o equipamento, escreve o software e cuida da instalação e do suporte. O primeiro produto é o replay para quadras de aluguel: o jogador aperta um botão na beira da quadra e recebe o lance no celular. Estamos procurando as primeiras quadras para um piloto gratuito. Recursos de inteligência artificial, como o destaque por jogador, vêm em breve.

**`heroEstudio.primaryCta` (botão principal, âncora `#produtos`):** Conhecer o replay

**`heroEstudio.whatsappCta` (botão secundário, WhatsApp com a mensagem geral):** Falar no WhatsApp

**`heroEstudio.illustrationBadge` (selo discreto sobre o 3D):** Ilustração do conceito

*Nota: o botão de replay em 3D é um modelo estilizado, feito por nós; não existe caixa definitiva do produto. O selo "Ilustração do conceito" é texto visível e acompanha o 3D sempre, inclusive quando só o pôster aparece (movimento reduzido, economia de dados, falha ao carregar).*

*Nota: o título não fala de IA de propósito: hoje nenhum produto tem IA pronta. A IA aparece no texto, com "em breve" escrito.*

*Nota: os textos do hero "video" e "classic" (`hero.*`, inclusive os nomes do controle do vídeo de fundo, "Pausar o vídeo de fundo" e "Tocar o vídeo de fundo") continuam como na v1.8 enquanto essas variantes estiverem no código. Eles não aparecem com o hero "estudio".*

---

## 3. Produtos de hardware

**`produtos.title` (título, H2):** Produtos de hardware

**`produtos.intro` (texto):** Equipamento que fica no seu espaço, com software e suporte da própria Strukti. O selo de cada produto diz em que fase ele está.

### Replay (card grande)

Selo: **Piloto gratuito** (`piloto`).

**`produtos.replay.name` (título do card, H3):** Replay para quadras

**`produtos.replay.oneLiner` (o que é):** Para quadras de aluguel de society, futsal, vôlei e beach tennis: o jogador sai do jogo com o lance no celular, e o time ganha um motivo a mais para voltar à sua quadra.

**`produtos.replay.stepsTitle` (subtítulo dos passos):** Como funciona

**Passos (`produtos.replay.steps`, nesta ordem; o `lead` vai em negrito, seguido do `rest`):**

- **`produtos.replay.steps[0].lead`:** Aperta o botão.
- **`produtos.replay.steps[0].rest`:** Saiu um lance bonito? O jogador aperta o botão na beira da quadra.
- **`produtos.replay.steps[1].lead`:** O clipe é cortado.
- **`produtos.replay.steps[1].rest`:** O equipamento da quadra separa os 30 segundos antes do aperto e mais alguns depois.
- **`produtos.replay.steps[2].lead`:** Chega no celular.
- **`produtos.replay.steps[2].rest`:** O clipe sobe pelo Wi-Fi da arena, e o jogador vê e compartilha pelo celular. Esta etapa ainda está em construção, e é ela que o piloto vai testar.

*Nota: a gravação e o corte (passos 1 e 2) estão prontos e testados em bancada. O envio, a parte na internet e o site do jogador (passo 3) ainda não existem; por isso o passo 3 diz que está em construção. Na demonstração, mostrar o que já funciona e explicar que o resto entra no piloto.*

**Ficha técnica (`produtos.replay.specs`, nesta ordem; `value` grande em cima, `label` curto embaixo):**

- **`produtos.replay.specs[0].value`:** 30 s
- **`produtos.replay.specs[0].label`:** Antes do aperto
- **`produtos.replay.specs[1].value`:** Wi-Fi
- **`produtos.replay.specs[1].label`:** Da própria arena
- **`produtos.replay.specs[2].value`:** PoE
- **`produtos.replay.specs[2].label`:** Energia e imagem num cabo só

*Nota: no HTML da ficha (`<dl>`), o rótulo vem antes do valor, e o leitor de tela lê "Antes do aperto: 30 s", "Da própria arena: Wi-Fi", "Energia e imagem num cabo só: PoE". Os rótulos foram escritos para fazer sentido nas duas ordens.*

**`produtos.replay.cta` (botão, WhatsApp com a mensagem do replay):** Agendar demonstração

**`produtos.replay.siteLinkLabel` (link para o site próprio do replay):** Ver o site do replay

*Nota: o link do site do replay fica escondido enquanto o endereço não existir (`produtos.replay.siteUrl: null`). Endereço: [A PREENCHER: endereço do site do replay].*

*Nota: a imagem do card é o pôster do 3D, num palco, com o mesmo selo "Ilustração do conceito" do hero.*

*Nota: vinheta de patrocinadores e replay na TV do bar ficaram de fora de propósito: ainda não existem e não são recursos de IA (não cabem no "em breve" dos selos). Entram quando estiverem prontos ou se o Thiago decidir mostrá-los como "em breve".*

### Estacionamento inteligente (card menor)

Selo: **Em desenvolvimento** (`desenvolvimento`).

**`produtos.estacionamento.name` (título do card, H3):** Estacionamento inteligente

**`produtos.estacionamento.oneLiner` (o que é):** A ideia: sensores ou câmeras que indicam as vagas livres no estacionamento do supermercado. Antes de construir, queremos ouvir gerentes de supermercado.

**`produtos.estacionamento.cta` (botão, WhatsApp com a mensagem do estacionamento):** Quero conversar sobre isso

*Nota: o estacionamento está em espera de validação. O texto diz que é uma ideia e que queremos ouvir quem usaria; não fala de protótipo, teste ou prazo. São duas frases curtas (a spec pedia uma) porque a segunda é a que deixa a fase clara.*

---

## 4. Aplicativos

**`aplicativos.title` (título, H2):** Aplicativos sob medida

**`aplicativos.intro` (texto):** Também construímos aplicativos para empresas, do jeito que cada uma já trabalha e ligados ao que ela já usa. O primeiro passo é o diagnóstico gratuito: uma conversa sobre a rotina da empresa, com um resumo por escrito do que vale a pena fazer. Sem compromisso de contratar.

**`aplicativos.cta` (botão, leva ao formulário com o assunto "Aplicativo sob medida" marcado):** Diagnóstico gratuito

### Textos de interface da grade

**`aplicativos.grid.playLabel` (nome acessível do botão de reproduzir no cartão):** Assistir ao vídeo: {nome}

**`aplicativos.grid.showMore` (botão, quando a grade tiver mais de 6 projetos):** Mostrar mais projetos

**`aplicativos.videoDescriptionLinkLabel` (link que abre a descrição do vídeo):** Ler a descrição do vídeo

*Nota: os três textos acima não mudam (v1.5). `{nome}` é o nome do projeto. A grade não leva título próprio (o antigo "Outros projetos" sai): o título da seção já é o H2 acima.*

### Projetos (`aplicativos.projects`)

Os textos dos dois projetos são os mesmos da v1.6 (aprovados), copiados abaixo para este documento continuar sendo a fonte única. Só o status é novo.

**Rota de Vendas** (`slug: "rota-de-vendas"`)

- **`status`:** `piloto` (selo "Piloto gratuito")
- **`name`:** Rota de Vendas
- **`summary` (resumo no cartão):** O Rota de Vendas é um aplicativo que construímos para o vendedor externo e para a entrega: do pedido feito na loja do cliente até a porta.
- **`platforms` (etiquetas):** Android · Windows
- **`video.accessibleName`:** Vídeo de demonstração do Rota de Vendas
- **`video.caption` (legenda):** Vídeo de demonstração, só com música. Os clientes, pedidos e endereços que aparecem são fictícios.
- **`video.description` (texto que abre no link "Ler a descrição do vídeo"):** Uma linha de roteiro sai de João Pessoa/PB e passa por sete cidades: 12 paradas, 7 cidades, 1 roteiro. Aparece o Rota de Vendas, "para vendedores externos, no lugar da planilha", com clientes, pedidos e rotas. No computador, o número de pedido 0500 é digitado como veio do sistema do vendedor; um número repetido é recusado com o aviso "Já existe o pedido nº 0001". No roteiro de entrega, os mesmos números aparecem nas paradas, agrupadas por cidade, e o roteiro sai em Word, PDF e Excel. No fim, três telas de celular mostram o app sem internet, com letra grande e em alto contraste. Todos os dados são fictícios.
- **`videoTitle` (só se o projeto for destaque):** Veja o Rota de Vendas
- **`highlights` (só se o projeto for destaque; o trecho em negrito é o `lead`, o resto é o `rest`):**
  - **`highlights[0]`:** **Clientes na mão do vendedor.** Busca por nome, cidade ou CNPJ, com botões para ligar, chamar no WhatsApp e abrir no mapa. O mesmo CNPJ não entra duas vezes.
  - **`highlights[1]`:** **Pedido com o número do sistema que você já usa.** O vendedor digita o número como veio impresso no outro sistema, e número repetido não passa.
  - **`highlights[2]`:** **Rota de entrega por cidade.** As paradas saem agrupadas por cidade, com o caminho até a porta, a lista de carga e os brindes de cada parada. O roteiro sai em Word, PDF e Excel, com os mesmos números de pedido.
  - **`highlights[3]`:** **Funciona sem internet.** Tudo fica guardado no aparelho. Sem sinal, o vendedor continua trabalhando.
  - **`highlights[4]`:** **Fácil de ler na rua.** Letra até duas vezes maior e modo de alto contraste para usar sob o sol.
  - **`highlights[5]`:** **No celular e no computador.** O mesmo aplicativo no Android do vendedor e no Windows do escritório.

*Nota: o Rota de Vendas usa dados fictícios e não tem cliente usando; por isso o selo é "Piloto gratuito", não "Em uso". Os "funciona sem internet" acima falam do aplicativo Rota de Vendas (que guarda tudo no aparelho), não do replay. Na grade nova, `videoTitle` e `highlights` não aparecem (só o projeto em destaque os mostra); ficam nos dados.*

**Fleet Analytics BI** (`slug: "fleet-analytics-bi"`)

- **`status`:** `emUso` (selo "Em uso")
- **`name`:** Fleet Analytics BI
- **`summary` (resumo no cartão):** O Fleet Analytics BI é uma plataforma que construímos para quem cuida de uma frota: do rastreador de cada veículo aos chamados de reboque, com custos, abastecimentos e viagens no mesmo lugar.
- **`platforms` (etiquetas):** Web · Celular
- **`video.accessibleName`:** Vídeo de demonstração do Fleet Analytics BI
- **`video.caption` (legenda):** Vídeo de demonstração, só com música.
- **`video.description` (texto que abre no link "Ler a descrição do vídeo"):** Um contador sobe até 1.504 pontos de telemetria: 1 veículo, 1 dia. Aparece o Fleet Analytics BI, com o endereço ifanalitico.com.br e a frase "Transforme dados brutos do rastreador em inteligência operacional". Os menus se abrem: 38 telas em 7 módulos, "do rastreador ao reboque". Depois, cada tela vem com um número em destaque: 167 veículos acompanhados em tempo real; 450 km rodados, separados em autorizado, tolerância e proibido; 20,9% de eficiência por veículo, comparando o tempo ligado com o produtivo; um relatório por veículo com 9 análises; nota de risco 34 de 100; 37 trajetos em um dia, com 264,4 km e R$ 132,21 de custo; 71 alertas de abastecimento com consumo fora do padrão; e o replay de uma viagem de 231 km no mapa, com 10 paradas e máxima de 101 km/h. No módulo de reboque, com 696 chamados, aparecem o despacho, com o mapa dos guinchos; os chamados, com seguradora, origem e destino; a vistoria digital, com avarias, checklist, fotos e assinaturas; o lucro por atendimento; e o faturamento. No fim: "Da telemetria ao reboque. Uma plataforma." Placas, nomes e endereços aparecem borrados.
- **`videoTitle` (só se o projeto for destaque):** Veja o Fleet Analytics BI

*Nota (autorização do cliente, 01/10/2026, mantida da v1.6): o Fleet Analytics BI foi feito pelo grupo e pode ser mostrado como está, com o nome e o domínio ifanalitico.com.br; os números do vídeo são reais e autorizados. Por isso ele não leva o aviso de dados fictícios do Rota de Vendas. A autorização fica só nesta nota; o site não fala dela. A frase "Transforme dados brutos do rastreador em inteligência operacional" é do próprio vídeo e vai entre aspas só na descrição; não usar no resto do site. A descrição não cita a nota do condutor (no mesmo trecho, o número do vídeo, 65, e o da tela, 63, aparecem diferentes).*

---

## 5. Tem um problema que pede hardware?

**`chamadaHardware.title` (título, H2):** Tem um problema que pede hardware?

**`chamadaHardware.body` (texto):** Nem todo problema cabe no nosso catálogo. Se o seu precisa de câmera, sensor, botão ou outro equipamento ligado a um software, conte para a gente. Juntamos eletrônica e programação, e dizemos com franqueza se dá para resolver.

**`chamadaHardware.cta` (botão, leva ao formulário com o assunto "Outro assunto" marcado):** Contar o meu problema

---

## 6. Como trabalhamos

**`comoTrabalhamos.title` (título, H2):** Como trabalhamos

**`comoTrabalhamos.intro` (texto):** Do primeiro contato ao suporte, você fala com a mesma equipe, sem intermediário.

**Itens (`comoTrabalhamos.items`, nesta ordem):**

- **`comoTrabalhamos.items[0].title`:** Diagnóstico
- **`comoTrabalhamos.items[0].description`:** Antes de falar de equipamento ou de aplicativo, entendemos a rotina e onde o problema aparece. Se a solução não compensar, dizemos isso.
- **`comoTrabalhamos.items[1].title`:** Protótipo
- **`comoTrabalhamos.items[1].description`:** Montamos uma primeira versão e testamos com você, em pequena escala, antes da instalação completa.
- **`comoTrabalhamos.items[2].title`:** Instalação
- **`comoTrabalhamos.items[2].description`:** Instalamos o equipamento ou colocamos o aplicativo para funcionar, e acompanhamos a sua equipe até tudo rodar no dia a dia.
- **`comoTrabalhamos.items[3].title`:** Suporte direto
- **`comoTrabalhamos.items[3].description`:** Quem instala é quem cuida depois. Você fala com a equipe pelo WhatsApp, sem central de atendimento, e a manutenção não depende de técnico de fora. Os aplicativos seguem com plano mensal de manutenção, suporte e hospedagem.

*Nota: o quarto item se chama "Suporte direto", e não "Suporte local", porque a região de atuação do replay ainda não foi definida; "local" prometeria alguém perto de qualquer cidade. Quando a região estiver definida, dá para trocar.*

*Nota para o Dev: os itens agora são etapas, em ordem. O componente atual (`ComoResolvemos`) usa lista sem números ("qualidades, não etapas"); vale avaliar uma lista numerada na Tarefa 10.*

---

## 7. Equipe

**`equipe.title` (título, H2):** Quem faz

**`equipe.intro` (texto):** Somos quatro estudantes de engenharia da computação. Você fala direto com quem monta o equipamento e escreve o código.

**Cartões (iniciais + nome + curso, nesta ordem; `siteConfig.team`):**

- KB · Kauã Bruno · [A PREENCHER: curso]
- GF · Gustavo Fernandes · [A PREENCHER: curso]
- AM · Antonio Meira · [A PREENCHER: curso]
- TG · Thiago Guedes · [A PREENCHER: curso]

*Nota: o curso (e, se o grupo quiser, o período) de cada pessoa vai em `siteConfig.team[].course`, logo abaixo do nome. Fotos: [A PREENCHER: fotos da equipe]; até chegarem, ficam as iniciais. Sem cargos. "Antonio" vai sem acento, como está nos dados oficiais. As iniciais são decorativas (o nome já está escrito ao lado).*

---

## 8. Contato

**`contato.title` (título, H2):** Fale com a gente

**`contato.intro` (texto):** Quer agendar uma demonstração do replay, pedir o diagnóstico de um aplicativo ou contar outro problema? Escolha o assunto e escreva em poucas palavras.

### Formulário (`contato.form`)

**`contato.form.title` (título do cartão, H3):** Conte o que você precisa

**`contato.form.intro` (texto):** São cinco campos. Respondemos pelo WhatsApp.

**`contato.form.requiredNotice` (aviso de campos):** Todos os campos são obrigatórios.

**Campos, nesta ordem (nome, empresa, WhatsApp, assunto, mensagem):**

Nome (`contato.form.fields.name`)
- **`label`:** Seu nome
- **`errorEmpty`:** Escreva o seu nome.

Empresa (`contato.form.fields.company`)
- **`label`:** Nome da empresa ou da arena
- **`errorEmpty`:** Escreva o nome da empresa ou da arena.

WhatsApp (`contato.form.fields.whatsapp`)
- **`label`:** WhatsApp com DDD
- **`help`:** É por esse número que vamos responder.
- **`errorEmpty`:** Informe o seu WhatsApp.
- **`errorInvalid`:** Confira o número: ele precisa ter o DDD e o telefone completo.

Assunto (`contato.form.fields.interest`, campo novo, lista de opções)
- **`label`:** Sobre o que você quer falar?
- **`placeholder` (primeira linha da lista, sem valor):** Escolha um assunto
- **`errorEmpty`:** Escolha um assunto.
- **`options.replay`:** Replay para quadras
- **`options.estacionamento`:** Estacionamento inteligente
- **`options.aplicativo`:** Aplicativo sob medida
- **`options.outro`:** Outro assunto

Mensagem (`contato.form.fields.problem`; a chave continua `problem`, o texto passa a falar de "mensagem")
- **`label`:** Sua mensagem
- **`help`:** Conte com as suas palavras. Se for o replay, ajuda saber a cidade e quantas quadras você tem. Não precisa colocar dados dos seus clientes.
- **`errorEmpty`:** Conte em poucas palavras o que você precisa.
- **`errorTooLong`:** Use no máximo {max} caracteres.

*Nota: o assunto vem já marcado quando a pessoa chega pelo botão "Diagnóstico gratuito" (Aplicativo sob medida) ou "Contar o meu problema" (Outro assunto). O texto de ajuda da mensagem pede cidade e número de quadras no lugar de dois campos a mais.*

**Caixa de consentimento (desmarcada):**

- **`contato.form.consentLabelPrefix`:** Li o
- **`contato.form.consentLinkLabel` (link para `/privacidade`):** aviso de privacidade
- **`contato.form.consentLabelSuffix`:** e concordo que a Strukti Soluções use estes dados para responder à minha mensagem.

*Nota: como na v1.8, o prefixo termina com um espaço ("Li o ") e o sufixo começa com um espaço. A frase inteira fica: "Li o aviso de privacidade e concordo que a Strukti Soluções use estes dados para responder à minha mensagem."*

**`contato.form.consentError` (erro do consentimento):** Para enviar, marque que você concorda com o uso dos dados.

**`contato.form.consentHelperLine` (linha abaixo da caixa):** Usamos seus dados só para responder a esta mensagem.

**`contato.form.submitLabel` (botão de envio):** Enviar mensagem

**`contato.form.submittingLabel` (botão durante o envio):** Enviando…

**Alternativa abaixo do botão:**

- **`contato.form.whatsappAlternativePrefix`:** Prefere falar agora?
- **`contato.form.whatsappAlternativeLinkLabel`:** Chame no WhatsApp: +55 83 99968-3670

*Nota: o prefixo termina com um espaço ("Prefere falar agora? "), como na v1.8. Mensagem do link: ver a nota em "Mensagens prontas do WhatsApp" (recomendo a geral).*

**Resumo de erros (topo do formulário, ao tentar enviar):**

- **`contato.form.errorSummarySingle`:** Confira 1 campo antes de enviar.
- **`contato.form.errorSummaryMultiple`:** Confira {n} campos antes de enviar.

**Sucesso:**

- **`contato.form.success.title`:** Mensagem recebida!
- **`contato.form.success.text`:** Obrigado, {nome}. Respondemos no mesmo dia pelo WhatsApp informado. Se a mensagem chegou fora do horário comercial, respondemos no próximo dia útil.
- **`contato.form.success.text2`:** Se quiser adiantar a conversa, chame a gente agora.
- **`contato.form.success.button` (WhatsApp com a mensagem geral):** Chamar no WhatsApp

**`contato.form.submitError` (falha no envio):** Não foi possível enviar agora. Tente de novo em alguns minutos ou fale com a gente pelo WhatsApp.

**`contato.form.rateLimitError` (muitas tentativas seguidas):** Foram muitas tentativas seguidas. Espere alguns minutos e tente de novo, ou fale com a gente pelo WhatsApp.

**`contato.form.honeypotLabel` (campo antispam escondido):** Não preencha este campo

*Nota: mudaram em relação ao formulário da v1.8: o título e o texto do cartão, o rótulo e o erro da empresa, todo o campo de mensagem (antes "problema"), o fim da frase de consentimento, a linha abaixo da caixa, o botão de envio e o título e o texto do sucesso. O campo de assunto é novo. O resto é igual à v1.8.*

---

## 9. Dúvidas frequentes

**`faq.title` (título, H2):** Dúvidas frequentes

**Perguntas (`faq.items`, nesta ordem):**

**`faq.items[0].question`:** O replay precisa de internet?

**`faq.items[0].answer`:** Precisa. O equipamento da quadra usa o Wi-Fi da própria arena para enviar os clipes. Os jogadores veem os lances no celular, com a internet deles. Se a internet da sua arena for uma dúvida, falamos disso na demonstração.

**`faq.items[1].question`:** O replay já usa inteligência artificial?

**`faq.items[1].answer`:** Ainda não. Hoje o clipe é cortado quando o jogador aperta o botão. Cortes automáticos e destaque por jogador, com inteligência artificial, vêm em breve.

**`faq.items[2].question`:** E a privacidade de quem aparece no vídeo?

**`faq.items[2].answer`:** O replay está sendo construído assim: os clipes vão ficar disponíveis para os jogadores por 7 dias e depois serão apagados, e a quadra vai exibir um aviso de que há gravação.

**`faq.items[3].question`:** Quanto custa?

**`faq.items[3].answer`:** Depende do produto. O preço do replay ainda está sendo definido, e nesta fase oferecemos um piloto gratuito. Nos aplicativos, depois do diagnóstico gratuito você recebe uma proposta com o que será feito, o prazo e o preço, antes de qualquer compromisso.

**`faq.items[4].question`:** Vocês atendem a minha cidade?

**`faq.items[4].answer`:** Nos aplicativos, sim: em João Pessoa e região, atendemos presencialmente; no resto do Brasil, por videochamada e pelo WhatsApp. O replay precisa de instalação na quadra, e a região onde vamos começar ainda está sendo definida. Conte a sua cidade na conversa.

**`faq.items[5].question`:** E quando vocês se formarem, quem mantém tudo funcionando?

**`faq.items[5].answer`:** Quem mantém é a Strukti: uma equipe, e não uma pessoa só. No replay, quem instala, dá suporte e faz a manutenção somos nós. Os aplicativos têm plano mensal de manutenção, suporte e hospedagem, que garante alguém cuidando deles hoje e depois da formatura. E cada projeto tem documentação, para não depender da memória de ninguém.

**`faq.items[6].question`:** Vocês também fazem aplicativos?

**`faq.items[6].answer`:** Fazemos. O aplicativo segue o jeito que a sua empresa já trabalha e se liga ao sistema que você já usa. Quando o sistema não permite, o aplicativo gera os arquivos no formato da empresa, como Excel, PDF ou Word. Tudo começa com o diagnóstico gratuito.

**`faq.items[7].question`:** O que acontece com os dados que eu mando pelo formulário?

**`faq.items[7].answer`:** Usamos só para responder à sua mensagem. Os detalhes estão no aviso de privacidade.

**`faq.items[7].answerLinkLabel` (trecho da resposta que vira link para `/privacidade`):** aviso de privacidade

**`faq.closing` (fecho):** Ficou alguma dúvida? Pergunte direto para a gente.

**`faq.button` (botão, WhatsApp com a mensagem geral):** Chamar no WhatsApp

*Nota: os 7 dias e o aviso de gravação na quadra vêm do `contexto-replay.md` (regras de LGPD do replay). Os detalhes sobre os clipes ficam para o site próprio do replay; aqui só a resposta curta, porque o dono de quadra pergunta.*

*Nota: saíram as dúvidas "Por que não usar um sistema pronto?", "Preciso trocar o sistema que já uso?", "Em quanto tempo fica pronto?" e "O aplicativo funciona sem internet?". A resposta sobre sistema já usado foi para "Vocês também fazem aplicativos?".*

---

## 10. Rodapé

**Marca:** Strukti Soluções

**`rodape.tagline` (linha):** Produtos de hardware e aplicativos sob medida.

**Contato:**
- **`rodape.whatsappLabel`:** WhatsApp:
- **`rodape.emailLabel`:** E-mail:
- **`rodape.location`:** João Pessoa/PB

*Nota: depois de "WhatsApp:" vem o link [+55 83 99968-3670](https://wa.me/5583999683670?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Strukti%20Solu%C3%A7%C3%B5es%20e%20quero%20conversar%20com%20voc%C3%AAs.) (mensagem geral); depois de "E-mail:", o link [struktisolutions@gmail.com](mailto:struktisolutions@gmail.com).*

**`rodape.privacyLinkLabel` (link):** Aviso de privacidade

**Direitos:** © 2026 Strukti Soluções

*Nota: `whatsappLabel`, `emailLabel` e `privacyLinkLabel` não mudam (v1.8). A linha de local perdeu "Atendimento presencial na região e a distância para todo o Brasil": isso vale para os aplicativos, não para o replay, cuja região ainda não está definida. A resposta completa fica na dúvida "Vocês atendem a minha cidade?". O ano do © acompanha o ano atual.*

---

## Botão flutuante do WhatsApp

**`floatingWhatsapp.desktopLabel` (texto visível, desktop):** WhatsApp

**`floatingWhatsapp.accessibleName` (nome acessível):** Falar com a Strukti Soluções no WhatsApp

*Nota: não muda (v1.8). No celular pode ser só o ícone, desde que mantenha o nome acessível acima. Usa a mensagem geral.*

---

## Aviso de privacidade (página `/privacidade`)

**`privacidade.title` (título, H1):** Aviso de privacidade

**`privacidade.lastUpdatedLabel` (data):** Última atualização:

**`privacidade.intro` (texto):** Este aviso explica, em linguagem simples, o que a Strukti Soluções faz com os dados que você envia pelo formulário do site.

**Seções (`privacidade.sections`, nesta ordem):**

**`sections[0].heading` (H2):** Quem cuida dos seus dados

**`sections[0].paragraphs[0]`:** O responsável pelos dados enviados pelo formulário é Thiago Guedes, da Strukti Soluções. Contato para assuntos de privacidade: struktisolutions@gmail.com.

*Nota: quando a Strukti tiver CNPJ, trocar este parágrafo pela razão social e pelo CNPJ.*

**`sections[1].heading` (H2):** Quais dados coletamos

**`sections[1].paragraphs[0]`:** Pelo formulário: seu nome, o nome da empresa ou da arena, o número de WhatsApp, o assunto que você escolher e a mensagem que você escrever. Só isso. Pedimos que você não coloque na mensagem dados dos seus clientes nem documentos pessoais.

**`sections[1].paragraphs[1]`:** Para bloquear envios automáticos, o site registra por pouco tempo o endereço de internet (IP) de quem envia o formulário.

*Nota: o segundo parágrafo já está no site (a proteção contra spam guarda o IP por pouco tempo). Se isso deixar de ser verdade, ele sai.*

**`sections[2].heading` (H2):** Para que usamos

**`sections[2].paragraphs[0]`:** Para responder à sua mensagem e conversar sobre o assunto que você escolheu. Não vendemos, não alugamos e não usamos esses dados para outra finalidade.

**`sections[3].heading` (H2):** Base legal

**`sections[3].paragraphs[0]`:** O seu consentimento, dado ao marcar a caixa do formulário (Lei Geral de Proteção de Dados, art. 7º, inciso I).

**`sections[4].heading` (H2):** Com quem compartilhamos

**`sections[4].paragraphs[0]`:** Com ninguém, a não ser os serviços que usamos para manter o site no ar e guardar os dados: [A PREENCHER: nomes dos provedores de hospedagem e de banco de dados, e se guardam os dados fora do Brasil]. Eles só guardam os dados para nós.

**`sections[5].heading` (H2):** Por quanto tempo guardamos

**`sections[5].paragraphs[0]`:** Por até 12 meses depois do nosso último contato com você. Depois disso, apagamos os dados. Se você pedir, apagamos antes.

**`sections[6].heading` (H2):** Seus direitos

**`sections[6].paragraphs[0]`:** Você pode, a qualquer momento:

**`sections[6].list`:**
- **`list[0]`:** saber quais dados temos sobre você;
- **`list[1]`:** corrigir dados errados;
- **`list[2]`:** pedir que apaguemos os seus dados;
- **`list[3]`:** retirar o seu consentimento.

**`sections[6].paragraphsAfterList[0]`:** Basta mandar um e-mail para struktisolutions@gmail.com. Se o seu pedido não for atendido, você também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).

**`sections[7].heading` (H2):** Cookies e WhatsApp

**`sections[7].paragraphs[0]`:** Este site não usa cookies de rastreamento nem ferramentas de análise de visitas. Se você falar com a gente pelo WhatsApp, a conversa também segue as regras de privacidade do próprio WhatsApp.

**`sections[8].heading` (H2):** Mudanças neste aviso

**`sections[8].paragraphs[0]`:** Se este aviso mudar, a data no topo muda junto.

**`privacidade.contactEmailLabel`:** struktisolutions@gmail.com

*Nota: mudaram só "Quais dados coletamos" (entram empresa ou arena, o assunto e a mensagem no lugar da descrição do problema) e "Para que usamos" (responder à mensagem sobre o assunto escolhido, e não só ao pedido de diagnóstico). O resto é igual à v1.8.*

*Nota: a frase sobre cookies só pode ir ao ar se continuar verdadeira. Os quadros do 3D são servidos pelo próprio site e não mudam isso. Se um dia entrar analytics ou outro script de terceiros, este aviso precisa mudar antes.*

*Nota: este aviso cobre só o formulário do site da Strukti. As imagens dos jogadores gravadas pelo replay (clipes, 7 dias, aviso na quadra) ficam para a política do site próprio do replay.*

**Versão do aviso (`siteConfig.privacyPolicyVersion`):** 2026-10-03

*Nota: a versão sobe de 2026-09-30 para 2026-10-03 porque mudam os dados coletados (entra o assunto). A data exibida no topo do aviso vem desse mesmo valor.*

---

## Página não encontrada (404)

- **`notFound.title`:** Página não encontrada
- **`notFound.homeLink`:** Voltar para o início

*Nota: não muda (v1.8, aprovação do Claudinho em 03/10/2026). Microcopy de interface, não é texto de venda. O botão de WhatsApp da página usa a mensagem geral nova. Nada além desses dois textos.*

---

## SEO e compartilhamento

**`seo.title` (`<title>`, 56 caracteres):** Replay para quadras e apps sob medida | Strukti Soluções

**`seo.description` (`meta description`, 145 caracteres):** Replay para quadras de aluguel, em piloto gratuito: o jogador aperta um botão e recebe o lance no celular. Também fazemos aplicativos sob medida.

**Link de compartilhamento (Open Graph):**
- **`seo.ogSiteName` (`og:site_name`):** Strukti Soluções
- **`seo.ogTitle` (`og:title`, 62 caracteres):** Strukti Soluções: replay para quadras e aplicativos sob medida
- **`seo.ogDescription` (`og:description`, 144 caracteres):** O jogador aperta o botão e o lance chega no celular. Replay para quadras de aluguel, em piloto gratuito, e aplicativos sob medida para empresas.
- **`seo.ogUrl` (`og:url`):** [A PREENCHER: endereço do site]
- **`seo.ogImageAlt` (`og:image:alt`):** Strukti Soluções: replay para quadras e aplicativos sob medida

*Nota: `ogSiteName` não muda. A imagem de compartilhamento ainda é a da v1.8 (marca Strukti Soluções). Se ela for trocada pelo pôster do 3D, o texto alternativo precisa dizer que é ilustração, por exemplo: "Ilustração do conceito do botão de replay da Strukti Soluções". Não usar `brag.jpg`.*

**Mensagem para a equipe enviar o site pelo WhatsApp:**
Oi! Somos a Strukti Soluções, quatro estudantes de engenharia da computação. Estamos começando com um replay para quadras de aluguel: o jogador aperta um botão na beira da quadra e recebe o lance no celular. Procuramos quadras para um piloto gratuito. Também fazemos aplicativos sob medida para empresas. Dá uma olhada: [A PREENCHER: endereço do site]

*Nota: esta mensagem não vai para o site; é para a equipe colar no WhatsApp.*

---

## Textos alternativos das imagens

| Imagem | Onde | Texto alternativo |
|---|---|---|
| Pôster e quadros do 3D (`public/hero/sequencia/`) | Hero | Vazio (decorativo). O selo "Ilustração do conceito" é texto visível ao lado. |
| Pôster do 3D | Card do replay | Vazio (decorativo). O mesmo selo "Ilustração do conceito" aparece no palco. |
| Capas dos vídeos (`brag.jpg`, `fleet-analytics-bi.jpg`) | Aplicativos | Vazio. O botão em volta já tem o nome "Assistir ao vídeo: {nome}". |
| Fotos da equipe | Equipe | [A PREENCHER: fotos da equipe]. Quando chegarem: vazio, porque o nome já está escrito ao lado. |
| Iniciais da equipe | Equipe | Decorativas: texto alternativo vazio. |

*Nota: as capturas do Rota de Vendas listadas na v1.8 (pastas `q4` e `q5`) continuam fora do site (decisão do cliente, 30/09) e saíram desta tabela.*

---

## Pendências [A PREENCHER]

Bloqueiam a publicação:

1. Aviso de privacidade: provedores de hospedagem e de banco de dados, e se guardam dados fora do Brasil.
2. Endereço do site (`seo.ogUrl` e mensagem da equipe).
3. Curso de cada pessoa da equipe (`siteConfig.team[].course`, ainda pendente nas 4 pessoas).

O grupo decide se bloqueiam:

4. Fotos da equipe. A página funciona com as iniciais; o grupo decide se publica sem fotos.

Não bloqueiam a publicação:

5. Endereço do site próprio do replay (`produtos.replay.siteUrl`). Enquanto não existir, o link "Ver o site do replay" fica escondido.
