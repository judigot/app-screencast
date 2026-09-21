#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"

for script in "$ROOT"/record-*.sh "$ROOT"/scripts/*.sh; do
  bash -n "$script"
done

tmp="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp"
}
trap cleanup EXIT

export SCREENCAST_RUN_ROOT="$tmp/runs"
export NVM_DIR="$tmp/no-nvm"
use_node_from_package "$ROOT"
command -v node >/dev/null

export SCREENCAST_RUN_ID="foundation-a"
unset SCREENCAST_RUN_DIR SCREENCAST_RESULTS_DIR SCREENCAST_WORK_DIR SCREENCAST_OUTPUT_DIR SCREENCAST_DEFAULT_OUTPUT
initialize_screencast_run "$ROOT" "test-a"
a_run="$SCREENCAST_RUN_DIR"
a_results="$SCREENCAST_RESULTS_DIR"
a_output="$SCREENCAST_DEFAULT_OUTPUT"

export SCREENCAST_RUN_ID="foundation-b"
unset SCREENCAST_RUN_DIR SCREENCAST_RESULTS_DIR SCREENCAST_WORK_DIR SCREENCAST_OUTPUT_DIR SCREENCAST_DEFAULT_OUTPUT
initialize_screencast_run "$ROOT" "test-b"
b_run="$SCREENCAST_RUN_DIR"
b_results="$SCREENCAST_RESULTS_DIR"
b_output="$SCREENCAST_DEFAULT_OUTPUT"

[[ "$a_run" != "$b_run" ]]
[[ "$a_results" != "$b_results" ]]
[[ "$a_output" != "$b_output" ]]
[[ -d "$a_results" && -d "$b_results" ]]

if grep -R -n --include='record-*.sh' -- '-t 10' "$ROOT"; then
  echo "fixed ten-second export truncation is not allowed" >&2
  exit 1
fi

if grep -R -n --include='record-*.sh' -- 'rm -rf .*test-results' "$ROOT"; then
  echo "recording wrappers must not delete shared test-results" >&2
  exit 1
fi

printf 'Recording foundation checks passed.\n'
