import { defaultUrlTransform } from "react-markdown";
import type { Capture, Section } from "./types";

function headingSlug(label: string) {
  return label
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}
export function sourceUrl(
  value: string,
  capture: Pick<Capture, "sourceUrl">,
  sections: Section[],
) {
  const safe = defaultUrlTransform(value);
  if (!safe) return "";
  if (safe.startsWith("#")) {
    let slug = safe.slice(1);
    try {
      slug = decodeURIComponent(slug);
    } catch {
      return "";
    }
    const section = sections.find(
      (item) => item.id === slug || headingSlug(item.label) === slug,
    );
    return section ? `#${section.id}` : safe;
  }
  if (/^https?:\/\//i.test(safe)) return safe;
  if (/^[a-z][a-z\d+.-]*:/i.test(safe) || safe.startsWith("//")) return "";
  return new URL(safe, capture.sourceUrl).href;
}
