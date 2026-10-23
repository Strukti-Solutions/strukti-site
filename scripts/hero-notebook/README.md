# Mídia do hero com entrada pelo notebook

A cena do hero "notebook" (o modo entrada do `ScrollExpandMedia`, spec
`docs/superpowers/specs/2026-10-23-hero-entrada-notebook-design.md`, §6) é o
mesmo mundo do "Fim de expediente" (`scripts/hero-expansao/`), com a mesa
recomposta: o **notebook aberto no centro**, de frente para a câmera; o celular
(deitado) e a caixa do Replay de um lado; a caneca do outro; o abajur na ponta.
Sai o caderno de papel. A tela solta um brilho frio suave na mesa e no teclado.

Esta pasta é uma cópia adaptada do pipeline do expansao e não usa nada de lá em
tempo de execução (o `cena.test.ts` confere). Produção própria, sem IA
generativa nem banco de imagens, sem marca, logo ou texto legível: a tela do
notebook mostra a página de longe (o bloco de chamada em barras e dois botões).

## O que é imagem e o que é vetor

- **Fundo largo** (`bg`, 1920 × 1080, visto em volta do cartão em P = 0): o
  mundo inteiro, **com** o notebook renderizado (ele nunca é ampliado). A
  câmera tem a mesma direção da `media`, mais aberta: em P = 0, a 1440 × 900, o
  notebook do fundo fica atrás do cartão de 300 × 400, quase no mesmo lugar e
  no mesmo tamanho do notebook que aparece dentro do cartão (sem dois notebooks
  empilhados).
- **Mídia** (`media`, 1280 × 720, o quadro que a câmera atravessa): **sem** o
  notebook (`semAparelho: true` em `CAMS.media`). Ficam a sombra dele e o
  brilho da tela na mesa; o aparelho é vetor por cima, no site.
- **Em pé** (spec §6: o celular de pé num suporte, na frente e no centro; o
  notebook atrás, desfocado e cortado; caixa do Replay e caneca nas laterais),
  as mesmas duas peças: o **fundo em pé** (`portrait`, 1080 × 1920) com o
  celular renderizado, e a **mídia em pé** (`mediaRetrato`, 720 × 1280) sem o
  celular nem o suporte (`semAparelho` com `aparelho: 'celular'`; ficam a
  sombra e o brilho da tela dele na mesa). O notebook atrás é desenhado nas
  duas e desfocado (`desfoque`).

## Precisa de

O mesmo do expansao: Microsoft Edge (caminho no `shot.sh`), Git Bash, ffmpeg
(`libaom-av1`, `libvpx-vp9`, `libx264`) e Node. Um Edge por vez: o `shot.sh`
usa o perfil `prof/` desta pasta e, no fim, fecha só os Edge com esse perfil.
Rode tudo de dentro desta pasta (`cd scripts/hero-notebook`).

## 1. Fotos

```sh
mkdir -p cur
./shot.sh bg.html cur/bg.png 1920 1080        # fundo largo, com o notebook
./shot.sh media.html cur/media.png 1280 720   # a mídia parada, sem o notebook
./shot.sh portrait.html cur/portrait.png 1080 1920              # fundo em pé, com o celular
./shot.sh media-retrato.html cur/media-retrato.png 720 1280     # a mídia em pé, sem o celular
```

O mundo (`BASE` no `scene.js`) e as câmeras (`CAMS`) valem para as quatro
fotos: mexeu num objeto, renderize todas. Os passes do loop de 10 s ainda não
estão aqui.

## 2. O retângulo da tela e as sondas

```sh
node geo.js            # câmera media (px da mídia 1280 × 720)
node geo.js '{}' bg    # câmera bg
node geo.js '{}' mediaRetrato   # em pé (px da mídia 720 × 1280)
node sondas.js cur/media.png cur/bg.png [1440x900 1366x768]
node sondas.js --em-pe cur/media-retrato.png cur/portrait.png [390x844 360x740 375x667]
```

- `geo.js` imprime `tela` (`cx`, `cy`, `largura` e `altura` da tela do
  notebook, 16:10), que alimenta o `ENTRADA.aparelho.deitado` em
  `src/lib/heroEntrada.ts`, mais a base (`base`: os cantos do tampo e o pé da
  frente), a tampa (`tampa`), caixas (em %) dos objetos, pontos da mesa, o
  abajur e os montantes da janela. Aceita mudanças do mundo ou da câmera em
  JSON (`{"world": {...}, "cam": {...}}`).
- A tampa inclina para trás o mesmo ângulo da câmera `media` (`tilt`, calculado
  no `scene.js`): a tela fica paralela ao quadro e vira um retângulo alinhado
  aos eixos, sem trapézio. Por isso o `x` do notebook é o da câmera, sem
  guinada.
- Nas câmeras em pé, o `tela` do `geo.js` é a tela do celular e alimenta o
  `ENTRADA.aparelho.emPe` (a mídia em pé é o `ENTRADA.midia.emPe`, 720 × 1280,
  cortada em 50% 50%). Saem também o corpo do celular (`celular`) e o suporte
  (`suporte`: a quina da frente da chapa no tampo e o `pe` na mesa), para o
  vetor; a tela do notebook fica em `telaNotebook`.
- `sondas.js` mede, na mídia, a faixa do título na pausa: com a conta do
  `telaNaCena` (e = 1, `cover` em 50% 100%), a linha 1 do título fica à
  esquerda da tela (de 16 px da borda da janela até 24 px da tela) e a linha 2
  à direita, na altura do h1 no site. O percentil 90 da luminância (BT.709,
  0 a 255) precisa ficar até 60 (MASTER §3.4). Também mede os cantos de cada
  imagem (24 × 24 px), que não passam do navy-900 (#0e1c2b) em nenhum canal.
  Com `--em-pe`, a conta é a da mídia em pé (cover 50% 50%) com a tela do
  celular, e saem também as caixas das metades como o site as desenha na
  pausa (`metade1`, `metade2`, na escala do `posicaoDoTitulo`).

## 3. Diferenças para o expansao

- `BASE.laptop` no lugar de `BASE.notebook` (o caderno); celular, caixa e
  caneca reposicionados. `drawLaptop` desenha base, teclado (teclas sem
  legenda), trackpad, dobradiça, tampa e tela; `screenGlow` desenha o brilho
  na mesa (também na mídia sem o notebook); `laptopPts` entra nas sombras.
- Câmera `media` mais baixa e de frente (pos `[3, 42, -54]`), com a tela no
  centro do quadro, onde fica o centro do título na pausa (y = 360 da mídia em
  16:9 e 16:10). `skyEl: -11` lê o céu com o desvio de inclinação em relação à
  câmera do expansao, para o quadro ter o mesmo degradê (o claro do horizonte
  não fica atrás do título). A torre da direita sobe até sair do quadro, para
  o canto de cima escurecer como o da esquerda.
- A mesa vai até `z0: -45`: na `media` ela sai pelo pé do quadro; no `bg` a quina
  da frente, com o fio de luz, fica no pé (y ≈ 995), como no fundo do expansao.
- Composição (ajuste de arte 1): a caixa e o celular ficam puxados para dentro (no
  corte 4:3 deitado a mídia perde 160 px de cada lado), com o topo da caixa abaixo
  da linha 1 do título; a caneca vem para a frente, com a boca abaixo da linha 2.
  O foco do abajur na `media` cai na caixa e no celular (`target [-30, 0, 24]`),
  e o centro em frente ao notebook fica para o brilho frio da tela.
- `screenGlow`: a elipse fria fica à frente da base (nada dentro da pegada), e uma
  linha de oclusão logo à frente do pé assenta a base na mesa. O AO e a linha de
  contato do notebook têm desfoque largo (~8 px na `media`), para o vetor por cima
  tolerar 1–2 px de arredondamento.
- `peitoril` (câmera `media`): o peitoril escurece à direita da tela, numa rampa
  escondida atrás do notebook, para a linha 2 do título ficar sobre uma superfície
  só (`[u0, u1, a]`, em frações da largura).
- No `bg` (`BG_WORLD`) o notebook é menor (`laptop.s 0.84`, base de ~212 px) para
  caber atrás do cartão de 300 × 400 em P = 0 até 2560 px de janela.
- Uma disposição só (ajuste de arte 2): celular, caixa e caneca vêm do `BASE` nas
  duas câmeras (o `BG_WORLD` não mexe neles). A caixa fica atrás e o celular logo à
  frente dela, na mesma coluna, quase de pé no quadro (`rot 12`); a caneca, do outro
  lado, tem a alça para a frente (`alca`). Na `media`, os três ficam fora do recorte
  do cartão em P = 0 (x 370–910 da mídia) com ~40 px de folga e dentro do corte 4:3;
  no `bg`, fora do cartão de 1024 a 2560 px de janela. O `cena.test.ts` confere.
- Luz (ajuste de arte 2): o brilho da tela (`GLOW_C`/`GLOW_A`, `brilhoDaTela`) é um
  azul-navy claro e fraco, abaixo da poça do abajur, e morre antes de y 680 da mídia.
  A penumbra do notebook (janela e AO) sai deslocada para a direita e apagada à
  esquerda da base (o abajur está à esquerda); a caixa e a caneca pegam um toque frio
  na face voltada para o notebook (`toqueFrio`). `calmaPeitoril` desfoca o filete do
  peitoril à direita da tela, depois do reflexo na mesa. No `bg`, as sombras do
  abajur são curtas (`sombraMax`, `sombraA`) e a poça pega de leve a caixa; a tela do
  notebook é só o navy da página, sem barras nem botões.

- Em pé (`PT_WORLD`, o mesmo mundo encenado para a câmera em pé): o celular deitado
  sai da mesa e fica de pé num suporte (`celular`: tela na proporção de 390 × 844,
  inclinada o mesmo ângulo da tampa do notebook, que é o da câmera em pé: a tela
  vira um retângulo de frente), à frente do notebook, que fica onde está. As duas
  câmeras em pé olham de frente para o centro da tela do celular, a `dist` cm: na
  `mediaRetrato` ela fica no centro do quadro; o `portrait` tem F e centro acertados
  para, a 390 × 844, o celular do fundo ficar atrás do celular do cartão em P = 0.
  A caixa do Replay fica ao fundo, à esquerda, junto da janela, e a caneca à frente,
  à direita: as duas fora da faixa das metades do título (a caixa à frente punha o
  botão azul atrás da linha 1). O abajur, fora do quadro, faz a poça no suporte e
  morre antes do pé do quadro (`cutZ`). Os objetos são desenhados de trás para a
  frente (pelo `z`), e `desfocaFundo` desfoca o que fica atrás do celular antes de
  desenhá-lo nítido.
- Em pé, ajuste de arte 1 (crítica da N3):
  - `vazio` (só na `mediaRetrato`): o lugar do suporte não tem mais a pegada dura (AO e linha de contato quase pretos, que
    liam como uma peça deitada na mesa). Fica uma sombra difusa numa camada própria: a sombra longa do abajur para a
    direita, a da janela e pegadas encaixadas 15% maiores que a chapa (`cresce`), cada uma menor e mais desfocada, com a
    borda em ~20 px (`transicao`) e o miolo em ~rgb(51, 48, 41), nunca abaixo de ~rgb(44, 40, 33). Sem linha de contato:
    ela fica no vetor (N4). O brilho frio da tela à frente do vazio (`brilhoDoCelular`) ficou mais largo e um pouco mais forte.
  - O abajur fica baixo e com a poça em gaussiana (`lamp.gauss`, `[sigma, saia]` em graus): o centro no suporte, e as
    laterais do corte de 390 × 844 caem ao menos 30% (o `cena.test.ts` confere com o `corDaMesa`). O veio da mesa em pé
    (`veio`) varia o espaçamento e o contraste das faixas.
  - Os montantes em pé têm 7 cm (`MONT_EM_PE`).
  - A cidade em pé (`bokehCol`): as janelas acesas e os discos desfocados ficam nas prumadas das torres
    (`janelasAcesas`, `discosDaCidade`), com tamanhos por coluna, até 4 discos por coluna e nenhum sobre um montante.
- Em pé, ajuste de arte 2 (crítica da N3, rodada 2):
  - A caixa do Replay, o objeto mais distante, fica no desfoque do fundo como o resto (nada escapa do `desfoque`: com a
    máscara própria da rodada 1 ela saía mais nítida que o notebook e parecia colada por cima). A leitura vem da luz:
    o LED aceso por inteiro (`ledK: 1`) com o halo maior e um reflexo da janela no alto da bola (`caixaLuz`).
  - Os montantes (`coresDoMontante`) ficam um tom abaixo do vidro ao lado, como a esquadria da referência: a face da
    frente entre o navy-950 e o 900, a lateral perto do 900 e só uma quina fina do lado da cidade (alfa 0,13).
  - O brilho frio do celular (`brilhoDoCelular`) é fraco, com ~1,2× a largura do corpo, colado à frente do vazio, e o
    núcleo morre em ~40 px de mídia: sobre a poça quente, é só um toque frio.
  - A caneca vem mais perto e mais baixa (z 9, 8,2 cm), para a boca aparecer como uma elipse fina com o aro claro
    (`boca`), com a cerâmica no navy-700 dessaturado da referência (`alb`). O brilho da tela do notebook na mesa e a
    linha de oclusão dele passam atrás dela (`screenGlow`, em pé).

## 4. Instalar

As fotos viram `fundo.*` e `midia-poster.*` em `public/hero/notebook/` pelo
`stills.sh` (`./stills.sh cur/bg.png final2/fundo 11 3`, igual ao expansao);
os limites estão nas Global Constraints do plano da arte. O pôster definitivo
sai do quadro 0 do loop, quando os passes estiverem prontos.

Instaladas em 23/10/2026: `fundo.*` (de `cur/bg.png`) e `midia-poster.*` (de
`cur/media.png`), ambas com crf 11 e `-q:v` 3; em pé, `fundo-retrato.*` (de
`cur/portrait.png`) e `midia-retrato-poster.*` (de `cur/media-retrato.png`), com
os mesmos números. O `src/config/heroNotebook.assets.test.ts`
confere os tamanhos e os limites dos arquivos que o `siteConfig.heroNotebook` usa.
