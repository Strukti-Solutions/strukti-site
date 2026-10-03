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

---

## ADR-008 — SEO técnico e cabeçalhos de segurança: SITE_URL, CSP com nonce, página 404

**Data:** 03/10/2026
**Decisão de:** Andaime (líder da frente, item 3 da P3), a pedido do
Claudinho; implementação do Ferrolho
**Status:** aceita

**Contexto:** o build avisava `metadataBase` ausente; faltavam
`sitemap.xml`, `robots.txt`, `manifest` completo e uma página 404 no visual
do site; a `Content-Security-Policy` em `next.config.ts` era mínima
(só `frame-ancestors`, `base-uri`, `form-action`, `object-src`). O domínio
de produção ainda não foi definido (`docs/landing-copy.md`, "Pendências");
inventar um valor não era opção.

**Decisão:**
- **`SITE_URL` sem hardcode** (`src/lib/siteUrl.ts`): usa `SITE_URL` do
  ambiente; sem ele, cai no `VERCEL_URL` automático da Vercel (preview ou
  produção) e, fora da Vercel, em `http://localhost:3000`. Usado em
  `metadataBase` (`layout.tsx`, com `alternates.canonical` e
  `openGraph.url` novos), `sitemap.ts` e `robots.ts`. Decisão de
  arquitetura, aprovada pelo Andaime — não depende do domínio final para
  funcionar; falta só setar `SITE_URL` na Vercel antes do lançamento
  (README, "Configuração").
- **`manifest.ts`** reaproveita `icon.svg` (vetorial, `sizes: "any"`, sem
  gerar PNG novo) e a cor `--color-navy-950` (`#08121d`) já usada no
  `viewport.themeColor` e no `opengraph-image`.
- **`robots.ts`** bloqueia `/api/` (inclui `/api/diagnostico`, que é rota,
  não página) e aponta pro `sitemap.xml`.
- **Página 404** (`not-found.tsx`): microcopy de interface aprovada pelo
  Andaime sem descer pro Claudinho (não é claim de marketing nem dado do
  negócio) — título "Página não encontrada", link de volta à raiz
  (`next/link`, 1º uso no projeto, que até aqui era página única) e o botão
  de WhatsApp já existente com a mensagem geral. Nada além disso (sem
  métrica, sem frase de venda). Texto em `landingContent.notFound`
  (`src/content/landing.ts`); testado em `not-found.test.tsx` (conteúdo +
  axe).
- **CSP com nonce por requisição** (`src/middleware.ts`, substituindo a CSP
  estática do `next.config.ts`, que não gera nonce): `script-src
  'nonce-…' 'strict-dynamic'`, sem `unsafe-inline` em script — segue o guia
  oficial do Next.js para CSP em App Router (o nonce no cabeçalho da
  resposta é detectado pelo próprio Next e aplicado aos scripts que ele
  injeta, sem precisar tocar em cada página). `style-src 'self'
  'unsafe-inline'`: `style={{...}}` do React (`privacidade/page.tsx`,
  `ComoResolvemos.tsx` e outras seções) vira atributo `style=""` literal no
  HTML do servidor, e CSP não tem nonce para atributo de estilo — isso
  também é o que o próprio exemplo oficial do Next.js recomenda. `media-src`
  e `font-src` ficam em `'self'` (vídeo e fonte Geologica self-hosted,
  nunca CDN externa); `img-src 'self' data:` cobre o ruído de fundo em SVG
  inline do `globals.css`. O middleware exclui `/api`, `_next/static`,
  `_next/image`, `favicon.ico` e requisições de prefetch (nonce diferente a
  cada uma quebraria o cache de prefetch do App Router).

**Consequência:** nenhum domínio foi inventado em código nem em conteúdo;
a pendência de publicação (`docs/landing-copy.md`) passa a cobrir só o
texto que um humano lê (mensagem de compartilhamento da equipe, `og:url`
de `landingContent.seo`), não mais o funcionamento técnico. A CSP mais
restritiva depende de verificação com `npm run check:browser` (vídeo do
hero, vídeo do portfólio e menu) antes de ir para revisão — ver
`FILA_PESADA.md` para a vez do pesado na máquina.
