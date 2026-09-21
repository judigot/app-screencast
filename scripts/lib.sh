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

screencast_safe_component() {
  local value="$1"
  value="${value//[^[:alnum:]._-]/-}"
  [[ -n "$value" ]] || value="recording"
  printf '%s' "$value"
}

reserve_screencast_output_path() {
  [[ -n "${EVIDENCE_OUTPUT_PATH:-}" ]] || return 0

  local output_dir lock_dir
  output_dir="$(dirname "$EVIDENCE_OUTPUT_PATH")"
  mkdir -p "$output_dir"

  if [[ -e "$EVIDENCE_OUTPUT_PATH" ]]; then
    echo "Explicit output path already exists: $EVIDENCE_OUTPUT_PATH" >&2
    return 1
  fi

  lock_dir="${EVIDENCE_OUTPUT_PATH}.app-screencast.lock"
  if ! mkdir "$lock_dir" 2>/dev/null; then
    echo "Explicit output path is already reserved by another recording: $EVIDENCE_OUTPUT_PATH" >&2
    return 1
  fi

  export SCREENCAST_OUTPUT_LOCK_DIR="$lock_dir"
}

initialize_screencast_run() {
  local root="$1"
  local name="${2:-recording}"
  local generated_batch inherited_run_id batch_id safe_batch safe_name prefix
  local run_parent results_parent work_parent output_parent

  if [[ "${SCREENCAST_INITIALIZED_PID:-}" = "$$" ]]; then
    echo "Screencast run already initialized in this process." >&2
    return 1
  fi

  generated_batch="${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}-${GITHUB_JOB:-job}"
  inherited_run_id="${SCREENCAST_RUN_ID:-}"
  batch_id="${SCREENCAST_BATCH_ID:-${inherited_run_id:-$generated_batch}}"
  safe_batch="$(screencast_safe_component "$batch_id")"
  safe_name="$(screencast_safe_component "$name")"
  prefix="${safe_batch}-${safe_name}"

  run_parent="${SCREENCAST_RUN_DIR:-${SCREENCAST_RUN_ROOT:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/app-screencast-runs}}"
  results_parent="${SCREENCAST_RESULTS_DIR:-}"
  work_parent="${SCREENCAST_WORK_DIR:-}"
  output_parent="${SCREENCAST_OUTPUT_DIR:-}"

  reserve_screencast_output_path || return 1

  mkdir -p "$run_parent"
  export SCREENCAST_RUN_DIR
  SCREENCAST_RUN_DIR="$(mktemp -d "$run_parent/${prefix}.XXXXXX")"
  export SCREENCAST_RUN_ID="$(basename "$SCREENCAST_RUN_DIR")"
  export SCREENCAST_BATCH_ID="$batch_id"

  if [[ -n "$results_parent" ]]; then
    mkdir -p "$results_parent"
    export SCREENCAST_RESULTS_DIR
    SCREENCAST_RESULTS_DIR="$(mktemp -d "$results_parent/${prefix}.results.XXXXXX")"
  else
    export SCREENCAST_RESULTS_DIR="$SCREENCAST_RUN_DIR/test-results"
    mkdir -p "$SCREENCAST_RESULTS_DIR"
  fi

  if [[ -n "$work_parent" ]]; then
    mkdir -p "$work_parent"
    export SCREENCAST_WORK_DIR
    SCREENCAST_WORK_DIR="$(mktemp -d "$work_parent/${prefix}.work.XXXXXX")"
  else
    export SCREENCAST_WORK_DIR="$SCREENCAST_RUN_DIR/work"
    mkdir -p "$SCREENCAST_WORK_DIR"
  fi

  if [[ -n "$output_parent" ]]; then
    mkdir -p "$output_parent"
    export SCREENCAST_OUTPUT_DIR
    SCREENCAST_OUTPUT_DIR="$(mktemp -d "$output_parent/${prefix}.artifacts.XXXXXX")"
  else
    export SCREENCAST_OUTPUT_DIR="$SCREENCAST_RUN_DIR/artifacts"
    mkdir -p "$SCREENCAST_OUTPUT_DIR"
  fi

  export SCREENCAST_WORK_OWNER_MARKER="$SCREENCAST_WORK_DIR/.app-screencast-owned"
  : > "$SCREENCAST_WORK_OWNER_MARKER"
  export SCREENCAST_DEFAULT_OUTPUT="$SCREENCAST_OUTPUT_DIR/$safe_name.mp4"
  export SCREENCAST_DIR="$root"
  export SCREENCAST_INITIALIZED_PID="$$"
}

cleanup_screencast_work() {
  if [[ -n "${SCREENCAST_WORK_DIR:-}" && -n "${SCREENCAST_WORK_OWNER_MARKER:-}" && \
        "$SCREENCAST_WORK_OWNER_MARKER" = "$SCREENCAST_WORK_DIR/.app-screencast-owned" && \
        -f "$SCREENCAST_WORK_OWNER_MARKER" ]]; then
    rm -rf -- "$SCREENCAST_WORK_DIR"
  fi

  if [[ -n "${SCREENCAST_OUTPUT_LOCK_DIR:-}" && -d "$SCREENCAST_OUTPUT_LOCK_DIR" ]]; then
    rmdir -- "$SCREENCAST_OUTPUT_LOCK_DIR" 2>/dev/null || true
  fi
}

transcode_screencast_video() {
  local input="$1"
  local output="$2"
  local fps="${3:-60}"
  local preset="${4:-slow}"
  local crf="${5:-8}"

  ffmpeg -hide_banner -loglevel error -y -i "$input" \
    -vf "fps=${fps}" \
    -c:v libx264 -preset "$preset" -crf "$crf" \
    -pix_fmt yuv420p -movflags +faststart -an "$output"
}

export_screencast_env() {
  local root="$1"
  export SCREENCAST_DIR="$root"
  export SCREENCAST_RESULTS_DIR="${SCREENCAST_RESULTS_DIR:-$root/test-results}"
}
