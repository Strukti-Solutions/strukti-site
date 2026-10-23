#!/bin/sh
# encode.sh <master.mkv> <pasta de saída> <crf do MP4> <crf do WebM> <nome>   (nome: midia ou midia-retrato)
# Os números do hero (16/10/2026): MP4 H.264 crf 20 e WebM VP9 crf 10 (de 16 para cima, o VP9 repetia quadros do vapor).
# Saem os quadros 0 a 249 do master (o 250 é igual ao 0: o loop do <video> emenda o 249 no 0).
M=$1; O=$2; N=$5; mkdir -p "$O"
VF="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
ffmpeg -y -v error -i "$M" -frames:v 250 -vf "$VF" -c:v libx264 -crf $3 -preset slow -tune film -colorspace bt709 -color_range tv -movflags +faststart -an "$O/$N.mp4"
ffmpeg -y -v error -i "$M" -frames:v 250 -vf "$VF" -c:v libvpx-vp9 -crf $4 -b:v 0 -g 250 -deadline good -cpu-used 1 -row-mt 1 -auto-alt-ref 1 -lag-in-frames 25 -colorspace bt709 -color_range tv -an "$O/$N.webm"
ls -la "$O/$N.mp4" "$O/$N.webm" | awk '{print $5, $9}'
