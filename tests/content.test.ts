import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extractSections, measureCategories } from "../lib/content/parse";
import { catalog } from "../lib/content/catalog";
import { dataHref, rawHref, documentSchema } from "../lib/content/types";
import { measureTokens, literalTextOptions } from "../lib/content/tokenize";
import { countTokens } from "gpt-tokenizer/encoding/o200k_base";
import { auditSource } from "../lib/content/audit";

test("whole-document token attribution handles Unicode and literal special-token strings", () => {
  const raw =
    "You are helpful. 👩🏽‍💻 世界\r\n\r\n# Tools\nUse <|endoftext|> as literal text.\n## Search\nCafé العربية हिन्दी\n# Style\nBe clear.\n";
  const result = measureTokens(raw, extractSections(raw));
  assert.equal(result.tokens, countTokens(raw, literalTextOptions));
  assert.equal(
    result.sections.reduce((sum, section) => sum + section.tokens, 0),
    result.tokens,
  );
  assert.equal(
    Object.values(result.categoryTokens).reduce((a, b) => a + b, 0),
    result.tokens,
  );
  assert.equal(measureTokens("", []).tokens, 0);
});

test("tokens spanning section boundaries are counted once at their starting byte", () => {
  const raw = "hello world";
  const whole = extractSections(raw)[0];
  const split = [
    { ...whole, id: "first", end: 7, byteEnd: 7 },
    {
      ...whole,
      id: "second",
      start: 7,
      byteStart: 7,
      category: "tools" as const,
    },
  ];
  const result = measureTokens(raw, split);
  assert.equal(result.tokens, 2);
  assert.equal(result.sections[0].tokens, 2);
  assert.equal(result.sections[1].tokens, 0);
});

test("Unicode sections partition original text and UTF-8 bytes without overlap", () => {
  const raw =
    "You are a helpful assistant. 🌿\n\n# Tools\nUse tools carefully.\n## Search\n世界\n# Unknown\nNo label.\n";
  const sections = extractSections(raw);
  assert.equal(
    sections.map((section) => raw.slice(section.start, section.end)).join(""),
    raw,
  );
  assert.equal(
    Object.values(measureCategories(sections)).reduce((a, b) => a + b, 0),
    Buffer.byteLength(raw),
  );
  assert.equal(sections[2].category, "tools");
  assert.equal(sections.at(-1)!.category, "other");
  for (let i = 1; i < sections.length; i++) {
    assert.equal(sections[i].start, sections[i - 1].end);
    assert.equal(sections[i].byteStart, sections[i - 1].byteEnd);
  }
});

test("XML-like structure is recognized without detecting headings in code fences", () => {
  const raw =
    "`<product_information>`\nProduct info.\n## Workspace\nDetails.\n```xml\n<fake_tools>\n# Fake heading\n```\n`</product_information>`\n# Style\nWrite clearly.\n";
  const sections = extractSections(raw);
  assert.deepEqual(
    sections.map((section) => section.label),
    ["product_information", "Workspace", "Style"],
  );
  assert.equal(sections[0].category, "context");
  assert.equal(sections[2].category, "style");
});

test("fences close only with their matching marker and length", () => {
  const raw = "# Identity\n~~~~\n```\n# Still code\n~~~~\n# Tools\nSearch.\n";
  assert.deepEqual(
    extractSections(raw).map((section) => section.label),
    ["Identity", "Tools"],
  );
});

test("all generated captures match the pinned source and downloadable raw content", async () => {
  assert.ok(
    catalog.length > 0,
    "Expected the curated corpus to execute, not a zero-document validation",
  );
  for (const capture of catalog) {
    const source = await readFile(
      `${capture.sourceKind === "community" ? ".repos/system_prompts_leaks" : "content/sources"}/${capture.sourcePath}`,
    );
    const raw = await readFile(`public${rawHref(capture)}`);
    const json = await readFile(`public${dataHref(capture)}`, "utf8");
    const document = documentSchema.parse(JSON.parse(json));
    assert.ok(raw.equals(source), capture.sourcePath);
    assert.equal(
      createHash("sha256").update(raw).digest("hex"),
      capture.sha256,
    );
    assert.equal(
      createHash("sha256").update(json).digest("hex"),
      capture.documentHash,
    );
    assert.equal(document.raw, source.toString("utf8"));
    assert.equal(
      document.sections
        .map((section) => document.text.slice(section.start, section.end))
        .join(""),
      document.text,
    );
    assert.equal(document.sections.at(-1)?.byteEnd, capture.bytes);
    assert.equal(
      Object.values(capture.categoryBytes).reduce((a, b) => a + b, 0),
      capture.bytes,
    );
    assert.equal(
      capture.tokens,
      countTokens(document.text, literalTextOptions),
    );
    assert.equal(
      capture.rawTokens,
      countTokens(document.raw, literalTextOptions),
    );
    assert.equal(
      document.text,
      document.raw.slice(
        document.textStart,
        document.textStart + document.text.length,
      ),
    );
    assert.equal(
      document.parts
        .map((part) => document.raw.slice(part.start, part.end))
        .join(""),
      document.raw,
    );
    assert.equal(
      document.parts.reduce((sum, part) => sum + part.tokens, 0),
      capture.rawTokens,
    );
    assert.equal(
      document.parts.reduce((sum, part) => sum + part.bytes, 0),
      capture.rawBytes,
    );
    assert.equal(
      document.sections.reduce((sum, section) => sum + section.tokens, 0),
      capture.tokens,
    );
    assert.equal(
      Object.values(capture.categoryTokens).reduce((a, b) => a + b, 0),
      capture.tokens,
    );
  }
});

test("explicit Claude boundaries exclude user memory without changing the capture", () => {
  const raw =
    "~~~\n[system]\n\n<claude_behavior>\nBe helpful.\n</claude_behavior>\nTools and context.\n[user]\nPRIVATE USER MEMORY\n~~~\n";
  const audit = auditSource(raw, "claude-raw");
  assert.ok(audit.text.includes("Tools and context."));
  assert.ok(!audit.text.includes("PRIVATE USER MEMORY"));
  assert.equal(
    audit.parts.map((part) => raw.slice(part.start, part.end)).join(""),
    raw,
  );
  assert.throws(
    () => auditSource(raw.replace("[user]", "[changed]"), "claude-raw"),
    /missing/,
  );
});

test("main instruction counts exclude repository annotations and preserve Unicode offsets", () => {
  const raw =
    "# Model title 🦉\n\n> Used for: Codex.\n\nYou are Codex, an agent.\n# Tools\nSearch.\n";
  const audit = auditSource(raw, "codex-main");
  assert.equal(audit.text, "You are Codex, an agent.\n# Tools\nSearch.\n");
  assert.equal(audit.parts[0].layer, "annotation");
  assert.equal(
    audit.parts.reduce((sum, part) => sum + part.bytes, 0),
    Buffer.byteLength(raw),
  );
});
