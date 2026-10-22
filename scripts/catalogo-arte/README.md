# Arte do catálogo (provisória)

`provisorio.sh` gera os arquivos **provisórios** de `public/catalogo/<slug>/`: um degradê da cor do tipo para o navy `#0e1c2b`, sem ruído, para caber no orçamento da spec (2026-10-16, §6.1). Não é arte final.

```bash
bash scripts/catalogo-arte/provisorio.sh <slug> <cor-do-tipo> [--loop]
```

| Tipo | Cor | Exemplo |
|---|---|---|
| hardware (ciano) | `22d3ee` | `provisorio.sh placar-conectado 22d3ee` |
| aplicativo (elétrico) | `0185e7` | `provisorio.sh rota-de-vendas 0185e7 --loop` |
| site (violeta suave) | `8b7ff0` | `provisorio.sh site-clinicas 8b7ff0` |

- Gera `cartao.avif/.jpg` (800x1200) e `cartao-480.avif/.jpg` (480x720). Com `--loop` (só os 3 reais: `replay`, `rota-de-vendas`, `fleet-analytics-bi`), gera também `cartao-loop.webm/.mp4` (600x900, 25 fps, 5 s, o degradê respirando; o último quadro volta ao quadro 0).
- Não mexe nas telas `tela-1..3.svg` nem no `LEIA-PROVISORIO.txt`.
- Precisa de `ffmpeg` com `gradients`, `libaom-av1`, `libvpx-vp9` e `libx264`.
- O teste `src/content/catalogo.assets.test.ts` confere medidas e orçamento.

A arte final (spec §6.2, plano à parte) substitui estes arquivos **com os mesmos nomes**, sem mexer no código; as fontes dela entram em `scripts/catalogo-arte/<slug>/`.
