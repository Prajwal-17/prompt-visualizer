# System prompts

Read and compare a small selection of system-prompt captures. Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, local Inter/Geist Mono fonts, and pnpm. No backend, database, AI calls, or API keys.

## Develop

Use Node.js 24 (minimum 22) and the pinned pnpm version in `package.json`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Development generates local content assets before starting Next.js. In this cloud environment, `bash scripts/cloud-install.sh` uses a writable package store. Use the existing isolated checkout; no extra Git worktree is needed.

## Read and compare

- 16 model/product entries with 22 explicitly labeled captures across five providers.
- Provider filters, model/product search, token sorting, and Ctrl/⌘ K search.
- Section or continuous Markdown reading, a searchable Contents panel docked to the right edge (drawer on phones), Structure and Raw views, direct section links, and exact original-text copying/downloads. Contents follows nested headings with left-side toggles and Expand all/Collapse all controls. Drag the panel divider or use its arrow keys to resize it; the width is remembered.
- Token/byte composition bars with hover and keyboard-focus details, in light and dark themes.
- Two-prompt comparison with absolute or equal-width bars, category counts, and size differences. Only the chosen pair's source text loads when opened.

The three recent Codex entries include both the contributed main instruction files from [Prajwal-17/codex-prompts](https://github.com/Prajwal-17/codex-prompts), pinned at `637a4ff550eedd917b308bdc913bf4e42b7e6acd`, and larger runtime captures from the community subtree. Claude's runtime captures and mirrored provider publications appear as separate variants. Miscellaneous fragments, auto-review policies, and internal aliases are omitted.

Original files are copied verbatim. Reader counts measure the selected instruction span: repository titles and descriptions are excluded from contributed Codex instructions; Sonnet's explicit `[system]` to `[user]` span excludes the user/memory payload; Haiku's outer Markdown fence is excluded but its file supplies no explicit API roles. Raw shows the whole original file and its separate count. Reviewed source layers and their boundaries are visible in Structure. A publication archive is a community mirror, not a live-verified official source.

The full pinned community reference lives in `.repos/system_prompts_leaks` as a squashed Git subtree. The UI selection is explicitly ordered in `content/captures.json`; it does not expose every archived model, support file, or skill. Version names come from the source files and are not independently verified release claims.

## Measurements

`gpt-tokenizer@4.0.0` encodes each selected instruction span and complete original file with `o200k_base` during generation. Special-token-looking strings are ordinary source text. Counts are exact for that encoding; another provider's native tokenizer can differ. Captured runtime text is included when that variant is selected. Uncaptured instructions, API framing overhead, and billing are not measured. Source files do not independently establish production authenticity or model release claims.

Sections partition the source using Markdown headings and standalone XML tags outside code fences. Category rules inspect labels and inherit recognized categories into nested sections. Unrecognized spans remain Other. The parser does not semantically classify every sentence. A token belongs to the section containing its first UTF-8 byte, so section/category counts add up to the document total even across boundaries. Bytes are also measured directly from the original UTF-8 source. The tokenizer vocabulary is a build dependency and is not loaded in the browser or Worker.

## Cloudflare

```sh
# Request-time SSR
pnpm build:workers
pnpm preview:workers

# Static export
DEPLOY_TARGET=pages pnpm build
pnpm exec wrangler pages dev out
```

Workers is the primary deployment target. OpenNext uses the `ASSETS` binding to load the selected reader index and initial section batch per request. The optional Pages mode exports each route to `out/`. Prompt links disable prefetching. Pages does not provide request-time SSR for these Next.js routes.

Markdown is compiled into inert, escaped HTML during generation. The initial page contains section metadata and the first eight-section batch; additional batches load near the viewport. Full long sections, original text, comparison panes, and validation code load when requested. Memoized sections and CSS containment keep navigation and scrolling from re-parsing the prompt. Contents searches a separately loaded index in a Web Worker, with immediate title matches.

See [deployment instructions](docs/deployment.md). Build the two targets sequentially because they share `.next/`. Installation and local previews do not publish the website.

## Checks

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:e2e
```

`pnpm lint` runs Oxlint followed by the Next.js/React accessibility checks from ESLint. `pnpm format` formats the maintained code, configuration, and documentation. Vendored repositories, original prompt text, generated output, and local agent files are excluded.

Playwright uses system Chromium when available. Otherwise run `pnpm exec playwright install chromium`. Set `E2E_BASE_URL` to a running local production preview to test Workers or Pages. Checks cover source hashes, Unicode token accounting, reader navigation, composition details, comparison, copy/download, mobile overflow, themes, and core WCAG rules.

## Update or add sources

From a clean working tree:

```sh
pnpm sync:prompts
```

This updates the squashed subtree, source pin and integrity manifest, regenerates the selected catalog, and runs content tests. Review and commit the changes. Ordinary builds never fetch upstream. The command requires Git's subtree extension. Imported scripts, skills, and agent instructions remain inert reference data.

The full source integrity inventory stays in `content/source-manifest.json`, separate from UI curation. Generated JSON and verbatim text in `public/data/` and `content/generated/` are ignored and reproducible; content hashes keep asset URLs tied to their exact contents.

For additional inspected prompts, add plain text/Markdown under `content/sources/`, then an entry in `content/captures.json` with `kind: "contributed"` or `"official"`, a relative `file`, `provider`, `title`, `product`, and an explicit `sourceUrl`. Add a pinned `sourceCommit` and `sha256` for imported snapshots. Community entries refer to the pinned subtree. Generation records each file's raw SHA-256; never change source text to insert UI notes.

The supplied [official Claude documentation](https://platform.claude.com/docs/en/release-notes/system-prompts/overview) remains blocked by the environment’s network proxy. Three published-prompt archives are available in the pinned community subtree and are labeled as mirrors; direct official verification remains pending. The Codex Drive source was replaced by the user-supplied GitHub repository above. All community entries have exact source-commit links.

Source archive: [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks), [CC0 1.0](.repos/system_prompts_leaks/LICENSE). Adapted shadcn/ui components retain their [MIT notice](docs/licenses/shadcn-ui.txt). The [design reference](DESIGN.md) records reusable interface tokens and behavior. Chat preview screenshots and `.agents/` are ignored; `skills-lock.json` records the installed design skills.
