# Cartão do Air Central

A arte do cartão do Air Central em Produtos (spec 2026-10-16, §6.2): o módulo
numa prateleirinha logo abaixo do ar-condicionado de uma sala de aula vazia, à
noite, depois da última aula. O ar já foi desligado pelo sistema (aleta fechada,
nenhuma luz no aparelho); o LED ciano do módulo é a única luz acesa. O módulo é
uma **ilustração do conceito** (ADR-009, item 4, como a caixa do Replay): a PCB
numa caixinha impressa em 3D, com o formato de um Mac mini, ainda não existe
como peça. Nenhuma sala, escola, marca, número ou cliente real; o
ar-condicionado é genérico (sem marca e sem display).

- `cena.js`: o mundo (em cm) e o render, sobre o kit (`../kit/cena.js`).
  Copiado e adaptado do Replay (a caixa, o filete, o LED, a luz da chave) e do
  Fleet (a cidade do hero, `buildCity`/`cityLayer`), sem importar nada deles.
- `cartao.html`: a câmera retrato 800 × 1200. Aceita mudanças pela consulta
  (`cartao.html?ledK=0&janelaK=0`, por exemplo); `?so=fundo` mostra só o
  fundo desfocado, `?so=cidade` só a cidade e `?noGrain=1` tira o grão
  (depuração e medidas).
- `loop.js`: a receita do loop de 5 s (abaixo).

## A cena

A parede é o plano z = 0 (a sala fica em z < 0, onde está a câmera). A câmera
fica ~15 cm acima do tampo do módulo e ~53 cm à frente dele, de 3/4 pela
frente-esquerda (F 1200; vê o tampo a ~16° de cima): dá para ler o tampo, a
parede da esquerda com as camadas e a frente com a janela de infravermelho. O
quadro sobe o módulo para 16–28% da altura (`shiftY` −225): no celular, o texto
do cartão do centro começa a ~29% e o véu dele, a ~24,5%; o LED (23,7%) e a
janela de infravermelho ficam acima do véu. O ar-condicionado fica acima do
módulo, cortado pelas laterais e pelo topo do quadro: entra a parte de baixo
dele (as duas fendas da aleta, o lábio e a curva de baixo), que é o que diz
"split".

| Camada | O que é |
|---|---|
| Cidade (direções, desfocada em 7 px) | A do hero e do Fleet (`buildCity`): o céu de hora azul do kit, as torres com janelas acesas e a cidade baixa, com bokeh esparso (7% das luzes, 15 px). A câmera da cidade é nivelada, com o horizonte a `cidadeY` = 300 px. Pela janela passam três torres de topo reto contra o céu (topos a ~150, ~210 e ~250 px), com o céu numa faixa de Y 37–46 sobre elas. O vidro escurece a rua 20% (`vidroK`). `janelaK` (padrão 1) escala o que se vê pelo vidro: com 0 a janela fica preta (a placa `J0` do loop). `cidadeDx` desloca a cidade de lado (não usado no loop) |
| Caixilhos | Alumínio anodizado escuro (84/92/104), no plano do vidro, com a travessa e o fio fraco (0,2) na aresta de baixo de cada folha. Vão **por baixo** do passe da parede, que é transparente só no vidro: a quina da parede esconde o caixilho da esquerda |
| Parede, vão e quadro (passe por pixel; desfocados em 3,2 px com os caixilhos e as sombras) | O reboco (albedo 72/80/94, navy na hora azul) com a poça da chave em volta do módulo, a sombra mole do ar logo abaixo dele (`sombraAr` 0,62, numa rampa de 26 a 4 cm abaixo da base do ar) e a oclusão do ambiente sob a prateleira (0,45 colada à chapa, some em 12 cm). À direita do ar, o vão da janela (o vidro 11 cm para dentro, as faces do vão com a luz do kit). Embaixo, o canto de cima do quadro (aresta de cima a 192 cm, quina a 42,5% × 50,6% do quadro): lousa fosca (albedo 26/34/42) com o giz apagado em quatro passadas de apagador (`passadas`: arcos do braço de 16–23 cm, com flecha de 35–40% do meio comprimento, as pontas caindo, bordas moles, os fios do feltro ao longo e mais pó na borda de cima; `giz` 20), e a moldura de alumínio anodizado escuro (84/90/100) |
| Sombras na parede | A projeção da prateleira e do módulo pela chave (`sombraPrat` 0,55, desfocada) |
| Fios do fundo (depois do desfoque) | A aresta de cima da moldura do quadro pega a chave num fio de 1,5 px (`fioQuadro` 0,11), mais forte perto da poça do módulo, e um degrau escuro de 1 px (`degrauQuadro` 0,6) separa a moldura da lousa (sem ele, a moldura de 2,4 cm não se lia como faixa) |
| Ar-condicionado | Split de parede genérico, 90 × 29 × 20 cm, com a base 7 cm acima do tampo do módulo. Cinza-claro frio (albedo 192/198/208; a aleta 184/190/200 e o fundo do chassi 164/170/180) com `arAmb` 0,5 e `arLk` 0,4. A luz cresce para baixo: o **rebatido da poça** (`arRebate` 0,24: a chapa, o módulo e a parede acesos pela chave devolvem luz para as faces que olham para baixo, cor da chave × albedo × 0,24 × (−n<sub>y</sub>), com a máscara da poça ao longo do comprimento, a mesma de `prepLuz`) e uma máscara vertical no corpo (× `arTopo` 0,66 no topo do quadro, × 1 na silhueta). A aleta fechada é estreita (h 1,3–2,95 cm), para as duas fendas entrarem no quadro: a de cima a h 3,0 (preto 0,55) com um fio fraco logo abaixo, a de baixo a h 1,3 (preto 0,45) com o lábio, que pega um fio de luz (0,16). A ponta direita arredondada escurece para dentro da curva e tem a aresta em contraluz contra o céu da janela (`arPonta` 0,45, ≥ 2 px, misto de navy-300 e navy-200). Escurece para a esquerda, fora da poça (`arEsq` 0,5). Desfocado em 1,2 px (`arBlur`): a frente dele fica mais perto da câmera que o módulo. Sem display e sem luz de status |
| Prateleira | Chapa escura (albedo 34/39/48) de 16 × 15,5 cm presa na parede, com a aresta da frente clara. A faixa de trás do tampo fica na sombra do ar (a mesma de `sombraTampo`, abaixo); o canto entre o tampo e a parede escurece (0,3, some em 3 cm) e um vinco de contato (2,5 px, preto 0,5, desfoque de 1 px) corre pela aresta de trás. Embaixo dela, a oclusão e a sombra da chave escurecem o reboco |
| Sombra do módulo | A projeção da chave na chapa (`sombraChave` 0,35, desfoque de k·0,5) e o contato sob o rodapé recuado (`contato` 0,85, desfoque de k·0,03 ≈ 0,7 px): a fresta da base flutuante é uma linha fina e firme, não um halo |
| Módulo | 10 × 10 × 3 cm, cantos de raio 2 cm (20% do lado), tampo plano, girado 28° para a janela de infravermelho olhar para a ponta direita do ar (onde fica o receptor). PLA cinza-ardósia fosco (albedo 62/68/78). O rodapé é recuado 1,2 cm e tem 0,42 cm (a "base flutuante"). **As paredes e o rodapé são por pixel**: o raio da câmera contra o prisma de cantos redondos, nas coordenadas do módulo, com 4 × 4 amostras por pixel; cada amostra tem a normal exata do contorno (o canto degrada sem degrau) e é mais clara em cima (oclusão perto da base); a frente sobe 7 de valor (`face`). As 22 linhas de camada (~2,5 px de passo no 800) são uma função da altura: o sulco escuro (`sulco` 0,3) e, logo acima, a crista que pega a luz de cima (`crista` 0,45); as amostras fazem o filtro, sem moiré. **O tampo é por pixel**: o degradê da frente (a chave) para o fundo (a contraluz da janela), com a parte da chave apagada pela sombra do ar ao longo da profundidade (`sombraTampo` [0,58, −6,5, 2,2], abaixo). No tampo, o hexágono da Strukti em baixo-relevo (o fundo 5% mais escuro, um fio claro na parede de dentro do lado de trás e o vinco escuro de 0,4 na aresta da frente), um fio claro na aresta da esquerda e a contraluz fria na aresta de trás. O filete elétrico-400 corre pelo contorno de cima da frente, de canto a canto, num traço só (como na caixa do Replay). Na frente, a janela de infravermelho (5 × 1,05 cm) de acrílico fumê: escura, com o brilho de cima e um reflexo inclinado fraco |
| LED | Um ponto ciano atrás do acrílico, no terço esquerdo da janela (`ledK` 1): o núcleo, o brilho em volta e um véu largo fraco; joga um pouco de ciano na prateleira à frente. É o único ponto ciano forte do quadro |
| Acabamento (kit) | Bloom leve (0,18), vinheta elíptica até o navy (`vig` 0,95, raios 0,18–0,64, centro em 54% × 24%, que segue o módulo), esmaecimento da metade de baixo e o grão estático do hero (amplitude 5; 6,5 abaixo de 60% da altura, `grainBaixo`) |

### A luz

A do kit: ambiente de hora azul, a luz do céu pela janela (atrás e à direita do
módulo, `ceuDir`) e a chave, a luz do corredor pela porta, alta, atrás e à
esquerda da câmera (−95, 430, −205), neutra com 15% do abajur do hero. A chave
acende uma poça em volta do módulo que some depressa para cima (o corpo do ar
fica quase fora dela) e para baixo (o quadro fica escuro).

O ar tem 20 cm de fundo e fica 7 cm acima do tampo: o raio que vai do meio e do
fundo do tampo até a chave passa por dentro do canto de baixo dele. `folgaAr(p)`
mede, no corte do aparelho, a folga (em cm) entre esse raio e o canto de baixo
(raio 7 cm), e `sombraArChave` dá o fator da chave: 1 com folga de 2,2 cm ou
mais, o piso 0,58 com o raio 6,5 cm por dentro do canto (a chave é larga: a
penumbra é mole). Ele apaga a chave no tampo do módulo (frente 84, meio 75,
fundo 66) e na faixa de trás da chapa. Sem essa sombra o tampo era liso e o mais
claro do quadro (Y 85), e puxava o PLA ardósia para alumínio prateado (um Mac
mini ou uma Apple TV no 480).

O tampo do módulo (mediana Y 74) é o meio-tom mais claro e mais nítido do
quadro; o corpo do ar fica em 0,71 dele, com a luz crescendo para o lábio e a
curva de baixo, e a parede entre os dois, na sombra do ar, em ~15.

### Tentado e tirado

- Um fio de luz ciano pela fresta do rodapé (a PCB lá dentro). Com 0,5 de alfa
  ele já lia como luz de baixo de aparelho gamer e competia com o LED.
- O raster da última camada a 45° no tampo: não aparecia em nenhum tamanho
  (teste do espelho da MASTER §10).
- Mãos-francesas sob a prateleira (rodada 2): com a câmera acima da chapa, a
  parede logo abaixo dela fica escondida até ~7 cm, e um suporte de 6–8 cm
  mostraria só a ponta. A oclusão, a sombra e o vinco de contato já dizem
  "presa na parede".
- A receita do ar da crítica de série ao pé da letra (`arRebate` 0,35, máscara
  de 0,85 no topo, `arPonta` 0,6). Com o `arAmb` 0,65 e o `arLk` 0,7 da
  rodada 2, o ar ia a mediana Y 76 (1,03 × o tampo) e as linhas de 0–10 a 70;
  mesmo com o `arAmb` 0,5 e o `arLk` 0,4, ficava em 67 (0,89 × o tampo) e 57.
  Ficou `arRebate` 0,24, `arTopo` 0,66 e `arPonta` 0,45, que batem os alvos
  dela (mediana 50–54, ≤ 0,72 × o tampo, linhas de 0–10 ≤ 44, ponta ≥ 60).
- A aleta em h 0,8–2,9 (a da crítica): ficou em 1,3–2,95, com a fenda de baixo
  onde estava (h 1,3) e a de cima em h 3,0, como pedido.
- A quina do quadro em `x1` ≈ 1 cm (crítica): ela caía a ~396 px, na vertical
  do LED (387 px). Ficou em −2,5 cm: a quina a 340 px, 47 px à esquerda do LED
  e ~170 px do batente da janela (512 px na altura da quina). Na v2, a 8 cm,
  ela corria a 8–15 px do batente e a metade esquerda lia como a porta de um
  armário.

Sem carteiras: com o ar visível logo acima do módulo e o tampo legível, a última
linha do quadro vê a parede entre ~1,2 e ~1,5 m de altura; as carteiras ficariam
abaixo dela. A sala de aula fica contada pelo quadro com o giz apagado, pela
janela e pelo ar desligado.

## Fazer

Rode de dentro desta pasta. Um Edge por vez; nada de dev server.

```sh
cd scripts/catalogo-arte/air-central
../kit/shot.sh cartao.html cur/cartao.png 800 1200   # ~3 s
node ../kit/sondas.js . cur/cartao.png               # sai com 1 se alguma sonda reprovar
../kit/stills.sh cur/cartao.png final 11 2 5 2        # cartao(.avif/.jpg) e cartao-480(.avif/.jpg) em final/
```

O AVIF do 800 vai em crf 11 (como o hero e o Replay): o desvio de alta
frequência (Y menos a média 5 × 5) fica em 1,14 na faixa de 40–50% da altura e
2,03 em 80–95% (o PNG tem 2,07 e 2,67). O 480 vai em crf 5, como o Fleet e os
inventados: a cena é quase toda lisa e escura, e no crf 11 o 480 cai para
3 781 bytes, com o grão sumido (0,24 e 0,16 contra 1,12 e 1,43 no PNG reduzido;
risco de faixas). No crf 5 fica em 0,77 e 1,17.

O render é determinístico: três renders seguidos deram o mesmo PNG (md5
`df939330c45d7afa7822ee000180db35`). O loop usa isso: o quadro 0 dele é este
cartão.

`cur/`, `plates/`, `final/` e `qa/` ficam fora do git (`.gitignore`). Instalar
é copiar `final/cartao*` (os stills e o loop) para `public/catalogo/air-central/`.

## Medidas (05/11/2026, versão final)

Rodada final, depois da crítica de série: o ar passou a ler como split (o
rebatido da poça, a luz crescendo para o lábio, a aleta estreita com as duas
fendas no quadro e a ponta em contraluz); a sombra do ar na chave escureceu o
fundo do tampo, a faixa de trás da chapa e a parede entre os dois (o tampo
deixou de ler como alumínio); o quadro ganhou a quarta passada, as flechas de
35–40% e o degrau escuro da moldura, e a quina se afastou do batente; a sonda
da base do ar passou a medir a silhueta real (o canto de raio 7 cm).

| Sonda | Medida | Critério |
|---|---|---|
| Módulo no quadro (x0 x1 y0 y1) | 24,8 59,0 15,9 28,0 (%) | y0 ≥ 15,5; y1 ≤ 28,5 |
| LED | 48,4% × 23,7% | ≤ 24% (acima do véu do texto no celular, que começa a ~24,5%) |
| Ar-condicionado | silhueta de baixo sobre o módulo a 7,3%; ponta direita a 72,9% × 5,6% | ~4–16% |
| Quina do quadro | 42,5% × 50,6% (o LED a 48,4%; o batente da janela a 64% na altura dela) | fora da vertical do LED e do batente |
| Metade de baixo, p50 / p90 / p99 (Y) | 12,4 / 20,4 / 27,5 | p90 ≤ 60 |
| Cantos 5% (Y) | 19,1 / 23,8 / 10,3 / 10,5 | ≤ 25,5 (navy-900); sup-esq ≤ 22 |
| Y médio por faixa de 10% | 35 28 32 20 22 18 14 12 10 10 | — |
| Corpo do ar (mediana de Y em x 250–560, y 15–85, dentro da silhueta) | 52,6 | 50–54 |
| Ar × tampo do módulo (medianas) | 52,6 × 74,4 (0,71; o tampo é 1,42 × o ar) | ≤ 0,72 (≥ 1,35) |
| Ar, linhas de 0–10 (mediana) | 41,5 | ≤ 44 |
| Ar, perfil em x 300 / x 450 (média de 9 px) | fenda de cima a y ~28 / ~24 (Y 28); lábio a y 63–66 / 57–60 (Y 58–66 / 64–70), a faixa mais clara; fenda de baixo a y ~72 / ~66 (Y 37–38); curva de baixo 56–63 | o lábio é a faixa mais clara (58–64) |
| Ponta direita do ar (máximo da aresta, y 20–80) | Y 61–74, contra o céu a 34 | ≥ 60 |
| Tampo do módulo (frente / meio / fundo; mediana) | 84,0 / 75,1 / 65,9; 74,4 | 84–86 / ~76 / 64–68; 74–78 |
| Parede entre o ar e a prateleira (x 200–520, y 100–215, fora do módulo, do ar e da chapa) | mediana 15,5 | ≤ 20 |
| Miniatura 64 × 96 (Y por linha, x 16–45) | o ar nas linhas 0–6 (41–55), 7 linhas escuras (20–21) e o tampo (58–65) | ≥ 3 linhas com Y ≤ 25 entre o ar e o tampo |
| Parede sob a prateleira × ao lado (60 px abaixo da aresta da frente) | 14,9 × 24,4 (0,61) | ≤ 0,7 |
| Coluna sob a quina direita da prateleira × vizinhas (±20 px) | 24,3 × 24,3/23,9 (y 380–600); 19,0 × 18,8/18,3 (600–800); 13,5 × 13,5/13,3 (800–1000) | ≤ vizinhas + 3 |
| Moldura de cima do quadro (perfil em x −8 cm, sem grão) | parede 26, fio 32 (1 px), moldura 17–18, degrau 11 (1 px), lousa 11–13 | degrau ≤ ~10 |
| Passadas do giz (sem grão) | +5 a +15 de Y sobre a lousa (11 → 16–26) | lê como giz apagado, não como escrita |
| Fresta do rodapé (perfil vertical em x 250 e x 300, sem grão) | Y 4–6 por 5–6 px e depois 32–39 | ≤ 8 por 4–6 px, depois ≥ 24 |

| Arquivo | Bytes | Orçamento (§6.1) |
|---|---|---|
| `cartao.avif` (crf 11) | 64 058 | 120 000 |
| `cartao.jpg` (q 2) | 75 482 | 200 000 |
| `cartao-480.avif` (crf 5) | 27 650 | 45 000 |
| `cartao-480.jpg` (q 2) | 13 201 | 70 000 |
| `cartao-loop.mp4` (H.264 crf 18) | 227 410 | 600 000 |
| `cartao-loop.webm` (VP9 crf 12) | 161 428 | 600 000 |

Contraste do texto do cartão do centro com a arte instalada
(`node scripts/catalogo-arte/medir-contraste.mjs`, 11 itens): pior razão
10,17:1 a 1440 × 900, 7,54:1 a 390 × 844 e 6,97:1 a 360 × 740 (em outros
itens). No Air Central: 12,02:1, 10,08:1 e 7,82:1 (a etiqueta, nos três).

Texto no celular: numa simulação do cartão de 235 × 352 com o véu do
`.catalogo__info` (16 px de esmaecimento até 0,8), o texto começando a 29%
deixa o tampo, a janela de infravermelho e o LED fora do véu; começando a 25%,
o véu já cobre metade da janela e o LED. Medido no navegador (05/11/2026, topo
do `.catalogo__info` em fração da altura do cartão do centro): "Hardware" e
"Em desenvolvimento" não cabem na mesma linha, e os selos ocupam 3 linhas
(88 px). Com a frase de 103 caracteres (4 linhas), o texto começava a 24,1% a
390 × 844, em cima do LED (23,7%). A frase passou a 90 caracteres
("o ar de cada sala", 3 linhas a 390): 29,4% a 390 × 844, com o módulo e o LED
à vista. A 360 × 740 (cartão de 224 px) a frase continua em 4 linhas e o texto
começa a 17,0%, como no Replay (16,9%): ali só o tampo aparece. Encurtar até
3 linhas a 360 (≤ ~84 caracteres) levaria o texto a 22,6%, ainda sobre o LED,
então ficou assim.

No painel, a arte grande vai num quadro 16:9, que mostra só ~37% da altura do
retrato: com o corte do centro (31–69%), o módulo (16–28%) sumia. O item tem
`arte.posicaoPainel: "50% 6%"` (o corte vai de ~4% a ~41%: o ar, o módulo e a
prateleira).

Leitura a 64 px: o módulo é o único herói claro da série, uma caixa baixa de
cantos redondos com um ponto ciano no terço de cima, sobre a chapa escura, sob a
barra do ar (o lábio claro e as fendas) e separado dela por uma faixa escura.

## Loop de 5 s

O LED do módulo respira (o pulso principal, como o do Replay) e um véu lento de
luz passa pelo céu da janela; o resto fica parado. Nada de feixe de
infravermelho nem de ar saindo do aparelho (ele está desligado). Passes e
composição periódica, como no Replay (`loop.js` desta pasta, composto pelo
`../kit/loop.js`):

| Placa | Como | O que dá |
|---|---|---|
| `cur/cartao.png` | o cartão | o quadro 0 |
| `plates/L0.png` | `cartao.html?ledK=0` | E = cartão − L0: o LED (o núcleo, os brilhos, o ciano na prateleira e o bloom dele); 17 760 px |
| `plates/J0.png` | `cartao.html?janelaK=0` | N = cartão − J0: o que se vê pelo vidro (o céu, as torres, a cidade baixa e o bokeh), já com o desfoque, a vinheta e o bloom do cartão; 339 124 px |

quadro(t) = cartão − 0,45 · sobe(t) · E + véu(x, y, t) · N, com
sobe(t) = ½ − ½ cos(2πt / 5 s) (o LED cai para 55% do cartão no meio da volta
e volta) e véu = 0,1 · p(y) · [sen(2πt / 5 s − f) + sen f], f a fase de uma
onda de 1100 px inclinada 12° (uma faixa de luz que nasce, anda meia onda para
a direita e um pouco para cima e some) e p(y) o peso da altura (1 no céu, acima
de ~250 px, caindo para 0,5 na cidade baixa, a 650 px). Os dois valem 0 em
t = 0: o quadro 0 é o cartão byte a byte (o `../kit/loop.js` confere).
`janelaK` e `ledK` valem 1 por padrão: o cartão não muda. O grão está só no
cartão; os deltas são diferenças de
passes com o mesmo grão (não há grão temporal).

A cidade não anda de lado (`cidadeDx`): a janela é estreita (~35% da largura) e
a cidade já está a 7 px de desfoque, então a deriva precisaria de 8–10 px para
ser vista e arriscava mostrar a borda do recorte da cidade. O véu foi testado a
±6% (a = 0,06): a janela mudava no máximo 3,5 de Y (p99), abaixo do grão de
amplitude 5, e o movimento sumia. Com a = 0,1 ela muda de −4,6 a +5,7 (p1 e
p99 nos quadros 31, 62 e 93), contra −90 no núcleo do LED no meio da volta: o
LED segue como o pulso principal.

```sh
../kit/shot.sh "cartao.html?ledK=0" plates/L0.png 800 1200
../kit/shot.sh "cartao.html?janelaK=0" plates/J0.png 800 1200
node ../kit/loop.js loop.js                       # plates/master.mkv (ffv1, 800 x 1200, 125 quadros)
../kit/encode.sh plates/master.mkv final 18 12    # cartao-loop.mp4 (crf 18) e .webm (crf 12), 600 x 900
../kit/vqa.sh final/cartao-loop.webm air-central-webm 360:540:240:0 cur/cartao.png
../kit/vqa.sh final/cartao-loop.mp4 air-central-mp4 360:540:240:0 cur/cartao.png
```

O recorte do `vqa.sh` (360 × 540 a partir de x 240, no 600 × 900) cobre o LED e
a janela.

| Medida (05/11/2026) | MP4 (H.264 crf 18) | WebM (VP9 crf 12) | Critério |
|---|---|---|---|
| Bytes | 227 410 | 161 428 | ≤ 600 000 |
| Emenda 124 → 0 | 55,23 dB | 89,29 dB | ≥ 45 dB |
| Pior passo (inteiro / recorte) | 61,94 / 59,34 dB | 62,66 / 58,34 dB | — |
| Pares seguidos idênticos (recorte) | 0 | 11 (8,9%) | — |
| Quadro 0 × cartão (600 × 900) | 43,77 dB | 43,96 dB | a perda é só a da compressão |

O loop toca uma vez e, no fim (ou aos 5 s), volta ao quadro 0, que é o cartão:
a emenda acima é o passo de parar, sem salto. Os pares idênticos do WebM são
quadros que o VP9 repetiu onde o passo é de frações de Y (o véu) ou de ~2 de Y
no núcleo do LED; não há salto (o pior passo no recorte é 58 dB). O crf 10 deu
15 pares e o crf 8, 7: ficou o 12 dos outros reais.
