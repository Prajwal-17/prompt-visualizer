#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  printf '%s\n' 'Commit or stash local changes before syncing the reference subtree.' >&2
  exit 1
fi

if [[ -x /usr/lib/git-core/git-subtree ]]; then
  export PATH="/usr/lib/git-core:$PATH"
fi
if ! command -v git-subtree >/dev/null 2>&1 && [[ ! -x "$(git --exec-path)/git-subtree" ]]; then
  printf '%s\n' 'Install the Git subtree extension from your Git distribution before syncing.' >&2
  exit 1
fi

git subtree pull --prefix=.repos/system_prompts_leaks \
  https://github.com/asgeirtj/system_prompts_leaks.git main --squash
PROMPT_SOURCE_REVISION="$(git rev-parse FETCH_HEAD)" node --input-type=module <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
const filename = 'content/source-lock.json';
const lock = JSON.parse(readFileSync(filename, 'utf8'));
lock.commit = process.env.PROMPT_SOURCE_REVISION;
writeFileSync(filename, JSON.stringify(lock, null, 2) + '\n');
JS
pnpm generate
pnpm test
printf '%s\n' 'Source synced. Review source-lock.json and source-manifest.json, then commit the metadata update.'
