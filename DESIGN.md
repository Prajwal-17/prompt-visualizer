---
name: System prompts
description: A familiar reader for original AI instructions and comparable measurements.
colors:
  background: "#fafbfc"
  foreground: "#20242c"
  card: "#ffffff"
  card-foreground: "#20242c"
  popover: "#ffffff"
  popover-foreground: "#20242c"
  primary: "#2563eb"
  primary-foreground: "#ffffff"
  secondary: "#f0f2f5"
  secondary-foreground: "#20242c"
  muted: "#f0f2f5"
  muted-foreground: "#626b78"
  accent: "#edf2ff"
  accent-foreground: "#1d4ed8"
  destructive: "#b91c1c"
  border: "#e2e6ec"
  input: "#dce1e8"
  ring: "#2563eb"
  identity: "#0d9488"
  tools: "#d97706"
  style: "#7c3aed"
  context: "#e15d45"
  safety: "#2563eb"
  other: "#64748b"
  background-dark: "#080808"
  foreground-dark: "#f5f5f5"
  card-dark: "#121212"
  card-foreground-dark: "#f5f5f5"
  popover-dark: "#161616"
  popover-foreground-dark: "#f5f5f5"
  primary-dark: "#f5f5f5"
  primary-foreground-dark: "#080808"
  secondary-dark: "#1a1a1a"
  secondary-foreground-dark: "#f5f5f5"
  muted-dark: "#161616"
  muted-foreground-dark: "#c4c4c4"
  accent-dark: "#202020"
  accent-foreground-dark: "#ffffff"
  destructive-dark: "#fb7185"
  border-dark: "#292929"
  input-dark: "#383838"
  ring-dark: "#e5e5e5"
  identity-dark: "#2dd4bf"
  tools-dark: "#f59e0b"
  style-dark: "#a78bfa"
  context-dark: "#fb7185"
  safety-dark: "#60a5fa"
  other-dark: "#b4b4b4"
typography:
  headline:
    fontFamily: Inter Variable, sans-serif
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  headline-wide:
    fontFamily: Inter Variable, sans-serif
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: calc(2.5 / 2.25)
    letterSpacing: -0.025em
  body:
    fontFamily: Inter Variable, sans-serif
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.85
  interface:
    fontFamily: Inter Variable, sans-serif
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: Inter Variable, sans-serif
    fontSize: 1.35rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.02em
  title-small:
    fontFamily: Inter Variable, sans-serif
    fontSize: 1.15rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.02em
  title-detail:
    fontFamily: Inter Variable, sans-serif
    fontSize: 1.0625rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.02em
  label:
    fontFamily: Inter Variable, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: calc(1.25 / 0.875)
  metadata:
    fontFamily: Inter Variable, sans-serif
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: calc(1 / 0.75)
  measurement:
    fontFamily: Geist Mono Variable, monospace
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: calc(1 / 0.75)
  raw:
    fontFamily: Geist Mono Variable, monospace
    fontSize: 13px
    fontWeight: 400
    lineHeight: 28px
  label-strong:
    fontFamily: Inter Variable, sans-serif
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: calc(1.25 / 0.875)
rounded:
  compact: 4px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
spacing:
  "2": 2px
  "4": 4px
  "8": 8px
  "12": 12px
  "16": 16px
  "20": 20px
  "24": 24px
  "32": 32px
  "40": 40px
  "48": 48px
  "64": 64px
components:
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.md}"
    padding: 0 12px
    height: 32px
  button-outline-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  button-ghost:
    textColor: "{colors.foreground}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.md}"
    size: 32px
  button-ghost-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  search-field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 0 14px
    height: 48px
  provider-chip:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  provider-chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  main-navigation:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
    height: 64px
  main-navigation-active:
    textColor: "{colors.foreground}"
  library-row:
    textColor: "{colors.foreground}"
    padding: 24px 0
  compact-composition:
    rounded: "{rounded.compact}"
    height: 32px
    width: 100%
  contents-rail:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    padding: 28px 24px
    width: 320px
  contents-drawer:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: 0
    padding: 28px 24px 24px
    width: min(360px, 100vw)
  capture-picker:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 0 14px
    height: 56px
  capture-picker-compact:
    height: 40px
  tooltip:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 12px 14px
  reader-tab:
    typography: "{typography.label-strong}"
    rounded: "{rounded.md}"
    padding: 4px 10px
  reader-tab-active:
    textColor: "{colors.foreground}"
---

# Design System: System prompts

## Overview

**Creative North Star: "The familiar document reader"**

The familiar document reader puts original text and comparable measurements at the center. The existing light palette keeps blue interactions; dark mode uses neutral black surfaces and off-white text. Locally hosted Inter carries prose and controls, while Geist Mono distinguishes literal source and measurements.

The centered reader pairs a generous text column with searchable, grouped Contents docked to the right viewport edge. Its adjustable width leaves room for original prose. Flat provider and model groups, explicit capture variants, and compact controls keep source material prominent. This document records the current CSS and components.

**Key Characteristics:**

- Preserved light colors and neutral black dark surfaces.
- Original prose at 17px with a 1.85 line-height.
- Grouped Contents fixed to the right viewport edge with adjustable width, and a toolbar drawer trigger on smaller screens.
- Solid composition colors paired with names and measured values.
- Flat library groups and searchable capture selection.

## Colors

Frontmatter is normative: unsuffixed colors describe light mode and `-dark` colors describe dark mode. `app/globals.css` switches the shared semantic properties through the root `dark` class.

### Primary

Light mode uses interaction blue for links, carets, and focus, with a soft blue selected surface. Dark mode uses off-white `primary` text, a neutral selected surface, white selected text, and a light gray focus ring. Dark UI surfaces have no blue or slate ground.

### Secondary

Composition uses the six category token pairs: identity teal, tools amber, style violet, context coral/rose, safety blue, and unclassified slate in light mode or gray in dark mode. These colors identify data in bars, legends, and section tables; they do not define page surfaces.

### Neutral

The `background` pair supplies the page, header, reader, and toolbar. `card` supplies search and picker fields; `popover` supplies temporary menus. `muted` and `secondary` supply code, raw text, hover, and compact switches. Foreground pairs distinguish primary and supporting text; `border` and `input` supply thin dividers and field strokes. Dark canvas and card are neutral black, with raised neutral gray tones for other surfaces.

Selection mixes primary at 22%; placeholders use full-opacity muted foreground. Destructive colors remain control states. Sidecar tonal ramps are previews rather than additional application tokens.

### Named Rules

**The Semantic Color Rule.** Use the active theme's interaction and neutral tokens for UI, and the six category tokens for composition; pair category color with a name or accessible label.

## Typography

**Body Font:** Inter Variable, sans-serif fallback, locally hosted through Fontsource.

**Label/Mono Font:** Geist Mono Variable, monospace fallback, locally hosted through Fontsource.

### Hierarchy

- **Headline:** semibold capture and page titles use `headline`, changing to `headline-wide` at the small breakpoint.
- **Source titles:** Markdown headings map one level below the page heading; `title`, `title-small`, and `title-detail` retain a modest source hierarchy with tight tracking.
- **Body:** original prose stays at 17px and line-height 1.85. Adjacent blocks use a 1.1em gap; source headings use 2em above and 0.75em below.
- **Interface and labels:** base UI is 15px; navigation and field labels are 14px, metadata is 12px, and Contents items are 13px with a 20px line-height. Library model names are 16px at medium weight.
- **Measurement and raw:** tabular monospace aligns counts and percentages. Raw source is 13px with a 28px line-height; inline prose code is 0.82em. Code blocks use a compact language/copy toolbar and a bounded scrolling body.

### Named Rules

**The Reading Type Rule.** Preserve the 17px prose size and 1.85 line-height; reserve Geist Mono for source code, literal raw text, and measurements.

## Layout

The sticky header is 64px high and its inner frame caps at 1680px. The application main spans the available viewport width. The reader reserves the desktop Contents width on the right and centers its own region within the remaining space. That region caps at 860px, with 20px horizontal gutters on phones and 40px from 640px upward; at its maximum, the prose has 780px of usable width. Reader top padding is 28px, increasing to 40px at 1024px, with 64px below. The library retains its 1180px container and 20px, 36px, and 40px horizontal gutters across the base, small, and large breakpoints.

At 1024px, Contents is fixed from 64px below the viewport top to the bottom, flush with the right viewport edge. There is no outer gutter beside it. The panel has a thin left divider, 28px vertical padding, 24px horizontal padding, and stack level 30. Its default width is 320px; resizing is bounded from 240px to 520px and additionally capped at viewport width minus 640px to preserve the reader region. The centered reader has no left collection sidebar; capture selection sits above the title.

Below that breakpoint, Contents becomes a full-height right drawer capped at 360px. Its trigger lives beside the actions in the sticky Read/Structure/Raw toolbar, which sits below the header at 64px. The same search and grouped section navigation serve both placements. The desktop list fills the space left below its heading and search field and scrolls independently; the drawer's inner region uses `calc(100svh - 100px)`. The root HTML owns a 10rem anchor scroll-padding below 640px to clear the wrapped phone toolbar, and 8rem above. Source sections use zero scroll-margin to avoid doubling that offset.

Library entries group by provider and model/product. Rows stack on phones, add a variant column at 640px, and expose compact composition at 1024px. Comparison caps at 1152px: its labeled fields stack on phones and align around a centered 40px swap control from 640px; source panes become two columns at 768px. Tables, code, and raw text scroll within their own surfaces.

## Elevation & Depth

Reading surfaces and library groups are flat, separated by thin borders and neutral tones. Small shadows identify outlined actions and selected compact switches; medium shadows lift capture popovers; large shadows lift dialogs and inverse tooltips. A half-opacity black overlay separates dialogs. Header, reader toolbar, and overlays use stack levels 40, 20, and 50. The sidecar retains the observed framework shadow values.

### Named Rules

**The Temporary Depth Rule.** Keep document surfaces flat; use elevation to identify temporary menus, dialogs, tooltips, and compact control state.

## Shapes

Compact bars and inline code use 4px corners; selected items and controls use 8px; fields, code containers, and tooltips use 10px; popovers use 12px. Category dots are circular. Dividers remain thin. The mobile Contents drawer is square and flush to the right edge.

## Components

### Buttons and compact switches

Small outlined actions and quiet icon controls are 32px high. Outlined actions use a thin stroke and subtle shadow; ghost actions reveal the accent surface on hover. Focus rings use the theme ring; disabled actions reduce opacity. Provider filters use muted text and an accent selected state. Reading, measurement, and scale switches use a muted track and card-tone selected segment with pressed state.

### Library groups

Provider headings divide flat model/product rows. Each model link sits beside desktop composition and bordered variant links with aligned token counts. Main instructions, Runtime capture, and Published archive remain explicit variants; variant links wrap on phones and stack on wider screens. Hover affects the relevant link or control rather than a full-row overlay.

### Search and capture picker

The library search is a 48px card-tone field with a thin border and containing focus ring. The shared capture picker uses a searchable `cmdk` list grouped by provider, matching model, product, and variant text. Options show variant metadata, monospace counts, and a selected check. Comparison triggers are 56px high; the reader uses a compact 40px trigger. The old Select component is removed. Comparison labels and fields align around the centered swap action.

### Navigation, Contents, and reading

Main navigation uses a foreground active underline. Read, Structure, and Raw use line tabs in the sticky toolbar; the smaller-screen Contents trigger remains available there while reading. Contents searches section labels and source text. Chapter groups expand around the active section and may be expanded independently; search shows matching sections directly. Choosing a section returns to Read, updates location, scrolls, and focuses the destination; re-selecting the active section retriggers scrolling and focus. A drawer selection closes without returning focus to its trigger.

The desktop panel's left divider has a 12px resize target with a small grip and a neutral hover/focus surface. Dragging horizontally adjusts the panel width. Its focusable vertical separator exposes the current width and bounds: Left Arrow widens and Right Arrow narrows by 16px, Home and End select the bounds, and double-click restores the default. The preference persists under `prompt-contents-width` in local storage, with a session fallback if storage is unavailable. Width updates follow animation frames during dragging; content remains independent of the resize control.

Section reading is the default and renders a chapter with its nested sections. Short opening text stays with the first chapter; previous/next controls move between chapter roots. Continuous reading exposes all sections and observes the visible location. Long source sections can expand from a readable excerpt. Composition is a collapsed disclosure with solid category bars, names, and measurements.

Safe Markdown is compiled during content generation and delivered in eight-section batches. The initial batch is available with the reader; other sections load as they approach within 900px of the viewport, replacing restrained title-and-line placeholders. Selecting a distant section loads it eagerly and focuses it when ready. Expanded long sections load their complete body on demand, with an explicit loading label and retry action on failure. Browser content visibility also defers work for off-screen source sections and instruction rows.

Contents creates a full-text search worker on the first nonempty query. Title matches remain immediately available while source-text results arrive; a status line reports searching, result count, or a fallback to title matches if full-text search fails. Search results update independently of section rendering.

### Structure, raw source, and provenance

Structure presents audited source layers and instruction-section tables. Layer counts partition the original capture; the reader count encodes the selected instruction span separately. Raw loads its view and exact original text when selected, showing an explicit loading status and retry action on failure. It retains original-file token and byte totals, wrapping and line-number controls. Its monospace source region scrolls within 75svh and remains separate from Contents updates. Copy also loads the original capture on demand; download links to the original. Keep these measurement scopes visibly distinct and retain the named tokenizer caveat.

Sources remain inert data. The UI distinguishes contributed sources, community captures, and published archives; mirrored publication archives do not receive an independent official-verification claim. Source code remains text with copy controls.

### Tooltips and motion

Tooltips use inverse theme colors, an 8px offset, and the existing 250ms opening delay with a 500ms skip interval. Existing control transitions and loading spin remain functional state feedback. Reduced motion sets animation and transition durations to 0.01ms and uses automatic scrolling. No additional motion system is inferred from unused animation utility names.

## Do's and Don'ts

### Do:

- **Do** preserve exact light tokens and use neutral black dark surfaces with off-white text.
- **Do** retain the original prose size and line-height in a bounded, fluid column.
- **Do** keep grouped Contents searchable, dock its desktop panel to the right viewport edge, preserve its resize controls, and keep its smaller-screen trigger in the sticky toolbar.
- **Do** show capture variants and distinguish instruction-span measurements from exact original-file measurements.
- **Do** pair composition color with labels, preserve source attribution, and keep imported content inert.

### Don't:

- **Don't** introduce blue or slate dark UI surfaces.
- **Don't** replace solid composition colors with decorative gradients or color-only labels.
- **Don't** restore the removed left collection sidebar or old Select picker.
- **Don't** turn flat library groups into elevated promotional cards.
- **Don't** present archived sources or design previews as independent verification of provenance or visual quality.
