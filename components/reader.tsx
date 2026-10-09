"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidElement, useEffect, useState, type ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  GitCompareArrows,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CategoryDot,
  Composition,
  CompositionLegend,
} from "@/components/composition";
import { Contents, sectionTitle } from "@/components/contents";
import { CapturePicker } from "@/components/capture-picker";
import {
  EncodingInfo,
  MeasureSwitch,
  type Measure,
} from "@/components/measurement";
import {
  updateQuery,
  useQueryParam,
  useSectionHash,
} from "@/components/use-url-state";
import { captureVariants } from "@/lib/content/catalog";
import {
  captureHref,
  layerLabels,
  rawHref,
  sourceHref,
  variantLabels,
  type Capture,
  type PromptDocument,
  type Section,
} from "@/lib/content/types";
import { catalog } from "@/lib/content/catalog";
import { groupChapters } from "@/lib/content/chapters";
import { cn } from "@/lib/utils";

function headingSlug(label: string) {
  return label
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}
function sourceUrl(value: string, capture: Capture, sections: Section[]) {
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
  return new URL(safe, sourceHref(capture)).href;
}
function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const child = isValidElement<{ children?: ReactNode; className?: string }>(
    children,
  )
    ? children
    : undefined;
  const text =
    typeof child?.props.children === "string" ? child.props.children : "";
  const language = child?.props.className?.replace("language-", "") ?? "Code";
  return (
    <div className="source-code">
      <div className="source-code-toolbar">
        <span>{language}</span>
        <button
          type="button"
          aria-label="Copy code block"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre tabIndex={0} aria-label={`${language} code`}>
        {children}
      </pre>
    </div>
  );
}
export function Markdown({
  text,
  capture,
  sections = [],
  onNavigate,
}: {
  text: string;
  capture: Capture;
  sections?: Section[];
  onNavigate?: (id: string) => void;
}) {
  return (
    <div className="prompt-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => sourceUrl(url, capture, sections)}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h3>{children}</h3>,
          h3: ({ children }) => <h4>{children}</h4>,
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          a: ({ href, children }) =>
            href ? (
              <a
                href={href}
                target={href.startsWith("#") ? undefined : "_blank"}
                rel="noreferrer"
                onClick={(event) => {
                  if (href.startsWith("#") && onNavigate) {
                    event.preventDefault();
                    onNavigate(href.slice(1));
                  }
                }}
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
      </ReactMarkdown>
    </div>
  );
}
function ReadSection({
  section,
  document,
  capture,
  onNavigate,
}: {
  section: Section;
  document: PromptDocument;
  capture: Capture;
  onNavigate: (id: string) => void;
}) {
  const text = document.text.slice(section.start, section.end);
  const long = text.length > 12000;
  const [expanded, setExpanded] = useState(!long);
  return (
    <article
      id={section.id}
      tabIndex={-1}
      className="source-section min-w-0 outline-none"
    >
      {section.kind === "tag" && (
        <h2 className="mb-6 text-xl font-semibold tracking-tight capitalize">
          {sectionTitle(section)}
        </h2>
      )}
      <Markdown
        text={expanded ? text : text.slice(0, 6000)}
        capture={capture}
        sections={document.sections}
        onNavigate={onNavigate}
      />
      {long && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((previous) => !previous)}
          aria-expanded={expanded}
          className="mt-6 gap-2"
        >
          <ChevronDown className={cn("size-4", expanded && "rotate-180")} />
          {expanded
            ? "Collapse section"
            : `Read full section · ${section.tokens.toLocaleString("en-US")} tokens`}
        </Button>
      )}
    </article>
  );
}
export function Reader({
  capture,
  document,
}: {
  capture: Capture;
  document: PromptDocument;
}) {
  const router = useRouter();
  const requestedMode = useQueryParam("view", "read");
  const mode = ["read", "structure", "raw"].includes(requestedMode)
    ? requestedMode
    : "read";
  const reading =
    useQueryParam("reading", "section") === "continuous"
      ? "continuous"
      : "section";
  const hash = useSectionHash();
  const [navigation, setNavigation] = useState(0);
  const [observed, setObserved] = useState(document.sections[0]?.id);
  const selected =
    document.sections.find((section) => section.id === hash) ??
    document.sections[0];
  const chapters = groupChapters(document.sections);
  const selectedIndex = Math.max(
    0,
    chapters.findIndex((chapter) =>
      chapter.sections.some(
        (section) =>
          section.id === (reading === "section" ? selected?.id : observed),
      ),
    ),
  );
  const chapter = chapters[selectedIndex];
  const active = reading === "section" ? hash || chapter?.root.id : observed;
  const [measure, setMeasure] = useState<Measure>("tokens");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [wrap, setWrap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(false);
  const variants = captureVariants(capture);
  useEffect(() => {
    if (mode !== "read" || !hash) return;
    const frame = requestAnimationFrame(() => {
      const element = window.document.getElementById(hash);
      element?.scrollIntoView({ block: "start" });
      element?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, mode, reading, navigation]);
  useEffect(() => {
    if (mode !== "read" || reading !== "continuous") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setObserved(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    document.sections.forEach((section) => {
      const element = window.document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [document.sections, mode, reading]);
  function jump(id: string) {
    setNavigation((previous) => previous + 1);
    updateQuery({ view: null }, id);
    setObserved(id);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(document.raw);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 2500);
  }
  return (
    <div className="reader-layout mx-auto max-w-[1180px] px-5 pb-16 pt-7 sm:px-9 lg:px-10 lg:pt-10">
      <div className="min-w-0">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/?provider=${encodeURIComponent(capture.provider)}`}
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Library
          </Link>
          <div className="w-full sm:w-80">
            <CapturePicker
              capture={capture}
              label="Choose prompt"
              compact
              onChange={(id) => {
                const item = catalog.find((entry) => entry.id === id);
                if (item) router.push(captureHref(item));
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{capture.provider}</span>
          <span aria-hidden="true">/</span>
          <span>{capture.product}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {capture.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
          <span>
            <strong
              className="font-mono text-base font-medium tabular-nums"
              data-testid="token-total"
            >
              {capture.tokens.toLocaleString("en-US")}
            </strong>{" "}
            <span className="text-muted-foreground">tokens</span>
          </span>
          <span className="text-muted-foreground">
            {capture.sectionCount} sections
          </span>
          <span className="text-muted-foreground">
            {variantLabels[capture.variant]}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <EncodingInfo />
          <a
            href={sourceHref(capture)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {capture.variant === "published"
              ? "Publication archive"
              : capture.sourceKind === "contributed"
                ? "Contributed source"
                : "Community capture"}
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
        {variants.length > 1 && (
          <nav
            aria-label="Capture variants"
            className="mt-6 flex flex-wrap gap-2"
          >
            {variants.map((item) => (
              <Link
                href={captureHref(item)}
                prefetch={false}
                key={item.id}
                aria-current={capture.id === item.id ? "page" : undefined}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs hover:border-foreground/30",
                  capture.id === item.id
                    ? "border-foreground/20 bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                {variantLabels[item.variant]}
              </Link>
            ))}
          </nav>
        )}
        <Tabs
          value={mode}
          onValueChange={(value) =>
            updateQuery({ view: value === "read" ? null : value })
          }
          className="mt-7"
        >
          <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-2 border-b bg-background py-2">
            <TabsList variant="line" className="p-0">
              {["read", "structure", "raw"].map((value) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="px-2.5 text-sm"
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex items-center gap-1">
              <Contents
                placement="toolbar"
                sections={document.sections}
                text={document.text}
                active={active}
                onSelect={jump}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy original prompt"
                    onClick={copy}
                  >
                    {copyState === "copied" ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy original capture</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon-sm">
                    <a
                      href={rawHref(capture)}
                      download={`${capture.slug}.txt`}
                      aria-label="Download original prompt"
                    >
                      <Download className="size-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download original capture</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon-sm">
                    <Link
                      href={`/compare/?left=${capture.id}`}
                      prefetch={false}
                      aria-label="Compare this prompt"
                    >
                      <GitCompareArrows className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compare this prompt</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "text-xs text-muted-foreground",
              copyState === "idle" ? "sr-only" : "mt-2",
            )}
          >
            {copyState === "copied"
              ? "Original prompt copied."
              : copyState === "error"
                ? "Clipboard unavailable. Use the download instead."
                : ""}
          </p>
          <TabsContent value={mode} className="mt-0 min-w-0">
            {mode !== "raw" && (
              <details className="composition-disclosure border-b py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
                  <span>Composition</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </summary>
                <div className="pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="How categories are assigned"
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <Info className="size-3.5" />
                          By section labels
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Categories are inferred from headings and XML labels.
                        They describe the selected instruction text, not API
                        message roles. Token totals use o200k_base.
                      </TooltipContent>
                    </Tooltip>
                    <MeasureSwitch value={measure} onChange={setMeasure} />
                  </div>
                  <Composition
                    capture={capture}
                    measure={measure}
                    onSelect={(category) => {
                      const section = document.sections.find(
                        (item) => item.category === category,
                      );
                      if (section) jump(section.id);
                    }}
                  />
                  <div className="mt-3">
                    <CompositionLegend
                      capture={capture}
                      measure={measure}
                      percentages
                    />
                  </div>
                </div>
              </details>
            )}
            {mode === "read" && (
              <>
                <div className="mb-8 mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div
                    role="group"
                    aria-label="Reading layout"
                    className="inline-flex gap-0.5 rounded-lg bg-muted p-1"
                  >
                    {["section", "continuous"].map((value) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={reading === value}
                        onClick={() =>
                          updateQuery({
                            reading: value === "section" ? null : value,
                          })
                        }
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs",
                          reading === value
                            ? "bg-card font-medium shadow-sm"
                            : "text-muted-foreground",
                        )}
                      >
                        {value === "section" ? "Section reading" : "Continuous"}
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    Chapter {selectedIndex + 1} / {chapters.length}
                  </span>
                </div>
                <div
                  className={cn(
                    "min-w-0",
                    reading === "continuous" && "space-y-12",
                  )}
                >
                  {(reading === "section"
                    ? (chapter?.sections ?? [])
                    : document.sections
                  )
                    .filter((section): section is Section => !!section)
                    .map((section) => (
                      <ReadSection
                        key={section.id}
                        section={section}
                        document={document}
                        capture={capture}
                        onNavigate={jump}
                      />
                    ))}
                </div>
                <div className="mt-12 grid grid-cols-2 gap-4 border-t pt-6">
                  {[-1, 1].map((offset) => {
                    const destination = chapters[selectedIndex + offset]?.root;
                    return (
                      <button
                        type="button"
                        key={offset}
                        disabled={!destination}
                        aria-label={
                          offset < 0 ? "Previous chapter" : "Next chapter"
                        }
                        onClick={() => destination && jump(destination.id)}
                        className={cn(
                          "flex min-w-0 flex-col gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted disabled:opacity-30",
                          offset > 0 && "items-end text-right",
                        )}
                      >
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          {offset < 0 && <ArrowLeft className="size-3.5" />}
                          {offset < 0 ? "Previous" : "Next"}
                          {offset > 0 && <ArrowRight className="size-3.5" />}
                        </span>
                        <span className="max-w-full truncate text-sm font-medium">
                          {destination
                            ? sectionTitle(destination)
                            : offset < 0
                              ? "Start of prompt"
                              : "End of prompt"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {mode === "structure" && (
              <div className="py-7">
                <h2 className="text-lg font-semibold">Captured layers</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {capture.boundary} Layer counts partition the original
                  capture; the reader count encodes the selected instruction
                  span separately.
                </p>
                <div className="mt-4 space-y-1">
                  {document.parts.map((part, index) => (
                    <div
                      key={index}
                      className="flex justify-between gap-4 border-b py-3 text-sm"
                    >
                      <span>{layerLabels[part.layer]}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums">
                        {part.tokens.toLocaleString("en-US")} tokens
                      </span>
                    </div>
                  ))}
                </div>
                <h2 className="mb-4 mt-9 text-lg font-semibold">
                  Instruction sections
                </h2>
                <div className="grid grid-cols-[minmax(0,1fr)_70px_70px] gap-3 border-b pb-3 text-xs text-muted-foreground">
                  <span>Section</span>
                  <span className="text-right">Tokens</span>
                  <span className="text-right">Bytes</span>
                </div>
                {document.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => jump(section.id)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_70px_70px] items-center gap-3 border-b py-3 text-left hover:bg-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <CategoryDot category={section.category} />
                      <span className="truncate">{sectionTitle(section)}</span>
                    </span>
                    <span className="text-right font-mono text-xs tabular-nums">
                      {section.tokens.toLocaleString("en-US")}
                    </span>
                    <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {(section.byteEnd - section.byteStart).toLocaleString(
                        "en-US",
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {mode === "raw" && (
              <div className="py-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    {capture.rawTokens.toLocaleString("en-US")} tokens ·{" "}
                    {capture.rawBytes.toLocaleString("en-US")} bytes · original
                    file
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={wrap}
                        onChange={(event) => {
                          setWrap(event.target.checked);
                          if (event.target.checked) setLineNumbers(false);
                        }}
                      />
                      Wrap lines
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={lineNumbers}
                        onChange={(event) => {
                          setLineNumbers(event.target.checked);
                          if (event.target.checked) setWrap(false);
                        }}
                      />
                      Line numbers
                    </label>
                  </div>
                </div>
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Original capture source"
                  className="flex max-h-[75svh] overflow-auto rounded-lg bg-muted p-5"
                >
                  {lineNumbers && (
                    <pre
                      aria-hidden="true"
                      className="mr-5 select-none text-right font-mono text-[13px] leading-7 text-muted-foreground"
                    >
                      {document.raw
                        .split("\n")
                        .map((_, index) => index + 1)
                        .join("\n")}
                    </pre>
                  )}
                  <pre
                    data-testid="raw-source"
                    className={cn(
                      "min-w-0 flex-1 font-mono text-[13px] leading-7",
                      wrap
                        ? "whitespace-pre-wrap break-words"
                        : "whitespace-pre",
                    )}
                  >
                    {document.raw}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="mt-12 border-t pt-5 text-xs leading-6 text-muted-foreground">
          <p>{capture.boundary}</p>
          {capture.variant === "published" && (
            <p>
              Mirrored provider publication; the live official page has not been
              independently verified.
            </p>
          )}
          <a
            href={sourceHref(capture)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 hover:text-foreground"
          >
            {capture.sourceCommit
              ? `Source pinned to ${capture.sourceCommit.slice(0, 8)}`
              : "View source"}
            <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
      <div className="reader-contents">
        <Contents
          sections={document.sections}
          text={document.text}
          active={active}
          onSelect={jump}
        />
      </div>
    </div>
  );
}
