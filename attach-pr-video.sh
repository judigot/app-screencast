#!/usr/bin/env bash
# Wrapper-only: record one admin Playwright test with video, convert to MP4,
# attach to a GitHub PR comment (inline player in the browser).
#
# Usage:
#   ./attach-pr-video.sh <pr-number> '<grep pattern>' [git-branch]
#
# Example (ABS-135):
#   ./attach-pr-video.sh 178 'blocks PIN login' feat/abs-135-inactive-washer-cannot-login
#
# Requires: gh >= 2.99, ffmpeg, docker, app on branch with the test.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$(cd "$ROOT/../app" && pwd)"
OUT="$ROOT/out"
PR="${1:?PR number required}"
GREP="${2:?Playwright -g pattern required}"
BRANCH="${3:-}"

export PATH="${HOME}/.local/bin:${PATH}"

log() { printf '\n==> %s\n' "$*"; }

# shellcheck disable=SC1091
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" --no-use
cd "$APP"
nvm use >/dev/null

mkdir -p "$OUT"
fuser -k 3001/tcp 2>/dev/null || true

ORIGINAL_BRANCH="$(git -C "$APP" branch --show-current)"
if [[ -n "$BRANCH" ]]; then
  git -C "$APP" checkout "$BRANCH"
fi

log "Postgres + e2e DB"
docker compose -f "$APP/compose.yaml" up -d --wait postgres
if ! docker compose -f "$APP/compose.yaml" exec -T postgres psql -U mycarwash -d mycarwash_dev -tAc \
  "SELECT 1 FROM pg_database WHERE datname = 'mycarwash_e2e'" | grep -q 1; then
  docker compose -f "$APP/compose.yaml" exec -T postgres psql -U mycarwash -d mycarwash_dev -c \
    "CREATE DATABASE mycarwash_e2e;"
fi

cd "$APP"
pnpm e2e:bootstrap

log "Record Playwright video (admin, grep: $GREP)"
set -a
# shellcheck disable=SC1091
. "$APP/.env.e2e"
set +a

rm -rf "$APP/test-results"
PW_RECORD_VIDEO=1 pnpm exec playwright test \
  -c "$APP/playwright.admin.config.ts" \
  -g "$GREP" \
  --project=chromium

WEBM="$(find "$APP/test-results" -name '*.webm' -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
if [[ -z "$WEBM" || ! -f "$WEBM" ]]; then
  echo "ERROR: no .webm under test-results" >&2
  exit 1
fi

MP4="$OUT/pr-${PR}-evidence.mp4"
log "Convert to H.264 MP4 for GitHub inline player"
ffmpeg -y -i "$WEBM" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "$MP4"

BODY_FILE="$(mktemp)"
cat >"$BODY_FILE" <<EOF
**PR evidence (video)** — click Play below.

Recorded from admin E2E: \`$GREP\`
EOF

log "Attach to GitHub PR #$PR (inline video player)"
gh pr comment "$PR" --body-file "$BODY_FILE" --attach "$MP4"
rm -f "$BODY_FILE"

if [[ -n "$BRANCH" && "$ORIGINAL_BRANCH" != "$BRANCH" ]]; then
  git -C "$APP" checkout "$ORIGINAL_BRANCH"
fi

fuser -k 3001/tcp 2>/dev/null || true
log "Done: $MP4"
