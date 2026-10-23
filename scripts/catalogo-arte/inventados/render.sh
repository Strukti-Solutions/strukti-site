#!/bin/sh
# uso: render.sh [slug ...]   (sem argumentos: os 7)
# Fotografa cada slug em cur/<slug>.png (800 x 1200), um Edge por vez (kit/shot.sh), e roda as sondas do kit.
# Rode de dentro desta pasta. Mudanças extras pela consulta: EXTRA='&ledK=0' render.sh placar-conectado
cd "$(dirname "$0")" || exit 1
SLUGS="$*"; [ -n "$SLUGS" ] || SLUGS="placar-conectado totem-check-in contador-de-fluxo agenda-de-quadras estoque-oficinas site-clinicas vitrine-lojas"
falha=0
for s in $SLUGS; do
  echo "== $s"
  ../kit/shot.sh "cartao.html?slug=$s$EXTRA" "cur/$s.png" 800 1200 | grep -v "task_manager\|^$"
  SLUG=$s node ../kit/sondas.js . "cur/$s.png" || falha=1
done
exit $falha
