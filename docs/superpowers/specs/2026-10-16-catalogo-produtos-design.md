# Catálogo de produtos ("segundo ato") — spec

**Data:** 16/10/2026 · **Situação:** aprovada na conversa (entrevista Q1–Q41); implementada no branch `feat/catalogo-produtos` (decisões de 22/10 anotadas nas seções 4, 3.5 e 8).
**Branch:** `feat/catalogo-produtos`, criado a partir de `main`. O PR #8 já entrou; o PR deste trabalho aponta para `homologacao`.
**Referência de formato:** um "3D coverflow carousel" do 21st.dev mostrado pelo dono. É só referência visual: o componente não declara licença, então nenhum código dele entra (ADR-005), e três comportamentos dele ficam de fora de propósito: girar sozinho, capturar as setas do teclado na página inteira e carregar imagens de CDN externa (CSP, ADR-008).

---

## 1. Objetivo

Trocar a parede de cartões abertos de Produtos (v2.2: 3 cartões com vídeo, selo, frase, etiquetas, legenda, descrição e botão, tudo à mostra) por um **catálogo** que:

- liste muitos produtos sem deixar a rolagem longa (hoje são 3; logo serão vários);
- mostre o detalhe de **um** produto por vez, só depois do clique;
- tenha movimento chamativo e fluido, na linguagem do hero "expansao" (vertical que vira horizontal);
- nunca prenda a rolagem (a única rolagem presa da página continua sendo a do hero, ADR-010).

## 2. Decisões (da entrevista)

| # | Decisão |
|---|---|
| Q1 | 3 produtos reais hoje, vários no futuro. O catálogo nasce com itens inventados para mostrar a escala. |
| Q2/Q8 | Cartões verticais; clicar num deles o transforma num **painel horizontal grande**, e os demais encolhem numa **fita de miniaturas** embaixo, com navegação entre eles. |
| Q3 | Rolagem livre; nada de rolagem presa nesta seção. |
| Q4/Q29 | Arte nova só no cartão fechado; no painel entram os vídeos de demonstração atuais. Arte final já para os 3 reais; os inventados com arte mais simples. |
| Q5 | Painel com: vídeo, para quem é, benefícios, como funciona, telas, fase e link do site. **Sem WhatsApp.** |
| Q6 | Link direto `#produto` abre o painel daquele produto; o voltar do navegador fecha. |
| Q7 | PR empilhado no `feat/hero-expansao`. *Superada (22/10): o PR #8 entrou antes, e o PR deste trabalho aponta para `homologacao` (cabeçalho e §13, passo 5).* |
| Q9 | Só o clique abre (Enter e espaço também). Passar o mouse é só uma dica (leve destaque). |
| Q11/Q27 | No celular, o mesmo gesto: cartões deslizando para o lado; tocar abre o painel na largura toda, com a fita embaixo. |
| Q13 | Começa com todos os cartões fechados. |
| Q14/Q25/Q28 | 7 itens inventados vão para o site, inclusive para produção, com selo "Em desenvolvimento" e marca `ficticio: true` nos dados, para achar e trocar depois. |
| Q15 | A arte é uma série coerente no mundo do hero (hora azul, mesma luz e paleta). |
| Q16 | O painel chama para "Quero saber mais", que leva ao Contato com o interesse já marcado, e mostra o link do site quando houver. |
| Q17 | Os cartões entram em sequência quando a seção aparece; com movimento reduzido, tudo aparece pronto. |
| Q18 | Com muitos itens, a fileira desliza para o lado; ela não quebra em linhas. |
| Q19 | Filtro por tipo: Todos · Hardware · Aplicativos · Sites. |
| Q20 | O painel tem abas (Visão geral · Como funciona · Telas), altura fixa e nada de rolagem interna (exceção na §4). |
| Q21 | **A seção tem altura constante**, fechada ou aberta. Nada abaixo se mexe. |
| Q22 | Navegar com o painel aberto: miniaturas, setas ‹ ›, ← → do teclado e deslizar o dedo. O último leva ao primeiro. Trocar de produto não cria entradas no histórico. |
| Q23 | Fechar: X, Esc ou o voltar do navegador, com a animação inversa. |
| Q24 | A fita mostra todos os itens filtrados, com o ativo destacado; se não couberem, desliza e mantém o ativo no centro. |
| Q30 | Telas: inventadas para todos por enquanto. O dono manda as capturas reais depois. |
| Q31 | Barra do topo: "Produtos ▾", com um menu agrupado por tipo; cada item abre o painel do produto. |
| Q32 | Textos novos dos 3 reais entram como proposta aguardando aprovação; os dos inventados ficam marcados como fictícios. |
| Q33/Q41 | O loop da arte toca **uma vez, por 5 s**, quando o cartão chega ao centro ou recebe o mouse ou o foco, e para no quadro inicial. Nunca com movimento reduzido. |
| Q34 | A arte dos reais sai de um conceito por produto, com crítica de diretor de arte e uma rodada de ajuste, sem júri. |
| Q35 | Construção em equipe de agentes, no máximo 2 ao mesmo tempo, por causa da RAM. |
| Q36 | O estado fechado é um **coverflow**: cartão do centro grande e de frente, 2 de cada lado girados, menores e escurecidos. |
| Q37 | **Não gira sozinho.** |
| Q38 | O cartão do centro mostra etiqueta do tipo, selo de fase, nome, frase e "Ver detalhes". Os laterais mostram a arte e o nome pequeno. |
| Q39 | O fundo da seção é a arte do cartão do centro, desfocada e bem escurecida sobre o azul-marinho. A troca é suave. |
| Q40 | Os cartões são 2:3. |

## 3. Estados e fluxo

```
            clique/Enter no cartão do centro (ou "Ver detalhes")
  FECHADO ─────────────────────────────────────────────────────▶ ABERTO
 (coverflow)  ◀───────────────────────────────────────────────  (painel + fita)
               X · Esc · voltar do navegador (animação inversa)

  FECHADO: ‹ › · bolinhas · clique num lateral · ← → (foco no carrossel) · dedo  → troca o centro
  ABERTO:  miniatura · ‹ › · ← → (foco fora das abas) · dedo no painel          → troca o produto
  Ambos:   filtro por tipo
```

### 3.1 Fechado (coverflow)

- **Geometria no computador:** cartão do centro 2:3, com altura de cerca de 86% do palco.
  - ±1: deslocados ~0,86 largura de cartão, escala 0,84, `rotateY ∓24°`, opacidade 0,65, brilho 0,75.
  - ±2: deslocados ~1,55 largura, escala 0,68, `rotateY ∓38°`, opacidade 0,38, brilho 0,55 com desfoque de 1 px.
  - Do ±3 em diante: escondidos (`inert`, `aria-hidden`).
  - Perspectiva de ~1400 px.
- **Celular:** o cartão do centro com ~70% da largura; os ±1 aparecem pelas pontas; o ±2 fica escondido.
- **Circular:** o carrossel dá a volta. Poucos itens são tratados sem duplicar cartão. Com 1 item: só o centro, sem setas. Com 2: centro e um lateral. Com 3: centro e ±1.
- **Clique num lateral:** ele vem para o centro. O clique no centro, ou em "Ver detalhes", abre o painel.
- **Conteúdo dos cartões** (Q38): o texto do centro sobe suavemente ao chegar ao centro, sobre um degradê escuro na metade de baixo.
- **Controles:**
  - setas ‹ › nas laterais do palco;
  - bolinhas de paginação embaixo, com a ativa alongada;
  - filtro por tipo acima;
  - um contador para leitor de tela ("3 de 10"), anunciado com `aria-live="polite"` a cada troca.
- **Fundo ambiente** (Q39): a arte do centro em versão pequena, ampliada e desfocada, com uma camada navy forte por cima. Troca em crossfade. Nada de desfoque grande calculado ao vivo em tela cheia: usar a imagem de 480 px já pequena.

### 3.2 Aberto (painel + fita)

- O cartão do centro **se transforma** no painel horizontal: o elemento compartilhado anima de posição e tamanho. Ao mesmo tempo:
  - os outros cartões encolhem e descem para virar a **fita de miniaturas**, em cascata de ~40 ms;
  - o conteúdo do painel entra depois que ele termina de crescer.
- **Painel:**
  - **cabeçalho:** nome (h3), etiqueta do tipo, selo de fase, link do site (se houver) e o botão fechar (X);
  - **abas:** Visão geral · Como funciona · Telas.
- **Visão geral:**
  - à esquerda, o vídeo de demonstração 16:9 com o padrão atual de "Assistir" e duração, sem tocar sozinho; nos inventados, a arte do cartão em tamanho grande;
  - à direita, "Para quem é", 3–4 benefícios e o botão "Quero saber mais".
- **Como funciona:** 3 passos numerados.
- **Telas:** 3 telas ilustrativas, com moldura de celular ou de navegador conforme o tipo, e setas para passar entre elas.
- **Fita:** mini-cartões de ~64×86 px com a arte e o nome curto. O ativo aparece com contorno elétrico e `aria-current="true"`. A fita desliza para manter o ativo centralizado.
- **Trocar de produto:** o conteúdo do painel troca com um deslize ou crossfade curto (~350 ms) na direção da navegação, e a fita acompanha.

### 3.3 Filtro por tipo

- Pílulas com `aria-pressed`, acima do palco, visíveis nos dois estados. Elas valem para o coverflow, as bolinhas e a fita.
- Se o filtro mudar com o painel aberto e o produto aberto sair do filtro, abre o primeiro item do novo filtro.
- Um link direto para um produto fora do filtro atual volta o filtro para "Todos".

### 3.4 Link direto e histórico

- Cada cartão tem `id` igual ao slug (`#replay`, `#rota-de-vendas`, `#fleet-analytics-bi`, ...). Assim a regra do hero "âncora fora do hero = começa expandido" continua valendo.
- **Abrir por clique:** cria uma entrada no histórico (`#slug`).
- **Trocar com o painel aberto:** substitui a entrada atual (`#outro-slug`).
- **Fechar por X ou Esc:** se a abertura criou entrada, faz `history.back()`. Se não criou (a pessoa chegou pelo link direto), remove a âncora sem criar entrada.
- **Voltar do navegador:** fecha o painel.
- **Carregar `/#slug`:** rola até a seção (o topo da seção, não o cartão), abre o painel desse produto e ajusta o filtro.
- O `hashchange` vindo de fora, como o menu da barra, também abre o produto.

### 3.5 Barra do topo: "Produtos ▾"

- **Desktop:** os links de produto da v2.2 (Replay · Rota de Vendas · Fleet Analytics BI) dão lugar a **um** botão de divulgação "Produtos ▾" (`aria-expanded`, `aria-controls`; padrão disclosure, não `role=menu`). O menu tem grupos por tipo (Hardware · Aplicativos · Sites), com links `#slug`.
  - Fecha com Esc, com clique fora ou ao escolher um item.
  - O botão recebe `aria-current` quando o catálogo está na faixa da barra, como hoje.
- **Celular:** no painel do Menu, "Produtos" vira uma sublista expansível com os mesmos grupos.
- **Sem JS (decisão de 22/10, Task 8b):** na barra larga, "Produtos" é um link para `#produtos` (o botão de divulgação precisa de JS para abrir). Com JS, vira o botão "Produtos ▾".
- A cápsula ao rolar e o resto da barra ficam como estão.

### 3.6 "Quero saber mais"

- Usa o `InterestLink`: é um `#contato` comum (sem JS, só rola) que no clique dispara `selectInterest`.
- Mapeamento para os interesses atuais (`src/lib/interest.ts`):
  - replay → `replay`;
  - aplicativos → `aplicativo`;
  - sites e outros hardwares → `outro`.
- Um interesse próprio para sites pede mudança na validação do servidor e fica fora deste trabalho (§12).

## 4. Altura constante

- A seção (título, filtro, palco e bolinhas, ou título, filtro, painel e fita) ocupa **`clamp(600px, 80svh, 860px)`** nos dois estados. Ao abrir, fechar ou trocar, nada abaixo se mexe. O `check:browser` mede o topo da seção seguinte antes e depois.
- O painel ocupa a altura que sobra, descontados a fita (~110 px) e os espaçamentos. A Visão geral precisa caber nessa altura sem rolagem: daí os limites de texto da §5.3.
- **Exceção de acessibilidade:** em telas muito baixas (paisagem de celular, zoom de 200–400%, espaçamento de texto 1.4.12), a acessibilidade vence a constância. A seção pode crescer, ou o painel ganha rolagem interna, para todo o conteúdo continuar alcançável (WCAG 1.4.10 e 1.4.12). Documentar na MASTER.
- **Celular e telas baixas (decisão de 22/10, na Task 6; aguarda o dono):** abaixo de 768 px de largura, o vídeo e o texto da Visão geral empilham e não cabem na altura da seção (a 390×844, ~755 px de conteúdo para ~420 px de painel), mesmo com os limites da §5.3. O mesmo vale para alturas de tela abaixo de ~800 px (a 1366×768, só o texto já passa ~20 px). Nesses casos, a seção mantém a altura e o painel rola por dentro (a fita e o que vem abaixo não se mexem). Encolher o vídeo ou recolher texto no celular foi descartado: o vídeo ficaria pequeno demais para ver e o texto recolhido esconderia o "Quero saber mais". A partir de 1280×800, a Visão geral cabe sem rolar: a mídia tem um teto de altura que acompanha a altura da seção.

## 5. Conteúdo

### 5.1 Modelo de dados (novo `src/content/catalogo.ts`)

```ts
type TipoProduto = "hardware" | "aplicativo" | "site";

interface ItemCatalogo {
  slug: string;                 // também o id do cartão e a âncora
  tipo: TipoProduto;
  nome: string;
  frase: string;                // uma frase, no cartão do centro
  fase: ProductStatus;          // rótulo em landingContent.statusLabels
  ficticio?: true;              // item inventado (Q28): procurar por isto para trocar
  arte: {
    base: string;               // "/catalogo/<slug>/cartao" (+ .avif/.jpg, -480)
    alt: string;
    loop?: { webm: string; mp4: string };   // só quem tem loop (os 3 reais)
  };
  painel: {
    video?: Project["video"];   // os 3 reais reaproveitam os vídeos atuais
    paraQuem: string;
    beneficios: readonly string[];          // 3 a 4
    comoFunciona: readonly [Passo, Passo, Passo];
    telas: readonly { src: string; alt: string; moldura: "celular" | "navegador" }[];
  };
  siteUrl?: string | null;
  interesse: Interest;
}
interface Passo { titulo: string; texto: string }
```

Os textos que já existem para os 3 reais (nome, frase, vídeo, destaques do Rota de Vendas) entram por referência a `landingContent`, sem duplicar. A seção usa os rótulos de `landingContent.statusLabels` (`desenvolvimento` = "Em desenvolvimento").

### 5.2 Os 10 itens

| Slug | Tipo | Nome | Fase | Origem |
|---|---|---|---|---|
| `replay` | hardware | Replay para quadras | piloto | real |
| `rota-de-vendas` | aplicativo | Rota de Vendas | piloto | real |
| `fleet-analytics-bi` | aplicativo | Fleet Analytics BI | emUso ("Em uso") | real |
| `placar-conectado` | hardware | Placar conectado para quadras | desenvolvimento | inventado |
| `totem-check-in` | hardware | Totem de check-in para academias | desenvolvimento | inventado |
| `contador-de-fluxo` | hardware | Contador de fluxo para lojas | desenvolvimento | inventado |
| `agenda-de-quadras` | aplicativo | Agenda de quadras | desenvolvimento | inventado |
| `estoque-oficinas` | aplicativo | Estoque para oficinas | desenvolvimento | inventado |
| `site-clinicas` | site | Site para clínicas | desenvolvimento | inventado |
| `vitrine-lojas` | site | Vitrine para lojas de bairro | desenvolvimento | inventado |

**Ordem:** os 3 reais primeiro, depois os inventados, alternando os tipos.

### 5.3 Textos

- **Reais:** "Para quem é", benefícios e "Como funciona" são textos novos, no tom da v2.2. Entram como **proposta aguardando aprovação** numa subseção nova de `docs/landing-copy.md`. Os benefícios do Rota de Vendas partem dos `highlights` que já existem.
- **Inventados:** todos os textos são inventados e ficam marcados `ficticio: true` no código.
- **Limites, para caber sem rolagem:**
  - frase: até ~110 caracteres;
  - para quem é: até ~140;
  - benefícios: 3–4, com até ~70 cada;
  - passos: título de até ~30 e texto de até ~90.
- **Título e introdução da seção:** ficam os da v2.2 ("Produtos" e a introdução atual). Se pedirem ajuste, entra como proposta.

### 5.4 Telas

3 por item, **ilustrativas**: blocos, barras e ícones na paleta, sem texto que imite letras (sem "texto falso"). Moldura de celular para apps e para os apps de apoio dos hardwares; moldura de navegador para sites. Marcadas como ilustrativas no `alt` até o dono mandar as capturas reais, que substituem os arquivos com os mesmos nomes.

## 6. Arte e mídia

### 6.1 Contrato de arquivos (`public/catalogo/<slug>/`)

| Arquivo | Formato | Orçamento | Quem tem |
|---|---|---|---|
| `cartao.avif` / `cartao.jpg` | 800×1200 (2:3) | ≤120 KB / ≤200 KB | todos |
| `cartao-480.avif` / `cartao-480.jpg` | 480×720 | ≤45 KB / ≤70 KB | todos (miniaturas, celular, fundo ambiente) |
| `cartao-loop.webm` / `cartao-loop.mp4` | 600×900, 25 fps, **5 s** | ≤600 KB cada | os 3 reais |
| `tela-1.svg` … `tela-3.svg` | moldura celular 360×720 ou navegador 960×600 | pequeno | todos |

A **arte final** dos cartões (as cenas da §6.2 e os 3 loops) entrou em 22/10/2026 no lugar dos degradês provisórios, com os mesmos nomes, e o `LEIA-PROVISORIO.txt` saiu. As fontes ficam em `scripts/catalogo-arte/`. As `tela-N.svg` continuam ilustrativas (§5.4) até chegarem as capturas reais, que também só trocam os arquivos.

### 6.2 Direção (série no mundo do hero)

- **Hora azul e paleta da marca:** navy, com elétrico e ciano só nos detalhes da Strukti. Mesma luz, grão e tratamento do "Fim de expediente". Sem natureza nem paisagem, sem texto na imagem e sem logo de terceiro.
- **Cenas dos reais:**
  - **Replay:** a caixa do botão no alambrado de uma quadra vazia à noite, com névoa leve dos refletores e o LED ciano. Dá para partir do conceito "Quadra em repouso" já renderizado na produção do hero.
  - **Rota de Vendas:** o celular com a rota, a mesma interface da tela do celular do hero (rota em ângulos retos, paradas, cartão de concluído), no suporte do painel de um carro parado, com a cidade desfocada no para-brisa.
  - **Fleet Analytics BI:** o painel de BI num monitor de um escritório escuro (mapa com a frota, curva de velocidade, barras de indicadores, sem texto), com a janela para a cidade.
- **Inventados:** uma cena-modelo mais simples e parametrizada, com o mesmo ambiente e uma silhueta do objeto de cada item (placar, totem, sensor sobre a porta, celular com agenda, celular com estoque, navegador de clínica, navegador de loja). Só imagem parada, sem loop.
- **Composição para o coverflow:**
  - objeto principal entre ~15% e 60% da altura;
  - metade de baixo calma e escura, porque é onde fica o texto do cartão do centro;
  - leitura clara mesmo na miniatura de 64 px;
  - cantos que caem para o navy.
- **Loop dos reais:** 5 s com movimento calmo (LED respirando, cidade levemente à deriva, dados pulsando na tela). O quadro 0 é igual ao `cartao.jpg`, e o último volta ao 0 para parar sem salto. Mesmo pipeline de camadas + ffmpeg do hero (`scripts/hero-expansao/`), sem grão temporal.
- **Fontes da renderização** em `scripts/catalogo-arte/<slug>/` (só texto, com README), como `scripts/hero-expansao/`.
- **Qualidade:** pelo menos 2 rodadas por cena, depois uma crítica de série (os 10 juntos, em mock de coverflow e de fita) e uma rodada de ajuste.

## 7. Movimento

| Movimento | Duração | Curva |
|---|---|---|
| Troca no coverflow (posição, escala, rotação, opacidade) | ~800 ms | `cubic-bezier(.25,1,.5,1)` |
| Texto do cartão do centro (sobe e aparece) | ~500 ms | ease-out |
| Cartão → painel e cartões → fita | ~600 ms | mesma curva, fita em cascata de ~40 ms |
| Conteúdo do painel após crescer | ~250 ms | — |
| Troca de produto com o painel aberto | ~350 ms | — |
| Fundo ambiente (crossfade) | ~1000 ms | — |
| Entrada da seção (cartões em sequência) | ~60–80 ms entre cartões | — |

- **Sem nada automático:** o carrossel não gira sozinho, o vídeo de demonstração só toca no clique e o loop do cartão toca uma vez por 5 s.
- **Movimento reduzido:** troca instantânea, sem transformação animada, sem loop e sem entrada em sequência. A disposição 3D parada pode ficar, porque não é movimento.
- Seguir a ADR-004: uma árvore React só, com a redução por CSS ou pelo portão `useCanAnimate`, que desde `c74a673` acompanha a preferência ao vivo. Nada de ramificar a árvore.

## 8. Acessibilidade

1. **Carrossel** no padrão APG:
   - região com `aria-roledescription="carrossel"` e rótulo "Catálogo de produtos" (e não "Produtos", que é o nome da `section#produtos` e repetiria o landmark: os rótulos de região têm de ser únicos);
   - cada cartão é um `<div role="group">` (decisão de 22/10: o ARIA in HTML não permite `role="group"` em `<article>`) com `aria-roledescription="produto"` e rótulo "3 de 10: Rota de Vendas";
   - os escondidos (±3 em diante) ficam `inert`;
   - setas ‹ › com nome ("Produto anterior" e "Próximo produto");
   - bolinhas com nome ("Ir para Rota de Vendas").
2. **Teclado no fechado:** ← → e Home/End **só com o foco dentro do carrossel**. Enter ou espaço no cartão do centro abre; num lateral, centraliza.
3. **Painel:**
   - região rotulada pelo h3; ao abrir, o foco vai para o título do painel;
   - Esc fecha e devolve o foco ao cartão de origem no coverflow;
   - as **abas** seguem o padrão APG (`tablist`; ← → trocam de aba quando o foco está nelas);
   - ← → trocam de produto **só quando o foco está no painel fora das abas**, ou nas setas ‹ ›;
   - as miniaturas são botões com `aria-current` no ativo.
4. **Leitor de tela:** troca de produto anunciada uma vez, em região `polite`, com nome e posição.
5. **Sem JS:** todo o conteúdo dos 10 produtos, inclusive o dos painéis, está no HTML do servidor e é alcançável. Disposição estática: fileira com rolagem para o lado e `scroll-snap`, sem 3D. Os painéis abrem por `:target` (âncora = slug) ou ficam listados. O implementador escolhe, mas nada essencial pode depender de JS. Bom para SEO também.
6. **WCAG:**
   - 2.2.2: nada se move sozinho por mais de 5 s;
   - 1.4.3: contraste do texto sobre a arte (medir como no hero, MASTER §3.4);
   - 1.4.10 e 1.4.12: ver a §4;
   - 2.4.7: foco visível em cartões, setas, miniaturas e abas;
   - 2.5.5: alvos de no mínimo 44 px (setas, miniaturas e pílulas);
   - 2.5.8: as bolinhas de paginação têm 44 px de largura quando cabem e, com muitos itens numa tela estreita, encolhem até **24 px** (o mínimo do 2.5.8), sem quebrar a linha (decisão de 22/10; os 44 px ficam para setas, miniaturas e pílulas).
7. **Cores forçadas:** setas, contornos e ícones visíveis, como no conserto A11Y-2 do hero.

## 9. Técnico

- **Arquivos novos:**
  - `src/components/sections/Catalogo.tsx`: a seção `#produtos`, que substitui o conteúdo de `Produtos.tsx`;
  - `src/components/catalogo/`: `Coverflow`, `CartaoProduto`, `PainelProduto` (abas), `FitaMiniaturas`, `FiltroTipo`, e um hook de estado (redutor puro: filtro, aberto ou fechado, índice, histórico) testável sem DOM;
  - `src/content/catalogo.ts`.
- **Movimento:** `motion/react` (ADR-002; já instalado) para a transformação cartão → painel por elemento compartilhado (`layout`/`layoutId`). CSS para o coverflow (transforms e transições). Sem bibliotecas novas; se alguma for inevitável, passar pela quarentena (ADR-003).
- **Vídeo:**
  - no máximo 1 vídeo tocando na página (`videoCoordination`), contando o vídeo do hero, os loops dos cartões e o vídeo do painel;
  - `preload="none"`; o loop do cartão só carrega quando o cartão chega ao centro (ou com mouse ou foco);
  - o vídeo do painel segue o padrão atual de clicar para assistir.
- **CSS:** bloco BEM em `globals.css` com os tokens do `:root`, como no hero. Nada de `style={}` solto além das variáveis de posição do coverflow.
- **Hero:**
  - a âncora `#slug` precisa existir no DOM (id no cartão) para a regra do hero;
  - o fundo e o texto do catálogo não podem disputar o vídeo do hero (regra de 1 vídeo).
- **Aposentados:** `ProjectGrid` e o `video step` antigo do `check:browser` saem se ficarem sem uso. A CSS da parede de cartões da v2.2 sai junto.
- **CSP (ADR-008):** só mídia local.
- **Desempenho:**
  - LCP continua no hero;
  - imagens do catálogo com `loading="lazy"`, exceto o cartão do centro inicial quando a seção estiver perto;
  - `srcset` 480/800;
  - CLS 0 ao abrir, fechar e trocar (é o que a altura constante garante).

## 10. Testes

- **vitest:**
  - redutor de estado: abrir, fechar, próximo e anterior com volta, filtro com o painel aberto, âncora fora do filtro, histórico de push e replace;
  - HTML do servidor: os 10 produtos e o conteúdo dos painéis presentes, nenhum autoplay;
  - interação: clique em lateral centraliza, centro abre, Esc fecha e devolve o foco, abas, miniaturas, ← → só com o foco certo;
  - axe nos dois estados;
  - hidratação (variante já coberta pelo `page.hydration.test`);
  - menu "Produtos ▾", também no celular;
  - `InterestLink` com o interesse certo.
- **`check:browser`** ganha uma etapa do catálogo:
  - sem JS;
  - abrir e fechar com o mouse;
  - teclado (inclusive ← → que não vazam para a página);
  - miniaturas;
  - filtro;
  - `/#rota-de-vendas` abrindo o painel e o voltar fechando;
  - **altura constante** (topo da próxima seção igual antes e depois);
  - movimento reduzido instantâneo;
  - o loop parando em ≤5 s;
  - 1 vídeo por vez;
  - menu da barra;
  - toque e deslize a 360 px;
  - cores forçadas;
  - 1.4.12 a 320 px.

  Atualizar o `video step` para o vídeo do painel. Provar que as checagens novas falham com o catálogo quebrado de propósito (mutações), como no hero.
- **Gates:** typecheck, lint, vitest com `--maxWorkers=2`, `check:browser` completo e `check:placeholders`. Este último só pode falhar nos 6 `[A PREENCHER]` que já existem; os inventados **não** levam o marcador (Q25).

## 11. Documentos a atualizar

- **MASTER:**
  - §8.8 (hoje "Aplicativos (grade de vídeos)") reescrita como "Catálogo de produtos": coverflow, painel, fita, altura constante, movimento, acessibilidade e exceção de telas baixas;
  - §6 (movimento): loop de 5 s e "nada gira sozinho";
  - §3.4 (contraste do texto sobre a arte).
- **`docs/DECISOES.md`, ADR-011:**
  - catálogo em coverflow com painel, e a referência do 21st.dev usada só como formato (ADR-005);
  - itens fictícios em produção por decisão do dono;
  - altura constante;
  - barra "Produtos ▾".
- **README:** estrutura da página, como trocar os itens e a arte do catálogo, e a linha do `check:browser`.
- **`docs/landing-copy.md`:** subseção com os textos novos dos reais (proposta) e a lista dos fictícios.

## 12. Fora do escopo e pendências

- Capturas de tela reais: o dono manda e elas trocam as ilustrativas.
- Páginas próprias por produto: decisão de 14/10, fica para depois. O link `#slug` foi pensado para trocar de destino quando elas existirem.
- Interesse "site" no formulário: precisa de mudança na validação do servidor.
- Decisões ainda abertas do hero (PR #8): onde começa o fio com o hero novo, aprovação do título, etc.
- Testes em Safari/iOS e Firefox de verdade: o hero também ainda não teve.

## 13. Plano de construção (quando for autorizado)

1. **Arte:** os 3 reais, um agente por cena; os inventados e as telas; crítica de série e ajuste. Não mexe no git; instala em `public/catalogo/`.
2. **Código, ao mesmo tempo que a arte:** implementação (§3–§9) com testes e documentos; depois a etapa do `check:browser`. Commits só de código, sem `public/catalogo/`.
3. **Integração:** arte final no lugar, QA visual em 360, 390, 768, 1024 e 1440 (fechado, aberto e trocando, com e sem movimento reduzido), todos os gates e o commit da mídia.
4. **Revisão adversarial:** acessibilidade ao vivo, código e ADRs, fidelidade à spec e visual, docs e testes. Depois céticos, correção e conferência final.
5. **Publicação:** push e PR para `homologacao` (o PR #8 já entrou; a Q7 foi superada), com prévia na Vercel. O merge é do dono.

Sempre no máximo 2 agentes ao mesmo tempo, com a trava de processos pesados, por causa da RAM.
