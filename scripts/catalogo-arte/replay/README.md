# Cartão do Replay

A arte do cartão do Replay em Produtos (spec 2026-10-16, §6.2): a caixa do
botão presa ao poste do alambrado de uma quadra vazia à noite, com a névoa dos
refletores da quadra vizinha ao fundo e o LED ciano aceso. É uma **ilustração
do conceito** (ADR-009): nenhuma quadra, marca, número ou cliente real.

- `cena.js`: o mundo (em cm) e o render, sobre o kit (`../kit/cena.js`).
- `cartao.html`: a câmera retrato 800 × 1200. Aceita mudanças pela consulta
  (`cartao.html?ledK=0&nevoa=0`, por exemplo);
  `?so=fundo&fundoBlur=0&fundoExp=1&fundoExpPiso=1` mostra só o fundo, sem
  desfoque (depuração).

## A cena

| Camada | O que é |
|---|---|
| Fundo (passe por pixel, depois desfocado em 4,5 px; 86% da exposição, 96% na faixa do piso, de 28% a 62% da altura) | O céu de hora azul e a cidade baixa do hero; a quadra vizinha de society (15 × 25 m, girada 6°, comprida para longe, a 6 m da nossa tela), com as linhas de 10 cm (a de perto cruza o quadro na diagonal, ~y 570–630, e faz o canto à direita), o alambrado dela (laterais e fundo), os postes e o gol do fundo (x ~565–685, trave e travessão claros); o piso iluminado pelos refletores dela, com o reflexo, e a névoa de distância |
| Névoa | Os refletores são **bancos de lâmpadas**, não discos (um disco solto lia como lua): uma caixa escura com 3 lâmpadas (a da quadra vizinha, à esquerda, y ~220) ou 2 (os dois de outra quadra, à direita, y ~210–220), todos com a mesma meia largura na imagem (`bancoR` 13 px), desfocados 2,4 px, no alto de um poste fino e escuro que some na névoa para baixo. Sob cada banco, um cone de névoa azul-acinzentado (alfa 10% / 8% no topo) abre para a quadra e some antes de 45% da altura (`fachoMax`); em volta, um véu largo de luz no céu e um halo contido, em largura |
| Alambrado | Tela de losango de 3,6 cm de lado (~80 px de largura do losango, cerca de 0,4 da caixa) no plano z = 0, fio de 1,7 mm, com a trama nos cruzamentos alternados; cada fio tem espessura e opacidade um pouco diferentes (±14%, e devagar ao longo dele); o fio acende onde a névoa atrás dele é clara (perto dos refletores e na faixa da quadra) e fica ~20% mais leve sobre a faixa do piso (`telaPiso`) |
| Poste e fixação | Tubo de 6 cm, chapa atrás da caixa e duas abraçadeiras inox. A caixa (x 1,97 cm) e a chapa (x 1,09 cm) ficam à direita do eixo o tanto que a paralaxe da câmera as empurra para a esquerda: na imagem as duas ficam centradas no tubo, e as abraçadeiras saem dos dois lados. A sombra da caixa cai no poste e na tela (0,7, desfoque curto), com uma sombra de contato curta embaixo e à direita (`contato` 0,45) e outra abaixo da chapa de baixo; abaixo da caixa o tubo sai da luz e se funde ao navy (`posteSombra`), e o brilho do galvanizado para na chapa de baixo |
| Caixa | A do conceito do hero (`drawBox` de `scripts/hero-expansao/scene.js`): 9,6 × 13 × 4,6 cm, botão azul, hexágono, 4 parafusos, filete elétrico num traço só pelo contorno de cima da frente, rim frio na borda esquerda e a barra de LED ciano (`ledK` 0,85). A frente tem a direção da chave: mais clara em cima à esquerda, ~20% mais escura embaixo à direita, sobe 8 de valor (`face`) e tem um realce neutro fraco no canto de cima à esquerda (`realce` 0,07, o refletor da esquerda). Em volta dela o fundo cai ~30% no centro (`poca`, raio 160 px, some até 300 px), e a linha da quadra à direita da caixa fica a 60% (`linhaDir`): a caixa é o meio-tom mais claro do quadro |
| Acabamento (kit) | Bloom leve, vinheta elíptica até o navy, esmaecimento da metade de baixo e o grão estático do hero (amplitude 5; 6,5 abaixo de 60% da altura, `grainBaixo`, para o grão sobreviver ao JPG) |

A luz é a do kit: ambiente de hora azul, céu por cima e um refletor da nossa
quadra, alto, atrás e à esquerda da câmera, com um toque morno mínimo (15% do
abajur do hero), que acende uma poça em volta da caixa (como o cone do abajur
do hero, recentrado nos objetos).

## Fazer

Rode de dentro desta pasta. Um Edge por vez; nada de dev server.

```sh
cd scripts/catalogo-arte/replay
../kit/shot.sh cartao.html cur/cartao.png 800 1200   # ~5 s
node ../kit/sondas.js . cur/cartao.png               # sai com 1 se alguma sonda reprovar
../kit/stills.sh cur/cartao.png final 11 2            # cartao(.avif/.jpg) e cartao-480(.avif/.jpg) em final/
```

`cur/` e `final/` ficam fora do git (`.gitignore`). A instalação em
`public/catalogo/replay/` é a Task A7 do plano da arte
(`docs/superpowers/plans/2026-10-22-catalogo-arte.md`); o loop de 5 s, a A5.

## Medidas (22/10/2026, rodada 2 de ajuste)

| Sonda | Medida | Critério |
|---|---|---|
| Caixa no quadro (x0 x1 y0 y1) | 41,9 66,5 24,4 45,8 (%) | entre 15% e 60% da altura |
| Metade de baixo, p50 / p90 / p99 (Y) | 16,1 / 31,3 / 52,6 | p90 ≤ 60 |
| Cantos 5% (Y) | 22,7 / 23,6 / 10,6 / 11,0 | ≤ 25,5 (navy-900) |

| Arquivo | Bytes | Orçamento (§6.1) |
|---|---|---|
| `cartao.avif` (crf 11) | 98 801 | 120 000 |
| `cartao.jpg` (q 2) | 114 452 | 200 000 |
| `cartao-480.avif` (crf 11) | 16 690 | 45 000 |
| `cartao-480.jpg` (q 2) | 33 452 | 70 000 |

O render é determinístico (o mesmo PNG a cada vez), o que o loop da A5 usa: o
quadro 0 dele é este cartão.

## Loop de 5 s (Task A5)

O LED respira e a névoa dos refletores anda devagar; o resto fica parado.
Passes e composição periódica, como o `composite2.js` do hero (`loop.js`
desta pasta, composto pelo `../kit/loop.js`):

| Placa | Como | O que dá |
|---|---|---|
| `cur/cartao.png` | o cartão | o quadro 0 |
| `plates/L0.png` | `cartao.html?ledK=0` | E = cartão − L0: o LED (barra, brilhos e o bloom dele) |
| `plates/V0.png` | `cartao.html?veu=0` | N = cartão − V0: o ar iluminado (véus, cones de névoa, o brilho atrás da caixa e a faixa baixa), com a contraluz que ele dá aos fios |

quadro(t) = cartão − 0,45 · sobe(t) · E + névoa(x, y, t) · N, com
sobe(t) = ½ − ½ cos(2πt / 5 s) (o LED cai de `ledK` 0,85 para ~0,47 no meio da
volta e volta) e névoa = 0,6 · [sen(2πt / 5 s − f) + sen f], f a fase de uma
onda de 900 px inclinada 12° (uma faixa de densidade que nasce, anda meia onda
para a direita e some). Os dois valem 0 em t = 0: o quadro 0 é o cartão byte a
byte. `veu` (padrão 1) só multiplica o ar iluminado; com 1 o cartão não muda
(mesmo md5). O grão está só no cartão; os deltas são diferenças de passes com o
mesmo grão (não há grão temporal).

```sh
../kit/shot.sh "cartao.html?ledK=0" plates/L0.png 800 1200
../kit/shot.sh "cartao.html?veu=0" plates/V0.png 800 1200
node ../kit/loop.js loop.js                       # plates/master.mkv (ffv1, 800 x 1200, 125 quadros)
../kit/encode.sh plates/master.mkv final 18 12    # cartao-loop.mp4 (crf 18) e .webm (crf 12), 600 x 900
../kit/vqa.sh final/cartao-loop.webm replay-webm 600:450:0:0 cur/cartao.png
```

| Medida (22/10/2026) | MP4 (H.264 crf 18) | WebM (VP9 crf 12) | Critério |
|---|---|---|---|
| Bytes | 366 277 | 296 613 | ≤ 600 000 |
| Emenda 124 → 0 | 49,74 dB | 67,77 dB | ≥ 45 dB |
| Pares seguidos idênticos | 0 | 0 | — |
| Quadro 0 × cartão (600 × 900) | 42,12 dB | 42,82 dB | a perda é só a da compressão |
