#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$#" -eq 0 ]]; then
  cat >&2 <<'USAGE'
Usage:
  scripts/start-harness-tui.sh --recipe-file <path> [--provider profile-live]
  scripts/start-harness-tui.sh --profile <name> [--profile-root <path>] [--provider profile-live]
USAGE
  exit 2
fi

cd "$ROOT_DIR"
exec npm run -s helix -- tui "$@"
