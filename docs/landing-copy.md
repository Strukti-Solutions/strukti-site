# Texto da landing page: Strukti Soluções

Status: **aprovada pelo Thiago em 13/10/2026 para homologação** · Versão 2.2 · 13/10/2026 · Rodada de textos [S1-B] (Verbo), sobre a v2.1, depois da prévia.

> **Aprovada pelo Thiago em 13/10/2026 para homologação** ("por enquanto é isso"), junto com a prévia que foi para o branch `homologacao`. Substitui a v2.0. Continua pendente: a escolha final do hero (a prévia mostra a opção B; a A e a C ficam acessíveis por `?hero=a` e `?hero=c` só para comparação), os dados `[A PREENCHER]` da lista no fim (nada com marcação vai para a página: o curso da equipe fica escondido até chegar) e a spec do fio (em pausa no branch `docs/s1-a-spec-fio`). As marcas "[proposta]" nas notas abaixo registram de onde veio cada texto; com esta aprovação, valem como aprovadas para homologação.

*Nota: a v2.2 aplica a revisão do Thiago depois da prévia (`C:/dev/_ops/strukti/conteudo/DECISOES-S1-B.md`, itens 7 a 12, que prevalecem sobre os itens 1 a 6 onde conflitam). A evidência continua em `PESQUISA.md`, na mesma pasta. A spec do fio precisa ser atualizada junto: D3 (o hero volta a ser de marca), D4 (os passos saem de novo), §5 (composição do hero) e §6 (percurso: 7 capítulos até o Contato, com Replay e Aplicativos juntos em Produtos).*

## Histórico de versões

| Versão | Data | Status | O que fez |
|---|---|---|---|
| **2.2** | 13/10/2026 | **Aprovada pelo Thiago para homologação** (13/10/2026) | Revisão depois da prévia: o replay vira um produto como os outros, com 3 cartões no mesmo formato numa seção só; um link por produto na barra do topo; hero de marca em 3 opções; saem o bloco do piloto, os 3 passos, o plano mensal e as dúvidas do piloto |
| 2.1 | 13/10/2026 | Proposta, **substituída pela 2.2** sem ter sido aprovada | Hero com a cena do replay, chamada única por público, "Como funciona" de volta, bloco "Piloto gratuito", dúvidas do dono de quadra, Dúvidas antes do Contato, sem o estacionamento |
| 2.0 | 03/10/2026 | Aprovada pelo Thiago; **substituída pela 2.2** | Home nova da marca-mãe (hardware + IA), ADR-009 |
| 1.8 e anteriores | até 03/10/2026 | Aprovadas | Fase de aplicativos; histórico no git (`git log -- docs/landing-copy.md`) |

## O que mudou desde a v2.1 (o que estava na prévia)

**Decidido pelo Thiago em 13/10/2026, à noite** (`DECISOES-S1-B.md`, itens 7 a 12):
1. **O replay não é mais o foco** (item 7): vira um produto como os outros, com o mesmo formato de cartão de Rota de Vendas e Fleet Analytics BI: vídeo, selo de status, nome, uma frase e botão (§3).
2. **Barra do topo com um link por produto** (item 8): Replay, Rota de Vendas e Fleet Analytics BI. Por enquanto, cada link rola até o cartão do produto; quando a página própria existir, o link passa a abri-la (§1).
3. **Saem** (item 9): o bloco "Piloto gratuito", os 3 passos "Como funciona", a frase do plano mensal em "Como trabalhamos" e na dúvida da formatura, e as 3 dúvidas novas do piloto ("O que a minha quadra precisa ter?", "Quanto tempo leva a instalação?" e "O que acontece no fim do piloto?"). Esse detalhe vai para a futura página do replay.
4. **Fica "Como trabalhamos"**, com as 4 etapas, sem o plano mensal (item 10, §5).
5. **O hero volta a falar da marca** (item 11): saem do hero o título "O jogador aperta um botão e leva o lance no celular.", a frase do piloto, o botão "Quero o piloto na minha quadra" e o link "Ver como funciona". O botão do piloto, com a mensagem de "Cidade:" e "Quantas quadras:", fica no cartão do replay (§2 e §3).
6. **Continuam valendo** (item 12): a costura (fio do tratamento A, 3 clímax), sem o estacionamento, sem fotos, Dúvidas antes do Contato, chamada única por público e nada inventado. A mensagem do formulário continua obrigatória (item 5).

**Proposta, a revisar pelo Thiago** (cada uma tem a marca **[proposta]** no texto):
7. **Hero de marca em 3 opções** (A, B e C), trocáveis na prévia por uma chave na URL. **Recomendo a B** (§2).
8. **Uma seção só, "Produtos"**, com os 3 cartões, no lugar das seções Replay e Aplicativos, e uma introdução de 2 frases (§3).
9. **A frase do replay ganha o mecanismo** ("o jogador aperta um botão na beira da quadra"), porque o hero e os passos não explicam mais o produto (§3).
10. **Também saem do cartão do replay**, para ele caber no formato dos outros: a ficha técnica, a linha "Em breve" da IA e o microtexto embaixo do botão. É consequência do item 7 do Thiago; o conteúdo vai para a futura página do replay. A IA "em breve" continua na dúvida já aprovada (§3).
11. **Duração no botão de reproduzir dos 3 vídeos**: 52 s, 22 s e 53 s (§3).
12. **Dúvidas rebalanceadas** (§7): as gerais primeiro; do replay, só as 3 aprovadas na v2.0; a da formatura sem o plano mensal; a de aplicativos sem o "também".
13. **"Como trabalhamos"**: o Diagnóstico recebe a frase do diagnóstico gratuito, que ficava na introdução de Aplicativos; sai a frase "No replay, esta etapa é o piloto gratuito." da v2.1 (§5).
14. **SEO e compartilhamento voltam ao texto da v2.0**: sai a proposta de título, descrição e imagem de Open Graph centrados no replay (SEO).

**Propostas da v2.1 que continuam** (sem mudança, ainda **[proposta]**): os resumos dos aplicativos começando pelo uso (§3), a introdução da Equipe com a cidade (§6) e a introdução do Contato com "piloto" (§8).

## O que muda em relação à v2.0 (o que está no código hoje)

Para quem compara com `src/content/landing.ts` (main `6e46a1a`):
- **Barra do topo:** "Produtos" e "Apps" viram 3 links, um por produto (§1).
- **Hero:** sobretítulo, título, texto e botão principal novos (uma das 3 opções); o botão "Falar no WhatsApp" continua; sai o selo "Ilustração do conceito" do hero (D5) (§2).
- **Produtos:** uma seção só, com Replay, Rota de Vendas e Fleet Analytics BI no mesmo formato; sai o estacionamento (D6); saem os passos e a ficha do replay; os botões viram "Quero o piloto na minha quadra" e "Pedir diagnóstico gratuito" (§3).
- **Aplicativos:** deixa de ser seção; o título e a introdução saem, e os 2 projetos viram cartões de Produtos (§3).
- **Como trabalhamos:** uma frase nova no Diagnóstico; sai o plano mensal do Suporte direto (§5).
- **Equipe e Contato:** uma frase nova em cada introdução (§6 e §8).
- **Dúvidas:** sobem para antes do Contato; ordem nova; formatura sem o plano mensal; pergunta de aplicativos reescrita; "na demonstração" vira "na conversa" (§7).
- **Mensagem do replay no WhatsApp** com "Cidade:" e "Quantas quadras:"; sai a do estacionamento.
- **Formulário:** sai a opção "Estacionamento inteligente" do assunto.

**Não muda em relação à v2.0:** Sob medida (§4), rodapé, botão flutuante, aviso de privacidade (texto e versão), página 404, SEO e compartilhamento, e os textos dos selos.

*Nota de 16/10/2026: o hero "expansao" (o padrão desde 15/10/2026; subseção "Hero expansao" no fim da seção 2) é **proposta — aguardando aprovação** no título em duas linhas, na dica, na descrição da mídia e nos nomes do controle do vídeo. O resto do hero usa o texto aprovado da v2.2 (opção B; A e C por `?hero=`), e todo o resto continua como aprovado na v2.2.*

## Como ler este documento

- O texto depois de cada rótulo em negrito (**Título (H1):**, **Botão:** etc.) é o **texto final** e vai para o site exatamente assim, com a mesma pontuação e acentuação.
- Todo rótulo de texto que vai para `landingContent` (`src/content/landing.ts`) começa pelo **nome da chave**, entre crases. Ex.: **`heroEstudio.headline` (título, H1):** é o texto que vai em `landingContent.heroEstudio.headline`. Em listas, o índice entre colchetes diz a posição (`items[0]` é o primeiro item). Se o Vitral reorganizar as chaves (por exemplo, juntar os 3 produtos numa lista só), é só código: o texto é o mesmo.
- Linhas que começam com *Nota:* orientam o Dev e o cliente. **Não vão para o site.**
- O que mudou desde a v2.0 vem com uma nota *(v2.2)* logo abaixo, com o texto de antes. A marca **[decidido 13/10]** indica decisão do Thiago; **[proposta]**, texto que o Thiago ainda vai revisar.
- `[A PREENCHER: ...]` é um dado que ainda falta. **Não publicar enquanto houver algum.** A lista completa está no fim.
- `{nome}`, `{duração}`, `{n}` e `{max}` são valores que o site preenche sozinho.

## Ângulo

**A Strukti Soluções faz equipamento e software para quadras e empresas, com a mesma equipe da montagem ao suporte.**

A página é a vitrine da marca-mãe. O hero fala da marca: o que a Strukti faz, para quem e de onde. Logo abaixo, os 3 produtos aparecem lado a lado, no mesmo formato, cada um com o seu selo de fase e o seu botão. Nenhum produto é o "principal" da página: quem chega pelo WhatsApp ou pelo Instagram vai direto ao produto que interessa, pela barra do topo ou rolando.

Cada público tem uma chamada só, sempre com o mesmo rótulo: "Quero o piloto na minha quadra" (WhatsApp com a mensagem do replay) e "Pedir diagnóstico gratuito" (formulário com o assunto "Aplicativo sob medida"). Quem tem outro problema de hardware conta pelo formulário ("Contar o meu problema"). Todo caminho termina numa conversa.

O texto é honesto sobre a fase de cada coisa: o selo diz em que pé está cada produto; o vídeo do replay é sempre "ilustração do conceito"; inteligência artificial aparece só como "em breve", numa dúvida; o replay usa o Wi-Fi da arena; nenhum cliente, número de uso, preço ou prazo é inventado; a região de instalação do replay ainda não está definida e o texto não promete nenhuma. O detalhe do piloto (condições, o que a quadra precisa ter, o fim do piloto) fica para a futura página do replay.

*Nota (v2.2): na v2.0, o ângulo era "Equipamento e software para problemas que um aplicativo sozinho não resolve."; na v2.1, a cena do replay. Agora o ângulo é a marca, sem negação e sem centrar num produto. [decidido 13/10, item 11]*

## Mapa da página

Ordem e fundos conforme a spec §4 e a spec do fio, agora com **7 capítulos até o Contato**.

| # | Seção | Âncora | Fundo | Chamada para ação |
|---|---|---|---|---|
| 1 | Barra do topo | — | escuro | Um link por produto; WhatsApp (mensagem geral) |
| 2 | Abertura (hero "expansao", o padrão desde 15/10/2026; ver "Hero expansao" no fim da seção 2) | `#inicio` | escuro | "Ver os produtos" (âncora `#produtos`) e "Falar no WhatsApp" (mensagem geral) |
| 3 | Produtos (Replay, Rota de Vendas, Fleet Analytics BI) | `#produtos`; cartões `#replay`, `#rota-de-vendas`, `#fleet-analytics-bi` | escuro, palcos | Replay: "Quero o piloto na minha quadra" (WhatsApp, mensagem do replay). Aplicativos: "Pedir diagnóstico gratuito" → formulário com o assunto "Aplicativo sob medida" |
| 4 | Tem um problema que pede hardware? | `#sob-medida` | claro | Formulário com o assunto "Outro assunto" |
| 5 | Como trabalhamos | `#como-trabalhamos` | claro | — |
| 6 | Equipe | `#equipe` | claro | — |
| 7 | Dúvidas frequentes | `#duvidas` | claro | WhatsApp (mensagem geral) |
| 8 | Contato | `#contato` | claro | Formulário único |
| 9 | Rodapé | — | escuro | WhatsApp, e-mail, aviso de privacidade |
| — | Aviso de privacidade | `/privacidade` | claro | — |
| — | Botão flutuante do WhatsApp | em todas as telas | — | WhatsApp (mensagem geral) |

*Nota (v2.2): as linhas 3 e 4 da v2.1 (Replay e Aplicativos) viram uma linha só, Produtos. A âncora `#aplicativos` sai e `#produtos` volta, agora para os 3 produtos. Cada cartão ganha a sua âncora, que é o destino do link da barra do topo. Os 3 clímax do fio continuam: o símbolo no hero (combina com o hero de marca), a virada da noite para o papel entre Produtos e Sob medida, e o Contato. [proposta]*

*Nota: o site ainda não foi publicado, então nenhum link com `#aplicativos` circulou; não precisa de âncora antiga.*

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
| Rota de Vendas | `piloto` | Piloto gratuito |
| Fleet Analytics BI | `emUso` | Em uso |

*Nota (v2.2): sai a linha da IA do replay ("Em breve"), porque a linha "Em breve" sai do cartão (ver §3). A IA continua escrita como "em breve" na dúvida "O replay já usa inteligência artificial?". Os selos "Em desenvolvimento" e "Em breve" ficam sem uso nesta home, mas continuam nos dados.*

---

## Mensagens prontas do WhatsApp

Número: +55 83 99968-3670. O link é montado por `siteConfig.whatsapp.linkWithMessage(mensagem)`.

**`whatsappMessages.general`:** Olá! Vim pelo site da Strukti Soluções e quero conversar com vocês.

*Nota: usada na barra do topo, no hero ("Falar no WhatsApp"), nas dúvidas, no rodapé, no botão flutuante, na tela de sucesso do formulário, no link "Chame no WhatsApp" ao lado do formulário e na página 404. Link para testar: `https://wa.me/5583999683670?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Strukti%20Solu%C3%A7%C3%B5es%20e%20quero%20conversar%20com%20voc%C3%AAs.`*

**`whatsappMessages.replay`** (3 linhas; as quebras de linha fazem parte da mensagem):

> Olá! Vim pelo site da Strukti Soluções e quero o piloto gratuito do replay na minha quadra.
> Cidade:
> Quantas quadras:

*Nota (22/10/2026): saiu do código com o botão do cartão da v2.2 (o catálogo não tem WhatsApp no painel, spec do catálogo Q5). O texto fica aqui para o site próprio do replay.*

*Nota: no código, a mensagem é uma string só, com `\n` entre as linhas e nada depois dos dois-pontos: `"Olá! Vim pelo site da Strukti Soluções e quero o piloto gratuito do replay na minha quadra.\nCidade:\nQuantas quadras:"`. O `encodeURIComponent` transforma cada `\n` em `%0A`. A pessoa completa a cidade e o número de quadras antes de enviar; se mandar sem completar, a equipe pergunta. Usada só no botão do cartão do replay. Link para testar: `https://wa.me/5583999683670?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Strukti%20Solu%C3%A7%C3%B5es%20e%20quero%20o%20piloto%20gratuito%20do%20replay%20na%20minha%20quadra.%0ACidade%3A%0AQuantas%20quadras%3A`*

*Nota (v2.2): antes (v2.0), "Olá! Vim pelo site da Strukti Soluções e quero agendar uma demonstração do replay para a minha quadra." [decidido 13/10, itens 3 e 11]*

*Nota: sai `whatsappMessages.estacionamento` (D6). A mensagem pronta de aplicativo continua sem existir (removida na Tarefa 10 da v2.0): o diagnóstico vai pelo formulário. Cada mensagem mostra de onde veio a conversa sem precisar de analytics.*

---

## 1. Barra do topo

**`header.skipLink` (link de acessibilidade, primeiro item da página):** Pular para o conteúdo

**Marca:** Strukti Soluções

**Menu (nesta ordem):**

- **`header.nav[0].label` (`href: "#replay"`):** Replay
- **`header.nav[1].label` (`href: "#rota-de-vendas"`):** Rota de Vendas
- **`header.nav[2].label` (`href: "#fleet-analytics-bi"`):** Fleet Analytics BI
- **`header.nav[3].label` (`href: "#equipe"`):** Equipe
- **`header.nav[4].label` (`href: "#contato"`):** Contato

*Nota (v2.2): antes (v2.0), "Produtos" (`#produtos`), "Apps" (`#aplicativos`), "Equipe" e "Contato". Um link por produto, que por enquanto rola até o cartão dele; quando a página própria do produto existir, o `href` passa a ser o endereço dela, e o rótulo continua o mesmo. "Replay" vai curto, como o Thiago escreveu; o nome completo ("Replay para quadras") está no cartão. [decidido 13/10, item 8]*

*Nota para o Dev (v2.2): conferido pelo Vitral na prévia (13/10): os 5 links e o botão do WhatsApp cabem a partir de 1200 px (~900 px de 1120, ou ~1040 px com o espaçamento de texto da WCAG 1.4.12), então o "Equipe" fica. Abaixo de 1200 px, tudo vai para o menu. Cada cartão tem `scroll-margin-top` para o título não ficar embaixo da barra fixa (§3). [proposta]*

**`header.whatsappButton` (botão):** Falar no WhatsApp

**`header.menuButton` (botão que abre o menu abaixo de 1200 px, 75em):** Menu

*Nota: `skipLink`, `whatsappButton` e `menuButton` não mudam (v1.8).*

---

## 2. Abertura (hero)

O hero volta a falar da **marca** [decidido 13/10, item 11]. Abaixo, **3 opções** para o Thiago escolher vendo na prévia **[proposta]**. As três têm a mesma estrutura (sobretítulo, título, uma frase, botão principal e o link do WhatsApp), para a escolha comparar só as palavras. As três dizem as mesmas três coisas (o que a Strukti faz e para quem; que a mesma equipe monta, programa, instala e dá suporte; de onde ela é) e mudam só o que vai no título, que é o que se lê primeiro.

*Nota para o Dev: na prévia, a opção vem da chave `?hero=a`, `?hero=b` ou `?hero=c` (junto com `?fio=costura`); sem a chave, mostra a B. No produto vai só a opção escolhida, sem chave na URL.*

### Opção A: a mesma equipe, do equipamento ao suporte

- **`heroEstudio.eyebrow` (sobretítulo):** Strukti Soluções, de João Pessoa
- **`heroEstudio.headline` (título, H1; 44 caracteres):** A mesma equipe monta, programa e dá suporte.
- **`heroEstudio.body` (texto; 106 caracteres):** Fazemos o replay para quadras de aluguel e aplicativos sob medida para empresas, e cuidamos da instalação.
- **`heroEstudio.primaryCta` (botão principal, âncora `#produtos`):** Ver os produtos

**Por quê:** o título diz o que a Strukti faz e o que a diferencia, e passa no teste de "alguma empresa diria o contrário?": quem revende equipamento de um fornecedor e software de outro diria (NN/g, "Tagline Blues", 2001, e "Homepage Design: 5 Fundamental Principles", 2024; PESQUISA §3.1). Juntar o que está incluído numa frase curta é o que a Gabriel faz na página da câmera (PESQUISA §2.2), e "quem atende é quem faz" é o que mais prende no Taller (§2.3). Tudo vem de texto já aprovado: o hero da v2.0 ("monta o equipamento, escreve o software e cuida da instalação e do suporte") e "Quem instala é quem cuida depois" (Como trabalhamos).

**Risco:** o título não diz para quem; quem lê só o título sabe que é uma empresa de tecnologia, mas não que é para a quadra ou para a empresa dele. A frase resolve, na linha seguinte.

### Opção B (recomendada): o que fazemos e para quem

- **`heroEstudio.eyebrow` (sobretítulo):** Strukti Soluções, de João Pessoa
- **`heroEstudio.headline` (título, H1; 45 caracteres):** Replay para quadras e aplicativos sob medida.
- **`heroEstudio.body` (texto; 111 caracteres):** Montamos o equipamento, escrevemos o software e cuidamos da instalação e do suporte, sempre com a mesma equipe.
- **`heroEstudio.primaryCta` (botão principal, âncora `#produtos`):** Ver os produtos

**Por quê:** é a única das três em que o título sozinho responde às perguntas do teste dos 5 segundos: o que é e para quem ("para quadras" e "sob medida", feito para a empresa de quem lê; o botão diz o que fazer). Os títulos que funcionam dizem o que é e para quem na primeira tela (padrão 1 das 16 páginas, PESQUISA §2.4: Meu Replay e Chame o VAR), e a proposta de valor tem de aparecer nos primeiros 10 segundos (Nielsen, NN/g, 2011, PESQUISA §3.1). Duas coisas tornam isso mais importante agora: o hero perdeu a imagem do produto (o símbolo é da marca, PESQUISA §1.1), e no celular os nomes dos produtos ficam escondidos atrás do "Menu". A diferença da Strukti (a mesma equipe do começo ao fim) vai nas primeiras palavras da frase, onde o olho ainda passa (Pernice, NN/g, padrão em F, PESQUISA §3.6). O título repete o `seo.title`, o rodapé e o sobretítulo da v2.0, todos aprovados (agora como frase, sem o "A · B"), e essa coerência também conta para a credibilidade (Harley, NN/g, 2016, PESQUISA §3.3).

*Nota para o Dev: no título, "sob medida" vai com espaço não separável (`sob medida`), para não quebrar entre as linhas. Na prévia de 390 (13/10), o título ficou "Replay para quadras / e aplicativos sob / medida.".*

**Risco:** é o mais descritivo dos três, menos "frase de marca". E muda quando entrar um produto de outro tipo (o rodapé e o `seo.title` mudariam junto).

### Opção C: você fala com quem faz

- **`heroEstudio.eyebrow` (sobretítulo):** Replay para quadras e aplicativos sob medida
- **`heroEstudio.headline` (título, H1; 43 caracteres):** Você fala direto com quem monta e programa.
- **`heroEstudio.body` (texto; 102 caracteres):** A Strukti Soluções, de João Pessoa, faz o equipamento e o software e cuida da instalação e do suporte.
- **`heroEstudio.primaryCta` (botão principal, âncora `#produtos`):** Ver os produtos

**Por quê:** aposta na prova que a Strukti tem e as outras não mostram: as pessoas. Mostrar quem está por trás é uma das diretrizes de credibilidade de Stanford (Fogg, 2002); o thoughtbot põe os rostos no topo e o Taller diz que a primeira conversa já é com quem faz (PESQUISA §2.3 e §3.3); nenhuma das 6 páginas de replay apresenta a equipe (PESQUISA §2.4, padrão 7). E falar com gente, e não com robô, é diferença real: o atendimento por robô no WhatsApp tem nota média 5,6 de 10 (Mobile Time/Opinion Box, 2026, PESQUISA §3.7). O título vem do texto aprovado da Equipe ("Você fala direto com quem monta o equipamento e escreve o código.").

**Risco:** o que a Strukti faz fica no sobretítulo, que é a linha menor da tela. Foi exatamente o problema que o diagnóstico apontou no hero da v2.0 (PESQUISA §1.1). E a introdução da Equipe repetiria a mesma ideia mais abaixo. (O sobretítulo da C é o título da B: as duas trocam de lugar a mesma informação.)

### Igual nas três opções

**`heroEstudio.whatsappCta` (link de texto ao lado do botão, WhatsApp com a mensagem geral):** Falar no WhatsApp

*Nota (v2.2): o link do WhatsApp volta ao hero, como na v2.0. Na v2.1 ele tinha saído porque o botão principal também abria o WhatsApp, com outra mensagem; agora o botão principal é uma âncora e não há conflito. No celular, a barra do topo mostra só "Strukti" e "Menu", e este é o único caminho direto para a conversa na primeira tela. Sai `heroEstudio.secondaryLink` ("Ver como funciona"), chave nova da v2.1. [proposta]*

*Nota (v2.2): antes (v2.0), sobretítulo "Replay para quadras · Aplicativos sob medida", título "Equipamento e software para problemas que um aplicativo sozinho não resolve.", texto de 4 frases e botão "Conhecer o replay" (âncora `#produtos`). As três opções tiram a negação do título, o formato "A · B" do sobretítulo (vetado no MASTER §10) e encurtam o texto para uma frase. O botão "Ver os produtos" leva ao título "Produtos": o rótulo diz para onde vai (Moran, NN/g, "Better Link Labels", PESQUISA §3.2).*

*Nota: nenhuma das opções fala de inteligência artificial, de propósito. Hoje nenhum produto tem IA pronta, e "com IA" não é proposta de valor (Samsonov, NN/g, 2025, PESQUISA §3.1). A IA aparece numa dúvida, com "em breve" escrito. Se o Thiago quiser a IA no hero, a única forma honesta é uma frase a mais no texto, como na v2.0: "Recursos de inteligência artificial para o replay vêm em breve."*

*Nota (v2.2): sai `heroEstudio.illustrationBadge` do hero (D5): o hero mostra o símbolo da marca, não o produto. O texto "Ilustração do conceito" fica em `produtos.replay.illustrationBadge`, no cartão do replay.*

*Nota para o Dev: o visual do hero é o símbolo da marca, montado peça a peça (clímax 1 do fio). É decorativo (`aria-hidden`), sem texto alternativo. No celular, a faixa do símbolo ocupa ~34% da tela, como na prévia. Validado com o Vitral (13/10): a 390 × 844, sobretítulo, título (3 linhas), frase (3 linhas), botão e link ocupam ~380 px dos ~475 que sobram; a 360 × 740, o título precisa ter até 45 caracteres para não quebrar em 4 linhas e empurrar o link do WhatsApp para baixo da dobra. Por isso os títulos têm de 43 a 45 caracteres (a A e a B foram encurtadas depois da validação), e as frases, de 102 a 111. As chaves continuam com o prefixo `heroEstudio`; se o Vitral renomear, é só código.*

*Nota: os textos do hero "video" e "classic" (`hero.*`, inclusive os nomes do controle do vídeo de fundo, "Pausar o vídeo de fundo" e "Tocar o vídeo de fundo") continuam como na v1.8 enquanto essas variantes estiverem no código. Eles não aparecem com o hero da home.*

**Recomendação:** a **B**. O critério que guiou toda a pesquisa é o teste dos 5 segundos no celular, e a B é a única que passa nele só pelo título. A A é a segunda escolha, se o Thiago quiser um título com mais cara de marca: ela tem a mesma informação, só em ordem inversa. Antes de fechar, dá para tirar a dúvida com o teste dos 5 segundos pelo WhatsApp: mandar a primeira tela das 3 opções para 5 pessoas de fora do grupo e perguntar "sobre o que era?" e "para quem é?" (Lyssna, PESQUISA §3.1).

### Hero "expansao" (o padrão desde 15/10/2026) — proposta — aguardando aprovação

Status: **proposta — aguardando aprovação do Thiago** (15/10/2026; ajustada à v2.2 em 16/10/2026). O hero "expansao" (MASTER §9.8, ADR-010) substitui o hero de marca da prévia como padrão: um quadro com o vídeo "Fim de expediente" cresce com a rolagem, o título se abre para os lados e, com a expansão completa, aparece o conteúdo com o texto aprovado das opções acima. Enquanto esta subseção não for aprovada, os textos novos abaixo estão no site como proposta. Os textos já aprovados vêm das opções desta seção, por referência, sem mudança.

**Textos novos (proposta):**

- **`heroExpansao.titleLines[0]` (1ª parte do título, desliza para a esquerda):** Tecnologia que trabalha
- **`heroExpansao.titleLines[1]` (2ª parte do título, desliza para a direita):** em silêncio
- **`heroExpansao.title` (o H1, numa leitura só):** Tecnologia que trabalha em silêncio
- **`heroExpansao.hint` (dica abaixo do quadro, só para o olho, aparece só quando a expansão anda):** Role para expandir
- **`heroExpansao.mediaAlt` (nome acessível do quadro com o vídeo):** Fim de expediente: uma mesa junto a uma janela alta na hora azul, com a cidade desfocada lá fora, a luz do abajur, um caderno fechado, uma caneca, um celular mostrando uma rota do Rota de Vendas e a caixa do botão do replay com o LED ciano aceso.
- **`heroExpansao.videoPause` (controle do vídeo, tocando):** Pausar o vídeo
- **`heroExpansao.videoPlay` (controle do vídeo, parado):** Tocar o vídeo

**Textos já aprovados (opção B desta seção), reaproveitados:**

- **`heroExpansao.date` (linha de apoio abaixo do quadro, desliza para a esquerda):** o sobretítulo, `heroEstudio.eyebrow` ("Strukti Soluções, de João Pessoa").
- **`heroExpansao.headline` (H2 do conteúdo que aparece com a expansão completa):** `heroEstudio.headline` ("Replay para quadras e aplicativos sob medida.").
- **`heroExpansao.body`:** `heroEstudio.body`.
- **`heroExpansao.primaryCta` (botão principal, âncora `#produtos`):** `heroEstudio.primaryCta` ("Ver os produtos").
- **`heroExpansao.whatsappCta` (WhatsApp com a mensagem geral):** `heroEstudio.whatsappCta` ("Falar no WhatsApp").

*Nota para o Dev: como no hero de marca, `?hero=a` ou `?hero=c` troca, depois de montar, a linha de apoio, o H2 e a frase pelos da opção A ou C (`src/components/spike/HeroOpcao.tsx`); sem a chave, fica a B. O H1 e a dica não mudam com a opção.*

*Nota: o título curto existe para caber nas duas partes que se abrem para os lados. O título da opção escolhida continua no site, como H2 do conteúdo que aparece logo depois.*

*Nota: "Role para expandir" é instrução visual: fica fora do leitor de tela e não aparece sem animação (reduced motion, sem JavaScript), quando seria mentira.*

*Nota: os nomes do controle tiram o "de fundo" do hero "video", porque aqui o vídeo fica num quadro no meio da tela, não no fundo.*

*Nota: no hero "expansao", "Falar no WhatsApp" continua como botão (o desenho do hero, MASTER §9.8), não como o link de texto do hero de marca; o texto e a mensagem são os mesmos.*

---

## 3. Produtos

**`produtos.title` (título, H2):** Produtos

**`produtos.intro` (texto):** O selo de cada produto diz em que fase ele está. Os aplicativos são feitos sob medida, e o primeiro passo é um diagnóstico gratuito, sem compromisso.

*Nota (v2.2): antes (v2.0), o título era "Produtos de hardware", e a introdução, "Equipamento que fica no seu espaço, com software e suporte da própria Strukti. O selo de cada produto diz em que fase ele está." A primeira frase é a da v2.0. A segunda traz, encurtado, o que dizia a introdução de Aplicativos, que sai ("O primeiro passo é o diagnóstico gratuito [...]. Sem compromisso de contratar."): é ela que explica o botão "Pedir diagnóstico gratuito" e tira o risco perto dele, como o "sem cobrança automática" do Mercos (PESQUISA §2.3). O "sob medida" fica aqui porque o título "Aplicativos sob medida" sai. [proposta]*

### Uma seção só ou duas?

**Recomendo uma seção só**, com os 3 cartões no mesmo formato, nesta ordem: Replay, Rota de Vendas, Fleet Analytics BI. **[proposta]**

1. **É o que o item 7 do Thiago pede:** o replay é um produto como os outros. Separar "Hardware" de "Aplicativos" recria a hierarquia que ele acabou de tirar.
2. **A barra do topo já separa por produto** (item 8). Quem chega procura um produto, não uma categoria; um título por categoria seria uma segunda camada de navegação que ninguém usa.
3. **Com um produto de hardware só, a seção de hardware teria um cartão.** Foi por isso que a v2.1 precisou chamar a seção pelo nome do produto e tirar o H3 do cartão.
4. **A frase de cada cartão já separa os públicos:** as três começam por "Para quem" ("Para quadras de aluguel", "Para o vendedor externo e para a entrega", "Para quem cuida de uma frota"). A pessoa se reconhece pela situação dela, que é o que as "duas portas" do Vinta fazem (PESQUISA §2.3), sem precisar de duas seções.
5. **Página mais curta no celular:** um título e uma introdução, em vez de dois de cada.

Vale separar quando houver 2 ou mais produtos de hardware (se o estacionamento voltar, por exemplo) ou quando as páginas próprias existirem e a home virar um índice delas.

*Nota para o Dev (validado com o Vitral, 13/10): os 3 cartões formam uma **parede** (MASTER §5.2), encaixados com a junta de 3 px, cada um com o palco do vídeo em cima; o conteúdo e os vídeos são diferentes, então não é o "três cartões iguais com ícone em cima" do MASTER §10. Larguras: 3 colunas a partir de 1024 px; de 768 a 1023 px, o replay ocupa a linha inteira em cima (palco à esquerda, texto à direita) e os 2 aplicativos ficam embaixo; abaixo de 768 px, empilhados. Cada cartão leva a âncora do link da barra do topo (`id="replay"`, `id="rota-de-vendas"`, `id="fleet-analytics-bi"`), com `scroll-margin-top` igual à altura da barra mais 16 px. O fio passa só na margem de Produtos, sem clímax; o clímax 2 passa a ser a passagem de Produtos para Sob medida. Ficam 7 capítulos até o Contato.*

### Formato do cartão (igual nos três)

Nesta ordem: vídeo (palco 16:9, com o botão de reproduzir) → selo de status (e, no replay, o selo "Ilustração do conceito") → nome (H3) → uma frase → etiquetas, quando houver → legenda e "Ler a descrição do vídeo" → botão.

*Nota (v2.2): é o formato pedido pelo Thiago (vídeo, uma frase, selo de status e botão, item 7), mais o que já estava aprovado e é obrigatório: o selo de ilustração do vídeo do replay (D5 e MASTER §8.14), a legenda e a descrição do vídeo (acessibilidade) e as etiquetas de plataforma dos aplicativos. Cada cartão tem um botão só.*

### Replay para quadras (`#replay`)

Selo: **Piloto gratuito** (`piloto`).

**`produtos.replay.illustrationBadge` (selo ao lado do selo de fase, junto do vídeo):** Ilustração do conceito

*Nota: mesmo texto de antes, que ficava em `heroEstudio.illustrationBadge` e já aparecia no cartão desde o PR #4. Só a chave muda (D5).*

**`produtos.replay.name` (nome, H3):** Replay para quadras

**`produtos.replay.oneLiner` (uma frase):** Para quadras de aluguel: o jogador aperta um botão na beira da quadra, leva o lance no celular e ganha mais um motivo para voltar.

*Nota (v2.2): antes (v2.0), "Para quadras de aluguel de society, futsal, vôlei e beach tennis: o jogador sai do jogo com o lance no celular, e o time ganha um motivo a mais para voltar à sua quadra." Sem o hero do replay e sem os passos, esta frase é a única que explica o produto na página, então ela ganha o mecanismo (o botão na beira da quadra), com as palavras do título que o Thiago aprovou para o hero na v2.1. O ganho do dono continua (o time volta). Saem as modalidades, para a frase ficar do tamanho das outras duas (130 caracteres; as dos aplicativos têm 89 e 137); elas vão para a página do replay. [proposta]*

**`produtos.replay.cta` (botão, WhatsApp com `whatsappMessages.replay`):** Quero o piloto na minha quadra

*Nota (v2.2): antes (v2.0), "Agendar demonstração". É o botão do piloto que saiu do hero, com a mensagem de "Cidade:" e "Quantas quadras:". [decidido 13/10, itens 3 e 11]*

**`produtos.replay.siteLinkLabel` (link para a página própria do replay):** Ver o site do replay

*Nota: o link fica escondido enquanto o endereço não existir (`produtos.replay.siteUrl: null`). Quando a página própria do replay existir (item 8), este link e o "Replay" da barra do topo passam a abri-la; o rótulo será revisto junto, porque pode ser uma página deste site, e não outro site. Endereço: [A PREENCHER: endereço da página do replay].*

*Nota (26/10/2026): a página do replay existe (repo Camera_Replay): `produtos.replay.siteUrl` = https://camera-replay.vercel.app, por enquanto a página inicial dela (a busca de quadras), decisão do Thiago. No catálogo, o "Quero saber mais" do replay passa a abrir essa página (os outros produtos seguem no formulário) e o "Ver o site" aparece. O "Replay" da barra do topo continua levando ao cartão do catálogo; o rótulo "Ver o site" não mudou.*

**Vídeo do replay (`produtos.replay.video`):**

- **`video.accessibleName`:** Vídeo de demonstração do replay para quadras
- **`video.playLabel` (nome acessível do botão de reproduzir):** Assistir ao vídeo: Replay para quadras (52 s)
- **`video.caption` (legenda):** Animação que ilustra o conceito, só com música. A arena, os jogadores e as telas do celular são fictícios.
- **`video.description` (texto que abre no link "Ler a descrição do vídeo"):** Numa arena à noite, o Lucas faz um gol no society e aperta o botão no alambrado: o anel de luz pisca duas vezes. O mesmo gol aparece de novo, visto pela câmera fixa atrás do gol, com a marca "Arena Pôr do Sol 20:37" e o texto "O sistema salva os últimos 30 segundos". Na areia, a Bia aperta o botão depois de um ponto, e o lance volta pela câmera atrás da linha de fundo, às 20:52: "Funciona em qualquer quadra: society, areia, futsal". No bar, o celular mostra a busca do lance, a lista de lances de hoje e o lance das 20:37, com os botões Baixar e Compartilhar e o aviso "Disponível por 7 dias". A TV do bar passa o replay. No fim, o logo da Strukti, a frase "O jogador aperta o botão e o lance chega no celular." e o WhatsApp (83) 99968-3670.

*Nota: o vídeo e estes textos estão no código desde o PR #4 (08/10/2026), mas não estavam no documento da v2.0; entram aqui para o documento voltar a ser a fonte única. A única mudança é a duração no `playLabel` (antes, "Assistir ao vídeo: Replay para quadras"). Dizer a duração ajuda quem decide se assiste (Schade, NN/g, "Video Usability", PESQUISA §3.8). [proposta]*

*Nota: pelo commit do PR #4, o vídeo é animação feita pelo grupo em código (projeto strukti-video), não material de terceiros; por isso não está no `THIRD_PARTY_NOTICES`. O Thiago confirma a origem (pendência 5).*

*Nota: com o vídeo, o selo "Ilustração do conceito" e a frase, o cartão continua dizendo o que o dono de quadra precisa saber para chamar: o que é, que é para a quadra dele, em que fase está (piloto gratuito) e o que fazer. O Wi-Fi da arena, a IA "em breve" e a privacidade dos clipes estão nas dúvidas (§7).*

*Nota (v2.2): saem do cartão do replay, e vão para a futura página dele **[decidido 13/10, item 9, e proposta]**:*
- *os 3 passos "Como funciona" (`produtos.replay.stepsTitle` e `steps`) [decidido 13/10, item 9];*
- *o bloco "Piloto gratuito" inteiro (`produtos.replay.piloto.*`) [decidido 13/10, item 9];*
- *a ficha técnica (`produtos.replay.specs`: "30 s", "Wi-Fi" e "PoE", que a v2.1 trocava por "1 cabo"), a linha "Em breve" da IA (`produtos.replay.emBreve`, chave nova da v2.1) e o microtexto embaixo do botão (`produtos.replay.ctaNote`, chave nova da v2.1) [proposta]. Os três não cabem no formato dos outros cartões (item 7). O selo "Piloto gratuito" já diz que o piloto é sem custo, e a IA continua na dúvida aprovada.*

*Nota: os textos que saem (passos, ficha, bloco do piloto e as dúvidas do piloto) ficam guardados na v2.1 (`landing-copy-v2.1.md`, §3 e §8) como ponto de partida da página do replay. Os dados que faltavam para eles (condições do piloto, o que a quadra precisa ter, Wi-Fi caído, tempo de instalação) deixam de bloquear a landing e passam a ser da página do replay.*

*Nota: vinheta de patrocinadores fica de fora de propósito: ainda não existe e não é recurso de IA. A TV do bar aparece só dentro da animação de conceito, que está marcada como ilustração.*

*Nota (v2.1, mantida): sai o card do **estacionamento inteligente** inteiro (`produtos.estacionamento.name`, `oneLiner` e `cta`), por decisão do Thiago registrada na spec do fio (D6). A parte de servidor (lista de assuntos, validação e o valor antigo no banco) é do Alicerce.*

### Rota de Vendas (`#rota-de-vendas`; `slug: "rota-de-vendas"`)

- **`status`:** `piloto` (selo "Piloto gratuito")
- **`name` (nome, H3):** Rota de Vendas
- **`summary` (uma frase):** Para o vendedor externo e para a entrega: do pedido feito na loja do cliente até a porta.
- **`platforms` (etiquetas):** Android · Windows
- **botão (`aplicativos.cta`, leva ao formulário com o assunto "Aplicativo sob medida" marcado):** Pedir diagnóstico gratuito
- **`video.accessibleName`:** Vídeo de demonstração do Rota de Vendas
- **`video.playLabel` (`aplicativos.grid.playLabel` com `{nome}` e `{duração}`):** Assistir ao vídeo: Rota de Vendas (22 s)
- **`video.caption` (legenda):** Vídeo de demonstração, só com música. Os clientes, pedidos e endereços que aparecem são fictícios.
- **`video.description` (texto que abre no link "Ler a descrição do vídeo"):** Uma linha de roteiro sai de João Pessoa/PB e passa por sete cidades: 12 paradas, 7 cidades, 1 roteiro. Aparece o Rota de Vendas, "para vendedores externos, no lugar da planilha", com clientes, pedidos e rotas. No computador, o número de pedido 0500 é digitado como veio do sistema do vendedor; um número repetido é recusado com o aviso "Já existe o pedido nº 0001". No roteiro de entrega, os mesmos números aparecem nas paradas, agrupadas por cidade, e o roteiro sai em Word, PDF e Excel. No fim, três telas de celular mostram o app sem internet, com letra grande e em alto contraste. Todos os dados são fictícios.
- **`videoTitle` (fica nos dados, fora do cartão):** Veja o Rota de Vendas
- **`highlights` (ficam nos dados, fora do cartão; o trecho em negrito é o `lead`, o resto é o `rest`):**
  - **`highlights[0]`:** **Clientes na mão do vendedor.** Busca por nome, cidade ou CNPJ, com botões para ligar, chamar no WhatsApp e abrir no mapa. O mesmo CNPJ não entra duas vezes.
  - **`highlights[1]`:** **Pedido com o número do sistema que você já usa.** O vendedor digita o número como veio impresso no outro sistema, e número repetido não passa.
  - **`highlights[2]`:** **Rota de entrega por cidade.** As paradas saem agrupadas por cidade, com o caminho até a porta, a lista de carga e os brindes de cada parada. O roteiro sai em Word, PDF e Excel, com os mesmos números de pedido.
  - **`highlights[3]`:** **Funciona sem internet.** Tudo fica guardado no aparelho. Sem sinal, o vendedor continua trabalhando.
  - **`highlights[4]`:** **Fácil de ler na rua.** Letra até duas vezes maior e modo de alto contraste para usar sob o sol.
  - **`highlights[5]`:** **No celular e no computador.** O mesmo aplicativo no Android do vendedor e no Windows do escritório.

*Nota (v2.1, mantida): antes, o `summary` era "O Rota de Vendas é um aplicativo que construímos para o vendedor externo e para a entrega: do pedido feito na loja do cliente até a porta." O nome já é o título do cartão; a frase começa pelo uso, como as outras duas. [proposta]*

*Nota (v2.2): o botão "Pedir diagnóstico gratuito" passa a ficar em cada cartão de aplicativo, em vez de um botão só embaixo da grade (antes, "Diagnóstico gratuito"). Os dois cartões de aplicativo levam o mesmo rótulo e o mesmo destino: é a chamada única da empresa, repetida (CXL, PESQUISA §3.2). O `highlights` e o `videoTitle` não aparecem no cartão; ficam nos dados para a futura página do produto. [decidido 13/10, itens 3 e 7]*

*Nota: o Rota de Vendas usa dados fictícios e não tem cliente usando; por isso o selo é "Piloto gratuito", não "Em uso". O "funciona sem internet" fala do aplicativo Rota de Vendas (que guarda tudo no aparelho), não do replay.*

### Fleet Analytics BI (`#fleet-analytics-bi`; `slug: "fleet-analytics-bi"`)

- **`status`:** `emUso` (selo "Em uso")
- **`name` (nome, H3):** Fleet Analytics BI
- **`summary` (uma frase):** Para quem cuida de uma frota: do rastreador de cada veículo aos chamados de reboque, com custos, abastecimentos e viagens no mesmo lugar.
- **`platforms` (etiquetas):** Web · Celular
- **botão (`aplicativos.cta`, leva ao formulário com o assunto "Aplicativo sob medida" marcado):** Pedir diagnóstico gratuito
- **`video.accessibleName`:** Vídeo de demonstração do Fleet Analytics BI
- **`video.playLabel` (`aplicativos.grid.playLabel` com `{nome}` e `{duração}`):** Assistir ao vídeo: Fleet Analytics BI (53 s)
- **`video.caption` (legenda):** Vídeo de demonstração, só com música.
- **`video.description` (texto que abre no link "Ler a descrição do vídeo"):** Um contador sobe até 1.504 pontos de telemetria: 1 veículo, 1 dia. Aparece o Fleet Analytics BI, com o endereço ifanalitico.com.br e a frase "Transforme dados brutos do rastreador em inteligência operacional". Os menus se abrem: 38 telas em 7 módulos, "do rastreador ao reboque". Depois, cada tela vem com um número em destaque: 167 veículos acompanhados em tempo real; 450 km rodados, separados em autorizado, tolerância e proibido; 20,9% de eficiência por veículo, comparando o tempo ligado com o produtivo; um relatório por veículo com 9 análises; nota de risco 34 de 100; 37 trajetos em um dia, com 264,4 km e R$ 132,21 de custo; 71 alertas de abastecimento com consumo fora do padrão; e o replay de uma viagem de 231 km no mapa, com 10 paradas e máxima de 101 km/h. No módulo de reboque, com 696 chamados, aparecem o despacho, com o mapa dos guinchos; os chamados, com seguradora, origem e destino; a vistoria digital, com avarias, checklist, fotos e assinaturas; o lucro por atendimento; e o faturamento. No fim: "Da telemetria ao reboque. Uma plataforma." Placas, nomes e endereços aparecem borrados.
- **`videoTitle` (fica nos dados, fora do cartão):** Veja o Fleet Analytics BI

*Nota (v2.1, mantida): antes, o `summary` era "O Fleet Analytics BI é uma plataforma que construímos para quem cuida de uma frota: do rastreador...". Mesmo motivo do Rota de Vendas. [proposta]*

*Nota (autorização do cliente, 01/10/2026, mantida da v1.6): o Fleet Analytics BI foi feito pelo grupo e pode ser mostrado como está, com o nome e o domínio ifanalitico.com.br; os números do vídeo são reais e autorizados. Por isso ele não leva o aviso de dados fictícios do Rota de Vendas. A autorização fica só nesta nota; o site não fala dela. A frase "Transforme dados brutos do rastreador em inteligência operacional" é do próprio vídeo e vai entre aspas só na descrição; não usar no resto do site. A descrição não cita a nota do condutor (no mesmo trecho, o número do vídeo, 65, e o da tela, 63, aparecem diferentes).*

### Textos de interface dos cartões

Os cartões da parede da v2.2 não existem mais: a microcopy do catálogo (seção "Textos de interface do catálogo (`catalogoUi`)", mais abaixo) toma o lugar deles. Dos três textos antigos, dois continuam em uso, agora no painel do produto, e um saiu:

**`catalogoUi.assistir` (nome acessível do botão de reproduzir do vídeo no painel e texto do link para o vídeo na ficha sem JS; antes `aplicativos.grid.playLabel`):** Assistir ao vídeo: {nome} ({duração})

**`aplicativos.videoDescriptionLinkLabel` (link que abre a descrição do vídeo, no painel):** Ler a descrição do vídeo

*Nota (22/10/2026): saiu o `aplicativos.grid.showMore` ("Mostrar mais projetos"), do botão que revelava mais de 6 cartões: o catálogo navega pelo coverflow, pelas bolinhas e pela fita, sem "mostrar mais". A chave saiu de `src/content/landing.ts`. [texto antigo, aprovado na v2.2]*

*Nota (22/10/2026): também saíram do código, sem uso desde que o catálogo tomou o lugar da parede, as chaves `produtos.replay.oneLiner`, `produtos.replay.cta`, `produtos.replay.siteLinkLabel` (o painel usa `catalogoUi.siteLink`, "Ver o site"), `whatsappMessages.replay`, `aplicativos.cta` e, nos aplicativos, `videoTitle` e `platforms`. Os textos ficam neste documento como registro (e para o site do replay e as páginas dos produtos).*

### Catálogo (proposta — aguardando aprovação)

Status: **proposta — aguardando aprovação do Thiago** (22/10/2026). A seção Produtos vira um catálogo em coverflow com 10 itens: o cartão do centro mostra tipo, selo de fase, nome, frase e "Ver detalhes"; o clique abre um painel com abas (Visão geral · Como funciona · Telas) e o botão "Quero saber mais" (spec `docs/superpowers/specs/2026-10-16-catalogo-produtos-design.md`, §3 e §5). Os textos ficam em `src/content/catalogo.ts` (`CATALOGO` e `catalogoUi`). O título e a introdução da seção continuam os de cima (`produtos.title` e `produtos.intro`).

*Nota: os textos novos dos 3 produtos reais usam só fatos que já estão nesta página (frases, destaques, descrições dos vídeos e dúvidas). Nada de cliente, quadra instalada ou resultado medido. Limites para caber no painel sem rolagem (spec §5.3): frase até ~110 caracteres; "Para quem é" até ~140; 3 a 4 benefícios de até ~70; passos com título de até ~30 e texto de até ~90.*

#### Replay para quadras (`replay`)

- **`nome`:** `produtos.replay.name` ("Replay para quadras"), por referência.
- **`frase` (nova):** Para quadras de aluguel: o jogador aperta um botão na beira da quadra e leva o lance no celular.
- **`painel.video`:** o vídeo do replay (`produtos.replay.video`), por referência.
- **`painel.paraQuem` ("Para quem é"):** Donos de quadras de aluguel que querem dar ao jogador mais um motivo para voltar.
- **`painel.beneficios`:**
  - Salva os últimos 30 segundos, na hora em que o jogador aperta.
  - O lance chega no celular, pronto para baixar e compartilhar.
  - Funciona em qualquer quadra: society, areia e futsal.
  - Usa o Wi-Fi da própria arena.
- **`painel.comoFunciona` ("Como funciona"):**
  1. **O jogador aperta o botão.** Saiu um lance bonito? Ele aperta o botão na beira da quadra.
  2. **O sistema salva o lance.** A câmera da quadra guarda os últimos 30 segundos e envia pelo Wi-Fi da arena.
  3. **O lance chega no celular.** O jogador baixa ou compartilha o lance, que fica disponível por 7 dias.
- **`arte.alt` (cartão):** A caixa do botão do replay no alambrado de uma quadra vazia à noite, com névoa dos refletores e o LED ciano aceso.
- **`painel.telas[].alt`:** Tela ilustrativa: a busca do lance. · Tela ilustrativa: a lista de lances do dia. · Tela ilustrativa: o lance aberto, com os botões de baixar e compartilhar.

*Nota: a frase do cartão da v2.2 (`produtos.replay.oneLiner`, 130 caracteres) passa do limite do catálogo. A nova mantém o mecanismo (o botão na beira da quadra) e o lance no celular; o "mais um motivo para voltar" vai para o "Para quem é". Os fatos vêm da frase da v2.2, da descrição do vídeo (30 segundos, society/areia/futsal, Baixar e Compartilhar, "Disponível por 7 dias") e da dúvida do Wi-Fi da arena. O link do site é `produtos.replay.siteUrl` (escondido enquanto for `null`).*

#### Rota de Vendas (`rota-de-vendas`)

- **`nome` e `frase`:** `name` e `summary` do projeto, por referência ("Para o vendedor externo e para a entrega: do pedido feito na loja do cliente até a porta.").
- **`painel.video`:** o vídeo do Rota de Vendas, por referência.
- **`painel.paraQuem`:** Empresas com vendedor externo e entrega própria que ainda controlam pedidos e rotas na planilha, no papel ou no WhatsApp.
- **`painel.beneficios`** (partem dos `highlights[].lead`):
  - Clientes na mão do vendedor, com botões para ligar e abrir no mapa.
  - Pedido com o número do sistema que você já usa.
  - Rota de entrega por cidade, com o roteiro em Word, PDF e Excel.
  - Funciona sem internet: tudo fica guardado no aparelho.
- **`painel.comoFunciona`:**
  1. **O vendedor acha o cliente.** Busca por nome, cidade ou CNPJ, no celular, mesmo sem sinal.
  2. **O pedido entra.** Com o número do sistema que a empresa já usa. Número repetido não passa.
  3. **A entrega sai na rota.** As paradas saem agrupadas por cidade, com a lista de carga de cada uma.
- **`arte.alt`:** Um celular com a rota do Rota de Vendas no suporte do painel de um carro parado, com a cidade desfocada no para-brisa.
- **`painel.telas[].alt`:** Tela ilustrativa: a lista de clientes, com a busca. · Tela ilustrativa: um pedido com o número do outro sistema. · Tela ilustrativa: a rota de entrega, com as paradas agrupadas por cidade.

#### Fleet Analytics BI (`fleet-analytics-bi`)

- **`nome`:** `name` do projeto, por referência.
- **`frase` (nova):** Para quem cuida de uma frota: do rastreador de cada veículo aos chamados de reboque, no mesmo lugar.
- **`painel.video`:** o vídeo do Fleet Analytics BI, por referência.
- **`painel.paraQuem`:** Empresas que cuidam de uma frota e querem rastreador, custos, abastecimentos, viagens e chamados de reboque num lugar só.
- **`painel.beneficios`:**
  - Cada veículo acompanhado em tempo real, a partir do rastreador.
  - Custos, abastecimentos e viagens no mesmo lugar.
  - Alerta de abastecimento com consumo fora do padrão.
  - Chamados de reboque com despacho, vistoria digital e faturamento.
- **`painel.comoFunciona`:**
  1. **O rastreador manda os dados.** Cada veículo envia a posição, e o mapa mostra a frota em tempo real.
  2. **Os números se juntam.** Trajetos, custos e abastecimentos de cada veículo aparecem na mesma tela.
  3. **O reboque também entra.** Do despacho à vistoria digital e ao faturamento, cada chamado fica registrado.
- **`arte.alt`:** O painel do Fleet Analytics BI num monitor de um escritório escuro, com o mapa da frota e a janela para a cidade.
- **`painel.telas[].alt`:** Tela ilustrativa: o mapa da frota em tempo real. · Tela ilustrativa: os custos e as viagens de um veículo. · Tela ilustrativa: a lista de chamados de reboque.

*Nota: o resumo da v2.2 (`summary`, 137 caracteres) passa do limite do catálogo; a frase nova é o mesmo resumo sem "com custos, abastecimentos e viagens", que vai para os benefícios. Os fatos vêm do resumo e da descrição do vídeo (tempo real, alertas de abastecimento, despacho, vistoria digital, faturamento). Nenhum número do vídeo entra no painel.*

#### Os 7 itens fictícios

**Fictício, troca quando houver produto real.** Estão no site para mostrar a escala do catálogo (decisão do Thiago, spec Q14/Q25/Q28), com o selo "Em desenvolvimento" e `ficticio: true` no código. Os textos completos (para quem é, benefícios, como funciona e telas) ficam só em `src/content/catalogo.ts`; não levam a marcação `[A PREENCHER]`, para o `check:placeholders` não falhar por eles.

| Slug | Tipo | Nome | Frase | Assunto do formulário |
|---|---|---|---|---|
| `placar-conectado` | Hardware | Placar conectado para quadras | Para quadras de aluguel: o placar do jogo numa tela na parede, marcado pelo celular. | Outro assunto |
| `agenda-de-quadras` | Aplicativo | Agenda de quadras | Para arenas: os horários das quadras num lugar só, com reserva pelo celular. | Aplicativo sob medida |
| `site-clinicas` | Site | Site para clínicas | Um site simples para a clínica: especialidades, endereço e um botão para marcar pelo WhatsApp. | Outro assunto |
| `totem-check-in` | Hardware | Totem de check-in para academias | Para academias: o aluno faz o check-in no totem da entrada, e a recepção vê quem chegou. | Outro assunto |
| `estoque-oficinas` | Aplicativo | Estoque para oficinas | Para oficinas: cada peça que entra e sai fica registrada, e o aviso de reposição chega antes de faltar. | Aplicativo sob medida |
| `vitrine-lojas` | Site | Vitrine para lojas de bairro | Para lojas de bairro: os produtos numa vitrine na internet, com pedido pelo WhatsApp. | Outro assunto |
| `contador-de-fluxo` | Hardware | Contador de fluxo para lojas | Para lojas: um sensor sobre a porta conta quem entra, hora a hora, e mostra no celular. | Outro assunto |

*Nota: "Quero saber mais" leva ao formulário com o assunto marcado: o replay em "Replay para quadras"; os aplicativos em "Aplicativo sob medida"; os sites e os outros hardwares em "Outro assunto" (spec §3.6). Um assunto próprio para sites pede mudança na validação do servidor e fica para depois.*

#### Textos de interface do catálogo (`catalogoUi`)

- **`rotuloCarrossel` (nome da região do carrossel):** Catálogo de produtos
- **`roledescCarrossel` / `roledescProduto` (o que o leitor de tela diz que é cada coisa):** carrossel / produto
- **`posicao` (nome de cada cartão e anúncio da troca):** {i} de {n}: {nome}
- **`verDetalhes` (botão do cartão do centro):** Ver detalhes
- **`saberMais` (botão do painel):** Quero saber mais
- **`fechar` (botão X do painel):** Fechar
- **`anterior` / `proximo` (setas ‹ ›):** Produto anterior / Próximo produto
- **`irPara` (bolinhas):** Ir para {nome}
- **`abas`:** Visão geral · Como funciona · Telas
- **`paraQuem` (rótulo na Visão geral):** Para quem é
- **`siteLink` (link do site, quando houver):** Ver o site
- **`telaAnterior` / `proximaTela` (setas das telas):** Tela anterior / Próxima tela
- **`filtros` (pílulas):** Todos · Hardware · Aplicativos · Sites
- **`tipos` (etiqueta do tipo no cartão):** Hardware · Aplicativo · Site

*Nota (22/10/2026): o rótulo do carrossel é "Catálogo de produtos" e não "Produtos", porque "Produtos" já nomeia a seção (`section#produtos`) e o rótulo de cada região da página tem de ser único para o leitor de tela. Cada cartão é um `<div role="group">` com o nome `posicao`.*

*Nota: `{i}`, `{n}` e `{nome}` o site preenche sozinho. Os selos de fase são os de sempre (`statusLabels`); os fictícios usam "Em desenvolvimento".*

---

## 4. Tem um problema que pede hardware?

**`chamadaHardware.title` (título, H2):** Tem um problema que pede hardware?

**`chamadaHardware.body` (texto):** Nem todo problema cabe no nosso catálogo. Se o seu precisa de câmera, sensor, botão ou outro equipamento ligado a um software, conte para a gente. Juntamos eletrônica e programação, e dizemos com franqueza se dá para resolver.

**`chamadaHardware.cta` (botão, leva ao formulário com o assunto "Outro assunto" marcado):** Contar o meu problema

*Nota: não muda. Vem logo depois dos 3 produtos ("nem todo problema cabe no nosso catálogo") e é a primeira seção clara depois da virada da noite para o papel (clímax 2 do fio).*

---

## 5. Como trabalhamos

**`comoTrabalhamos.title` (título, H2):** Como trabalhamos

**`comoTrabalhamos.intro` (texto):** Do primeiro contato ao suporte, você fala com a mesma equipe, sem intermediário.

**Itens (`comoTrabalhamos.items`, nesta ordem):**

- **`comoTrabalhamos.items[0].title`:** Diagnóstico
- **`comoTrabalhamos.items[0].description`:** Antes de falar de equipamento ou de aplicativo, entendemos a rotina e onde o problema aparece. Se a solução não compensar, dizemos isso. Nos aplicativos, o diagnóstico é gratuito e termina com um resumo por escrito do que vale a pena fazer.
- **`comoTrabalhamos.items[1].title`:** Protótipo
- **`comoTrabalhamos.items[1].description`:** Montamos uma primeira versão e testamos com você, em pequena escala, antes da instalação completa.
- **`comoTrabalhamos.items[2].title`:** Instalação
- **`comoTrabalhamos.items[2].description`:** Instalamos o equipamento ou colocamos o aplicativo para funcionar, e acompanhamos a sua equipe até tudo rodar no dia a dia.
- **`comoTrabalhamos.items[3].title`:** Suporte direto
- **`comoTrabalhamos.items[3].description`:** Quem instala é quem cuida depois. Você fala com a equipe pelo WhatsApp, sem central de atendimento, e a manutenção não depende de técnico de fora.

*Nota (v2.2): sai do Suporte direto a frase "Os aplicativos seguem com plano mensal de manutenção, suporte e hospedagem." [decidido 13/10, itens 9 e 10]*

*Nota (v2.2): entra no Diagnóstico a frase "Nos aplicativos, o diagnóstico é gratuito e termina com um resumo por escrito do que vale a pena fazer." Ela traz para cá o que a introdução de Aplicativos aprovada na v2.0 prometia ("uma conversa sobre a rotina da empresa, com um resumo por escrito do que vale a pena fazer"), que sai com a seção, e diz o que a pessoa recebe nesta etapa (Taller, PESQUISA §2.3). Nenhum prazo entra: nenhum foi confirmado. [proposta]*

*Nota (v2.2): sai a frase da v2.1 no Protótipo ("No replay, esta etapa é o piloto gratuito."): é detalhe do piloto, que vai para a página do replay. O Protótipo volta ao texto da v2.0.*

*Nota: o quarto item se chama "Suporte direto", e não "Suporte local", porque a região de atuação do replay ainda não foi definida; "local" prometeria alguém perto de qualquer cidade. Quando a região estiver definida, dá para trocar.*

---

## 6. Equipe

**`equipe.title` (título, H2):** Quem faz

**`equipe.intro` (texto):** Somos quatro estudantes de engenharia da computação, em João Pessoa. No WhatsApp e na instalação, você fala direto com quem monta o equipamento e escreve o código.

*Nota (v2.1, mantida): antes, "Somos quatro estudantes de engenharia da computação. Você fala direto com quem monta o equipamento e escreve o código." Entram a cidade (que já está no rodapé e nas dúvidas) e o "no WhatsApp e na instalação", que repete o que "Suporte direto" já promete. Nenhum fato novo. [proposta]*

*Nota (v2.2): se o Thiago escolher a opção C do hero ("Você fala direto com quem monta e programa."), esta introdução volta à da v2.0, sem a segunda frase, para não repetir o título do hero.*

**Cartões (iniciais + nome + curso, nesta ordem; `siteConfig.team`):**

- KB · Kauã Bruno · [A PREENCHER: curso]
- GF · Gustavo Fernandes · [A PREENCHER: curso]
- AM · Antonio Meira · [A PREENCHER: curso]
- TG · Thiago Guedes · [A PREENCHER: curso]

*Nota: o curso (e, se o grupo quiser, o período) de cada pessoa vai em `siteConfig.team[].course`, logo abaixo do nome. O texto aprovado já diz que os quatro são de engenharia da computação: se for isso mesmo, a pendência se resolve com o ok do Thiago, e só falta decidir se entra o período ou a instituição. Sem cargos. "Antonio" vai sem acento, como está nos dados oficiais. As iniciais são decorativas (o nome já está escrito ao lado).*

*Nota: **sem fotos por enquanto** (decisão do Thiago, 13/10): ficam as iniciais, e o MASTER §8.9 não muda. [decidido 13/10]*

---

## 7. Dúvidas frequentes

*Nota: a seção fica antes do Contato, que é a última seção antes do rodapé: a objeção é respondida antes do pedido. O acordeão abre sem rolar a página para o topo e com resposta curta (NN/g, "Accordions on Mobile", PESQUISA §3.4). [decidido 13/10]*

**`faq.title` (título, H2):** Dúvidas frequentes

**Perguntas (`faq.items`, nesta ordem):** as gerais primeiro (preço, cidade, formatura), depois a de aplicativos, as 3 do replay aprovadas na v2.0 e, por último, a dos dados do formulário, que leva direto ao Contato.

**`faq.items[0].question`:** Quanto custa?

**`faq.items[0].answer`:** Depende do produto. O preço do replay ainda está sendo definido, e nesta fase oferecemos um piloto gratuito. Nos aplicativos, depois do diagnóstico gratuito você recebe uma proposta com o que será feito, o prazo e o preço, antes de qualquer compromisso.

**`faq.items[1].question`:** Vocês atendem a minha cidade?

**`faq.items[1].answer`:** Nos aplicativos, sim: em João Pessoa e região, atendemos presencialmente; no resto do Brasil, por videochamada e pelo WhatsApp. O replay precisa de instalação na quadra, e a região onde vamos começar ainda está sendo definida. Conte a sua cidade na conversa.

**`faq.items[2].question`:** E quando vocês se formarem, quem mantém tudo funcionando?

**`faq.items[2].answer`:** Quem mantém é a Strukti: uma equipe, e não uma pessoa só. Quem instala o equipamento ou entrega o aplicativo é quem cuida dele depois, hoje e depois da formatura. E cada projeto tem documentação, para não depender da memória de ninguém.

*Nota (v2.2): antes (v2.0), "Quem mantém é a Strukti: uma equipe, e não uma pessoa só. No replay, quem instala, dá suporte e faz a manutenção somos nós. Os aplicativos têm plano mensal de manutenção, suporte e hospedagem, que garante alguém cuidando deles hoje e depois da formatura. E cada projeto tem documentação, para não depender da memória de ninguém." Sai o plano mensal [decidido 13/10, item 9]. A resposta continua de frente para a objeção, com o que vale para os dois tipos de produto: é uma equipe; quem instala é quem cuida depois (o mesmo que "Suporte direto"); e a documentação. [proposta]*

*Nota: "hoje e depois da formatura" é o compromisso que a v2.0 já fazia, agora sem o plano mensal como garantia. Se o grupo não quiser assumir isso por escrito, sai o trecho ", hoje e depois da formatura", e a resposta fica só com a equipe e a documentação (pendência 6).*

**`faq.items[3].question`:** O aplicativo se liga ao sistema que eu já uso?

**`faq.items[3].answer`:** Sim, quando o sistema permite. Quando não permite, o aplicativo gera os arquivos no formato da empresa, como Excel, PDF ou Word. Nos dois casos, ele segue o jeito que a sua empresa já trabalha, e tudo começa com o diagnóstico gratuito.

*Nota (v2.2): antes (v2.0), a pergunta era "Vocês também fazem aplicativos?", e a resposta, "Fazemos. O aplicativo segue o jeito que a sua empresa já trabalha e se liga ao sistema que você já usa. Quando o sistema não permite, o aplicativo gera os arquivos no formato da empresa, como Excel, PDF ou Word. Tudo começa com o diagnóstico gratuito." Com os aplicativos lado a lado com o replay, o "também" não faz mais sentido, e a própria seção Produtos já responde que fazemos. A pergunta passa a ser a objeção real da empresa, que é a diferença da Strukti contra os sistemas prontos: ligar ao que ela já usa. A resposta tem os mesmos fatos, e admite o limite logo de início (Farrell, NN/g, 2014, PESQUISA §3.4). Sem o ok, volta o texto da v2.0. [proposta]*

**`faq.items[4].question`:** O replay precisa de internet?

**`faq.items[4].answer`:** Precisa. O equipamento da quadra usa o Wi-Fi da própria arena para enviar os clipes. Os jogadores veem os lances no celular, com a internet deles. Se a internet da sua arena for uma dúvida, falamos disso na conversa.

*Nota (v2.2): antes (v2.0), o fim era "falamos disso na demonstração". A página não oferece mais demonstração (o botão do replay é o do piloto), então a resposta não pode mandar para ela. Sai a frase da v2.1 sobre o Wi-Fi caído, que dependia de um dado e vai para a página do replay. [proposta]*

**`faq.items[5].question`:** O replay já usa inteligência artificial?

**`faq.items[5].answer`:** Ainda não. Hoje o clipe é cortado quando o jogador aperta o botão. Cortes automáticos e destaque por jogador, com inteligência artificial, vêm em breve.

**`faq.items[6].question`:** E a privacidade de quem aparece no vídeo?

**`faq.items[6].answer`:** O replay está sendo construído assim: os clipes vão ficar disponíveis para os jogadores por 7 dias e depois serão apagados, e a quadra vai exibir um aviso de que há gravação.

**`faq.items[7].question`:** O que acontece com os dados que eu mando pelo formulário?

**`faq.items[7].answer`:** Usamos só para responder à sua mensagem. Os detalhes estão no aviso de privacidade.

**`faq.items[7].answerLinkLabel` (trecho da resposta que vira link para `/privacidade`):** aviso de privacidade

**`faq.closing` (fecho):** Ficou alguma dúvida? Pergunte direto para a gente.

**`faq.button` (botão, WhatsApp com a mensagem geral):** Chamar no WhatsApp

*Nota (v2.2): são as 8 perguntas da v2.0, em ordem nova. Na v2.0, a ordem era: internet, IA, privacidade, custo, cidade, formatura, aplicativos, dados. Saem as 3 perguntas novas da v2.1, do piloto ("O que a minha quadra precisa ter?", "Quanto tempo leva a instalação? A quadra fica parada?" e "O que acontece no fim do piloto?") [decidido 13/10, item 9]. As respostas de custo, cidade, IA, privacidade e dados são as da v2.0, sem mudança.*

*Nota: os 7 dias e o aviso de gravação na quadra vêm do `contexto-replay.md` (regras de LGPD do replay). Os detalhes sobre os clipes ficam para a página do replay; aqui só a resposta curta, porque o dono de quadra pergunta.*

---

## 8. Contato

*Nota: o Contato é a última seção antes do rodapé, e o clímax final do fio fecha a página (spec do fio). [decidido 13/10]*

**`contato.title` (título, H2):** Fale com a gente

**`contato.intro` (texto):** Quer o piloto do replay na sua quadra, o diagnóstico de um aplicativo ou contar outro problema? Escolha o assunto e escreva em poucas palavras.

*Nota (v2.1, mantida): antes, "Quer agendar uma demonstração do replay, pedir o diagnóstico de um aplicativo ou contar outro problema? Escolha o assunto e escreva em poucas palavras." A oferta do replay é o piloto. [proposta]*

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

Assunto (`contato.form.fields.interest`, lista de opções)
- **`label`:** Sobre o que você quer falar?
- **`placeholder` (primeira linha da lista, sem valor):** Escolha um assunto
- **`errorEmpty`:** Escolha um assunto.
- **`options.replay`:** Replay para quadras
- **`options.aplicativo`:** Aplicativo sob medida
- **`options.outro`:** Outro assunto

*Nota: sai `options.estacionamento` ("Estacionamento inteligente"), por causa da D6. A lista de assuntos, a validação e o valor antigo já gravado no banco são do Alicerce.*

Mensagem (`contato.form.fields.problem`; a chave continua `problem`, o texto fala de "mensagem")
- **`label`:** Sua mensagem
- **`help`:** Conte com as suas palavras. Se for o replay, ajuda saber a cidade e quantas quadras você tem. Não precisa colocar dados dos seus clientes.
- **`errorEmpty`:** Conte em poucas palavras o que você precisa.
- **`errorTooLong`:** Use no máximo {max} caracteres.

*Nota: a mensagem **continua obrigatória** até o Thiago decidir se ela vira opcional (decisão de 13/10, item 5). Se virar, o rótulo passa a "Sua mensagem (opcional)", o `requiredNotice` muda e a validação muda com o Alicerce.*

*Nota: o assunto vem já marcado quando a pessoa chega por "Pedir diagnóstico gratuito", em qualquer um dos dois cartões de aplicativo (Aplicativo sob medida), ou por "Contar o meu problema" (Outro assunto). Quem chega pelo botão do replay vai direto ao WhatsApp, e a mensagem pronta já pede a cidade e o número de quadras.*

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

*Nota: o prefixo termina com um espaço ("Prefere falar agora? "), como na v1.8. O link usa a mensagem geral.*

**Resumo de erros (topo do formulário, ao tentar enviar):**

- **`contato.form.errorSummarySingle`:** Confira 1 campo antes de enviar.
- **`contato.form.errorSummaryMultiple`:** Confira {n} campos antes de enviar.

**Sucesso:**

- **`contato.form.success.title`:** Mensagem recebida!
- **`contato.form.success.text`:** Obrigado, {nome}. Respondemos no mesmo dia pelo WhatsApp informado. Se a mensagem chegou fora do horário comercial, respondemos no próximo dia útil.
- **`contato.form.success.text2`:** Se quiser adiantar a conversa, chame a gente agora.
- **`contato.form.success.button` (WhatsApp com a mensagem geral):** Chamar no WhatsApp

*Nota: "Respondemos no mesmo dia" é uma promessa. Só fica se a equipe conseguir cumprir; o Thiago confirma (pendência 4).*

**`contato.form.submitError` (falha no envio):** Não foi possível enviar agora. Tente de novo em alguns minutos ou fale com a gente pelo WhatsApp.

**`contato.form.rateLimitError` (muitas tentativas seguidas):** Foram muitas tentativas seguidas. Espere alguns minutos e tente de novo, ou fale com a gente pelo WhatsApp.

**`contato.form.honeypotLabel` (campo antispam escondido):** Não preencha este campo

*Nota: no formulário, só a lista de assuntos muda em relação à v2.0 (sai o estacionamento).*

---

## 9. Rodapé

**Marca:** Strukti Soluções

**`rodape.tagline` (linha):** Produtos de hardware e aplicativos sob medida.

**Contato:**
- **`rodape.whatsappLabel`:** WhatsApp:
- **`rodape.emailLabel`:** E-mail:
- **`rodape.location`:** João Pessoa/PB

*Nota: depois de "WhatsApp:" vem o link [+55 83 99968-3670](https://wa.me/5583999683670?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Strukti%20Solu%C3%A7%C3%B5es%20e%20quero%20conversar%20com%20voc%C3%AAs.) (mensagem geral); depois de "E-mail:", o link [struktisolutions@gmail.com](mailto:struktisolutions@gmail.com).*

**`rodape.privacyLinkLabel` (link):** Aviso de privacidade

**Direitos:** © 2026 Strukti Soluções

*Nota: o rodapé não muda (v2.0). A linha de local não fala de atendimento a distância: isso vale para os aplicativos, não para o replay, cuja região ainda não está definida. A resposta completa fica na dúvida "Vocês atendem a minha cidade?". O ano do © acompanha o ano atual. Quando a Strukti tiver CNPJ, ele entra aqui, ao lado da cidade, como sinal de empresa real (pendência 10).*

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

*Nota: o aviso não muda. Sair a opção "Estacionamento inteligente" do assunto não muda os dados coletados (o assunto continua sendo coletado), então a versão continua a mesma.*

*Nota: a frase sobre cookies só pode ir ao ar se continuar verdadeira. O símbolo do hero e os vídeos são servidos pelo próprio site e não mudam isso. Se um dia entrar analytics ou outro script de terceiros, este aviso precisa mudar antes.*

*Nota: este aviso cobre só o formulário do site da Strukti. As imagens dos jogadores gravadas pelo replay (clipes, 7 dias, aviso na quadra) ficam para a política da página do replay.*

**Versão do aviso (`siteConfig.privacyPolicyVersion`):** 2026-10-03

*Nota: a data exibida no topo do aviso vem desse mesmo valor.*

---

## Página não encontrada (404)

- **`notFound.title`:** Página não encontrada
- **`notFound.homeLink`:** Voltar para o início

*Nota: não muda (v1.8, aprovação do Claudinho em 03/10/2026). Microcopy de interface, não é texto de venda. O botão de WhatsApp da página usa a mensagem geral. Nada além desses dois textos.*

---

## SEO e compartilhamento

**`seo.title` (`<title>`, 56 caracteres):** Replay para quadras e apps sob medida | Strukti Soluções

**`seo.description` (`meta description`, 145 caracteres):** Replay para quadras de aluguel, em piloto gratuito: o jogador aperta um botão e recebe o lance no celular. Também fazemos aplicativos sob medida.

**Link de compartilhamento (Open Graph):**
- **`seo.ogSiteName` (`og:site_name`):** Strukti Soluções
- **`seo.ogTitle` (`og:title`):** Strukti Soluções: replay para quadras e aplicativos sob medida
- **`seo.ogDescription` (`og:description`):** O jogador aperta o botão e o lance chega no celular. Replay para quadras de aluguel, em piloto gratuito, e aplicativos sob medida para empresas.
- **`seo.ogUrl` (`og:url`):** [A PREENCHER: endereço do site]
- **`seo.ogImageAlt` (`og:image:alt`):** Strukti Soluções: replay para quadras e aplicativos sob medida

**Imagem de compartilhamento (`opengraph-image`):** a da v1.8 (só a marca), sem mudança.

*Nota (v2.2): tudo volta ao texto aprovado na v2.0. Sai a proposta da v2.1 (título "Strukti Soluções: o lance do jogo no celular do jogador", descrição só do replay e imagem nova com um quadro do vídeo), que fazia sentido com o hero do replay e deixa de fazer com o hero de marca: a prévia do link deve dizer o mesmo que a primeira tela. O título e o alternativo do Open Graph já falam dos dois tipos de produto.*

**Mensagem para a equipe enviar o site pelo WhatsApp:**
Oi! Somos a Strukti Soluções, quatro estudantes de engenharia da computação. Estamos começando com um replay para quadras de aluguel: o jogador aperta um botão na beira da quadra e recebe o lance no celular. Procuramos quadras para um piloto gratuito. Também fazemos aplicativos sob medida para empresas. Dá uma olhada: [A PREENCHER: endereço do site]

*Nota (v2.2): esta mensagem não vai para o site; é para a equipe colar no WhatsApp. Com a âncora de cada produto, dá para mandar o endereço já aberto no cartão certo: `/#replay` para quadras, `/#rota-de-vendas` para distribuidoras e indústrias com vendedor externo, `/#fleet-analytics-bi` para quem tem frota. A âncora `/#aplicativos`, citada na v2.0, deixa de existir.*

---

## Textos alternativos das imagens

| Imagem | Onde | Texto alternativo |
|---|---|---|
| Símbolo da marca montado peça a peça (fio, capítulo 1) | Hero | Decorativo: `aria-hidden`, sem texto alternativo. |
| Pôster do vídeo do replay (`replay.jpg`) | Produtos, cartão do replay | Vazio. O botão em volta já tem o nome "Assistir ao vídeo: Replay para quadras (52 s)", e o selo "Ilustração do conceito" é texto visível ao lado. |
| Capas dos vídeos (`brag.jpg`, `fleet-analytics-bi.jpg`) | Produtos, cartões dos aplicativos | Vazio. O botão em volta já tem o nome "Assistir ao vídeo: {nome} ({duração})". |
| Iniciais da equipe | Equipe | Decorativas: texto alternativo vazio. |
| Imagem de compartilhamento (v1.8) | Prévia do link | `seo.ogImageAlt` (acima). |

*Nota (v2.2): saem as linhas do pôster e dos quadros do 3D (o 3D sai do site) e a das fotos da equipe (sem fotos). A imagem de compartilhamento continua a da v1.8.*

*Nota: as capturas do Rota de Vendas listadas na v1.8 (pastas `q4` e `q5`) continuam fora do site (decisão do cliente, 30/09).*

---

## Pendências [A PREENCHER]

Bloqueiam a publicação do site:

1. Aviso de privacidade: provedores de hospedagem e de banco de dados, e se guardam dados fora do Brasil.
2. Endereço do site (`seo.ogUrl` e mensagem da equipe).
3. Curso de cada pessoa da equipe (`siteConfig.team[].course`, ainda pendente nas 4 pessoas). O texto aprovado já diz "engenharia da computação" para os quatro; se for isso, basta o ok do Thiago.

Confirmações que mudam um texto (sem elas, fica o texto como está acima, menos o item 6):

4. "Respondemos no mesmo dia" (tela de sucesso) continua valendo?
5. Origem do `replay.mp4` (animação feita pelo grupo, projeto strukti-video), para o Vitral registrar.
6. Dúvida da formatura: o grupo assume por escrito o "hoje e depois da formatura"? Sem o ok, o trecho sai.

O Thiago decide:

7. O hero: opção A, B ou C (vendo na prévia). Recomendada: B.
8. A mensagem do formulário vira opcional? Até a decisão, continua obrigatória.

Não bloqueiam a publicação:

9. Páginas próprias dos produtos. Enquanto não existirem, os links da barra do topo rolam até os cartões e o link "Ver o site" do painel do replay fica escondido.
10. CNPJ no rodapé, quando houver.

*Nota (v2.2): saem da landing, e passam para a futura página do replay, as pendências 4 a 9 da v2.1: as condições do piloto, o que acontece com os lances se o Wi-Fi cair, o tempo de instalação, a imagem de compartilhamento nova, o nome da quadra no clipe e o resumo por escrito do diagnóstico no replay. Dos dados pedidos ao Thiago na PROPOSTA.md §4, a landing agora só precisa dos itens acima.*
