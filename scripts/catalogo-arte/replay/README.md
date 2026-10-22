# Cartão do Replay

A arte do cartão do Replay em Produtos (spec 2026-10-16, §6.2): a caixa do
botão presa ao poste do alambrado de uma quadra vazia à noite, com a névoa dos
refletores da quadra vizinha ao fundo e o LED ciano aceso. É uma **ilustração
do conceito** (ADR-009): nenhuma quadra, marca, número ou cliente real.

- `cena.js`: o mundo (em cm) e o render, sobre o kit (`../kit/cena.js`).
- `cartao.html`: a câmera retrato 800 × 1200. Aceita mudanças pela consulta
  (`cartao.html?ledK=0&nevoa=0`, por exemplo); `?so=fundo&fundoBlur=0&fundoExp=1`
  mostra só o fundo, sem desfoque (depuração).

## A cena

| Camada | O que é |
|---|---|
| Fundo (passe por pixel, depois desfocado em 8 px e a 86% da exposição) | O céu de hora azul e a cidade baixa do hero; a quadra vizinha de society (20 × 40 m, comprida para longe), com linhas, o alambrado dela, os postes e o gol do fundo; o piso iluminado pelos 4 refletores dela e a névoa de distância |
| Névoa | Halos e fachos leves dos refletores (os 4 da quadra vizinha ficam acima do quadro) e uma fileira de refletores de outra quadra, mais longe, como discos fora de foco perto da altura da caixa |
| Alambrado | Tela de losango de 5 cm no plano z = 0, com a trama nos cruzamentos alternados; o fio acende onde a névoa atrás dele é clara |
| Poste e fixação | Tubo de 6 cm, chapa atrás da caixa e duas abraçadeiras inox; a sombra da caixa cai no poste e na tela |
| Caixa | A do conceito do hero (`drawBox` de `scripts/hero-expansao/scene.js`): 9,6 × 13 × 4,6 cm, botão azul, hexágono, 4 parafusos, filete elétrico na aresta de cima e a barra de LED ciano (`ledK` 0,85) |
| Acabamento (kit) | Bloom leve, vinheta elíptica até o navy, esmaecimento da metade de baixo e o grão estático do hero |

A luz é a do kit: ambiente de hora azul, céu por cima e um refletor da nossa
quadra, alto, atrás e à esquerda da câmera, que acende uma poça em volta da
caixa (como o cone do abajur do hero, recentrado nos objetos).

## Fazer

Rode de dentro desta pasta. Um Edge por vez; nada de dev server.

```sh
cd scripts/catalogo-arte/replay
../kit/shot.sh cartao.html cur/cartao.png 800 1200   # ~5 s
node ../kit/sondas.js . cur/cartao.png               # sai com 1 se alguma sonda reprovar
../kit/stills.sh cur/cartao.png final 11 3            # cartao(.avif/.jpg) e cartao-480(.avif/.jpg) em final/
```

`cur/` e `final/` ficam fora do git (`.gitignore`). A instalação em
`public/catalogo/replay/` é a Task A7 do plano da arte
(`docs/superpowers/plans/2026-10-22-catalogo-arte.md`); o loop de 5 s, a A5.

## Medidas (22/10/2026)

| Sonda | Medida | Critério |
|---|---|---|
| Caixa no quadro (x0 x1 y0 y1) | 37,7 62,1 24,5 45,7 (%) | entre 15% e 60% da altura |
| Metade de baixo, p50 / p90 / p99 (Y) | 16,2 / 36,4 / 60,6 | p90 ≤ 60 |
| Cantos 5% (Y) | 20,6 / 17,0 / 10,6 / 10,6 | ≤ 25,5 (navy-900) |

| Arquivo | Bytes | Orçamento (§6.1) |
|---|---|---|
| `cartao.avif` (crf 11) | 71 813 | 120 000 |
| `cartao.jpg` (q 3) | 49 341 | 200 000 |
| `cartao-480.avif` (crf 11) | 13 985 | 45 000 |
| `cartao-480.jpg` (q 3) | 20 922 | 70 000 |

O render é determinístico (o mesmo PNG a cada vez), o que o loop da A5 usa: o
quadro 0 dele é este cartão.
