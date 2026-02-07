#!/usr/bin/env bash
set -euo pipefail

echo '✅ CodeX session completed'

# 自動レビューを有効化する条件:
#  - 環境変数 VIBE_TASK_AUTOREVIEW=1 が設定されている、または
#  - リポジトリに .vibe/autoreview が存在する

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ "${VIBE_TASK_AUTOREVIEW:-}" == "1" ]] || [[ -f "$ROOT_DIR/.vibe/autoreview" ]]; then
  TITLE="${VIBE_TASK_TITLE:-CodeX Task}"
  echo "🔁 Auto-sending local review to Claude Code... (TITLE: $TITLE)"
  ARGS=( --worktree "$ROOT_DIR" --title "$TITLE" )
  if [[ "${VIBE_TASK_AUTOFIX:-}" == "1" ]] || [[ -f "$ROOT_DIR/.vibe/autofix" ]]; then
    echo "🛠  Auto-fix (patch apply) is enabled."
    ARGS+=( --repair )
  fi
  "$ROOT_DIR/scripts/ai/claudecode-local-review.sh" "${ARGS[@]}" || true
else
  echo "(Auto-review disabled. Set VIBE_TASK_AUTOREVIEW=1 or create .vibe/autoreview)"
fi
