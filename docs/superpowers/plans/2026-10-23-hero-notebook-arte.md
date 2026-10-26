# Hero notebook, fase 2 (arte): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** trocar as caixas cinza do protótipo pela cena de verdade do hero com entrada pelo notebook. São dois enquadramentos (deitado e em pé), cada um com o fundo sem o aparelho, o aparelho em vetor por cima, o loop de 10 s e o pôster. A mecânica da fase 1 não muda.

**Architecture:** a produção é a mesma do "Fim de expediente":
- O pipeline de `scripts/hero-expansao/` é copiado para `scripts/hero-notebook/` e adaptado. O do hero de produção fica intacto.
- Canvas2D, Edge headless (`shot.sh`, um Edge por vez) e ffmpeg (`stills.sh`, `encode.sh`, `composite2.js`).
- A mídia vai para `public/hero/notebook/` e é ligada em `siteConfig.heroNotebook`.
- O aparelho em vetor (`AparelhoVetor`) substitui o `AparelhoCinza` no `HeroNotebook`.
- Cada enquadramento tem a sua própria mídia: retrato 720×1280 e deitado 1280×720.

**Tech Stack:** Canvas2D, Edge headless, ffmpeg (libaom-av1, libvpx-vp9, libx264), Node, React 19/TS, CSS BEM, vitest, `check:browser`. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-23-hero-entrada-notebook-design.md`, principalmente as §4, §6, §7, §9 e §11.2. Também valem a MASTER §3.4 (faixa do título escura) e §10 (anti-cara-de-IA), a ADR-005 (produção própria), a ADR-008 (mídia local) e a ADR-009 (o Replay é "Ilustração do conceito").

## Global Constraints

- Branch `feat/hero-notebook`, sem push nem PR (são da fase 3).
- O hero "expansao" de produção não muda:
  - `scripts/hero-expansao/` intacto;
  - `public/hero/expansao/` intacto;
  - `siteConfig.heroExpansao` intacto;
  - `HeroExpansao.test.tsx` sem edição e verde.
- Direção, verbatim da spec §6:
  - **Deitado (notebook):** "notebook aberto no centro da mesa, de frente para a câmera, tela vertical, base com o teclado em leve perspectiva por baixo. De um lado o celular (deitado, como hoje) e a caixa do Replay; do outro a caneca; o abajur na ponta. Sai o caderno de papel. Brilho frio da tela na mesa e no teclado."
  - **Em pé (celular):** "o celular de pé num suporte, na frente e no centro; o notebook atrás, desfocado e cortado; caixa do Replay e caneca nas laterais, se couberem."
- O que é imagem e o que é vetor: a mídia (o quadro que a câmera atravessa) é renderizada **sem o aparelho da frente**. O lugar dele fica vazio, com a sombra e o brilho dele na mesa. O aparelho é vetor por cima.
  - O fundo largo (`fundo`, `fundo-retrato`, visto em volta do cartão em P = 0) traz o aparelho renderizado, porque ele nunca é ampliado.
- Arquivos em `public/hero/notebook/`, com nomes fixos:

  | Arquivo | Tamanho | Limite (AVIF / JPG ou WebM / MP4) |
  |---|---|---|
  | `fundo.avif` / `.jpg` | 1920×1080 | ≤ 100 KB / ≤ 160 KB |
  | `fundo-retrato.avif` / `.jpg` | 1080×1920 | ≤ 100 KB / ≤ 160 KB |
  | `midia-poster.avif` / `.jpg` | 1280×720 | ≤ 60 KB / ≤ 90 KB |
  | `midia.webm` / `.mp4` | 1280×720, 25 fps, 251 quadros (10 s) | ≤ 420 KB / ≤ 520 KB |
  | `midia-retrato-poster.avif` / `.jpg` | 720×1280 | ≤ 60 KB / ≤ 90 KB |
  | `midia-retrato.webm` / `.mp4` | 720×1280, 25 fps, 251 quadros (10 s) | ≤ 420 KB / ≤ 520 KB |

  AVIF com grão em crf 11, como no README do hero (acima de 12, o céu fica liso e com faixas).
- Loop: o quadro 250 é igual ao 0 (emenda ≥ 45 dB no `vqa.sh`), e o quadro 0 é igual ao pôster. Sem grão temporal. O movimento é o mesmo de hoje: o LED respira, sobe o vapor da caneca, a cidade balança meio pixel e o abajur oscila 3%.
- Nada de IA generativa nem de banco de imagens. Nada inventado: sem marca, sem logo e sem texto legível na imagem.
- **Memória curta:**
  - um Edge por vez;
  - o dev server do dono, em `localhost:3000`, fica no ar e ninguém sobe outro;
  - quem precisar de navegador usa esse;
  - se ele tiver caído, sobe de novo só depois de matar os `node` órfãos deste repositório (o que tem `strukti-site` e `next` na linha de comando) e apagar o `.next`.
- Intermediários (`cur/`, `plates*/`, `final*/`, `prof/`) ficam fora do git, no `.gitignore` da pasta, como no hero.
- **Instalação a cada etapa:** cada cena aprovada entra logo no site (no `HeroNotebook`), para o dono ver a evolução em `:3000`.
- Gates do código: `npx vitest run --maxWorkers=2`, `npm run typecheck` e `npm run lint`.
- Gate da integração: `CHECK_BROWSER_ETAPAS=entrada npm run check:browser` (sem o check completo, que leva ~15 min, até a Task N6).

## Review Focus

1. **Faixa do título na pausa.** As metades do título ladeiam o notebook, inteiras dentro da janela útil, e o fundo atrás delas fica escuro (luminância p90 ≤ 60 em 0–255, o critério da faixa de hoje). Medir a 1440×900, 1366×768 e 390×844, com a arte instalada.
2. **Aparelho colado à arte em qualquer proporção.** A moldura em vetor abraça a tela HTML, e o vazio, a sombra e o brilho na mesa ficam sob ela. Não pode aparecer uma fresta da mesa entre a moldura e a mesa, nem o aparelho flutuando. Medir em 16:10 (1440×900), 16:9 (1366×768), 21:9 (2560×1080) e 390×844.
3. **Girar a tela no meio da cena.** O pôster e o vídeo trocam para o enquadramento certo, a câmera usa a mídia do enquadramento atual e nenhum quadro fica com a mídia errada.
4. **Emenda do loop e o primeiro quadro.** Nos dois clipes, o quadro 0 é o pôster e o 250 volta ao 0, sem salto ao parar ou recomeçar.
5. **Bytes no celular.** Em pé, a página só baixa o pôster e o vídeo do retrato, nunca os do deitado, e o contrário também vale. O LCP continua sendo o pôster.

---

### Task N1: pipeline copiado e cena deitada (fotos paradas)

**Files:**
- Create: `scripts/hero-notebook/`. É a cópia de `scripts/hero-expansao/` com `scene.js`, `bg.html`, `media.html`, `geo.js`, `shot.sh`, `stills.sh` e `.gitignore` adaptados, mais um `README.md` próprio. Só o necessário para as fotos; os passes do loop entram na N5.

- [ ] Copiar e adaptar, sem importar nada de `scripts/hero-expansao/` em tempo de execução.
- [ ] Mudar o mundo (`BASE`):
  - sai o caderno de papel;
  - entra o notebook aberto no centro da mesa, de frente para a câmera;
  - celular e caixa do Replay de um lado, caneca do outro, abajur na ponta;
  - brilho frio da tela na mesa e no teclado.
- [ ] Na câmera `media` (1280×720), uma chave `semAparelho` tira o notebook. Ficam a sombra dele e o brilho da tela na mesa.
- [ ] O `geo.js` imprime, em px da mídia 1280×720, o retângulo da tela do notebook: centro `cx`, `cy` e `largura`, mais a altura com a proporção 16:10 da tela. Esses números alimentam o `ENTRADA.aparelho.deitado` na N2.
- [ ] Fotos: `bg.html` → `cur/bg.png` 1920×1080 (com o notebook) e `media.html` → `cur/media.png` 1280×720 (sem o notebook).
- [ ] O relatório traz as imagens e o retângulo da tela, mais as sondas:
  - luminância p90 da faixa onde ficarão as metades do título na pausa, que deve dar ≤ 60. Use o centro e a largura da tela do aparelho na pausa, a 1440×900, com a conta de `telaNaCena` em `src/lib/heroEntrada.ts`;
  - cantos ≤ navy-900.
- [ ] Commit `feat(hero-notebook-arte): pipeline e cena deitada` (só fontes).

### Task N2: ligação da mídia no site e a pausa com o título inteiro

**Files:**
- Modify: `src/config/site.ts`: `heroNotebook: HeroNotebookMedia`, com `fundo` (deitado e retrato), `midia` e `midiaRetrato`, cada um `{ webm?, mp4?, posterAvif, posterJpg, width, height }`. Sem `webm`/`mp4`, não há vídeo e fica só o pôster.
- Modify: `src/components/sections/HeroVideoMedia.tsx`: `HeroVideoClip` aceita `clipRetrato?`.
- Modify: `src/components/sections/HeroNotebook.tsx`: usa `heroNotebook`.
- Modify: `src/lib/heroEntrada.ts`: `ENTRADA.midia` passa a ser `{ deitado, emPe }`; `ENTRADA.aparelho.deitado` recebe os números da N1; a pausa calcula a escala do título.
- Modify: `src/components/ui/scroll-expansion-hero.tsx`, `src/app/globals.css` (bloco Hero "entrada") e os testes vizinhos.
- Create: `public/hero/notebook/`: `fundo.*` e `midia-poster.*`, das fotos da N1 pelo `stills.sh`.
- Create: `src/config/heroNotebook.assets.test.ts`, que confere os arquivos e os limites das Global Constraints.

- [ ] **Pôster por enquadramento:** `<picture>` com `<source media="(orientation: portrait)">` para o retrato. Enquanto não houver mídia de retrato (até a N3), o retrato usa a do deitado.
- [ ] **Vídeo por enquadramento:**
  - o `src` é escolhido num efeito por `matchMedia("(orientation: portrait)")`, nunca na 1ª renderização;
  - ao mudar o enquadramento, o vídeo troca e mantém o estado de tocar ou pausar;
  - sem vídeo para o enquadramento, não há `<video>` tocando.
  - Teste: com o `matchMedia` falso, o vídeo pega o clipe deitado; ao mudar o enquadramento, ele troca, e o pôster nunca baixa os dois.
- [ ] **A câmera usa a mídia do enquadramento atual:** `telaNaCena` e `camera` leem `ENTRADA.midia[emPe ? "emPe" : "deitado"]`. Teste: o retrato de 720×1280 com o aparelho `emPe` cai no centro esperado.
- [ ] **Título inteiro na pausa:**
  - `posicaoDoTitulo` também devolve `escala`, que é `min(1, espaço livre de cada lado ÷ largura da metade)`;
  - o espaço livre de cada lado é a distância da borda da tela do aparelho à borda da janela útil, menos `tituloFolga` e menos 16 px de margem;
  - o CSS aplica `--hx-titulo-s` às duas metades na pausa.
  - Teste: a 1440×900 e a 1366×768, com larguras medidas como as do relatório da Task 3 da fase 1, as duas metades ficam dentro de [16, v.w − 16].
- [ ] **Vídeo da sala pausado quando coberto** (M2 da revisão final da fase 1):
  - com `k ≥ 0,98`, ou com P = 1 recolhido, o vídeo pausa;
  - abaixo disso, ele volta a tocar se estava tocando e a pessoa não o pausou.
  - Teste no vitest.
- [ ] **Números do estado parado amarrados ao `ENTRADA`:** a escala fixa `--hx-tela-s` da pose parada no CSS precisa bater com `camera` a 1440×900 (deitado) e a 390×844 (em pé). Isto fecha o minor estacionado da Task 3. O teste lê o `globals.css` e compara com 4 casas.
- [ ] Gates e `CHECK_BROWSER_ETAPAS=entrada npm run check:browser` no dev server de `:3000`. Se a etapa tiver um número fixo do cinza, ela passa a lê-lo do `ENTRADA`.
- [ ] Commits `feat(hero): mídia do notebook por enquadramento e título inteiro na pausa` e `chore(hero-notebook): cena deitada no lugar do cinza` (a mídia).

### Task N3: cena em pé (fotos paradas) e instalação

**Files:** `scripts/hero-notebook/` (câmeras `portrait` 1080×1920 e `mediaRetrato` 720×1280, `portrait.html`, `media-retrato.html`), `public/hero/notebook/fundo-retrato.*` e `midia-retrato-poster.*`, `src/config/site.ts` e `src/lib/heroEntrada.ts`.

- [ ] Mesmo mundo da N1, com o enquadramento em pé da spec §6:
  - o celular de pé num suporte, na frente e no centro;
  - o notebook atrás, desfocado e cortado;
  - caixa do Replay e caneca nas laterais, se couberem.
  - Na `mediaRetrato`, `semAparelho` tira o celular e o suporte, e fica a sombra.
- [ ] O `geo.js` imprime o retângulo da tela do celular em px da mídia 720×1280, o que vira o `ENTRADA.aparelho.emPe` e o `ENTRADA.midia.emPe = { w: 720, h: 1280, posX, posY }`.
- [ ] Sondas da N1 a 390×844: a faixa do título e os cantos.
- [ ] Instalar `fundo-retrato.*` e `midia-retrato-poster.*`.
- [ ] Atualizar o `heroNotebook.midiaRetrato` e o `ENTRADA`, e acertar a escala fixa em pé do CSS pelo teste da N2.
- [ ] Gates e a etapa `entrada` no `:3000`.
- [ ] Commits `feat(hero-notebook-arte): cena em pé` e `chore(hero-notebook): cena em pé instalada`.

### Task N4: aparelho em vetor

**Files:**
- Create: `src/components/sections/AparelhoVetor.tsx` e `AparelhoVetor.test.tsx`.
- Modify: `HeroNotebook.tsx`, que passa a usar `AparelhoVetor`, e o bloco Hero "entrada" do `globals.css`.
- Delete: `AparelhoCinza.tsx`, o teste dele e o CSS `.aparelho-cinza*`, se nada mais usar.

- [ ] **Notebook:**
  - tampa com a borda da tela e o ponto da câmera;
  - dobradiça;
  - base com o teclado em leve perspectiva, um trapézio que se alarga para baixo, com fileiras de teclas sugeridas e sem legendas;
  - sombra de contato.
- [ ] **Celular:** corpo com cantos arredondados e o suporte.
- [ ] **Encaixe na tela:** a tela HTML é o furo da moldura, como no cinza. A moldura se ajusta à proporção da janela (Q13): borda de espessura fixa em volta da tela, e a base acompanha a largura da tampa.
- [ ] **Materiais e luz:**
  - mesmo navy e mesma luz da cena, com o brilho frio da tela no topo da base;
  - ciano ou elétrico só no detalhe.
  - Nada focável, `aria-hidden`.
  - Com cores forçadas, o contorno fica em `CanvasText`.
  - Sem JS ou com movimento reduzido, a pose parada mostra o aparelho inteiro.
- [ ] **Só em CSS ou SVG inline**, sem imagem, para ficar nítido até o fim.
- [ ] **Testes:**
  - os mesmos ganchos do cinza que o `check:browser` usa (o furo do aparelho e a moldura à vista), com nomes `aparelho-vetor__*`; atualizar os seletores da etapa `entrada`;
  - `aria-hidden`;
  - nada focável.
- [ ] Capturas na pausa a 1440×900, 1366×768, 2560×1080 e 390×844, pelo `:3000` com um Edge headless só, salvas no scratchpad para a crítica. Elas cobrem o Review Focus 2.
- [ ] Gates e a etapa `entrada`.
- [ ] Commit `feat(hero): aparelho em vetor no lugar do cinza`.

### Task N5: loops de 10 s dos dois enquadramentos

**Files:** `scripts/hero-notebook/` (`plates.html`, `city2x.html`, `steam2.html`, `derive.sh`, `composite2.js`, `encode.sh`, `vqa.sh`, os dois enquadramentos), `public/hero/notebook/midia.*` e `midia-retrato.*`, e os pôsteres regenerados do quadro 0. Modify: `src/config/site.ts` (`webm` e `mp4`).

- [ ] **Passes e composição como no README do hero:** A, B, C e D, mais T, E e Lp. `composite2.js` faz os 251 quadros, e o 250 é igual ao 0. Para cada enquadramento:
  - `media` → `midia`;
  - `mediaRetrato` → `midia-retrato`.
- [ ] **Brilho da tela:** o brilho frio que o notebook ausente deixa na mesa fica parado. Não pisca, porque a tela é o site e não tem animação (spec §12).
- [ ] **Codificação:** `encode.sh` nos limites das Global Constraints; o pôster sai do quadro 0 do master, pelo `stills.sh`.
- [ ] **Emenda:** `vqa.sh`, com a emenda ≥ 45 dB nos dois.
- [ ] **Quadros para a crítica:** 0, 62, 125, 187 e 250 de cada clipe, em PNG no scratchpad.
- [ ] **Instalação e testes:** instalar os arquivos, ligar `webm` e `mp4` no `heroNotebook` e rodar o `heroNotebook.assets.test.ts` (verde), os gates e a etapa `entrada`.
- [ ] **Commits:** `feat(hero-notebook-arte): loops de 10 s` e `chore(hero-notebook): loops instalados`.

### Task N6: crítica de conjunto, ajuste e documentação da pasta

**Files:** `scripts/hero-notebook/README.md` e o que a crítica pedir nas cenas ou no `AparelhoVetor`.

- [ ] Pela `:3000`, a 1440×900, 1366×768, 2560×1080 e 390×844, nos momentos P = 0 (cartão), fim da expansão, pausa, metade da aproximação e P ≈ 0,98:
  - montar uma prancha no scratchpad com essas capturas;
  - montar, lado a lado, a pausa do notebook e o `public/hero/expansao/midia-poster.jpg` de produção, para conferir se é o mesmo mundo.
- [ ] Crítica contra a spec §6, a MASTER §3.4 e §10 e o Review Focus, seguida de uma rodada de ajuste e de nova renderização ou novo CSS.
- [ ] Sonda final da faixa do título com a arte instalada (Review Focus 1).
- [ ] O README da pasta deve cobrir:
  - os comandos, como no do hero;
  - de onde vêm os números do `ENTRADA.aparelho`;
  - a regra de que, mexendo no mundo, renderizam-se as fotos, os passes e o `geo.js` de novo, e os números do `ENTRADA` e do CSS parado são atualizados.
- [ ] Gates, `CHECK_BROWSER_ETAPAS=entrada npm run check:browser` e, uma vez, o `npm run check:browser` completo.
- [ ] Commit `docs(hero-notebook-arte): README` e os de ajuste.
