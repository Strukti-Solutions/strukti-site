#!/bin/sh
# derive.sh <platesdir>: tiles.png -> A,B,C,D ; T=(B-A)*255/128, E=C-A, Lp=A-D
cd "$1" || exit 1
ffmpeg -y -v error -i tiles.png -filter_complex "[0]format=gbrp,split=4[a][b][c][d];[a]crop=1280:720:0:0[A];[b]crop=1280:720:1280:0[B];[c]crop=1280:720:0:720[C];[d]crop=1280:720:1280:720[D]" -map "[A]" A.png -map "[B]" B.png -map "[C]" C.png -map "[D]" D.png
ffmpeg -y -v error -i B.png -i A.png -filter_complex "[0]format=gbrp[b];[1]format=gbrp[a];[b][a]blend=all_expr='clip((A-B)*255/128,0,255)',format=rgb24" T.png
ffmpeg -y -v error -i C.png -i A.png -filter_complex "[0]format=gbrp[c];[1]format=gbrp[a];[c][a]blend=all_expr='clip(A-B,0,255)',format=rgb24" E.png
ffmpeg -y -v error -i A.png -i D.png -filter_complex "[0]format=gbrp[a];[1]format=gbrp[d];[a][d]blend=all_expr='clip(A-B,0,255)',format=rgb24" Lp.png
ls -la A.png B.png C.png D.png T.png E.png Lp.png | awk '{print $5, $9}'
