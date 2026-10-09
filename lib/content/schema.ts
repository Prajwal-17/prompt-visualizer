import { z } from "zod";
import { categoryIds } from "./types";

export const sectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  depth: z.number().int(),
  kind: z.enum(["heading", "tag", "preamble"]),
  category: z.enum(categoryIds),
  method: z.enum(["label", "inherited", "preamble", "unknown"]),
  start: z.number().int(),
  end: z.number().int(),
  byteStart: z.number().int(),
  byteEnd: z.number().int(),
  tokens: z.number().int().nonnegative(),
});

export const sourcePartSchema = z.object({
  layer: z.enum([
    "instructions",
    "runtime",
    "context",
    "tools",
    "user",
    "annotation",
  ]),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
});

export const captureSchema = z.object({
  id: z.string(),
  provider: z.string(),
  providerSlug: z.string(),
  slug: z.string(),
  title: z.string(),
  model: z.string().nullable(),
  product: z.string(),
  variant: z.enum(["main", "runtime", "published"]),
  boundary: z.string(),
  type: z.enum(["capture", "supporting"]),
  sourcePath: z.string(),
  sourceCommit: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .nullable(),
  sourceKind: z.enum(["community", "official", "contributed"]),
  sourceUrl: z.url(),
  format: z.enum(["Markdown", "XML", "Markdown + XML", "Text"]),
  sha256: z.string(),
  documentHash: z.string(),
  readerHash: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int(),
  tokens: z.number().int().nonnegative(),
  rawTokens: z.number().int().nonnegative(),
  rawBytes: z.number().int().nonnegative(),
  tokenizer: z.literal("o200k_base"),
  tokenizerVersion: z.literal("gpt-tokenizer@4.0.0"),
  words: z.number().int(),
  lines: z.number().int(),
  sectionCount: z.number().int(),
  summary: z.string(),
  featured: z.boolean(),
  categoryBytes: z.record(z.enum(categoryIds), z.number()),
  categoryTokens: z.record(z.enum(categoryIds), z.number().int().nonnegative()),
  categorySections: z.record(
    z.enum(categoryIds),
    z.number().int().nonnegative(),
  ),
});
export const documentSchema = z.object({
  id: z.string(),
  sha256: z.string(),
  raw: z.string(),
  text: z.string(),
  textStart: z.number().int().nonnegative(),
  parts: z.array(sourcePartSchema),
  sections: z.array(sectionSchema),
});

export const readerIndexSchema = z.object({
  id: z.string(),
  sha256: z.string(),
  parts: z.array(sourcePartSchema),
  sections: z.array(sectionSchema),
  batchSize: z.literal(8),
});
export const renderedSectionSchema = z.object({
  id: z.string(),
  html: z.string(),
  expandable: z.boolean(),
});
export const sectionBatchSchema = z.object({
  id: z.string(),
  sha256: z.string(),
  sections: z.array(renderedSectionSchema),
});
