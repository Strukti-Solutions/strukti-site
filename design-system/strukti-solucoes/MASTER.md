# Design System — Strukti Soluções

> **Natureza deste arquivo:** referência de UX e de motion (checklist,
> timing, regras de acessibilidade). **Não é fonte de cores nem de
> tipografia** — isso vive em `src/app/globals.css` (tokens de cor) e
> `src/fonts/index.ts` (fonte). Se algo aqui conflitar com esses arquivos,
> **os arquivos do código vencem**. Gerado originalmente pela skill
> `ui-ux-pro-max` (paleta azul/laranja genérica de SaaS, fonte do Google em
> tempo de execução); reescrito à mão em 30/09/2026 com as decisões reais
> do projeto, depois de a revisão (Crivo) apontar a contradição.

---

**Projeto:** Strukti Soluções
**Categoria:** software house B2B, sob medida (não SaaS/produto) — ver
`CLAUDE.md`, "Conclusões da análise do negócio". Nicho: distribuidoras e
indústrias pequenas.
**Dial de movimento adotado:** sutil/padrão (fade + leve subida; sem
coreografia complexa, sem pin nem trava de rolagem).

---

## Cor

Fonte única: `src/app/globals.css`, bloco `:root`. Paleta azul-petroleo —
**nunca** a paleta azul/laranja genérica que a primeira geração deste
arquivo sugeriu.

| Token | Uso |
|---|---|
| `--color-petrol-900` … `--color-petrol-50` | Marca, títulos, texto de destaque, fundos de cartão/botão |
| `--color-ink` / `--color-ink-muted` | Texto de corpo |
| `--color-surface` / `--color-surface-alt` | Fundo das seções (`.section` / `.section--alt`) |
| `--color-border` / `--color-border-input` | Bordas decorativas (3:1 não exigido) / bordas funcionais de campo (WCAG 1.4.11, 3:1) |
| `--color-whatsapp` / `--color-whatsapp-hover` | Botão de WhatsApp |
| `--color-focus` | Contorno de foco (`:focus-visible`), ≥ 3:1 contra os fundos claros |

Componentes novos (vindos da 21st ou não) usam esses tokens por valor
arbitrário do Tailwind — `bg-[var(--color-petrol-900)]` — nunca hex solto.

## Tipografia

**Inter**, via `next/font/google` (`src/fonts/index.ts`), com
`display: "swap"` e variável `--font-inter`. O download acontece em tempo
de build e o arquivo fica auto-hospedado — **nenhuma requisição externa em
tempo de execução, nenhum `@import` de fonte**. Isso é uma regra do
projeto (CLAUDE.md: "nada de… fontes… carregados de fora sem decisão do
Claudinho"), não só uma preferência de estilo.

## Espaçamento

O projeto não usa uma escala de tokens `--space-*` dedicada; o espaçamento
vem das classes utilitárias existentes (`.section`, `.container`) e de
`style={}` inline por componente (ver ADR-001 sobre adoção gradual do
Tailwind). Não introduzir uma escala nova em paralelo.

---

## Padrão de página (landing)

Mapa real da página, não um genérico "Hero + Features + CTA":
Cabeçalho → Abertura (hero) → Problemas → Como a Strukti resolve → O que já
construímos (prova: o app Rota de Vendas) → Diagnóstico gratuito
(formulário) → Equipe → Dúvidas frequentes → Rodapé. Detalhe de texto e
ordem aprovados: `docs/landing-copy.md`.

**Chamada para ação:** sempre duas portas — WhatsApp (resposta imediata) e
diagnóstico gratuito (formulário) — nunca só uma. CTA de maior destaque
visual é sempre o WhatsApp.

---

## Motion

Biblioteca: `motion/react` (ADR-002) — **não GSAP**, apesar de a primeira
geração deste arquivo ter sugerido um trecho de GSAP; esse trecho foi
removido por não se aplicar ao projeto.

**Dois padrões, cobrindo todo o movimento do site hoje:**

1. **Revelação ao rolar e cartões em cascata** —
   `src/components/motion/Reveal.tsx` (`Reveal`, `RevealStaggerList`,
   `RevealStaggerItem`). Fade + leve subida (16px), ~0,4–0,45s,
   `ease: "easeOut"`, dispara uma vez (`viewport={{ once: true }}`). A
   árvore animada só aparece depois de montar no cliente (`useEffect`) —
   sem JavaScript, ou antes de montar, o conteúdo final aparece direto, sem
   transformação (ver ADR-004).
2. **Micro-interação de botão** — `src/lib/motion.ts` (`useTapHover`):
   `whileHover` (`scale: 1.03`, leve subida) e `whileTap` (`scale: 0.96`),
   150ms. Usado em `WhatsAppButton`, `FloatingWhatsApp` e nos CTAs
   principais — o WhatsApp é sempre o que mais chama a atenção.

**Efeito scroll-linked (`src/components/ui/scroll-tilt-card.tsx`, Seção
4):** única exceção com valores que seguem o progresso do scroll
(`useScroll`/`useTransform`), não um disparo único — cartão que entra
inclinado em 3D e fica reto no centro da tela, com o título subindo. Código
próprio (ADR-005). A redução de movimento aqui é **só CSS**
(`motion-reduce:` do Tailwind), nunca um `if` que troque a árvore React —
ver ADR-004 para o motivo (erro de hidratação).

### Regra de prefers-reduced-motion (vale para qualquer motion novo)

- Nunca ramificar a árvore React por `useReducedMotion()`/`matchMedia` no
  primeiro render (causa divergência SSR × cliente — ADR-004).
- Preferir CSS (`motion-reduce:`/`@media (prefers-reduced-motion: reduce)`).
  Quando não der, usar o portão de montagem do `Reveal` (árvore animada só
  depois de montar; antes disso, conteúdo final sem transformação).
- Nenhum motion pode esconder conteúdo de quem não tem JavaScript.

---

## Anti-padrões (não usar neste projeto)

- ❌ Emoji como ícone — usar SVG (o projeto já tem `WhatsAppIcon.tsx` como
  referência de ícone inline acessível).
- ❌ Elemento clicável sem `cursor: pointer` (links já herdam do browser;
  conferir em `<button>` customizado).
- ❌ Hover que desloca o layout (preferir `scale`/`translateY` pequenos,
  como no `useTapHover`, nunca mudar `width`/`height` no hover).
- ❌ Contraste abaixo de 4.5:1 no texto, abaixo de 3:1 em borda funcional
  ou contorno de foco.
- ❌ Mudança de estado instantânea sem transição (150–300ms).
- ❌ Foco invisível ao navegar pelo teclado.
- ❌ Fonte ou script de terceiro carregado em tempo de execução sem
  decisão do Claudinho (CLAUDE.md).
- ❌ Mensagem de produto pronto/"SaaS" — o posicionamento é sob medida.

## Checklist antes de entregar uma UI nova

- [ ] Sem emoji como ícone.
- [ ] `cursor: pointer` em todo elemento clicável.
- [ ] Hover/foco/toque com transição visível (150–300ms).
- [ ] Contraste conferido contra os tokens reais de `globals.css`.
- [ ] Foco visível e não cortado por `overflow: hidden` do elemento pai.
- [ ] `prefers-reduced-motion` respeitado — sem ramificar a árvore React
      (ADR-004).
- [ ] Funciona a 360px (celular) e sem rolagem horizontal.
- [ ] Conteúdo aparece sem JavaScript.
- [ ] Cor e fonte vêm de `globals.css`/`src/fonts/index.ts`, nunca de um
      valor novo solto.
