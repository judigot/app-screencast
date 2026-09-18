#!/usr/bin/env bash
# 1080p screencast (max JPEG quality) → H.264 MP4 at 60fps, exactly 10s
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"
OUT="${HOME}/test-hq-10s.mp4"
WORK="$(mktemp -d)"

log() { printf '\n==> %s\n' "$*"; }

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

use_node_from_package "$ROOT"
export_screencast_env "$ROOT"

export EVIDENCE_VIDEO_WIDTH="${EVIDENCE_VIDEO_WIDTH:-1920}"
export EVIDENCE_VIDEO_HEIGHT="${EVIDENCE_VIDEO_HEIGHT:-1080}"
export EVIDENCE_SCREencast_QUALITY="${EVIDENCE_SCREencast_QUALITY:-100}"
export EVIDENCE_RECORD_MS="${EVIDENCE_RECORD_MS:-10000}"
export EVIDENCE_OUTPUT_FPS="${EVIDENCE_OUTPUT_FPS:-60}"
export EVIDENCE_OUTPUT_CRF="${EVIDENCE_OUTPUT_CRF:-8}"
export EVIDENCE_OUTPUT_PRESET="${EVIDENCE_OUTPUT_PRESET:-slow}"

log "Record ${EVIDENCE_VIDEO_WIDTH}x${EVIDENCE_VIDEO_HEIGHT} screencast (quality=${EVIDENCE_SCREencast_QUALITY}, ${EVIDENCE_RECORD_MS}ms)"
rm -rf "$ROOT/test-results"

pnpm exec playwright test -c "$ROOT/playwright.hq.config.ts" --project=chromium

WEBM="$(find "$ROOT/test-results" -name 'hq-10s.webm' | head -1)"
if [[ -z "$WEBM" ]]; then
  echo "ERROR: missing hq-10s.webm" >&2
  exit 1
fi

log "Encode → ${EVIDENCE_OUTPUT_FPS}fps H.264 (crf=${EVIDENCE_OUTPUT_CRF}, preset=${EVIDENCE_OUTPUT_PRESET}, -t 10)"
# Playwright pipes ~25fps JPEG frames into WebM; we upsample to 60fps CFR for delivery.
ffmpeg -y -i "$WEBM" \
  -vf "fps=${EVIDENCE_OUTPUT_FPS}" \
  -t 10 \
  -c:v libx264 -preset "${EVIDENCE_OUTPUT_PRESET}" -crf "${EVIDENCE_OUTPUT_CRF}" \
  -pix_fmt yuv420p -movflags +faststart -an "$WORK/out.mp4"
mv "$WORK/out.mp4" "$OUT"

log "Done: $OUT (${EVIDENCE_VIDEO_WIDTH}x${EVIDENCE_VIDEO_HEIGHT}, ${EVIDENCE_OUTPUT_FPS}fps, 10s)"
