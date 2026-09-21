#!/usr/bin/env bash
# Two public browser contexts, recorded as four retained-context segments.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"

log() { printf '\n==> %s\n' "$*"; }

use_node_from_package "$ROOT"
initialize_screencast_run "$ROOT" "multi-window"
export_screencast_env "$ROOT"
trap cleanup_screencast_work EXIT

OUT="${EVIDENCE_OUTPUT_PATH:-$SCREENCAST_DEFAULT_OUTPUT}"
WORK="$SCREENCAST_WORK_DIR"
mkdir -p "$(dirname "$OUT")"

log "Record retained-context demo (IANA <-> Wikipedia, 3 switches, fake arrow + labels, run=$SCREENCAST_RUN_ID)"

"$ROOT/node_modules/.bin/playwright" test -c "$ROOT/playwright.multi-window.config.ts" --project=chromium

PARTS=()
for name in \
  01-example.webm \
  02-wikipedia.webm \
  03-example-retained.webm \
  04-wikipedia-retained.webm
do
  part="$(find "$SCREENCAST_RESULTS_DIR" -type f -name "$name" -print -quit)"
  if [[ -z "$part" ]]; then
    echo "ERROR: missing segment $name in $SCREENCAST_RESULTS_DIR" >&2
    exit 1
  fi
  PARTS+=("$part")
done

log "Concat ${#PARTS[@]} segments -> MP4"
N="${#PARTS[@]}"
INPUTS=()
FILTER=""
for i in "${!PARTS[@]}"; do
  INPUTS+=(-i "${PARTS[$i]}")
  FILTER+="[${i}:v]"
done
FILTER+="concat=n=${N}:v=1:a=0[v]"

ffmpeg -hide_banner -loglevel error -y "${INPUTS[@]}" \
  -filter_complex "$FILTER" -map "[v]" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "$WORK/merged.mp4"
mv "$WORK/merged.mp4" "$OUT"

log "Done: $OUT (run=$SCREENCAST_RUN_ID)"
