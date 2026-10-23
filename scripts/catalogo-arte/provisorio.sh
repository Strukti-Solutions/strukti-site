#!/usr/bin/env bash
# provisorio.sh <slug> <cor-do-tipo> [--loop]
# Gera a arte PROVISÓRIA do cartão em public/catalogo/<slug>/ (contrato da
# spec 2026-10-16, §6.1): um degradê (sem ruído, para caber no orçamento) da cor
# do tipo no topo até o navy #0e1c2b embaixo. Não toca nas telas SVG.
#   <cor-do-tipo>  hex sem "#": hardware 22d3ee (ciano), aplicativo 0185e7
#                  (elétrico), site 8b7ff0 (violeta suave).
#   --loop         só para os 3 reais: loop de 5 s (600x900, 25 fps), VP9 + H.264.
# Exige ffmpeg com o filtro gradients, libaom-av1, libvpx-vp9 e libx264.
set -euo pipefail

slug="${1:?uso: provisorio.sh <slug> <cor-do-tipo> [--loop]}"
cor="${2:?falta a cor do tipo (hex sem #)}"
loop="${3:-}"
navy="0e1c2b"
raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dest="$raiz/public/catalogo/$slug"
[ -d "$dest" ] || { echo "pasta inexistente: $dest" >&2; exit 1; }

# Degradê vertical: a cor do tipo só no alto (a metade de baixo fica calma e
# escura, onde entra o texto do cartão). Misturada ao navy para não estourar.
# Os pontos são frações do tamanho, então o quadro 0 do loop casa com o JPG.
fonte() { # <largura> <altura>
  local w=$1 h=$2
  echo "gradients=s=${w}x${h}:c0=0x${cor}:c1=0x${navy}:x0=$((w / 3)):y0=0:x1=$((w / 2)):y1=$((h * 62 / 100)):nb_colors=2:speed=0:rate=25"
}

# Qualidade ajustada ao orçamento (§6.1): JPG -q:v, AVIF -crf.
cartao() { # <sufixo> <largura> <altura> <q-jpg> <crf-avif>
  local base="$dest/cartao$1"
  ffmpeg -y -v error -f lavfi -i "$(fonte "$2" "$3")" -frames:v 1 -pix_fmt yuvj420p -q:v "$4" -update 1 "$base.jpg"
  ffmpeg -y -v error -f lavfi -i "$(fonte "$2" "$3")" -frames:v 1 -pix_fmt yuv420p \
    -c:v libaom-av1 -still-picture 1 -crf "$5" -b:v 0 -cpu-used 3 \
    -colorspace bt709 -color_range pc -update 1 "$base.avif"
}

cartao "" 800 1200 2 20
cartao "-480" 480 720 2 20

if [ "$loop" = "--loop" ]; then
  # O degradê "respira" (brilho sobe e desce uma vez em 124 passos). Com 125
  # quadros (5 s a 25 fps), o último volta ao brilho do quadro 0: sem salto.
  filtro="eq=eval=frame:brightness='0.05*(1-cos(2*PI*n/124))/2'"
  ffmpeg -y -v error -f lavfi -i "$(fonte 600 900)" -vf "$filtro,format=yuv420p" -frames:v 125 \
    -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -an "$dest/cartao-loop.webm"
  ffmpeg -y -v error -f lavfi -i "$(fonte 600 900)" -vf "$filtro,format=yuv420p" -frames:v 125 \
    -c:v libx264 -preset slow -crf 22 -movflags +faststart -an "$dest/cartao-loop.mp4"
fi

ls -l "$dest"/cartao* | awk '{print $5, $9}'
