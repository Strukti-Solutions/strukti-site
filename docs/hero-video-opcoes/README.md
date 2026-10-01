# Vídeo de fundo do hero (tarefa HR1)

## Opções apresentadas ao cliente (01/10/2026)

Todas da Pexels, com a Pexels License conferida em
https://www.pexels.com/license/ (uso comercial, sem atribuição obrigatória,
edição permitida; proíbe sugerir endosso de pessoas ou marcas da imagem, por
isso nenhuma tem rosto identificável nem logotipo). Um quadro de cada nesta
pasta.

| Opção | Quadro | Vídeo | Autor | Duração |
|---|---|---|---|---|
| **A. Rota ao entardecer (escolhida)** | `rota-entardecer.jpg` | https://www.pexels.com/video/aerial-footage-of-truck-on-the-road-9339061/ | K | 1min10s |
| B. Corredor de estoque | `estoque-corredor.jpg` | https://www.pexels.com/video/a-footage-inside-the-warehouse-4294436/ | Tiger Lily | 11 s |
| C. Pátio de carga | `patio-de-carga.jpg` | https://www.pexels.com/video/aerial-view-of-a-truck-in-a-warehouse-20654636/ | Eric Skaggs | 12 s |

Descartados na triagem: "Depósito" (logotipo de fabricante nas caixas),
vídeos com operador de empilhadeira em primeiro plano e os com no máximo
540p.

## Como o vídeo escolhido foi tratado

Fonte: o maior arquivo da página (2560 × 1440, 24 qps). Tudo em ffmpeg; o
grafo de filtros completo está em `rota-entardecer.ffgraph`.

1. **Trecho:** de 1,5 s a 15 s da fonte (a carreta passa embaixo do drone e
   some no horizonte).
2. **Tom da marca:** saturação a 28%, sombras e meios-tons puxados para o
   azul, contraste +6% e gama 0,9 (o chão vira marinho e o céu, cinza-azulado).
3. **Loop sem salto:** o drone sobe devagar, então o fim do trecho não
   coincide com o começo. A homografia entre os quadros que se misturam na
   emenda (estimada por alinhamento de imagem) é aplicada aos poucos ao
   longo do loop (filtro `perspective` por quadro), com um recorte fixo de
   8% para nunca faltar imagem. Na emenda, 1,5 s de fusão com curva suave
   (`blend`), já com as duas pontas alinhadas: a estrada não "dobra", só a
   carreta se dissolve.
4. **Ponto de partida:** o loop começa com a carreta a meia distância, acima
   da palavra "Strukti"; esse 1º quadro é também o pôster.
5. **Saídas** (em `public/video/hero/`):
   - `rota-entardecer-1920x1080.mp4`: H.264 High, CRF 23, 12 s, sem áudio,
     faststart, ~1,65 MB (telas deitadas);
   - `rota-entardecer-720x1280.mp4`: recorte em pé centrado na estrada,
     CRF 24, ~0,66 MB (celular em pé);
   - pôsteres `.avif` (AV1, CRF 18) e `.jpg` (qualidade 82, progressivo) de
     cada recorte.

Para refazer: baixar o arquivo de 2560 × 1440 da página da Pexels e rodar

```
ffmpeg -t 15.2 -i fonte.mp4 -/filter_complex rota-entardecer.ffgraph \
  -map "[land]" -an -c:v libx264 -preset slow -profile:v high -level 4.1 -crf 23 -g 48 -r 24 -movflags +faststart rota-entardecer-1920x1080.mp4 \
  -map "[port]" -an -c:v libx264 -preset slow -profile:v high -level 3.1 -crf 24 -g 48 -r 24 -movflags +faststart rota-entardecer-720x1280.mp4
```

Os pôsteres são o 1º quadro de cada saída (`-frames:v 1` no mesmo grafo,
em PNG, depois AVIF e JPG).
