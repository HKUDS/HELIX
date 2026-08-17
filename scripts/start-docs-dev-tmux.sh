#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION="${TMUX_SESSION:-helix-docs-dev}"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5173}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is not installed or not on PATH." >&2
  exit 1
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
fi

tmux new-session -d -s "$SESSION" -c "$ROOT_DIR" \
  "HOST='$HOST' PORT='$PORT' ./scripts/start-docs-dev.sh"

echo "Started tmux session: ${SESSION}"
echo "Attach: tmux attach -t ${SESSION}"
echo "Logs: tmux capture-pane -t ${SESSION} -p"
echo "Builder URL: http://${HOST}:${PORT}/harness-builder.html"
