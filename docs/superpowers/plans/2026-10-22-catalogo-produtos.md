# Catálogo de produtos ("segundo ato") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a parede de 3 cartões de `#produtos` por um catálogo de 10 itens em coverflow que vira painel + fita de miniaturas, com altura constante, link direto `#slug` e o menu "Produtos ▾" na barra.

**Architecture:** Os dados ficam em `src/content/catalogo.ts`. O estado (filtro, ativo, aberto, histórico) é um redutor puro em `src/components/catalogo/estado.ts`, ligado ao `history` e ao `hashchange` por um hook. O coverflow é CSS (atributo `data-pos` → transform), e a transformação cartão → painel usa `motion/react` (`layoutId`). O HTML do servidor traz os 10 produtos com o conteúdo do painel em `<details>`, que é o que vale sem JS. Depois de montar, `data-js="true"` liga o coverflow.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, `motion/react` 13 (já instalado), CSS em `globals.css`, vitest + testing-library + axe-core, `scripts/check-browser.mjs` (CDP, sem dependência nova), ffmpeg só para os provisórios.

**Spec:** `docs/superpowers/specs/2026-10-16-catalogo-produtos-design.md`. Quem executa lê a spec e este plano. Neste documento, "§N" é sempre uma seção da spec.

## Global Constraints

- Idioma de trabalho e de commits: português. Commits no formato `tipo(escopo): resumo`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Branch:** `feat/catalogo-produtos`, criado a partir de `main`. O PR #8 já entrou, então o PR deste trabalho aponta para `homologacao` (spec, cabeçalho). O merge é do dono.
- **Sem dependência nova.** Se alguma for inevitável, passa pela quarentena de 7 dias (ADR-003, `npm run check:quarantine`).
- **Nenhum código do componente do 21st.dev** (ADR-005). Ele é só referência de formato.
- **Sem nada automático:** o carrossel não gira sozinho (Q37), o vídeo do painel só toca no clique e o loop do cartão toca uma vez por 5 s (Q33/Q41).
- **Uma árvore React só** (ADR-004): a redução de movimento vai por CSS `@media (prefers-reduced-motion: reduce)` ou pelo `useCanAnimate()` de `src/lib/motion.ts`, que muda só durações e valores, nunca a árvore.
- **No máximo 1 vídeo tocando na página** (`src/lib/videoCoordination.ts`), contando o vídeo do hero, os loops dos cartões e o vídeo do painel.
- **CSP (ADR-008):** só mídia local (`/catalogo/...`, `/video/...`).
- **Altura da seção:** `clamp(600px, 80svh, 860px)` nos dois estados (§4).
- **Curva do movimento:** `cubic-bezier(.25,1,.5,1)`. As durações estão na tabela da §7.
- **Itens inventados:** marcados com `ficticio: true` e sem o marcador `[A PREENCHER` (Q25). O `check:placeholders` só pode falhar nos 6 que já existem.
- **Não inventar dado de negócio nos 3 produtos reais:** nada de clientes, quadras instaladas ou resultados medidos. Os textos novos usam só fatos que já estão em `landingContent` ou `docs/landing-copy.md`.
- **Gates de cada task:** `npm run typecheck`, `npm run lint` e `npx vitest run --maxWorkers=2` verdes. No máximo 2 processos pesados ao mesmo tempo, por causa da RAM (Q35).
- **Arte final fora deste plano:** este plano usa os arquivos provisórios de `public/catalogo/` (contrato da §6.1). A arte dos 10 itens (§6.2, §13 passo 1) é um plano à parte, em `scripts/catalogo-arte/`. Ela substitui os arquivos com os mesmos nomes, sem mexer no código.

## Review Focus

1. **Deslizar na vertical sobre o palco (celular).** A página precisa rolar normalmente: só um gesto claramente horizontal (|dx| ≥ 40 px e |dx| > 1,5 × |dy|) troca o produto, e o palco usa `touch-action: pan-y`. Teste na Task 5.
2. **← → com o foco no `<video controls>` do painel, num campo de texto ou nas pílulas do filtro.** Nesses casos, a seta faz o que o controle faz (avançar o vídeo, por exemplo) e não troca o produto. Teste na Task 6.
3. **Âncora de outra seção com o painel aberto** (clique em "Contato" na barra, que leva a `#contato`). O painel fecha sem `history.back()`, para a página ir ao formulário. Um `#slug` desconhecido é ignorado. Teste na Task 3.
4. **Filtro com 2 itens** ("Sites"). Fica só o centro e um lateral, sem cartão duplicado, e as setas e o deslizar continuam dando a volta. Teste nas Tasks 3 e 5.
5. **Esc ou X no meio da animação de abrir, ou dois cliques rápidos.** O estado termina consistente (fechado, com 1 entrada a menos no histórico e o foco no cartão de origem), sem painel fantasma. Teste na Task 6.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/content/catalogo.ts` (novo) | `ItemCatalogo`, os 10 itens (`CATALOGO`) e a microcopy `catalogoUi` |
| `src/content/catalogo.test.ts` (novo) | Ordem, slugs, fictícios, limites de texto e interesses |
| `src/content/catalogo.assets.test.ts` (novo) | Contrato e orçamento dos arquivos da §6.1 |
| `scripts/catalogo-arte/provisorio.sh` + `README.md` (novos) | Gera os provisórios dentro do orçamento |
| `src/components/catalogo/estado.ts` + `.test.ts` (novos) | Redutor puro e helpers (`filtrar`, `deslocamento`) |
| `src/components/catalogo/useCatalogo.ts` (novo) | Liga o redutor a `history`, `hashchange`, `popstate` e à rolagem até a seção |
| `src/components/catalogo/CatalogoInterativo.tsx` (novo) | Raiz cliente: filtro, palco (fechado ou aberto), fundo e live region |
| `src/components/catalogo/Coverflow.tsx`, `CartaoProduto.tsx`, `FiltroTipo.tsx` (novos) | Estado fechado |
| `src/components/catalogo/PainelProduto.tsx`, `FitaMiniaturas.tsx`, `ConteudoProduto.tsx` (novos) | Estado aberto e conteúdo compartilhado com a versão sem JS |
| `src/components/catalogo/CartaoLoop.tsx`, `FundoAmbiente.tsx` (novos) | Loop de 5 s e fundo desfocado |
| `src/components/catalogo/catalogo.test.tsx` (novo) | Interação, a11y e HTML do servidor |
| `src/components/ui/VideoDemo.tsx` (novo, a partir de `ReplayVideo.tsx`) | Vídeo que só toca no clique, com "Assistir" e a duração |
| `src/components/sections/Catalogo.tsx` (novo) | A seção `#produtos` (H2, intro e `CatalogoInterativo`) |
| `src/components/MenuProdutos.tsx` + `TopBar.tsx` | O menu "Produtos ▾" (disclosure) |
| `src/app/page.tsx` | `Catalogo` no lugar de `Produtos` |
| `src/app/globals.css` | Bloco `.catalogo*` novo; a CSS da grade de vídeos (`.project-card*`, `.portfolio__*`) sai |
| `scripts/check-browser.mjs` | Etapa do catálogo, âncoras pela barra nova e o passo de vídeos |
| Saem | `Produtos.tsx`, `ProjectGrid.tsx`, `ProjectGrid.test.tsx`, `ReplayVideo.tsx`, `sections/catalogo.test.tsx` (o teste do `ChamadaHardware` e o do WhatsApp vão para `ChamadaHardware.test.tsx` e `src/config/site.test.ts`) |

**Ganchos estáveis** (o `check:browser` e os testes dependem destes nomes; não renomear):

- `section#produtos .catalogo` com `data-js="false|true"` e `data-estado="fechado|aberto"`;
- `.catalogo__corpo`, a caixa de altura constante;
- `.catalogo__cartao` com `id={slug}` e `data-pos` de `-2` a `2` (os escondidos com `data-pos="oculto"`);
- `.catalogo__seta--anterior` e `.catalogo__seta--proxima`, `.catalogo__bolinhas button`, `.catalogo__filtro button[aria-pressed]`;
- `.catalogo__painel`, `.catalogo__fita button[aria-current]`, `.catalogo__loop` (o `<video>` do loop) e `.catalogo__video` (o `<video>` do painel);
- `.topbar__produtos` (o botão "Produtos ▾") e `.topbar__produtos-menu a[href^="#"]`.

---

### Task 0: Branch

- [ ] **Step 1: Criar o branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/catalogo-produtos
```
Expected: `Switched to a new branch 'feat/catalogo-produtos'`.

---

### Task 1: Dados do catálogo e textos

**Files:**
- Create: `src/content/catalogo.ts`, `src/content/catalogo.test.ts`
- Modify: `docs/landing-copy.md` (subseção nova em "## 3. Produtos")

**Interfaces:**
- Consumes: `landingContent` e `ProductStatus`/`Project` (`src/content/landing.ts`), e `Interest` (`src/lib/interest.ts`).
- Produces:
  - `type TipoProduto = "hardware" | "aplicativo" | "site"`, `interface Passo`, `interface TelaIlustrativa { src; alt; moldura: "celular" | "navegador" }` e `interface ItemCatalogo`, exatamente como na §5.1, com `painel.telas: readonly TelaIlustrativa[]`;
  - `export const CATALOGO: readonly ItemCatalogo[]`;
  - `export const catalogoUi`, com as chaves abaixo.

- [ ] **Step 1: Escrever o teste que falha** (`src/content/catalogo.test.ts`, ambiente node)

```ts
import { CATALOGO } from "./catalogo";
import { landingContent } from "./landing";

const ORDEM = ["replay","rota-de-vendas","fleet-analytics-bi","placar-conectado","agenda-de-quadras",
  "site-clinicas","totem-check-in","estoque-oficinas","vitrine-lojas","contador-de-fluxo"];
// Os 3 reais primeiro; depois os inventados, alternando os tipos (§5.2).

it("tem os 10 itens na ordem da §5.2, com slugs únicos", () =>
  expect(CATALOGO.map((i) => i.slug)).toEqual(ORDEM));
it("só os 7 inventados têm ficticio: true; todos têm fase desenvolvimento", () => { /* 3 reais sem a marca; 7 com */ });
it("as fases dos reais são piloto, piloto e emUso", () => { /* replay, rota, fleet */ });
it("os reais reaproveitam nome e vídeo do landingContent (mesma referência); a frase só no Rota de Vendas", () => {
  expect(CATALOGO[0].nome).toBe(landingContent.produtos.replay.name);
  expect(CATALOGO[0].painel.video).toBe(landingContent.produtos.replay.video);
  expect(CATALOGO[2].painel.video).toBe(landingContent.aplicativos.projects[1].video);
  expect(CATALOGO[1].frase).toBe(landingContent.aplicativos.projects[0].summary);
});
it("respeita os limites de texto da §5.3", () => { /* frase ≤110; paraQuem ≤140; 3–4 benefícios ≤70; passos: título ≤30, texto ≤90 */ });
it("interesse: hardware replay→replay, aplicativo→aplicativo, site e outros hardwares→outro", () => {});
it("3 telas por item em /catalogo/<slug>/tela-N.svg; moldura navegador só para sites; alt contém 'ilustrativa'", () => {});
it("arte.base é /catalogo/<slug>/cartao; loop só nos 3 reais, com webm e mp4", () => {});
it("nenhum texto tem '[A PREENCHER'", () => {});
```

Observação: as frases atuais do replay (130 caracteres) e do Fleet Analytics BI (137) passam do limite de 110 da §5.3. Para esses dois, o catálogo usa frases próprias, que entram como proposta (Step 4). Só a do Rota de Vendas (89) é reaproveitada.

- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/content/catalogo.test.ts`. Expected: FAIL, "Cannot find module './catalogo'".

- [ ] **Step 3: Implementar `src/content/catalogo.ts`**

`catalogoUi` (microcopy de interface, igual à da spec ou ao padrão do site):
```ts
export const catalogoUi = {
  rotuloCarrossel: "Produtos", roledescCarrossel: "carrossel", roledescProduto: "produto",
  posicao: "{i} de {n}: {nome}", verDetalhes: "Ver detalhes", saberMais: "Quero saber mais",
  fechar: "Fechar", anterior: "Produto anterior", proximo: "Próximo produto", irPara: "Ir para {nome}",
  abas: { visaoGeral: "Visão geral", comoFunciona: "Como funciona", telas: "Telas" },
  paraQuem: "Para quem é", siteLink: "Ver o site",
  telaAnterior: "Tela anterior", proximaTela: "Próxima tela",
  filtros: { todos: "Todos", hardware: "Hardware", aplicativo: "Aplicativos", site: "Sites" },
  tipos: { hardware: "Hardware", aplicativo: "Aplicativo", site: "Site" },
} as const;
```

Regras dos itens:
- **Reais:** `nome` e `painel.video` vêm por referência a `landingContent`. A `frase` também vem por referência no Rota de Vendas; o replay e o Fleet usam frases próprias (ver Step 1). Os benefícios do Rota de Vendas partem dos `highlights[].lead`. O `siteUrl` do replay é `landingContent.produtos.replay.siteUrl`; nos outros, `null`.
- **Inventados:** `ficticio: true`. Os textos são de produto plausível, sem números de resultado e sem nomes de clientes. No lugar do vídeo, a arte grande (sem `painel.video`).
- **Ordem:** a de `ORDEM` no teste.

- [ ] **Step 4: Proposta de texto em `docs/landing-copy.md`**

Criar a subseção "### Catálogo (proposta — aguardando aprovação)" dentro de "## 3. Produtos", com:
- "Para quem é", benefícios e "Como funciona" dos 3 reais (os mesmos textos do código);
- a lista dos 7 fictícios marcada "fictício, troca quando houver produto real";
- a microcopy do `catalogoUi`.

- [ ] **Step 5: Rodar e ver passar.** Run: `npx vitest run src/content/catalogo.test.ts`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/content/catalogo.ts src/content/catalogo.test.ts docs/landing-copy.md
git commit -m "feat(catalogo): dados dos 10 itens e textos propostos dos reais"
```

---

### Task 2: Contrato e orçamento da mídia (provisórios dentro do orçamento)

Os provisórios que já estão em `public/catalogo/` respeitam as medidas, mas não o orçamento. Por causa do ruído, o `cartao.jpg` tem cerca de 680 KB (limite: 200 KB) e o `cartao-480.jpg`, cerca de 160 KB (limite: 70 KB). Como os inventados vão para produção com esses arquivos (Q14), o orçamento precisa valer já.

**Files:**
- Create: `src/content/catalogo.assets.test.ts`, `scripts/catalogo-arte/provisorio.sh`, `scripts/catalogo-arte/README.md`
- Modify: os arquivos de `public/catalogo/<slug>/` (os mesmos nomes)

**Interfaces:**
- Consumes: `CATALOGO` (Task 1).

- [ ] **Step 1: Escrever o teste que falha** (`// @vitest-environment node`; ler as medidas do AVIF com o `findBox` de `src/config/heroSequence.assets.test.ts`, extraído para `src/test/avif.ts` e importado pelos dois)

Para cada item de `CATALOGO`:
- `cartao.avif` 800×1200 ≤ 120 000 B; `cartao.jpg` 800×1200 ≤ 200 000 B (medidas do JPEG pelo marcador SOF0/SOF2);
- `cartao-480.avif` 480×720 ≤ 45 000 B; `cartao-480.jpg` 480×720 ≤ 70 000 B;
- `tela-1..3.svg` existem;
- `cartao-loop.webm` e `cartao-loop.mp4` existem, cada um ≤ 600 000 B, se e só se `arte.loop` existir.

- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/content/catalogo.assets.test.ts`. Expected: FAIL nos limites de bytes dos JPG e AVIF.

- [ ] **Step 3: `scripts/catalogo-arte/provisorio.sh <slug> <cor-do-tipo>`**

O script gera, com ffmpeg (`gradients`, sem ruído), o degradê da cor do tipo para o navy em 800×1200 e 480×720, e exporta JPG (`-q:v` ajustado ao orçamento) e AVIF (`libaom-av1`). Para os 3 reais, gera também um loop de 5 s, 600×900 a 25 fps, com o degradê respirando, em VP9 e H.264, com o quadro 0 igual ao último. Não toca nas telas SVG. O README diz que é provisório e que a arte final (plano à parte) substitui os arquivos com os mesmos nomes. O `LEIA-PROVISORIO.txt` fica.

- [ ] **Step 4: Gerar os 10 e rodar o teste.** Run: `npx vitest run src/content/catalogo.assets.test.ts src/config/heroSequence.assets.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit** (exceção à §13 passo 2: aqui a mídia provisória entra, porque o teste depende dela)

```bash
git add src/content/catalogo.assets.test.ts src/test/avif.ts src/config/heroSequence.assets.test.ts scripts/catalogo-arte public/catalogo
git commit -m "chore(catalogo): provisórios dentro do orçamento da §6.1 e teste do contrato"
```

---

### Task 3: Redutor de estado

**Files:**
- Create: `src/components/catalogo/estado.ts`, `src/components/catalogo/estado.test.ts`

**Interfaces:**
- Consumes: `ItemCatalogo` e `TipoProduto`.
- Produces:
```ts
export type Filtro = "todos" | TipoProduto;
export interface EstadoCatalogo { filtro: Filtro; ativo: string; aberto: boolean; entradaPropria: boolean; direcao: -1 | 0 | 1 }
export type EfeitoHistorico = { tipo: "push" | "replace"; slug: string } | { tipo: "back" } | { tipo: "limpar" } | null;
export type EventoCatalogo =
  | { tipo: "centralizar"; slug: string } | { tipo: "passo"; delta: -1 | 1 } | { tipo: "irPara"; posicao: "inicio" | "fim" }
  | { tipo: "abrir" } | { tipo: "fechar" } | { tipo: "filtrar"; filtro: Filtro } | { tipo: "hash"; slug: string | null };
export function estadoInicial(itens: readonly ItemCatalogo[]): EstadoCatalogo; // filtro "todos", 1º item, fechado
export function filtrar(itens: readonly ItemCatalogo[], filtro: Filtro): readonly ItemCatalogo[];
export function deslocamento(indice: number, indiceAtivo: number, total: number): number; // circular, em (−total/2, total/2]
export function reduzir(itens: readonly ItemCatalogo[], estado: EstadoCatalogo, evento: EventoCatalogo):
  { estado: EstadoCatalogo; historico: EfeitoHistorico };
```

- [ ] **Step 1: Escrever os testes que falham**

```ts
// deslocamento: total 10 → (0,0)=0, (1,0)=1, (9,0)=-1, (5,0)=5; total 2 → (1,0)=1, (0,1)=1 [nunca −1 e +1 ao mesmo tempo];
//               total 4 → (2,0)=2 ; total 1 → 0
// passo: fechado, no último + 1 → primeiro, direcao 1, historico null; com 2 itens filtrados, passo −1 alterna
// passo aberto → historico { tipo: "replace", slug: novo }
// irPara inicio/fim → 1º/último do filtro
// centralizar fechado → ativo = slug, historico null; slug fora do filtro → sem mudança
// abrir → aberto, entradaPropria true, historico push(ativo)
// fechar com entradaPropria → historico back; sem → limpar; fechar já fechado → historico null
// filtrar "site" com ativo replay (fechado) → ativo site-clinicas; aberto → idem + replace(site-clinicas)
// filtrar com o ativo dentro do novo filtro → ativo mantido
// hash "rota-de-vendas" com filtro "site" → filtro "todos", ativo rota, aberto, entradaPropria false, historico null
// hash null aberto → fechado, historico null (voltar do navegador); hash null fechado → mesmo estado
// [Review Focus 3] hash "contato" (não é produto) aberto → fechado, historico null; fechado → sem mudança
// [Review Focus 3] hash "nao-existe" → sem mudança
// dois "abrir" seguidos → o 2º não gera outro push (historico null)
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/components/catalogo/estado.test.ts`. Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `estado.ts`.** Funções puras, sem React. Um `hash` que não é slug do catálogo, chegando com o painel aberto, fecha o painel. Um `slug` desconhecido em `centralizar` não muda nada.

- [ ] **Step 4: Rodar e ver passar.** Expected: PASS.

- [ ] **Step 5: Commit** `feat(catalogo): redutor de estado (filtro, centro, painel e histórico)`.

---

### Task 4: Hook `useCatalogo` (histórico, âncora e rolagem)

**Files:**
- Create: `src/components/catalogo/useCatalogo.ts`, `src/components/catalogo/useCatalogo.test.tsx`

**Interfaces:**
- Consumes: Task 3.
- Produces: `useCatalogo(itens: readonly ItemCatalogo[], secaoRef: RefObject<HTMLElement | null>): { estado: EstadoCatalogo; visiveis: readonly ItemCatalogo[]; despachar: (e: EventoCatalogo) => void }`.

Comportamento:
- `despachar` calcula `reduzir` sobre um ref do estado atual (para não perder eventos rápidos), faz `setState` e aplica o efeito:
  - `push` → `history.pushState(null, "", "#slug")`;
  - `replace` → `history.replaceState(null, "", "#slug")`;
  - `back` → `history.back()`;
  - `limpar` → `history.replaceState(null, "", location.pathname + location.search)`.
- Ao montar, e em todo `hashchange` e `popstate`, despacha `{ tipo: "hash", slug }` com o hash decodificado (`decodeURIComponent`, com try/catch, como em `scroll-expansion-hero.tsx:169`).
- Quando o hash é um slug do catálogo e o evento veio de load ou `hashchange`, rola até o topo da seção com `secaoRef.current.scrollIntoView({ block: "start", behavior: "instant" })`, depois de um `requestAnimationFrame` (o hero completa a expansão no mesmo `hashchange`). No `popstate`, não rola.

- [ ] **Step 1: Escrever os testes que falham** (jsdom; espiar `history.pushState`/`back` e `Element.prototype.scrollIntoView`)
  - `abrir` chama `pushState` com `#replay`; `passo` aberto chama `replaceState` com `#rota-de-vendas`;
  - `fechar` depois de `abrir` chama `history.back()` 1 vez; com `location.hash = "#fleet-analytics-bi"` antes de montar, abre o Fleet e o `fechar` chama `replaceState` sem hash (não chama `back`);
  - `hashchange` para `#site-clinicas` abre o item e chama `scrollIntoView` na seção; `popstate` com hash vazio fecha e não rola;
  - ao desmontar, remove os ouvintes.
- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/components/catalogo/useCatalogo.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar e ver passar.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogo): hook que liga o estado ao histórico e às âncoras`.

---

### Task 5: Seção e estado fechado (coverflow, filtro, sem JS)

**Files:**
- Create: `src/components/sections/Catalogo.tsx`, `src/components/catalogo/CatalogoInterativo.tsx`, `Coverflow.tsx`, `CartaoProduto.tsx`, `FiltroTipo.tsx`, `ConteudoProduto.tsx`, `src/components/catalogo/catalogo.test.tsx`
- Modify: `src/app/page.tsx` (`<Catalogo />` no lugar de `<Produtos />`), `src/app/globals.css` (bloco novo "Catálogo de produtos (MASTER §8.8)")
- Delete: `src/components/sections/catalogo.test.tsx`, depois de mover os testes do `ChamadaHardware` e do WhatsApp (ver mapa)

**Interfaces:**
- Consumes: Tasks 1, 3 e 4, `SeloStatus`, `InterestLink` e `useCanAnimate`.
- Produces:
  - `<Catalogo />` (server): a `section#produtos.section.surface-space`, com `aria-labelledby` no H2 `landingContent.produtos.title` e a intro;
  - `<CatalogoInterativo itens={CATALOGO} />` ("use client"): renderiza `.catalogo[data-js][data-estado]` > `.catalogo__corpo` > filtro + palco;
  - `ConteudoProduto.tsx` exporta `VisaoGeralTexto({ item })` (para quem é, benefícios, "Quero saber mais" via `InterestLink interest={item.interesse}`), `PassosProduto({ item })` (`<ol>` com 3 passos) e `TelasProduto({ item, navegavel })` (as 3 telas, com setas quando `navegavel`). A Task 6 reutiliza os três.

Comportamento e marcação:
- **Cartão:** `<article class="catalogo__cartao" id={slug} data-pos role="group" aria-roledescription="produto" aria-label="3 de 10: Rota de Vendas">`.
  - Dentro: a arte num `<picture>` (AVIF e JPG, `srcset` 480w/800w, `loading="lazy"`, exceto o centro inicial), a etiqueta do tipo, o `SeloStatus`, o nome (h3), a frase e o botão "Ver detalhes".
  - O botão "Ver detalhes" só fica visível e focável no centro. Os laterais mostram a arte e o nome pequeno (Q38).
  - Cada cartão leva também um `<details class="catalogo__ficha"><summary>Ver detalhes</summary>…</details>` com `VisaoGeralTexto`, `PassosProduto` e `TelasProduto`. Esse `<details>` é o conteúdo do painel no HTML do servidor e sem JS (§8.5). Com `data-js="true"`, o CSS o esconde (`display: none`).
- **Região do carrossel:** `<div role="region" aria-roledescription="carrossel" aria-label="Produtos">` envolve os cartões, as setas e as bolinhas (§8.1).
- **Hover (Q9):** o mouse sobre um cartão só dá um leve destaque (brilho ou contorno). Não abre e não centraliza.
- **Cores forçadas (§8.7):** setas, bolinhas, contornos de foco e o contorno do ativo com `forced-color-adjust` ou bordas em `CanvasText`/`Highlight`, como no conserto A11Y-2 do hero.
- **`data-pos`:** `deslocamento()` entre −2 e 2; o resto fica `"oculto"`, com `inert` e `aria-hidden="true"`. Abaixo de 768 px, o ±2 também fica oculto: o atributo `inert` continua vindo do JS (via `matchMedia("(min-width: 768px)")`), e o CSS só esconde.
- **CSS** (os valores da §3.1):
  - `[data-pos="0"]` = sem transform;
  - `[data-pos="±1"]` = `translateX(±86%) scale(.84) rotateY(∓24deg)`, opacidade .65 e `filter: brightness(.75)`;
  - `[data-pos="±2"]` = `translateX(±155%) scale(.68) rotateY(∓38deg)`, opacidade .38 e `brightness(.55) blur(1px)`;
  - palco com `perspective: 1400px`;
  - cartão do centro 2:3, com `height: 86%` do palco no computador e cerca de 70% da largura no celular;
  - transição de 800 ms com a curva da §7, desligada com reduced motion.
- **`data-js`:** `"false"` no servidor e no 1º render do cliente; `"true"` depois de montar (o mesmo padrão do `data-pin` do hero, sem divergir na hidratação). Com `data-js="false"`, o palco é uma fileira com `overflow-x: auto`, `scroll-snap-type: x mandatory` e sem 3D.
- **Controles:**
  - setas ‹ › com os nomes do `catalogoUi`;
  - bolinhas (`button`, "Ir para {nome}", a ativa alongada, com `aria-current="true"`);
  - filtro (`FiltroTipo`, pílulas com `aria-pressed`);
  - live region `.sr-only` com `aria-live="polite"` e o texto `posicao`, atualizada a cada troca;
  - setas, bolinhas e pílulas com alvo de pelo menos 44 px;
  - com 1 item, sem setas e sem bolinhas.
- **Teclado** (`onKeyDown` na região do carrossel): ← → Home End. Enter ou espaço num lateral centraliza; no centro, abre (pelo botão "Ver detalhes" ou pelo clique no cartão).
- **Dedo:** `onPointerDown`/`onPointerUp` no palco. Só troca com |dx| ≥ 40 e |dx| > 1,5·|dy|. O palco tem `touch-action: pan-y`.
- **Altura:** `.catalogo__corpo { height: clamp(600px, 80svh, 860px) }` em `data-estado` fechado e aberto. Com `@media (max-height: 34em)`, vira `height: auto` (exceção da §4).
- **Sem JS:** o `id` do cartão é a âncora do produto.

- [ ] **Step 1: Escrever os testes que falham** (`catalogo.test.tsx`)

```ts
it("HTML do servidor (renderToString): 10 article com os ids da §5.2, o conteúdo dos painéis (para quem é, os 3 passos de cada um) e nenhum <video>")
it("começa fechado com o replay no centro; data-pos dos cartões = 0,1,2,oculto…,-2,-1")
it("seta 'Próximo produto' centraliza o Rota de Vendas e a live region diz '2 de 10: Rota de Vendas'")
it("clicar num lateral (data-pos=1) o centraliza; não abre")
it("← → e Home/End trocam só com o foco dentro do carrossel; keydown no body não troca")
it("filtro 'Sites' deixa 2 cartões (data-pos 0 e 1), 2 bolinhas, sem cartão duplicado")   // Review Focus 4
it("filtro 'Sites' e 'Próximo produto' duas vezes voltam ao Site para clínicas (volta circular)") // Review Focus 4
it("deslizar o dedo 120 px para a esquerda troca; 30 px na horizontal com 200 px na vertical não troca") // Review Focus 1
it("os ocultos têm inert e aria-hidden; os botões dos laterais não estão na ordem de Tab")
it("axe sem violações no estado fechado")
it("'Quero saber mais' no <details> do replay dispara selectInterest('replay'); no Site para clínicas, 'outro'")
```

Mover para `src/components/sections/ChamadaHardware.test.tsx` e `src/config/site.test.ts` os testes "leva ao formulário", "codifica acentos…" e "a mensagem do replay…" do `sections/catalogo.test.tsx`, sem mudança.

- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/components/catalogo src/components/sections`. Expected: FAIL (componentes inexistentes).
- [ ] **Step 3: Implementar** os componentes e a CSS do estado fechado, e trocar `Produtos` por `Catalogo` em `page.tsx`. Ainda não apagar `Produtos.tsx` nem `ProjectGrid.tsx` (Task 9).
- [ ] **Step 4: Rodar a suíte inteira.** Run: `npx vitest run --maxWorkers=2`. Expected: PASS, inclusive `page.test`, `page.axe.test` e `page.hydration.test` (sem `console.error` de hidratação). Ajustar no `page.test` só o que dependia da grade antiga.
- [ ] **Step 5: Commit** `feat(catalogo): seção em coverflow com filtro, teclado, dedo e versão sem JS`.

---

### Task 6: Estado aberto (painel com abas e fita)

**Files:**
- Create: `src/components/catalogo/PainelProduto.tsx`, `FitaMiniaturas.tsx`, `src/components/ui/VideoDemo.tsx`
- Modify: `CatalogoInterativo.tsx`, `CartaoProduto.tsx`, `globals.css`, `catalogo.test.tsx`

**Interfaces:**
- Consumes: Tasks 3 a 5 (`VisaoGeralTexto`, `PassosProduto`, `TelasProduto`) e `pauseOtherVideos`.
- Produces:
  - `VideoDemo({ video: Project["video"], playLabel: string, sizes: string, className?: string })`: o comportamento do `ReplayVideo` atual (pôster + botão; no clique, `<video controls autoPlay preload="metadata">` com o foco nele), com a classe `catalogo__video` no `<video>`;
  - `PainelProduto({ item, posicao, direcao, aoFechar, aoPasso })`, com `aoFechar: () => void` e `aoPasso: (d: -1 | 1) => void`;
  - `FitaMiniaturas({ itens, ativo, aoEscolher })`, com `aoEscolher: (slug: string) => void`.

Comportamento:
- **Painel:** `<section class="catalogo__painel" aria-labelledby={idDoH3}>`.
  - **Cabeçalho:** h3 com `tabIndex={-1}`, que recebe o foco ao abrir; etiqueta do tipo; `SeloStatus`; link "Ver o site" se houver `siteUrl`; botão X ("Fechar").
  - **Abas** no padrão APG: `tablist`, `tab` com `aria-selected` e `aria-controls`, `tabpanel`; ← → Home End entre as abas.
  - **Visão geral:** à esquerda, `VideoDemo` (16:9, com o `playLabel` montado do `aplicativos.grid.playLabel` como em `ProjectGrid.tsx`) ou, nos itens sem vídeo, a arte grande. À direita, `VisaoGeralTexto`.
  - **Como funciona:** `PassosProduto`.
  - **Telas:** `TelasProduto navegavel`, com moldura de celular ou de navegador.
  - O painel ocupa a altura que sobra no `.catalogo__corpo`, menos a fita (cerca de 110 px), com `overflow-y: auto`, que só rola na exceção da §4.
- **Fita:** botões de cerca de 64×86 px com a arte em 480 e o nome curto. O ativo tem `aria-current="true"` e o contorno elétrico, e a fita rola para mantê-lo no centro (`scrollIntoView({ inline: "center", block: "nearest" })`).
- **Setas ‹ › do painel** e **← →** trocam de produto quando o foco está no painel, exceto se `event.target` estiver em `[role=tab]`, `video`, `input`, `textarea`, `select` ou `[contenteditable]` (Review Focus 2). O dedo no painel segue a regra da Task 5.
- **Fechar:** X ou Esc (ouvinte no `document` só enquanto aberto). Despacha `fechar` e, depois do render, devolve o foco ao cartão de origem (o centro).
- **Um vídeo por vez:** o ouvinte de captura `play` → `pauseOtherVideos`, que hoje mora no `ProjectGrid.tsx`, passa para o `CatalogoInterativo`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
it("clicar em 'Ver detalhes' abre: data-estado='aberto', foco no h3 'Replay para quadras', fita com 10 botões e aria-current no replay")
it("abas: 'Como funciona' mostra 3 passos; → na aba ativa leva o foco para 'Telas'")
it("→ com o foco no X troca para o Rota de Vendas e a live region anuncia '2 de 10: Rota de Vendas'")
it("→ com o foco no <video> do painel não troca de produto")                       // Review Focus 2
it("→ com o foco na pílula do filtro não troca de produto")                        // Review Focus 2
it("miniatura do Fleet troca o painel para o Fleet sem fechar")
it("Esc fecha, data-estado='fechado' e o foco volta ao cartão do replay")
it("abrir e apertar Esc no mesmo tick deixa fechado, com history.back chamado 1 vez e nenhum .catalogo__painel") // Review Focus 5
it("dois cliques rápidos em 'Ver detalhes' fazem 1 pushState só")                 // Review Focus 5
it("a seção mantém as mesmas classes de altura nos dois estados (data-estado muda, .catalogo__corpo é o mesmo nó)")
it("vídeo só depois do clique em 'Assistir ao vídeo: Replay para quadras (52 s)'; tocar pausa um <video> de fora")
it("item fictício abre sem VideoDemo, com a arte grande")
it("axe sem violações no estado aberto")
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/components/catalogo`. Expected: FAIL.
- [ ] **Step 3: Implementar** (ainda sem animação: abrir e fechar instantâneos).
- [ ] **Step 4: Rodar e ver passar.** Run: `npx vitest run --maxWorkers=2`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogo): painel com abas, fita de miniaturas e vídeo no clique`.

---

### Task 7: Movimento, loop de 5 s e fundo ambiente

**Files:**
- Create: `src/components/catalogo/CartaoLoop.tsx`, `src/components/catalogo/FundoAmbiente.tsx`
- Modify: `CartaoProduto.tsx`, `PainelProduto.tsx`, `FitaMiniaturas.tsx`, `CatalogoInterativo.tsx`, `globals.css`, `catalogo.test.tsx`

**Interfaces:**
- Consumes: `useCanAnimate`, `isUserVideoPlaying` e `motion/react` (`motion`, `AnimatePresence`, `LayoutGroup`).
- Produces:
  - `CartaoLoop({ loop, poster, ativo }: { loop: { webm: string; mp4: string }; poster: string; ativo: boolean })`;
  - `FundoAmbiente({ src }: { src: string })`, que recebe a URL do `cartao-480.jpg` do centro.

Comportamento (durações da §7, `cubic-bezier(.25,1,.5,1)` como `[0.25, 1, 0.5, 1]`):
- **Cartão → painel:** a superfície do cartão do centro e a do painel compartilham `layoutId={"catalogo-" + slug}` (600 ms). A fita entra com cascata de 40 ms por índice. O conteúdo do painel aparece 250 ms depois de o painel crescer. Fechar faz o caminho inverso.
- **Trocar com o painel aberto:** `AnimatePresence mode="popLayout" custom={direcao}`, com o conteúdo deslizando ou em crossfade por 350 ms, na direção de `direcao`.
- **Texto do centro:** sobe e aparece em 500 ms, sobre o degradê escuro da metade de baixo.
- **Entrada da seção:** `whileInView` uma vez, com os cartões em sequência a cada 70 ms, num wrapper interno (`.catalogo__entrada`), para não brigar com o transform do `data-pos`.
- **Reduced motion:** com `useCanAnimate() === false`, todas as `transition` viram `{ duration: 0 }` e não há `initial` de entrada. A árvore é a mesma (ADR-004).
- **`CartaoLoop`:**
  - O `<video class="catalogo__loop" muted playsInline preload="none" poster>` só é renderizado quando `ativo` (centro, ou mouse ou foco) e `useCanAnimate()`.
  - Toca uma vez, a menos que `isUserVideoPlaying()`.
  - No `ended` ou aos 5 000 ms (o que vier primeiro): `pause()` e `currentTime = 0`.
  - Ao perder `ativo`, para.
  - Sem o atributo `loop`.
- **`FundoAmbiente`:** duas camadas `<img alt="" aria-hidden>` em crossfade de 1 000 ms. O desfoque é barato: a imagem é desenhada pequena (≤ 64 px de largura) e ampliada por `transform: scale(...)`, com `filter: blur(≤ 4px)`, sob uma camada navy forte (`--surface-space` com cerca de 85% de opacidade). Fica decorativa e fora da árvore de acessibilidade.

- [ ] **Step 1: Escrever os testes que falham** (fake timers; `matchMedia` mockado para reduced motion)

```ts
it("o centro inicial do replay renderiza .catalogo__loop com preload='none' e sem atributo loop; os laterais não")
it("o loop pausa e volta a currentTime 0 aos 5 s")
it("com reduced motion não existe .catalogo__loop")
it("com um <video controls> tocando, o loop não chama play()")
it("FundoAmbiente usa /catalogo/<centro>/cartao-480.jpg e troca ao centralizar outro")
it("abrir o painel com o loop tocando o pausa (1 vídeo por vez)")
```

- [ ] **Step 2: Rodar e ver falhar.** Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar a suíte inteira.** Run: `npx vitest run --maxWorkers=2`. Expected: PASS, com a hidratação sem `console.error`.
- [ ] **Step 5: Conferir no navegador.** Com `npm run dev`, abrir, trocar e fechar a 1440 e a 390, com e sem reduced motion (DevTools → Rendering). Nada abaixo da seção se mexe.
- [ ] **Step 6: Commit** `feat(catalogo): movimento do coverflow e do painel, loop de 5 s e fundo ambiente`.

---

### Task 8: Barra do topo "Produtos ▾"

**Files:**
- Create: `src/components/MenuProdutos.tsx`
- Modify: `src/components/TopBar.tsx`, `src/components/TopBar.test.tsx`, `src/content/landing.ts` (`header.nav`), `src/app/globals.css` (seção "Barra do topo")

**Interfaces:**
- Consumes: `CATALOGO` e `catalogoUi.filtros` (os rótulos dos grupos).
- Produces:
  - `header.nav = [{ label: "Produtos", href: "#produtos" }, { label: "Equipe", href: "#equipe" }, { label: "Contato", href: "#contato" }]`. O `Header` clássico continua lendo a lista como links.
  - `MenuProdutos({ ativo, aoEscolher }: { ativo: boolean; aoEscolher: () => void })`: botão `.topbar__produtos` (`aria-expanded`, `aria-controls`, `aria-current="true"` quando `ativo`) e a lista `.topbar__produtos-menu`, com 3 grupos (`<p>` com o rótulo e `<ul>` de links `#slug` com o nome), só com os grupos que têm itens.

Comportamento:
- No `TopBar`, o item de nav com `href === "#produtos"` vira `<MenuProdutos ativo={activeHref === "#produtos"} … />`. O `computeActive` continua usando `produtos` como alvo, e os slugs saem dos alvos.
- **Fechar o menu:**
  - Esc fecha e devolve o foco ao botão;
  - clique fora fecha;
  - escolher um item fecha o menu e também o painel do Menu do celular (`setOpen(false)`);
  - o `onBlur` da barra fecha quando o foco sai.
- **Uma árvore só:** a partir de 75em, a lista abre como popover abaixo do botão; abaixo disso, dentro do painel do Menu, abre como sublista. Só o CSS muda.
- Não é `role="menu"` (padrão disclosure).

- [ ] **Step 1: Reescrever os testes** do `TopBar.test.tsx` que falavam dos links de produto (linhas ~145–300):

```ts
it("a barra tem 'Produtos' (botão com aria-expanded=false), 'Equipe' e 'Contato'; nenhum link #replay à mostra")
it("clicar em 'Produtos' abre 3 grupos (Hardware, Aplicativos, Sites) com os 10 links #slug")
it("Esc fecha e devolve o foco ao botão; clique fora fecha")
it("escolher 'Rota de Vendas' fecha o menu e o painel do Menu, e o link aponta para #rota-de-vendas")
it("o botão 'Produtos' ganha aria-current quando #produtos cruza a linha da barra (mesma conta de antes)")
it("axe sem violações com o menu aberto")
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/components/TopBar.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar e ver passar.** Run: `npx vitest run --maxWorkers=2`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(topbar): menu "Produtos ▾" agrupado por tipo no lugar dos links de produto`.

---

### Task 9: Aposentar a grade antiga

**Files:**
- Delete: `src/components/sections/Produtos.tsx`, `ProjectGrid.tsx`, `ProjectGrid.test.tsx` e `ReplayVideo.tsx`
- Modify: `src/app/globals.css` (sai a seção "11. Grade de vídeos dos aplicativos", com `.project-card*`, `.portfolio__*` e `.produtos-secao`; o `.wall` fica, porque a Equipe usa), `HeroVideoMedia.tsx:62` (o comentário passa a apontar para o `CatalogoInterativo`) e `src/components/spike/FioPrototipo.tsx` (se usar a grade, troca por `Catalogo`)

- [ ] **Step 1: Procurar quem ainda usa.** Run: `git grep -n "ProjectGrid\|ReplayVideo\|project-card\|portfolio__\|produtos-secao\|from \"./Produtos\"\|sections/Produtos" -- src scripts`. Expected: só os arquivos listados acima e o `check-browser.mjs`, que muda na Task 10.
- [ ] **Step 2: Apagar e editar**, e manter `PROJECT_GRID_STEP`, `aplicativos.grid` e `aplicativos.projects` se `catalogo.ts` usar (o `playLabel` e os dados dos reais).
- [ ] **Step 3: Gates.** Run: `npm run typecheck && npm run lint && npx vitest run --maxWorkers=2`. Expected: tudo verde.
- [ ] **Step 4: Commit** `refactor(produtos): remove a grade de vídeos da v2.2, substituída pelo catálogo`.

---

### Task 10: `check:browser`, etapa do catálogo

**Files:**
- Modify: `scripts/check-browser.mjs`

**Interfaces:**
- Consumes: os ganchos estáveis (ver o mapa de arquivos) e os helpers existentes do script (`evalValue`, `elementRect`, `clickSelector`, `clickFixed`, `pressKey`, `pressTab`, `navigate`, `setReducedMotion`, `playVideo` e `isPaused`).
- Produces: as funções `catalogoPass(cdp, ctx)` (rodada a 1440×900 e a 360×740) e `catalogoExtras(cdp)` (as conferências de largura única), chamadas no fluxo principal depois do passo do hero; e o comentário do topo do arquivo descrevendo a etapa.

Mudanças nos passos que já existem:
- **Âncoras do hero (`expAnchorPass`):**
  - o clique na barra passa a ser "Produtos" e depois `a[href="#replay"]` (a 360, pelo Menu);
  - o alvo conferido é `#produtos` (topo da seção, §3.4), e não o cartão;
  - o `aria-current` esperado fica no `.topbar__produtos`;
  - o 2º clique é `#fleet-analytics-bi` pelo menu;
  - `BAR_ANCHOR_SELECTOR` e `BAR_ANCHOR_SIDE_SELECTOR` seguem como slugs, e a conferência da posição usa `AFTER_HERO_SELECTOR`.
- **Passo de vídeos:** no lugar de `APPS_PLAY_BUTTON_SELECTOR` e `appCard(n)`, abre o painel do replay, clica em `.catalogo__painel button[aria-label^="Assistir"]`, troca para o Rota de Vendas pela fita, toca o segundo e confere que só 1 vídeo toca e que o do hero não toca por cima.

`catalogoPass`, uma linha de log e uma falha por item:
1. **Sem JS** (`Emulation.setScriptExecutionDisabled`): os 10 `article.catalogo__cartao` estão no HTML; a fileira rola na horizontal dentro da seção sem criar rolagem horizontal na página; o `<details>` do Rota de Vendas abre e mostra "Para quem é".
2. **Mouse:** clicar na seta "Próximo" muda o `data-pos="0"`. Clicar em "Ver detalhes" leva a `data-estado="aberto"`, com a URL em `#rota-de-vendas`. O X fecha e a URL volta ao que era.
3. **Altura constante:** o `getBoundingClientRect().top` de `#produtos + section`, medido antes de abrir, aberto, depois de trocar e depois de fechar, varia no máximo 0,5 px.
4. **Teclado:** foco num cartão lateral, → troca o centro e o `scrollY` não muda (a seta não vazou para a página). Com o painel aberto, Esc fecha e o `document.activeElement` fica dentro do cartão do centro.
5. **Miniaturas e filtro:** clicar na 3ª miniatura dá `aria-current` no Fleet. O filtro "Sites" com o painel aberto abre o Site para clínicas.
6. **Link direto:** `about:blank` e depois `/#rota-de-vendas` abrem o painel do Rota de Vendas, com a seção no topo (scroll-padding). O `history.back()` fecha (é `data-estado`, não página anterior, e a URL fica sem `#rota-de-vendas`).
7. **Reduced motion:** 50 ms depois do clique em "Próximo", o `transform` do novo centro já é o final (`matrix(1, 0, 0, 1, 0, 0)` ou `none`) e não existe `.catalogo__loop`.
8. **Loop:** sem reduced motion, o `.catalogo__loop` do centro está `paused` em até 5,5 s depois de tocar, com `currentTime` igual a 0.
9. **1 vídeo por vez:** com o vídeo do painel tocando, centralizar outro cartão (depois de fechar) não faz o loop tocar.

`catalogoExtras`:
- **Menu da barra:** a 1440, "Produtos ▾" leva a "Fleet Analytics BI" e abre o painel. A 360, o mesmo pelo Menu.
- **Toque a 360 px** (`Input.dispatchTouchEvent`): arrastar 120 px para a esquerda troca o centro; arrastar 200 px para cima rola a página e não troca.
- **Cores forçadas** (`Emulation.setEmulatedMedia` com `forced-colors: active`): setas, contorno do ativo na fita e X visíveis (contraste ≥ 3:1, como no `expForcedColorsPass`).
- **1.4.12 a 320 px:** com `TEXT_SPACING_CSS`, todo o conteúdo da Visão geral do replay é alcançável (a seção cresce ou o painel rola) e a página não ganha rolagem horizontal.

- [ ] **Step 1: Escrever a etapa e rodar contra o código certo.** Run, em dois terminais: `npm run dev` e depois `npm run check:browser`. Expected: exit 0, com as linhas do catálogo no log.
- [ ] **Step 2: Provar que as checagens falham (mutações).** Para cada mutação, aplicar, rodar `npm run check:browser`, ver a falha nomeada e desfazer (`git checkout -- <arquivo>`):
  - (a) tirar o `height` do `.catalogo__corpo` → falha da altura constante;
  - (b) apagar o `history.back()` do `useCatalogo` → falha do voltar;
  - (c) tirar o timeout de 5 s do `CartaoLoop` e pôr `loop` no `<video>` → falha do loop;
  - (d) tirar o filtro de alvo das setas (Review Focus 2) → falha do teclado;
  - (e) tirar o `touch-action: pan-y` → falha do toque.

  Registrar o resultado no corpo do commit.
- [ ] **Step 3: Commit** `test(check-browser): etapa do catálogo (sem JS, altura constante, teclado, âncora, loop, toque) e âncoras pela barra nova`.

---

### Task 11: Documentos

**Files:**
- Modify: `design-system/strukti-solucoes/MASTER.md` (§8.8 reescrita como "Catálogo de produtos", §6 e §3.4), `docs/DECISOES.md` (ADR-011), `README.md` e `docs/landing-copy.md` ("Textos de interface dos cartões" dá lugar à microcopy do catálogo)

- [ ] **Step 1: MASTER.**
  - **§8.8:** coverflow (com os valores da §3.1), painel, fita, filtro, altura constante com a exceção de telas baixas, movimento, acessibilidade, ganchos estáveis e contrato da mídia.
  - **§6:** "nada gira sozinho" e o loop de 5 s.
  - **§3.4:** como medir o contraste do texto do cartão do centro sobre o degradê. Medir agora com os provisórios e anotar que a medida se repete com a arte final.
- [ ] **Step 2: ADR-011 no `DECISOES.md`**, no formato das ADRs 009 e 010:
  - catálogo em coverflow com painel;
  - referência do 21st.dev usada só como formato (ADR-005);
  - os fictícios em produção por decisão do dono;
  - altura constante;
  - barra "Produtos ▾".
- [ ] **Step 3: README.**
  - estrutura da página;
  - "Como trocar um item do catálogo": editar `src/content/catalogo.ts`, procurar `ficticio: true`, trocar a arte em `public/catalogo/<slug>/` com os mesmos nomes e rodar `catalogo.assets.test`;
  - a linha da etapa do catálogo no `check:browser`.
- [ ] **Step 4: Gates de texto.** Run: `npm run check:placeholders`. Expected: falha só nos 6 `[A PREENCHER]` que já existiam (mesma lista de antes).
- [ ] **Step 5: Commit** `docs(catalogo): MASTER §8.8/§6/§3.4, ADR-011, README e textos de interface`.

---

### Task 12: Integração, QA visual e PR

- [ ] **Step 1: Gates completos.** Run: `npm run typecheck && npm run lint && npx vitest run --maxWorkers=2 && npm run check:quarantine`. Depois, com `npm run dev` no ar, `npm run check:browser`. Expected: tudo verde; o `check:placeholders` só com os 6 que já existiam.
- [ ] **Step 2: QA visual.** Capturas em 360, 390, 768, 1024 e 1440 de três situações: fechado, aberto e no meio de uma troca. Cada situação com e sem reduced motion. Salvar em `docs/capturas-cat1/` e conferir contra a §3 e o checklist anti-cara-de-IA (MASTER §10).
- [ ] **Step 3: Revisão do branch inteiro** (`superpowers:requesting-code-review`) com foco em:
  - a11y ao vivo;
  - ADR-004, 005 e 008;
  - fidelidade à spec;
  - os 5 itens do Review Focus.

  Corrigir e repetir os gates.
- [ ] **Step 4: Push e PR para `homologacao`**, com a prévia da Vercel. O corpo do PR lista os pontos que dependem do dono:
  - a aprovação dos textos;
  - a arte final (plano à parte);
  - as capturas reais.
  
  O merge é do dono.

```bash
git push -u origin feat/catalogo-produtos
gh pr create --base homologacao --title "feat(catalogo): catálogo de produtos em coverflow com painel e fita" --body-file <corpo>
```
