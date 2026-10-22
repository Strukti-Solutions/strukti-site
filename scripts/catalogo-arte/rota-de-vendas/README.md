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
1,2 cm acima do centro do aparelho, 42 cm atrás dele (F 1080): o ponto de fuga da
rua cai atrás do aparelho (x ~31%), e as duas fileiras de postes levam o olho
para ele.

| Camada | O que é |
|---|---|
| Cidade (passe por pixel, desfocado em 7 px, 92% da exposição) | A rua vista do carro parado junto ao meio-fio da direita: fachadas dos dois lados (planos x = −14,5 m e x = 6,2 m) em quarteirões sorteados com cruzamentos, janelas acesas nas cores da cidade do hero (navy-300, elétrico-300, navy-100; fileiras inteiras apagadas às vezes), poucas lojas no térreo, baixas e neutras; o asfalto com a faixa tracejada e o reflexo alongado dos postes; o céu de hora azul do kit e, ao longe, uma linha baixa de prédios; névoa de distância |
| Bokeh | As luminárias dos postes (de 30 em 30 m, alternadas nos dois lados), discos quase do mesmo tamanho (`bokeh` 22 px, um pouco maiores perto), mais até 15 janelas do mesmo sorteio do passe por pixel; um véu de ar iluminado em volta das luminárias mais perto |
| Vidro | A serigrafia do pé do para-brisa (faixa preta até 2 cm e pontos que diminuem até 4,5 cm), um véu leve e a faixa um pouco mais clara do reflexo do painel no pé do vidro |
| Painel (passe por pixel) | Plástico escuro (albedo 34/38/47): a grade do desembaçador perto do vidro e a fresta escura no pé dele, o brilho rasante perto do vidro, a borda de perto em arco (mais longe nos lados) que arredonda para baixo e pega um fio de luz, e a face do painel no escuro (é a metade do texto); a poça da chave em volta do suporte e a luz fraca da tela à frente do aparelho |
| Sombras | O aparelho e o suporte projetados no painel pela chave (para a direita), mais o contato da ventosa |
| Suporte | Ventosa (tronco de cone de 7,2 cm), braço de 1,9 cm inclinado da ventosa até a junta atrás do centro do aparelho, anel de aperto; duas garras laterais e dois pés embaixo, com o lábio sobre a borda da frente |
| Celular | 15,2 × 7,3 × 0,85 cm, de pé, girado 7° para a câmera: borda de alumínio escuro mais clara em cima (pega o céu), vidro preto, filete claro no contorno e na aresta de cima; a tela do hero, com o fundo do mapa 45% mais perto do navy-800 (`telaFundo`: a tela é a luz mais forte do quadro e precisa ler a 64 px) e um halo elétrico fraco em volta (`halo` 0,05) |
| Acabamento (kit) | Bloom leve, vinheta elíptica até o navy, esmaecimento da metade de baixo e o grão estático do hero (amplitude 5; 6,5 abaixo de 60% da altura, `grainBaixo`) |

A luz é a do kit: ambiente de hora azul, a luz do céu entrando pelo para-brisa
(de frente e de cima, como a janela do hero), os postes da rua (só na cidade) e
a chave, um poste de fora visto pela janela do motorista, alto à esquerda, um
branco neutro-quente (55% do abajur do hero), em poça em volta do aparelho.

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

## Medidas (22/10/2026, rodada 2)

| Sonda | Medida | Critério |
|---|---|---|
| Celular no quadro (x0 x1 y0 y1) | 25,5 74,4 30,2 45,9 (%) | entre 15% e 60% da altura |
| Metade de baixo, p50 / p90 / p99 (Y) | 20,3 / 33,3 / 39,7 | p90 ≤ 60 |
| Cantos 5% (Y) | 20,2 / 14,7 / 9,8 / 9,8 | ≤ 25,5 (navy-900) |
| Y médio por faixa de 10% | 23 27 33 36 29 27 27 23 10 9 | — |

| Arquivo | Bytes | Orçamento (§6.1) |
|---|---|---|
| `cartao.avif` (crf 10) | 91 447 | 120 000 |
| `cartao.jpg` (q 2) | 89 175 | 200 000 |
| `cartao-480.avif` (crf 6) | 24 831 | 45 000 |
| `cartao-480.jpg` (q 2) | 19 893 | 70 000 |

O render é determinístico (o mesmo PNG a cada vez), o que o loop da A5 usa: o
quadro 0 dele é este cartão.
