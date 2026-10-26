# Hero com entrada pelo notebook — protótipo cinza (fase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a mecânica completa da entrada pelo notebook (expansão até a tela cheia → pausa → aproximação até a tela do aparelho virar a página, reversível, notebook deitado e celular em pé), com a sala atual como fundo e o aparelho em caixas cinza, para o dono testar e acertar os números antes da arte (spec §11.1).

**Architecture:**
- **Variante nova.** O protótipo entra como a variante de hero `"notebook"`. O `ScrollExpandMedia` ganha um modo `entrada`, ligado só por essa variante; sem a prop, ele se comporta exatamente como hoje. O `"expansao"` em produção, os testes dele e a etapa `expansao` do `check:browser` não mudam.
- **Câmera em JS, efeito no CSS.** Toda a conta de câmera fica num módulo puro (`src/lib/heroEntrada.ts`). O `paint()` só escreve variáveis CSS, e o CSS do modificador `.hero-expansao--entrada` as aplica com `transform`, `opacity` e `filter`.
- **A tela é o bloco de chamada atual.** O `.hero-expansao__conteudo` continua no fluxo, logo abaixo do palco e dentro da `<section>`. A altura do hero não muda entre estados. Durante a cena, ele é puxado para cima e reduzido para dentro do aparelho. Na liberação, o hero rola até o topo dele no mesmo quadro em que tira o `transform` (caminho "B" do mapa).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, CSS em `src/app/globals.css`, vitest + jsdom + testing-library, `scripts/check-browser.mjs` (CDP no Edge headless).

**Spec:** `docs/superpowers/specs/2026-10-23-hero-entrada-notebook-design.md`

## Global Constraints

- Branch `feat/hero-notebook`. Commits em português (`feat(hero): …`, `test(hero): …`), com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push: o dono testa no dev server local.
- Sem dependência nova (ADR-003), sem 3D, sem código de terceiros novo (ADR-005), mídia só local (ADR-008).
- Uma árvore React só (ADR-004). Movimento reduzido ao vivo por `useCanAnimate()`. Nada lê `innerWidth`, `innerHeight`, orientação ou caixas no primeiro render: só depois de montar (hidratação).
- A variante `"expansao"` fica intacta: `HeroExpansao.test.tsx` e a etapa `expansao` do `check:browser` verdes, sem edição.
- Rolagem programática sempre com `behavior: "instant"` (o `html` tem `scroll-behavior: smooth`).
- Nenhum `requestAnimationFrame` perpétuo: só pede quadro quando o desenhado muda (o `settle()` dos testes lança erro em 200 quadros pendentes).
- Larguras pela seção ou pelo palco (`clientWidth`, `%`, `cqw`), nunca `100vw`: com a barra de rolagem clássica, `100vw` passa a janela útil em ~15 px.
- O texto do bloco de chamada e do h1 não muda (spec §12). O `mediaAlt` antigo ("caderno") fica, como pendência da fase de arte.
- Os números da spec §3–§4 são pontos de partida, num objeto só (`ENTRADA`), para o dono afinar: `E = 0,54`, `Pa = 0,08`, ganhos ÷ 1,85, zoom máximo da sala 1,45, desfoque máximo 10 px, metades do título fora até `a = 0,5`.
- Gates de cada task: `npm run typecheck`, `npm run lint`, `npx vitest run --maxWorkers=2`. O `check:browser` só na Task 5, com um dev server só (memória curta; feche no fim).

## Review Focus

1. **Barra de rolagem clássica e zoom de 125%:** em `P = 1`, a tela cobre exatamente a área útil da janela (±1 px), sem faixa nem deslocamento. Fixado pela Task 1 (geometria pela largura útil) e pela Task 5 (1366×768 com barra, `deviceScaleFactor` 1,25).
2. **Voltar pela barra de rolagem ou pelo Home do navegador** com o hero expandido (`0 < scrollY < altura do palco`): nunca aparece o palco "gigante" sem a tela. A rolagem para cima abaixo do topo da tela recolhe e prende em `P = 1`, sem salto visível. Tasks 2 e 5.
3. **Redimensionar ou girar no meio da cena:** a geometria é recalculada no próximo quadro, a tela continua alinhada ao aparelho, e a troca notebook ↔ celular segue a orientação nova. Tasks 2 e 5.
4. **Tab até um botão da tela com `P < 1`:** a entrada se completa na hora (transição "auto"), sem rolagem dupla, com o foco visível e não coberto pela barra. Tasks 2 e 5.
5. **Carregar com `/#contato` ou com a posição de rolagem restaurada:** começa "dentro", sem salto de altura e sem o vídeo da sala tocando escondido. Tasks 2 e 5.

---

### Task 1: Geometria e câmera (módulo puro)

**Files:**
- Create: `src/lib/heroEntrada.ts`
- Test: `src/lib/heroEntrada.test.ts`

**Interfaces:**
- Produces:
  - `ENTRADA` (constantes):
    - fases: `E`, `Pa`;
    - `ganho` (o divisor 1,85);
    - `salaZoomMax` (1,45) e `salaBlurMax` (10);
    - `tituloSaidaAte` (0,5) e `tituloFolga` (24, em px);
    - `midia: { w: 1280, h: 720, posX: 0.5, posY: 1 }`;
    - `aparelho`: `{ deitado: { cx: 640, cy: 300, largura: 360 }, emPe: { cx: 640, cy: 330, largura: 120 } }`, em pixels da mídia 1280×720. O centro e a largura da tela do aparelho na cena são os valores do protótipo; a arte da fase 2 os confirma;
    - `quadroInicial: { w: 300, h: 400 }`.
  - `type Viewport = { w: number; h: number; emPe: boolean }`.
  - `fases(p: number): { e: number; a: number }`: `e = clamp(p / E)` e `a = clamp((p − E − Pa) / (1 − E − Pa))`.
  - `suave(x: number): number`: o smoothstep `x²(3 − 2x)`. É a curva `ease-in-out` da aproximação (§4).
  - `quadro(e: number, v: Viewport): { w: number; h: number }`: `w = 300 + e·(v.w − 300)` e `h = 400 + e·(v.h − 400)`. O fim é exatamente a área útil.
  - `telaNaCena(e: number, v: Viewport): { cx: number; cy: number; s: number }`: o centro da tela do aparelho em px da janela e a escala dela (largura da tela ÷ `v.w`). Sai do retângulo do quadro centrado na janela, com a mídia em `object-fit: cover` e `object-position: posX posY`, como o CSS faz hoje (`--hx-midia-pos: 50% 100%`).
  - `camera(p: number, v: Viewport): Camera`, com `type Camera = { e; a; k; tela: { cx; cy; s }; sala: { z; ox; oy; tx; ty; blur }; titulo: { saida } }`:
    - `k = suave(a)`;
    - a tela parte de `telaNaCena(e, v)` e chega a `{ cx: v.w/2, cy: v.h/2, s: 1 }`. O centro anda linear em `k`, e a escala anda multiplicativa: `s = s0^(1−k)`;
    - a sala amplia em volta do centro da tela na pausa (`ox`, `oy`) por `z = salaZoomMax^k`, com `tx, ty = (centro da janela − centro da tela) · k`;
    - `blur = salaBlurMax · k`;
    - `titulo.saida = clamp(a / tituloSaidaAte)`.
  - `posicaoDoTitulo(v: Viewport, larguras: [number, number]): [number, number]`: o deslocamento X, em px, de cada metade na pausa. A linha 1 termina `tituloFolga` à esquerda da borda da tela do aparelho, e a linha 2 começa `tituloFolga` à direita dela. Com larguras zeradas (jsdom), devolve `[0, 0]`.

- [ ] **Step 1: Escrever os testes que falham** em `src/lib/heroEntrada.test.ts` (ambiente `node`):
  - `fases`:
    - `fases(0)` = `{e:0, a:0}`;
    - `fases(ENTRADA.E)` = `{e:1, a:0}`;
    - `fases(ENTRADA.E + ENTRADA.Pa)` = `{e:1, a:0}` (a pausa não move nada);
    - `fases(1)` = `{e:1, a:1}`;
    - é monotônica em 101 amostras.
  - `suave`: `suave(0)=0`, `suave(1)=1` e `suave(0.5)=0.5`, com derivada ~0 nas pontas (`suave(0.01) < 0.001`).
  - `quadro`: `quadro(1, {w:1351, h:768, emPe:false})` = `{w:1351, h:768}` (1366 menos a barra) e `quadro(0, …)` = `{w:300, h:400}`.
  - Tela no fim: para `{w:1440,h:900}`, `{w:1351,h:768}` deitados e `{w:390,h:844}` em pé, `camera(1, v).tela` = `{cx: v.w/2, cy: v.h/2, s: 1}` (`toBeCloseTo`, 6 casas). É a promessa central: no fim, a tela é a janela.
  - Continuidade: entre `p = E` e `p = E + Pa`, `camera(p, v).tela` não muda. Entre dois `p` vizinhos (passo 0,001), `cx`, `cy` e `s` não saltam mais de 1% de `v.w`.
  - Tela dentro do quadro: em `e = 0`, `0,5` e `1`, o retângulo da tela (`s·v.w` × `s·v.h`, centrado em `cx, cy`) fica inteiro dentro do retângulo de `quadro(e, v)` centrado na janela, nos três viewports.
  - Em pé usa `aparelho.emPe`, e deitado usa `aparelho.deitado`: os `s` em `p = E` diferem.
  - `posicaoDoTitulo(v, [0, 0])` = `[0, 0]`. Com larguras `[400, 300]` a 1440×900, a borda direita da linha 1 fica em `tela.cx − tela.s·v.w/2 − 24` (±0,5).
- [ ] **Step 2: Rodar e ver falhar:** `npx vitest run src/lib/heroEntrada.test.ts`. Esperado: FAIL, porque o módulo não existe.
- [ ] **Step 3: Implementar** `src/lib/heroEntrada.ts` com as assinaturas acima. Sem dependência de DOM nem de React. O cover da mídia é `m = max(qw/1280, qh/720)`, com a origem do conteúdo em `((qw − 1280m)·posX, (qh − 720m)·posY)` dentro do quadro.
- [ ] **Step 4: Rodar e ver passar:** o mesmo comando, PASS.
- [ ] **Step 5: Commit:** `feat(hero): geometria e câmera da entrada pelo notebook (módulo puro)`.

### Task 2: Modo `entrada` no `ScrollExpandMedia`

**Files:**
- Modify: `src/components/ui/scroll-expansion-hero.tsx`
- Test: `src/components/ui/scroll-expansion-entrada.test.tsx` (novo; copie o relógio falso de rAF, a `matchMedia` falsa e os helpers `wheel`, `key`, `touch` e `scrollPage` de `src/components/sections/HeroExpansao.test.tsx`, e estenda a `matchMedia` falsa para casar `(orientation: portrait)` com um `set()` próprio)

**Interfaces:**
- Consumes: `ENTRADA`, `camera`, `posicaoDoTitulo`, `type Viewport` (Task 1).
- Produces:
  - **Prop nova:** `entrada?: { aparelho: ReactNode }`. Sem ela, o componente não muda nada (os testes do `"expansao"` provam).
  - **Com `entrada`:**
    - a section ganha a classe `hero-expansao--entrada`;
    - o `aparelho` é renderizado dentro de `.hero-expansao__quadro`, depois da mídia, num `div.hero-expansao__aparelho[aria-hidden="true"]`;
    - `data-content` fica sempre `"visible"` (sai a regra do 0,75 neste modo);
    - `data-orientacao="deitado" | "em-pe"` só depois de montar.
  - **Variáveis CSS que o `paint()` escreve** neste modo, além de `--hx-p`:
    - `--hx-e` e `--hx-k`;
    - `--hx-tela-x` e `--hx-tela-y` (canto superior esquerdo da tela, em px da janela: `cx − s·v.w/2` e `cy − s·v.h/2`) e `--hx-tela-s`;
    - `--hx-sala-z`, `--hx-sala-ox`, `--hx-sala-oy`, `--hx-sala-tx`, `--hx-sala-ty` e `--hx-sala-blur` (px);
    - `--hx-quadro-w` e `--hx-quadro-h` (px);
    - `--hx-linha1-x`, `--hx-linha2-x` (px, a pose da pausa) e `--hx-titulo-saida`.
  - **Viewport:** `v = { w: section.clientWidth || innerWidth, h: palco.clientHeight || innerHeight, emPe: matchMedia("(orientation: portrait)").matches }`. É medido ao montar, no `resize` e no `change` da orientação, e cada mudança pede um quadro.
  - **Ganhos ÷ `ENTRADA.ganho`** na roda e no toque. O teclado continua por `P` total (`KEY_LINE` 0,1 e `KEY_PAGE` 0,34), para não pedir 18 setas.
  - **Liberação (caminho B):** quando o desenhado chega a 1, no mesmo quadro:
    1. `section.dataset.expanded = "true"` (síncrono, antes do React);
    2. `window.scrollTo({ top: palco.offsetHeight, left: 0, behavior: "instant" })`.
  - **Volta:**
    - expandido, a roda para cima, o arrasto para baixo e as teclas de subir com `scrollY ≤ palco.offsetHeight + TOP_SLOP_PX` recolhem: `dataset.expanded = "false"` e `scrollTo(0)` no mesmo quadro, com `P` em 1;
    - expandido, um `scroll` para `scrollY < palco.offsetHeight − TOP_SLOP_PX` (barra de rolagem ou Home do navegador) recolhe do mesmo jeito.
  - **Montagem e âncora:**
    - `scrollY ≥ altura do palco`, ou `hashTargetOutside`: começa em `P = 1`, expandido, sem rolar;
    - `0 < scrollY <` altura do palco: `P = 1`, expandido e `scrollTo(altura do palco)`;
    - `scrollY = 0`: preso em `P = 0`.
  - **`syncHoldListeners`:** os ouvintes ficam na window enquanto `!expanded || scrollY ≤ palco.offsetHeight + innerHeight`.
  - **Foco:** o `onFocus` atual da `<section>` (foco num botão da tela com `P < 1` chama `setProgress(1, "auto")`) continua e passa a liberar também.

- [ ] **Step 1: Escrever os testes que falham** em `scroll-expansion-entrada.test.tsx`, montando `<ScrollExpandMedia entrada={{ aparelho: <div className="cinza" /> }} …>` com um bloco filho (h2 e dois links):
  1. **SSR:** a section tem `hero-expansao--entrada`, há um só `.hero-expansao__aparelho[aria-hidden=true]` dentro de `.hero-expansao__quadro`, `data-content="visible"` e nenhum `data-orientacao`.
  2. **Montado:** `--hx-p` é 0, `--hx-tela-s` é > 0 e < 1, e `data-orientacao` é `"deitado"`.
  3. **Ganho:** `ceil(1429 · 1,85 / 100)` cliques de roda de 100 px expandem, e um a menos não expande (≈ 27 e 26).
  4. **Pausa:** com `P` entre `E` e `E + Pa`, `--hx-tela-s` não muda entre dois cliques.
  5. **Liberação:** no quadro em que o desenhado chega a 1, `dataset.expanded === "true"` e `scrollTo` foi chamado com `{ top: palcoAltura, left: 0, behavior: "instant" }`. Stube `offsetHeight` do palco com 768.
  6. **Volta pela roda:** expandido, `setScrollY(768)` e `wheel(-100)` dão `expanded "false"`, `scrollTo({ top: 0, … })` e `data-progress "1.00"`, e mais 3 cliques para cima fazem `P` cair.
  7. **Volta pela barra de rolagem (Review Focus 2):** expandido, `scrollPage(300)` dá `expanded "false"`, `scrollTo({ top: 0 })` e `P` em 1.
  8. **Montagem com âncora (Review Focus 5):**
     - `location.hash = "#fora"` (com `<div id="fora">` fora da seção): expandido, sem `scrollTo`;
     - `setScrollY(300)` antes de montar: expandido e `scrollTo({ top: 768 })`.
  9. **Foco (Review Focus 4):** com `P = 0`, focar o link do bloco dá `data-input "auto"`, expandido e um `scrollTo` só.
  10. **Resize e orientação (Review Focus 3):** mudar o `clientWidth` da seção, disparar `resize` e chamar `frame()` muda `--hx-tela-x`. Com `orientation.set(true)` e `frame()`, `data-orientacao` vira `"em-pe"` e `--hx-tela-s` muda.
  11. **Movimento reduzido:** `--hx-p` ausente, `data-pin "false"` e nenhuma variável `--hx-tela-*` escrita.
  12. **Desmontar:** cancela o quadro pendente, e não sobra ouvinte de `resize` (espione `removeEventListener`).
- [ ] **Step 2: Rodar e ver falhar:** `npx vitest run src/components/ui/scroll-expansion-entrada.test.tsx`. Esperado: FAIL (a prop não existe).
- [ ] **Step 3: Implementar** o modo no componente:
  - **Fluxo do quadro:** os ramos do modo partem de `const entrada = Boolean(props.entrada)`. O `paint()` chama `camera(progressRef.current, viewportRef.current)` e escreve as variáveis. `viewportRef` e as larguras das linhas do título (`offsetWidth` das duas `.hero-expansao__linha`) são medidos num `useEffect` depois de montar, de novo no `resize` e no `change` da orientação.
  - **Isolamento:** sem `entrada`, nenhum caminho novo roda.
  - **Comentário de cabeçalho:** atualizar no estilo do arquivo, com a lista "Mudanças" ganhando o item do modo `entrada`.
- [ ] **Step 4: Rodar e ver passar:**
  - `npx vitest run src/components/ui/scroll-expansion-entrada.test.tsx src/components/sections/HeroExpansao.test.tsx`: PASS, com o `HeroExpansao.test` sem nenhuma edição;
  - depois os gates completos.
- [ ] **Step 5: Commit:** `feat(hero): modo entrada no ScrollExpandMedia (três fases, liberação no topo da tela, volta)`.

### Task 3: CSS do modo `entrada` e o aparelho cinza

**Files:**
- Create: `src/components/sections/AparelhoCinza.tsx`
- Modify: `src/app/globals.css`, num bloco novo `/* Hero "entrada" (protótipo) */` logo depois do bloco do hero "expansao"
- Test: `src/components/sections/AparelhoCinza.test.tsx`

**Interfaces:**
- Consumes: as variáveis CSS e os atributos da Task 2.
- Produces:
  - `AparelhoCinza()` devolve `.aparelho-cinza` com dois filhos: `.aparelho-cinza__notebook` (com `__tampa` e `__base`) e `.aparelho-cinza__celular` (com `__corpo` e `__suporte`). O CSS mostra um ou outro por `(orientation: portrait)`. São caixas cinza: a moldura é uma borda em volta do retângulo da tela, e o miolo fica transparente, porque a tela de verdade é o `.hero-expansao__conteudo` por cima.
  - **Ordem de empilhamento** no modo, sem criar contexto no palco:
    - `__midia` 1 e `__aparelho` 2 (dentro do quadro);
    - `.hero-expansao__conteudo` 3;
    - `__titulo` 4 e `__controle` 5;
    - a `.topbar` continua com 50.

As regras do CSS, todas sob `.hero-expansao--entrada`:

1. **Quadro:**
   - largura e altura vêm de `var(--hx-quadro-w)` e `var(--hx-quadro-h)`, com o 300×400 de hoje como valor padrão;
   - `border-radius` e sombra vão a 0 com `--hx-e`;
   - sem os limites de 95vw, 85vh e da barra;
   - o palco ganha `overflow: clip`.
2. **Sala:** pôster e vídeo levam `transform-origin: var(--hx-sala-ox) var(--hx-sala-oy)`, `translate(var(--hx-sala-tx), var(--hx-sala-ty)) scale(var(--hx-sala-z))` e `filter: blur(var(--hx-sala-blur))`. Ficam presos ao quadro, então nada vaza.
3. **Fundo de fora:** opacidade `1 − var(--hx-e)`.
4. **Tela** (`.hero-expansao__conteudo`):
   - `min-height: 100svh`, o conteúdo centrado e fundo próprio `var(--surface)`;
   - a `.container` interna mantém o padding de hoje;
   - armada e não expandida: `transform-origin: 0 0` e `transform: translate(var(--hx-tela-x), calc(var(--hx-tela-y) − var(--hx-palco-h))) scale(var(--hx-tela-s))`, com `--hx-palco-h` igual à altura do palco (100svh);
   - com `[data-expanded="true"]`: `transform: none`;
   - sem ponteiro só com `[data-pin="true"]:not([data-progress="1.00"])`.
5. **Aparelho:** posicionado pelo mesmo retângulo da tela, com a borda da moldura para fora do retângulo e a base ou o suporte abaixo.
6. **Título:** `.hero-expansao__linha--1` com `translateX(calc(var(--hx-e) * var(--hx-linha1-x) − var(--hx-titulo-saida) * 60vw))`, a `--2` simétrica, e `opacity: calc(1 − var(--hx-titulo-saida))`. A data e a dica saem como hoje, por `--hx-e`.
7. **Estado parado:** com `@media (scripting: none)`, ou com `(prefers-reduced-motion: reduce)`, ou antes de montar sem `data-pin` e `data-expanded`, vale a pose da pausa:
   - quadro em 100% do palco e sem raio, e fundo de fora apagado;
   - aparelho e tela na posição da pausa, só com CSS (valores padrão das variáveis, `--hx-tela-s` na proporção da pausa a 1440×900);
   - a tela sem `transform`, no fluxo, abaixo da cena (spec §7);
   - com JS e movimento permitido, antes de montar, vale o cartão de 300×400 de hoje, para não haver salto ao armar.
8. **Transições:** `[data-input="key"|"auto"]` transicionam também as variáveis novas (`transform` e `filter` da sala, da tela, do aparelho e das linhas) em 300 ms `var(--ease-out)`, dentro de `@media (prefers-reduced-motion: no-preference)`.
9. **Cores forçadas:** a moldura do aparelho e a borda da tela com `outline: 2px solid CanvasText`.
10. **Barra do topo sobre a cena (Q9):** a partir de 75em, com `:root:has(.hero-expansao--entrada[data-pin="true"]) .topbar`, a barra usa as mesmas regras da cápsula do `[data-scrolled="true"]`, mesmo com `scrollY = 0`. Abaixo de 75em, a faixa opaca continua (o painel do Menu depende dela). O conteúdo da tela, centrado em 100svh, fica com o topo sob a barra, e isso é aceito.

- [ ] **Step 1: Escrever os testes que falham** em `AparelhoCinza.test.tsx`:
  - o SSR do `AparelhoCinza` tem os quatro ganchos (`__notebook`, `__tampa`, `__base`, `__celular`) e nenhum texto nem focável;
  - lido como texto, o `globals.css` tem, dentro do bloco `Hero "entrada"`, as regras:
    - `.hero-expansao--entrada[data-expanded="true"] .hero-expansao__conteudo` com `transform: none`;
    - o seletor de `pointer-events: none` exatamente como no item 4;
    - `@media (scripting: none)`;
    - `forced-colors`;
    - e nenhum `100vw` dentro do bloco.
- [ ] **Step 2: Rodar e ver falhar:** `npx vitest run src/components/sections/AparelhoCinza.test.tsx`.
- [ ] **Step 3: Implementar** o componente e o bloco de CSS.
- [ ] **Step 4: Rodar e ver passar,** depois os gates completos.
- [ ] **Step 5: Commit:** `feat(hero): CSS do modo entrada e aparelho cinza (notebook e celular)`.

### Task 4: Variante `"notebook"`

**Files:**
- Create: `src/components/sections/HeroNotebook.tsx`
- Modify:
  - `src/config/site.ts`: o tipo `HeroVariant` ganha `"notebook"`, e `siteConfig.heroVariant` passa a `"notebook"` neste branch;
  - `src/app/page.tsx`: entrada `notebook → HeroNotebook` no `HERO_SECTIONS`;
  - as listas de variantes escritas à mão em `src/app/page.test.tsx`, `src/app/page.hydration.test.tsx` e `src/app/page.axe.test.tsx`;
  - o `check:browser` mapeia a variante: a etapa `expansao` só roda com `"expansao"`.
- Test: `src/components/sections/HeroNotebook.test.tsx`

**Interfaces:**
- Consumes: `ScrollExpandMedia` com `entrada` (Task 2) e `AparelhoCinza` (Task 3).
- Produces: `HeroNotebook()`. É o `HeroExpansao` com `entrada={{ aparelho: <AparelhoCinza /> }}`: mesmas props, mesma mídia, mesmo provedor de vídeo, mesmos filhos (h2, `.lead`, "Ver produtos", WhatsApp) e o mesmo `id="inicio"`.

- [ ] **Step 1: Escrever os testes que falham:**
  - `HeroNotebook.test.tsx`:
    - um só h1 `#hero-title`;
    - o h2, o link `#produtos` e o link do WhatsApp dentro de `#inicio`, em `.hero-expansao__conteudo`;
    - a section tem `hero-expansao--entrada`;
    - a ordem no DOM é `.hero-expansao__controle` antes de `.hero-expansao__conteudo` (o Tab chega ao controle do vídeo antes dos botões da tela).
  - Nos testes de página, `"notebook"` entra nas listas de variantes: a ordem `main > section[id]`, um só h1, os botões dentro de `#inicio`, hidratação sem divergência (com movimento reduzido ligado e desligado) e axe sem violações.
- [ ] **Step 2: Rodar e ver falhar:** `npx vitest run src/components/sections/HeroNotebook.test.tsx src/app`.
- [ ] **Step 3: Implementar** o componente e as entradas de variante.
- [ ] **Step 4: Rodar e ver passar,** depois os gates completos.
- [ ] **Step 5: Commit:** `feat(hero): variante notebook (protótipo cinza) como padrão do branch`.

### Task 5: Etapa `entrada` no `check:browser` e entrega para o teste do dono

**Files:**
- Modify: `scripts/check-browser.mjs`: etapa nova `entrada` em `ETAPAS_CONHECIDAS`, que roda só com `main[data-hero-variant="notebook"]`.

**Interfaces:**
- Consumes: os ganchos das Tasks 2 e 3 (`.hero-expansao--entrada`, `data-pin`, `data-expanded`, `data-progress`, `data-orientacao`, `--hx-p` e `.hero-expansao__conteudo`) e o `expSettle` existente.

A etapa roda a 1440×900, a 1366×768 com a barra de rolagem clássica (sem `hide-scrollbars`), a 1366×768 com `deviceScaleFactor` 1,25 e a 390×844 em pé (toque emulado). Ela confere:

1. **Sem JS:** a pose da pausa em tela cheia. O h1 está à vista, a tela está no fluxo abaixo da cena, e a altura do hero é igual à com JS (±2 px).
2. **Roda até expandir:** `data-progress` só sobe. Entre `E` e `E + Pa`, o retângulo da tela não muda (±1 px). Não há rolagem horizontal, e o palco fica preso.
3. **No quadro da liberação:** o `getBoundingClientRect()` da tela é igual a `{0, 0, clientWidth, innerHeight}` (±1 px) e `scrollY` é igual à altura do palco (Review Focus 1).
4. **Volta:** a roda para cima recolhe sem salto (o retângulo da tela igual ao da janela ±1 px antes e depois). Depois, `P` volta a 0 pelo mesmo caminho.
5. **Barra de rolagem:** expandido, `window.scrollTo(0, palco/2)` recolhe em `P = 1`, e o palco nunca aparece sem a tela (Review Focus 2).
6. **Resize:** no meio da aproximação, mudar o viewport de 1440×900 para 1100×900 mantém o retângulo da tela dentro da moldura do aparelho (±1 px) (Review Focus 3).
7. **Tab:** do topo até o 1º botão da tela, o controle do vídeo vem antes. Ao focar o botão, a entrada se completa em menos de 500 ms, `scrollY` muda uma vez só e o foco não fica coberto pela barra (Review Focus 4).
8. **Carga com âncora:** com `/#contato` e com `scrollY` restaurado, a página começa expandida, sem salto do alvo, e o vídeo da sala está pausado (Review Focus 5).
9. **Em pé:** `data-orientacao="em-pe"` e o aparelho é o celular. Os passos 3 e 4 valem a 390×844.

- [ ] **Step 1: Escrever a etapa.** Com outra variante, ela imprime "passo pulado". Neste branch (variante `"notebook"`), ela roda.
- [ ] **Step 2: Rodar:** um dev server só (`npm run dev`), depois `CHECK_BROWSER_ETAPAS=larguras,entrada npm run check:browser`. Esperado: exit 0. Corrija o que reprovar nas Tasks 1–3, com teste.
- [ ] **Step 3: Rodar o `check:browser` completo:** exit 0. As etapas `expansao` e `catalogo` imprimem "pulado" ou passam.
- [ ] **Step 4: Commit:** `test(hero): etapa entrada no check:browser (alinhamento, volta, Tab, âncora, em pé)`.
- [ ] **Step 5: Entrega:** deixe o dev server no ar em `localhost:3000` e passe ao dono:
  - a lista dos números de `ENTRADA` que ele pode pedir para mudar: velocidade, pausa, zoom e desfoque da sala, ponto de saída do título e tamanho do aparelho;
  - a decisão pendente da Q25: o texto cintila ou não no Chrome e no Firefox com o mouse.
