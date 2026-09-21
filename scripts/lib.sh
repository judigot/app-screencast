#!/usr/bin/env bash
# Shared helpers for record-*.sh wrappers.

resolve_screencast_app_dir() {
  local root="$1"
  if [[ -n "${SCREENCAST_APP_DIR:-}" ]]; then
    printf '%s' "$SCREENCAST_APP_DIR"
    return 0
  fi
  if [[ -d "$root/../app" ]]; then
    cd "$root/../app" && pwd
    return 0
  fi
  echo "Set SCREENCAST_APP_DIR to your app root (dev server + e2e setup)." >&2
  return 1
}

use_node_from_dir() {
  local dir="$1"
  export PATH="${HOME}/.local/bin:${PATH}"
  cd "$dir"

  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$nvm_dir/nvm.sh" ]]; then
    export NVM_DIR="$nvm_dir"
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh" --no-use
    if [[ -f .nvmrc ]]; then
      nvm use >/dev/null
    fi
  elif ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required. Install the version declared by the package before recording." >&2
    return 1
  fi
}

use_node_from_app() {
  use_node_from_dir "$1"
}

use_node_from_package() {
  use_node_from_dir "$1"
}

initialize_screencast_run() {
  local root="$1"
  local name="${2:-recording}"
  local generated_id

  generated_id="${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}-${GITHUB_JOB:-job}-$$-${RANDOM}"
  export SCREENCAST_RUN_ID="${SCREENCAST_RUN_ID:-$generated_id}"

  local run_root="${SCREENCAST_RUN_ROOT:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/app-screencast-runs}"
  export SCREENCAST_RUN_DIR="${SCREENCAST_RUN_DIR:-$run_root/$SCREENCAST_RUN_ID}"
  export SCREENCAST_RESULTS_DIR="${SCREENCAST_RESULTS_DIR:-$SCREENCAST_RUN_DIR/test-results}"
  export SCREENCAST_WORK_DIR="${SCREENCAST_WORK_DIR:-$SCREENCAST_RUN_DIR/work}"
  export SCREENCAST_OUTPUT_DIR="${SCREENCAST_OUTPUT_DIR:-$SCREENCAST_RUN_DIR/artifacts}"

  mkdir -p "$SCREENCAST_RESULTS_DIR" "$SCREENCAST_WORK_DIR" "$SCREENCAST_OUTPUT_DIR"
  export SCREENCAST_DEFAULT_OUTPUT="$SCREENCAST_OUTPUT_DIR/$name.mp4"
  export SCREENCAST_DIR="$root"
}

cleanup_screencast_work() {
  if [[ -n "${SCREENCAST_WORK_DIR:-}" && -d "$SCREENCAST_WORK_DIR" ]]; then
    rm -rf "$SCREENCAST_WORK_DIR"
  fi
}

export_screencast_env() {
  local root="$1"
  export SCREENCAST_DIR="$root"
  export SCREENCAST_RESULTS_DIR="${SCREENCAST_RESULTS_DIR:-$root/test-results}"
}
