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

use_node_from_app() {
  local app_dir="$1"
  export PATH="${HOME}/.local/bin:${PATH}"
  # shellcheck disable=SC1091
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use
  cd "$app_dir"
  if [[ -f .nvmrc ]]; then
    nvm use >/dev/null
  fi
}

use_node_from_package() {
  local root="$1"
  export PATH="${HOME}/.local/bin:${PATH}"
  # shellcheck disable=SC1091
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use
  cd "$root"
  if [[ -f .nvmrc ]]; then
    nvm use >/dev/null
  fi
}

export_screencast_env() {
  local root="$1"
  export SCREENCAST_DIR="$root"
}
