#!/bin/sh
# finpv.sh [sizes...] -> review/final2-pv-*.jpg, com a mídia publicada (public/hero/expansao)
# tamanhos: c1440x900 (recolhido), e1440x900 (expandido), m390x844 etc. (um fin2-pvm-<tam>.html por tamanho)
S="$(cd "$(dirname "$0")" && pwd)"; cd "$S"; mkdir -p fpv review
for s in "$@"; do k=${s%%[0-9]*}; wh=${s#?}; W=${wh%x*}; H=${wh#*x}; WW=$W; [ $W -lt 520 ] && WW=520
  case $k in c) page=fin2-preview-collapsed.html;; e) page=fin2-preview-expanded.html;; m) page=fin2-pvm-$wh.html;; esac
  ./shot.sh $page "fpv/$s.png" $WW $H >/dev/null 2>&1
  if [ $W -gt 960 ]; then ffmpeg -y -v error -i "fpv/$s.png" -vf "crop=$W:$H:0:0,scale=960:-1" -q:v 3 "review/final2-pv-$s.jpg"; else ffmpeg -y -v error -i "fpv/$s.png" -vf "crop=$W:$H:0:0" -q:v 3 "review/final2-pv-$s.jpg"; fi
  echo "review/final2-pv-$s.jpg"
done
