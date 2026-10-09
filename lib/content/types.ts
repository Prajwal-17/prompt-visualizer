import { z } from "zod";

export const categoryIds = [
  "identity",
  "tools",
  "style",
  "context",
  "safety",
  "other",
] as const;
export type Category = (typeof categoryIds)[number];

export const categories: Record<
  Category,
  { label: string; short: string; explanation: string }
> = {
  identity: {
    label: "Identity & behavior",
    short: "Identity",
    explanation:
      "Establishes the assistant's role, behavior, and relationship with the person using it.",
  },
  tools: {
    label: "Tools & capabilities",
    short: "Tools",
    explanation:
      "Describes available tools and the conditions for using them. Product capabilities often account for a substantial part of a capture.",
  },
  style: {
    label: "Style & formatting",
    short: "Style",
    explanation:
      "Shapes how answers are written, formatted, and presented, including tone and output conventions.",
  },
  context: {
    label: "Context & workflow",
    short: "Context",
    explanation:
      "Supplies product context, environment details, memory, or instructions for a particular workflow.",
  },
  safety: {
    label: "Safety & boundaries",
    short: "Safety",
    explanation:
      "Sets boundaries for content, privacy, security, and situations that need special handling.",
  },
  other: {
    label: "Unclassified",
    short: "Other",
    explanation:
      "This section has no recognized category. Read the original text to understand its purpose; an unknown label does not mean it is unimportant.",
  },
};

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
export type Section = z.infer<typeof sectionSchema>;

export const variantLabels = {
  main: "Main instructions",
  runtime: "Runtime capture",
  published: "Published archive",
} as const;
export const layerLabels = {
  instructions: "Main instructions",
  runtime: "Runtime instructions & tools",
  context: "Environment & product context",
  tools: "Tools & schemas",
  user: "User message & memory",
  annotation: "Source annotations",
} as const;
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
export type Capture = z.infer<typeof captureSchema>;
export const documentSchema = z.object({
  id: z.string(),
  sha256: z.string(),
  raw: z.string(),
  text: z.string(),
  textStart: z.number().int().nonnegative(),
  parts: z.array(sourcePartSchema),
  sections: z.array(sectionSchema),
});
export type PromptDocument = z.infer<typeof documentSchema>;

export function captureHref(capture: Pick<Capture, "providerSlug" | "slug">) {
  return `/prompts/${capture.providerSlug}/${capture.slug}/`;
}

export function sourceHref(capture: Pick<Capture, "sourceUrl">) {
  return capture.sourceUrl;
}

export function dataHref(capture: Pick<Capture, "id" | "documentHash">) {
  return `/data/${capture.id}.${capture.documentHash.slice(0, 12)}.json`;
}

export function rawHref(capture: Pick<Capture, "id" | "sha256">) {
  return `/data/${capture.id}.${capture.sha256.slice(0, 12)}.txt`;
}
