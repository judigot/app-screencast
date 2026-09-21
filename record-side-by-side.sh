#!/usr/bin/env bash
# Two browser contexts recorded in parallel -> single side-by-side MP4.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"

log() { printf '\n==> %s\n' "$*"; }

use_node_from_package "$ROOT"
initialize_screencast_run "$ROOT" "side-by-side"
export_screencast_env "$ROOT"
trap cleanup_screencast_work EXIT

OUT="${EVIDENCE_OUTPUT_PATH:-$SCREENCAST_DEFAULT_OUTPUT}"
WORK="$SCREENCAST_WORK_DIR"
mkdir -p "$(dirname "$OUT")"

export EVIDENCE_PANEL_WIDTH="${EVIDENCE_PANEL_WIDTH:-960}"
export EVIDENCE_PANEL_HEIGHT="${EVIDENCE_PANEL_HEIGHT:-1080}"
export EVIDENCE_SCREencast_QUALITY="${EVIDENCE_SCREencast_QUALITY:-100}"
export EVIDENCE_RECORD_MS="${EVIDENCE_RECORD_MS:-10000}"
export EVIDENCE_OUTPUT_FPS="${EVIDENCE_OUTPUT_FPS:-60}"
export EVIDENCE_OUTPUT_CRF="${EVIDENCE_OUTPUT_CRF:-10}"
export EVIDENCE_OUTPUT_PRESET="${EVIDENCE_OUTPUT_PRESET:-slow}"

TOTAL_W=$((EVIDENCE_PANEL_WIDTH * 2))
TOTAL_H=$EVIDENCE_PANEL_HEIGHT

log "Record two panels ${EVIDENCE_PANEL_WIDTH}x${EVIDENCE_PANEL_HEIGHT} -> ${TOTAL_W}x${TOTAL_H} side by side (run=$SCREENCAST_RUN_ID)"

pnpm exec playwright test -c "$ROOT/playwright.side-by-side.config.ts" --project=chromium

LEFT="$(find "$SCREENCAST_RESULTS_DIR" -name 'panel-cats.webm' | head -1)"
RIGHT="$(find "$SCREENCAST_RESULTS_DIR" -name 'panel-dogs.webm' | head -1)"
if [[ -z "$LEFT" || -z "$RIGHT" ]]; then
  echo "ERROR: missing panel webm in $SCREENCAST_RESULTS_DIR (left=$LEFT right=$RIGHT)" >&2
  exit 1
fi

log "Stack full captured duration horizontally + H.264 ${EVIDENCE_OUTPUT_FPS}fps"
ffmpeg -y -i "$LEFT" -i "$RIGHT"   -filter_complex "[0:v]fps=${EVIDENCE_OUTPUT_FPS}[L];[1:v]fps=${EVIDENCE_OUTPUT_FPS}[R];[L][R]hstack=inputs=2:shortest=0[v]"   -map "[v]"   -c:v libx264 -preset "${EVIDENCE_OUTPUT_PRESET}" -crf "${EVIDENCE_OUTPUT_CRF}"   -pix_fmt yuv420p -movflags +faststart -an "$WORK/out.mp4"
mv "$WORK/out.mp4" "$OUT"

log "Done: $OUT (${TOTAL_W}x${TOTAL_H}, delivery=${EVIDENCE_OUTPUT_FPS}fps, run=$SCREENCAST_RUN_ID)"
