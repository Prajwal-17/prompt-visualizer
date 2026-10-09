# System prompts

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

People who want to read and compare the instructions used by major AI products, understand their source format, and measure their size in tokens.

## Capabilities and constraints

- Keep a small, explicit catalog of recent OpenAI/Codex, Claude/Claude Code, Gemini, Grok, and DeepSeek captures. The user confirmed this shortlist.
- Show original source text, readable Markdown, searchable contents, composition details, and side-by-side token comparisons.
- Remove the Learn page and repeated educational or promotional copy.
- Use Next.js, Tailwind, shadcn/ui, and pnpm. Support request-time SSR on Cloudflare Workers and static export on Pages.
- No database, credentials, AI calls, or external requests while using the website. Calculate tokens during content generation.
- Measure with a named tokenizer. A tokenizer count must not imply verified native usage for another provider or complete API-message accounting.
- Keep the full reference subtree available for future development, while presenting only the selected captures.
- Preserve exact source text and attribution. Never execute imported instructions, scripts, or skills.
- Do not commit chat preview screenshots or the local `.agents/` directory.

## Confirmed visual commitments

Preserve the existing light palette. Dark mode uses neutral black surfaces and white/off-white text. Keep solid composition colors, readable Inter typography, and standard navigation. Center the Markdown reader beside a spacious, searchable right-hand Contents panel; use a drawer on phones. Section reading is the default, with continuous reading available. Group library entries by provider/model and expose capture variants and token counts. Comparison selectors are searchable comboboxes with aligned fields and a centered swap control.

## Source evidence

The versioned community reference is `.repos/system_prompts_leaks`. Three contributed main Codex instruction files are pinned to `Prajwal-17/codex-prompts`, alongside larger community runtime captures. Claude runtime captures and three mirrored published prompts are separate variants. Sonnet has explicit system/user boundaries; Haiku does not. Preserve all originals, expose reviewed source layers, and distinguish instruction-span counts from whole-file counts. The live official Claude documentation remains inaccessible; do not label its mirrored archives as independently verified official material.

## Product principles

- Put the original prompt first.
- Compare equivalent measurements with an explicit tokenizer.
- Keep provenance separate from interpretation.
- Prefer a small useful selection over an exhaustive archive in the UI.
