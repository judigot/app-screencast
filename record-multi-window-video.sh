#!/usr/bin/env bash
# Two Playwright browser contexts (YouTube cats / dogs), 3 window switches.
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

log "Record multi-context demo (YouTube cats <-> dogs, 3 switches, fake arrow + labels, run=$SCREENCAST_RUN_ID)"

pnpm exec playwright test -c "$ROOT/playwright.multi-window.config.ts" --project=chromium

mapfile -t PARTS < <(
  find "$SCREENCAST_RESULTS_DIR" -type f \(     -name '01-youtube-cats.webm' -o     -name '02-youtube-dogs.webm' -o     -name '03-youtube-cats-retained.webm' -o     -name '04-youtube-dogs-retained.webm'   \) | sort
)

if [[ "${#PARTS[@]}" -ne 4 ]]; then
  echo "ERROR: expected 4 segment webms in $SCREENCAST_RESULTS_DIR, got ${#PARTS[@]}:" >&2
  printf '  %s\n' "${PARTS[@]}" >&2
  exit 1
fi

log "Concat ${#PARTS[@]} segments -> MP4"
N="${#PARTS[@]}"
INPUTS=()
FILTER=""
for i in "${!PARTS[@]}"; do
  INPUTS+=(-i "${PARTS[$i]}")
  FILTER+="[${i}:v]"
done
FILTER+="concat=n=${N}:v=1:a=0[v]"

ffmpeg -y "${INPUTS[@]}" -filter_complex "$FILTER" -map "[v]"   -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "$WORK/merged.mp4"
mv "$WORK/merged.mp4" "$OUT"

log "Done: $OUT (run=$SCREENCAST_RUN_ID)"
