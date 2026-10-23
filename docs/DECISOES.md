# Decisões de arquitetura (ADR) — site da Strukti Soluções

Registro curto de decisões técnicas que afetam todo o projeto. Cada entrada
fica para trás como está: se a decisão mudar, cria-se uma ADR nova, nunca se
reescreve uma antiga.

---

## ADR-001 — Tailwind CSS v4 + convenções do shadcn, adoção gradual

**Data:** 30/09/2026
**Decisão de:** Claudinho (maestro)
**Status:** aceita

**Contexto:** o cliente pediu uma primeira leva de componentes vindos do
catálogo 21st.dev (o primeiro foi o Container Scroll Animation, da Aceternity
— depois substituído por código próprio, ver ADR-005).
Esses componentes são publicados no padrão shadcn/Tailwind. Até aqui, o site
usa CSS simples (`src/app/globals.css`, com tokens em `:root`) e `style={}`
inline nos componentes de seção — não há Tailwind nem shadcn no projeto.

**Decisão:**
- Adotar Tailwind CSS v4 (`tailwindcss@4.3.3` + `@tailwindcss/postcss@4.3.3`,
  publicados em 2026-07-16, fora da janela de quarentena de 7 dias) e as
  convenções do shadcn: `components.json`, componentes de UI de terceiros em
  `src/components/ui/`, função `cn()` em `src/lib/utils.ts` (via `clsx` 2.1.1
  e `tailwind-merge` 3.7.0). **O CLI `shadcn` não fica no `package.json`:**
  roda sob demanda, de versão fixada na hora (`npx shadcn@4.21.0 add ...`,
  conferindo a quarentena daquela versão naquele dia). Motivo: `shadcn` traz
  uma árvore de dependências própria e pesada (MCP, scaffolding, etc.) só
  para gerar código uma vez; depois de rodado, o componente vira código
  nosso em `src/components/ui/` e o CLI não precisa mais aparecer no lock.
  Isso também evita que o lockfile arraste pacotes transitivos do CLI
  publicados há poucos dias (ver ADR-003).
- **Adoção gradual:** os componentes de seção já existentes
  (`src/components/sections/*`, `Header`, `WhatsAppButton` etc.) continuam
  como estão, com `style={}` inline e as classes utilitárias do
  `globals.css` (`.container`, `.section`, `.section-title` …). Só os
  componentes novos de `src/components/ui/` usam classes Tailwind. Não há migração
  retroativa dos componentes atuais só para "padronizar".
- **`globals.css`:** o import do Tailwind entra sem o preset layer
  `preflight` (o reset de base do Tailwind), importando só `theme` e
  `utilities`:
  ```css
  @import "tailwindcss/theme.css" layer(theme);
  @import "tailwindcss/utilities.css" layer(utilities);
  ```
  Motivo: o preflight reseta margens, bordas e estilos padrão de formulário
  em todo elemento da página — como o site todo depende hoje do
  `globals.css` atual e de `style={}` inline (não de um reset de base
  próprio), ligar o preflight haveria risco de regressão visual sem ganho,
  já que nenhum componente atual precisa dele. Os tokens de cor existentes
  (`--color-petrol-*`, `--color-ink*`, `--color-whatsapp*` etc.) continuam
  sendo a fonte única da paleta azul-petroleo; os componentes novos os usam
  via valor arbitrário do Tailwind (`bg-[var(--color-petrol-900)]`), sem
  duplicar cor em formato hexadecimal solto.
- Dependências novas ficam no mínimo necessário hoje: `tailwindcss`,
  `@tailwindcss/postcss`, `clsx`, `tailwind-merge`. Não
  entraram `class-variance-authority`, `lucide-react` nem `tw-animate-css`
  porque nenhum componente atual usa variantes de classe (CVA) ou ícones do
  Lucide; entram quando um componente futuro realmente precisar, sempre com
  a mesma checagem de quarentena de 7 dias.

**Consequência:** o projeto passa a ter duas convenções de estilo
coexistindo (CSS/inline nas seções atuais, Tailwind nos componentes de UI de
terceiros) até que o grupo decida, mais adiante, se vale migrar o restante.

---

## ADR-002 — `motion/react` no lugar de `framer-motion`

**Data:** 30/09/2026
**Decisão de:** Claudinho (maestro)
**Status:** aceita

**Contexto:** componentes do catálogo 21st.dev/Aceternity (como o Container
Scroll Animation) são publicados com `import ... from "framer-motion"`. O
projeto já tem `motion@13.4.1` instalado (pacote sucessor oficial do Framer
Motion, mesma API).

**Decisão:** ao adaptar qualquer componente de terceiro, trocar o import de
`framer-motion` por `motion/react`, mantendo os mesmos nomes de hooks e
componentes (`motion`, `useScroll`, `useTransform`, `useReducedMotion`,
`MotionValue` etc. — a API é compatível). Nunca instalar `framer-motion`
como dependência.

**Consequência:** uma única biblioteca de animação no projeto, sem
dependência duplicada fazendo a mesma coisa.

---

## ADR-003 — Checagem automática da quarentena de 7 dias

**Data:** 30/09/2026
**Decisão de:** Claudinho (maestro), a partir de achado da revisão (Crivo)
**Status:** aceita

**Contexto:** a regra de quarentena (CLAUDE.md) hoje só é checada à mão,
olhando a data de publicação das dependências diretas que entram no
`package.json`. A revisão da entrega A1 pegou 15 pacotes **transitivos** no
`package-lock.json` publicados há menos de 7 dias — a maior parte veio do
CLI `shadcn` (ver ADR-001) e do range `^13.4.1` do pacote `motion`, que
resolvia `framer-motion` e `motion-dom` para versões (13.4.6/13.4.5)
publicadas dias atrás, mesmo com `motion` fixado em `13.4.1` no
`package.json`.

**Decisão:**
- `npm run check:quarantine` (`scripts/check-quarantine.mjs`) lê
  `package-lock.json` inteiro (diretos e transitivos), consulta a data de
  publicação de cada pacote no registry do npm e falha se algum tiver
  menos de 7 dias. Entra na definição de pronto, junto de typecheck, lint,
  test e build.
- Quando um range semver (`^`, `~`) de uma dependência direta puder
  resolver para uma versão transitiva recente, fixar essa transitiva via
  `overrides` no `package.json` (caso do `framer-motion` e `motion-dom`,
  trazidos pelo `motion`: fixados em `13.4.1`, mesma versão já aprovada).
- Para instalar e regenerar o lock respeitando a quarentena:
  `npm install --min-release-age=7` (flag nativa do npm; confirmado pelo
  Claudinho na rodada 2). Ela calcula "7 dias atrás de agora" a cada
  execução, sem data fixa que fica velha no dia seguinte (por isso não
  `--before=<data>`). O `.npmrc` do projeto tem `min-release-age=7`, então
  qualquer `npm install` já aplica isso sem ninguém lembrar da flag.
  Mesmo assim, `check:quarantine` continua sendo a checagem que vale: o
  `.npmrc` previne, a checagem garante.

**Consequência:** a quarentena passa a ser garantida pela árvore de
dependências inteira, não só pelo que o grupo escreve à mão no
`package.json`.

---

## ADR-004 — Reduzir movimento só por CSS, nunca ramificando a árvore React

**Data:** 30/09/2026
**Decisão de:** Claudinho (maestro), a partir de achado da revisão (Crivo)
**Status:** aceita

**Contexto:** a primeira versão do cartão de rolagem da Seção 4 (o
`ContainerScroll` adaptado da 21st, ADR-001, depois trocado por código
próprio, ADR-005) tinha um `if (useReducedMotion()) return <...estático...>`. `useReducedMotion()`
devolve `null` no servidor (não há `matchMedia` lá) e só resolve a
preferência real no primeiro render do cliente — então, quando o visitante
prefere menos movimento, o servidor manda a árvore animada e o cliente
troca pela estática assim que hidrata. O React detecta a divergência,
descarta o HTML do servidor e renderiza tudo de novo (erro de hidratação,
salto de layout visível).

**Decisão:** nenhum componente deste projeto ramifica a árvore React por
`prefers-reduced-motion` (nem por `useReducedMotion()`, nem checando
`matchMedia` no primeiro render). Uma de duas:
- **Preferida — CSS puro:** uma árvore só; a redução usa os modificadores
  `motion-reduce:`/`motion-safe:` do Tailwind (ou `@media
  (prefers-reduced-motion: reduce)` direto no CSS), que valem igual no
  servidor e no cliente, com ou sem JavaScript. É o que o `ScrollTiltCard`
  (`src/components/ui/scroll-tilt-card.tsx`) usa hoje.
  *Nota de 04/10/2026:* o `ScrollTiltCard` foi removido nessa data, na home
  v3; o exemplo fica como registro.
- **Mínimo aceitável, quando a diferença não dá para fazer só em CSS:** o
  portão de montagem `useCanAnimate()` (`src/lib/motion.ts`) — a árvore
  animada (ou os props de animação) só aparece depois de montar no cliente
  (`useEffect` + `useState`); antes disso (SSR e primeiro render do
  cliente, iguais) e sem JavaScript, renderiza o conteúdo final direto, sem
  transformação. Usado pelo `Reveal` e pelo `useTapHover` (este, na rodada
  1, ainda lia `useReducedMotion()` direto e gerava `tabindex` divergente
  nos `motion.a`/`motion.button` — achado da Crivo na rodada 2).

**Garantias (definição de pronto, regra aceita pelo Claudinho na rodada 2):**
- `src/app/page.hydration.test.tsx`: renderiza a página inteira no
  "servidor", hidrata no "cliente" com prefers-reduced-motion ligado e
  desligado, e falha em `onRecoverableError` **ou em qualquer
  `console.error`** (divergência de atributo só aparece no console).
- `npm run check:browser`: o mesmo, num Edge/Chrome headless de verdade —
  falha se o console do navegador registrar erro em qualquer largura.

**Consequência:** nenhum conteúdo pisca, some ou troca de lugar durante a
hidratação por causa de preferência de movimento.

---

## ADR-005 — Componente de terceiro só com licença explícita; sem ela, código próprio

**Data:** 30/09/2026
**Decisão de:** Claudinho (maestro)
**Status:** aceita

**Contexto:** o Container Scroll Animation veio da API do 21st.dev, dentro
da cota do plano gratuito. Mas a mesma peça aparece no site da Aceternity
(autora) entre os componentes do plano pago "All-Access", e nem a página da
21st nem a da Aceternity publicam uma licença para o código (MIT ou outra).
Conseguir baixar o código não significa ter direito de usá-lo num site
comercial.

**Decisão:**
- Componente de terceiro (21st.dev, Aceternity, shadcn ou qualquer outro)
  só entra no projeto com **licença explícita e compatível com uso
  comercial** (MIT, Apache-2.0, BSD, ISC ou equivalente). A licença e o link
  de onde ela foi conferida ficam anotados num comentário no topo do
  arquivo, junto com a URL de origem e a data da conferência.
- Sem licença clara, **reproduzimos o efeito com código próprio**, escrito a
  partir da documentação pública da biblioteca (no caso, a do motion), sem
  copiar o código do terceiro. Uma técnica (ex.: "cartão que se endireita
  ao rolar") não tem dono; uma implementação específica tem.
- Aplicado agora: o `ContainerScroll` derivado da Aceternity/21st foi
  apagado e substituído por `src/components/ui/scroll-tilt-card.tsx`,
  escrito do zero com `useScroll`/`useTransform`.

**Consequência:** o MCP da 21st continua útil para buscar referências
visuais, mas o código retornado só entra se a licença estiver clara; na
dúvida, ele vira inspiração, não arquivo do projeto.

---

## ADR-006 — Design system v2 ("Encaixe"): fundo, paleta do logo, Geologica e hero trocável

**Data:** 30/09/2026
**Decisão de:** Nanquim (Designer), na tarefa DS1 pedida pelo Claudinho
**Status:** aceita (conceito aprovado pelo Claudinho em 01/10/2026; revisão DS1 da Crivo)

**Contexto:** o cliente pediu um design system novo, com as cores do logo,
visual moderno sem cara de IA, as animações mantidas, um buraco negro
(WebGL) no hero e um fundo coerente com o projeto. Pediu também que o
visual do hero seja trocável no futuro (com uma opção "static", sem WebGL)
e que "O que já construímos" vire um portfólio de vídeos que cresça com os
próximos projetos. A v1 do design system usava azul-petróleo, Inter e
botões em pílula, sem relação com o logo; o `MASTER.md` da v1 dizia que o
código vencia em caso de conflito.

**Decisão:**
- **`design-system/strukti-solucoes/MASTER.md` v2 passa a ser a fonte da
  verdade visual.** `globals.css` e `src/fonts/index.ts` o implementam; se
  divergirem, o código é que está errado.
- **Fundo, "escuro para mostrar, claro para ler":** espaço (`#08121D`, o
  marinho do logo aprofundado) no cabeçalho, no hero e no rodapé; noite
  (`#0E1C2B`) no portfólio de vídeos; papel frio (`#F1F5F8`) nas seções de
  leitura e de formulário, com peças elevadas em branco. Descartados: site
  todo escuro (leitura longa e formulário pioram para o público, e "preto
  com um acento" é um clichê de página gerada) e o branco puro da v1 (sem
  relação com o topo cósmico nem com o logo).
- **Paleta só do logo:** escalas marinho, elétrico e ciano montadas a partir
  das cores amostradas do logo oficial, mais o verde do WhatsApp (só para o
  WhatsApp) e as cores de erro e sucesso. Tokens semânticos por superfície;
  todos os pares de texto e interface conferidos no AA (tabela na §3.4 do
  `MASTER.md`).
- **Tipografia: Geologica** (licença SIL OFL, Google Fonts), uma família
  variável com o eixo `SHRP`, que corta as terminações no ângulo do
  hexágono. Auto-hospedada pelo `next/font` (baixada no build, ~29 KB no
  subconjunto latino, menos que os ~48 KB da Inter). Substitui a Inter.
- **Conceito "Encaixe":** blocos que se encaixam com uma junta de 3 px (a
  fresta do logo) no lugar de cartões soltos com sombra; raios por
  hierarquia (2, 4, 6 e 10 px), sem pílula; profundidade pela cor da
  superfície, não por sombra. O hexágono e o ponto do i são os únicos
  outros detalhes de marca.
- **Hero trocável:** o DS define as camadas que não mudam (base espaço,
  fade para o espaço no fim, véu com opacidade ≥ 0,86 na zona do texto e o
  conteúdo) e só a camada do visual é trocável. Assim o contraste do texto
  e o fundo do resto do site não dependem do visual. Composição lado a lado
  a partir de 1024 px e em faixa abaixo disso. Visual "static": o símbolo
  em vista explodida (`public/brand/strukti-encaixe.svg`) sobre o espaço,
  com uma luz azul. Buraco negro com o disco nas cores da marca, sem
  estrelas, pausado fora da tela e com reduced motion.
- **Portfólio de vídeos escalável:** projetos numa lista de dados; um
  destaque (o vídeo com o cartão 3D que já existe) e uma grade que só
  aparece com dois projetos ou mais. Com um projeto só, não há grade vazia
  nem cartão fictício.
- **Marca em SVG** em `public/brand/`: símbolo e assinaturas (horizontal e
  vertical), versões para fundo claro e escuro, vetorizadas do logo
  oficial.
- **Motion:** as animações existentes ficam (revelação ao rolar, cartão 3D
  na rolagem, micro-interações dos botões); o único movimento automático
  novo é o do visual do hero.

**Consequência:** a Fase B troca os tokens de `globals.css` (mapa de
migração na §12 do `MASTER.md`), a fonte, o cabeçalho, o estilo das seções
e o portfólio. Componentes passam a usar só tokens semânticos, então uma
seção muda de superfície trocando uma classe. Os botões deixam de ser
pílulas e o foco deixa de ser laranja. Ajustes no hero que tocam o código
do Andaime (ponto de corte de 1024 px, véu do DS no lugar do `scrim` do
componente, camada de espera sem o símbolo) são combinados com ele na
Fase B.

---

## ADR-007 — Hero "video" com aba no topo; pílula com seta só no hero

**Data:** 01/10/2026
**Decisão de:** Claudinho (maestro), a pedido do cliente, na tarefa HR1; proposta e implementação do Nanquim (Designer)
**Status:** aceita (decisões 1 a 4 aprovadas pelo Claudinho em 01/10/2026; vídeo escolhido pelo cliente)

**Contexto:** o cliente quis trocar a tela inicial (cabeçalho atual e
buraco negro) por um hero no estilo do "PrismaHero" da 21st.dev: vídeo de
fundo em tela cheia com ruído e gradiente, navegação numa "aba" escura no
topo, uma palavra gigante que sobe ao carregar e um botão em pílula com
seta. O PrismaHero tem "License: unknown" na 21st e o vídeo dele vem de uma
CDN sem licença. O MASTER v2 (ADR-006) proibia pílula e seta em botão.

**Decisão:**
- **Implementação própria** (ADR-005): nada do código nem do vídeo do
  PrismaHero; só a ideia visual, refeita com CSS e o `motion/react` que já
  temos.
- **Trocável por config:** `siteConfig.heroVariant` = `"video"` (padrão) ou
  `"classic"` (o hero anterior, com buraco negro ou estático em
  `siteConfig.heroVisual`, e o cabeçalho sticky). O classic não foi
  apagado.
- **Vídeo:** "Rota ao entardecer" (Pexels, Pexels License, escolhido pelo
  cliente entre 3 opções), hospedado em `public/video/hero/`, nunca de CDN
  externa; loop de 12 s sem salto, tom marinho, recortes deitado e em pé,
  ~1,65 MB e ~0,66 MB. Só toca por JavaScript, sem reduced motion, com o
  hero na tela e sem "economizar dados"; senão, fica o pôster. Controle de
  pausar/tocar (WCAG 2.2.2).
- **Palavra gigante "Strukti"** com o ponto do i do logo como detalhe,
  decorativa (`aria-hidden`); o H1 semântico continua sendo o título
  aprovado. A subida (word pull-up) é **só CSS** (ADR-004, forma
  preferida): começa no 1º quadro, sem esperar a hidratação, sem piscar e
  sem animação com reduced motion. O `motion/react` fica no menu e nos
  botões.
- **Barra do topo fixa** (a "aba"): marca, 5 links e WhatsApp a partir de
  1024 px; abaixo, marca e "Menu", com painel de itens de 48 px e texto de
  18 px (resolve o A2 do backlog: antes, abaixo de 1100 px não havia menu).
- **FAB só abaixo de 1024 px** quando a barra existe: acima disso o
  WhatsApp já está sempre visível na barra, e o FAB duplicava a chamada.
- **Pílula com seta, exceção só no hero "video":** os dois botões do hero
  são pílulas; o WhatsApp segue verde, com ícone e de maior destaque; "Pedir
  diagnóstico gratuito" é de contorno com a seta num círculo electric-700.
  No resto do site os botões seguem a §8.1 (sem pílula, sem seta).

**Consequência:** o MASTER ganhou a §8.3.1 (barra), a §9.6 (hero
"video"), a regra do FAB na §8.12, as exceções nas §5.3, §8.1 e §10 e os
pares de contraste novos na §3.4. Os textos de interface novos ("Menu",
"Pausar o vídeo de fundo", "Tocar o vídeo de fundo") estão no
`docs/landing-copy.md`. Testes novos: `TopBar.test.tsx` e
`HeroVideo.test.tsx`; o teste de hidratação e o `check:browser` cobrem a
página com o hero novo.

**Revisão HR1 (Crivo):** o painel do menu também fecha quando o foco sai
da barra (o painel é fixo e cobria o controle focado, WCAG 2.4.11); o
controle do vídeo ganhou um anel de espaço sob o contorno de foco (o ciano
sobre o céu claro ficava em ~1,1:1) e veio para antes do texto no DOM; no
lado a lado, o vídeo passou a ser **mascarado** antes da coluna de texto,
em vez de coberto por um véu de 0,88, que deixava ver o céu e a crista do
morro como um "retângulo" atrás das letras; a moldura passou a noite
(navy-900), dentro da margem de espaço, para o recorte da aba e da
moldura continuar visível. Os testes de hidratação e do axe rodam com os
dois heroes ("video" e "classic").

**Nota TB1 (01/10/2026, pedido do cliente: "quero que a top bar ocupe até
as bordas, essa centralização tá feia"):** a "aba" centrada com cantos
cortados deu lugar a uma **barra fixa de borda a borda**, colada no topo,
sólida em espaço, com a junta de 3 px em navy-800 embaixo. O conteúdo
segue o container do site: marca à esquerda; links e WhatsApp num grupo à
direita a partir de 1024 px; marca e Menu abaixo disso, com o mesmo painel
acessível, agora preso embaixo da barra, também de borda a borda. O
restante desta ADR continua valendo. Consequências no hero, decididas pelo
Nanquim e sem levar o hero às bordas: (1) a moldura com margem começa
**abaixo** da barra. Com a barra por cima, o topo da moldura sumia e ela
virava um "U"; assim, a barra vira o lado de cima da margem de espaço. (2)
A partir de 768 px, o respiro do conteúdo dentro da moldura desconta a
margem (`--hero-gutter`), e o texto alinha com a marca da barra e com as
seções. O `check:browser` ganhou um percurso com Tab pela página a 360, 390
e 1024 px, que falha se um controle focado parar sob a barra. Capturas em
`docs/capturas-tb1/`.

**Nota TB2 (03/10/2026, espaçamento de texto, WCAG 1.4.12, nível AA):** com
o espaçamento do usuário (letras +0,12em, palavras +0,16em), o grupo de
links e WhatsApp crescia de ~860 para ~1080 px. Entre 1024 e ~1137 px ele
saía da tela, e o WhatsApp da barra fixa ficava cortado (achado da Crivo na
TB1). Decisão do Nanquim, entre as duas saídas que o Claudinho aceitou:
**subir o ponto da barra larga**, junto com o do FAB, de 1024 px para
**75em** (1200 px com a fonte padrão). Descartada a barra que cresce: uma
barra fixa de duas linhas exige medir a altura por JavaScript para a
moldura do hero não ficar coberta, e come a tela de quem já precisa de
espaço. Em `em`, o ponto também acompanha a fonte do navegador. Abaixo de
75em vale o Menu e o FAB; a composição do hero continua mudando em 1024 px.
Os respiros da barra larga passam a ser fluidos (16 → 32 e 20 → 48 px).
O valor fica numa constante (`TOPBAR_WIDE_QUERY`), que o `TopBar.test.tsx`
confere contra o CSS. O `check:browser` aplica o espaçamento do 1.4.12 de
360 a 1440 px, inclusive 1024–1110.

---

## ADR-008 — SEO técnico e cabeçalhos de segurança: SITE_URL, CSP estática, página 404

**Data:** 03/10/2026 (revisão em 03/10/2026, revisão R1 da Crivo)
**Decisão de:** Andaime (líder da frente, item 3 da P3) e Claudinho (CSP:
estática x nonce, revisão R1 da Crivo), a pedido do Claudinho;
implementação do Ferrolho e do Andaime
**Status:** aceita

**Contexto:** o build avisava `metadataBase` ausente; faltavam
`sitemap.xml`, `robots.txt`, `manifest` completo e uma página 404 no visual
do site; a `Content-Security-Policy` em `next.config.ts` era mínima
(só `frame-ancestors`, `base-uri`, `form-action`, `object-src`). O domínio
de produção ainda não foi definido (`docs/landing-copy.md`, "Pendências");
inventar um valor não era opção.

**Decisão:**
- **`SITE_URL` sem hardcode** (`src/lib/siteUrl.ts`): usa `SITE_URL` do
  ambiente; sem ele, em produção prefere `VERCEL_PROJECT_PRODUCTION_URL`
  (domínio fixo do projeto — `VERCEL_URL` é a URL única daquele deploy) e,
  fora da Vercel, cai em `http://localhost:3000`. Normalizado com
  `new URL(...).origin` (sem isso, um `SITE_URL` com barra no fim duplicava
  barra no sitemap/robots). Usado em `metadataBase` (`layout.tsx`, com
  `alternates.canonical` e `openGraph.url` novos), `sitemap.ts` e
  `robots.ts`; falta só setar `SITE_URL` na Vercel antes do lançamento
  (README, "Configuração"). `landingContent.seo.ogUrl` não alimenta
  nenhuma tag — é só o lembrete do `check:placeholders`.
- **`manifest.ts`** reaproveita `icon.svg` (vetorial, `sizes: "any"`, sem
  gerar PNG novo) e a cor `--color-navy-950` (`#08121d`) já usada no
  `viewport.themeColor` e no `opengraph-image`.
- **`robots.ts`** bloqueia `/api/` (inclui `/api/diagnostico`, que é rota,
  não página) e aponta pro `sitemap.xml`.
- **Página 404** (`not-found.tsx`): microcopy de interface aprovada pelo
  Claudinho em 03/10/2026 (título "Página não encontrada", link de volta à
  raiz — `next/link`, 1º uso no projeto, que até aqui era página única — e
  o botão de WhatsApp já existente com a mensagem geral) e registrada em
  `docs/landing-copy.md` v1.8, seção de textos de interface — não é claim
  de marketing nem dado do negócio, mas o critério do Claudinho vale pra
  qualquer texto novo: só entra se estiver no documento. Texto em
  `landingContent.notFound` (`src/content/landing.ts`); testado em
  `not-found.test.tsx` (conteúdo + axe).
- **CSP estática** (`next.config.ts`, revisão R1 da Crivo — reverte a 1ª
  versão desta ADR, que usava um nonce por requisição via
  `src/middleware.ts`): `script-src 'self' 'unsafe-inline'` (mais
  `'unsafe-eval'` só em desenvolvimento — o devtool do webpack do Next roda
  cada módulo por `eval()` nesse modo; sem isso a página não hidrata em
  `npm run dev`, bloqueante da R1), `style-src 'self' 'unsafe-inline'`
  (`style={{...}}` do React vira atributo `style=""` literal no HTML do
  servidor; CSP não tem nonce para atributo), `img-src 'self' data:`
  (ruído de fundo em SVG inline do `globals.css`), `font-src`/`media-src`/
  `connect-src 'self'` (fonte Geologica e vídeo self-hosted, nunca CDN
  externa), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`, `upgrade-insecure-requests`.
  **Por que não o nonce:** a página não renderiza conteúdo de usuário nem
  carrega script de terceiro (sem `dangerouslySetInnerHTML`, sem
  `next/script`, sem domínio externo) — o nonce só protegeria contra script
  inline injetado, e não há por onde injetar. Em troca, ele custava (a)
  desempenho: `/`, `/privacidade` e a 404 viravam dinâmicas (função a cada
  visita na Vercel, sem cache de CDN), contra a meta de desempenho do P3, e
  o middleware passava a rodar em cada arquivo de `public/` (vídeos,
  pôsteres, marca); (b) manutenção: o Next só carimbava o nonce porque o
  layout lia `headers()` sem usar o valor — um sinal nada óbvio, que já
  quebrou uma vez em produção sem erro de build (`ad367c4`, corrigido em
  `503dd2a`). **Reavaliar se um dia entrar script de terceiro** (analytics,
  widget de chat, etc.) ou conteúdo de usuário renderizado sem escapar.
- **`check:browser`** passa a falhar em qualquer violação de CSP
  (`scripts/check-browser.mjs`, evento `Log.entryAdded` do CDP, fonte
  `security`) — antes só ouvia `Runtime.consoleAPICalled`/`exceptionThrown`
  e uma violação (fonte, imagem, mídia bloqueada) passava em silêncio,
  tornando falsa a promessa do README de que ele cobre a CSP.

**Consequência:** nenhum domínio foi inventado em código nem em conteúdo;
a pendência de publicação (`docs/landing-copy.md`) passa a cobrir só o
texto que um humano lê (mensagem de compartilhamento da equipe), não mais
o funcionamento técnico. Com a CSP estática, `/`, `/_not-found` e
`/privacidade` voltam a ser estáticas (confirmado no `npm run build`: ○,
não ƒ) — sem middleware, sem função por visita, com cache de CDN normal.

---

## ADR-009 — Novo rumo (hardware + IA) e identidade "Estúdio"; hero em sequência de quadros

**Data:** 03/10/2026
**Decisão de:** Thiago (cliente), com o Claude
**Status:** aceita
**Altera:** a ADR-006 (o `MASTER.md` v3 substitui a v2 "Encaixe" no conceito, na luz e nos componentes novos; o resto da v2 continua valendo) e a ADR-007 (o hero padrão deixa de ser o "video" e passa a ser o "estudio", em sequência de quadros; o "video", com a sua pílula com seta, e o "classic" ficam no código até a limpeza citada nas Consequências).

**Contexto:** a Strukti mudou o foco para produtos que juntam hardware e IA (replay para quadras; estacionamento inteligente em espera), mantendo os aplicativos em segundo plano. O site vendia "aplicativo sob medida para distribuidoras" e o design system v2 ("Encaixe") foi pensado para isso.

**Decisão:**
1. O site vira a vitrine da marca-mãe: catálogo de hardware em destaque e de aplicativos. Cada produto pode ter site próprio depois (o do replay vem antes, fora deste trabalho).
2. Design system v3, "Estúdio": produto como peça de vitrine sob luz controlada, escuro como base, claro só onde se lê e se age. Fica tudo o que é marca (símbolo, Geologica, escalas de cor, as três assinaturas). Entram a luz de estúdio, o palco, os selos de status e a ficha técnica (`MASTER.md` v3).
3. Hero em **sequência de quadros pré-renderizada no Blender**, desenhada num `<canvas>` pela rolagem. O Three.js em tempo real foi a recomendação técnica (mais leve de trocar, nítido em qualquer tela); o cliente escolheu a sequência pelo visual mais fotográfico e por não ter biblioteca de 3D no site. Custo aceito: 3 MB (desktop) / 1,2 MB (celular) de quadros, carregados depois da página, e re-render a cada ajuste.
4. O modelo 3D é estilizado (não existe caixa definitiva do produto) e o site o identifica sempre como "Ilustração do conceito". Quando houver CAD/STL, o script passa a importá-lo; câmera, luz e saídas continuam.

**Consequências:** o texto da home é reescrito (`docs/landing-copy.md` v2.0); o formulário ganha o campo "interesse" e a tabela `leads`, a coluna `interest`; os heros "video" e "classic" ficam no código até a v3 estar aprovada no ar e saem numa limpeza separada, com ADR própria.

---

## ADR-010 — Hero "expansao": componente MIT adaptado, rolagem segurada como exceção controlada

**Data:** 15/10/2026
**Decisão de:** Thiago (cliente), com o Claudinho (maestro)
**Status:** aceita (o texto novo do hero é proposta, aguardando aprovação em `docs/landing-copy.md`)
**Altera:** a ADR-009 (o hero padrão deixa de ser o "estudio", que fica no código como variante, e passa a ser o "expansao") e, como exceção registrada, as regras de motion e de contraste do `MASTER.md` (§6 e §9.1) só para este hero.

**Contexto:** o dono pediu uma abertura nova a partir do componente "Scroll Expansion Hero" (`ScrollExpandMedia`, de @arunachalam, no 21st.dev), com a animação mantida por inteiro: o quadro de mídia cresce com a roda ou o toque, de 300 × 400 até quase a tela inteira, o fundo se apaga, as duas partes do título e as legendas se abrem para os lados, e o conteúdo aparece quando a expansão termina, liberando a rolagem. A mídia é nossa ("Fim de expediente": um ambiente de paz com detalhes sutis do que a Strukti faz, sem paisagens naturais). Do jeito que vem, o componente quebra o site: usa framer-motion (proibido pela ADR-002), devolve a página ao topo a cada rolagem (âncoras, teclado, foco e barra de rolagem deixam de funcionar), esconde fundo e conteúdo sem JavaScript, tem dois `<h2>` no lugar do H1, toca o vídeo com `autoplay` e sem controle e aceita vídeo do YouTube (bloqueado pela CSP). O hero de objetos 3D da spec de 15/10 (triângulo) chegou a entrar no branch e foi revertido; dela ficam a barra em cápsula, o `aria-current` e os atalhos de Produtos.

**Decisão:**
1. **Adotar o componente, com licença MIT** (ADR-005), conferida em 15/10/2026 em https://21st.dev/@arunachalam/components/scroll-expansion-hero. O aviso da licença e a lista de cada mudança ficam no topo de `src/components/ui/scroll-expansion-hero.tsx` e em `THIRD_PARTY_NOTICES.md`. Sem framer-motion e sem motion: o progresso vai para uma propriedade CSS (`--hx-p`), e as fórmulas do original viram `calc()` no `globals.css`. Nenhuma dependência nova (ADR-003).
2. **A rolagem segurada fica, como exceção controlada** (MASTER §6 e §9.8): enquanto o quadro não chega ao tamanho final, a roda e o toque fazem a expansão andar em vez de rolar a página, com os números do original (roda × 0,0009; toque × 0,005 para expandir e × 0,008 para recolher; recolher com roda para cima ou arrasto de mais de 20 px no topo). Em troca, estas garantias, todas com teste (vitest e `check:browser`): a página nunca volta ao topo sozinha (uma rolagem que o hero não causou, como âncora, barra de rolagem, busca ou foco, completa a expansão); âncora fora do hero na URL, ao montar ou no `hashchange`, começa expandida; a altura do hero não muda entre os estados, então as âncoras ficam no lugar, e a expansão não desloca o layout (CLS 0); o teclado faz a expansão andar como a roda, menos com Alt, Ctrl, Meta ou Shift (seleção, navegação por cursor; Shift + Espaço sobe) e com o menu aberto; foco dentro do hero (menos no controle do vídeo e na própria mídia, que não recebe clique) completa a expansão; zoom (Ctrl + roda, pinça e a página ampliada), a roda só de lado (voltar e avançar do trackpad) e o menu aberto da barra ficam com o navegador; a roda e o `touchmove` não passivos só ficam na `window` enquanto podem agir; o único scroll programático (recolher) é instantâneo.
3. **Estado parado para quem não tem animação:** no servidor, sem JavaScript, com reduced motion e antes de montar, fica a composição de p = 0 (fundo, quadro de 300 × 400 com o pôster, título e linha de apoio), sem a dica, com o conteúdo e os dois botões logo abaixo, e a página rola normalmente. É a mesma árvore React (ADR-004): a expansão só liga depois de montar, com `useCanAnimate()`, e o CSS de `prefers-reduced-motion: reduce` também força o parado. O `useCanAnimate()` lê a preferência pelo `matchMedia` e acompanha o evento "change" (o `useReducedMotion` do motion, usado antes, guardava o valor do 1º render e nunca atualizava): ligar o reduced motion no meio da visita solta a página e pausa o vídeo na hora, e a roda, o toque e as teclas ainda conferem a preferência na hora do evento. Os estados ficam em atributos da seção (`data-pin`, `data-expanded`, `data-progress`, `data-content`) para o CSS, os testes e o check:browser.
4. **Mídia só local** (ADR-008, CSP `img-src 'self' data:` e `media-src 'self'`): fundo e vídeo em `public/hero/expansao/`, com nomes e tamanhos fixos (a versão final substitui os arquivos sem mexer no código). Sem o `<iframe>` do YouTube e sem CDN. O vídeo segue o mecanismo do hero "video" (MASTER §9.6): sem `autoplay`, `play()` só por JavaScript com as cinco condições, controle de pausar (WCAG 2.2.2) e um vídeo por vez na página.
5. **Exceções de forma, só neste hero:** título centrado sobre a mídia, com sombra no texto (sem o véu de 0,86 da §9.1, com a condição de a mídia ser escura na faixa do texto, §3.4), raio de 16 px e sombra do quadro e as durações do componente (100, 200 e 700 ms). Fazem parte da animação que o dono pediu para manter.

**Consequências:** `siteConfig.heroVariant` passa a `"expansao"`; o "estudio" (sequência de quadros), o "video" e o "classic" seguem no código como variantes, e "Como funciona" com os 3 passos volta ao cartão do replay em Produtos (como em todo hero que não seja o "estudio"). Os testes cobrem o HTML do servidor, a hidratação com reduced motion ligado e desligado, roda, toque, teclado, âncora, foco e o vídeo; o `check:browser` tem um passo próprio do "expansao", num navegador de verdade, a 1440×900, 360×740 e 740×360: sem JavaScript, roda do mouse (o quadro cresce de fato, solta até Produtos e recolhe no topo), teclado, âncoras (o link da barra e /#contato direto terminam no alvo) e reduced motion (nunca prende, mesma altura). Ele também passou a reprovar quando a varredura das larguras não chega ao fim da página ou não fica lá (um hero preso a deixaria no topo) e quando um controle focado fica com opacidade efetiva abaixo de 0,5. A mídia provisória virou a final com os mesmos nomes em 15/10/2026, e o contraste do texto sobre ela foi conferido (MASTER §9.8). O título, a dica, a descrição da mídia e os nomes do controle esperam a aprovação do Thiago.

**Revisão de 16/10/2026** (achados confirmados dos revisores; a animação e os números do original não mudaram): a mídia voltou a não receber clique (como no original), e o foco nela não expande; a pinça, a página ampliada, a roda só de lado, as teclas com Shift e o menu aberto ficaram com o navegador; a roda e o `touchmove` saem da `window` longe do hero; o reduced motion ligado no meio da visita solta a página (o portão acompanha a preferência ao vivo); o Tab até o controle do vídeo não rola a página no celular (a faixa do FAB); o ícone do controle aparece com cores forçadas; até 360 px, as legendas deixam livre a coluna do controle; o quadro corta a mídia por baixo (`--hx-midia-pos: 50% 100%`); pausado, o vídeo mostra o quadro em que parou; o pôster é o LCP (`fetchpriority="high"`, e o fundo sem), e o vídeo vem com `preload="none"`; as legendas descem por `translate` (CLS 0). O `check:browser` passou a conferir as fórmulas do original em cada amostra da roda, o clique no quadro e o Tab até o controle, as cores forçadas, o 1.4.12 a 320 px e o toque de verdade (um dedo e a pinça). Na passada de mídia do mesmo dia (só recodificação a partir das matrizes sem perda, com os mesmos nomes), o WebM deixou de repetir quadros (VP9 crf 10: nenhum par de quadros seguidos idêntico, nem no recorte do vapor; emenda 249→0 de 55 dB; 378 KB, ainda abaixo do MP4) e os três AVIF passaram a 8 bits (crf 11, de 33% a 42% menores que os JPG, com o grão e sem faixas no esticamento de contraste de 4×; o pôster segue igual ao 1º quadro do vídeo). O caderno e a caneca nas bordas do quadro expandido em tablets em pé pedem nova renderização da cena e continuam pendentes. Ficaram para decisão do Thiago: o zoom de 200%/400% (a dica e a linha de apoio abaixo da tela presa), a instrução para quem usa teclado, o ponto de corte do celular (47,99em), a altura máxima do quadro sob a barra, o quadro colado na barra e o contorno do cartão em p = 0, a janela inclinada e os objetos repetidos durante a transição na mídia e a descrição da mídia.

**Sobre a homologação (v2.2), 16/10/2026:** o branch do hero recebeu a `homologacao` (a prévia v2.2, PR #7), e o "expansao" substitui o hero de marca B como padrão, por decisão do dono de 15/10. Fora do hero vale a v2.2: Produtos numa parede de 3 cartões (Replay, Rota de Vendas e Fleet Analytics BI), um link por produto na barra do topo, sem o estacionamento e sem os 3 passos do replay (então eles não voltam ao cartão, como dizia a consequência acima), Dúvidas antes do Contato e o fio como protótipo. Com o hero "expansao", o protótipo do fio não desenha: ele parte do símbolo do hero de marca (`.hero-estudio__quadro`), que este hero não tem; para vê-lo, `heroVariant = "estudio"`. Onde o fio começa com este hero fica para decisão do Thiago. No conteúdo que aparece com a expansão completa, o hero usa o texto aprovado do hero de marca (opção B: "Replay para quadras e aplicativos sob medida.", a frase e "Ver os produtos"), e a linha de apoio usa o sobretítulo dele ("Strukti Soluções, de João Pessoa"); `?hero=a` ou `?hero=c` troca os três depois de montar, como no "estudio", que segue como variante. O H1 "Tecnologia que trabalha em silêncio" e a dica continuam como proposta. Os atalhos de Produtos saíram (a barra já tem um link por produto), e o `aria-current` da barra passou a ler a posição dos cartões na tela: um alvo vale quando cruza a linha em que o clique na barra o deixa (o `scroll-padding-top` do html mais o `scroll-margin-top` dele, que nos cartões é maior) e, com os cartões lado a lado, vale o produto da âncora da URL (o que foi clicado), ou o primeiro do menu sem ela.

---

## ADR-011 — Catálogo de produtos em coverflow com painel; fictícios em produção; altura constante; barra "Produtos ▾"

**Data:** 22/10/2026
**Decisão de:** Thiago (cliente), com o Claude
**Status:** aceita (os textos novos dos 3 produtos reais são proposta, aguardando aprovação em `docs/landing-copy.md`; a rolagem interna do painel em telas pequenas e baixas espera a decisão do dono)
**Altera:** a v2.2 da home (Produtos deixa de ser a parede de 3 cartões com vídeo) e o `MASTER.md` (§8.8 reescrita, §6 e §3.4). Não altera a ADR-010: a única rolagem presa da página continua sendo a do hero.

**Contexto:** a seção Produtos tinha 3 cartões abertos, cada um com vídeo, selo, frase, etiquetas, legenda, descrição e botão. Com vários produtos a rolagem ficaria longa, e o dono quis mostrar a escala do catálogo (3 produtos reais hoje, muitos no futuro) com um movimento chamativo, na linguagem do hero "expansao". Ele trouxe como referência um "3D coverflow carousel" do 21st.dev. Spec: `docs/superpowers/specs/2026-10-16-catalogo-produtos-design.md` (entrevista Q1–Q41).

**Decisão:**
1. **Catálogo em coverflow com painel.** Fechado: um coverflow de cartões 2:3 (centro grande, 2 de cada lado girados), com filtro por tipo (Todos · Hardware · Aplicativos · Sites), setas, bolinhas e fundo ambiente. Aberto: o cartão do centro vira um painel horizontal (abas Visão geral · Como funciona · Telas), e os outros viram uma fita de miniaturas. Os 10 itens ficam em `src/content/catalogo.ts`; o conteúdo dos painéis também está no HTML do servidor (sem JS, uma fileira com `<details>`). Link direto `#slug` abre o painel; o voltar do navegador fecha. Nada gira sozinho, o vídeo do painel só toca no clique e o loop do cartão toca uma vez, por 5 s (WCAG 2.2.2).
2. **A referência do 21st.dev vale só como formato (ADR-005).** O componente não declara licença, então nenhum código dele entra. Também ficaram de fora, de propósito, três comportamentos dele: girar sozinho, capturar as setas do teclado na página inteira (aqui valem só com o foco dentro do carrossel) e carregar imagens de CDN externa (CSP, ADR-008). O coverflow é código próprio em CSS (`data-pos` → transform); o `motion/react` (ADR-002, já instalado) só faz a transformação cartão → painel. Nenhuma dependência nova (ADR-003).
3. **Os fictícios vão para produção, por decisão do dono.** Dos 10 itens, 7 são inventados, para mostrar a escala. Ficam com o selo "Em desenvolvimento" e `ficticio: true` nos dados (é o que se procura para trocar), sem o marcador `[A PREENCHER` (o `check:placeholders` só pode falhar nos 6 que já existiam). As telas são ilustrativas e dizem isso no `alt`. Os 3 produtos reais usam só fatos que já estavam na página: nada de cliente, quadra instalada ou resultado medido. A arte é provisória e a final entra com os mesmos nomes de arquivo, sem mexer no código.
4. **Altura constante.** A caixa do catálogo tem `clamp(600px, 80svh, 860px)` fechada, aberta e trocando, e nada abaixo se mexe (CLS 0); o `check:browser` mede o topo da seção seguinte. Exceções registradas na MASTER §8.8: telas muito baixas (paisagem de celular, zoom, espaçamento de texto) deixam a seção crescer (WCAG 1.4.10 e 1.4.12), e, abaixo de 768 px e em alturas de tela abaixo de ~800 px, a seção mantém a altura e o painel **rola por dentro** (emenda de 22/10, **aguardando o dono**). Encolher o vídeo ou recolher o texto no celular foi descartado.
5. **Barra do topo com "Produtos ▾".** Os três links de produto da v2.2 dão lugar a um botão de divulgação (disclosure, não `role="menu"`) com os produtos agrupados por tipo, e cada item abre o painel do produto. No Menu do celular vira uma sublista. Sem JS, a barra larga mostra um link "Produtos" para `#produtos`.

**Decisões de acessibilidade tomadas na construção:**
- O cartão é `<div role="group">` (o ARIA in HTML não permite `group` em `<article>`), e o carrossel se chama "Catálogo de produtos", para o rótulo do landmark não repetir o da `section#produtos`.
- As bolinhas de paginação encolhem até 24 px de largura em telas estreitas (WCAG 2.5.8); os 44 px ficam para setas, miniaturas e pílulas.
- Um lateral só entra na ordem de Tab se o centro dele cai no palco, fora das setas (que ficam por cima); abaixo de 768 px nenhum entra. O teclado mantém as setas, as bolinhas e ← →.

**Consequências:**
- A grade de vídeos da v2.2 (`Produtos.tsx`, `ProjectGrid.tsx`, `ReplayVideo.tsx` e a CSS `.project-card*`) foi removida. O `check:browser` ganhou a etapa do catálogo (sem JS, altura constante, teclado, âncora e voltar, movimento reduzido, loop de 5 s, um vídeo por vez, toque a 360 px, cores forçadas e 1.4.12 a 320 px), com mutações que provam que cada checagem falha com o catálogo quebrado, e a variável `CHECK_BROWSER_ETAPAS` para rodar só algumas etapas.
- O contraste da etiqueta de tipo e do selo no cartão do centro a 360×740 (2,16:1 com a arte provisória) foi corrigido na revisão final: o esmaecimento do texto ficou só no padding de cima, todo o texto está sobre um véu de pelo menos 0,8 (≥ 6,68:1 com qualquer arte) e a caixa rola por dentro em vez de passar do cartão (MASTER §3.4). A medida se repete com a arte final (`scripts/catalogo-arte/medir-contraste.mjs`).
- Pendências: a decisão do dono sobre a rolagem interna do painel; a aprovação dos textos novos dos reais; as capturas reais das telas; a arte final dos 10 itens; testes em Safari/iOS e Firefox de verdade; páginas próprias por produto (o `#slug` foi pensado para trocar de destino quando existirem); um interesse próprio para sites no formulário (pede mudança na validação do servidor).
