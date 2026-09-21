#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${SHOWCASE_OUTPUT_DIR:-$ROOT/showcase-artifacts}"
mkdir -p "$OUT_DIR"

SIDE="$OUT_DIR/public-sites-side-by-side.mp4"
MULTI="$OUT_DIR/public-sites-multi-window.mp4"

rm -f -- "$SIDE" "$MULTI" "$SIDE.app-screencast.lock" "$MULTI.app-screencast.lock"

env \
  EVIDENCE_OUTPUT_PATH="$SIDE" \
  EVIDENCE_RECORD_MS="${EVIDENCE_RECORD_MS:-14000}" \
  EVIDENCE_OUTPUT_FPS="${EVIDENCE_OUTPUT_FPS:-60}" \
  EVIDENCE_ZOOM="${EVIDENCE_ZOOM:-1}" \
  bash "$ROOT/record-side-by-side.sh"

env \
  EVIDENCE_OUTPUT_PATH="$MULTI" \
  EVIDENCE_OUTPUT_FPS="${EVIDENCE_OUTPUT_FPS:-60}" \
  EVIDENCE_ZOOM="${EVIDENCE_ZOOM:-1}" \
  bash "$ROOT/record-multi-window-video.sh"

for video in "$SIDE" "$MULTI"; do
  test -s "$video"
  ffprobe -v error \
    -select_streams v:0 \
    -show_entries stream=codec_name,width,height,avg_frame_rate \
    -show_entries format=duration \
    -of json "$video" > "${video%.mp4}.ffprobe.json"
done

printf '%s\n%s\n' "$SIDE" "$MULTI"
