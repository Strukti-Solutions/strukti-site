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
