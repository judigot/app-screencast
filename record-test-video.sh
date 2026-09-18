#!/usr/bin/env bash
# Wrapper-only: record mcw-app UI demo with visible cursor → ~/test-video.mp4
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"
APP="$(resolve_screencast_app_dir "$ROOT")"
OUT="${HOME}/test-video.mp4"

log() { printf '\n==> %s\n' "$*"; }

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

if [[ "${EVIDENCE_NATIVE_CURSOR:-0}" == "1" ]]; then
  log "Record mcw-app video (native browser cursor — no fake arrow)"
else
  log "Record mcw-app video (admin login → customer search, fake black arrow)"
fi
set -a
# shellcheck disable=SC1091
. "$APP/.env.e2e"
set +a

rm -rf "$ROOT/test-results"
use_node_from_package "$ROOT"
EVIDENCE_NATIVE_CURSOR="${EVIDENCE_NATIVE_CURSOR:-0}" \
  pnpm exec playwright test -c "$ROOT/playwright.video.config.ts" --project=chromium

WEBM="$(find "$ROOT/test-results" -name '*.webm' -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
if [[ -z "$WEBM" || ! -f "$WEBM" ]]; then
  echo "ERROR: no .webm under test-results" >&2
  exit 1
fi

log "Convert to H.264 MP4 → $OUT"
ffmpeg -y -i "$WEBM" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "$OUT"

fuser -k 3001/tcp 2>/dev/null || true
log "Done: $OUT"
