# Cartões dos 7 inventados

A arte dos cartões dos itens inventados de Produtos (spec 2026-10-16, §6.2;
plano da arte, Task A4): **uma cena-modelo parametrizada por slug**, mais simples
que as dos reais, com o mesmo ambiente do "Fim de expediente" e uma silhueta do
objeto de cada item. Só imagem parada (sem loop). Nada de texto: as telas são
blocos, barras e ícones. Os itens são inventados (`ficticio: true` em
`src/content/catalogo.ts`): nenhuma marca, cliente ou lugar real.

- `cena.js`: o ambiente, os 7 objetos e o render, sobre o kit (`../kit/cena.js`).
  Copiado e adaptado do Fleet: a cidade do hero (`buildCity`/`cityLayer`), o
  passe da mesa e da parede, o reflexo da cidade, o mapeamento da tela em faixas
  e a caneca.
- `cartao.html?slug=<slug>`: a câmera retrato 800 × 1200. Aceita mudanças pela
  consulta (`&ledK=0`, `&telaBrilho=0.8`, `&caneca=0`, `&so=tela`, `&so=cidade`).
- `render.sh [slug ...]`: fotografa os slugs (sem argumento, os 7) em
  `cur/<slug>.png`, um Edge por vez, e roda as sondas de cada um.

## Os 7

| Slug | Tipo (acento) | Objeto e ambiente |
|---|---|---|
| `placar-conectado` | hardware (ciano) | Placar suspenso por duas hastes diante da janela, girado 10°; dois painéis de LED com a matriz de pontos apagados e 3 × 4 pips (7 e 5 acesos, pontos e não algarismos), as faixas das equipes (elétrico e ciano), os dois pontos e a barra do tempo no meio |
| `totem-check-in` | hardware (ciano) | Totem de chão de pé diante do vidro (que desce até o piso): base, coluna de 90 cm (~2× a altura da tela) e a cabeça inclinada 13°; a tela com o cartão da reserva (avatar, nome, a barra do horário com o bloco elétrico, a quadra) e, embaixo, o leitor com o anel de LED ciano, o único ciano |
| `contador-de-fluxo` | hardware (ciano) | O sensor (34 × 8 × 10 cm) de perto, sobre a porta de vidro, com as duas lentes, o LED ciano e o leque de detecção que some em ~45% da altura; a cidade no vidro de cima; a porta some num degradê para o navy-950 de ~49% a ~62% (`escurecer`) |
| `agenda-de-quadras` | aplicativo (elétrico) | Celular no suporte de mesa com chanfro e sombra de contato: dias, quadras (ícone de quadra) e a grade de horários (reservados, livres tracejados, um meu em elétrico cheio e outro em contorno, o escolhido em ciano) e o botão de reservar em navy-600 com fio elétrico |
| `estoque-oficinas` | aplicativo (elétrico) | Celular encostado num gaveteiro de peças (metal navy, 3 × 2 gavetas de plástico escuro com puxador e etiqueta lisa), com sombra de contato e a sombra dele na frente do gaveteiro: busca, resumo com barra e anel, a lista de peças (porca sextavada) com o nível de cada uma (o baixo em ciano) e o botão de adicionar |
| `site-clinicas` | site (sem cor própria) | Notebook aberto 20° na mesa, com a caneca do hero atrás: navegador em tema escuro com a lista das especialidades (o marcador ativo é o único ciano), o mapa com o alfinete, o endereço e um único botão elétrico |
| `vitrine-lojas` | site (sem cor própria) | Tablet em paisagem num suporte, com uma sacola de papel menor, escura e desfocada atrás: navegador em tema escuro com um produto grande e três menores empilhados, só com fotos desfocadas (sem ícone de produto); o botão de comprar é o único elétrico e o selo do carrinho, o único ciano |

O ambiente é o das cenas dos reais: a mesa de laminado do hero sob a janela com
montantes (os montantes mudam de lugar por slug, para cair fora do objeto), a
cidade de hora azul desfocada, o abajur neutro-quente fora do quadro à esquerda
(sombra projetada, sombra mole da janela e contato), a luz da tela acesa e o
acabamento do kit (bloom 0,2, vinheta 0,85 com raios 0,2–0,7, esmaecimento de
baixo, grão 5 e 6,5 abaixo de 60%). A porta do contador é a única cena sem a
mesa: o mesmo céu e cidade atrás do vidro e a luz de teto no lugar do abajur. O
totem fica no piso, diante do vidro que desce até o chão, com o abajur de pé fora
do quadro. As páginas dos sites são escuras, como as telas dos apps (fundo navy,
blocos navy-700, o claro só em duas linhas finas). Os sites não têm cor de tipo:
a spec §6.2 fixa a paleta da marca (navy, elétrico e ciano só nos detalhes) e a
MASTER veta o roxo, então o violeta `8b7ff0` do plano saiu na rodada 1 de ajuste.
Eles se distinguem pela silhueta (notebook e tablet com o navegador).

## Fazer

Rode de dentro desta pasta. Um Edge por vez; nada de dev server.

```sh
cd scripts/catalogo-arte/inventados
./render.sh                                        # os 7 em cur/<slug>.png (~4 s cada) + sondas
SLUG=totem-check-in node ../kit/sondas.js . cur/totem-check-in.png   # as sondas de um slug
for s in placar-conectado totem-check-in contador-de-fluxo agenda-de-quadras estoque-oficinas site-clinicas vitrine-lojas; do
  ../kit/stills.sh cur/$s.png final/$s 10 2 5 2      # cartao(.avif/.jpg) e cartao-480(.avif/.jpg)
done
```

As sondas do kit leem o slug de `SLUG` (no Node, `cena.js` exporta a câmera e
os pontos do objeto desse slug). `cur/`, `final/` e `qa/` ficam fora do git. A
instalação em `public/catalogo/<slug>/` é a etapa de instalação/A7.

O render é determinístico (mesmo PNG a cada vez).

**crf:** 10 no 800 (como Rota e Fleet) e **5 no 480**: no crf 6 o 480 ficava com
grão de 0,33–0,40 no topo (desvio de alta frequência), contra 0,7 no Fleet; no
crf 5 fica em 0,49–0,70 e o maior 480 AVIF tem 34,5 KB (limite 45). No crf 4 o
contador já pulava para 42,5 KB.

## Medidas (22/10/2026, depois da rodada 1 de ajuste)

| Slug | Objeto (y0–y1 %) | Baixo p90 | Pior canto (Y) | avif | jpg | 480 avif | 480 jpg |
|---|---|---|---|---|---|---|---|
| placar-conectado | 19,5–44,2 | 24,9 | 18,8 | 93 464 | 95 160 | 34 982 | 23 787 |
| totem-check-in | 16,7–59,1 | 35,9 | 23,2 | 82 212 | 78 011 | 27 749 | 14 644 |
| contador-de-fluxo | 20,0–27,7 | 20,8 | 14,4 | 79 567 | 72 758 | 25 851 | 12 134 |
| agenda-de-quadras | 25,8–54,3 | 40,8 | 20,8 | 86 932 | 86 172 | 31 445 | 19 055 |
| estoque-oficinas | 28,1–58,6 | 36,0 | 18,5 | 86 825 | 87 195 | 31 568 | 20 264 |
| site-clinicas | 27,9–59,9 | 38,0 | 18,2 | 88 165 | 83 876 | 31 408 | 17 962 |
| vitrine-lojas | 28,9–54,9 | 37,0 | 18,3 | 86 717 | 82 461 | 31 310 | 16 829 |

Critérios: objeto entre 15% e 60%; p90 da metade de baixo ≤ 60 (0–255);
cantos ≤ 25,5 (navy-900); orçamento §6.1 (120 / 200 / 45 / 70 KB).
