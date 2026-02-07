#!/bin/bash

# CodeX を実行する簡易ラッパー（通知ベル付き）

# VSCode ターミナルでベルを有効にするため、ワンショットでベル音
echo -e "\a"

# --clear-cache 対応（ベストエフォート）
if [[ "$1" == "--clear-cache" ]]; then
  shift
  echo "[CodeX] Clear cache: no-op (CLI固有のキャッシュ場所が不定のため)。必要に応じて各自の環境で削除してください。" >&2
fi

# CodeX CLI がインストールされている前提で実行
if command -v codex >/dev/null 2>&1; then
  codex "$@"
else
  echo "[CodeX] 'codex' コマンドが見つかりません。Codex CLI をインストールしてください。" >&2
  exit 127
fi

