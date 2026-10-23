# Cartão do Rota de Vendas

A arte do cartão do Rota de Vendas em Produtos (spec 2026-10-16, §6.2): o
celular com a rota, deitado (paisagem) no suporte de ventosa do painel de um
carro parado, com a rua de hora azul desfocada no para-brisa. A tela é a mesma
interface do celular do hero (`drawPhone` de `scripts/hero-expansao/scene.js`):
o mapa de quadras girado, a rota em ângulos retos do elétrico ao ciano, cinco
paradas, o pino de partida e o cartão de concluído, sem texto. Nenhuma rua,
placa, marca ou cliente real.

- `cena.js`: o mundo (em cm) e o render, sobre o kit (`../kit/cena.js`).
- `cartao.html`: a câmera retrato 800 × 1200. Aceita mudanças pela consulta
  (`cartao.html?telaFundo=0&halo=0` volta a tela ao tom exato do hero, por
  exemplo); `?so=cidade` mostra só a cidade desfocada, com o bokeh (depuração).

## A cena

O topo do painel é o plano y = 0; o celular fica em x = 0, z = 0 (z para o
para-brisa) e a rua, 95 cm abaixo do painel. A câmera fica 6 cm à esquerda e
praticamente na altura do centro do aparelho, 42 cm atrás dele (F 1080): o ponto de fuga da
rua cai atrás do aparelho (x ~31%), e as duas fileiras de postes levam o olho
para ele.

| Camada | O que é |
|---|---|
| Cidade (passe por pixel, desfocado em 7 px, 92% da exposição) | A rua vista do carro parado junto ao meio-fio da direita: fachadas dos dois lados (planos x = −14,5 m e x = 6,2 m) em quarteirões sorteados com cruzamentos, janelas acesas nas cores da cidade do hero (navy-300, elétrico-300, navy-100; fileiras inteiras apagadas às vezes), poucas lojas no térreo, baixas e neutras; o asfalto com a faixa tracejada e o reflexo alongado dos postes; o céu de hora azul do kit e, ao longe, uma linha baixa de prédios; névoa de distância |
| Bokeh | As luminárias dos postes (de 30 em 30 m, alternadas nos dois lados; a fileira da direita começa em 54 m), metade sódio fraco (255/210/160) e metade LED neutro-frio, tamanho variado em ±25% (`bokeh` 22 px, um pouco maiores perto) e "olho de gato" perto das bordas; mais até 15 janelas do mesmo sorteio do passe por pixel; um véu de ar iluminado em volta das luminárias mais perto. Acima de ~27% da altura as luminárias caem para `ceuBokeh` (45%) da exposição: nenhum disco no céu passa do brilho da tela na miniatura |
| Vidro | O pé do para-brisa abraça o carro (`abraco` 40 cm: nos lados chega mais perto da câmera), então a linha do vidro com o painel é uma curva, mais alta no centro. A serigrafia: faixa preta até 2 cm e um degradê contínuo até ~4 cm, com uma só fileira de pontos maiores e macios na transição (desfocada em 1 px); um véu leve; o reflexo do painel no pé do vidro (a faixa de painel logo abaixo, espelhada, `reflexo` 0,3) |
| Moldura (no plano da imagem, desfocada em 2,5 px) | A coluna A do motorista: uma faixa escura do topo (a ~31% da largura) até a borda esquerda a ~37% da altura, com o fio de luz do céu na aresta e, além dela, uma fresta do vidro lateral com película; o teto, uma curva escura no topo (6% no centro); e o retrovisor interno pendurado a ~2/3 da largura, em contraluz, com o contorno aceso pelo céu. A câmera colada no aparelho deixaria tudo isso fora do quadro; entra como silhueta perto da câmera, fora de foco |
| Painel (passe por pixel) | Plástico escuro (albedo 35/37/42): a grade do desembaçador perto do vidro e a fresta escura no pé dele, o brilho rasante perto do vidro e um fio que sobe em curva onde o painel encontra o para-brisa; a borda de perto (a 25 cm da base do aparelho, abaixo de 85% do quadro, no esmaecimento) arredonda para baixo com um fio fraco; a poça quente da chave em volta do suporte e a luz fraca da tela à frente do aparelho. A faixa de 55–80% é um degradê só |
| Sombras | O aparelho e o suporte projetados no painel pela chave (para a direita), mais o contato da ventosa |
| Suporte | Ventosa (tronco de cone de 7,2 cm), braço de 1,9 cm inclinado da ventosa até a junta atrás do centro do aparelho, anel de aperto com chanfro; o lábio de borracha mais claro na borda de contato, o brilho da chave no ombro do cone e o aro de cima aceso; duas garras laterais e dois pés embaixo (1,5 cm acima do pé do vidro na tela: não tangenciam a linha), com o lábio sobre a borda da frente |
| Celular | 15,2 × 7,3 × 0,85 cm, de pé, girado 7° para a câmera: borda de alumínio escuro mais clara em cima (pega o céu), vidro preto, filete claro no contorno e na aresta de cima; a tela do hero, com o fundo do mapa 45% mais perto do navy-800 (`telaFundo`: a tela é a luz mais forte do quadro e precisa ler a 64 px) e um halo elétrico fraco em volta (`halo` 0,05); o traço da rota em 0,22 (o do hero é 0,16; `rota`), +1,5 px para ler a 64 px |
| Acabamento (kit) | Bloom leve, vinheta elíptica até o navy (mais fraca, 0,65: a moldura do para-brisa já escurece os cantos de cima), esmaecimento da metade de baixo e o grão estático do hero (amplitude 5; 6,5 abaixo de 60% da altura, `grainBaixo`) |

A luz é a do kit: ambiente de hora azul, a luz do céu entrando pelo para-brisa
(de frente e de cima, como a janela do hero), os postes da rua (só na cidade) e
a chave, um poste de fora visto pela janela do motorista, alto à esquerda, em
poça em volta do aparelho: quente (sódio fraco, ~255/217/173), o contraponto do
abajur do hero contra a hora azul; no centro da poça R ≈ G.

## Fazer

Rode de dentro desta pasta. Um Edge por vez; nada de dev server.

```sh
cd scripts/catalogo-arte/rota-de-vendas
../kit/shot.sh cartao.html cur/cartao.png 800 1200   # ~5 s
node ../kit/sondas.js . cur/cartao.png               # sai com 1 se alguma sonda reprovar
../kit/stills.sh cur/cartao.png final 10 2 6 2        # cartao(.avif/.jpg) e cartao-480(.avif/.jpg) em final/
```

O AVIF vai em crf 10 (800) e 6 (480), abaixo do crf 11 do Replay: esta cena
tem céu e paredes lisas, e no crf 11 o grão da metade de cima caía à metade no
800 (desvio de alta frequência de 2,02 no PNG para 1,05) e quase sumia no 480
(1,05 no PNG reduzido para 0,27). No crf 10/6 fica em 1,28 e 0,49, dentro do
orçamento.

`cur/` e `final/` ficam fora do git (`.gitignore`). A instalação em
`public/catalogo/rota-de-vendas/` é a Task A7 do plano da arte
(`docs/superpowers/plans/2026-10-22-catalogo-arte.md`); o loop de 5 s (a cidade
levemente à deriva no para-brisa), a A5.

## Medidas (22/10/2026, ajuste da rodada 1 da crítica)

| Sonda | Medida | Critério |
|---|---|---|
| Celular no quadro (x0 x1 y0 y1) | 25,5 74,4 26,9 42,6 (%) | entre 15% e 60% da altura |
| Metade de baixo, p50 / p90 / p99 (Y) | 17,6 / 35,1 / 44,0 | p90 ≤ 60 (a crítica pediu ≤ 40) |
| Cantos 5% (Y) | 15,0 / 13,7 / 12,6 / 12,7 | ≤ 25,5 (navy-900) |
| Y médio por faixa de 10% | 17 24 29 36 27 32 26 16 14 13 | — |
| Miniatura 64 × 96 (`scale=64:96:flags=area`): ponto mais claro da metade de cima fora do celular / da tela | 77 / 114 (67%) | ≤ 85% (antes: 123 / 110) |

| Arquivo | Bytes | Orçamento (§6.1) |
|---|---|---|
| `cartao.avif` (crf 10) | 90 151 | 120 000 |
| `cartao.jpg` (q 2) | 89 717 | 200 000 |
| `cartao-480.avif` (crf 6) | 23 845 | 45 000 |
| `cartao-480.jpg` (q 2) | 19 992 | 70 000 |

O render é determinístico (o mesmo PNG a cada vez), o que o loop da A5 usa: o
quadro 0 dele é este cartão.

## Loop de 5 s (Task A5)

A cidade lá fora anda devagar no para-brisa (até 14 px para a direita no 800,
10,5 px no 600, e volta); o carro, o suporte e o celular ficam parados. Passes
e composição periódica, como o `composite2.js` do hero (`loop.js` desta pasta,
composto pelo `../kit/loop.js`):

| Placa | Como | O que dá |
|---|---|---|
| `cur/cartao.png` | o cartão | o quadro 0 |
| `plates/C.png` | `cartao.html?so=cidade` | a cidade desfocada com o bokeh (a camada de baixo de tudo, sem acabamento) |
| `plates/B64.png`, `plates/B192.png` | `cartao.html?cidadeCinza=64&noGrain=1` (e 192) | T = (B192 − B64) / 128: o quanto a cidade aparece em cada pixel (como o T do hero) |

quadro(t) = cartão + T · (C(x − dx(t), y) − C(x, y)), com dx(t) = 14 · sobe(t)
e sobe(t) = ½ − ½ cos(2πt / 5 s); C é amostrado em bilinear (a cidade já está
desfocada em 7 px). dx(0) = 0: o quadro 0 é o cartão byte a byte. A
transmissão é linear (o vidro, a serigrafia, a vinheta e o esmaecimento são
misturas): B64 + T · (C − 64) refaz o cartão com erro de 2,4 (RMS, com o grão).
`cidadeCinza` (sem padrão) troca a cidade por um cinza liso; sem ele o cartão
não muda (mesmo md5).

```sh
../kit/shot.sh "cartao.html?so=cidade" plates/C.png 800 1200
../kit/shot.sh "cartao.html?cidadeCinza=64&noGrain=1" plates/B64.png 800 1200
../kit/shot.sh "cartao.html?cidadeCinza=192&noGrain=1" plates/B192.png 800 1200
node ../kit/loop.js loop.js                       # plates/master.mkv
../kit/encode.sh plates/master.mkv final 18 12
../kit/vqa.sh final/cartao-loop.webm rota-webm 600:420:0:0 cur/cartao.png
```

| Medida (22/10/2026) | MP4 (H.264 crf 18) | WebM (VP9 crf 12) | Critério |
|---|---|---|---|
| Bytes | 228 250 | 179 696 | ≤ 600 000 |
| Emenda 124 → 0 | 54,96 dB | 90,78 dB | ≥ 45 dB |
| Pares seguidos idênticos (quadro inteiro) | 0 | 19 de 124 | — |
| Quadro 0 × cartão (600 × 900) | 42,38 dB | 42,57 dB | a perda é só a da compressão |

Os pares idênticos do WebM ficam nas voltas da deriva (quadros 1–11, 49–81 e
122–124), onde a cidade anda menos de 0,1 px por quadro e o VP9 repete o
quadro; no master sem perda são 4. Com 8 px de deriva eram 34; crf 4 só baixa
para 20 (e custa 314 KB).
