#!/bin/sh
# uso: encode.sh <master.mkv 600x900> <pasta de saída> <crf-mp4> <crf-webm>
# Loop do cartão (só os 3 reais; spec 2026-10-16 §6.1): 600x900, 25 fps, 5 s = 125 quadros, sem áudio,
# cartao-loop.mp4 (H.264) e cartao-loop.webm (VP9), cada um até 600 KB. Adaptado do encode.sh do hero.
M=$1; O=$2; mkdir -p "$O"
# A6: conversão RGB->YUV precisa (accurate_rnd, full_chroma_int), para o quadro 0 não mudar o tom sobre o pôster.
# (Um quadro-chave forçado no 124 do MP4 piorou a emenda: 49,7 -> 46,6 dB no Replay, os dois I-frames quantizam o grão
# de jeitos diferentes; fica a cadeia de P-frames.)
VF="scale=600:900:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p"
ffmpeg -y -v error -i "$M" -frames:v 125 -r 25 -vf "$VF" -c:v libx264 -crf $3 -preset slow -tune film -g 125 -colorspace bt709 -color_range tv -movflags +faststart -an "$O/cartao-loop.mp4"
ffmpeg -y -v error -i "$M" -frames:v 125 -r 25 -vf "$VF" -c:v libvpx-vp9 -crf $4 -b:v 0 -g 125 -deadline good -cpu-used 1 -row-mt 1 -auto-alt-ref 1 -lag-in-frames 25 -colorspace bt709 -color_range tv -an "$O/cartao-loop.webm"
falha=0
for f in cartao-loop.mp4 cartao-loop.webm; do
  b=$(wc -c < "$O/$f" | tr -d ' '); if [ "$b" -le 600000 ]; then s=ok; else s=ESTOUROU; falha=1; fi
  echo "$b bytes (limite 600000) $s  $O/$f"
done
exit $falha
