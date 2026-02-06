#!/usr/bin/env bash
set -euo pipefail

# check_url は指定URLへリクエストを送り、期待する文字列が含まれるか確認する。
# @param label string
# @param url string
# @param pattern string
# @returns void
check_url() {
  local label="$1"
  local url="$2"
  local pattern="${3:-}"
  local timeout="${SMOKE_TIMEOUT:-5}"

  echo "[smoke] ${label} -> ${url}"
  if [ -n "${pattern}" ]; then
    if ! curl -fsS --max-time "${timeout}" "${url}" | grep -q "${pattern}"; then
      echo "[smoke] ${label} failed (pattern not found)" >&2
      return 1
    fi
  else
    curl -fsS --max-time "${timeout}" "${url}" >/dev/null
  fi
  echo "[smoke] ok: ${label}"
}

# main はローカル疎通チェックを順に実行する。
# @returns void
main() {
  if ! command -v curl >/dev/null 2>&1; then
    echo "[smoke] curl is required" >&2
    exit 1
  fi
  if ! command -v grep >/dev/null 2>&1; then
    echo "[smoke] grep is required" >&2
    exit 1
  fi

  local front_url="${SMOKE_FRONT_URL:-http://localhost:5173}"
  local back_url="${SMOKE_BACK_URL:-http://localhost:5174}"
  local front_pattern="${SMOKE_FRONT_PATTERN:-}"
  local back_pattern="${SMOKE_BACK_PATTERN:-}"

  if [ "${SMOKE_SKIP_FRONT:-0}" != "1" ]; then
    check_url "front (chara-card-creator)" "${front_url}" "${front_pattern}"
  fi

  if [ "${SMOKE_SKIP_BACK:-0}" != "1" ]; then
    check_url "back (achievement-editor)" "${back_url}" "${back_pattern}"
  fi
}

main "$@"
