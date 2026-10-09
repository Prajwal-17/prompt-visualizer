"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
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
type ContentsNode = { section: Section; children: ContentsNode[] };

function contentsTree(sections: Section[]) {
  const roots = groupChapters(sections).map((group) => {
    const root: ContentsNode = { section: group.root, children: [] };
    const stack = [root];
    for (const section of group.sections) {
      if (section.id === group.root.id) continue;
      while (stack.length > 1 && stack.at(-1)!.section.depth >= section.depth)
        stack.pop();
      const node: ContentsNode = { section, children: [] };
      stack.at(-1)!.children.push(node);
      if (section.kind !== "preamble") stack.push(node);
    }
    return root;
  });
  const parents = new Map<string, string[]>();
  const branches: string[] = [];
  function visit(nodes: ContentsNode[], ancestors: string[]) {
    for (const node of nodes) {
      parents.set(node.section.id, ancestors);
      if (node.children.length) {
        branches.push(node.section.id);
        visit(node.children, [...ancestors, node.section.id]);
      }
    }
  }
  visit(roots, []);
  return { roots, parents, branches };
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
  const treeId = useId();
  const navigation = useRef<HTMLElement>(null);
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
  const tree = useMemo(() => contentsTree(sections), [sections]);
  const activeParents = active ? (tree.parents.get(active) ?? []) : [];
  function isExpanded(id: string) {
    return expanded[id] ?? (active === id || activeParents.includes(id));
  }
  const expandedCount = tree.branches.filter(isExpanded).length;
  useEffect(() => {
    const nav = navigation.current;
    const selected = nav?.querySelector('[aria-current="location"]');
    if (!nav || !selected || term) return;
    const bounds = nav.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    if (item.top < bounds.top) nav.scrollTop += item.top - bounds.top;
    else if (item.bottom > bounds.bottom)
      nav.scrollTop += item.bottom - bounds.bottom;
  }, [active, term]);
  const visible = useMemo(() => {
    if (!term) return sections;
    const matches = new Set(result.query === term ? result.matches : []);
    return sections.filter(
      (section) =>
        matches.has(section.id) || section.label.toLowerCase().includes(term),
    );
  }, [result, sections, term]);
  function select(section: Section) {
    const ancestors = tree.parents.get(section.id) ?? [];
    if (ancestors.length)
      setExpanded((previous) => ({
        ...previous,
        ...Object.fromEntries(ancestors.map((id) => [id, true])),
      }));
    onSelect(section.id);
  }
  function item(section: Section) {
    return (
      <button
        type="button"
        key={section.id}
        onClick={() => select(section)}
        aria-current={active === section.id ? "location" : undefined}
        className="contents-link"
      >
        {sectionTitle(section)}
      </button>
    );
  }
  function row(node: ContentsNode, depth = 0) {
    const { section, children } = node;
    const open = isExpanded(section.id);
    const childrenId = `${treeId}-${section.id}`;
    return (
      <li key={section.id}>
        <div
          className={cn(
            "contents-row",
            active === section.id && "contents-row-active",
          )}
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {children.length ? (
            <button
              type="button"
              aria-label={`${open ? "Collapse" : "Expand"} ${sectionTitle(section)}`}
              aria-expanded={open}
              aria-controls={childrenId}
              onClick={() =>
                setExpanded((previous) => ({
                  ...previous,
                  [section.id]: !open,
                }))
              }
              className="contents-toggle"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn("size-3.5", !open && "-rotate-90")}
              />
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
          {item(section)}
        </div>
        {children.length > 0 && (
          <ul id={childrenId} hidden={!open}>
            {open && children.map((child) => row(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Contents</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {sections.length}
        </span>
      </div>
      <label className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 focus-within:ring-1 focus-within:ring-ring">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          aria-label="Search contents"
          placeholder="Find a section or text…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        />
      </label>
      <div className="mb-3 mt-2 flex shrink-0 items-center gap-1 border-b pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-xs text-muted-foreground transition-none"
          disabled={Boolean(term) || expandedCount === tree.branches.length}
          onClick={() =>
            setExpanded(
              Object.fromEntries(tree.branches.map((id) => [id, true])),
            )
          }
        >
          Expand all
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-xs text-muted-foreground transition-none"
          disabled={Boolean(term) || expandedCount === 0}
          onClick={() =>
            setExpanded(
              Object.fromEntries(tree.branches.map((id) => [id, false])),
            )
          }
        >
          Collapse all
        </Button>
      </div>
      <nav
        ref={navigation}
        aria-label="Table of contents"
        tabIndex={0}
        className="contents-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-md"
      >
        {term ? (
          <ul>
            {visible.map((section) => (
              <li
                key={section.id}
                className={cn(
                  "contents-row contents-search-result",
                  active === section.id && "contents-row-active",
                )}
              >
                {item(section)}
              </li>
            ))}
          </ul>
        ) : (
          <ul>{tree.roots.map((node) => row(node))}</ul>
        )}
        {!visible.length && (!term || result.query === term) && (
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
