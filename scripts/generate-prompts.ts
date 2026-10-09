import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { extractSections, measureCategories } from "../lib/content/parse";
import { measureTokens } from "../lib/content/tokenize";
import { auditSource } from "../lib/content/audit";
import {
  captureSchema,
  documentSchema,
  dataHref,
  rawHref,
  categoryIds,
  type Capture,
} from "../lib/content/types";

const root = process.cwd();
const sourceRoot = path.join(root, ".repos/system_prompts_leaks");
const lock = JSON.parse(
  await readFile(path.join(root, "content/source-lock.json"), "utf8"),
) as { commit: string };
const selectionSchema = z
  .array(
    z.object({
      provider: z.string().min(1),
      title: z.string().min(1),
      product: z.string().min(1),
      variant: z.enum(["main", "runtime", "published"]),
      profile: z
        .enum([
          "verbatim",
          "codex-main",
          "codex-runtime",
          "claude-raw",
          "claude-fenced",
        ])
        .default("verbatim"),
      file: z.string().min(1),
      kind: z
        .enum(["community", "official", "contributed"])
        .default("community"),
      slug: z
        .string()
        .regex(/^[a-z0-9.-]+(?:--[a-z0-9.-]+)*$/)
        .optional(),
      sourceUrl: z.url().optional(),
      sourceCommit: z
        .string()
        .regex(/^[a-f0-9]{40}$/)
        .optional(),
      sha256: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
    }),
  )
  .min(1);
const selection = selectionSchema.parse(
  JSON.parse(await readFile("content/captures.json", "utf8")),
);

// The upstream integrity inventory is independent of the smaller displayed set.
// Changing the selection must never erase checks for the pinned reference files.
const paths: string[] = [];
for (const entry of await readdir(sourceRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  for (const file of await readdir(path.join(sourceRoot, entry.name), {
    withFileTypes: true,
  })) {
    if (
      file.isFile() &&
      /\.(md|txt)$/.test(file.name) &&
      !/^(readme|license)/i.test(file.name)
    )
      paths.push(`${entry.name}/${file.name}`);
  }
}
for (const directory of [
  "OpenAI/Codex",
  "Anthropic/claude-code",
  "Anthropic/raw",
  "Anthropic/official",
]) {
  for (const file of await readdir(path.join(sourceRoot, directory), {
    withFileTypes: true,
  })) {
    if (
      file.isFile() &&
      file.name.endsWith(".md") &&
      !/^readme/i.test(file.name)
    )
      paths.push(`${directory}/${file.name}`);
  }
}
const byPath = (a: { sourcePath: string }, b: { sourcePath: string }) =>
  a.sourcePath.localeCompare(b.sourcePath);
const manifest = {
  commit: lock.commit,
  files: [] as { sourcePath: string; sha256: string }[],
};
for (const sourcePath of paths) {
  const buffer = await readFile(path.join(sourceRoot, sourcePath));
  manifest.files.push({
    sourcePath,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  });
}
manifest.files.sort(byPath);
try {
  const saved = JSON.parse(
    await readFile("content/source-manifest.json", "utf8"),
  ) as typeof manifest;
  if (
    saved.commit === manifest.commit &&
    saved.files.some(
      (file) =>
        !manifest.files.some(
          (current) =>
            current.sourcePath === file.sourcePath &&
            current.sha256 === file.sha256,
        ),
    )
  ) {
    throw new Error(
      "Upstream files changed without a source-lock revision update. Use the documented sync workflow.",
    );
  }
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
    throw error;
}
await writeFile(
  "content/source-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);

const output = path.join(root, "public/data");
const generated = path.join(root, "content/generated");
await mkdir(output, { recursive: true });
await mkdir(generated, { recursive: true });
let previous: Capture[] = [];
try {
  previous = JSON.parse(
    await readFile(path.join(generated, "catalog.json"), "utf8"),
  );
} catch {
  /* First generation. */
}
const catalog: Capture[] = [];
for (const entry of selection) {
  const base =
    entry.kind === "community"
      ? sourceRoot
      : path.join(root, "content/sources");
  const filePath = path.resolve(base, entry.file);
  if (!filePath.startsWith(base + path.sep))
    throw new Error(`Source path escapes its content directory: ${entry.file}`);
  if (
    entry.kind === "community" &&
    !manifest.files.some((file) => file.sourcePath === entry.file)
  )
    throw new Error(
      `Source is outside the pinned prompt inventory: ${entry.file}`,
    );
  if (entry.kind !== "community" && !entry.sourceUrl)
    throw new Error(`An explicit source URL is required for ${entry.file}`);
  const rawBuffer = await readFile(filePath);
  const raw = rawBuffer.toString("utf8");
  if (!rawBuffer.length || !Buffer.from(raw).equals(rawBuffer))
    throw new Error(`Source must be nonempty UTF-8: ${entry.file}`);
  const audit = auditSource(raw, entry.profile, entry.variant === "runtime");
  const measurement = measureTokens(audit.text, extractSections(audit.text));
  const { sections } = measurement;
  const providerSlug = entry.provider.toLowerCase();
  const relativeName =
    entry.kind === "community"
      ? entry.file.slice(entry.file.indexOf("/") + 1)
      : entry.file;
  const slug =
    entry.slug ??
    relativeName
      .replace(/\.(md|txt)$/i, "")
      .replaceAll("/", "--")
      .toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(slug))
    throw new Error(`Set a URL-safe slug for ${entry.file}`);
  const id = `${providerSlug}--${slug}`;
  if (catalog.some((item) => item.id === id))
    throw new Error(`Duplicate capture ID ${id}`);
  const sha256 = createHash("sha256").update(rawBuffer).digest("hex");
  if (entry.sha256 && entry.sha256 !== sha256)
    throw new Error(
      `Source hash differs from its inspected capture: ${entry.file}`,
    );
  const document = documentSchema.parse({
    id,
    sha256,
    raw,
    text: audit.text,
    textStart: audit.textStart,
    parts: audit.parts,
    sections,
  });
  const documentJson = JSON.stringify(document);
  const kinds = new Set(sections.map((section) => section.kind));
  const format = kinds.has("tag")
    ? kinds.has("heading")
      ? "Markdown + XML"
      : "XML"
    : kinds.has("heading")
      ? "Markdown"
      : "Text";
  const meta = captureSchema.parse({
    id,
    provider: entry.provider,
    providerSlug,
    slug,
    title: entry.title,
    model: entry.title,
    product: entry.product,
    variant: entry.variant,
    boundary: audit.boundary,
    type: "capture",
    sourcePath: entry.file,
    sourceKind: entry.kind,
    sourceCommit:
      entry.kind === "community" ? lock.commit : (entry.sourceCommit ?? null),
    sourceUrl:
      entry.kind === "community"
        ? `https://github.com/asgeirtj/system_prompts_leaks/blob/${lock.commit}/${entry.file.split("/").map(encodeURIComponent).join("/")}`
        : entry.sourceUrl,
    sha256,
    documentHash: createHash("sha256").update(documentJson).digest("hex"),
    bytes: Buffer.byteLength(audit.text),
    tokens: measurement.tokens,
    rawTokens: audit.rawTokens,
    rawBytes: rawBuffer.length,
    tokenizer: measurement.tokenizer,
    tokenizerVersion: measurement.tokenizerVersion,
    categoryTokens: measurement.categoryTokens,
    categorySections: Object.fromEntries(
      categoryIds.map((category) => [
        category,
        sections.filter((section) => section.category === category).length,
      ]),
    ),
    words: raw.match(/\S+/g)?.length ?? 0,
    lines: raw.split("\n").length,
    sectionCount: sections.length,
    format,
    summary: `${entry.title} instructions for ${entry.product}.`,
    featured: true,
    categoryBytes: measureCategories(sections),
  });
  if (
    sections
      .map((section) => audit.text.slice(section.start, section.end))
      .join("") !== audit.text
  )
    throw new Error(`Section integrity failed: ${entry.file}`);
  if (
    Object.values(meta.categoryBytes).reduce((a, b) => a + b, 0) !== meta.bytes
  )
    throw new Error(`Byte accounting failed: ${entry.file}`);
  if (
    Object.values(meta.categoryTokens).reduce((a, b) => a + b, 0) !==
    meta.tokens
  )
    throw new Error(`Token accounting failed: ${entry.file}`);
  await writeFile(path.join(root, "public", dataHref(meta)), documentJson);
  await writeFile(path.join(root, "public", rawHref(meta)), rawBuffer);
  catalog.push(meta);
}
await writeFile(
  path.join(generated, "catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n",
);
const expected = new Set(
  catalog.flatMap((meta) => [
    path.basename(dataHref(meta)),
    path.basename(rawHref(meta)),
  ]),
);
for (const file of await readdir(output)) {
  if (!expected.has(file) && /\.(json|txt)$/.test(file))
    await rm(path.join(output, file));
}
const old = new Map(previous.map((meta) => [meta.id, meta.sha256]));
const changed = catalog.filter(
  (meta) => old.has(meta.id) && old.get(meta.id) !== meta.sha256,
).length;
const added = catalog.filter((meta) => !old.has(meta.id)).length;
const removed = previous.filter(
  (meta) => !catalog.some((item) => item.id === meta.id),
).length;
console.log(
  `Generated ${catalog.length} documents across ${new Set(catalog.map((meta) => meta.provider)).size} providers. ${added} added, ${changed} changed, ${removed} removed.`,
);
