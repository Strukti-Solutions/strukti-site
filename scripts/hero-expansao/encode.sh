#!/bin/sh
# encode.sh <master.mkv> <outdir> <mp4crf> <webmcrf>
# Mídia publicada (16/10/2026): MP4 crf 20 e WebM crf 10 (de 16 para cima, o VP9 ainda repetia quadros do vapor).
M=$1; O=$2; mkdir -p "$O"
VF="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
ffmpeg -y -v error -i "$M" -frames:v 250 -vf "$VF" -c:v libx264 -crf $3 -preset slow -tune film -colorspace bt709 -color_range tv -movflags +faststart -an "$O/midia.mp4"
ffmpeg -y -v error -i "$M" -frames:v 250 -vf "$VF" -c:v libvpx-vp9 -crf $4 -b:v 0 -g 250 -deadline good -cpu-used 1 -row-mt 1 -auto-alt-ref 1 -lag-in-frames 25 -colorspace bt709 -color_range tv -an "$O/midia.webm"
ls -la "$O/midia.mp4" "$O/midia.webm" | awk '{print $5, $9}'
