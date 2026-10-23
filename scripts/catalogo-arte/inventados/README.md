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
| `totem-check-in` | hardware (ciano) | Totem de balcão na mesa: base, coluna e a cabeça inclinada 13°; a tela com o check-in confirmado (anel elétrico → ciano com o visto, cartão do aluno) e, embaixo, o leitor com o anel de LED ciano |
| `contador-de-fluxo` | hardware (ciano) | Porta de vidro de duas folhas na parede, com a cidade atrás; o sensor (34 × 8 × 10 cm) sobre a travessa, com as duas lentes e o LED ciano, o leque de detecção que some antes de ~52% da altura e a linha de contagem tracejada no piso; uma luz de teto lava a parede acima da porta |
| `agenda-de-quadras` | aplicativo (elétrico) | Celular no suporte de mesa: dias, quadras (ícone de quadra) e a grade de horários (reservados, livres tracejados, os meus em elétrico, o escolhido em ciano) e o botão de reservar |
| `estoque-oficinas` | aplicativo (elétrico) | Celular encostado numa caixa de papelão fechada (fita e etiqueta lisas): busca, resumo com barra e anel, a lista de peças (porca sextavada) com o nível de cada uma (o baixo em ciano) e o botão de adicionar |
| `site-clinicas` | site (violeta `#8b7ff0` só no detalhe) | Notebook aberto 20° na mesa, com a caneca do hero atrás: navegador com a página clara esmaecida; marca, botão de agendar, a cruz e o ícone do cartão em violeta |
| `vitrine-lojas` | site (violeta só no detalhe) | Tablet em paisagem num suporte, com uma sacola de papel com alças atrás: navegador com a faixa de ofertas e a vitrine de 4 produtos; marca, botões e o selo do carrinho em violeta |

O ambiente é o das cenas dos reais: a mesa de laminado do hero sob a janela com
montantes (os montantes mudam de lugar por slug, para cair fora do objeto), a
cidade de hora azul desfocada, o abajur neutro-quente fora do quadro à esquerda
(sombra projetada, sombra mole da janela e contato), a luz da tela acesa e o
acabamento do kit (bloom 0,2, vinheta 0,85 com raios 0,2–0,7, esmaecimento de
baixo, grão 5 e 6,5 abaixo de 60%). A porta do contador é a única cena sem a
mesa: o mesmo céu e cidade atrás do vidro, piso de placas e a luz de teto no
lugar do abajur. As páginas dos sites são claras para ler "site" na miniatura,
mas esmaecidas (`telaBrilho`: 26% de navy-950 por cima) para não virar o ponto
mais claro do quadro.

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

## Medidas (22/10/2026)

| Slug | Objeto (y0–y1 %) | Baixo p90 | Pior canto (Y) | avif | jpg | 480 avif | 480 jpg |
|---|---|---|---|---|---|---|---|
| placar-conectado | 19,5–44,2 | 25,0 | 18,8 | 92 805 | 93 388 | 34 479 | 23 187 |
| totem-check-in | 16,9–59,1 | 31,1 | 23,3 | 84 527 | 81 741 | 29 499 | 16 890 |
| contador-de-fluxo | 18,6–22,0 | 25,9 | 14,4 | 79 655 | 74 262 | 26 698 | 12 991 |
| agenda-de-quadras | 25,8–54,3 | 40,3 | 20,8 | 86 791 | 86 398 | 31 419 | 19 328 |
| estoque-oficinas | 28,1–58,6 | 34,6 | 18,5 | 85 677 | 85 694 | 30 707 | 19 106 |
| site-clinicas | 27,9–59,9 | 37,6 | 18,2 | 89 109 | 88 904 | 32 710 | 20 337 |
| vitrine-lojas | 28,9–54,9 | 36,5 | 18,3 | 88 955 | 88 713 | 33 661 | 20 234 |

Critérios: objeto entre 15% e 60%; p90 da metade de baixo ≤ 60 (0–255);
cantos ≤ 25,5 (navy-900); orçamento §6.1 (120 / 200 / 45 / 70 KB).
