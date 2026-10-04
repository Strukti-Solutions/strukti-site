# Quadros do hero "estudio"

O hero da home (MASTER §9.7) é uma sequência de quadros gerada aqui. Os PNGs
ficam em `.hero-render/` (fora do git); os AVIF e os pôsteres vão para
`public/hero/sequencia/`.

1. Instale o Blender (versão estável) e o ffmpeg.
2. Renderize (um de cada vez; é processo pesado):
   `blender -b --factory-startup -P scripts/hero-3d/render.py -- --set desktop --out <repo>/.hero-render/desktop`
   e o mesmo com `--set celular`.
3. Comprima: `node scripts/hero-3d/encode.mjs [--crf 18]` (ou `FFMPEG_PATH=...`).
4. Confira: `npx vitest run src/config/heroSequence.assets.test.ts` (quantidade e orçamento: 3 MB desktop, 1,2 MB celular).

O `render.py` usa light linking do EEVEE, que Blenders antigos não têm (testado no 5.2.2 LTS). Num Blender antigo, o anel azul volta no piso.
Mudou a quantidade de quadros? Ajuste `SETS` no `render.py` e `siteConfig.heroSequence` juntos.
O modelo é estilizado; com o CAD/STL da caixa definitiva, troque `build_product()` por um import.
