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
catálogo 21st.dev (o primeiro é o Container Scroll Animation, da Aceternity).
Esses componentes são publicados no padrão shadcn/Tailwind. Até aqui, o site
usa CSS simples (`src/app/globals.css`, com tokens em `:root`) e `style={}`
inline nos componentes de seção — não há Tailwind nem shadcn no projeto.

**Decisão:**
- Adotar Tailwind CSS v4 (`tailwindcss@4.3.3` + `@tailwindcss/postcss@4.3.3`,
  publicados em 2026-07-16, fora da janela de quarentena de 7 dias) e as
  convenções do shadcn: `components.json`, componentes de UI de terceiros em
  `src/components/ui/`, função `cn()` em `src/lib/utils.ts` (via `clsx` 2.1.1
  e `tailwind-merge` 3.7.0). O CLI `shadcn@4.21.0` fica fixado como
  devDependency para os próximos `npx shadcn add` (também fora da
  quarentena).
- **Adoção gradual:** os componentes de seção já existentes
  (`src/components/sections/*`, `Header`, `WhatsAppButton` etc.) continuam
  como estão, com `style={}` inline e as classes utilitárias do
  `globals.css` (`.container`, `.section`, `.section-title` …). Só os
  componentes novos vindos da 21st usam classes Tailwind. Não há migração
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
  `@tailwindcss/postcss`, `shadcn` (CLI), `clsx`, `tailwind-merge`. Não
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
