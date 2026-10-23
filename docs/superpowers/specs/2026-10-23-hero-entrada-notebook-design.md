# Hero com entrada pelo notebook — spec

**Data:** 23/10/2026 · **Situação:** aprovada na conversa (entrevista Q1–Q27, 23/10).
**Branch:** `feat/hero-notebook`, criado a partir de `main` (7603554). O PR aponta para `homologacao`.
**Altera:** o hero "expansao" (ADR-010, MASTER §9.8). A ADR-010 ganha uma revisão (§10 desta spec); a exceção da rolagem presa continua a mesma, só mais longa.

---

## 1. Objetivo

O hero "expansao" continua (o quadro cresce e o título "Strukti" se abre), mas **termina entrando num notebook** que está na mesa da cena. A tela do notebook é a própria página: o bloco de chamada do hero, em HTML de verdade. Quando a aproximação cobre a janela, a pessoa já está "dentro" do site, sem troca nem emenda. Rolar de volta ao topo faz o caminho inverso.

A ideia é a da marca: você entra no nosso trabalho.

## 2. Decisões (da entrevista)

| # | Decisão |
|---|---|
| Q1 | O hero atual **continua**; a aproximação é a parte final dele, a transição para o resto da página. |
| Q2 | A tela do notebook mostra **a página de verdade** (HTML), em escala pequena. No fim, ela já é a página. |
| Q3 | O título "Strukti" (h1) fica **na sala**, sobre a cena, e sai na aproximação. |
| Q4 | Disparo pela **rolagem presa**, como hoje (roda suave, trackpad, toque, teclado). |
| Q5 | **2.5D de frente**: o aparelho fica de frente para a câmera; a aproximação é ampliação de camadas em velocidades diferentes. A cena **ocupa a tela inteira**, de ponta a ponta, sem moldura nem margens. |
| Q6 | Em pé, a câmera entra **no celular** da mesa; deitado, no notebook. |
| Q7 | **Reversível**: rolar para cima no topo sai do aparelho e volta à sala. |
| Q8 | Uma rolagem presa só: expansão → **pausa curta** com a sala inteira → aproximação. |
| Q9 | No fim da expansão, a cena cobre **100% da largura e da altura**; a cápsula da barra flutua por cima. |
| Q10 | Camadas: **fundo** (vídeo/imagem da sala, amplia devagar e desfoca) · **aparelho** em vetor (SVG/CSS, nítido em qualquer escala, amplia rápido) · **tela** (HTML). |
| Q11 | A tela mostra o **bloco de chamada** do hero (h2, frase, "Ver produtos" e WhatsApp). |
| Q13 | A tela tem **a proporção da janela** de quem vê, para cobrir sem corte. |
| Q14/Q17 | Mesa: **notebook no centro**, celular e caixa do Replay de um lado, caneca do outro, abajur na ponta. **Sai o caderno de papel.** Sem mouse nem teclado avulsos. |
| Q16 | Sem JS e com movimento reduzido: **cena parada** em tela cheia e o bloco de chamada logo abaixo, como seção normal (ADR-004). |
| Q18 | A tela solta um **brilho frio suave** na mesa e no teclado (desenhado no fundo, parado). |
| Q19 | Na pausa, as metades do título **param ao lado do notebook**; na aproximação, aceleram para fora (estão "mais perto" da câmera) e somem. |
| Q20 | Aproximação ≈ **70% do percurso da expansão**, mais a pausa de ≈ 15%. |
| Q21 | Até a entrada terminar, a tela **não responde ao ponteiro**. Tab até um botão dela **completa a entrada na hora**. |
| Q22 | Depois de entrar, o bloco de chamada é **uma tela cheia** (a altura da janela); a rolagem normal leva ao Catálogo. |
| Q23 | Em pé: o celular **de pé num suporte, na frente e no centro**, com o notebook atrás, desfocado e cortado. |
| Q24 | **Protótipo cinza primeiro** (mecânica completa com caixas no lugar da arte); a arte só depois de o dono aprovar a sensação. |
| Q25 | Texto pequeno tremendo durante o movimento: **decidir no protótipo**. Plano B combinado: imagem idêntica do bloco enquanto a tela é pequena, trocada pelo HTML a ~40% da escala final, numa troca de 150 ms (o HTML fica na página o tempo todo). |
| Q26 | Notebook ou celular **pela orientação** (`(orientation: portrait)`), a mesma regra do fundo do hero hoje. |
| Q27 | O loop da sala continua (**LED, vapor, cidade**); a tela fica parada (é a página). Sem cursor desenhado. |

## 3. Fases e progresso

Um progresso só, `P`, de 0 a 1, preso à rolagem (a mecânica atual do `ScrollExpandMedia`: alvo e desenhado da roda suave, trackpad e toque diretos, teclado com transição). As fases, em fração do percurso total:

| Fase | Faixa de `P` | O que acontece |
|---|---|---|
| Expansão | 0 → `E` | O de hoje: quadro de 300 × 400 até a tela inteira (100vw × 100svh, sem raio nem sombra no fim), o fundo de fora se apaga, as metades do título se abrem. |
| Pausa | `E` → `E + Pa` | Nada se move com a rolagem (o loop da sala segue). As metades do título estão paradas ao lado do notebook. |
| Aproximação | `E + Pa` → 1 | A câmera vai até a tela; ver §4. Em 1, a tela cobre a janela. |

Com o percurso da expansão hoje (roda × 0,0007, ≈ 1429 px de roda) valendo 1, a pausa vale ≈ 0,15 e a aproximação ≈ 0,7: `E ≈ 0,54`, `Pa ≈ 0,08`. O protótipo acerta os números com o dono.

- **Liberação da página:** só com o desenhado em `P = 1` (como hoje, só que no fim da aproximação).
- **Volta:** expandido, no topo (`scrollY ≤ 5`), roda para cima ou arrasto para baixo recolhe, e o progresso volta pelo mesmo caminho (aproximação ao contrário, pausa, expansão ao contrário).
- **Âncora fora do hero** (`#produtos`, `#contato`…): começa já "dentro" (`P = 1`), como o `hashTargetOutside` de hoje.
- **Pinça, página ampliada, menu aberto, roda só de lado, Ctrl + roda:** continuam com o navegador, como hoje.
- **Conteúdo do hero:** hoje aparece em `p = 1` e some abaixo de 0,75; agora ele é a tela do aparelho e está sempre lá (ver §5).

## 4. A aproximação (camadas 2.5D)

A câmera não gira: ela anda reto até o centro da tela do aparelho. Cada camada amplia a partir do **centro da tela do aparelho** (o ponto de fuga), com sua própria curva:

| Camada | Escala no fim | Outros efeitos |
|---|---|---|
| Fundo da sala (vídeo/imagem) | pequena (≈ 1,3–1,6×) | Desfoque crescente (até ≈ 8–12 px), como foco de câmera; escurece um pouco. |
| Metades do título | saem pelas bordas antes do meio da fase | Mais rápidas que tudo; opacidade vai a 0. |
| Aparelho (moldura, base com teclado, suporte) | a que faz a tela cobrir a janela | Vetor nítido; a base com o teclado sai por baixo, a moldura pelas bordas. |
| Tela (HTML) | 1 (tamanho real) no fim | Começa reduzida dentro da moldura; ver §5. |

- **Matemática da tela:** o retângulo da tela no fim é exatamente a janela (`100vw × 100svh`). Durante a fase, a tela é a janela inteira com `transform: translate(…) scale(s)`, `s` indo de `s0` (o tamanho dela na cena da pausa) a 1. A moldura e as outras camadas derivam de `s` (a mesma origem), então tudo fica alinhado em qualquer tamanho de janela.
- **Proporção:** a tela tem a proporção da janela (Q13). A moldura em vetor se ajusta a ela (notebook 16:9, 16:10 ou mais largo, todos plausíveis).
- **Curva:** a câmera acelera devagar e chega devagar (`ease-in-out`), para a chegada não ser um tranco. Os números ficam para o protótipo.
- **Barra do topo:** a cápsula fica por cima de tudo, o tempo todo.

## 5. A tela (o bloco de chamada)

- É o **mesmo HTML** do bloco de chamada de hoje (`h2.hero-expansao__chamada`, `.lead`, "Ver produtos" e o botão do WhatsApp), numa seção de **altura de uma janela** (Q22), com o conteúdo centrado.
- No layout, ela vem logo depois do hero: quando `P = 1` e a página solta, a seção já está na posição da janela, e a rolagem normal leva ao Catálogo. Na cena, a mesma seção é mostrada reduzida e posicionada na tela do aparelho (uma só árvore, ADR-004; nada de cópia do bloco no DOM).
- **Ponteiro:** até `P = 1`, a tela não recebe clique (`pointer-events: none`), e o clique cai na cena (que não faz nada, como hoje).
- **Teclado:** o foco num botão da tela com `P < 1` completa a entrada na hora (`P = 1`, entrada "auto", como o foco faz hoje).
- **Leitor de tela:** o bloco é lido na ordem normal (h1 na sala, depois h2, frase e botões). Nada fica escondido do leitor durante a cena.
- **Texto pequeno:** ver Q25. Se o protótipo mostrar cintilação, entra o plano B.
- O fundo da tela é o navy da página (`surface-space`), o que casa com o brilho frio da Q18.

## 6. A cena

Mesmo mundo e mesmo pipeline do "Fim de expediente" (`scripts/hero-expansao/`: Canvas2D, Edge sem janela, ffmpeg). Muda a composição da mesa:

- **Deitado (notebook):** notebook aberto no centro da mesa, de frente para a câmera, tela vertical, base com o teclado em leve perspectiva por baixo. De um lado o celular (deitado, como hoje) e a caixa do Replay; do outro a caneca; o abajur na ponta. Sai o caderno de papel. Brilho frio da tela na mesa e no teclado.
- **Em pé (celular):** o celular de pé num suporte, na frente e no centro; o notebook atrás, desfocado e cortado; caixa do Replay e caneca nas laterais, se couberem.
- **O que é vetor e o que é imagem:** o fundo renderizado tem a sala, a mesa, os objetos laterais, a sombra e o brilho do aparelho, **sem o aparelho** (o lugar dele fica vazio no fundo). O aparelho (moldura, base, suporte) é vetor por cima, para ficar nítido até o fim.
- **Loop de 10 s** (LED respirando, vapor da caneca, cidade balançando) como hoje, com a emenda invisível.
- **Composição na pausa:** as metades do título ladeiam o notebook; a faixa do título precisa continuar escura (MASTER §3.4, a mesma regra da faixa do título de hoje).
- **Contraste:** o texto da tela é o do site (contraste da página). O título sobre a cena segue a §3.4 com a cena nova.

## 7. Sem JS e movimento reduzido

- **Sem JavaScript e antes de montar:** a cena parada em tela cheia (o pôster da pausa, com o aparelho e o título), sem a dica, e o bloco de chamada logo abaixo como seção normal. A página rola normalmente.
- **Com movimento reduzido (ao vivo, `useCanAnimate`):** o mesmo estado parado, sem rolagem presa. Uma árvore React só (ADR-004).
- **O botão de pausar o vídeo** continua (WCAG 2.2.2).

## 8. Acessibilidade

- O h1 "Strukti" continua um h1 de verdade; a tela é HTML real, lido em ordem.
- Nenhuma armadilha de foco: Tab completa a entrada; Shift+Tab a partir do bloco de chamada volta ao topo normalmente.
- Teclado: setas e Page Up/Down fazem o progresso andar, como hoje.
- Zoom do navegador e fonte grande: a tela é a página, então o layout dela responde como o resto do site; com a página ampliada (pinça), a rolagem é do navegador, como hoje.
- Cores forçadas: a moldura do aparelho e a tela continuam visíveis (contorno em `CanvasText`).

## 9. Desempenho

- Só `transform`, `opacity` e `filter: blur` nas camadas, num `requestAnimationFrame` (sem layout por quadro). O desfoque do fundo pode ser trocado por uma versão pré-desfocada em crossfade, se o protótipo mostrar queda de quadros.
- O LCP continua sendo o pôster da cena.
- Mídia só local (ADR-008), sem dependência nova (ADR-003), sem 3D.

## 10. Documentos que mudam

- **ADR-010:** revisão de 23/10/2026: o fim da expansão é tela cheia (não mais 95vw × 85vh), há a pausa e a aproximação, e o percurso preso fica ≈ 1,85 × mais longo. A exceção continua a mesma (a única rolagem presa da página).
- **MASTER §9.8:** a animação, as camadas e os estados parados.
- **`docs/landing-copy.md`:** sem mudança de texto (o bloco de chamada é o mesmo).

## 11. Ordem de trabalho

1. **Protótipo cinza** (branch `feat/hero-notebook`): mecânica completa (três fases, reverso, celular em pé, Tab, âncora, movimento reduzido), com caixas cinza no lugar da sala e do aparelho e o HTML real na tela. Dev server para o dono testar com mouse, trackpad e celular. Ajuste dos números (`E`, `Pa`, curvas, escalas, desfoque) e decisão da Q25.
2. **Arte:** a cena nova nos dois enquadramentos (deitado e em pé), o fundo sem o aparelho, o aparelho em vetor, o loop de 10 s e o pôster. Crítica de arte por enquadramento, como nos cartões do catálogo.
3. **Integração:** testes (vitest), `check:browser` com a etapa nova do hero (as três fases, o reverso, a tela alinhada à janela em `P = 1` com tolerância de 1 px, o Tab, o celular em pé e o movimento reduzido), documentação e PR para `homologacao`.

## 12. Fora de escopo

- Cursor, digitação ou qualquer animação dentro da tela.
- Som.
- Mouse e teclado avulsos na mesa.
- Mudar o texto do bloco de chamada.
