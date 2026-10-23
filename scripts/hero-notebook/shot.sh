#!/bin/sh
# usage: shot.sh <html> <png> <w> <h>
# One headless Edge at a time, low-memory flags, then kill anything left on this profile.
S="$(cd "$(dirname "$0")" && pwd)"; W=$(cygpath -w "$S")
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
timeout 150 "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=$3,$4 --virtual-time-budget=3000 --user-data-dir="$W\\prof" \
  --no-first-run --disable-extensions --disable-sync --disable-background-networking \
  --disable-component-update --disable-features=Translate,OptimizationHints,MediaRouter,EdgeCollections \
  --renderer-process-limit=1 --js-flags=--max-old-space-size=384 \
  --screenshot="$(cygpath -w "$S/$2")" "file:///$(cygpath -m "$S/$1")" 2>&1 | grep -v -i "devtools\|^$\|written to file" | tail -3
# cleanup: kill only msedge processes that use this profile dir
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { \$_.CommandLine -like '*hero-notebook*prof*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" 2>/dev/null
ls -la "$S/$2" 2>/dev/null | awk '{print $5, $9}'
