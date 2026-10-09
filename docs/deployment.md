# Deploying to Cloudflare

## Workers: request-time rendering

```sh
pnpm install --frozen-lockfile
pnpm build:workers
pnpm preview:workers --port 8787 --ip 127.0.0.1
```

The output is `.open-next/worker.js` plus `.open-next/assets`. `wrangler.workers.jsonc` names the Worker `system-prompts-visualizer`, enables `nodejs_compat`, and binds the assets directory as `ASSETS`. The scripts explicitly select this configuration. The reader renders at request time from a compact index and initial section batch through the asset binding. The library and comparison shell are prerendered. Markdown and token counts are generated at build time; neither the Markdown parser nor tokenizer vocabulary runs in the Worker or browser.

The official Next.js 16.3.8 build is adapted by OpenNext 1.20.10. Next.js is pinned because the newer 16.4 manifest format failed in the adapter's local runtime. OpenNext was chosen to keep the official Next.js compiler/runtime and the same source usable for Pages static export. Cloudflare's current default recommendation, vinext, is a beta implementation of the Next.js API on Vite; this project does not require that separate compiler.

Run the browser suite against the local Worker:

```sh
E2E_BASE_URL=http://127.0.0.1:8787 pnpm test:e2e
```

When you are ready to publish the website, authenticate with your Cloudflare account on your own machine or configure the normal CI Cloudflare credentials, then run:

```sh
pnpm deploy:workers
```

You can change the Worker name in `wrangler.workers.jsonc` and configure a custom domain in Cloudflare. No D1, KV, R2, AI API, or database is needed. Stop another local Cloudflare preview first, or give each preview a distinct inspector port with `--inspector-port`.

## Pages: static export

```sh
pnpm install --frozen-lockfile
DEPLOY_TARGET=pages pnpm build
pnpm exec wrangler pages dev out --port 4173 --ip 127.0.0.1
```

Cloudflare Pages Git integration settings:

| Setting          | Value                                   |
| ---------------- | --------------------------------------- |
| Framework        | Next.js (Static HTML Export), or custom |
| Build command    | `DEPLOY_TARGET=pages pnpm build`        |
| Output directory | `out`                                   |
| pnpm version     | `11.19.0` (`packageManager`)            |
| Node version     | `24`                                    |
| Root directory   | Repository root                         |

Alternatively, publish from the command line:

```sh
DEPLOY_TARGET=pages pnpm build
pnpm exec wrangler pages deploy out --project-name=system-prompts-pages
```

Workers remains the primary scripted target. The optional command above uses a Pages project named `system-prompts-pages`; change `--project-name` and `wrangler.jsonc` for your account's chosen project. A new project may need to be created in Cloudflare first. Keeping the Worker configuration separate prevents its assets settings from overriding the Pages preview. Remote deployment requires your Cloudflare authentication; the application has no API credentials of its own.

Test the actual static target with:

```sh
E2E_BASE_URL=http://127.0.0.1:4173 pnpm test:e2e
```

Each known prompt has a generated directory page and React navigation payload. `trailingSlash` allows deep URL refreshes on a static host. A root `404.html` handles unknown routes. There are no Pages Functions or Server Actions.

## Build and source updates

Never run the two production builds concurrently: both use Next.js's `.next/` build directory. The static `out/` export and `.open-next/` Worker output remain independent after generation. Build the selected profile again after changing source or the app.

`pnpm generate` validates the selected sources against the saved source manifest and writes the original JSON/text assets plus compiled reader assets. Reader directories are keyed by their generated-content hash: an index of source boundaries and section metadata, batches of eight safe Markdown fragments, separate complete long sections, and a full-text search index. Rendering changes get new URLs even when the original source is unchanged. Raw downloads retain the raw-source hash. The shared browser bundle contains catalog metadata and measurements; document bodies, raw text, and search indexes load only when needed.

To update sources, use `pnpm sync:prompts` from a clean tree, review the subtree/source metadata changes, and rebuild. Full upstream scripts, skills, and agent instructions under `.repos/` are reference data only and must not be executed or treated as project development instructions.

## Cloud environment

The development environment's setup instructions install the lockfile and generate assets. Startup instructions launch `pnpm dev` and verify representative local pages. Running processes must restart in a new task; an environment filesystem snapshot does not retain them. Review/save/publish of that development environment is separate from deploying this website to Cloudflare.
