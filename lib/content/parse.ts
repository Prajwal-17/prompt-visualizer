import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Heading } from "mdast";
import { categories, categoryIds, type Category, type Section } from "./types";

export function classifyLabel(label: string): Category {
  label = label.replace(/[_-]+/g, " ");
  if (
    /safety|harm|privacy|security|refus|policy|policies|boundar|copyright|permission|sensitive/i.test(
      label,
    )
  )
    return "safety";
  if (
    /tool|function|namespace|capabilit|brows|search|artifact|connector|command|api|execution/i.test(
      label,
    )
  )
    return "tools";
  if (
    /\b(?:style|tone|format(?:ting)?|writing|citation|personality|communication|response|output|verbosity|markdown)\b/i.test(
      label,
    )
  )
    return "style";
  if (
    /context|environment|memory|date|workflow|workspace|skill|platform|product information|knowledge|reminder|plan|task|system reminder/i.test(
      label,
    )
  )
    return "context";
  if (
    /identity|behavior|behaviour|role|persona|assistant|autonomy|collaborat|principle|instruction/i.test(
      label,
    )
  )
    return "identity";
  return "other";
}

function headingLabel(node: Heading) {
  return node.children
    .map((child) =>
      "value" in child
        ? String(child.value)
        : "children" in child
          ? child.children.map((c) => ("value" in c ? c.value : "")).join("")
          : "",
    )
    .join("")
    .trim();
}

export function extractSections(raw: string): Section[] {
  if (!raw.length) return [];
  const tree = unified().use(remarkParse).use(remarkGfm).parse(raw);
  const points = new Map<
    number,
    { label: string; depth: number; kind: Section["kind"] }
  >();
  for (const node of tree.children) {
    if (node.type === "heading" && node.position?.start.offset !== undefined) {
      points.set(node.position.start.offset, {
        label: headingLabel(node),
        depth: node.depth,
        kind: "heading",
      });
    }
  }

  // Literal XML-style tags often wrap Markdown. Inspect line boundaries as data,
  // never XML/HTML execution. Code fences are excluded from structural detection.
  let offset = 0;
  let fence: { char: string; length: number } | null = null;
  const tagStack: string[] = [];
  for (const line of raw.split(/(?<=\n)/)) {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = { char: marker[0], length: marker.length };
      else if (
        marker[0] === fence.char &&
        marker.length >= fence.length &&
        new RegExp(`^ {0,3}${fence.char}{${fence.length},}\\s*$`).test(line)
      )
        fence = null;
      offset += line.length;
      continue;
    }
    if (!fence) {
      const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (heading && !points.has(offset))
        points.set(offset, {
          label: heading[2].replace(/\*\*/g, ""),
          depth: heading[1].length,
          kind: "heading",
        });
      const tag = line
        .trim()
        .match(/^`?<([A-Za-z][\w:.-]*)(?:\s+[^<>]*)?>`?\s*$/);
      const closing = line.trim().match(/^`?<\/([A-Za-z][\w:.-]*)>`?\s*$/);
      if (closing) {
        const index = tagStack.lastIndexOf(closing[1]);
        if (index >= 0) tagStack.splice(index);
      } else if (tag && !/^(br|hr|img|input|meta|link)$/i.test(tag[1])) {
        points.set(offset, {
          label: tag[1],
          depth: Math.min(tagStack.length + 1, 6),
          kind: "tag",
        });
        tagStack.push(tag[1]);
      }
    }
    offset += line.length;
  }

  if (!points.has(0))
    points.set(0, { label: "Preamble", depth: 0, kind: "preamble" });
  const sorted = [...points.entries()].sort((a, b) => a[0] - b[0]);
  let byteOffset = 0;
  const parents: { depth: number; category: Category }[] = [];
  return sorted.map(([start, point], index) => {
    const end = sorted[index + 1]?.[0] ?? raw.length;
    const bytes = Buffer.byteLength(raw.slice(start, end), "utf8");
    while (parents.length && parents.at(-1)!.depth >= point.depth)
      parents.pop();
    let category = classifyLabel(point.label);
    let method: Section["method"] = category === "other" ? "unknown" : "label";
    if (point.kind === "preamble") {
      if (
        /^(?:\s|`|#)*(?:You are|Claude is|Claude doesn't|You’re|You are an)/i.test(
          raw.slice(0, Math.min(end, 200)),
        )
      ) {
        category = "identity";
        method = "preamble";
      }
    } else if (
      category === "other" &&
      parents.at(-1)?.category !== undefined &&
      parents.at(-1)?.category !== "other"
    ) {
      category = parents.at(-1)!.category;
      method = "inherited";
    }
    if (point.kind !== "preamble")
      parents.push({ depth: point.depth, category });
    const section: Section = {
      id: `section-${index + 1}`,
      ...point,
      category,
      method,
      start,
      end,
      byteStart: byteOffset,
      byteEnd: byteOffset + bytes,
      tokens: 0,
    };
    byteOffset += bytes;
    return section;
  });
}

export function measureCategories(sections: Section[]) {
  const totals = Object.fromEntries(categoryIds.map((id) => [id, 0])) as Record<
    Category,
    number
  >;
  for (const section of sections)
    totals[section.category] += section.byteEnd - section.byteStart;
  return totals;
}

export function sectionExplanation(section: Pick<Section, "category">) {
  return categories[section.category].explanation;
}
