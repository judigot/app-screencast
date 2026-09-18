#!/usr/bin/env bash
# Wrapper-only: capture PR evidence screenshots. Does not commit into app/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$(cd "$ROOT/../app" && pwd)"
OUT="$ROOT/out"

# shellcheck disable=SC1091
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" --no-use
cd "$APP"
nvm use >/dev/null

mkdir -p "$OUT"
rm -f "$OUT"/*.png

log() { printf '\n==> %s\n' "$*"; }

log "Starting Postgres"
docker compose -f "$APP/compose.yaml" up -d --wait postgres

if ! docker compose -f "$APP/compose.yaml" exec -T postgres psql -U mycarwash -d mycarwash_dev -tAc \
  "SELECT 1 FROM pg_database WHERE datname = 'mycarwash_e2e'" | grep -q 1; then
  docker compose -f "$APP/compose.yaml" exec -T postgres psql -U mycarwash -d mycarwash_dev -c \
    "CREATE DATABASE mycarwash_e2e;"
fi

log "Bootstrap e2e database"
cd "$APP"
pnpm e2e:bootstrap

log "Apply screenshot overlay"
docker compose -f "$APP/compose.yaml" exec -T postgres psql -U mycarwash -d mycarwash_e2e \
  < "$ROOT/overlay.sql"

ORIGINAL_BRANCH="$(git -C "$APP" branch --show-current)"

capture() {
  local pr="$1"
  local branch="$2"
  log "PR #$pr on $branch"
  fuser -k 3001/tcp 2>/dev/null || true
  git -C "$APP" checkout "$branch"
  cd "$APP"
  set -a
  # shellcheck disable=SC1091
  . "$APP/.env.e2e"
  set +a
  EVIDENCE_PR="$pr" EVIDENCE_DIR="$ROOT" EVIDENCE_APP_DIR="$APP" \
    pnpm exec playwright test \
    -c "$ROOT/playwright.config.ts" \
    --project=chromium
}

capture 172 feat/abs-121-optional-brand-required-markers
capture 173 feat/abs-125-display-car-color
capture 174 feat/abs-126-sort-jobs-by-bay
capture 175 feat/abs-129-overdue-invoice-label
capture 176 feat/abs-124-search-show-plates
capture 177 feat/abs-127-home-cleaner-card

fuser -k 3001/tcp 2>/dev/null || true
git -C "$APP" checkout "$ORIGINAL_BRANCH"

log "Screenshots in $OUT"
ls -l "$OUT"
