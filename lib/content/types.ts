import type { z } from "zod";
import type {
  captureSchema,
  documentSchema,
  sectionSchema,
  readerIndexSchema,
  sectionBatchSchema,
  renderedSectionSchema,
} from "./schema";

export type Section = z.infer<typeof sectionSchema>;
export type Capture = z.infer<typeof captureSchema>;
export type PromptDocument = z.infer<typeof documentSchema>;
export type ReaderIndex = z.infer<typeof readerIndexSchema>;
export type SectionBatch = z.infer<typeof sectionBatchSchema>;
export type RenderedSection = z.infer<typeof renderedSectionSchema>;

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
