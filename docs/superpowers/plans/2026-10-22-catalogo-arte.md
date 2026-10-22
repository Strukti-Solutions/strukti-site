# Arte final do catálogo — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** trocar os degradês provisórios de `public/catalogo/<slug>/` por cenas ilustradas no mundo do hero "Fim de expediente", com os mesmos nomes de arquivo, sem mexer no código do catálogo.

**Architecture:** a mesma produção própria do hero (`scripts/hero-expansao/`): cenas em Canvas2D com o modelo de luz do `scene.js` (ambiente de hora azul, luz da janela, abajur neutro-quente), fotografadas por um Edge headless (`shot.sh`, um Edge por vez) e codificadas no ffmpeg (`stills.sh`, `encode.sh`). Um kit comum em `scripts/catalogo-arte/kit/`, uma pasta por cena em `scripts/catalogo-arte/<slug>/` (só texto, com README) e uma câmera retrato 800×1200.

**Tech Stack:** Canvas2D, Edge headless, ffmpeg (libaom-av1, libvpx-vp9, libx264), Node. Sem dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-16-catalogo-produtos-design.md` §6 (contrato §6.1, direção §6.2), §5.3 e §8 (alt); MASTER §3.4 (contraste) e §10 (anti-cara-de-IA); ADR-005 (produção própria) e ADR-009 (o render da caixa do replay é "Ilustração do conceito").

## Global Constraints

- Branch `feat/catalogo-produtos` (o PR ainda não foi aberto; a §13, passo 3, integra a arte antes dele).
- Contrato §6.1, verbatim: `cartao.avif/.jpg` 800×1200, ≤120 KB / ≤200 KB; `cartao-480.avif/.jpg` 480×720, ≤45 KB / ≤70 KB; `cartao-loop.webm/.mp4` 600×900, 25 fps, **5 s**, ≤600 KB cada, só nos 3 reais. As `tela-N.svg` não mudam. `src/content/catalogo.assets.test.ts` é o juiz.
- Direção §6.2, verbatim: "Hora azul e paleta da marca: navy, com elétrico e ciano só nos detalhes da Strukti. Mesma luz, grão e tratamento do 'Fim de expediente'. Sem natureza nem paisagem, sem texto na imagem e sem logo de terceiro."
- Composição: objeto principal entre ~15% e 60% da altura; metade de baixo calma e escura (é onde fica o texto do cartão do centro); leitura clara na miniatura de 64 px; cantos que caem para o navy.
- Loop dos reais: 5 s, movimento calmo; o quadro 0 igual ao `cartao.jpg`, e o último volta ao 0; sem grão temporal.
- Nada de geração por IA nem de imagem de banco: tudo desenhado em código, como o hero (ADR-005).
- Nada inventado sobre os reais: sem cliente, quadra com nome, número ou marca na imagem.
- **Memória limitada:** um Edge por vez, com as flags do `shot.sh` do hero; nenhum dev server nesta produção. Arquivos intermediários (`cur/`, `plates/`, `final/`) fora do git (`.gitignore` em cada pasta, como no hero).
- Gates de cada task: `npx vitest run src/content/catalogo.assets.test.ts` quando instalar arquivos; no fim, `npm run typecheck`, `npm run lint`, `npx vitest run --maxWorkers=2` e `node scripts/catalogo-arte/medir-contraste.mjs`.

## Review Focus

1. A metade de baixo de cada cartão fica escura: o texto do cartão do centro precisa manter ≥ 4,5:1 com a arte final (o `medir-contraste.mjs` mede com a arte instalada).
2. Leitura a 64 px: o objeto de cada item tem que ser reconhecível na miniatura da fita e distinto dos outros 9.
3. Coerência de série: os 10 juntos parecem da mesma mão e do mesmo mundo do hero (mesma luz, grão e paleta), e não 10 estilos.
4. Emenda do loop: o quadro 0 = `cartao.jpg` e o último = 0, sem salto visível ao parar.
5. Orçamento: AVIF com grão no crf certo (o hero usou crf 11; acima de 12 o céu fica liso com faixas), sem estourar os limites do §6.1, principalmente no 480.

---

### Task A1: Kit de cena e a cena do Replay

**Files:** Create `scripts/catalogo-arte/kit/` (`cena.js` com a paleta, o modelo de luz e o grão do `scene.js` do hero, mais a câmera retrato 800×1200; `shot.sh`, `stills.sh`, `encode.sh` adaptados para esta pasta; `sondas.js` com a caixa do objeto em % do quadro e a luminância p90 da metade de baixo; `.gitignore`), `scripts/catalogo-arte/replay/` (`cena.js`, `cartao.html`, `README.md`). Modify `scripts/catalogo-arte/README.md`.

- [ ] Reaproveitar do `scripts/hero-expansao/scene.js` (leia inteiro) o que for comum: paleta, luz, grão, desenho da caixa do replay. Copiar e adaptar é permitido (é código da casa). Não importe nada do hero em tempo de execução: o hero não pode mudar.
- [ ] Cena do Replay (§6.2): a caixa do botão no alambrado de uma quadra vazia à noite, com névoa leve dos refletores e o LED ciano. A caixa é a do conceito do hero (mesmas proporções, botão azul, LED ciano).
- [ ] Sondas: objeto entre 15% e 60% da altura; luminância p90 da metade de baixo ≤ 60 (escala 0–255, o mesmo critério da faixa do título do hero); cantos ≤ navy-900.
- [ ] Renderizar o `cartao.png` 800×1200, gerar `cartao.avif/.jpg` e `cartao-480.avif/.jpg` (o 480 a partir do 800, com `scale=480:720:flags=lanczos`) dentro do orçamento, em `scripts/catalogo-arte/replay/final/` (fora do git).
- [ ] Ainda não instalar em `public/`. O relatório traz os caminhos das imagens, as medidas das sondas e os bytes.

### Task A2: Cena do Rota de Vendas

**Files:** `scripts/catalogo-arte/rota-de-vendas/` (cena, html, README).

- [ ] O celular com a rota no suporte do painel de um carro parado, com a cidade desfocada no para-brisa. A tela usa a mesma interface do celular do hero (rota em ângulos retos, paradas, cartão de concluído), sem texto legível. Mesmas sondas e saídas da A1.

### Task A3: Cena do Fleet Analytics BI

**Files:** `scripts/catalogo-arte/fleet-analytics-bi/`.

- [ ] O painel de BI num monitor de um escritório escuro (mapa com a frota, curva de velocidade, barras de indicadores, sem texto), com a janela para a cidade, no mesmo mundo do hero (pode ser a mesma janela e cidade). Mesmas sondas e saídas.

### Task A4: Cena-modelo dos 7 inventados

**Files:** `scripts/catalogo-arte/inventados/` (`cena.js` parametrizado por slug, `cartao.html?slug=`, README).

- [ ] Uma cena-modelo mais simples, com o mesmo ambiente e uma silhueta do objeto de cada item: placar (`placar-conectado`), totem (`totem-check-in`), sensor sobre a porta (`contador-de-fluxo`), celular com agenda (`agenda-de-quadras`), celular com estoque (`estoque-oficinas`), navegador de clínica (`site-clinicas`) e navegador de loja (`vitrine-lojas`). Só imagem parada, sem loop.
- [ ] Os 7 se distinguem a 64 px (silhueta e acento de cor do tipo: hardware ciano, aplicativo elétrico, site o violeta suave `8b7ff0` só no detalhe, nunca degradê roxo→azul de fundo).

### Task A5: Loops de 5 s dos 3 reais

**Files:** `scripts/catalogo-arte/<real>/` (passes e composição), `scripts/catalogo-arte/kit/` (`loop.js` para compor e `vqa.sh` adaptados do hero).

- [ ] Movimento calmo por cena: Replay com o LED respirando e a névoa; Rota com a cidade levemente à deriva no para-brisa; Fleet com dados pulsando na tela. Feito por passes e composição periódica, como o `composite2.js` do hero, sem grão temporal.
- [ ] 600×900, 25 fps, 125 quadros; o quadro 0 igual ao `cartao` (mesma imagem de origem, redimensionada) e o último igual ao 0 (emenda ≥ 45 dB no `vqa`); webm VP9 e mp4 H.264 ≤ 600 KB cada.

### Task A6: Crítica de série e ajuste

- [ ] Montar no scratchpad uma prancha com os 10 cartões lado a lado, uma simulação do coverflow (centro em 800, laterais menores e escurecidos) e a fita em 64 px; gerar também uma versão de cada cartão com o texto do cartão do centro por cima (etiqueta, selo, nome, frase, "Ver detalhes"), para ver a metade de baixo.
- [ ] Crítica contra a §6.2, a MASTER §10 e o Review Focus; ajustar as cenas (rodada de ajuste) e renderizar de novo.

### Task A7: Instalar, alt e documentação

**Files:** `public/catalogo/<slug>/cartao*.{avif,jpg}`, `cartao-loop.*`; apagar `public/catalogo/LEIA-PROVISORIO.txt`; Modify `src/content/catalogo.ts` (`arte.alt` descreve a cena final de cada inventado, §8; minor adiado da Task 1 do plano do catálogo), `scripts/catalogo-arte/README.md`, MASTER (§8.8 e onde citar os provisórios), `docs/superpowers/specs/2026-10-16-catalogo-produtos-design.md` §6.1 ("Hoje já existem arquivos provisórios" passa ao estado atual).

- [ ] Copiar os arquivos finais com os mesmos nomes; `npx vitest run src/content/catalogo.assets.test.ts` verde.
- [ ] `node scripts/catalogo-arte/medir-contraste.mjs` com a arte instalada: ≥ 4,5:1 em todos os itens.
- [ ] Gates completos. O `check:browser` e as capturas da QA visual ficam para quando o dono liberar o dev server (falta de memória); registrar isso no relatório.
- [ ] Commits: `feat(catalogo-arte): …` por cena (fontes) e um `chore(catalogo): arte final no lugar dos provisórios` (mídia).
