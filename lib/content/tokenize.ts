// Build-time only. Do not import tokenizer dictionaries into a browser or Worker.
import { encode } from "gpt-tokenizer/encoding/o200k_base";
import vocabulary from "gpt-tokenizer/bpeRanks/o200k_base";
import { categoryIds, type Category, type Section } from "./types";

export const tokenizer = "o200k_base" as const;
export const tokenizerVersion = "gpt-tokenizer@4.0.0" as const;
export const literalTextOptions = {
  allowedSpecial: new Set<string>(),
  disallowedSpecial: new Set<string>(),
};

export function measureTokens(raw: string, sourceSections: Section[]) {
  const encoded = encode(raw, literalTextOptions);
  const sections = sourceSections.map((section) => ({ ...section, tokens: 0 }));
  const categoryTokens = Object.fromEntries(
    categoryIds.map((id) => [id, 0]),
  ) as Record<Category, number>;
  const decoded: Buffer[] = [];
  let byteOffset = 0;
  let sectionIndex = 0;

  for (const token of encoded) {
    const value = vocabulary[token];
    if (value === undefined)
      throw new Error(`Token ${token} has no byte vocabulary entry.`);
    const bytes =
      typeof value === "string"
        ? Buffer.from(value, "utf8")
        : Buffer.from(value);
    while (
      sections[sectionIndex] &&
      byteOffset >= sections[sectionIndex].byteEnd
    )
      sectionIndex++;
    const section = sections[sectionIndex];
    if (!section || byteOffset < section.byteStart)
      throw new Error(
        "Token source position is outside the section partition.",
      );
    // A token crossing a section boundary belongs to the section where it starts.
    // Use the byte vocabulary rather than decoding each token as Unicode: some
    // token pieces are partial UTF-8 sequences and cannot be decoded alone.
    section.tokens++;
    categoryTokens[section.category]++;
    decoded.push(bytes);
    byteOffset += bytes.length;
  }

  if (!Buffer.concat(decoded).equals(Buffer.from(raw, "utf8")))
    throw new Error("Tokenizer bytes do not reproduce the original source.");
  return {
    tokens: encoded.length,
    tokenizer,
    tokenizerVersion,
    sections,
    categoryTokens,
  };
}
