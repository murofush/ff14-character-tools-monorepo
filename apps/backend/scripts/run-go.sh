#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if command -v go >/dev/null 2>&1; then
  exec go "$@"
fi

if command -v docker >/dev/null 2>&1; then
  exec docker run --rm -v "${PROJECT_ROOT}:/app" -w /app golang:1.22 /usr/local/go/bin/go "$@"
fi

echo "go または docker のどちらかが必要です。" >&2
exit 1
