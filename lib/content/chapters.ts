import type { Section } from "./types";

export function groupChapters(sections: Section[]) {
  const depth = Math.min(
    ...sections
      .filter((section) => section.depth > 0)
      .map((section) => section.depth),
    6,
  );
  const groups: { root: Section; sections: Section[] }[] = [];
  for (const section of sections) {
    if (!groups.length || section.depth <= depth)
      groups.push({ root: section, sections: [section] });
    else groups.at(-1)!.sections.push(section);
  }
  // Keep a short opening paragraph with the first real chapter.
  if (
    groups.length > 1 &&
    groups[0].root.kind === "preamble" &&
    groups[0].root.end - groups[0].root.start < 1200
  ) {
    groups[1].sections.unshift(...groups[0].sections);
    groups.shift();
  }
  return groups;
}
