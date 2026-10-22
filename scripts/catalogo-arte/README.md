# Arte do catálogo

Os cartões de `public/catalogo/<slug>/` (spec 2026-10-16, §6). Hoje há dois
estados: os arquivos **provisórios** (degradê, `provisorio.sh`) e a **arte
final** em produção (plano `docs/superpowers/plans/2026-10-22-catalogo-arte.md`),
que troca os provisórios com os mesmos nomes, sem mexer no código.

## Arte final: cenas no mundo do hero

Mesma produção do hero "Fim de expediente" (`scripts/hero-expansao/`): cenas em
Canvas2D, fotografadas por um Edge sem janela e codificadas no ffmpeg. Tudo é
desenhado em código (ADR-005): nada de IA generativa nem de banco de imagens.

| Pasta | O que tem |
|---|---|
| `kit/` | O que é comum à série e fixa o estilo (abaixo) |
| `replay/` | O cartão do Replay (ver o `README.md` dela) |
| `rota-de-vendas/` | O cartão do Rota de Vendas (ver o `README.md` dela) |
| `fleet-analytics-bi/` | O cartão do Fleet Analytics BI (ver o `README.md` dela) |

Cada cena tem `cena.js` (o mundo e o render, sobre o kit), `cartao.html` (a
câmera retrato 800 × 1200) e um `README.md`. As saídas (`cur/`, `final/`,
`plates/`, `qa/`) ficam fora do git; o kit tem o perfil do Edge em `kit/prof/`,
também fora.

### O kit (`kit/`)

- `cena.js` (`window.KIT` no navegador, `require` no Node): copiado e adaptado
  do `scene.js` do hero, sem importar nada dele (o hero não muda).
  - **Paleta**: a do design system (navy, elétrico, ciano), mais `lampW` (o
    abajur do hero, ~4000 K) e `floodW` (refletor, branco neutro).
  - **Luz**: cor = albedo × (ambiente de hora azul + luz do céu/janela + luzes
    pontuais). Cada cena declara as suas luzes em `LUZ.pontos` (posição, cor,
    força, alcance, cone e uma máscara opcional) e a direção do céu em
    `LUZ.ceuDir`.
  - **Câmera**: `makeCam` do hero (alvo, F, deslocamento do centro);
    `RETRATO` = 800 × 1200; `caixaPct` mede uma caixa em % do quadro.
  - **Céu de hora azul** por elevação (`SKY`, `ceu`), disco de bokeh (`disco`)
    e halo (`glow`), como na cidade do hero.
  - **Acabamento** (`acabamento`): bloom leve, vinheta elíptica até `C.edge`
    (os cantos caem para o navy), esmaecimento da metade de baixo
    (`bottomFade`, onde fica o texto do cartão do centro) e o grão estático do
    hero (amplitude 5, semente 42; o mesmo em todos os passes, então não ferve
    no loop). `grainBaixo: [y, amplitude]` sobe o grão abaixo da fração `y` da
    altura (mesmos números sorteados), para ele sobreviver ao JPG na metade
    escura; o Replay usa `[0.6, 6.5]`.
- `shot.sh <html[?consulta]> <png> <l> <a>`: o `shot.sh` do hero, com os
  caminhos relativos à pasta atual. Um Edge por vez, flags de pouca memória, e
  no fim fecha só os processos com o perfil `kit/prof`.
- `stills.sh <png> <pasta> [crf] [q] [crf-480] [q-480]`: `cartao.avif/.jpg` e
  `cartao-480.avif/.jpg` (o 480 reduzido do 800 com lanczos). AVIF de 8 bits
  com crf 11, como no hero (acima de 12 o grão some e o céu fica liso, com
  faixas). JPG em q 2 (o padrão): no q 3 o grão da metade escura some.
  Confere o orçamento da §6.1 e sai com 1 se estourar.
- `encode.sh <master.mkv> <pasta> <crf-mp4> <crf-webm>`: o loop dos 3 reais
  (600 × 900, 25 fps, 125 quadros), `cartao-loop.mp4` e `.webm`, até 600 KB
  cada. É usado na Task A5.
- `sondas.js <pasta-da-cena> [cartao.png]`: a caixa do objeto principal (entre
  15% e 60% da altura), a luminância p90 da metade de baixo (até 60, de 0 a 255,
  o critério da faixa do título do hero) e a média dos cantos (até a do
  navy-900), mais o Y médio por faixa de 10%. Sai com 1 se algo reprovar.

### Regras da série (§6.2 e plano)

- Hora azul e paleta da marca; elétrico e ciano só nos detalhes da Strukti.
  Sem natureza nem paisagem, sem texto na imagem, sem logo de terceiro.
- Objeto principal entre ~15% e 60% da altura; metade de baixo calma e escura;
  leitura clara na miniatura de 64 px; cantos que caem para o navy.
- Nada inventado sobre os 3 reais: sem cliente, quadra com nome, número ou marca.
- Olhar cada render (inteiro e reduzido a 64 px) antes de dar por pronto.

## Arte provisória

`provisorio.sh` gera os arquivos **provisórios** de `public/catalogo/<slug>/`: um degradê da cor do tipo para o navy `#0e1c2b`, sem ruído, para caber no orçamento da spec (2026-10-16, §6.1). Não é arte final.

```bash
bash scripts/catalogo-arte/provisorio.sh <slug> <cor-do-tipo> [--loop]
```

| Tipo | Cor | Exemplo |
|---|---|---|
| hardware (ciano) | `22d3ee` | `provisorio.sh placar-conectado 22d3ee` |
| aplicativo (elétrico) | `0185e7` | `provisorio.sh rota-de-vendas 0185e7 --loop` |
| site (violeta suave) | `8b7ff0` | `provisorio.sh site-clinicas 8b7ff0` |

- Gera `cartao.avif/.jpg` (800x1200) e `cartao-480.avif/.jpg` (480x720). Com `--loop` (só os 3 reais: `replay`, `rota-de-vendas`, `fleet-analytics-bi`), gera também `cartao-loop.webm/.mp4` (600x900, 25 fps, 5 s, o degradê respirando; o último quadro volta ao quadro 0).
- Não mexe nas telas `tela-1..3.svg` nem no `LEIA-PROVISORIO.txt`.
- Precisa de `ffmpeg` com `gradients`, `libaom-av1`, `libvpx-vp9` e `libx264`.
- O teste `src/content/catalogo.assets.test.ts` confere medidas e orçamento.

## Contraste

`node scripts/catalogo-arte/medir-contraste.mjs` mede o texto do cartão do
centro sobre a arte **instalada** em `public/catalogo/` (MASTER §3.4). Rode de
novo quando a arte final entrar.
