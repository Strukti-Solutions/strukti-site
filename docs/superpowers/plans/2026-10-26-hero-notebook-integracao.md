# Hero com entrada pelo notebook — Fase 3 (integração) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o hero "notebook" para o PR em `homologacao`. Isso inclui as pendências pequenas de código, o LCP e as duas variantes conferidas num navegador de verdade, e a documentação (ADR-010, MASTER §9.8, README, avisos de terceiros) alinhada ao código.

**Architecture:** Sem mecânica nova. A fase fecha o que as fases 1 e 2 deixaram estacionado e põe no `check:browser` as garantias da §9 da spec que ainda não têm teste: o LCP é o pôster, e o "expansao" de produção continua passando. A documentação descreve o que o código faz hoje, com os números lidos do `ENTRADA`.

**Tech Stack:** Next.js 15.5 (App Router), React 19, TypeScript, CSS BEM em `src/app/globals.css`, vitest + jsdom, `scripts/check-browser.mjs` (CDP, Edge headless).

**Spec:** `docs/superpowers/specs/2026-10-23-hero-entrada-notebook-design.md` (§9, §10, §11.3).

## Global Constraints

- **Decisões do dono (26/10/2026):**
  - `siteConfig.heroVariant` fica `"notebook"` no PR;
  - Q25 sem plano B (a tela fica HTML do começo ao fim);
  - as otimizações `78193e1` (pôster fora da pintura) e `b740f95` (base e suporte em imagem) ficam.
- **O "expansao" segue igual para quem o usa:**
  - não editar `scripts/hero-expansao/`, `public/hero/expansao/`, `siteConfig.heroExpansao` nem `HeroExpansao.test.tsx`;
  - CSS novo só sob `.hero-expansao--entrada`, com a única exceção da Task 1 (`--hx-fundo-degrade`, de valor computado idêntico).
- **Sem push, PR nem merge pelos agentes:** o push é do dono (o classificador bloqueia o do agente), e o PR só com a confirmação dele.
- **O dev server do dono em `:3000` fica no ar:**
  - nenhum agente mata processos `node`;
  - se ele cair, o agente reporta, e só o controlador sobe de novo;
  - um Edge por vez.
- **Arquivos fora do escopo:** não tocar em `AGENTS.md` nem em `.playwright-mcp/`, que estão fora do git.
- **Sem dependência nova** (ADR-003). Mídia só local (ADR-008).
- **Idioma:** português nos commits, comentários e documentos. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Buscas em arquivos grandes:** nada de `grep` com repetição limitada grande (`.{0,1500}`); um desses chegou a 8 GB.

## Review Focus

1. **Trocar a variante para `"expansao"`:** a etapa `expansao` do `check:browser` e a varredura inteira passam com o componente alterado. Isso nunca rodou neste branch (M4 da fase 1). Fica na Task 2.
2. **LCP com o hero "notebook":** o elemento do LCP a 1440×900 e a 390×844 é o pôster da cena, não o fundo de tela cheia nem o h1. Fica na Task 2.
3. **Teclado com a sala coberta:** com o foco no botão do vídeo quando a tela cobre a sala, o botão não some e o foco não cai no `body`. Fica na Task 1.
4. **Janela de tamanho 0** (iframe oculto, aba em segundo plano): `camera`, `telaNaCena` e `posicaoDoTitulo` não devolvem `NaN` (nada de `transform: scale(NaN)`). Fica na Task 1.
5. **Documentação × código:** os números citados na MASTER §9.8 e na ADR-010 batem com o `ENTRADA` e com o `globals.css` de hoje. Fica na Task 3, com uma conferência por `grep`.

---

### Task 1: Pendências pequenas de código

**Files:**
- Modify:
  - `src/app/globals.css`: a regra `.hero-expansao--entrada[data-coberta="true"] .hero-expansao__controle`; o degradê do pé do fundo nos blocos expansao (~:4130) e entrada (~:4584)
  - `src/lib/heroEntrada.ts`: `camera`, `telaNaCena`, `posicaoDoTitulo`
  - `scripts/hero-notebook/loop.js`: os comentários de `colunaDeVapor` e `gravaVapor`
  - `src/app/globals.css:4832` (`rgb(108 148 196 / 0.3)`, o filete do corpo do celular), `src/components/sections/AparelhoVetor.tsx` (`moldura()`), `src/components/sections/aparelhoVetor.json` e `scripts/hero-notebook/vetor.js`: a cor do filete passa a vir da arte
  - `scripts/hero-notebook/README.md`: a seção do `sondas.js`
- Test:
  - `src/components/ui/scroll-expansion-entrada.test.tsx`
  - `src/lib/heroEntrada.test.ts`
  - `src/config/heroNotebook.assets.test.ts`
  - `src/components/sections/AparelhoVetor.test.tsx`

**Interfaces:**
- Consumes: nada novo.
- Produces: `--hx-fundo-degrade`, a custom property do degradê do pé, definida uma vez e usada pelo expansao e pelo véu do entrada. A Task 3 a cita na MASTER.

- [ ] **Step 1: Testes que falham**
  - **Foco com a sala coberta**, em `scroll-expansion-entrada.test.tsx`, no describe `o controle do vídeo com a sala coberta`. Teste novo: `"com o foco nele, o controle não some ao cobrir (o foco não cai no body)"`.
    - Foca o controle, cobre a sala e espera `getComputedStyle(controle).visibility !== "hidden"` e `document.activeElement === controle`.
    - Ao tirar o foco (`blur`), espera `visibility === "hidden"`.
  - **Janela de tamanho 0**, em `heroEntrada.test.ts`: teste `"janela 0 × 0 não gera NaN"`. Para `p` em `[0, 0.3, 0.6, 1]` e `v = { w: 0, h: 0, emPe: false }` (e `emPe: true`), todo número de `camera(p, v)` e de `telaNaCena(0.5, v)` é `Number.isFinite`. Use o formato de `Viewport` que o arquivo já usa.
  - **Vídeo publicado**, em `heroNotebook.assets.test.ts` (m1 da revisão final): teste `"os vídeos publicados têm o tamanho do config e 10 s"`.
    - **MP4:** lê a largura e a altura do box `tkhd` (16.16 fixo nos últimos 8 bytes do box) e a duração do `mvhd` (`duration / timescale`). Espera `width`/`height` do `siteConfig.heroNotebook.midia` (1280 × 720) e de `midiaRetrato` (720 × 1280), e a duração entre 9,9 e 10,1 s.
    - **WebM:** acha os elementos EBML `PixelWidth` (ID `0xB0`) e `PixelHeight` (ID `0xBA`) e espera os mesmos tamanhos.
  - **Degradê compartilhado**, em `AparelhoVetor.test.tsx`, no describe do `globals.css`: teste `"o degradê do pé do fundo é um só (--hx-fundo-degrade)"`. O `globals.css` tem exatamente uma definição `--hx-fundo-degrade:`, e as duas regras de fundo (a do expansao e o `::after` do entrada) usam `var(--hx-fundo-degrade)`.
  - **Cor do filete**, em `AparelhoVetor.test.tsx`: teste `"o filete do corpo do celular vem do json"`.
    - O `style` do `.aparelho-vetor__celular` leva `--av-filete` com o valor de `celular.cores.filete` do `aparelhoVetor.json`.
    - A regra do filete no `globals.css` usa `var(--av-filete)`, sem `rgb(108 148 196`.

- [ ] **Step 2: Rodar e ver falhar**
  - Run: `npx vitest run src/components/ui/scroll-expansion-entrada.test.tsx src/lib/heroEntrada.test.ts src/config/heroNotebook.assets.test.ts src/components/sections/AparelhoVetor.test.tsx`
  - Expected: os 5 testes novos em FAIL. O de vídeo pode passar de primeira, porque os arquivos de hoje estão certos (conferidos com `ffprobe` na revisão final). Nesse caso, prove o RED trocando o tamanho esperado no próprio teste e desfazendo em seguida.

- [ ] **Step 3: Implementar**
  - **Foco:** a regra passa a `.hero-expansao--entrada[data-coberta="true"] .hero-expansao__controle:not(:focus)`. Coberto e com foco, o botão fica: é a escolha menos ruim, porque o rótulo pode virar "Tocar" sem tocar, mas o foco não se perde.
  - **Janela de tamanho 0:** em `heroEntrada.ts`, as funções tratam `w` ou `h` ≤ 0 como a janela 1 × 1, para não dividir por zero, sem mudar nenhum resultado com janela real.
  - **Degradê:**
    - `--hx-fundo-degrade` fica em `.hero-expansao`, com o valor literal de hoje (`linear-gradient(to bottom, rgb(8 18 29 / 0.1) 0%, rgb(8 18 29 / 0.1) 72%, var(--color-navy-950) 100%)`, copiado do bloco expansao como está);
    - as duas regras passam a usá-la.
  - **`loop.js`:** os comentários dizem o que a função faz hoje, nos dois enquadramentos.
  - **Filete:**
    - a cor (`rgb(108 148 196 / 0.3)`) vai para `celular.cores.filete`;
    - a `moldura()` a escreve como `--av-filete`;
    - o CSS usa a variável;
    - o `scripts/hero-notebook/vetor.js` grava o mesmo campo no json, senão o `cena.test.ts`, que confere o json contra a saída do `vetor.js`, quebra.
  - **README:** o `sondas.js` fica marcado como da pose antiga, e o README indica `sonda-rapida.js --caixas` como a medida que vale.

- [ ] **Step 4: Rodar e ver passar, mais os gates**
  - Run: `npx vitest run --maxWorkers=2`, `npm run typecheck` e `npm run lint`.
  - Expected: tudo verde.

- [ ] **Step 5: Commits pequenos**
  - Um por item, por exemplo `fix(hero): controle do vídeo fica à vista com o foco nele, mesmo com a sala coberta`.

---

### Task 2: LCP e as duas variantes no navegador

**Files:**
- Modify: `scripts/check-browser.mjs`, na etapa `entrada`, com um passo novo de LCP.
- Modify: `README.md`, na linha do `check:browser` da tabela de scripts:
  - acrescentar a etapa `entrada` à lista de `CHECK_BROWSER_ETAPAS`;
  - acrescentar o LCP à descrição da etapa.

**Interfaces:**
- Consumes: os ganchos que já existem (`.hero-expansao--entrada`, `.hero-expansao__poster`, `data-*` da seção).
- Produces: a linha de resumo da etapa `entrada` com o LCP. A Task 3 cita essa garantia na MASTER.

- [ ] **Step 1: O passo de LCP**
  - Para cada tamanho, 1440×900 e 390×844 (toque emulado, como os outros passos em pé):
    - abre a página nova sem cache;
    - registra `PerformanceObserver({ type: "largest-contentful-paint", buffered: true })` por `Page.addScriptToEvaluateOnNewDocument`;
    - espera o `load` mais 1,5 s, sem rolar;
    - lê a última entrada.
  - Falha se o `element` da entrada não for o `img.hero-expansao__poster`, com `currentSrc` terminando em `midia-poster.avif` deitado e em `midia-retrato-poster.avif` em pé. A mensagem mostra a tag, a classe e o `currentSrc` do que veio.
  - **Se o LCP for o fundo ou o h1:** não "conserte" o teste. Reporte como achado (`DONE_WITH_CONCERNS`), com o elemento e o tamanho, e o controlador decide.

- [ ] **Step 2: Rodar a etapa**
  - Run: `CHECK_BROWSER_ETAPAS=entrada npm run check:browser`
  - Expected: exit 0, e o resumo cita o LCP.

- [ ] **Step 3: As duas variantes na varredura inteira**
  - Run: `npm run check:browser`, com `"notebook"`.
  - Depois, troque à mão `heroVariant` para `"expansao"` em `src/config/site.ts`, sem commit, espere o `:3000` recompilar e rode `npm run check:browser` de novo.
  - Volte para `"notebook"` e confira com `git diff --quiet src/config/site.ts`.
  - Expected: exit 0 nas duas; na 2ª, a etapa `expansao` roda de verdade, sem "passo pulado".
  - Cada varredura leva ~12 min; rode uma por vez.

- [ ] **Step 4: Commit**
  - `test(check-browser): LCP do hero notebook é o pôster da cena`, mais o README.

---

### Task 3: Documentação

**Files:**
- Modify: `docs/DECISOES.md`, ADR-010, com a revisão de 23/10/2026.
- Modify: `design-system/strukti-solucoes/MASTER.md`, §9.8.
- Modify: `README.md`:
  - "Como trocar o visual do hero", com o padrão `"notebook"`;
  - a árvore de arquivos, com `HeroNotebook.tsx`, `AparelhoVetor.tsx`, `VetorRasterizado.tsx` e `scripts/hero-notebook/`;
  - um parágrafo "Trocar a mídia do hero notebook", que aponta para `scripts/hero-notebook/README.md`.
- Modify: `THIRD_PARTY_NOTICES.md` e o comentário do topo de `src/components/ui/scroll-expansion-hero.tsx`, com a lista de mudanças: o modo `entrada`.
- Modify: o comentário do topo de `src/config/site.ts`, se ele listar as variantes.

**Interfaces:**
- Consumes: `ENTRADA` (`src/lib/heroEntrada.ts`), `--hx-fundo-degrade` (Task 1) e o passo de LCP (Task 2).
- Produces: nada que o código use.

- [ ] **Step 1: ADR-010, revisão de 23/10/2026** (spec §10)
  - Um parágrafo **"Revisão de 23/10/2026 (entrada pelo notebook)"** no fim da ADR, no formato das revisões que já existem. O que ele diz:
    - o padrão passa a `"notebook"`, o mesmo componente no modo `entrada`;
    - o fim da expansão é a tela cheia, há a pausa e a aproximação, e o percurso preso fica `ganho` = 1,85 × mais longo, com `E` = 0,54 e `Pa` = 0,08;
    - a exceção continua a mesma: a única rolagem presa da página;
    - o Tab completa a entrada;
    - a mídia é por enquadramento;
    - o aparelho é vetor, desenhado como imagem depois de montar, só com movimento;
    - o Q25 ficou sem plano B;
    - as decisões de desempenho de 24 a 26/10: o pôster sai da pintura com o vídeo tocando, e a base e o suporte viram imagem. Cite os números medidos dos commits `78193e1` e `b740f95`: GPU da aproximação de 7,3–8,2 para 2,7 ms por quadro a 1440×900;
    - o "expansao" continua no código como variante.
  - Atualize a linha **Status/Altera** se preciso.

- [ ] **Step 2: MASTER §9.8**
  - O título passa a **"Hero 'expansao' e o modo 'entrada' (notebook, padrão desde 26/10/2026)"**.
  - O texto do expansao fica como está, só com o "padrão" corrigido.
  - Uma subseção **"Modo entrada (hero notebook)"**, no estilo da §9.8, com:
    - **a animação:** as três fases e os números do `ENTRADA` (`E`, `Pa`, `ganho`, `salaZoomMax` 1,45, `salaBlurMax` 10 px, `tituloSaidaAte` 0,5, `salaCobertaK` 0,98 e o piso do título `tituloPisoRem` 1,5rem, com a disposição empilhada de reserva);
    - **as camadas**, num diagrama como o de hoje: fundo, sala (pôster e vídeo), aparelho, tela, título, controle;
    - **os estados:** os atributos `data-*` de hoje, mais `data-orientacao` e `data-coberta`;
    - **o estado parado:** sem JavaScript e com reduced motion;
    - **a mídia:** `public/hero/notebook/`, nomes, tamanhos e limites de bytes da tabela do plano da fase 2, com 250 quadros publicados;
    - **as garantias:**
      - contraste da faixa do título (p90 ≤ 60, sonda);
      - LCP no pôster;
      - mídia só do enquadramento;
      - vídeo pausado com a sala coberta e o controle escondido, menos com foco;
      - cores forçadas.
  - Cada número citado tem que existir no código com esse valor.

- [ ] **Step 3: README, avisos e comentários**
  - Conforme a lista de arquivos acima.
  - O README do hero não repete a MASTER: aponta para ela.

- [ ] **Step 4: Conferir documentação × código**
  - Run: `grep -nE "E: 0.54|Pa: 0.08|ganho: 1.85|salaZoomMax: 1.45|salaBlurMax: 10|salaCobertaK: 0.98|tituloPisoRem: 1.5" src/lib/heroEntrada.ts`
  - Expected: 7 linhas. Todo número da subseção nova da MASTER está nessa lista ou no `globals.css`.
  - Run: `npm run check:placeholders` e `npm run check:quarantine`
  - Expected: exit 0.

- [ ] **Step 5: Commit**
  - `docs(hero): ADR-010 e MASTER §9.8 com a entrada pelo notebook`, e os de README e avisos.

---

## Depois das tasks (controlador)

1. **Revisão final da fase 3:** `5dc91de`..HEAD, com foco na Task 1 e no passo de LCP, mais a leitura da documentação contra o código.
2. **Build e entrega:** `next build` limpo e o `:3000` para o dono.
3. **Push e PR:**
   - o dono dá o push (`! git push`);
   - com a confirmação dele, o PR `feat/hero-notebook` → `homologacao` (sem conflito: `homologacao` e `main` já estão no branch), com o corpo resumindo as três fases, as decisões do dono e os testes, e terminando com a linha de atribuição;
   - o merge é do dono.
