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
```

O mundo (`BASE` no `scene.js`) e as câmeras (`CAMS`) valem para as duas
fotos: mexeu num objeto, renderize as duas. O enquadramento em pé (o celular
num suporte) e os passes do loop de 10 s ainda não estão aqui.

## 2. O retângulo da tela e as sondas

```sh
node geo.js            # câmera media (px da mídia 1280 × 720)
node geo.js '{}' bg    # câmera bg
node sondas.js cur/media.png cur/bg.png [1440x900 1366x768]
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
- `sondas.js` mede, na mídia, a faixa do título na pausa: com a conta do
  `telaNaCena` (e = 1, `cover` em 50% 100%), a linha 1 do título fica à
  esquerda da tela (de 16 px da borda da janela até 24 px da tela) e a linha 2
  à direita, na altura do h1 no site. O percentil 90 da luminância (BT.709,
  0 a 255) precisa ficar até 60 (MASTER §3.4). Também mede os cantos de cada
  imagem (24 × 24 px), que não passam do navy-900 (#0e1c2b) em nenhum canal.

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
- A mesa é mais funda (`z0: -70`): nas duas câmeras ela sai pelo pé do quadro.

## 4. Instalar

As fotos viram `fundo.*` e `midia-poster.*` em `public/hero/notebook/` pelo
`stills.sh` (`./stills.sh cur/bg.png final2/fundo 11 3`, igual ao expansao);
os limites estão nas Global Constraints do plano da arte. O pôster definitivo
sai do quadro 0 do loop, quando os passes estiverem prontos.
