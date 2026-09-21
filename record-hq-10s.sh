#!/usr/bin/env bash
# 1080p screencast (max JPEG quality) -> H.264 MP4; default scenario records for at least 10s.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"

log() { printf '\n==> %s\n' "$*"; }

use_node_from_package "$ROOT"
initialize_screencast_run "$ROOT" "hq"
export_screencast_env "$ROOT"
trap cleanup_screencast_work EXIT

OUT="${EVIDENCE_OUTPUT_PATH:-$SCREENCAST_DEFAULT_OUTPUT}"
WORK="$SCREENCAST_WORK_DIR"
mkdir -p "$(dirname "$OUT")"

export EVIDENCE_VIDEO_WIDTH="${EVIDENCE_VIDEO_WIDTH:-1920}"
export EVIDENCE_VIDEO_HEIGHT="${EVIDENCE_VIDEO_HEIGHT:-1080}"
export EVIDENCE_SCREencast_QUALITY="${EVIDENCE_SCREencast_QUALITY:-100}"
export EVIDENCE_RECORD_MS="${EVIDENCE_RECORD_MS:-10000}"
export EVIDENCE_OUTPUT_FPS="${EVIDENCE_OUTPUT_FPS:-60}"
export EVIDENCE_OUTPUT_CRF="${EVIDENCE_OUTPUT_CRF:-8}"
export EVIDENCE_OUTPUT_PRESET="${EVIDENCE_OUTPUT_PRESET:-slow}"

log "Record ${EVIDENCE_VIDEO_WIDTH}x${EVIDENCE_VIDEO_HEIGHT} screencast (quality=${EVIDENCE_SCREencast_QUALITY}, minimum=${EVIDENCE_RECORD_MS}ms, run=$SCREENCAST_RUN_ID)"

pnpm exec playwright test -c "$ROOT/playwright.hq.config.ts" --project=chromium

WEBM="$(find "$SCREENCAST_RESULTS_DIR" -name 'hq-10s.webm' | head -1)"
if [[ -z "$WEBM" ]]; then
  echo "ERROR: missing hq-10s.webm in $SCREENCAST_RESULTS_DIR" >&2
  exit 1
fi

log "Encode full captured duration -> ${EVIDENCE_OUTPUT_FPS}fps H.264 (crf=${EVIDENCE_OUTPUT_CRF}, preset=${EVIDENCE_OUTPUT_PRESET})"
# Output FPS is delivery resampling; it does not establish the screencast capture FPS.
transcode_screencast_video "$WEBM" "$WORK/out.mp4" "$EVIDENCE_OUTPUT_FPS" "$EVIDENCE_OUTPUT_PRESET" "$EVIDENCE_OUTPUT_CRF"
mv "$WORK/out.mp4" "$OUT"

log "Done: $OUT (run=$SCREENCAST_RUN_ID)"
