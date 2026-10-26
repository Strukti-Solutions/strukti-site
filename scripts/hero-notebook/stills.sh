#!/bin/sh
# stills.sh <in.png> <out-base> <avif-crf> <jpg-q>
# AVIF de 8 bits (yuv420p, faixa cheia, bt709), como na mídia publicada (crf 11, 16/10/2026).
AVF="scale=out_color_matrix=bt709:out_range=pc,format=yuv420p"
ffmpeg -y -v error -i "$1" -vf "$AVF" -c:v libaom-av1 -still-picture 1 -crf $3 -b:v 0 -cpu-used 3 -colorspace bt709 -color_range pc "$2.avif"
ffmpeg -y -v error -i "$1" -q:v $4 -pix_fmt yuvj420p "$2.jpg"
ls -la "$2.avif" "$2.jpg" | awk '{print $5, $9}'
