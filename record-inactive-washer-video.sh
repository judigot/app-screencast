#!/usr/bin/env bash
# Wrapper: two screencast segments (admin + washer) → one ~/test-video.mp4
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"
APP="$(resolve_screencast_app_dir "$ROOT")"
OUT="${HOME}/test-video.mp4"
WORK="$(mktemp -d)"

log() { printf '\n==> %s\n' "$*"; }

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

use_node_from_app "$APP"
export_screencast_env "$ROOT"
export SCREENCAST_APP_DIR="$APP"
export EVIDENCE_APP_DIR="$APP"

fuser -k 3001/tcp 2>/dev/null || true

log "Postgres + e2e DB"
docker compose -f "$APP/compose.yaml" up -d --wait postgres
if ! docker compose -f "$APP/compose.yaml" exec -T postgres psql -U mycarwash -d mycarwash_dev -tAc \
  "SELECT 1 FROM pg_database WHERE datname = 'mycarwash_e2e'" | grep -q 1; then
  docker compose -f "$APP/compose.yaml" exec -T postgres psql -U mycarwash -d mycarwash_dev -c \
    "CREATE DATABASE mycarwash_e2e;"
fi

cd "$APP"
pnpm e2e:bootstrap

log "Record inactive-washer demo (fake arrow, admin window → washer window)"
set -a
# shellcheck disable=SC1091
. "$APP/.env.e2e"
set +a

rm -rf "$ROOT/test-results"
use_node_from_package "$ROOT"
EVIDENCE_NATIVE_CURSOR=0 \
  EVIDENCE_VIDEO_SPEC="video-demo-inactive-washer.spec.ts" \
  pnpm exec playwright test -c "$ROOT/playwright.video.config.ts" --project=chromium

ADMIN="$(find "$ROOT/test-results" -name '01-admin-marks-inactive.webm' | head -1)"
WASHER="$(find "$ROOT/test-results" -name '02-washer-login-blocked.webm' | head -1)"
if [[ -z "$ADMIN" || -z "$WASHER" ]]; then
  echo "ERROR: missing segment webm (admin=$ADMIN washer=$WASHER)" >&2
  exit 1
fi

log "Concat segments → MP4"
ffmpeg -y -i "$ADMIN" -i "$WASHER" \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "$WORK/merged.mp4"
mv "$WORK/merged.mp4" "$OUT"

fuser -k 3001/tcp 2>/dev/null || true
log "Done: $OUT (admin segment + washer segment)"
