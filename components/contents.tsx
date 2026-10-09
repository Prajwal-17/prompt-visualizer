"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ListTree, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Section } from "@/lib/content/types";
import { groupChapters } from "@/lib/content/chapters";
import { cn } from "@/lib/utils";

export function sectionTitle(section: Section) {
  return section.kind === "tag"
    ? section.label.replaceAll("_", " ")
    : section.label;
}
function ContentsList({
  sections,
  searchAsset,
  active,
  onSelect,
}: {
  sections: Section[];
  searchAsset: string;
  active?: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const worker = useRef<Worker>(null);
  const sequence = useRef(0);
  const [result, setResult] = useState<{
    query: string;
    matches: string[];
    error?: string;
  }>({ query: "", matches: [] });
  const term = query.trim().toLowerCase();
  useEffect(() => () => worker.current?.terminate(), []);
  useEffect(() => {
    const request = ++sequence.current;
    if (!term) return;
    Promise.resolve()
      .then(() => {
        worker.current ??= new Worker("/search-worker.js");
        worker.current.onmessage = ({ data }) => {
          if (data.request === sequence.current)
            setResult({
              query: term,
              matches: data.matches ?? [],
              error: data.error,
            });
        };
        worker.current.onerror = () =>
          setResult({
            query: term,
            matches: [],
            error: "Full-text search unavailable. Showing title matches.",
          });
        worker.current.postMessage({
          query: term,
          request,
          asset: searchAsset,
        });
      })
      .catch(() =>
        setResult({
          query: term,
          matches: [],
          error: "Full-text search unavailable. Showing title matches.",
        }),
      );
  }, [searchAsset, term]);
  const groups = useMemo(
    () =>
      groupChapters(sections).map((group) => ({
        root: group.root,
        children: group.sections.filter(
          (section) => section.id !== group.root.id,
        ),
      })),
    [sections],
  );
  const visible = useMemo(() => {
    if (!term) return sections;
    const matches = new Set(result.query === term ? result.matches : []);
    return sections.filter(
      (section) =>
        matches.has(section.id) || section.label.toLowerCase().includes(term),
    );
  }, [result, sections, term]);
  function item(section: Section, child = false) {
    return (
      <button
        type="button"
        key={section.id}
        onClick={() => onSelect(section.id)}
        aria-current={active === section.id ? "location" : undefined}
        className={cn(
          "w-full rounded-md px-3 py-2.5 text-left text-[13px] leading-5 hover:bg-muted",
          child && "pl-5",
          active === section.id
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground",
        )}
      >
        {sectionTitle(section)}
      </button>
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">On this page</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {sections.length}
        </span>
      </div>
      <label className="mb-4 flex items-center gap-2 rounded-lg border bg-card px-3 focus-within:ring-1 focus-within:ring-ring">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          aria-label="Search contents"
          placeholder="Find a section or text…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none"
        />
      </label>
      <nav
        aria-label="Table of contents"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
      >
        {query.trim()
          ? visible.map((section) => item(section))
          : groups.map(({ root, children }) => {
              const isExpanded =
                expanded[root.id] ??
                (active === root.id ||
                  children.some((section) => section.id === active));
              return (
                <div key={root.id}>
                  <div className="flex items-start gap-0.5">
                    {item(root)}
                    {children.length > 0 && (
                      <button
                        type="button"
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${sectionTitle(root)}`}
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpanded((previous) => ({
                            ...previous,
                            [root.id]: !isExpanded,
                          }))
                        }
                        className="mt-1.5 shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <ChevronDown
                          className={cn(
                            "size-3.5",
                            !isExpanded && "-rotate-90",
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {isExpanded && children.map((section) => item(section, true))}
                </div>
              );
            })}
        {!visible.length && (
          <p className="px-3 py-6 text-sm text-muted-foreground">
            No matching sections.
          </p>
        )}
      </nav>
      {term && (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          {result.query !== term
            ? "Searching prompt…"
            : (result.error ?? `${visible.length} matching sections`)}
        </p>
      )}
    </div>
  );
}
export const Contents = memo(function Contents(props: {
  placement?: "rail" | "toolbar";
  sections: Section[];
  searchAsset: string;
  active?: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selecting = useRef(false);
  if (props.placement !== "toolbar")
    return (
      <aside
        aria-label="Document navigation"
        className="hidden h-full lg:block"
      >
        <div className="h-full">
          <ContentsList {...props} />
        </div>
      </aside>
    );
  return (
    <>
      <div className="lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Open table of contents"
              className="gap-2 px-2"
            >
              <ListTree className="size-4" />
              <span className="hidden sm:inline">Contents</span>
            </Button>
          </DialogTrigger>
          <DialogContent
            className="fixed left-auto right-0 top-0 h-svh max-w-[min(360px,100vw)] translate-x-0 translate-y-0 rounded-none px-6 pt-7 sm:max-w-[360px]"
            onCloseAutoFocus={(event) => {
              if (selecting.current) event.preventDefault();
              selecting.current = false;
            }}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Contents</DialogTitle>
              <DialogDescription>
                Find a section in this prompt.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-7 min-h-0 h-[calc(100svh-100px)]">
              <ContentsList
                {...props}
                onSelect={(id) => {
                  selecting.current = true;
                  props.onSelect(id);
                  setOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
});
