#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5173}"

cd "$ROOT_DIR"

echo "Starting Helix docs dev server on ${HOST}:${PORT}"
echo "Builder URL: http://${HOST}:${PORT}/harness-builder.html"

exec ./node_modules/.bin/tsx packages/docs-site/src/server.ts --host "$HOST" --port "$PORT"
