#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"

use_node_from_package "$ROOT"
initialize_screencast_run "$ROOT" "pointer"
export_screencast_env "$ROOT"
trap cleanup_screencast_work EXIT

OUT="${EVIDENCE_OUTPUT_PATH:-$SCREENCAST_DEFAULT_OUTPUT}"
WORK="$SCREENCAST_WORK_DIR"
mkdir -p "$(dirname "$OUT")"

export EVIDENCE_VIDEO_WIDTH="${EVIDENCE_VIDEO_WIDTH:-1920}"
export EVIDENCE_VIDEO_HEIGHT="${EVIDENCE_VIDEO_HEIGHT:-1080}"
export EVIDENCE_SCREencast_QUALITY="${EVIDENCE_SCREencast_QUALITY:-100}"
export EVIDENCE_RECORD_MS="${EVIDENCE_RECORD_MS:-10000}"
export EVIDENCE_CURSOR_SIZE="${EVIDENCE_CURSOR_SIZE:-56}"
export EVIDENCE_ZOOM="${EVIDENCE_ZOOM:-0}"
export EVIDENCE_OUTPUT_FPS="${EVIDENCE_OUTPUT_FPS:-60}"

pnpm exec playwright test -c "$ROOT/playwright.pointer.config.ts" --project=chromium

WEBM="$(find "$SCREENCAST_RESULTS_DIR" -name 'pointer-demo.webm' | head -1)"
[[ -n "$WEBM" ]] || { echo "missing pointer-demo.webm in $SCREENCAST_RESULTS_DIR" >&2; exit 1; }

transcode_screencast_video "$WEBM" "$WORK/out.mp4" "$EVIDENCE_OUTPUT_FPS" slow 8
mv "$WORK/out.mp4" "$OUT"

printf '\nDone: %s (run=%s, cursor=%spx)\n' "$OUT" "$SCREENCAST_RUN_ID" "$EVIDENCE_CURSOR_SIZE"
