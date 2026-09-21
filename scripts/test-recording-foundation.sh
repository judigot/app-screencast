#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib.sh
source "$ROOT/scripts/lib.sh"

for script in "$ROOT"/record-*.sh "$ROOT"/scripts/*.sh; do
  [[ -e "$script" ]] || continue
  bash -n "$script"
done

tmp="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp"
}
trap cleanup EXIT

export NVM_DIR="$tmp/no-nvm"
use_node_from_package "$ROOT"
command -v node >/dev/null
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null

run_parent="$tmp/run-parent"
results_parent="$tmp/results-parent"
work_parent="$tmp/work-parent"
output_parent="$tmp/output-parent"
mkdir -p "$run_parent" "$results_parent" "$work_parent" "$output_parent"
printf 'keep me\n' > "$work_parent/unrelated.txt"

initialize_in_subprocess() {
  local manifest="$1"
  local hold_seconds="${2:-0}"
  (
    export SCREENCAST_RUN_ID="shared-batch"
    export SCREENCAST_RUN_DIR="$run_parent"
    export SCREENCAST_RESULTS_DIR="$results_parent"
    export SCREENCAST_WORK_DIR="$work_parent"
    export SCREENCAST_OUTPUT_DIR="$output_parent"
    unset SCREENCAST_BATCH_ID SCREENCAST_INITIALIZED_PID SCREENCAST_WORK_OWNER_MARKER SCREENCAST_OUTPUT_LOCK_DIR
    # shellcheck source=scripts/lib.sh
    source "$ROOT/scripts/lib.sh"
    initialize_screencast_run "$ROOT" "foundation"
    printf '%s\n%s\n%s\n%s\n%s\n%s\n' \
      "$SCREENCAST_RUN_ID" \
      "$SCREENCAST_RUN_DIR" \
      "$SCREENCAST_RESULTS_DIR" \
      "$SCREENCAST_WORK_DIR" \
      "$SCREENCAST_OUTPUT_DIR" \
      "$SCREENCAST_WORK_OWNER_MARKER" > "$manifest"
    printf 'owned\n' > "$SCREENCAST_WORK_DIR/owned.txt"
    sleep "$hold_seconds"
  )
}

initialize_in_subprocess "$tmp/a.manifest" 1 &
pid_a=$!
initialize_in_subprocess "$tmp/b.manifest" 1 &
pid_b=$!
wait "$pid_a"
wait "$pid_b"

mapfile -t a < "$tmp/a.manifest"
mapfile -t b < "$tmp/b.manifest"

[[ "${a[0]}" != "${b[0]}" ]]
[[ "${a[1]}" != "${b[1]}" ]]
[[ "${a[2]}" != "${b[2]}" ]]
[[ "${a[3]}" != "${b[3]}" ]]
[[ "${a[4]}" != "${b[4]}" ]]
[[ -d "${a[2]}" && -d "${b[2]}" ]]
[[ -f "${a[3]}/owned.txt" && -f "${b[3]}/owned.txt" ]]

SCREENCAST_WORK_DIR="${a[3]}"
SCREENCAST_WORK_OWNER_MARKER="${a[5]}"
unset SCREENCAST_OUTPUT_LOCK_DIR
cleanup_screencast_work
[[ ! -e "${a[3]}" ]]
[[ -f "${b[3]}/owned.txt" ]]
[[ -f "$work_parent/unrelated.txt" ]]
[[ -d "$work_parent" ]]

explicit_output="$tmp/explicit/output.mp4"
ready="$tmp/output-lock-ready"
(
  export EVIDENCE_OUTPUT_PATH="$explicit_output"
  export SCREENCAST_RUN_ID="shared-batch"
  export SCREENCAST_RUN_ROOT="$tmp/output-lock-runs"
  unset SCREENCAST_RUN_DIR SCREENCAST_RESULTS_DIR SCREENCAST_WORK_DIR SCREENCAST_OUTPUT_DIR
  unset SCREENCAST_BATCH_ID SCREENCAST_INITIALIZED_PID SCREENCAST_WORK_OWNER_MARKER SCREENCAST_OUTPUT_LOCK_DIR
  # shellcheck source=scripts/lib.sh
  source "$ROOT/scripts/lib.sh"
  initialize_screencast_run "$ROOT" "locked"
  : > "$ready"
  sleep 2
  cleanup_screencast_work
) &
lock_pid=$!

for _ in $(seq 1 50); do
  [[ -f "$ready" ]] && break
  sleep 0.05
done
[[ -f "$ready" ]]

if (
  export EVIDENCE_OUTPUT_PATH="$explicit_output"
  export SCREENCAST_RUN_ID="shared-batch"
  export SCREENCAST_RUN_ROOT="$tmp/output-lock-runs"
  unset SCREENCAST_RUN_DIR SCREENCAST_RESULTS_DIR SCREENCAST_WORK_DIR SCREENCAST_OUTPUT_DIR
  unset SCREENCAST_BATCH_ID SCREENCAST_INITIALIZED_PID SCREENCAST_WORK_OWNER_MARKER SCREENCAST_OUTPUT_LOCK_DIR
  # shellcheck source=scripts/lib.sh
  source "$ROOT/scripts/lib.sh"
  initialize_screencast_run "$ROOT" "locked-duplicate"
); then
  echo "duplicate explicit output path was not rejected" >&2
  exit 1
fi
wait "$lock_pid"

source_video="$tmp/long-source.webm"
exported_video="$tmp/long-export.mp4"
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i 'color=c=black:s=64x64:r=10:d=10' \
  -f lavfi -i 'color=c=white:s=64x64:r=10:d=2' \
  -filter_complex '[0:v][1:v]concat=n=2:v=1:a=0[v]' \
  -map '[v]' -c:v libvpx-vp9 "$source_video"

transcode_screencast_video "$source_video" "$exported_video" 10 ultrafast 30

duration="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$exported_video")"
awk -v duration="$duration" 'BEGIN { exit !(duration > 11.5) }'

ending_yavg="$(
  ffmpeg -hide_banner -loglevel info -ss 11.5 -i "$exported_video" -frames:v 1 \
    -vf 'signalstats,metadata=print' -f null - 2>&1 \
    | sed -n 's/.*lavfi.signalstats.YAVG=//p' \
    | tail -1
)"
[[ -n "$ending_yavg" ]]
awk -v yavg="$ending_yavg" 'BEGIN { exit !(yavg > 200) }'

if grep -R -n --include='record-*.sh' -- '-t 10' "$ROOT"; then
  echo "fixed ten-second export truncation is not allowed" >&2
  exit 1
fi

if grep -R -n --include='record-*.sh' -- 'rm -rf .*test-results' "$ROOT"; then
  echo "recording wrappers must not delete shared test-results" >&2
  exit 1
fi

printf 'Recording foundation checks passed.\n'
