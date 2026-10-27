#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

PORT="${1:-${PORT:-8080}}"

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required but was not found in PATH." >&2
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "npm is required but was not found in PATH." >&2
    exit 1
fi

if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

npm run verify
exec node _build/serve.mjs "$PORT"
