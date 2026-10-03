# Identidade "Estúdio" e home nova — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhar o andamento.

**Objetivo:** trocar o visual e a home do site da Strukti para a marca-mãe de produtos de hardware + IA (identidade "Estúdio"), com o hero em sequência de quadros 3D guiada pela rolagem e o catálogo de hardware e aplicativos.

**Arquitetura:** o site continua em Next.js (App Router), neste repositório. Os quadros do 3D são gerados fora do site, por um script do Blender versionado, comprimidos em AVIF com o ffmpeg e servidos de `public/`. Um componente cliente desenha no `<canvas>` o quadro correspondente à rolagem, com toda a matemática em funções puras testadas. O conteúdo segue no módulo único `src/content/landing.ts`, e as seções novas reaproveitam o formulário, a grade de vídeos e a barra do topo que já existem.

**Stack:** Next.js 15.5, React 19.3, TypeScript estrito, Vitest + Testing Library + axe-core, `motion` 13, Zod 4, PostgreSQL (`pg`). Ferramentas fora do `package.json`: Blender (versão estável atual) e ffmpeg 9 (já instalado em `C:\Users\Thiago\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe`).

**Spec:** `docs/superpowers/specs/2026-10-03-identidade-estudio-design.md` (commit `cc6a9db`). Leia a spec inteira antes de começar qualquer tarefa.

## Restrições globais

- Nenhuma dependência npm nova neste plano. Blender e ffmpeg são ferramentas da máquina, não entram no `package.json`.
- O Blender só é baixado e instalado **depois do ok explícito do Thiago** na conversa (download de ~400 MB de blender.org).
- Orçamento dos quadros: desktop ≤ 3.000.000 bytes no total; celular ≤ 1.200.000 bytes no total.
- Quadros: desktop com 90 quadros de 1600 × 1000 px; celular com 45 quadros de 800 × 900 px. Nomes `f000.avif` … `f089.avif` (desktop) e `f000.avif` … `f044.avif` (celular), mais `poster.avif` e `poster.jpg` em cada pasta, em `public/hero/sequencia/{desktop,celular}/`.
- Ponto de corte entre os dois conjuntos de quadros: `767px` (até 767 px de largura usa "celular").
- Rótulos de status, exatamente assim: "Piloto gratuito", "Em desenvolvimento", "Em uso", "Em breve".
- Regras de conteúdo (spec §10): nada inventado (clientes, depoimentos, números de uso, logos, resultados; onde faltar, `[A PREENCHER: ...]`); IA sempre "em breve"; nenhum concorrente citado; o 3D sempre identificado como ilustração do conceito; replay usa o Wi-Fi da arena (nunca prometer "funciona sem internet"); pt-BR com acentos.
- Nenhum texto novo entra em `src/content/landing.ts` antes da aprovação do Thiago do `docs/landing-copy.md` v2.0 (Tarefa 2).
- Hidratação (ADR-004): servidor e 1º render do cliente produzem o mesmo HTML; tudo que depende de `window`, `matchMedia` ou preferência de movimento só muda depois de montar.
- Arquivos servidos pelo próprio site; a CSP de `next.config.ts` não muda.
- Caminhos: a pasta do projeto é `C:\Dev\negocio` (D maiúsculo). Nunca use `C:\dev` em junction, `cd` ou script: o `next dev` empacota o Next duas vezes e a página não hidrata.
- Fila pesada: só um processo pesado por vez na máquina (npm ci/install, `next build`, `next dev`/`start`, `check:browser`, render do Blender, encode dos quadros). Antes de cada um, confira RAM livre ≥ 1,2 GB e o arquivo `C:\Dev\negocio-wt\FILA_PESADA.lock` (regra em `docs/maestro/FILA_PESADA.md`).
- Fluxo de entrega (README e `docs/maestro/papeis/comum.txt`): cada tarefa num branch curto a partir do `main` (`feat/`, `fix/`, `docs/`, `chore/`); Conventional Commits; `git add` com arquivos explícitos (nunca `-A` nem `.`); revisão da Crivo até APROVADO; integração por merge, nunca rebase; push só com ok do Thiago.
- Definição de pronto de toda tarefa com código: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run check:quarantine`, `npm run build` (com o dev parado) e `npm run check:browser` (com o site no ar), nesta ordem.
- Mensagens de commit terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Foco da revisão

Situações que a spec implica, nenhum teste de tarefa cobria, e mais podem atrapalhar uma pessoa de verdade (o teste de cada uma foi acrescentado à tarefa dona do código):

1. **Rolagem rápida antes de os quadros chegarem** (ou entrar pela âncora `#produtos` e voltar ao topo): o canvas mostra o quadro já carregado mais próximo do pedido, nunca fica em branco nem pisca. Teste na Tarefa 3 (`nearestLoadedFrame`) e na Tarefa 7 (desenha o quadro 3 quando só ele chegou e a rolagem pede o 45).
2. **Navegador que não lê AVIF ou quadros que falham** (Safari antigo, rede ruim): o hero volta sozinho ao pôster em JPG e a seção perde a altura extra. Teste na Tarefa 7.
3. **Girar o celular ou redimensionar a janela depois de carregar**: o conjunto de quadros não é baixado de novo e a imagem não deforma (`object-fit: cover` no canvas). Teste na Tarefa 7 (nenhuma imagem nova depois do `resize`).
4. **Clicar numa chamada com interesse quando o formulário já foi enviado com sucesso**: a mensagem de sucesso continua lá; o interesse só é marcado com o formulário à mostra. E uma segunda chamada troca a seleção anterior. Teste na Tarefa 8.
5. **Requisição forjada direto na API com um interesse fora da lista**: a rota responde 400 e nada é gravado. Teste na Tarefa 8.

## Onde o plano refina a spec

1. **História da câmera (spec §5.1):** o quadro 0 é o produto já iluminado em 3/4, e não "surgindo do escuro". O quadro 0 é o pôster (LCP e imagem de quem não anima); se ele fosse escuro, o canvas daria um salto ao assumir. O produto dá uma volta inteira e termina de frente (em vez de "uns 180°"), para o aperto do botão ficar visível.
2. **Interesse pré-marcado (spec §6):** em vez de "âncora com parâmetro", o link é `#contato` comum e, no clique, dispara um evento no `window`. Um `?interesse=` na URL faria a página recarregar.
3. **Orçamento dos quadros (spec §8):** conferido por um teste do Vitest (`heroSequence.assets.test.ts`), que já roda no `npm run test` da definição de pronto, em vez de um script separado.

---

## Mapa de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `CLAUDE.md` | Contexto do negócio com o novo rumo | 1 |
| `docs/DECISOES.md` | ADR-009 (rumo + identidade "Estúdio" + sequência de quadros) | 1 |
| `design-system/strukti-solucoes/MASTER.md` | Design system v3 "Estúdio" | 1 |
| `docs/maestro/ESTADO.md` | Backlog novo | 1 e 10 |
| `docs/landing-copy.md` | Texto v2.0 da home inteira (portão do Thiago) | 2 |
| `src/lib/heroSequence.ts` (+ `.test.ts`) | Matemática pura do hero: progresso, quadro, conjunto, URLs, quadro carregado mais próximo | 3 |
| `scripts/hero-3d/render.py` | Script do Blender: modelo, luz, câmera, render dos PNGs | 4 |
| `scripts/hero-3d/encode.mjs` | PNG → AVIF/JPG com o ffmpeg; relatório de tamanho | 4 |
| `scripts/hero-3d/README.md` | Como gerar os quadros de novo | 4 |
| `public/hero/sequencia/**` | Quadros e pôsteres gerados | 4 |
| `src/config/site.ts` | `heroSequence` (contagem e tamanho) e variante `"estudio"` | 4 e 7 |
| `src/config/heroSequence.assets.test.ts` | Confere arquivos e orçamento dos quadros | 4 |
| `src/content/landing.ts` | Texto aprovado da v2.0 | 5 e 10 |
| `src/components/ui/Palco.tsx`, `SeloStatus.tsx`, `FichaTecnica.tsx` (+ testes) | Peças do design system v3 | 6 |
| `src/app/globals.css` | Estilos v3: palco, selos, ficha, hero, produtos, aplicativos, contato | 6, 7, 8, 9 |
| `src/components/sections/HeroSequence.tsx`, `HeroSequenceScroller.tsx` (+ teste) | Hero "estudio" | 7 |
| `src/lib/interest.ts` (+ teste), `src/components/InterestLink.tsx` | Interesses do formulário e o evento que pré-marca o campo | 8 |
| `src/lib/validation.ts`, `src/lib/repository/leadRepository.ts`, `src/app/api/diagnostico/route.ts` | Campo `interest` de ponta a ponta | 8 |
| `src/components/sections/Contato.tsx` (+ teste) | Formulário único (era `Diagnostico.tsx`) | 8 |
| `src/components/sections/Produtos.tsx`, `Aplicativos.tsx`, `ChamadaHardware.tsx` (+ teste) | Seções novas | 9 |
| `src/components/sections/ProjectGrid.tsx` | Título opcional, selo por projeto, regra "um vídeo por vez" | 9 |
| `src/app/page.tsx` | Ordem nova da home | 7 e 10 |
| `scripts/check-browser.mjs` | Conferências do hero e dos vídeos da home nova | 10 |
| `README.md` | Hero "estudio", SQL da coluna `interest`, descrição do `check:browser` | 4, 7, 8, 10 |

---

### Tarefa 1: Documentação do novo rumo e design system v3

Branch: `docs/rumo-hardware-estudio`. Sem código; a Crivo revisa fidelidade à spec e às regras de conteúdo.

**Arquivos:**
- Modificar: `CLAUDE.md`
- Modificar: `docs/DECISOES.md` (acrescentar ADR-009 no fim)
- Modificar: `design-system/strukti-solucoes/MASTER.md`
- Modificar: `docs/maestro/ESTADO.md`

**Interfaces:**
- Consome: a spec.
- Produz: os nomes que o código das tarefas seguintes usa e o MASTER documenta: classes `.palco`, `.palco__luz`, `.palco__conteudo`, `.selo`, `.selo--piloto`, `.selo--desenvolvimento`, `.selo--em-uso`, `.selo--em-breve`, `.selo--ilustracao`, `.ficha`, `.hero-estudio`.

- [ ] **Passo 1: Atualizar o `CLAUDE.md`**

Logo depois da seção `## O que já existe`, inserir:

```markdown
## Rumo atual (desde 03/10/2026)
- **Foco maior: produtos que juntam hardware e IA.** Produto principal: sistema de replay para quadras esportivas de aluguel (o jogador aperta um botão na beira da quadra e recebe no celular o lance). Terá site próprio, ainda não começado. Segunda ideia, em espera: estacionamento inteligente para supermercados.
- **Aplicativos sob medida continuam**, em segundo plano (Rota de Vendas, Fleet Analytics BI).
- **O site da Strukti é a vitrine da marca-mãe:** catálogo de hardware (em destaque) e de aplicativos, com a chamada de cada produto e um contato geral. Spec: `docs/superpowers/specs/2026-10-03-identidade-estudio-design.md`.
- O replay usa o Wi-Fi da arena (não há roteador 4G). Ainda não há cliente nem quadra instalada: valem as regras de não inventar nada.
```

No título `## Conclusões da análise do negócio`, acrescentar ao fim da linha: ` (fase de aplicativos, antes de 03/10/2026)`.

Em `## A preencher pelo grupo`, trocar a linha `- Nicho escolhido:` por:

```markdown
- Nicho escolhido: quadras esportivas de aluguel (replay); distribuidoras e indústrias pequenas (aplicativos)
```

- [ ] **Passo 2: Acrescentar a ADR-009 ao fim de `docs/DECISOES.md`**

```markdown
---

## ADR-009 — Novo rumo (hardware + IA) e identidade "Estúdio"; hero em sequência de quadros

**Data:** 03/10/2026
**Decisão de:** Thiago (cliente), com o Claude
**Status:** aceita

**Contexto:** a Strukti mudou o foco para produtos que juntam hardware e IA (replay para quadras; estacionamento inteligente em espera), mantendo os aplicativos em segundo plano. O site vendia "aplicativo sob medida para distribuidoras" e o design system v2 ("Encaixe") foi pensado para isso.

**Decisão:**
1. O site vira a vitrine da marca-mãe: catálogo de hardware em destaque e de aplicativos. Cada produto pode ter site próprio depois (o do replay vem antes, fora deste trabalho).
2. Design system v3, "Estúdio": produto como peça de vitrine sob luz controlada, escuro como base, claro só onde se lê e se age. Fica tudo o que é marca (símbolo, Geologica, escalas de cor, as três assinaturas). Entram a luz de estúdio, o palco, os selos de status e a ficha técnica (`MASTER.md` v3).
3. Hero em **sequência de quadros pré-renderizada no Blender**, desenhada num `<canvas>` pela rolagem. O Three.js em tempo real foi a recomendação técnica (mais leve de trocar, nítido em qualquer tela); o cliente escolheu a sequência pelo visual mais fotográfico e por não ter biblioteca de 3D no site. Custo aceito: 3 MB (desktop) / 1,2 MB (celular) de quadros, carregados depois da página, e re-render a cada ajuste.
4. O modelo 3D é estilizado (não existe caixa definitiva do produto) e o site o identifica sempre como "Ilustração do conceito". Quando houver CAD/STL, o script passa a importá-lo; câmera, luz e saídas continuam.

**Consequências:** o texto da home é reescrito (`docs/landing-copy.md` v2.0); o formulário ganha o campo "interesse" e a tabela `leads`, a coluna `interest`; os heros "video" e "classic" ficam no código até a v3 estar aprovada no ar e saem numa limpeza separada, com ADR própria.
```

- [ ] **Passo 3: Passar o `MASTER.md` à v3**

3a. Trocar a 1ª linha por `# Design System — Strukti Soluções · v3 ("Estúdio")` e, no bloco de natureza do arquivo, trocar a última frase por: `Substitui a v2 ("Encaixe") no conceito, na luz e nos componentes novos (ADR-009); tudo da v2 que este arquivo não muda continua valendo.`

3b. Substituir o conteúdo de `## 1. Conceito` (até antes de `### Três assinaturas da marca`) por:

```markdown
## 1. Conceito

**Estúdio.** A Strukti mostra os produtos como peças de vitrine, sob luz controlada: o objeto (ou a tela do aplicativo) é o herói, num palco escuro. É a promessa da marca-mãe de hardware + IA: engenharia que se pode ver de perto.

**Escuro para mostrar, claro para ler.** O escuro é a base da página: topo, produtos, aplicativos e rodapé. O claro fica só onde se lê e se age: a chamada para outros problemas, como trabalhamos, equipe, contato, dúvidas e o aviso de privacidade.

**Uma ousadia só.** O momento memorável é o hero "estudio" (§9.7): o produto girando sob a luz conforme a rolagem. Todo o resto é quieto, preciso e tipográfico.
```

3c. Em `### Três assinaturas da marca (as únicas "decorações" permitidas)`, trocar o título por `### Quatro assinaturas da marca (as únicas "decorações" permitidas)` e acrescentar o item:

```markdown
4. **A luz de estúdio**: luz principal azul elétrico (`--color-electric-500`) atrás do produto e contorno ciano (`--color-cyan-400`). Só existe dentro de um palco (§8.13), nunca como fundo solto.
```

3d. Ao fim da seção 8 (antes de `## 9. Hero`), acrescentar:

```markdown
### 8.13 Palco

Superfície escura onde fica um produto (hero, cards de hardware, cards de aplicativos). Camadas: fundo `navy-950` → `navy-900` em degradê vertical; `.palco__luz` (elipse elétrica desfocada atrás do centro, contorno ciano fino embaixo, `aria-hidden`); `.palco__conteudo` (o objeto, a imagem ou a tela do app). Raio igual ao dos blocos (§5.3). O palco não tem texto dentro, salvo o selo de ilustração.

### 8.14 Selos de status

Todo produto mostra um selo, com texto fixo: **"Piloto gratuito"** (`.selo--piloto`, fundo `cyan-400`, texto `navy-950`), **"Em desenvolvimento"** (`.selo--desenvolvimento`, contorno `navy-300`, texto `navy-100`), **"Em uso"** (`.selo--em-uso`, fundo `navy-700`, texto branco), **"Em breve"** (`.selo--em-breve`, contorno tracejado `navy-300`). O selo de ilustração do 3D (`.selo--ilustracao`) é texto pequeno `navy-200` no canto inferior do palco. A informação está sempre no texto; a cor só reforça. Contraste AA conferido nos quatro.

### 8.15 Ficha técnica

Lista de definições (`<dl class="ficha">`) com 2 a 4 itens: valor grande (Geologica 700, SHRP 100, `font-variant-numeric: tabular-nums`) em cima, rótulo curto `text-subtle` embaixo. No DOM, `<dt>` (rótulo) vem antes de `<dd>` (valor); a ordem visual inverte por CSS.
```

3e. Ao fim da seção 9 (antes de `## 10.`), acrescentar:

```markdown
### 9.7 Hero "estudio" (padrão desde a v3)

Seção `#inicio` com o texto à esquerda (em cima abaixo de 768 px) e um palco com o produto à direita (embaixo). O produto é uma sequência de quadros pré-renderizada (`public/hero/sequencia/`, gerada por `scripts/hero-3d/`): desktop com 90 quadros de 1600 × 1000, celular (até 767 px) com 45 quadros de 800 × 900.

- Com animação: a seção tem 250svh de altura e o conteúdo fica fixo (`position: sticky`) enquanto a rolagem dentro dela escolhe o quadro desenhado no `<canvas>` (decorativo, `aria-hidden`).
- O pôster (quadro 0, em AVIF com JPG de reserva) vem no HTML e é o LCP. O quadro 0 é o produto em 3/4 já iluminado, para o canvas assumir sem salto.
- Sem animação (prefers-reduced-motion, "economizar dados", sem JavaScript, falha ao carregar os quadros): só o pôster, e a seção perde a altura extra.
- O selo "Ilustração do conceito" fica sempre visível no palco.
```

3f. Na seção `## 6. Motion`, acrescentar ao fim: `Animação guiada pela rolagem só existe no hero "estudio" (§9.7). No resto da página continuam as entradas suaves (Reveal).`

- [ ] **Passo 4: Atualizar o `docs/maestro/ESTADO.md`**

Trocar o título para `# Onde paramos — 03/10/2026 (novo rumo: hardware + IA)` e, logo abaixo da 1ª linha de texto, inserir:

```markdown
## Novo rumo (03/10/2026)

A Strukti passou a focar em produtos de hardware + IA (replay para quadras; estacionamento inteligente em espera); aplicativos continuam em segundo plano. O site vira a vitrine da marca-mãe, com a identidade "Estúdio" (ADR-009, `MASTER.md` v3).

- Spec: `docs/superpowers/specs/2026-10-03-identidade-estudio-design.md`.
- Plano: `docs/superpowers/plans/2026-10-03-identidade-estudio.md` (10 tarefas; a Tarefa 2, texto v2.0, é portão do Thiago).
- Nesta máquina o time roda como subagentes do Claude Code (o Maestri está com outro projeto).
```

- [ ] **Passo 5: Conferir e commitar**

Run: `git -C C:/Dev/negocio diff --stat`
Expected: 4 arquivos alterados, só documentação.

```bash
git add CLAUDE.md docs/DECISOES.md design-system/strukti-solucoes/MASTER.md docs/maestro/ESTADO.md
git commit -m "docs: novo rumo (hardware + IA), ADR-009 e design system v3 Estúdio"
```

- [ ] **Passo 6: Revisão da Crivo e merge no `main`** (sem build: só docs; rodar `npm run check:placeholders` não é exigido aqui).

---

### Tarefa 2: Texto v2.0 da home (portão do Thiago)

Branch: `docs/landing-copy-v2`. **Nada de código.** A tarefa só termina com o Thiago dizendo, na conversa, que aprova a v2.0. Pode rodar em paralelo às Tarefas 3 e 4.

**Arquivos:**
- Modificar: `docs/landing-copy.md` (reescrever da seção `## Ângulo` até o fim; manter `## Como ler este documento`)

**Interfaces:**
- Produz: um bloco de texto para **cada chave** listada no Passo 2, com o nome da chave no rótulo, para a Tarefa 5 copiar sem interpretar.

- [ ] **Passo 1: Cabeçalho e ângulo**

Status: `**rascunho para aprovação do cliente** · Versão 2.0 · <data> · Home nova da marca-mãe (hardware + IA), ADR-009.` Ângulo: a página fala com donos de negócio que podem usar um produto da Strukti (dono de quadra/arena, gerente de supermercado, empresa que precisa de aplicativo) e com quem tem um problema que pede hardware. Mapa da página igual à spec §4 (âncoras `#inicio`, `#produtos`, `#aplicativos`, `#sob-medida`, `#como-trabalhamos`, `#equipe`, `#contato`, `#duvidas`).

- [ ] **Passo 2: Escrever um bloco por chave**

Cada bloco com rótulo em negrito e o texto final (regras de `## Como ler este documento`):

| Chave (em `landingContent`) | O que escrever |
|---|---|
| `whatsappMessages.general` | Mensagem pronta genérica ("Vim pelo site da Strukti…") |
| `whatsappMessages.replay` | Mensagem pronta para agendar demonstração do replay |
| `whatsappMessages.estacionamento` | Mensagem pronta para conversar sobre o estacionamento |
| `whatsappMessages.aplicativo` | Mensagem pronta para o diagnóstico gratuito de aplicativo |
| `header.nav` | 4 rótulos: Produtos (`#produtos`), Apps (`#aplicativos`), Equipe (`#equipe`), Contato (`#contato`) |
| `heroEstudio.eyebrow`, `.headline`, `.body`, `.primaryCta`, `.whatsappCta`, `.illustrationBadge` | H1 sobre a Strukti hardware + IA; `primaryCta` = "Conhecer o replay"; `illustrationBadge` = "Ilustração do conceito" |
| `produtos.title`, `.intro` | Título e introdução da seção |
| `produtos.replay.name`, `.oneLiner`, `.stepsTitle`, `.steps` (3 × `lead`/`rest`), `.specs` (3 × `value`/`label`: "30 s", "Wi-Fi", "PoE"), `.cta` ("Agendar demonstração"), `.siteLinkLabel` | Card do replay. Os passos: aperta o botão → o clipe é cortado → chega no celular |
| `produtos.estacionamento.name`, `.oneLiner`, `.cta` ("Quero conversar sobre isso") | Card do estacionamento |
| `aplicativos.title`, `.intro`, `.cta` ("Diagnóstico gratuito"), `.grid.playLabel`, `.grid.showMore`, `.videoDescriptionLinkLabel` | Seção de aplicativos |
| `aplicativos` → `status` de cada projeto | Um dos 4 rótulos fixos. **Atenção:** o Rota de Vendas não tem cliente usando; "Em uso" só com confirmação do Thiago (sugestão a perguntar: "Piloto gratuito") |
| `chamadaHardware.title`, `.body`, `.cta` | "Tem um problema que pede hardware?" e o convite a conversar |
| `comoTrabalhamos.title`, `.intro`, `.items` (4 × `title`/`description`) | Diagnóstico, protótipo, instalação, suporte local |
| `equipe.title`, `.intro` | Grupo de estudantes de engenharia da computação; cursos de cada pessoa ficam `[A PREENCHER: curso]` |
| `contato.title`, `.intro`, `.form.*` | Todos os textos do formulário atual (`diagnostico.form`) revistos para o formulário único, mais `form.fields.interest.label`, `.placeholder`, `.errorEmpty` e `.options.replay/estacionamento/aplicativo/outro`; `form.fields.problem` vira "mensagem" (rótulo, ajuda, erros) |
| `faq.items`, `.closing`, `.button` | Dúvidas da marca-mãe (incluir "o replay precisa de internet?" → Wi-Fi da arena; "e quando vocês se formarem?"); nada de preço inventado |
| `rodape.tagline`, `.location` | Linha da marca-mãe |
| `seo.title`, `.description`, `.ogTitle`, `.ogDescription`, `.ogImageAlt` | SEO da marca-mãe |
| `privacidade.sections` | Aviso revisto: coleta (nome, empresa, WhatsApp, interesse, mensagem), finalidade, resto igual |
| **Versão do aviso** | A data (AAAA-MM-DD) que vai para `siteConfig.privacyPolicyVersion` |

- [ ] **Passo 3: Conferir as regras de conteúdo** contra a lista das Restrições globais (busca por "4G", "sem internet", nomes de concorrentes, números que não estejam na spec). Atualizar a lista `## Pendências [A PREENCHER]` no fim do documento.

- [ ] **Passo 4: Commit e revisão da Crivo**

```bash
git add docs/landing-copy.md
git commit -m "docs(copy): landing-copy v2.0 da home da marca-mãe (hardware + IA)"
```

- [ ] **Passo 5: Portão.** Apresentar o documento ao Thiago e esperar a aprovação na conversa. Ajustes pedidos viram novos commits no mesmo branch, com nova revisão do delta. Só então merge no `main`.

---

### Tarefa 3: Funções puras do hero

Branch: `feat/hero-sequence-lib`. Pode rodar antes do portão da Tarefa 2.

**Arquivos:**
- Criar: `src/lib/heroSequence.ts`
- Teste: `src/lib/heroSequence.test.ts`

**Interfaces:**
- Produz (usado nas Tarefas 4, 7 e 9):
  - `type FrameSetName = "desktop" | "celular"`
  - `const CELULAR_MAX_WIDTH = 767`
  - `frameForProgress(progress: number, totalFrames: number): number`
  - `sectionProgress(top: number, height: number, viewportHeight: number): number`
  - `pickFrameSet(viewportWidth: number): FrameSetName`
  - `frameUrl(set: FrameSetName, index: number): string` → `/hero/sequencia/<set>/fNNN.avif`
  - `posterUrl(set: FrameSetName, format: "avif" | "jpg"): string` → `/hero/sequencia/<set>/poster.<format>`
  - `nearestLoadedFrame(loaded: readonly boolean[], target: number): number | null`

- [ ] **Passo 1: Escrever os testes que falham**

```ts
import { describe, expect, it } from "vitest";
import {
  CELULAR_MAX_WIDTH,
  frameForProgress,
  frameUrl,
  nearestLoadedFrame,
  pickFrameSet,
  posterUrl,
  sectionProgress,
} from "./heroSequence";

describe("frameForProgress", () => {
  it("vai do primeiro ao último quadro", () => {
    expect(frameForProgress(0, 90)).toBe(0);
    expect(frameForProgress(1, 90)).toBe(89);
    expect(frameForProgress(0.5, 90)).toBe(45);
  });

  it("prende valores fora de 0–1 nas pontas", () => {
    expect(frameForProgress(-0.3, 90)).toBe(0);
    expect(frameForProgress(1.7, 90)).toBe(89);
  });

  it("trata NaN e infinito como início", () => {
    expect(frameForProgress(Number.NaN, 90)).toBe(0);
    expect(frameForProgress(Number.POSITIVE_INFINITY, 90)).toBe(0);
  });

  it("com um quadro só, ou nenhum, devolve 0", () => {
    expect(frameForProgress(0.8, 1)).toBe(0);
    expect(frameForProgress(0.8, 0)).toBe(0);
  });
});

describe("sectionProgress", () => {
  it("é 0 com o topo da seção no topo da tela e 1 quando a seção acabou de rolar", () => {
    expect(sectionProgress(0, 2500, 1000)).toBe(0);
    expect(sectionProgress(-1500, 2500, 1000)).toBe(1);
    expect(sectionProgress(-750, 2500, 1000)).toBe(0.5);
  });

  it("prende antes da seção e depois dela", () => {
    expect(sectionProgress(300, 2500, 1000)).toBe(0);
    expect(sectionProgress(-4000, 2500, 1000)).toBe(1);
  });

  it("seção sem altura extra (sem animação) fica em 0", () => {
    expect(sectionProgress(-200, 900, 1000)).toBe(0);
    expect(sectionProgress(-200, 1000, 1000)).toBe(0);
  });
});

describe("pickFrameSet", () => {
  it("usa celular até o ponto de corte e desktop depois", () => {
    expect(pickFrameSet(360)).toBe("celular");
    expect(pickFrameSet(CELULAR_MAX_WIDTH)).toBe("celular");
    expect(pickFrameSet(CELULAR_MAX_WIDTH + 1)).toBe("desktop");
    expect(pickFrameSet(1440)).toBe("desktop");
  });
});

describe("frameUrl e posterUrl", () => {
  it("monta o caminho com 3 dígitos", () => {
    expect(frameUrl("desktop", 0)).toBe("/hero/sequencia/desktop/f000.avif");
    expect(frameUrl("celular", 44)).toBe("/hero/sequencia/celular/f044.avif");
  });

  it("monta o pôster nos dois formatos", () => {
    expect(posterUrl("desktop", "avif")).toBe("/hero/sequencia/desktop/poster.avif");
    expect(posterUrl("celular", "jpg")).toBe("/hero/sequencia/celular/poster.jpg");
  });
});

describe("nearestLoadedFrame", () => {
  it("devolve o próprio quadro quando ele já chegou", () => {
    expect(nearestLoadedFrame([true, true, true], 1)).toBe(1);
  });

  it("procura o mais próximo, preferindo o anterior no empate", () => {
    const loaded = [true, false, false, false, true];
    expect(nearestLoadedFrame(loaded, 1)).toBe(0);
    expect(nearestLoadedFrame(loaded, 3)).toBe(4);
    expect(nearestLoadedFrame(loaded, 2)).toBe(0);
  });

  it("rolagem rápida: pede o 45 e só o 3 chegou", () => {
    const loaded = Array.from({ length: 90 }, (_, i) => i === 3);
    expect(nearestLoadedFrame(loaded, 45)).toBe(3);
  });

  it("devolve null quando nada chegou", () => {
    expect(nearestLoadedFrame([false, false], 1)).toBeNull();
    expect(nearestLoadedFrame([], 0)).toBeNull();
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/heroSequence.test.ts`
Expected: FAIL — `Failed to resolve import "./heroSequence"`.

- [ ] **Passo 3: Implementar**

```ts
/**
 * Matemática do hero "estudio" (MASTER §9.7, spec 2026-10-03 §5.2): tudo o
 * que não depende de DOM fica aqui, em funções puras e testadas. O
 * componente (HeroSequenceScroller) só cuida de carregar e desenhar.
 */

export type FrameSetName = "desktop" | "celular";

/** Até esta largura o hero usa os quadros "celular" (mesmo corte do CSS). */
export const CELULAR_MAX_WIDTH = 767;

/** Índice do quadro para um progresso de 0 a 1 (fora disso, prende nas pontas). */
export function frameForProgress(progress: number, totalFrames: number): number {
  if (totalFrames <= 1 || !Number.isFinite(progress)) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(totalFrames - 1, Math.round(clamped * (totalFrames - 1)));
}

/**
 * Quanto da seção já rolou, de 0 a 1: 0 com o topo dela no topo da tela, 1
 * quando o fim dela chega ao fim da tela. Seção sem altura extra: 0.
 */
export function sectionProgress(top: number, height: number, viewportHeight: number): number {
  const scrollable = height - viewportHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, -top / scrollable));
}

export function pickFrameSet(viewportWidth: number): FrameSetName {
  return viewportWidth <= CELULAR_MAX_WIDTH ? "celular" : "desktop";
}

export function frameUrl(set: FrameSetName, index: number): string {
  return `/hero/sequencia/${set}/f${String(index).padStart(3, "0")}.avif`;
}

export function posterUrl(set: FrameSetName, format: "avif" | "jpg"): string {
  return `/hero/sequencia/${set}/poster.${format}`;
}

/**
 * O quadro já carregado mais perto do pedido (no empate, o anterior), para o
 * canvas nunca ficar em branco numa rolagem mais rápida que o download.
 */
export function nearestLoadedFrame(loaded: readonly boolean[], target: number): number | null {
  for (let distance = 0; distance < loaded.length; distance++) {
    const before = target - distance;
    if (before >= 0 && before < loaded.length && loaded[before]) return before;
    const after = target + distance;
    if (after >= 0 && after < loaded.length && loaded[after]) return after;
  }
  return null;
}
```

- [ ] **Passo 4: Rodar e ver passar**

Run: `npx vitest run src/lib/heroSequence.test.ts`
Expected: PASS (15 testes).

- [ ] **Passo 5: typecheck e lint**

Run: `npm run typecheck && npx eslint src/lib/heroSequence.ts src/lib/heroSequence.test.ts`
Expected: sem erros.

- [ ] **Passo 6: Commit, revisão da Crivo e merge**

```bash
git add src/lib/heroSequence.ts src/lib/heroSequence.test.ts
git commit -m "feat(hero): funções puras da sequência de quadros (progresso, quadro, conjunto, URLs)"
```

---

### Tarefa 4: Quadros do 3D (Blender + ffmpeg) e conferência de orçamento

Branch: `feat/hero-3d-quadros`. Depende da Tarefa 3. Pode rodar antes do portão da Tarefa 2.

**Arquivos:**
- Criar: `scripts/hero-3d/render.py`, `scripts/hero-3d/encode.mjs`, `scripts/hero-3d/README.md`
- Criar (gerados): `public/hero/sequencia/desktop/f000.avif` … `f089.avif`, `poster.avif`, `poster.jpg`; `public/hero/sequencia/celular/f000.avif` … `f044.avif`, `poster.avif`, `poster.jpg`
- Modificar: `src/config/site.ts` (tipo e valor de `heroSequence`)
- Modificar: `.gitignore` (pasta `.hero-render/`)
- Teste: `src/config/heroSequence.assets.test.ts`

**Interfaces:**
- Consome: `frameUrl`, `posterUrl`, `FrameSetName` (Tarefa 3).
- Produz: `siteConfig.heroSequence: HeroSequenceSource`, com `HeroFrameSet = { frames: number; width: number; height: number }` e `HeroSequenceSource = { desktop: HeroFrameSet; celular: HeroFrameSet }`.

- [ ] **Passo 1: Pedir autorização e instalar o Blender**

Perguntar ao Thiago: "Posso instalar o Blender (versão estável atual, ~400 MB, de blender.org via winget `BlenderFoundation.Blender`)?". Só com o "sim":

Run: `winget install --id BlenderFoundation.Blender -e --accept-source-agreements --accept-package-agreements --disable-interactivity`
Depois: `"C:/Program Files/Blender Foundation/Blender <versão>/blender.exe" --version` (achar a pasta com `ls "/c/Program Files/Blender Foundation"`). Guardar o caminho em `BLENDER` para os passos seguintes.

- [ ] **Passo 2: Configuração e teste de arquivos que falha**

Em `src/config/site.ts`, logo depois de `HeroVideoSource`, acrescentar:

```ts
/** Um conjunto de quadros do hero "estudio" (MASTER §9.7). */
export interface HeroFrameSet {
  /** Quantidade de quadros: f000.avif … f(N-1).avif. */
  frames: number;
  width: number;
  height: number;
}

/**
 * Quadros do hero "estudio", gerados por scripts/hero-3d/ e servidos de
 * public/hero/sequencia/ (nunca de CDN). Os caminhos saem de
 * src/lib/heroSequence.ts (frameUrl, posterUrl).
 */
export interface HeroSequenceSource {
  desktop: HeroFrameSet;
  celular: HeroFrameSet;
}
```

E em `siteConfig`, depois de `heroVideo`:

```ts
  heroSequence: {
    desktop: { frames: 90, width: 1600, height: 1000 },
    celular: { frames: 45, width: 800, height: 900 },
  } as HeroSequenceSource,
```

Criar `src/config/heroSequence.assets.test.ts`:

```ts
// @vitest-environment node
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { siteConfig } from "./site";
import { frameUrl, posterUrl, type FrameSetName } from "@/lib/heroSequence";

// Orçamento da spec (2026-10-03, §5.1): os quadros baixam depois da página,
// mas pesam no plano de dados de quem rola o hero.
const BUDGET_BYTES: Record<FrameSetName, number> = { desktop: 3_000_000, celular: 1_200_000 };
const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");
const onDisk = (url: string) => path.join(PUBLIC_DIR, url);

describe.each(["desktop", "celular"] as const)("quadros do hero (%s)", (set) => {
  const { frames } = siteConfig.heroSequence[set];

  it("tem exatamente os quadros da configuração", () => {
    for (let index = 0; index < frames; index++) {
      expect(existsSync(onDisk(frameUrl(set, index))), frameUrl(set, index)).toBe(true);
    }
    expect(existsSync(onDisk(frameUrl(set, frames))), "quadro a mais na pasta").toBe(false);
  });

  it("cabe no orçamento", () => {
    let total = 0;
    for (let index = 0; index < frames; index++) total += statSync(onDisk(frameUrl(set, index))).size;
    expect(total, `${set}: ${total} bytes`).toBeLessThanOrEqual(BUDGET_BYTES[set]);
  });

  it("tem o pôster em AVIF e JPG", () => {
    expect(existsSync(onDisk(posterUrl(set, "avif")))).toBe(true);
    expect(existsSync(onDisk(posterUrl(set, "jpg")))).toBe(true);
  });
});
```

Run: `npx vitest run src/config/heroSequence.assets.test.ts`
Expected: FAIL — `/hero/sequencia/desktop/f000.avif: expected false to be true`.

- [ ] **Passo 3: Script do Blender**

Criar `scripts/hero-3d/render.py`:

```python
"""
Quadros do hero "estudio" (MASTER §9.7; spec 2026-10-03 §5.1).

Gera o botão do replay ESTILIZADO (não é a caixa definitiva do produto),
a luz de estúdio e a câmera, e renderiza PNGs numerados f000.png ...

Uso (sem abrir o Blender):
  blender -b --factory-startup -P scripts/hero-3d/render.py -- --set desktop --out C:/Dev/negocio/.hero-render/desktop

Quando houver o CAD/STL da caixa definitiva, troque build_product() por um
import do arquivo; luz, câmera e saídas continuam.
"""
import argparse
import math
import sys

import bpy

SETS = {"desktop": (1600, 1000, 90), "celular": (800, 900, 45)}

# Cores da marca (MASTER §3.1), em sRGB.
NAVY_950 = "#08121D"
NAVY_900 = "#0E1C2B"
NAVY_800 = "#15273B"
NAVY_100 = "#DFE7EF"
ELECTRIC_500 = "#0185E7"
ELECTRIC_700 = "#0166D2"
CYAN_400 = "#00D1D8"


def linear(hex_color):
    """sRGB hex -> RGBA linear (o Blender trabalha em linear)."""
    channels = [int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    out = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return (*out, 1.0)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--set", choices=SETS.keys(), required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--samples", type=int, default=64)
    # Prévia: só estes quadros (ex.: "0,45,89"), para acertar luz e enquadramento.
    parser.add_argument("--frames", default="")
    return parser.parse_args(argv)


def material(name, base, roughness=0.5, metallic=0.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = linear(base)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = linear(emission)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def add_bevel(obj, width, segments=6):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"


def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    world = bpy.data.worlds.new("estudio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = linear(NAVY_950)
    scene.world = world
    return scene


def build_floor():
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    floor = bpy.context.object
    floor.data.materials.append(material("piso", NAVY_900, roughness=0.3))


def build_product():
    """Botão de replay estilizado: caixa, botão, LED e o hexágono da marca."""
    bpy.ops.object.empty_add(location=(0, 0, 0))
    root = bpy.context.object
    root.name = "produto"

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.75))
    body = bpy.context.object
    body.dimensions = (1.1, 0.5, 1.5)
    bpy.ops.object.transform_apply(scale=True)
    add_bevel(body, 0.12)
    body.data.materials.append(material("caixa", NAVY_800, roughness=0.45))
    body.parent = root

    bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.12, location=(0, -0.28, 0.95), rotation=(math.radians(90), 0, 0))
    button = bpy.context.object
    add_bevel(button, 0.03, 4)
    button.data.materials.append(material("botao", ELECTRIC_700, roughness=0.25, emission=ELECTRIC_500, strength=0.4))
    button.parent = root

    bpy.ops.mesh.primitive_cube_add(location=(0, -0.255, 0.38))
    led = bpy.context.object
    led.dimensions = (0.36, 0.02, 0.05)
    bpy.ops.object.transform_apply(scale=True)
    led_mat = material("led", CYAN_400, roughness=0.2, emission=CYAN_400, strength=0.0)
    led.data.materials.append(led_mat)
    led.parent = root

    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.1, depth=0.02, location=(0, -0.255, 1.36), rotation=(math.radians(90), 0, 0))
    hexagon = bpy.context.object
    hexagon.data.materials.append(material("hexagono", NAVY_100, roughness=0.35))
    hexagon.parent = root

    return root, button, led_mat


def build_lights():
    """Luz de estúdio (MASTER §1, 4ª assinatura): elétrica atrás, contorno ciano, preenchimento suave."""
    def area(name, location, energy, color, size):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = linear(color)[:3]
        light.data.size = size
        constraint = light.constraints.new("TRACK_TO")
        constraint.target = bpy.data.objects["produto"]
        return light

    area("principal", (0, 3.0, 2.2), 700, ELECTRIC_500, 3.0)
    area("contorno", (2.6, 1.2, 1.6), 350, CYAN_400, 1.5)
    area("preenchimento", (-2.6, -2.8, 2.6), 180, "#FFFFFF", 4.0)

    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=2.4, fill_type="NGON", location=(0, 3.2, 1.0), rotation=(math.radians(90), 0, 0))
    halo = bpy.context.object
    halo.data.materials.append(material("halo", NAVY_950, emission=ELECTRIC_500, strength=1.2))


def build_camera(scene):
    bpy.ops.object.empty_add(location=(0, 0, 0.8))
    target = bpy.context.object
    bpy.ops.object.camera_add(location=(0, -6.0, 1.2))
    camera = bpy.context.object
    camera.data.lens = 50
    constraint = camera.constraints.new("TRACK_TO")
    constraint.target = target
    scene.camera = camera
    return camera


def key(obj, path, frame, value, index=-1):
    if index >= 0:
        getattr(obj, path)[index] = value
    else:
        setattr(obj, path, value)
    obj.keyframe_insert(data_path=path, frame=frame, index=index)


def animate(root, button, led_mat, camera, frames):
    """
    A história (MASTER §9.7): o quadro 0 é o produto em 3/4, já iluminado
    (é o pôster); ele dá uma volta e termina de frente, a câmera aproxima,
    o botão é apertado e o LED acende.
    """
    last = frames - 1
    at = lambda t: round(t * last)

    key(root, "rotation_euler", 0, math.radians(-35), 2)
    key(root, "rotation_euler", at(0.65), math.radians(360), 2)

    key(camera, "location", at(0.55), -6.0, 1)
    key(camera, "location", at(0.8), -3.4, 1)
    key(camera, "location", at(0.55), 1.2, 2)
    key(camera, "location", at(0.8), 1.0, 2)

    key(button, "location", at(0.8), -0.28, 1)
    key(button, "location", at(0.86), -0.23, 1)
    key(button, "location", at(0.95), -0.26, 1)

    emission = led_mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
    emission.default_value = 0.0
    emission.keyframe_insert("default_value", frame=at(0.84))
    emission.default_value = 12.0
    emission.keyframe_insert("default_value", frame=at(0.88))


def configure_render(scene, width, height, frames, out, samples):
    engines = {item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = f"{out}/f###"
    scene.frame_start = 0
    scene.frame_end = frames - 1


def main():
    args = parse_args()
    width, height, frames = SETS[args.set]
    scene = build_scene()
    build_floor()
    root, button, led_mat = build_product()
    build_lights()
    camera = build_camera(scene)
    animate(root, button, led_mat, camera, frames)
    configure_render(scene, width, height, frames, args.out, args.samples)
    if args.frames:
        for frame in (int(value) for value in args.frames.split(",")):
            scene.frame_set(frame)
            scene.render.filepath = f"{args.out}/f{frame:03d}"
            bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)


main()
```

- [ ] **Passo 4: Renderizar um quadro de teste e mostrar ao Thiago**

(Fila pesada.) Prévia de 4 quadros, com poucas amostras, para acertar luz e enquadramento antes do lote:

Run: `"$BLENDER" -b --factory-startup -P scripts/hero-3d/render.py -- --set desktop --out C:/Dev/negocio/.hero-render/teste --samples 16 --frames 0,45,72,89`
Expected: `f000.png`, `f045.png`, `f072.png` e `f089.png` em `C:/Dev/negocio/.hero-render/teste/`. Abrir cada um com a ferramenta Read e conferir: no 0, o produto em 3/4, iluminado, fundo marinho, sem cortes; no 72, a câmera perto; no 89, o botão apertado e o LED aceso. Mostrar ao Thiago (SendUserFile) e ajustar `build_lights`, `build_camera` e `animate` até ele aprovar o visual.

- [ ] **Passo 5: Renderizar os dois conjuntos**

(Fila pesada, um de cada vez.)

Run: `"$BLENDER" -b --factory-startup -P scripts/hero-3d/render.py -- --set desktop --out C:/Dev/negocio/.hero-render/desktop`
Run: `"$BLENDER" -b --factory-startup -P scripts/hero-3d/render.py -- --set celular --out C:/Dev/negocio/.hero-render/celular`
Expected: 90 e 45 PNGs (`ls .hero-render/desktop | wc -l` → 90).

Acrescentar ao `.gitignore`:

```
# Render do hero 3D (PNGs intermediários; os AVIF vão para public/)
.hero-render/
```

- [ ] **Passo 6: Script de compressão**

Criar `scripts/hero-3d/encode.mjs`:

```js
#!/usr/bin/env node
// PNG (render do Blender) -> AVIF dos quadros + pôster AVIF/JPG do quadro 0
// (MASTER §9.7; spec 2026-10-03 §5.1). Uso:
//   node scripts/hero-3d/encode.mjs [--crf 34]
// Lê .hero-render/{desktop,celular}/f###.png e escreve em
// public/hero/sequencia/{desktop,celular}/. FFMPEG_PATH escolhe o ffmpeg.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SETS = ["desktop", "celular"];
const crfArg = process.argv.indexOf("--crf");
const CRF = crfArg > -1 ? Number(process.argv[crfArg + 1]) : 34;
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";

function ffmpeg(args) {
  execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

function avif(input, output, crf) {
  ffmpeg(["-i", input, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", String(crf), "-b:v", "0", "-cpu-used", "6", "-pix_fmt", "yuv420p", output]);
}

for (const set of SETS) {
  const source = path.join(ROOT, ".hero-render", set);
  const target = path.join(ROOT, "public", "hero", "sequencia", set);
  mkdirSync(target, { recursive: true });
  const pngs = readdirSync(source).filter((name) => /^f\d{3}\.png$/.test(name)).sort();
  if (pngs.length === 0) throw new Error(`Nenhum PNG em ${source}. Rode o render.py antes.`);

  let total = 0;
  for (const png of pngs) {
    const out = path.join(target, png.replace(".png", ".avif"));
    avif(path.join(source, png), out, CRF);
    total += statSync(out).size;
  }
  // Pôster = quadro 0, com mais qualidade (é o LCP e a imagem de quem não anima).
  avif(path.join(source, pngs[0]), path.join(target, "poster.avif"), Math.max(CRF - 6, 18));
  ffmpeg(["-i", path.join(source, pngs[0]), "-q:v", "3", path.join(target, "poster.jpg")]);

  console.log(`${set}: ${pngs.length} quadros, ${(total / 1_000_000).toFixed(2)} MB (crf ${CRF})`);
}
```

- [ ] **Passo 7: Comprimir e acertar o orçamento**

(Fila pesada.)

Run: `FFMPEG_PATH="C:/Users/Thiago/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe" node scripts/hero-3d/encode.mjs`
Expected: duas linhas `desktop: 90 quadros, X MB` e `celular: 45 quadros, Y MB`, com X ≤ 3,00 e Y ≤ 1,20. Se passar, rodar de novo com `--crf 38`, depois `--crf 42`. Se nem assim couber, reduzir a contagem em `SETS` do `render.py` **e** em `siteConfig.heroSequence` (mesmo número), renderizar de novo e voltar ao Passo 7.

- [ ] **Passo 8: Rodar o teste de arquivos**

Run: `npx vitest run src/config/heroSequence.assets.test.ts`
Expected: PASS (6 testes).

- [ ] **Passo 9: Mostrar quadros ao Thiago**

Mandar ao Thiago (SendUserFile) `poster.jpg` do desktop e 3 quadros (f030, f060, f089, convertidos para JPG em `.hero-render/preview/` com o ffmpeg) e esperar o ok antes do commit.

- [ ] **Passo 10: README dos quadros**

Criar `scripts/hero-3d/README.md`:

```markdown
# Quadros do hero "estudio"

O hero da home (MASTER §9.7) é uma sequência de quadros gerada aqui. Os PNGs
ficam em `.hero-render/` (fora do git); os AVIF e os pôsteres vão para
`public/hero/sequencia/`.

1. Instale o Blender (versão estável) e o ffmpeg.
2. Renderize (um de cada vez; é processo pesado):
   `blender -b --factory-startup -P scripts/hero-3d/render.py -- --set desktop --out <repo>/.hero-render/desktop`
   e o mesmo com `--set celular`.
3. Comprima: `node scripts/hero-3d/encode.mjs [--crf 34]` (ou `FFMPEG_PATH=...`).
4. Confira: `npx vitest run src/config/heroSequence.assets.test.ts` (quantidade e orçamento: 3 MB desktop, 1,2 MB celular).

Mudou a quantidade de quadros? Ajuste `SETS` no `render.py` e `siteConfig.heroSequence` juntos.
O modelo é estilizado; com o CAD/STL da caixa definitiva, troque `build_product()` por um import.
```

- [ ] **Passo 11: Definição de pronto e commit**

Run: `npm run typecheck && npm run lint && npm run test && npm run check:quarantine`
Expected: tudo passa (o build e o `check:browser` não mudam nesta tarefa: nada usa os quadros ainda; rodar mesmo assim, pela regra).

```bash
git add .gitignore scripts/hero-3d/render.py scripts/hero-3d/encode.mjs scripts/hero-3d/README.md src/config/site.ts src/config/heroSequence.assets.test.ts public/hero/sequencia
git commit -m "feat(hero): quadros 3D do botão de replay (Blender + AVIF) e conferência de orçamento"
```

Revisão da Crivo (ela confere o script, o orçamento e os quadros) e merge.

---

### Tarefa 5: Conteúdo aprovado no `landing.ts`

Branch: `feat/conteudo-v2`. **Só depois do portão da Tarefa 2.** Acrescenta as chaves novas sem apagar as antigas (as seções atuais continuam funcionando até a Tarefa 10).

**Arquivos:**
- Modificar: `src/content/landing.ts`
- Teste: `src/content/landing.test.ts` (novo)

**Interfaces:**
- Produz (usado nas Tarefas 6 a 10):
  - `export type ProductStatus = "piloto" | "desenvolvimento" | "emUso" | "emBreve"`
  - `landingContent.statusLabels: Record<ProductStatus, string>`
  - `landingContent.whatsappMessages.{general, replay, estacionamento, aplicativo}` (mantém `diagnostico` até a Tarefa 10)
  - `landingContent.heroEstudio: { eyebrow, headline, body, primaryCta, whatsappCta, illustrationBadge }`
  - `landingContent.produtos: { title, intro, replay: { name, oneLiner, stepsTitle, steps: readonly { lead: string; rest: string }[], specs: readonly { value: string; label: string }[], cta, siteUrl: string | null, siteLinkLabel }, estacionamento: { name, oneLiner, cta } }`
  - `landingContent.aplicativos: { title, intro, cta, projects: readonly Project[], grid: { showMore, playLabel }, videoDescriptionLinkLabel }`
  - `landingContent.chamadaHardware: { title, body, cta }`
  - `landingContent.comoTrabalhamos: { title, intro, items: readonly { title: string; description: string }[] }`
  - `landingContent.contato: { title, intro, form }` — `form` com a mesma forma de `diagnostico.form`, mais `fields.interest: { label, placeholder, errorEmpty, options: Record<Interest, string> }` (o tipo `Interest` vem da Tarefa 8; aqui use as chaves literais `replay`, `estacionamento`, `aplicativo`, `outro`)
  - `Project` ganha `status?: ProductStatus`

- [ ] **Passo 1: Teste que falha**

Criar `src/content/landing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { landingContent } from "./landing";

describe("landingContent v2.0", () => {
  it("tem os quatro rótulos de status exatamente como na spec", () => {
    expect(landingContent.statusLabels).toEqual({
      piloto: "Piloto gratuito",
      desenvolvimento: "Em desenvolvimento",
      emUso: "Em uso",
      emBreve: "Em breve",
    });
  });

  it("o replay tem 3 passos e a ficha com Wi-Fi (nunca 4G)", () => {
    const { replay } = landingContent.produtos;
    expect(replay.steps).toHaveLength(3);
    expect(replay.specs.map((spec) => spec.value)).toContain("Wi-Fi");
    expect(JSON.stringify(landingContent)).not.toMatch(/\b4G\b/);
  });

  it("o hero identifica o 3D como ilustração do conceito", () => {
    expect(landingContent.heroEstudio.illustrationBadge).toBe("Ilustração do conceito");
  });

  it("todo aplicativo tem um status da lista", () => {
    for (const project of landingContent.aplicativos.projects) {
      expect(Object.keys(landingContent.statusLabels)).toContain(project.status);
    }
  });

  it("o formulário tem as quatro opções de interesse", () => {
    expect(Object.keys(landingContent.contato.form.fields.interest.options).sort()).toEqual(
      ["aplicativo", "estacionamento", "outro", "replay"],
    );
  });
});
```

Run: `npx vitest run src/content/landing.test.ts`
Expected: FAIL — `Cannot read properties of undefined (reading 'piloto')` ou erro de tipo equivalente.

- [ ] **Passo 2: Acrescentar as chaves**

No topo do arquivo, atualizar o comentário para `docs/landing-copy.md (v2.0, <data da aprovação>)`. Acrescentar:

```ts
export type ProductStatus = "piloto" | "desenvolvimento" | "emUso" | "emBreve";
```

Em `interface Project`, acrescentar `status?: ProductStatus;` e, em cada item de `PROJECTS`, o `status` aprovado na v2.0.

Em `landingContent`, acrescentar (os valores entre `«»` são copiados **exatamente** do bloco de mesma chave no `docs/landing-copy.md` v2.0; os que aparecem como texto já são fixos pela spec):

```ts
  statusLabels: {
    piloto: "Piloto gratuito",
    desenvolvimento: "Em desenvolvimento",
    emUso: "Em uso",
    emBreve: "Em breve",
  } satisfies Record<ProductStatus, string>,

  heroEstudio: {
    eyebrow: «heroEstudio.eyebrow»,
    headline: «heroEstudio.headline»,
    body: «heroEstudio.body»,
    primaryCta: «heroEstudio.primaryCta»,
    whatsappCta: «heroEstudio.whatsappCta»,
    illustrationBadge: "Ilustração do conceito",
  },

  produtos: {
    title: «produtos.title»,
    intro: «produtos.intro»,
    replay: {
      name: «produtos.replay.name»,
      oneLiner: «produtos.replay.oneLiner»,
      stepsTitle: «produtos.replay.stepsTitle»,
      steps: [ /* 3 × { lead, rest } da v2.0 */ ],
      specs: [ /* 3 × { value, label } da v2.0: "30 s", "Wi-Fi", "PoE" */ ],
      cta: «produtos.replay.cta»,
      // Endereço do site próprio do replay: null até existir (o link some).
      siteUrl: null as string | null,
      siteLinkLabel: «produtos.replay.siteLinkLabel»,
    },
    estacionamento: {
      name: «produtos.estacionamento.name»,
      oneLiner: «produtos.estacionamento.oneLiner»,
      cta: «produtos.estacionamento.cta»,
    },
  },

  aplicativos: {
    title: «aplicativos.title»,
    intro: «aplicativos.intro»,
    cta: «aplicativos.cta»,
    projects: PROJECTS,
    grid: { showMore: «aplicativos.grid.showMore», playLabel: «aplicativos.grid.playLabel» },
    videoDescriptionLinkLabel: «aplicativos.videoDescriptionLinkLabel»,
  },

  chamadaHardware: { title: «…», body: «…», cta: «…» },

  comoTrabalhamos: { title: «…», intro: «…», items: [ /* 4 × { title, description } */ ] },

  contato: {
    title: «contato.title»,
    intro: «contato.intro»,
    form: { /* todos os campos de diagnostico.form, com o texto da v2.0, mais: */
      fields: {
        /* name, company, whatsapp, problem: como em diagnostico.form.fields, texto da v2.0 */
        interest: {
          label: «contato.form.fields.interest.label»,
          placeholder: «contato.form.fields.interest.placeholder»,
          errorEmpty: «contato.form.fields.interest.errorEmpty»,
          options: {
            replay: «…options.replay»,
            estacionamento: «…options.estacionamento»,
            aplicativo: «…options.aplicativo»,
            outro: «…options.outro»,
          },
        },
      },
    },
  },
```

E em `whatsappMessages`, acrescentar `replay`, `estacionamento` e `aplicativo` com as mensagens da v2.0 (como constantes no topo, no padrão de `WHATSAPP_GENERAL_MESSAGE`), e trocar o valor de `general` pelo da v2.0.

> Os `«»` acima são marcadores **deste plano** para "copiar da v2.0 aprovada"; no código não sobra nenhum. O `check:placeholders` só aceita os `[A PREENCHER: ...]` que a própria v2.0 tiver.

- [ ] **Passo 3: Rodar e ver passar**

Run: `npx vitest run src/content/landing.test.ts`
Expected: PASS (5 testes).

- [ ] **Passo 4: Definição de pronto, commit, revisão e merge**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: tudo passa (nenhum componente usa as chaves novas ainda).

```bash
git add src/content/landing.ts src/content/landing.test.ts
git commit -m "feat(conteudo): texto v2.0 aprovado da home da marca-mãe"
```

A Crivo confere, linha a linha, que cada valor é idêntico ao da v2.0.

---

### Tarefa 6: Peças do design system v3 — palco, selo e ficha técnica

Branch: `feat/ds3-pecas`. Depende da Tarefa 5 (`statusLabels`).

**Arquivos:**
- Criar: `src/components/ui/Palco.tsx`, `src/components/ui/SeloStatus.tsx`, `src/components/ui/FichaTecnica.tsx`
- Teste: `src/components/ui/ds3.test.tsx`
- Modificar: `src/app/globals.css` (nova seção no fim: "DS v3 — palco, selos, ficha")

**Interfaces:**
- Consome: `landingContent.statusLabels`, `ProductStatus` (Tarefa 5).
- Produz:
  - `Palco({ children, className }: { children: ReactNode; className?: string }): JSX.Element` → `div.palco > (div.palco__luz[aria-hidden] + div.palco__conteudo)`
  - `SeloStatus({ status }: { status: ProductStatus }): JSX.Element` → `span.selo.selo--<status-css>`
  - `FichaTecnica({ items }: { items: readonly { value: string; label: string }[] }): JSX.Element` → `dl.ficha`

- [ ] **Passo 1: Testes que falham**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { Palco } from "./Palco";
import { SeloStatus } from "./SeloStatus";
import { FichaTecnica } from "./FichaTecnica";

describe("peças do DS v3", () => {
  it("o palco envolve o conteúdo e esconde a luz da tecnologia assistiva", () => {
    const { container } = render(
      <Palco className="extra">
        <p>produto</p>
      </Palco>,
    );
    const palco = container.querySelector(".palco.extra");
    expect(palco).not.toBeNull();
    expect(palco?.querySelector(".palco__luz")?.getAttribute("aria-hidden")).toBe("true");
    expect(palco?.querySelector(".palco__conteudo")?.textContent).toBe("produto");
  });

  it.each([
    ["piloto", "selo--piloto"],
    ["desenvolvimento", "selo--desenvolvimento"],
    ["emUso", "selo--em-uso"],
    ["emBreve", "selo--em-breve"],
  ] as const)("o selo %s mostra o rótulo fixo", (status, className) => {
    render(<SeloStatus status={status} />);
    const selo = screen.getByText(landingContent.statusLabels[status]);
    expect(selo.classList.contains("selo")).toBe(true);
    expect(selo.classList.contains(className)).toBe(true);
  });

  it("a ficha técnica liga cada rótulo ao seu valor e passa no axe", async () => {
    const { container } = render(
      <FichaTecnica
        items={[
          { value: "30 s", label: "do lance" },
          { value: "Wi-Fi", label: "da arena" },
        ]}
      />,
    );
    const terms = container.querySelectorAll("dl.ficha dt");
    const values = container.querySelectorAll("dl.ficha dd");
    expect([...terms].map((term) => term.textContent)).toEqual(["do lance", "da arena"]);
    expect([...values].map((value) => value.textContent)).toEqual(["30 s", "Wi-Fi"]);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
```

Run: `npx vitest run src/components/ui/ds3.test.tsx`
Expected: FAIL — `Failed to resolve import "./Palco"`.

- [ ] **Passo 2: Implementar os três componentes**

`src/components/ui/Palco.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Palco do produto (MASTER §8.13): fundo escuro, luz de estúdio e o objeto. */
export function Palco({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("palco", className)}>
      <div className="palco__luz" aria-hidden="true" />
      <div className="palco__conteudo">{children}</div>
    </div>
  );
}
```

`src/components/ui/SeloStatus.tsx`:

```tsx
import { landingContent, type ProductStatus } from "@/content/landing";

const CLASS_BY_STATUS: Record<ProductStatus, string> = {
  piloto: "selo--piloto",
  desenvolvimento: "selo--desenvolvimento",
  emUso: "selo--em-uso",
  emBreve: "selo--em-breve",
};

/** Selo de status do produto (MASTER §8.14): o texto carrega a informação; a cor só reforça. */
export function SeloStatus({ status }: { status: ProductStatus }) {
  return <span className={`selo ${CLASS_BY_STATUS[status]}`}>{landingContent.statusLabels[status]}</span>;
}
```

`src/components/ui/FichaTecnica.tsx`:

```tsx
/** Ficha técnica (MASTER §8.15): rótulo antes do valor no DOM; o CSS mostra o valor em cima. */
export function FichaTecnica({ items }: { items: readonly { value: string; label: string }[] }) {
  return (
    <dl className="ficha">
      {items.map((item) => (
        <div key={item.label} className="ficha__item">
          <dt className="ficha__rotulo">{item.label}</dt>
          <dd className="ficha__valor">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Passo 3: CSS** — acrescentar ao fim de `src/app/globals.css`:

```css
/* ------------------------------------------------------------------ */
/* DS v3 — palco, selos, ficha técnica (MASTER §8.13–8.15)              */
/* ------------------------------------------------------------------ */
.palco {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: var(--radius-3);
  background: linear-gradient(180deg, var(--color-navy-950) 0%, var(--color-navy-900) 100%);
}

.palco__luz {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(55% 45% at 50% 42%, rgb(1 133 231 / 0.45), transparent 70%),
    linear-gradient(90deg, transparent 15%, rgb(0 209 216 / 0.55) 50%, transparent 85%) bottom / 100% 1px no-repeat;
  filter: blur(0.5px);
}

.palco__conteudo {
  position: relative;
  height: 100%;
}

.selo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid transparent;
}

.selo--piloto {
  background: var(--color-cyan-400);
  color: var(--color-navy-950);
}

.selo--desenvolvimento {
  border-color: var(--color-navy-300);
  color: var(--color-navy-100);
}

.selo--em-uso {
  background: var(--color-navy-700);
  color: #ffffff;
}

.selo--em-breve {
  border: 1px dashed var(--color-navy-300);
  color: var(--color-navy-100);
}

.selo--ilustracao {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-navy-200);
}

/* Selos sobre papel (superfície clara): troca as cores dos contornos. */
.surface-paper .selo--desenvolvimento,
.surface-paper .selo--em-breve {
  border-color: var(--color-navy-500);
  color: var(--color-navy-800);
}

.ficha {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5) var(--space-6);
  margin: var(--space-5) 0;
}

.ficha__item {
  display: flex;
  flex-direction: column-reverse;
}

.ficha__valor {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  font-variation-settings: "SHRP" 100;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.ficha__rotulo {
  font-size: 0.875rem;
  color: var(--text-subtle);
}
```

(`--radius-3` é o raio de 10 px dos blocos grandes, já definido no `:root` de `globals.css`.)

- [ ] **Passo 4: Rodar e ver passar**

Run: `npx vitest run src/components/ui/ds3.test.tsx`
Expected: PASS (6 testes).

- [ ] **Passo 5: Contraste dos selos** — conferir os 4 pares texto/fundo (e o contorno) com o mesmo método da §3.4 do MASTER (razão ≥ 4,5:1 para texto) e anotar as razões no MASTER §8.14.

- [ ] **Passo 6: Definição de pronto, commit, revisão e merge**

Run: `npm run typecheck && npm run lint && npm run test`

```bash
git add src/components/ui/Palco.tsx src/components/ui/SeloStatus.tsx src/components/ui/FichaTecnica.tsx src/components/ui/ds3.test.tsx src/app/globals.css design-system/strukti-solucoes/MASTER.md
git commit -m "feat(ds3): palco, selos de status e ficha técnica"
```

---

### Tarefa 7: Hero "estudio" (sequência de quadros no canvas)

Branch: `feat/hero-estudio`. Depende das Tarefas 3, 4, 5 e 6.

**Arquivos:**
- Criar: `src/components/sections/HeroSequence.tsx`, `src/components/sections/HeroSequenceScroller.tsx`
- Teste: `src/components/sections/HeroSequence.test.tsx`
- Modificar: `src/config/site.ts` (`HeroVariant` e padrão), `src/app/page.tsx`, `src/app/page.axe.test.tsx`, `src/app/page.hydration.test.tsx`, `src/app/globals.css`, `README.md`

**Interfaces:**
- Consome: `frameForProgress`, `sectionProgress`, `pickFrameSet`, `frameUrl`, `posterUrl`, `nearestLoadedFrame`, `CELULAR_MAX_WIDTH` (Tarefa 3); `siteConfig.heroSequence` (Tarefa 4); `landingContent.heroEstudio` (Tarefa 5); `.palco` e `.selo--ilustracao` (Tarefa 6); `useCanAnimate` (`src/lib/motion.ts`); `WhatsAppButton`.
- Produz: `HeroSequence()` (seção `#inicio.hero-estudio`, `data-scrub="true|false"`, canvas `.hero-estudio__canvas` com `data-frame` quando desenhado); `HeroVariant` passa a `"estudio" | "video" | "classic"`, com `"estudio"` padrão.

- [ ] **Passo 1: Testes que falham**

```tsx
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { frameUrl } from "@/lib/heroSequence";
import { HeroSequence } from "./HeroSequence";

// Image falsa: guarda cada pedido e deixa o teste decidir quando "chega" ou "falha".
class FakeImage {
  static instances: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decoding = "auto";
  src = "";
  constructor() {
    FakeImage.instances.push(this);
  }
}

const reduced = { matches: false };
const drawImage = vi.fn();

beforeEach(() => {
  FakeImage.instances = [];
  drawImage.mockClear();
  reduced.matches = false;
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("reduce") ? reduced.matches : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })),
  );
  // jsdom não tem canvas (setup.ts devolve null); aqui o hero precisa de um contexto 2D.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const desktopFrames = siteConfig.heroSequence.desktop.frames;
const section = () => document.getElementById("inicio") as HTMLElement;
const canvas = () => document.querySelector(".hero-estudio__canvas") as HTMLCanvasElement;

function scrollHeroTo(top: number) {
  vi.spyOn(section(), "getBoundingClientRect").mockReturnValue({ top, height: 2500 } as DOMRect);
  window.dispatchEvent(new Event("scroll"));
}

describe("<HeroSequence />", () => {
  it("mostra o texto aprovado, o pôster sem alt e o selo de ilustração", () => {
    render(<HeroSequence />);
    expect(screen.getByRole("heading", { level: 1, name: landingContent.heroEstudio.headline })).toBeTruthy();
    expect(screen.getByText(landingContent.heroEstudio.illustrationBadge)).toBeTruthy();
    expect(document.querySelector(".hero-estudio__poster")?.getAttribute("alt")).toBe("");
    expect(canvas().getAttribute("aria-hidden")).toBe("true");
  });

  it("com reduced motion fica no pôster e não baixa quadros", async () => {
    reduced.matches = true;
    render(<HeroSequence />);
    await act(async () => {});
    expect(section().dataset.scrub).toBe("false");
    expect(FakeImage.instances).toHaveLength(0);
  });

  it("sem reduced motion, baixa o conjunto desktop e desenha o quadro 0", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    expect(section().dataset.scrub).toBe("true");
    expect(FakeImage.instances).toHaveLength(desktopFrames);
    expect(FakeImage.instances[0].src).toBe(frameUrl("desktop", 0));
    act(() => FakeImage.instances[0].onload?.());
    expect(drawImage).toHaveBeenCalledWith(FakeImage.instances[0], 0, 0, 1600, 1000);
    expect(canvas().dataset.frame).toBe("0");
  });

  it("rolagem rápida: pede o meio e desenha o quadro carregado mais próximo", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => FakeImage.instances[3].onload?.());
    act(() => scrollHeroTo(-(2500 - window.innerHeight) / 2)); // pede o quadro 45
    expect(canvas().dataset.frame).toBe("3");
    expect(drawImage).toHaveBeenLastCalledWith(FakeImage.instances[3], 0, 0, 1600, 1000);
    expect(drawImage).not.toHaveBeenCalledWith(undefined, expect.anything(), expect.anything(), expect.anything(), expect.anything());
  });

  it("quadros que falham (ex.: sem AVIF) devolvem o hero ao pôster", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => {
      for (const image of FakeImage.instances.slice(0, Math.ceil(desktopFrames * 0.1) + 1)) image.onerror?.();
    });
    expect(section().dataset.scrub).toBe("false");
  });

  it("girar a tela não baixa os quadros de novo", async () => {
    render(<HeroSequence />);
    await act(async () => {});
    act(() => window.dispatchEvent(new Event("resize")));
    expect(FakeImage.instances).toHaveLength(desktopFrames);
  });
});
```

Run: `npx vitest run src/components/sections/HeroSequence.test.tsx`
Expected: FAIL — `Failed to resolve import "./HeroSequence"`.

- [ ] **Passo 2: Implementar o `HeroSequenceScroller`**

`src/components/sections/HeroSequenceScroller.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { useCanAnimate } from "@/lib/motion";
import {
  CELULAR_MAX_WIDTH,
  frameForProgress,
  frameUrl,
  nearestLoadedFrame,
  pickFrameSet,
  posterUrl,
  sectionProgress,
} from "@/lib/heroSequence";

/** Mais que isto de quadros com erro (ex.: navegador sem AVIF) e o hero fica no pôster. */
const MAX_FAILED_RATIO = 0.1;

/** `navigator.connection.saveData`: a pessoa pediu para economizar dados. */
function prefersSavingData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Hero "estudio" (MASTER §9.7): o pôster (quadro 0) vem no HTML; depois de
 * montar, sem reduced motion e sem "economizar dados", a seção ganha a
 * altura de rolagem (data-scrub) e o canvas desenha o quadro que a rolagem
 * pede. O servidor e o 1º render do cliente são iguais (data-scrub="false",
 * ADR-004). O conjunto de quadros é escolhido uma vez, ao montar: girar a
 * tela não baixa tudo de novo (o canvas usa object-fit: cover).
 */
export function HeroSequenceScroller({ text, badge }: { text: ReactNode; badge: string }) {
  const canAnimate = useCanAnimate();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrub, setScrub] = useState(false);
  const desktop = siteConfig.heroSequence.desktop;

  useEffect(() => {
    if (!canAnimate || prefersSavingData()) return;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!section || !canvas || !context) return;

    const set = pickFrameSet(window.innerWidth);
    const { frames: total, width, height } = siteConfig.heroSequence[set];
    canvas.width = width;
    canvas.height = height;

    const images: HTMLImageElement[] = [];
    const loaded: boolean[] = new Array(total).fill(false);
    let failed = 0;
    let cancelled = false;
    let drawn: number | null = null;
    let rafId = 0;

    const draw = () => {
      rafId = 0;
      const rect = section.getBoundingClientRect();
      const target = frameForProgress(sectionProgress(rect.top, rect.height, window.innerHeight), total);
      const index = nearestLoadedFrame(loaded, target);
      if (index === null || index === drawn) return;
      context.drawImage(images[index], 0, 0, width, height);
      drawn = index;
      canvas.dataset.frame = String(index);
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(draw);
    };

    const load = () => {
      for (let index = 0; index < total; index++) {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          if (cancelled) return;
          loaded[index] = true;
          schedule();
        };
        image.onerror = () => {
          if (cancelled) return;
          failed += 1;
          if (failed > total * MAX_FAILED_RATIO) {
            cancelled = true;
            delete canvas.dataset.frame;
            setScrub(false);
          }
        };
        image.src = frameUrl(set, index);
        images[index] = image;
      }
    };

    setScrub(true);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Os quadros só baixam depois da página: o pôster continua sendo o LCP.
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", load);
      if (rafId) cancelAnimationFrame(rafId);
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
      delete canvas.dataset.frame;
      setScrub(false);
    };
  }, [canAnimate]);

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="hero-estudio surface-space"
      aria-labelledby="hero-title"
      data-scrub={scrub ? "true" : "false"}
      data-hides-fab=""
    >
      <div className="hero-estudio__sticky">
        <div className="container hero-estudio__grid">
          {text}
          <div className="palco hero-estudio__palco">
            <div className="palco__luz" aria-hidden="true" />
            <picture>
              <source media={`(max-width: ${CELULAR_MAX_WIDTH}px)`} type="image/avif" srcSet={posterUrl("celular", "avif")} />
              <source media={`(max-width: ${CELULAR_MAX_WIDTH}px)`} type="image/jpeg" srcSet={posterUrl("celular", "jpg")} />
              <source type="image/avif" srcSet={posterUrl("desktop", "avif")} />
              <img
                className="hero-estudio__poster"
                src={posterUrl("desktop", "jpg")}
                alt=""
                width={desktop.width}
                height={desktop.height}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <canvas ref={canvasRef} className="hero-estudio__canvas" aria-hidden="true" />
            <p className="selo selo--ilustracao">{badge}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

(O palco do hero usa as classes `.palco`/`.palco__luz` direto, sem o componente `Palco`, porque o `<picture>` e o `<canvas>` precisam ser irmãos no mesmo bloco posicionado.)

- [ ] **Passo 3: Implementar o `HeroSequence`**

`src/components/sections/HeroSequence.tsx`:

```tsx
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { HeroSequenceScroller } from "./HeroSequenceScroller";

/** Hero "estudio" (MASTER §9.7): texto aprovado à esquerda, produto no palco à direita. */
export function HeroSequence() {
  const { eyebrow, headline, body, primaryCta, whatsappCta, illustrationBadge } = landingContent.heroEstudio;

  return (
    <HeroSequenceScroller
      badge={illustrationBadge}
      text={
        <div className="hero-estudio__text">
          <p className="hero-estudio__eyebrow">{eyebrow}</p>
          <h1 id="hero-title" className="hero-estudio__title">
            {headline}
          </h1>
          <p className="lead">{body}</p>
          <div className="hero-estudio__actions">
            <a href="#produtos" className="btn btn--primary">
              {primaryCta}
            </a>
            <WhatsAppButton message={landingContent.whatsappMessages.general}>{whatsappCta}</WhatsAppButton>
          </div>
        </div>
      }
    />
  );
}
```

- [ ] **Passo 4: CSS do hero** — acrescentar ao fim de `globals.css`:

```css
/* ------------------------------------------------------------------ */
/* Hero "estudio" (MASTER §9.7)                                         */
/* ------------------------------------------------------------------ */
.hero-estudio {
  position: relative;
  min-height: 100svh;
}

.hero-estudio__sticky {
  min-height: 100svh;
  display: flex;
  align-items: center;
  padding: calc(var(--topbar-height) + var(--topbar-joint) + var(--space-6)) 0 var(--space-7);
}

/* Com animação: 2,5 telas de rolagem, conteúdo preso enquanto os quadros passam. */
.hero-estudio[data-scrub="true"] {
  height: 250svh;
}

.hero-estudio[data-scrub="true"] .hero-estudio__sticky {
  position: sticky;
  top: 0;
}

.hero-estudio__grid {
  display: grid;
  gap: var(--space-6);
  align-items: center;
}

@media (min-width: 768px) {
  .hero-estudio__grid {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  }
}

.hero-estudio__eyebrow {
  color: var(--color-cyan-300);
  font-weight: 600;
  margin-bottom: var(--space-3);
}

.hero-estudio__title {
  font-size: clamp(2rem, 4.6vw, 3.5rem);
  font-weight: 800;
  font-variation-settings: "SHRP" 100;
  line-height: 1.05;
  margin-bottom: var(--space-4);
}

.hero-estudio__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.hero-estudio__palco {
  aspect-ratio: 8 / 5;
}

@media (max-width: 767px) {
  .hero-estudio__palco {
    aspect-ratio: 8 / 9;
  }
}

.hero-estudio__poster,
.hero-estudio__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* O canvas só aparece com um quadro desenhado e com a animação ligada. */
.hero-estudio__canvas {
  visibility: hidden;
}

.hero-estudio[data-scrub="true"] .hero-estudio__canvas[data-frame] {
  visibility: visible;
}
```

- [ ] **Passo 5: Rodar o teste do hero**

Run: `npx vitest run src/components/sections/HeroSequence.test.tsx`
Expected: PASS (6 testes). Se o `useReducedMotion` do motion não ler o `matchMedia` falso na 1ª chamada, trocar a ordem: `vi.stubGlobal("matchMedia", …)` num `beforeAll` antes do `import` do componente (`await import("./HeroSequence")` dentro do teste), como em `page.hydration.test.tsx`.

- [ ] **Passo 6: Variante `"estudio"` e página**

Em `src/config/site.ts`: `export type HeroVariant = "estudio" | "video" | "classic";`, o comentário de `HeroVariant` ganha a linha `- "estudio": hero da v3 (MASTER §9.7): produto 3D em sequência de quadros guiada pela rolagem; usa a barra do topo do "video".` e `heroVariant: "estudio" as HeroVariant,`.

Em `src/app/page.tsx`:

```tsx
import { HeroSequence } from "@/components/sections/HeroSequence";
// …
export default function Home() {
  // A barra do topo e o hero mudam juntos (ver siteConfig.heroVariant).
  const variant = siteConfig.heroVariant;

  return (
    <>
      {variant === "classic" ? <Header /> : <TopBar />}
      <main id="conteudo-principal">
        {variant === "estudio" ? <HeroSequence /> : variant === "video" ? <HeroVideo /> : <Hero />}
        {/* demais seções sem mudança nesta tarefa */}
```

Em `src/app/page.axe.test.tsx` e `src/app/page.hydration.test.tsx`: trocar `describe.each(["video", "classic"] as const)` por `describe.each(["estudio", "video", "classic"] as const)`, o valor inicial do `heroVariant.current` por `"estudio"`, e as conferências de versão por:

```ts
expect(container.querySelector(variant === "classic" ? "header.site-header" : "header.topbar")).not.toBeNull();
```

(no axe) e

```ts
expect(serverHtml).toContain(variant === "classic" ? 'class="site-header' : 'class="topbar"');
```

(na hidratação). Atualizar o comentário dos dois arquivos: "Roda com as três versões do topo".

- [ ] **Passo 7: README** — em "Como trocar o visual do hero", acrescentar `"estudio"` como padrão, com 1 parágrafo apontando para MASTER §9.7 e `scripts/hero-3d/README.md`.

- [ ] **Passo 8: Definição de pronto**

Run: `npm run typecheck && npm run lint && npm run test && npm run check:quarantine && npm run build`
Depois, com `npm run dev` (porta 3000): `npm run check:browser`
Expected: tudo passa. O `check:browser` ainda não tem as conferências do hero (vêm na Tarefa 10), mas não pode acusar rolagem lateral nem erro no console com o hero novo. Olhar o hero no navegador a 360 e 1440 e conferir que os quadros giram com a rolagem.

- [ ] **Passo 9: Commit, revisão e merge**

```bash
git add src/components/sections/HeroSequence.tsx src/components/sections/HeroSequenceScroller.tsx src/components/sections/HeroSequence.test.tsx src/config/site.ts src/app/page.tsx src/app/page.axe.test.tsx src/app/page.hydration.test.tsx src/app/globals.css README.md
git commit -m "feat(hero): hero estudio com sequência de quadros guiada pela rolagem"
```

---

### Tarefa 8: Formulário único com interesse (Contato)

Branch: `feat/contato-interesse`. Depende da Tarefa 5 (`contato`, `whatsappMessages`).

**Arquivos:**
- Criar: `src/lib/interest.ts`, `src/lib/interest.test.ts`, `src/components/InterestLink.tsx`
- Mover: `src/components/sections/Diagnostico.tsx` → `src/components/sections/Contato.tsx`; `Diagnostico.test.tsx` → `Contato.test.tsx` (`git mv`)
- Modificar: `src/lib/validation.ts`, `src/lib/validation.test.ts`, `src/lib/repository/leadRepository.ts`, `src/app/api/diagnostico/route.ts`, `src/app/api/diagnostico/route.test.ts`, `src/config/site.ts` (`privacyPolicyVersion`), `src/app/page.tsx`, `README.md`

**Interfaces:**
- Produz:
  - `INTERESTS = ["replay", "estacionamento", "aplicativo", "outro"] as const`; `type Interest = (typeof INTERESTS)[number]`
  - `selectInterest(interest: Interest): void` — dispara `CustomEvent("strukti:interesse", { detail: interest })` no `window`
  - `onInterestSelected(handler: (interest: Interest) => void): () => void` — devolve a função que desinscreve
  - `InterestLink({ interest, className, children })` → `<a href="#contato">` que chama `selectInterest` no clique
  - `contatoFormSchema` (substitui `diagnosticoFormSchema`), com `interest: z.enum(INTERESTS)`; `type ContatoFormInput`
  - `Lead.interest: Interest`; coluna `interest` na tabela `leads`
  - `Contato()` — seção `#contato`

- [ ] **Passo 1: Testes do `interest` que falham**

`src/lib/interest.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { INTERESTS, onInterestSelected, selectInterest } from "./interest";

describe("interesse do formulário", () => {
  it("tem as quatro opções na ordem do formulário", () => {
    expect(INTERESTS).toEqual(["replay", "estacionamento", "aplicativo", "outro"]);
  });

  it("avisa quem está inscrito e para de avisar depois de desinscrever", () => {
    const handler = vi.fn();
    const unsubscribe = onInterestSelected(handler);
    selectInterest("aplicativo");
    expect(handler).toHaveBeenCalledWith("aplicativo");
    unsubscribe();
    selectInterest("outro");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignora eventos com um valor fora da lista", () => {
    const handler = vi.fn();
    const unsubscribe = onInterestSelected(handler);
    window.dispatchEvent(new CustomEvent("strukti:interesse", { detail: "hackeado" }));
    expect(handler).not.toHaveBeenCalled();
    unsubscribe();
  });
});
```

Run: `npx vitest run src/lib/interest.test.ts`
Expected: FAIL — `Failed to resolve import "./interest"`.

- [ ] **Passo 2: Implementar `interest.ts` e `InterestLink`**

`src/lib/interest.ts`:

```ts
/**
 * Interesse do formulário de contato (spec 2026-10-03 §6). As chamadas da
 * página (aplicativos, "tem um problema que pede hardware?") levam ao
 * formulário com o interesse já marcado: o link é um `#contato` comum (sem
 * JavaScript, só rola até o formulário) e, no clique, dispara este evento.
 * Nada é guardado.
 */
export const INTERESTS = ["replay", "estacionamento", "aplicativo", "outro"] as const;
export type Interest = (typeof INTERESTS)[number];

const EVENT_NAME = "strukti:interesse";

function isInterest(value: unknown): value is Interest {
  return typeof value === "string" && (INTERESTS as readonly string[]).includes(value);
}

export function selectInterest(interest: Interest): void {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: interest }));
}

export function onInterestSelected(handler: (interest: Interest) => void): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (isInterest(detail)) handler(detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
```

`src/components/InterestLink.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { selectInterest, type Interest } from "@/lib/interest";

/** Link para o formulário com o interesse já marcado (sem JavaScript, só rola até lá). */
export function InterestLink({ interest, className, children }: { interest: Interest; className?: string; children: ReactNode }) {
  return (
    <a href="#contato" className={className} onClick={() => selectInterest(interest)}>
      {children}
    </a>
  );
}
```

Run: `npx vitest run src/lib/interest.test.ts`
Expected: PASS (3 testes).

- [ ] **Passo 3: Schema com `interest` (teste primeiro)**

Em `src/lib/validation.test.ts`: renomear o import para `contatoFormSchema`, trocar `diagnosticoFormSchema` por `contatoFormSchema` em todo o arquivo, acrescentar `interest: "replay"` ao `validPayload` e os testes:

```ts
  it("rejeita interesse ausente com a mensagem do campo", () => {
    const { interest: _omit, ...withoutInterest } = validPayload;
    const result = contatoFormSchema.safeParse(withoutInterest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(landingContent.contato.form.fields.interest.errorEmpty);
    }
  });

  it("rejeita interesse fora da lista", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, interest: "drone" });
    expect(result.success).toBe(false);
  });

  it.each(["replay", "estacionamento", "aplicativo", "outro"])("aceita o interesse %s", (interest) => {
    expect(contatoFormSchema.safeParse({ ...validPayload, interest }).success).toBe(true);
  });
```

(com `import { landingContent } from "@/content/landing";` no topo). As mensagens literais dos testes de WhatsApp passam a vir de `landingContent.contato.form.fields.whatsapp.errorEmpty` e `.errorInvalid`.

Run: `npx vitest run src/lib/validation.test.ts`
Expected: FAIL — `contatoFormSchema` não exportado.

Em `src/lib/validation.ts`: trocar a origem do texto para `landingContent.contato.form`, renomear o schema e o tipo, e acrescentar o campo:

```ts
import { INTERESTS } from "@/lib/interest";
// …
const { fields, consentError } = landingContent.contato.form;
// …
export const contatoFormSchema = z.object({
  name: /* igual */,
  company: /* igual */,
  whatsapp: /* igual */,
  interest: z.enum(INTERESTS, { error: fields.interest.errorEmpty }),
  problem: /* igual */,
  consent: /* igual */,
  codigoParceiro: /* igual */,
});

export type ContatoFormInput = z.infer<typeof contatoFormSchema>;
```

Run: `npx vitest run src/lib/validation.test.ts`
Expected: PASS.

- [ ] **Passo 4: Repositório e rota (teste primeiro)**

Em `src/app/api/diagnostico/route.test.ts`: acrescentar `interest: "replay"` ao `validPayload` e os testes:

```ts
  it("retorna 400 e não grava quando o interesse vem forjado fora da lista", async () => {
    process.env.DATABASE_URL = "postgres://exemplo";
    const repo = await import("@/lib/repository/leadRepository");
    const save = vi.fn();
    vi.spyOn(repo, "createLeadRepository").mockReturnValue({ save });
    const { POST } = await import("./route");
    const response = await POST(buildRequest({ ...validPayload, interest: "admin" }, "203.0.113.40"));
    expect(response.status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });

  it("grava o interesse escolhido", async () => {
    process.env.DATABASE_URL = "postgres://exemplo";
    const repo = await import("@/lib/repository/leadRepository");
    const save = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(repo, "createLeadRepository").mockReturnValue({ save });
    const { POST } = await import("./route");
    const response = await POST(buildRequest({ ...validPayload, interest: "estacionamento" }, "203.0.113.41"));
    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ interest: "estacionamento" }));
  });
```

(Se o arquivo já tiver um padrão para simular o repositório, use o dele em vez de `vi.spyOn`.)

Run: `npx vitest run src/app/api/diagnostico/route.test.ts`
Expected: FAIL no segundo (o `save` não recebe `interest`).

Em `leadRepository.ts`: `import type { Interest } from "@/lib/interest";`, `interest: Interest;` em `Lead`, e o `INSERT`:

```ts
        `INSERT INTO leads (name, company, whatsapp, interest, problem, consent_at, privacy_version, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [lead.name, lead.company, lead.whatsapp, lead.interest, lead.problem, lead.consentAt, lead.privacyPolicyVersion],
```

Em `route.ts`: importar `contatoFormSchema`, usar no `safeParse` e passar `interest: parsed.data.interest` ao `save`. Trocar os prefixos dos `console.error` de `"Diagnóstico:"` para `"Contato:"`. (A URL `/api/diagnostico` continua a mesma: renomear a rota não traz ganho e mexe na CSP `form-action` e nos testes.)

Run: `npx vitest run src/app/api/diagnostico/route.test.ts src/lib/validation.test.ts`
Expected: PASS.

- [ ] **Passo 5: Mover o componente e o teste**

```bash
git mv src/components/sections/Diagnostico.tsx src/components/sections/Contato.tsx
git mv src/components/sections/Diagnostico.test.tsx src/components/sections/Contato.test.tsx
```

- [ ] **Passo 6: Testes do `Contato` que falham**

Em `Contato.test.tsx`: trocar o import para `import { Contato } from "./Contato";` e `<Diagnostico />` por `<Contato />`; os textos literais passam a vir de `landingContent.contato.form` (rótulos, botão de envio, mensagens). Em `fillValidForm`, acrescentar:

```ts
  fireEvent.change(screen.getByLabelText(landingContent.contato.form.fields.interest.label), {
    target: { value: "replay" },
  });
```

E acrescentar os testes:

```ts
  it("uma chamada da página marca o interesse, e a seguinte troca a escolha", async () => {
    render(<Contato />);
    const select = screen.getByLabelText(landingContent.contato.form.fields.interest.label) as HTMLSelectElement;
    act(() => selectInterest("aplicativo"));
    expect(select.value).toBe("aplicativo");
    act(() => selectInterest("outro"));
    expect(select.value).toBe("outro");
  });

  it("depois do envio com sucesso, uma chamada não esconde a mensagem de sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    render(<Contato />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: landingContent.contato.form.submitLabel }));
    await waitFor(() => expect(screen.getByText(landingContent.contato.form.success.title)).toBeTruthy());
    act(() => selectInterest("replay"));
    expect(screen.getByText(landingContent.contato.form.success.title)).toBeTruthy();
    expect(screen.queryByLabelText(landingContent.contato.form.fields.interest.label)).toBeNull();
  });

  it("enviar sem escolher o interesse mostra o erro do campo", async () => {
    render(<Contato />);
    fireEvent.click(screen.getByRole("button", { name: landingContent.contato.form.submitLabel }));
    await waitFor(() => expect(screen.getByText(landingContent.contato.form.fields.interest.errorEmpty)).toBeTruthy());
  });
```

(imports: `act` de `react`, `landingContent` e `selectInterest`).

Run: `npx vitest run src/components/sections/Contato.test.tsx`
Expected: FAIL — `Unable to find a label with the text of: <interest.label>`.

- [ ] **Passo 7: Alterar o `Contato.tsx`**

7a. Imports e nome: `import { contatoFormSchema, PROBLEM_MAX_LENGTH } from "@/lib/validation";`, `import { INTERESTS, onInterestSelected, type Interest } from "@/lib/interest";`, `export function Contato()`.

7b. Campos: `type FieldKey = "name" | "company" | "whatsapp" | "interest" | "problem" | "consent";` e `const FIELD_ORDER: FieldKey[] = ["name", "company", "whatsapp", "interest", "problem", "consent"];`.

7c. Conteúdo e estado: `const { title, intro, form } = landingContent.contato;` e `const [interest, setInterest] = useState<Interest | "">("");`.

7d. Escutar as chamadas da página (o `select` só existe com o formulário à mostra, então em sucesso nada muda):

```tsx
  useEffect(() => onInterestSelected(setInterest), []);
```

7e. No `payload`: `interest: String(formData.get("interest") ?? ""),`. Depois de `formEl.reset()` no sucesso: `setInterest("");`.

7f. Substituir o bloco da coluna da esquerda (o `<div>` com `title`, `intro`, `highlight` e os passos) por:

```tsx
        <div>
          <h2 id="contato-title" className="section-title">
            {title}
          </h2>
          <p className="body-muted" style={{ marginTop: "var(--space-4)", maxWidth: "62ch" }}>
            {intro}
          </p>
        </div>
```

e o `<section>` por `<section id="contato" className="section surface-paper" aria-labelledby="contato-title">` (manter a classe `diag` do container, que já dá o layout em duas colunas).

7g. Depois do campo de WhatsApp, o campo novo:

```tsx
                <div className="field">
                  <label htmlFor="interest" className="field__label">
                    {form.fields.interest.label}
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    className="field__input"
                    required
                    value={interest}
                    onChange={(event) => setInterest(event.target.value as Interest | "")}
                    aria-invalid={Boolean(fieldErrors.interest)}
                    aria-describedby={fieldErrors.interest ? "interest-error" : undefined}
                  >
                    <option value="">{form.fields.interest.placeholder}</option>
                    {INTERESTS.map((value) => (
                      <option key={value} value={value}>
                        {form.fields.interest.options[value]}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.interest && <FieldError id="interest-error" message={fieldErrors.interest} />}
                </div>
```

7h. Trocar `diagnosticoFormSchema` por `contatoFormSchema` e `landingContent.whatsappMessages.diagnostico` por `landingContent.whatsappMessages.aplicativo` (2 lugares: alternativa de WhatsApp e erro de envio).

Run: `npx vitest run src/components/sections/Contato.test.tsx`
Expected: PASS (todos os testes antigos e os 3 novos, com axe em cada estado).

- [ ] **Passo 8: Página, versão do aviso e README**

Em `src/app/page.tsx`: trocar `import { Diagnostico } …` e `<Diagnostico />` por `Contato`. Em `src/config/site.ts`: `privacyPolicyVersion` recebe a "Versão do aviso" aprovada na v2.0. Os textos do aviso (`landingContent.privacidade`) e os links `#diagnostico` de `OQueJaFizemos`/`HeroVideoText` são tratados na Tarefa 10; por ora, trocar em `OQueJaFizemos.tsx` o `href="#diagnostico"` por `href="#contato"`.

No README, seção "Configuração", trocar o `CREATE TABLE` por:

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  interest TEXT NOT NULL CHECK (interest IN ('replay', 'estacionamento', 'aplicativo', 'outro')),
  problem TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,
  privacy_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

e acrescentar logo abaixo:

```markdown
Banco criado antes do campo "interesse" (ADR-009)? Migração:

```sql
ALTER TABLE leads ADD COLUMN interest TEXT NOT NULL DEFAULT 'outro';
ALTER TABLE leads ALTER COLUMN interest DROP DEFAULT;
ALTER TABLE leads ADD CONSTRAINT leads_interest_check
  CHECK (interest IN ('replay', 'estacionamento', 'aplicativo', 'outro'));
```
```

- [ ] **Passo 9: Definição de pronto, commit, revisão e merge**

Run: `npm run typecheck && npm run lint && npm run test && npm run check:quarantine && npm run build`, depois `npm run dev` + `npm run check:browser`.
Expected: tudo passa (o `check:browser` exercita o Tab pela página, que agora passa pelo `select`).

```bash
git add src/lib/interest.ts src/lib/interest.test.ts src/components/InterestLink.tsx src/components/sections/Contato.tsx src/components/sections/Contato.test.tsx src/lib/validation.ts src/lib/validation.test.ts src/lib/repository/leadRepository.ts src/app/api/diagnostico/route.ts src/app/api/diagnostico/route.test.ts src/config/site.ts src/app/page.tsx src/components/sections/OQueJaFizemos.tsx README.md
git commit -m "feat(contato): formulário único com campo de interesse, de ponta a ponta"
```

---

### Tarefa 9: Seções Produtos, Aplicativos e "Tem um problema que pede hardware?"

Branch: `feat/secoes-catalogo`. Depende das Tarefas 5, 6 e 8.

**Arquivos:**
- Criar: `src/components/sections/Produtos.tsx`, `src/components/sections/Aplicativos.tsx`, `src/components/sections/ChamadaHardware.tsx`
- Teste: `src/components/sections/catalogo.test.tsx`
- Modificar: `src/components/sections/ProjectGrid.tsx`, `src/components/sections/ProjectGrid.test.tsx` (só se quebrar), `src/app/globals.css`

**Interfaces:**
- Consome: `Palco`, `SeloStatus`, `FichaTecnica` (Tarefa 6); `InterestLink` (Tarefa 8); `landingContent.produtos`, `.aplicativos`, `.chamadaHardware`, `.whatsappMessages` (Tarefa 5); `posterUrl` (Tarefa 3); `siteConfig.whatsapp.linkWithMessage`.
- Produz: `Produtos()` (`#produtos`), `Aplicativos()` (`#aplicativos`), `ChamadaHardware()` (`#sob-medida`); `ProjectGrid` com `labels.title` opcional, selo por projeto e o ouvinte "um vídeo por vez".

- [ ] **Passo 1: Testes que falham**

`src/components/sections/catalogo.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { Produtos } from "./Produtos";
import { Aplicativos } from "./Aplicativos";
import { ChamadaHardware } from "./ChamadaHardware";

const { produtos, aplicativos, chamadaHardware, statusLabels, whatsappMessages } = landingContent;

describe("<Produtos />", () => {
  it("mostra o replay com selo, 3 passos, ficha e o WhatsApp com a mensagem pronta", async () => {
    const { container } = render(<Produtos />);
    const replay = screen.getByRole("article", { name: produtos.replay.name });
    expect(within(replay).getByText(statusLabels.piloto)).toBeTruthy();
    expect(within(replay).getAllByRole("listitem")).toHaveLength(3);
    for (const spec of produtos.replay.specs) expect(within(replay).getByText(spec.value)).toBeTruthy();
    const cta = within(replay).getByRole("link", { name: new RegExp(produtos.replay.cta) });
    expect(cta.getAttribute("href")).toBe(siteConfig.whatsapp.linkWithMessage(whatsappMessages.replay));
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it("não mostra o link do site do replay enquanto o endereço não existir", () => {
    render(<Produtos />);
    expect(screen.queryByText(produtos.replay.siteLinkLabel)).toBeNull();
  });

  it("mostra o estacionamento como em desenvolvimento, com o WhatsApp próprio", () => {
    render(<Produtos />);
    const card = screen.getByRole("article", { name: produtos.estacionamento.name });
    expect(within(card).getByText(statusLabels.desenvolvimento)).toBeTruthy();
    const cta = within(card).getByRole("link", { name: new RegExp(produtos.estacionamento.cta) });
    expect(cta.getAttribute("href")).toBe(siteConfig.whatsapp.linkWithMessage(whatsappMessages.estacionamento));
  });
});

describe("mensagem pronta do WhatsApp", () => {
  it("codifica acentos, espaços e &", () => {
    expect(siteConfig.whatsapp.linkWithMessage("Olá & até já")).toBe(
      "https://wa.me/5583999683670?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1",
    );
  });
});

describe("<Aplicativos />", () => {
  it("mostra cada app com o seu selo e chama o diagnóstico com o interesse marcado", async () => {
    const { container } = render(<Aplicativos />);
    for (const project of aplicativos.projects) {
      expect(screen.getByRole("heading", { name: project.name })).toBeTruthy();
    }
    expect(screen.getAllByText(/./, { selector: ".selo" })).toHaveLength(aplicativos.projects.length);
    expect(screen.getByRole("link", { name: aplicativos.cta }).getAttribute("href")).toBe("#contato");
    expect((await axe.run(container)).violations).toEqual([]);
  });
});

describe("<ChamadaHardware />", () => {
  it("leva ao formulário", async () => {
    const { container } = render(<ChamadaHardware />);
    expect(screen.getByRole("heading", { level: 2, name: chamadaHardware.title })).toBeTruthy();
    expect(screen.getByRole("link", { name: chamadaHardware.cta }).getAttribute("href")).toBe("#contato");
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
```

Run: `npx vitest run src/components/sections/catalogo.test.tsx`
Expected: FAIL — `Failed to resolve import "./Produtos"`.

- [ ] **Passo 2: `Produtos.tsx`**

```tsx
import { landingContent } from "@/content/landing";
import { Palco } from "@/components/ui/Palco";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { FichaTecnica } from "@/components/ui/FichaTecnica";
import { Reveal } from "@/components/motion/Reveal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { posterUrl } from "@/lib/heroSequence";

/**
 * Produtos de hardware (spec 2026-10-03 §4, seção 3): o replay em destaque,
 * num palco com o mesmo render do hero, e o estacionamento em desenvolvimento.
 */
export function Produtos() {
  const { title, intro, replay, estacionamento } = landingContent.produtos;

  return (
    <section id="produtos" className="section surface-space" aria-labelledby="produtos-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="produtos-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{intro}</p>
        </Reveal>

        <div className="produtos">
          <article className="produto produto--destaque" aria-labelledby="produto-replay-title">
            <Palco className="produto__palco">
              <picture>
                <source type="image/avif" srcSet={posterUrl("desktop", "avif")} />
                <img src={posterUrl("desktop", "jpg")} alt="" width={1600} height={1000} loading="lazy" decoding="async" />
              </picture>
              <p className="selo selo--ilustracao">{landingContent.heroEstudio.illustrationBadge}</p>
            </Palco>
            <div className="produto__corpo">
              <SeloStatus status="piloto" />
              <h3 id="produto-replay-title" className="block-title">
                {replay.name}
              </h3>
              <p className="body-muted">{replay.oneLiner}</p>
              <h4 className="produto__subtitulo">{replay.stepsTitle}</h4>
              <ol className="produto__passos">
                {replay.steps.map((step) => (
                  <li key={step.lead}>
                    <strong>{step.lead}</strong> {step.rest}
                  </li>
                ))}
              </ol>
              <FichaTecnica items={replay.specs} />
              <div className="produto__acoes">
                <WhatsAppButton message={landingContent.whatsappMessages.replay}>{replay.cta}</WhatsAppButton>
                {replay.siteUrl && (
                  <a href={replay.siteUrl} className="btn btn--outline">
                    {replay.siteLinkLabel}
                  </a>
                )}
              </div>
            </div>
          </article>

          <article className="produto" aria-labelledby="produto-estacionamento-title">
            <div className="produto__corpo">
              <SeloStatus status="desenvolvimento" />
              <h3 id="produto-estacionamento-title" className="block-title">
                {estacionamento.name}
              </h3>
              <p className="body-muted">{estacionamento.oneLiner}</p>
              <div className="produto__acoes">
                <WhatsAppButton message={landingContent.whatsappMessages.estacionamento}>
                  {estacionamento.cta}
                </WhatsAppButton>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
```

(O lint do Next avisa `no-img-element` só como aviso, igual ao `HeroVideoMedia.tsx`; o `<picture>` é necessário para o AVIF com JPG de reserva.)

- [ ] **Passo 3: `ProjectGrid` — título opcional, selo e "um vídeo por vez"**

Em `ProjectGrid.tsx`:

- `interface ProjectGridLabels { title?: string; showMore: string; playLabel: string; }` e `{labels.title && <h3 className="block-title portfolio__more-title">{labels.title}</h3>}`.
- Importar `SeloStatus` e, no `ProjectCard`, logo antes do `<h4>`: `{project.status && <SeloStatus status={project.status} />}`.
- Mover para `ProjectGrid` o efeito "só um vídeo toca por vez" que hoje está em `OQueJaFizemos.tsx` (o arquivo sai na Tarefa 10):

```tsx
import { pauseOtherVideos } from "@/lib/videoCoordination";
// dentro de ProjectGrid, antes do return:
  // Só um vídeo toca por vez na página (MASTER §8.8), inclusive o hero
  // "video", se estiver em uso. "play" não borbulha: ouvir na captura.
  useEffect(() => {
    const onPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) pauseOtherVideos(event.target);
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);
```

E remover o mesmo `useEffect` de `OQueJaFizemos.tsx` (senão o listener fica duplicado enquanto as duas seções existirem).

- [ ] **Passo 4: `Aplicativos.tsx` e `ChamadaHardware.tsx`**

```tsx
import { landingContent } from "@/content/landing";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { InterestLink } from "@/components/InterestLink";

/** Aplicativos (spec §4, seção 4): a grade de vídeos atual, em palcos, com o selo de cada app. */
export function Aplicativos() {
  const { title, intro, cta, projects, grid, videoDescriptionLinkLabel } = landingContent.aplicativos;

  return (
    <section id="aplicativos" className="section surface-night aplicativos" aria-labelledby="aplicativos-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="aplicativos-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{intro}</p>
        </Reveal>
        <ProjectGrid projects={projects} labels={grid} descriptionLinkLabel={videoDescriptionLinkLabel} />
        <Reveal className="section-actions">
          <InterestLink interest="aplicativo" className="btn btn--primary">
            {cta}
          </InterestLink>
        </Reveal>
      </div>
    </section>
  );
}
```

```tsx
import { landingContent } from "@/content/landing";
import { Reveal } from "@/components/motion/Reveal";
import { InterestLink } from "@/components/InterestLink";

/** "Tem um problema que pede hardware?" (spec §4, seção 5): contato geral, interesse "Outro". */
export function ChamadaHardware() {
  const { title, body, cta } = landingContent.chamadaHardware;

  return (
    <section id="sob-medida" className="section surface-paper" aria-labelledby="sob-medida-title">
      <div className="container">
        <Reveal className="chamada">
          <h2 id="sob-medida-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{body}</p>
          <InterestLink interest="outro" className="btn btn--primary">
            {cta}
          </InterestLink>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Passo 5: CSS** — acrescentar ao fim de `globals.css`:

```css
/* ------------------------------------------------------------------ */
/* Catálogo: produtos, aplicativos, chamada (spec 2026-10-03 §4)        */
/* ------------------------------------------------------------------ */
.produtos {
  display: grid;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .produtos {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }
}

.produto {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
  border-radius: var(--radius-3);
  background-color: var(--surface-raised);
}

.produto__palco {
  aspect-ratio: 8 / 5;
}

.produto__palco img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.produto__corpo > * + * {
  margin-top: var(--space-3);
}

.produto__subtitulo {
  font-weight: 600;
  margin-top: var(--space-5);
}

.produto__passos {
  padding-left: 1.25em;
  display: grid;
  gap: var(--space-2);
}

.produto__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

/* Aplicativos: o pôster de cada app ganha o palco (MASTER §8.13). */
.aplicativos .project-card__media {
  background: linear-gradient(180deg, var(--color-navy-950), var(--color-navy-900));
  box-shadow: inset 0 -1px 0 rgb(0 209 216 / 0.55);
}

.chamada {
  max-width: 62ch;
}

.chamada .btn {
  margin-top: var(--space-5);
}
```

- [ ] **Passo 6: Rodar e ver passar**

Run: `npx vitest run src/components/sections/catalogo.test.tsx src/components/sections/ProjectGrid.test.tsx`
Expected: PASS.

- [ ] **Passo 7: Definição de pronto parcial e commit** (as seções ainda não estão na página; entram na Tarefa 10)

Run: `npm run typecheck && npm run lint && npm run test`

```bash
git add src/components/sections/Produtos.tsx src/components/sections/Aplicativos.tsx src/components/sections/ChamadaHardware.tsx src/components/sections/catalogo.test.tsx src/components/sections/ProjectGrid.tsx src/components/sections/OQueJaFizemos.tsx src/app/globals.css
git commit -m "feat(catalogo): seções de produtos, aplicativos e chamada para outros problemas"
```

Revisão da Crivo e merge.

---

### Tarefa 10: Home montada, texto antigo retirado e `check:browser` atualizado

Branch: `feat/home-v3`. Depende de todas as anteriores.

**Arquivos:**
- Modificar: `src/app/page.tsx`, `src/content/landing.ts`, `src/components/sections/ComoResolvemos.tsx`, `src/components/sections/Equipe.tsx`, `src/config/site.ts` (`team[].course`), `src/components/sections/HeroVideoText.tsx`, `src/components/sections/HeroContent.tsx`, `scripts/check-browser.mjs`, `README.md`, `docs/maestro/ESTADO.md`
- Apagar: `src/components/sections/Problemas.tsx`, `src/components/sections/OQueJaFizemos.tsx`

**Interfaces:**
- Consome: tudo das Tarefas 5 a 9.
- Produz: a home final, na ordem da spec §4.

- [ ] **Passo 1: Página na ordem nova**

```tsx
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/sections/Hero";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { HeroSequence } from "@/components/sections/HeroSequence";
import { Produtos } from "@/components/sections/Produtos";
import { Aplicativos } from "@/components/sections/Aplicativos";
import { ChamadaHardware } from "@/components/sections/ChamadaHardware";
import { ComoResolvemos } from "@/components/sections/ComoResolvemos";
import { Equipe } from "@/components/sections/Equipe";
import { Contato } from "@/components/sections/Contato";
import { Faq } from "@/components/sections/Faq";
import { Rodape } from "@/components/sections/Rodape";

export default function Home() {
  // A barra do topo e o hero mudam juntos (ver siteConfig.heroVariant).
  const variant = siteConfig.heroVariant;

  return (
    <>
      {variant === "classic" ? <Header /> : <TopBar />}
      <main id="conteudo-principal">
        {variant === "estudio" ? <HeroSequence /> : variant === "video" ? <HeroVideo /> : <Hero />}
        <Produtos />
        <Aplicativos />
        <ChamadaHardware />
        <ComoResolvemos />
        <Equipe />
        <Contato />
        <Faq />
      </main>
      <Rodape />
    </>
  );
}
```

- [ ] **Passo 2: Conteúdo final**

Em `src/content/landing.ts`, com o texto da v2.0:
- `header.nav` → os 4 itens da v2.0.
- `comoResolvemos` → apagar; `ComoResolvemos.tsx` passa a ler `landingContent.comoTrabalhamos` (o `id="como-trabalhamos"` continua).
- `equipe.title`/`.intro`, `faq`, `rodape`, `seo`, `privacidade.sections` → texto da v2.0.
- Apagar `problemas`, `oQueJaConstruimos`, `diagnostico` e `whatsappMessages.diagnostico`.
- `pendencias` → a lista da v2.0 (incluir fotos e cursos da equipe e o endereço do site do replay).
- `hero` (texto do hero "video"/"classic") fica, porque as duas variantes continuam no código até a limpeza; em `HeroVideoText.tsx` e `HeroContent.tsx`, trocar `href="#diagnostico"` por `href="#contato"`.

Em `src/config/site.ts`, cada pessoa de `team` ganha `course: "[A PREENCHER: curso]"` (até o grupo mandar), e `Equipe.tsx` mostra, logo abaixo do nome: `<p className="body-muted">{member.course}</p>`.

Apagar os componentes que saíram:

```bash
git rm src/components/sections/Problemas.tsx src/components/sections/OQueJaFizemos.tsx
```

Run: `npm run typecheck`
Expected: sem erros (se algum import antigo sobrar, o erro aponta o arquivo).

- [ ] **Passo 3: `check:browser` — conferências do hero "estudio"**

Em `scripts/check-browser.mjs`:

3a. Constantes, junto das outras:

```js
const HERO_STUDIO_SELECTOR = ".hero-estudio";
const HERO_CANVAS_SELECTOR = ".hero-estudio__canvas";
const APPS_PLAY_BUTTON_SELECTOR = "#aplicativos .project-card__play";
// Cartão N da grade de aplicativos (o vídeo só existe depois do clique em "Assistir").
const appCard = (n) => `#aplicativos .project-card:nth-child(${n})`;
```

3b. Logo depois do laço de larguras (antes do passo do menu), o bloco:

```js
  // --- Hero "estudio": a rolagem troca o quadro; com reduced motion fica parado ---
  if (await evalValue(cdp, `!!document.querySelector(${JSON.stringify(HERO_STUDIO_SELECTOR)})`)) {
    for (const reduce of [false, true]) {
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
      });
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: VIEWPORT_HEIGHT, deviceScaleFactor: 1, mobile: false });
      const heroLoaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: URL_TO_CHECK });
      await withTimeout(heroLoaded, "carregar para o passo do hero");
      await sleep(3000); // quadros baixam depois do load

      const state = await evalValue(
        cdp,
        `(async () => {
          const section = document.querySelector(${JSON.stringify(HERO_STUDIO_SELECTOR)});
          const canvas = document.querySelector(${JSON.stringify(HERO_CANVAS_SELECTOR)});
          const before = canvas?.dataset.frame ?? null;
          const scrollable = section.offsetHeight - window.innerHeight;
          window.scrollTo({ top: section.offsetTop + scrollable / 2, behavior: "instant" });
          await new Promise((resolve) => setTimeout(resolve, 600));
          const after = canvas?.dataset.frame ?? null;
          window.scrollTo({ top: 0, behavior: "instant" });
          return { scrub: section.dataset.scrub, height: section.offsetHeight, viewport: window.innerHeight, before, after };
        })()`,
        { awaitPromise: true },
      );

      if (reduce) {
        if (state.scrub !== "false") failures.push("hero estudio: com reduced motion a animação ligou (data-scrub)");
        if (state.height > state.viewport * 1.2) failures.push(`hero estudio: com reduced motion a seção ficou com ${state.height}px (altura extra de rolagem)`);
        if (state.after !== null) failures.push("hero estudio: com reduced motion o canvas desenhou quadros");
      } else {
        if (state.scrub !== "true") failures.push("hero estudio: sem reduced motion a animação não ligou (data-scrub)");
        if (state.before !== "0") failures.push(`hero estudio: no topo o canvas mostrava o quadro ${state.before}, esperado 0`);
        if (!(Number(state.after) > 0)) failures.push(`hero estudio: rolar até o meio não trocou o quadro (${state.before} → ${state.after})`);
      }
      console.log(`  hero estudio (reduced motion ${reduce ? "ligado" : "desligado"}): scrub=${state.scrub}, quadro ${state.before} → ${state.after}, altura ${state.height}px`);
    }
  }
```

3c. Substituir o passo "Vídeos" inteiro (de `// --- Vídeos:` até antes de `// --- Tab pela página inteira`) por:

```js
  // --- Vídeos: só um toca por vez (grade de aplicativos) e o hero "video", se existir, não toca por cima ---
  loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: URL_TO_CHECK });
  await withTimeout(loaded, "carregar para o passo de interação (vídeos)");
  await sleep(1500);

  const playButtons = await evalValue(cdp, `document.querySelectorAll(${JSON.stringify(APPS_PLAY_BUTTON_SELECTOR)}).length`);
  if (playButtons < 2) {
    failures.push(`vídeos: esperava ao menos 2 aplicativos com vídeo na grade, achei ${playButtons}`);
  } else {
    const firstPlaying = await playVideo(cdp, `${appCard(1)} video`, { viaButton: `${appCard(1)} .project-card__play` });
    if (!firstPlaying) failures.push("vídeos: o 1º aplicativo não tocou depois do clique em 'Assistir'");
    const secondPlaying = await playVideo(cdp, `${appCard(2)} video`, { viaButton: `${appCard(2)} .project-card__play` });
    if (!secondPlaying) failures.push("vídeos: o 2º aplicativo não tocou depois do clique em 'Assistir'");
    const playingCount = await evalValue(
      cdp,
      `[...document.querySelectorAll("video")].filter((video) => !video.paused).length`,
    );
    if (playingCount !== 1) failures.push(`vídeos: ${playingCount} vídeos tocando ao mesmo tempo (deveria ser 1)`);
    if (await evalValue(cdp, `!!document.querySelector(${JSON.stringify(HERO_VIDEO_SELECTOR)})`)) {
      await evalValue(cdp, `window.scrollTo({ top: 0, behavior: "instant" })`);
      await sleep(1500);
      if (!(await isPaused(cdp, HERO_VIDEO_SELECTOR))) failures.push("vídeos: o hero tocou sozinho por cima do aplicativo que a pessoa estava vendo");
    }
    console.log(`  vídeos: 1º ${firstPlaying ? "tocou" : "não tocou"}, 2º ${secondPlaying ? "tocou" : "não tocou"}; tocando juntos: ${playingCount}`);
  }
```

(O `playVideo` usa `document.querySelector`, então cada seletor aponta um cartão só. Como a grade só mantém um player montado por vez, o "1 tocando" confere também que o hero "video", se existir, não entrou junto. Apagar as constantes `FEATURED_VIDEO_SELECTOR`, `GRID_PLAY_BUTTON_SELECTOR` e `GRID_VIDEO_SELECTOR`, que ficam sem uso.)

3d. Atualizar o comentário de cabeçalho do script e a mensagem final de sucesso com as duas conferências novas (hero "estudio" e vídeos da grade).

- [ ] **Passo 4: README e ESTADO**

README: na tabela de scripts, a descrição do `check:browser` ganha "confere que a rolagem troca o quadro do hero 'estudio' e que, com reduced motion, ele fica parado e sem altura extra" e passa a falar de "vídeos dos aplicativos" no lugar de "vídeos do portfólio"; na seção "Estrutura", os componentes novos; a seção "Pendências que bloqueiam a publicação" ganha fotos/cursos da equipe e o endereço do site do replay.

`docs/maestro/ESTADO.md`: em "O que está no `main`", trocar a descrição do site pela home v3 (hero "estudio", produtos, aplicativos, chamada, contato com interesse); em "Próximos passos", acrescentar a limpeza dos heros "video" e "classic" (ADR própria) e as pendências da v2.0.

- [ ] **Passo 5: Definição de pronto completa**

Run, nesta ordem:
1. `npm run typecheck && npm run lint && npm run test`
2. `npm run check:quarantine`
3. `npm run build` (dev parado)
4. `npm run dev` e, em seguida, `npm run check:browser`
5. `npm run check:placeholders` — **espera-se falha** listando só os `[A PREENCHER]` da v2.0 (pendências de publicação); conferir que não sobrou nenhum outro.

Expected: 1–4 passam; o `check:browser` mostra as linhas `hero estudio (reduced motion desligado): scrub=true, quadro 0 → N` (N > 0) e `hero estudio (reduced motion ligado): scrub=false`.

- [ ] **Passo 6: Ver a página com o Thiago**

Subir o `npm run dev`, abrir no navegador do app a 1440 e a 360 (painel do navegador) e passar pela home inteira com ele antes do commit final.

- [ ] **Passo 7: Commit, revisão final e merge**

```bash
git add src/app/page.tsx src/content/landing.ts src/components/sections/ComoResolvemos.tsx src/components/sections/Equipe.tsx src/config/site.ts src/components/sections/HeroVideoText.tsx src/components/sections/HeroContent.tsx scripts/check-browser.mjs README.md docs/maestro/ESTADO.md
git commit -m "feat(home): home v3 da marca-mãe e check:browser do hero estudio"
```

(`git rm` do Passo 2 já colocou as remoções no índice.) A Crivo revisa o branch inteiro contra a spec; push só com o ok do Thiago.

---

## Fora deste plano

- Limpeza dos heros "video" e "classic" e dos arquivos que só eles usam (plano e ADR próprios, depois da v3 aprovada no ar).
- Site do replay, área do jogador, painel da quadra, páginas próprias de cada produto (spec §12).
