#!/usr/bin/env bash
set -euo pipefail
cd /workspace/prompt-visualizer

node -e 'if (Number(process.versions.node.split(".")[0]) < 22) throw new Error("Use Node.js 22 or later; this project uses Node.js 24 in the cloud environment.")'
if [[ ! -f pnpm-lock.yaml ]]; then
  printf '%s\n' 'The application checkout is missing its lockfile. Restore the committed project before installing.' >&2
  exit 1
fi
pnpm install --frozen-lockfile --config.store-dir=/workspace/.cache/pnpm-store
pnpm generate
