# Cartão do Fleet Analytics BI

A arte do cartão do Fleet Analytics BI em Produtos (spec 2026-10-16, §6.2): o
painel de BI num monitor, na mesa do escritório escuro do hero "Fim de
expediente", com a janela para a cidade de hora azul. É o mesmo mundo do hero:
a mesa de laminado, a janela com montantes, a cidade (o `buildCity` e o
`cityLayer` de `scripts/hero-expansao/scene.js`, copiados), o abajur fora do
quadro e a caneca. A tela não tem texto: o mapa da frota, três indicadores em
anel, a curva de velocidade e as barras de indicadores. Nenhuma placa, cidade,
empresa ou cliente real.

- `cena.js`: o mundo (em cm) e o render, sobre o kit (`../kit/cena.js`).
- `cartao.html`: a câmera retrato 800 × 1200. Aceita mudanças pela consulta
  (`cartao.html?caneca=0&halo=0`, por exemplo); `?so=cidade` mostra só a
  cidade desfocada e `?so=tela` só a textura da tela (depuração).

## A cena

O tampo da mesa é o plano y = 0; a parede da janela fica em z = 64 e o vidro em
z = 71, como no hero. O monitor fica em x = −2, z = 40. A câmera fica de pé,
um pouco atrás da cadeira: 42 cm acima da mesa, 135 cm à frente do monitor
(F 1150), com o centro do quadro deslocado para o monitor cair entre ~17% e
~52% da altura.

| Camada | O que é |
|---|---|
| Cidade (direções, desfocada em 7 px) | A do hero (`buildCity`): o céu de hora azul do kit, a linha baixa de prédios ao longe, a cidade baixa em fileiras de luzes e as torres com janelas acesas nas cores do hero (navy-300, elétrico-300, navy-100). Torres à esquerda (sai pelo topo) e à direita (13°, cobre o canto de cima), duas médias que aparecem acima do monitor e um prédio baixo escuro atrás dele; bokeh esparso (3,5% das luzes, 16 px), só sobre as torres e a cidade, nenhum disco solto no céu; 3% de névoa no vidro |
| Mesa e parede (passe por pixel) | O laminado do hero (albedo 54/52/49, veio de carvalho de 3–5%, reflexo acetinado do abajur); a janela fica transparente por cima da cidade |
| Janela | Os montantes do hero (x ±42–45 cm: na imagem a 13% e 87% da largura, um de cada lado do monitor), com a aresta clara e a face interna; o trilho de baixo com o fio aceso e o peitoril que pega o céu |
| Reflexos na mesa | A cidade espelhada junto da janela (`refl` 0,12, como o hero) e a tela espelhada no plano da mesa, desfocada 7 px, a 10% (`reflexoTela`), sumindo para perto da câmera |
| Halo | Um halo elétrico largo e fraco atrás do monitor (`halo` 0,05) |
| Sombras | Do abajur (para trás e à direita), a sombra mole da janela para quem olha (a luz vem de trás) e o contato da base |
| Pé | Base de cantos redondos (25 × 17 × 0,9 cm) com a borda da frente acesa pelo abajur e uma coluna de 5 × 2,4 cm atrás do centro do painel, com o fio de luz na aresta esquerda |
| Monitor | Painel de 62 × 36 cm (27"), 1,6 cm de espessura, virado 18° para a cadeira, fora do quadro à esquerda; borda fina (0,75 cm) e queixo de 1,7 cm; corpo de alumínio escuro, a lateral direita (a mais perto) clara em cima; filete claro no contorno e a aresta de cima em contraluz (o céu atrás); brilho de vidro do hero |
| Tela | Uma textura de 1210 × 671 px (20 px/cm), reduzida à metade com suavização e mapeada em perspectiva em 140 faixas verticais afins. Barra de cima e barra lateral com ícones quadrados (nenhuma letra); o mapa da frota (as quadras giradas do celular do hero, a avenida na diagonal, 14 veículos: parados em elétrico, em movimento em ciano), o rastro do selecionado em ângulos retos do elétrico ao ciano, com o anel e o cartão (selo e barra, como o de concluído do hero); à direita três anéis de indicador, a curva de velocidade com a linha do limite e as barras de indicadores (uma em ciano). O fundo da tela vai 45% para o navy-800 (`telaFundo`), para a tela ler como acesa a 64 px |
| Caneca | A do hero (navy-700 fosca), no fundo da mesa à esquerda, contra a janela (`caneca` 0 tira) |
| Acabamento (kit) | Bloom leve, vinheta elíptica até o navy (0,85, raios 0,2–0,7), esmaecimento da metade de baixo e o grão estático do hero (amplitude 5; 6,5 abaixo de 60% da altura, `grainBaixo`) |

A luz é a do kit: ambiente de hora azul, a luz da janela (de trás, como no
hero), a tela acesa (uma luz elétrica, só para a frente do painel, `telaLuz`) e
o abajur do hero fora do quadro, alto à esquerda, neutro-quente, numa poça em
volta do pé e da caneca, cortada antes de chegar perto da câmera (como o
`cutZ` do hero): a metade de baixo fica escura.

`pulso` (0 a 1) é a fase dos dados na tela (o anel do selecionado, a ponta da
curva de velocidade e a barra em ciano); 0 é o cartão. É o que o loop de 5 s
da A5 anima.

## Fazer

Rode de dentro desta pasta. Um Edge por vez; nada de dev server.

```sh
cd scripts/catalogo-arte/fleet-analytics-bi
../kit/shot.sh cartao.html cur/cartao.png 800 1200   # ~4 s
node ../kit/sondas.js . cur/cartao.png               # sai com 1 se alguma sonda reprovar
../kit/stills.sh cur/cartao.png final 10 2 6 2        # cartao(.avif/.jpg) e cartao-480(.avif/.jpg) em final/
```

O AVIF vai em crf 10 (800) e 6 (480), como o Rota de Vendas: o céu e a mesa
são lisos, e no crf 11 o grão do 480 sumia na metade escura (desvio de alta
frequência de 1,08 no PNG reduzido para 0,05; risco de faixas). No crf 10/6
fica em 1,24 (topo do 800) e 0,73 (baixo do 480), dentro do orçamento.

`cur/` e `final/` ficam fora do git (`.gitignore`). A instalação em
`public/catalogo/fleet-analytics-bi/` é a Task A7 do plano da arte
(`docs/superpowers/plans/2026-10-22-catalogo-arte.md`); o loop de 5 s (os
dados pulsando na tela), a A5.

## Medidas (22/10/2026, rodada 4)

| Sonda | Medida | Critério |
|---|---|---|
| Monitor com o pé (x0 x1 y0 y1) | 18,0 81,9 17,1 51,7 (%) | entre 15% e 60% da altura |
| Metade de baixo, p50 / p90 / p99 (Y) | 16,2 / 34,4 / 57,2 | p90 ≤ 60 (≤ 40, como pediu a crítica do Rota) |
| Cantos 5% (Y) | 17,2 / 17,2 / 10,8 / 10,8 | ≤ 25,5 (navy-900) |
| Y médio por faixa de 10% | 31 30 35 36 29 35 22 15 13 11 | — |
| Miniatura 64 × 96 (área): ponto mais claro da metade de cima fora da tela / da tela | 67 / 105 (63%) | ≤ 85% |

| Arquivo | Bytes | Orçamento (§6.1) |
|---|---|---|
| `cartao.avif` (crf 10) | 98 189 | 120 000 |
| `cartao.jpg` (q 2) | 101 480 | 200 000 |
| `cartao-480.avif` (crf 6) | 27 560 | 45 000 |
| `cartao-480.jpg` (q 2) | 27 115 | 70 000 |

O render é determinístico (o mesmo PNG a cada vez), o que o loop da A5 usa: o
quadro 0 dele é este cartão.
