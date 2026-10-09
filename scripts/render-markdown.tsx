import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import React, { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";
import { sourceUrl } from "../lib/content/links";
import { sectionBatchSize } from "../lib/content/reader-assets";
import type {
  Capture,
  PromptDocument,
  RenderedSection,
} from "../lib/content/types";

function StaticCodeBlock({ children }: { children: ReactNode }) {
  const child = isValidElement<{ className?: string }>(children)
    ? children
    : undefined;
  const language = child?.props.className?.replace("language-", "") ?? "Code";
  return (
    <div className="source-code">
      <div className="source-code-toolbar">
        <span>{language}</span>
        <button
          type="button"
          aria-label="Copy code block"
          data-copy-code
          className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 hover:text-foreground"
        >
          <Copy className="size-3.5" />
          <span data-copy-label>Copy</span>
        </button>
      </div>
      <pre tabIndex={0} aria-label={`${language} code`}>
        {children}
      </pre>
    </div>
  );
}
export function renderMarkdown(
  text: string,
  capture: Pick<Capture, "sourceUrl">,
  document: Pick<PromptDocument, "sections">,
) {
  // ReactMarkdown does not execute raw HTML. URL transformation and inert image
  // placeholders apply before React escapes and serializes this trusted output.
  return renderToStaticMarkup(
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      urlTransform={(url) => sourceUrl(url, capture, document.sections)}
      components={{
        h1: ({ children }) => <h2>{children}</h2>,
        h2: ({ children }) => <h3>{children}</h3>,
        h3: ({ children }) => <h4>{children}</h4>,
        pre: ({ children }) => <StaticCodeBlock>{children}</StaticCodeBlock>,
        a: ({ href, children }) =>
          href ? (
            <a
              href={href}
              target={href.startsWith("#") ? undefined : "_blank"}
              rel="noreferrer"
            >
              {children}
            </a>
          ) : (
            <span>{children}</span>
          ),
        img: ({ alt }) => (
          <span className="text-muted-foreground">
            [Image in source{alt ? `: ${alt}` : ""}]
          </span>
        ),
      }}
    >
      {text}
    </ReactMarkdown>,
  );
}
export async function generateReaderAssets(
  capture: Capture,
  document: PromptDocument,
  output: string,
) {
  const expanded: Record<string, string> = {};
  const fragments: RenderedSection[] = document.sections.map((section) => {
    const text = document.text.slice(section.start, section.end);
    const expandable = text.length > 12000;
    if (expandable)
      expanded[section.id] = renderMarkdown(text, capture, document);
    return {
      id: section.id,
      html: renderMarkdown(
        expandable ? text.slice(0, 6000) : text,
        capture,
        document,
      ),
      expandable,
    };
  });
  const index = {
    id: document.id,
    sha256: document.sha256,
    parts: document.parts,
    sections: document.sections,
    batchSize: sectionBatchSize,
  };
  const search = document.sections.map((section) => ({
    id: section.id,
    text: `${section.label} ${document.text.slice(section.start, section.end)}`.toLowerCase(),
  }));
  const readerHash = createHash("sha256")
    .update(JSON.stringify({ index, fragments, expanded, search }))
    .digest("hex");
  const directory = path.join(
    output,
    "reader",
    `${capture.id}.${readerHash.slice(0, 12)}`,
  );
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.json"), JSON.stringify(index));
  await writeFile(path.join(directory, "search.json"), JSON.stringify(search));
  for (let i = 0; i < fragments.length; i += sectionBatchSize) {
    await writeFile(
      path.join(directory, `batch-${i / sectionBatchSize}.json`),
      JSON.stringify({
        id: document.id,
        sha256: document.sha256,
        sections: fragments.slice(i, i + sectionBatchSize),
      }),
    );
  }
  for (const [id, html] of Object.entries(expanded)) {
    await writeFile(
      path.join(directory, `${id}.json`),
      JSON.stringify({
        id: document.id,
        sha256: document.sha256,
        sections: [{ id, html, expandable: true }],
      }),
    );
  }
  return readerHash;
}
