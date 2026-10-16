# Mídia do hero "expansao" ("Fim de expediente")

A mídia do hero padrão (MASTER §9.8, ADR-010) é produção própria da Strukti,
sem licença de terceiros, e é gerada aqui. A cena é desenhada em Canvas2D
(`scene.js`: um mundo só, em centímetros, com três câmeras: `bg` 1920 × 1080,
`portrait` 1080 × 1920 e `media` 1280 × 720), fotografada num Edge sem janela
(`shot.sh`), e o loop de 10 s do vídeo é montado no ffmpeg a partir de passes
separados da câmera `media` ("plates"). Nada do que sai daqui vai para o git
(o `.gitignore` desta pasta): os 8 arquivos finais vão para
`public/hero/expansao/`, com os nomes fixos de `siteConfig.heroExpansao`.

## Precisa de

- Microsoft Edge (o caminho está em `shot.sh`) e o Git Bash (`cygpath`, e o
  `powershell` que o `shot.sh` usa para fechar o Edge que ele abriu).
- ffmpeg com `libaom-av1`, `libvpx-vp9` e `libx264` (aqui, o build "full" da
  gyan.dev, pelo winget; confira em `ffmpeg -hide_banner -encoders`).
- Node (para `composite2.js` e as sondas).

É processo pesado: um Edge por vez. O `shot.sh` usa um perfil próprio nesta
pasta (`prof/`) e, no fim, fecha só os processos do Edge com esse perfil.
Rode tudo de dentro desta pasta (`cd scripts/hero-expansao`).

## 1. Fotos (fundos e quadro de referência)

```sh
mkdir -p cur plates2 final2
./shot.sh bg.html cur/bg.png 1920 1080              # fundo, telas deitadas
./shot.sh portrait.html cur/portrait.png 1080 1920  # fundo, telas em pé
./shot.sh media.html cur/media.png 1280 720         # o quadro, parado (referência)
```

O mundo (`BASE` no `scene.js`) e as câmeras (`CAMS`) valem para as três
fotos: mexeu num objeto, renderize as três e os passes de novo. As sondas
ajudam a medir antes de renderizar:

- `node geo.js '<json>' [media|bg|portrait]`: caixas (em % do quadro) do
  celular, da caixa do replay, do caderno e da caneca, pontos da mesa, o
  abajur e os montantes da janela, com mudanças do mundo ou da câmera em JSON.
- `node pool.js '<json do abajur>'`: o mapa da luz do abajur na mesa (câmera `media`).
- `node mstats.js <imagem 1280x720>` e `node rowsY.js <imagem> x0 x1 passo y1,y2,...`:
  brilho da mesa, das bordas e de linhas da imagem.

## 2. Passes do vídeo

```sh
./shot.sh plates.html plates2/tiles.png 2560 1440    # 4 passes da câmera media num mosaico
./shot.sh city2x.html plates2/city2x.png 2576 1440   # a cidade lá fora, em 2x (para o balanço de meio pixel)
./shot.sh steam2.html plates2/steam2.png 520 420     # o vapor da caneca (faixa e máscara, em 2x)
ffmpeg -y -v error -i plates2/steam2.png -vf crop=96:400:0:0 plates2/strip.png
ffmpeg -y -v error -i plates2/steam2.png -vf crop=96:240:100:0 plates2/mask.png
./derive.sh plates2
```

Os passes são: A (a sala com a cidade preta), B (cidade cinza 128), C (A com o
LED aceso) e D (A com o abajur apagado). O `derive.sh` separa o mosaico e
calcula T = (B − A) × 255/128 (o quanto a cidade aparece em cada pixel),
E = C − A (o LED) e Lp = A − D (o abajur).

## 3. O loop

```sh
node composite2.js    # -> plates2/master.mkv (ffv1, sem perda, 251 quadros)
```

final(t) = A + T × cidade(t) + k(t) × E + j(t) × Lp + vapor(t), tudo periódico
em 10 s: o quadro 250 é igual ao 0 (a emenda do loop não aparece). A cidade
balança meio pixel, o LED respira, o abajur oscila 3% e o vapor sobe três
períodos por volta. Os grãos de poeira (`DUST=1`) foram testados e ficaram de
fora (pareciam sujeira sobre a mesa iluminada).

## 4. Codificação

```sh
./encode.sh plates2/master.mkv final2 20 10          # midia.mp4 (H.264 crf 20) e midia.webm (VP9 crf 10)
ffmpeg -y -v error -i plates2/master.mkv -frames:v 1 final2/poster-master.png
./stills.sh final2/poster-master.png final2/midia-poster 11 3
./stills.sh cur/bg.png final2/fundo 11 3
./stills.sh cur/portrait.png final2/fundo-retrato 11 3
```

Os números são os da mídia publicada (16/10/2026): VP9 com crf 10 (de 16 para
cima, o VP9 repetia quadros do vapor) e AVIF de 8 bits com crf 11 (acima de
12, o grão some e o céu fica liso, com risco de faixas). O último argumento do
`stills.sh` é o `-q:v` do JPG de reserva (de 2 a 4; os publicados têm cerca de
140 KB nos fundos e 73 KB no pôster). O pôster é o 1º quadro do loop, para o
vídeo começar sem salto.

## 5. Conferência

- `./vqa.sh final2/midia.webm webm` (e o mesmo com o MP4): pares de quadros
  seguidos idênticos no quadro inteiro e no recorte do vapor, o pior passo e a
  emenda 249 → 0. Limites usados: no máximo 10% de pares iguais no vapor e
  emenda de pelo menos 45 dB. O `vqa-sum.sh <tag>` resume de novo o que já
  foi medido (em `qa/`).
- `./finpv.sh c1440x900 e1440x900 m390x844 m360x740 m375x667`: prévias da
  composição (recolhido, expandido e um tamanho de tela por `fin2-pvm-<tam>.html`)
  com a mídia que está em `public/hero/expansao/`, em `review/` (no máximo
  960 px de largura). Para prévias da mídia nova, troque o caminho nos
  `fin2-*.html` por `final2/`.
- A faixa do título (x de 29% a 71%, y de 33% a 67% do quadro 1280 × 720)
  precisa ficar escura: percentil 90 da luminância até 60, e o resto dos
  limites de contraste do `MASTER.md` §3.4.

As prévias usam a Geologica de um `geologica.woff2` nesta pasta, que fica fora
do git (o site carrega a fonte pelo `next/font/google`, em `src/fonts/index.ts`).
Sem o arquivo, elas caem na fonte do sistema; para a fonte certa, baixe a
Geologica do Google Fonts (licença SIL Open Font License 1.1) para cá.

## 6. Instalar

Copie os 8 arquivos de `final2/` (`fundo.avif`, `fundo.jpg`,
`fundo-retrato.avif`, `fundo-retrato.jpg`, `midia.webm`, `midia.mp4`,
`midia-poster.avif`, `midia-poster.jpg`) para `public/hero/expansao/`, com os
mesmos nomes; o código não muda. Se o enquadramento mudou, confira o corte em
`.hero-expansao` no `globals.css` (`--hx-fundo-pos`, `--hx-fundo-pos-retrato`
e `--hx-midia-pos`) e rode `npm run check:browser`.

Pendente (ADR-010): em tablets em pé, com o quadro expandido, aparecem pontas
do caderno e da caneca nas bordas. A correção é mover `BASE.notebook` e
`BASE.mug` no `scene.js` e renderizar tudo de novo.
