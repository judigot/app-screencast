#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"
OUT="${HOME}/test-pointer.mp4"
WORK="$(mktemp -d)"

use_node_from_package "$ROOT"
export_screencast_env "$ROOT"

export EVIDENCE_VIDEO_WIDTH="${EVIDENCE_VIDEO_WIDTH:-1920}"
export EVIDENCE_VIDEO_HEIGHT="${EVIDENCE_VIDEO_HEIGHT:-1080}"
export EVIDENCE_SCREencast_QUALITY="${EVIDENCE_SCREencast_QUALITY:-100}"
export EVIDENCE_RECORD_MS="${EVIDENCE_RECORD_MS:-10000}"
export EVIDENCE_CURSOR_SIZE="${EVIDENCE_CURSOR_SIZE:-56}"
export EVIDENCE_ZOOM="${EVIDENCE_ZOOM:-0}"
export EVIDENCE_OUTPUT_FPS="${EVIDENCE_OUTPUT_FPS:-60}"

rm -rf "$ROOT/test-results"
pnpm exec playwright test -c "$ROOT/playwright.pointer.config.ts" --project=chromium

WEBM="$(find "$ROOT/test-results" -name 'pointer-demo.webm' | head -1)"
[[ -n "$WEBM" ]] || { echo "missing pointer-demo.webm" >&2; exit 1; }

ffmpeg -y -i "$WEBM" -vf "fps=${EVIDENCE_OUTPUT_FPS}" -t 10 \
  -c:v libx264 -preset slow -crf 8 -pix_fmt yuv420p -movflags +faststart -an "$WORK/out.mp4"
mv "$WORK/out.mp4" "$OUT"
rm -rf "$WORK"
printf '\nDone: %s (cursor %spx)\n' "$OUT" "$EVIDENCE_CURSOR_SIZE"
