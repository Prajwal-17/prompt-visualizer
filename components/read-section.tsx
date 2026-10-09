"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sectionTitle } from "@/components/contents";
import { loadSectionBatch } from "@/components/reader-data";
import { sectionBatchSize } from "@/lib/content/reader-assets";
import type { Capture, RenderedSection, Section } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const RenderedMarkdown = memo(function RenderedMarkdown({
  html,
  onNavigate,
}: {
  html: string;
  onNavigate: (id: string) => void;
}) {
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const click = useCallback(
    async (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (
        link &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        onNavigate(link.hash.slice(1));
      }
      const button = target?.closest<HTMLButtonElement>(
        "button[data-copy-code]",
      );
      if (!button) return;
      const text =
        button.closest(".source-code")?.querySelector("pre")?.textContent ?? "";
      const label = button.querySelector("[data-copy-label]");
      try {
        await navigator.clipboard.writeText(text);
        if (label) label.textContent = "Copied";
        const timer = setTimeout(() => {
          if (label) label.textContent = "Copy";
          timers.current.delete(timer);
        }, 2000);
        timers.current.add(timer);
      } catch {
        if (label) label.textContent = "Copy failed";
      }
    },
    [onNavigate],
  );
  // HTML comes exclusively from the pinned, safe Markdown generation pipeline.
  return (
    <div
      className="prompt-prose"
      onClick={click}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export const ReadSection = memo(function ReadSection({
  section,
  index,
  capture,
  initial,
  eager,
  onNavigate,
  onReady,
}: {
  section: Section;
  index: number;
  capture: Capture;
  initial?: RenderedSection;
  eager: boolean;
  onNavigate: (id: string) => void;
  onReady: (id: string) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const [content, setContent] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [fullHtml, setFullHtml] = useState<string>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [near, setNear] = useState(false);
  const load = eager || near;
  useEffect(() => {
    if (content || !root.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [content]);
  useEffect(() => {
    if (content || !load) return;
    let cancelled = false;
    loadSectionBatch(capture, `batch-${Math.floor(index / sectionBatchSize)}`)
      .then((batch) => {
        const result = batch.sections.find((item) => item.id === section.id);
        if (!result) throw new Error("Section is missing from its asset.");
        if (!cancelled) {
          setContent(result);
          setError("");
          onReady(section.id);
        }
      })
      .catch((error) => {
        if (!cancelled)
          setError(
            error instanceof Error ? error.message : "Could not load section.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [capture, content, index, load, onReady, retry, section.id]);
  useEffect(() => {
    if (!expanded || fullHtml) return;
    let cancelled = false;
    loadSectionBatch(capture, section.id)
      .then((batch) => {
        const result = batch.sections.find((item) => item.id === section.id);
        if (!result) throw new Error("Complete section is unavailable.");
        if (!cancelled) {
          setFullHtml(result.html);
          setError("");
        }
      })
      .catch((error) => {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load complete section.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [capture, expanded, fullHtml, retry, section.id]);
  const estimated = Math.min(
    1400,
    Math.max(160, Math.ceil((section.end - section.start) / 85) * 32),
  );
  return (
    <article
      ref={root}
      id={section.id}
      tabIndex={-1}
      className="source-section min-w-0 outline-none"
      data-loaded={!!content}
    >
      {content ? (
        <>
          {section.kind === "tag" && (
            <h2 className="mb-6 text-xl font-semibold tracking-tight capitalize">
              {sectionTitle(section)}
            </h2>
          )}
          <RenderedMarkdown
            html={expanded && fullHtml ? fullHtml : content.html}
            onNavigate={onNavigate}
          />
          {content.expandable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded((previous) => !previous)}
              aria-expanded={expanded}
              className="mt-6 gap-2"
            >
              <ChevronDown className={cn("size-4", expanded && "rotate-180")} />
              {expanded
                ? fullHtml
                  ? "Collapse section"
                  : "Loading full section…"
                : `Read full section · ${section.tokens.toLocaleString("en-US")} tokens`}
            </Button>
          )}
        </>
      ) : (
        <div style={{ minHeight: estimated }} className="section-placeholder">
          <p className="text-sm font-medium text-muted-foreground">
            {sectionTitle(section)}
          </p>
          <span className="mt-4 block h-2 w-2/3 rounded bg-muted" />
          <span className="mt-3 block h-2 w-1/2 rounded bg-muted" />
        </div>
      )}
      {error && (
        <div role="alert" className="mt-4 text-sm">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setRetry((previous) => previous + 1)}
          >
            Try again
          </Button>
        </div>
      )}
    </article>
  );
});
