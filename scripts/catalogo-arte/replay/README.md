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
| Névoa | Halos e fachos dos refletores. Na imagem entram três: um da quadra vizinha, maior e mais perto (à esquerda, y ~220), e dois de outra quadra, menores e mais longe (à direita, y ~210–220), todos acima da caixa; cada um com núcleo contido, halo de ~3,5× o raio e um facho tênue até o piso |
| Alambrado | Tela de losango de 5 cm no plano z = 0, com a trama nos cruzamentos alternados; o fio acende onde a névoa atrás dele é clara e fica ~20% mais leve sobre a faixa do piso (`telaPiso`) |
| Poste e fixação | Tubo de 6 cm, chapa atrás da caixa e duas abraçadeiras inox; a sombra da caixa cai no poste e na tela (0,7, desfoque curto), sombra de contato abaixo da chapa de baixo; abaixo da caixa o tubo sai da luz e se funde ao navy (`posteSombra`), e o brilho do galvanizado para na chapa de baixo |
| Caixa | A do conceito do hero (`drawBox` de `scripts/hero-expansao/scene.js`): 9,6 × 13 × 4,6 cm, botão azul, hexágono, 4 parafusos, filete elétrico num traço só pelo contorno de cima da frente, rim frio na borda esquerda e a barra de LED ciano (`ledK` 0,85). A frente tem a direção da chave: mais clara em cima à esquerda, ~20% mais escura embaixo à direita |
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

## Medidas (22/10/2026, rodada 1 de ajuste)

| Sonda | Medida | Critério |
|---|---|---|
| Caixa no quadro (x0 x1 y0 y1) | 37,7 62,1 24,5 45,7 (%) | entre 15% e 60% da altura |
| Metade de baixo, p50 / p90 / p99 (Y) | 16,0 / 30,8 / 56,0 | p90 ≤ 60 |
| Cantos 5% (Y) | 22,1 / 22,9 / 10,6 / 11,0 | ≤ 25,5 (navy-900) |

| Arquivo | Bytes | Orçamento (§6.1) |
|---|---|---|
| `cartao.avif` (crf 11) | 92 014 | 120 000 |
| `cartao.jpg` (q 2) | 109 313 | 200 000 |
| `cartao-480.avif` (crf 11) | 14 211 | 45 000 |
| `cartao-480.jpg` (q 2) | 30 608 | 70 000 |

O render é determinístico (o mesmo PNG a cada vez), o que o loop da A5 usa: o
quadro 0 dele é este cartão.
