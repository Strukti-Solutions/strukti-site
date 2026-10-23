#!/bin/sh
# uso: stills.sh <cartao.png 800x1200> <pasta de saída> [crf-avif-800] [q-jpg-800] [crf-avif-480] [q-jpg-480]
# Gera cartao.avif/.jpg (800x1200) e cartao-480.avif/.jpg (480x720, reduzido do 800 com lanczos), como os
# stills do hero: AVIF de 8 bits (yuv420p, faixa cheia, bt709). O hero usou crf 11 (acima de 12 o grão some
# e o céu fica liso, com faixas). JPG em q 2: no q 3 o grão da metade escura some (desvio de alta frequência
# 2,0 no PNG -> 0,5 no JPG). Confere o orçamento da spec 2026-10-16 §6.1 e sai com 1 se estourar.
IN="$1"; O="$2"; CA=${3:-11}; QJ=${4:-2}; CA4=${5:-$CA}; QJ4=${6:-$QJ}
[ -f "$IN" ] || { echo "png inexistente: $IN" >&2; exit 1; }
mkdir -p "$O"
AVF="scale=out_color_matrix=bt709:out_range=pc,format=yuv420p"
S480="scale=480:720:flags=lanczos"
ffmpeg -y -v error -i "$IN" -vf "$AVF" -c:v libaom-av1 -still-picture 1 -crf $CA -b:v 0 -cpu-used 3 -colorspace bt709 -color_range pc "$O/cartao.avif"
ffmpeg -y -v error -i "$IN" -q:v $QJ -pix_fmt yuvj420p "$O/cartao.jpg"
ffmpeg -y -v error -i "$IN" -vf "$S480,$AVF" -c:v libaom-av1 -still-picture 1 -crf $CA4 -b:v 0 -cpu-used 3 -colorspace bt709 -color_range pc "$O/cartao-480.avif"
ffmpeg -y -v error -i "$IN" -vf "$S480" -q:v $QJ4 -pix_fmt yuvj420p "$O/cartao-480.jpg"
falha=0
for par in "cartao.avif 120000" "cartao.jpg 200000" "cartao-480.avif 45000" "cartao-480.jpg 70000"; do
  set -- $par; b=$(wc -c < "$O/$1" | tr -d ' ')
  if [ "$b" -le "$2" ]; then s=ok; else s=ESTOUROU; falha=1; fi
  echo "$b bytes (limite $2) $s  $O/$1"
done
exit $falha
