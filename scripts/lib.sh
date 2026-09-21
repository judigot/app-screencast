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

release_screencast_output_reservation() {
  if [[ -n "${SCREENCAST_OUTPUT_LOCK_DIR:-}" && -d "$SCREENCAST_OUTPUT_LOCK_DIR" ]]; then
    rmdir -- "$SCREENCAST_OUTPUT_LOCK_DIR" 2>/dev/null || true
  fi
  unset SCREENCAST_OUTPUT_LOCK_DIR
}

rollback_screencast_initialization() {
  local path
  for path in "$@"; do
    if [[ -n "$path" && -d "$path" ]]; then
      rm -rf -- "$path"
    fi
  done
  release_screencast_output_reservation
}

initialize_screencast_run() {
  local root="$1"
  local name="${2:-recording}"
  local generated_batch inherited_run_id batch_id safe_batch safe_name prefix
  local run_parent results_parent work_parent output_parent
  local run_dir="" results_dir="" work_dir="" output_dir="" work_owner_marker=""

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

  if ! mkdir -p "$run_parent"; then
    release_screencast_output_reservation
    return 1
  fi
  if ! run_dir="$(mktemp -d "$run_parent/${prefix}.XXXXXX")"; then
    release_screencast_output_reservation
    return 1
  fi

  if [[ -n "$results_parent" ]]; then
    if ! mkdir -p "$results_parent"; then
      rollback_screencast_initialization "$run_dir"
      return 1
    fi
    if ! results_dir="$(mktemp -d "$results_parent/${prefix}.results.XXXXXX")"; then
      rollback_screencast_initialization "$run_dir"
      return 1
    fi
  else
    results_dir="$run_dir/test-results"
    if ! mkdir -p "$results_dir"; then
      rollback_screencast_initialization "$run_dir"
      return 1
    fi
  fi

  if [[ -n "$work_parent" ]]; then
    if ! mkdir -p "$work_parent"; then
      rollback_screencast_initialization "$results_dir" "$run_dir"
      return 1
    fi
    if ! work_dir="$(mktemp -d "$work_parent/${prefix}.work.XXXXXX")"; then
      rollback_screencast_initialization "$results_dir" "$run_dir"
      return 1
    fi
  else
    work_dir="$run_dir/work"
    if ! mkdir -p "$work_dir"; then
      rollback_screencast_initialization "$results_dir" "$run_dir"
      return 1
    fi
  fi

  if [[ -n "$output_parent" ]]; then
    if ! mkdir -p "$output_parent"; then
      rollback_screencast_initialization "$work_dir" "$results_dir" "$run_dir"
      return 1
    fi
    if ! output_dir="$(mktemp -d "$output_parent/${prefix}.artifacts.XXXXXX")"; then
      rollback_screencast_initialization "$work_dir" "$results_dir" "$run_dir"
      return 1
    fi
  else
    output_dir="$run_dir/artifacts"
    if ! mkdir -p "$output_dir"; then
      rollback_screencast_initialization "$work_dir" "$results_dir" "$run_dir"
      return 1
    fi
  fi

  work_owner_marker="$work_dir/.app-screencast-owned"
  if ! : > "$work_owner_marker"; then
    rollback_screencast_initialization "$output_dir" "$work_dir" "$results_dir" "$run_dir"
    return 1
  fi

  export SCREENCAST_RUN_DIR="$run_dir"
  export SCREENCAST_RUN_ID="${run_dir##*/}"
  export SCREENCAST_BATCH_ID="$batch_id"
  export SCREENCAST_RESULTS_DIR="$results_dir"
  export SCREENCAST_WORK_DIR="$work_dir"
  export SCREENCAST_OUTPUT_DIR="$output_dir"
  export SCREENCAST_WORK_OWNER_MARKER="$work_owner_marker"
  export SCREENCAST_DEFAULT_OUTPUT="$output_dir/$safe_name.mp4"
  export SCREENCAST_DIR="$root"
  export SCREENCAST_INITIALIZED_PID="$$"
}
cleanup_screencast_work() {
  if [[ -n "${SCREENCAST_WORK_DIR:-}" && -n "${SCREENCAST_WORK_OWNER_MARKER:-}" && \
        "$SCREENCAST_WORK_OWNER_MARKER" = "$SCREENCAST_WORK_DIR/.app-screencast-owned" && \
        -f "$SCREENCAST_WORK_OWNER_MARKER" ]]; then
    rm -rf -- "$SCREENCAST_WORK_DIR"
  fi

  release_screencast_output_reservation
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
