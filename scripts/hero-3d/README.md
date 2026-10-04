# Quadros do hero "estudio"

O hero da home (MASTER §9.7) é uma sequência de quadros gerada aqui. Os PNGs
ficam em `.hero-render/` (fora do git); os AVIF e os pôsteres vão para
`public/hero/sequencia/`.

1. Instale o Blender (versão estável) e o ffmpeg, com o encoder `libaom-av1` e o muxer AVIF
   (confira se `libaom-av1` aparece em `ffmpeg -hide_banner -encoders`; aqui foi usado o build "full" da gyan.dev, pelo winget).
   O Blender não entra no PATH; pela Steam ele fica em
   `C:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe`.
2. Esvazie `.hero-render/<set>` (por exemplo `.hero-render/desktop`) e renderize, um de cada vez (é processo pesado):
   `blender -b --factory-startup --python-exit-code 1 -P scripts/hero-3d/render.py -- --set desktop --out <repo>/.hero-render/desktop`
   e o mesmo com `--set celular`. Sem o `--python-exit-code 1`, o Blender sai com código 0 mesmo quando o script falha.
   O `encode.mjs` recusa a pasta se os PNGs não forem exatamente `f000..f(N-1)` do `SETS`.
3. Comprima: `node scripts/hero-3d/encode.mjs [--crf 18]`. Para escolher o ffmpeg, use
   `FFMPEG_PATH=... node ...` no bash ou `$env:FFMPEG_PATH = "..."` antes do `node` no PowerShell.
4. Confira: `npx vitest run src/config/heroSequence.assets.test.ts` (quantidade, assinatura AVIF, largura e altura, orçamento: 3 MB desktop, 1,2 MB celular).

O `render.py` foi testado no 5.2.2 LTS; as APIs usadas (light linking, raytracing do EEVEE, a entrada "Specular IOR Level")
pedem um Blender recente (4.2+ presumido). Num mais antigo, espere um erro (não testado).
Mudou a quantidade de quadros? Ajuste `SETS` no `render.py` e `siteConfig.heroSequence` juntos.
O modelo é estilizado; com o CAD/STL da caixa definitiva, troque `build_product()` por um import.
