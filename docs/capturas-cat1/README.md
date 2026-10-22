# Capturas da QA visual do catálogo (CAT1)

Task 12, passo 2 do plano do catálogo (spec `docs/superpowers/specs/2026-10-16-catalogo-produtos-design.md`, §13 passo 3). Branch `feat/catalogo-produtos`, código em `e0961de`, arte ainda provisória (`public/catalogo/LEIA-PROVISORIO.txt`).

**Como foram feitas:** Edge headless via CDP (as funções de `scripts/check-browser.mjs`), contra o `next dev` em `http://localhost:3000`. JPEG com qualidade 80. A 360 e a 390, celular emulado com densidade 2 (imagens de 720 e 780 px de largura). A partir de 768, densidade 1. A janela fica rolada para mostrar o `.catalogo__corpo` inteiro (a caixa de altura constante, §4) logo abaixo da barra fixa. Por isso o título "Produtos" aparece cortado ou sob a barra: é a posição da rolagem, não um defeito. O indicador do Next em dev foi escondido.

**Janelas:** 360×740, 390×844, 768×1024, 1024×768 e 1440×900.

**Movimento:** cada situação existe em duas versões, `-movimento` (sem preferência) e `-reduzido` (`prefers-reduced-motion: reduce`).

## Arquivos

Para cada largura `L` em 360, 390, 768, 1024 e 1440, e para cada sufixo `-movimento` e `-reduzido`:

| Arquivo | O que mostra |
|---|---|
| `L-fechado-*.jpg` | Coverflow fechado, com o Replay no centro, logo depois de carregar (já passou a entrada em sequência). |
| `L-troca-fechado-*.jpg` | ~300 ms depois do clique em › do coverflow (o Rota de Vendas indo para o centro). Com movimento reduzido, a troca já terminou. |
| `L-aberto-replay-*.jpg` | Painel aberto do Replay (item real), aba Visão geral, com a fita embaixo. |
| `L-troca-aberto-*.jpg` | ~300 ms depois do › do painel (do Replay para o Rota de Vendas). |
| `L-aberto-inventado-*.jpg` | Painel aberto do Placar conectado para quadras (item inventado, `ficticio`), escolhido pela 4ª miniatura da fita. |

Barra do topo com o "Produtos ▾" aberto, com o catálogo atrás:

| Arquivo | O que mostra |
|---|---|
| `1440-barra-menu-produtos-movimento.jpg` / `-reduzido.jpg` | Barra larga (cápsula) com o popover agrupado por tipo. |
| `1024-barra-menu-produtos-movimento.jpg` / `-reduzido.jpg` | Painel do Menu aberto, com a sublista "Produtos" expandida. |

São 54 capturas no total. Em todas, a altura do `.catalogo__corpo` e o topo da seção seguinte ficaram iguais nos estados fechado, aberto e trocando. Não houve rolagem horizontal nem erro no console.
