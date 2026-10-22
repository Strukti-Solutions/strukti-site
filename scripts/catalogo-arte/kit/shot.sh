#!/bin/sh
# uso: shot.sh <html[?consulta]> <png> <largura> <altura>
# Fotografa a página num Edge sem janela (adaptado de scripts/hero-expansao/shot.sh): UM Edge por vez,
# flags de pouca memória e, no fim, fecha só os processos do Edge com o perfil desta pasta (kit/prof).
# Os caminhos são relativos à pasta atual (rode de dentro da pasta da cena, ex.: cd ../replay).
K="$(cd "$(dirname "$0")" && pwd)"; KW=$(cygpath -w "$K")
H="${1%%\?*}"; Q=""; case "$1" in *\?*) Q="?${1#*\?}";; esac
[ -f "$H" ] || { echo "html inexistente: $H" >&2; exit 1; }
mkdir -p "$(dirname "$2")"
HA="$(cd "$(dirname "$H")" && pwd)/$(basename "$H")"; OA="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
timeout 150 "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=$3,$4 --virtual-time-budget=3000 --user-data-dir="$KW\prof" \
  --no-first-run --disable-extensions --disable-sync --disable-background-networking \
  --disable-component-update --disable-features=Translate,OptimizationHints,MediaRouter,EdgeCollections \
  --renderer-process-limit=1 --js-flags=--max-old-space-size=384 \
  --screenshot="$(cygpath -w "$OA")" "file:///$(cygpath -m "$HA")$Q" 2>&1 | grep -v -i "devtools\|^$\|written to file" | tail -3
# limpeza: fecha só os msedge que usam o perfil desta pasta
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { \$_.CommandLine -like '*catalogo-arte*kit*prof*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" 2>/dev/null
ls -la "$OA" 2>/dev/null | awk '{print $5, $9}'
