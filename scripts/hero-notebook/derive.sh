#!/bin/sh
# derive.sh <pasta dos passes> <W> <H>: tiles.png (mosaico A B / C D de W x H cada) -> A, B, C, D; T = (B - A) x 255/128,
# E = C - A (o LED) e Lp = A - D (o abajur). Deitado 1280 720 (plates2/), em pé 720 1280 (plates2-retrato/).
cd "$1" || exit 1
W=$2; H=$3
ffmpeg -y -v error -i tiles.png -filter_complex "[0]format=gbrp,split=4[a][b][c][d];[a]crop=$W:$H:0:0[A];[b]crop=$W:$H:$W:0[B];[c]crop=$W:$H:0:$H[C];[d]crop=$W:$H:$W:$H[D]" -map "[A]" A.png -map "[B]" B.png -map "[C]" C.png -map "[D]" D.png
ffmpeg -y -v error -i B.png -i A.png -filter_complex "[0]format=gbrp[b];[1]format=gbrp[a];[b][a]blend=all_expr='clip((A-B)*255/128,0,255)',format=rgb24" T.png
ffmpeg -y -v error -i C.png -i A.png -filter_complex "[0]format=gbrp[c];[1]format=gbrp[a];[c][a]blend=all_expr='clip(A-B,0,255)',format=rgb24" E.png
ffmpeg -y -v error -i A.png -i D.png -filter_complex "[0]format=gbrp[a];[1]format=gbrp[d];[a][d]blend=all_expr='clip(A-B,0,255)',format=rgb24" Lp.png
ls -la A.png B.png C.png D.png T.png E.png Lp.png | awk '{print $5, $9}'
