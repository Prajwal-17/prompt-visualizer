import { measureTokens } from "./tokenize";
import type { Section } from "./types";

export type SourceProfile =
  "verbatim" | "codex-main" | "codex-runtime" | "claude-raw" | "claude-fenced";
type Layer =
  "instructions" | "runtime" | "context" | "tools" | "user" | "annotation";

// Reviewed source regions, not inferred API roles. Changed markers fail generation.
export function auditSource(
  raw: string,
  profile: SourceProfile,
  runtime = false,
) {
  const ranges: { layer: Layer; start: number; end: number }[] = [];
  let textStart = 0;
  let textEnd = raw.length;
  let boundary = "Verbatim source; API message boundaries are not supplied.";
  function add(layer: Layer, start: number, end: number) {
    if (end > start) ranges.push({ layer, start, end });
  }
  function marker(value: string, from = 0) {
    const index = raw.indexOf(value, from);
    if (index < 0)
      throw new Error(`Reviewed source marker is missing: ${value}`);
    return index;
  }
  if (profile === "codex-main") {
    textStart = marker("You are Codex,");
    add("annotation", 0, textStart);
    add("instructions", textStart, raw.length);
    boundary =
      "Repository title and ‘Used for’ annotation excluded from instructions.";
  } else if (profile === "codex-runtime") {
    const tools = marker("\n# Tools\n");
    const context = raw.indexOf("\n# Codex desktop context\n");
    add("instructions", 0, context >= 0 && context < tools ? context : tools);
    if (context >= 0 && context < tools) add("context", context, tools);
    add("tools", tools, raw.length);
    boundary =
      "Reviewed desktop-context and Tools headings; API roles are not supplied.";
  } else if (profile === "claude-raw" || profile === "claude-fenced") {
    const fence = raw.lastIndexOf("\n~~~");
    textStart =
      profile === "claude-raw"
        ? marker("[system]\n") + "[system]\n".length
        : marker("~~~\n") + 4;
    textEnd =
      profile === "claude-raw" ? marker("\n[user]\n", textStart) : fence;
    const behaviorEnd =
      marker("</claude_behavior>", textStart) + "</claude_behavior>".length;
    if (behaviorEnd > textEnd)
      throw new Error("Claude behavior crosses the reviewed system boundary.");
    if (fence < textEnd || raw.slice(fence).trim() !== "~~~")
      throw new Error("Claude capture wrapper changed.");
    add("annotation", 0, textStart);
    add("instructions", textStart, behaviorEnd);
    add("runtime", behaviorEnd, textEnd);
    add("user", textEnd, fence);
    add("annotation", fence, raw.length);
    boundary =
      profile === "claude-raw"
        ? "Explicit [system] → [user] span; wrapper, user message, and memory excluded."
        : "Outer Markdown wrapper excluded; no explicit API message boundaries in this capture.";
  } else {
    add(runtime ? "runtime" : "instructions", 0, raw.length);
  }
  if (ranges.map(({ start, end }) => raw.slice(start, end)).join("") !== raw)
    throw new Error("Source layers must partition the original file.");
  const layerSections: Section[] = ranges.map((range, index) => ({
    ...range,
    id: `layer-${index}`,
    label: range.layer,
    kind: "preamble",
    depth: 0,
    category: "other",
    method: "preamble",
    byteStart: Buffer.byteLength(raw.slice(0, range.start)),
    byteEnd: Buffer.byteLength(raw.slice(0, range.end)),
    tokens: 0,
  }));
  const measured = measureTokens(raw, layerSections);
  return {
    text: raw.slice(textStart, textEnd),
    textStart,
    boundary,
    rawTokens: measured.tokens,
    parts: ranges.map((range, index) => ({
      ...range,
      tokens: measured.sections[index].tokens,
      bytes: Buffer.byteLength(raw.slice(range.start, range.end)),
    })),
  };
}
