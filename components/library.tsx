"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowDown, ArrowUpRight, Search, X } from "lucide-react";
import { catalog, families, providers } from "@/lib/content/catalog";
import { captureHref, variantLabels } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Composition } from "@/components/composition";
import { EncodingInfo } from "@/components/measurement";
import { Button } from "@/components/ui/button";
import { updateQuery, useQueryParam } from "@/components/use-url-state";

export function Library() {
  const provider = useQueryParam("provider", "all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState(false);
  const visible = families.filter(
    ({ primary }) =>
      (provider === "all" || primary.provider === provider) &&
      `${primary.title} ${primary.provider} ${primary.product}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase()),
  );
  if (sort) visible.sort((a, b) => b.primary.tokens - a.primary.tokens);
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-9 sm:px-9 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            System prompts
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Inside the instructions behind AI products.
          </p>
        </div>
        <Link
          href="/compare/"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Compare prompts
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {families.length} model / product entries · {catalog.length} captures
        </span>
        <EncodingInfo />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-lg border bg-card px-3.5 focus-within:ring-1 focus-within:ring-ring">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search library"
            placeholder="Search models, products, or providers…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button
              aria-label="Clear library search"
              onClick={() => setQuery("")}
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => setSort(!sort)}
          aria-label="Sort by token count"
          aria-pressed={sort}
          className={cn(
            "flex h-12 items-center gap-2 rounded-lg border px-3 text-xs hover:bg-muted",
            sort && "bg-muted",
          )}
        >
          <ArrowDown className="size-4" />
          <span className="hidden sm:inline">Token count</span>
        </button>
      </div>
      <div
        role="group"
        aria-label="Filter by provider"
        className="mt-4 flex flex-wrap gap-1"
      >
        {["all", ...providers].map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={provider === name}
            onClick={() =>
              updateQuery({ provider: name === "all" ? null : name })
            }
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              provider === name
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {name === "all" ? "All providers" : name}
          </button>
        ))}
      </div>
      <div className="mt-10 space-y-10">
        {providers.map((name) => {
          const group = visible.filter(
            ({ primary }) => primary.provider === name,
          );
          if (!group.length) return null;
          return (
            <section key={name} aria-label={`${name} prompts`}>
              <div className="mb-1 flex items-baseline justify-between gap-4 border-b pb-4">
                <h2 className="text-base font-semibold">
                  {name}
                  <span className="ml-3 text-xs font-normal text-muted-foreground">
                    {group.length} {group.length === 1 ? "entry" : "entries"}
                  </span>
                </h2>
                <span className="text-xs text-muted-foreground">
                  Capture · tokens
                </span>
              </div>
              {group.map(({ key, primary, variants }) => (
                <div
                  key={key}
                  className="group grid items-center gap-x-8 gap-y-4 border-b py-6 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_150px_270px]"
                >
                  <Link
                    href={captureHref(primary)}
                    prefetch={false}
                    className="min-w-0 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-medium">
                        {primary.title}
                      </h3>
                      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" />
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {primary.product}
                      <span className="mx-2 text-border" aria-hidden="true">
                        /
                      </span>
                      {primary.format}
                    </p>
                  </Link>
                  <div className="hidden lg:block">
                    <Composition capture={primary} compact />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                    {[...variants]
                      .sort((a, b) =>
                        a.variant === "runtime"
                          ? -1
                          : b.variant === "runtime"
                            ? 1
                            : 0,
                      )
                      .map((capture) => (
                        <Link
                          key={capture.id}
                          href={captureHref(capture)}
                          prefetch={false}
                          className="flex min-h-10 items-center justify-between gap-5 rounded-md border px-3 py-2 text-xs hover:border-foreground/30 hover:bg-muted"
                        >
                          <span className="text-muted-foreground">
                            {variantLabels[capture.variant]}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {capture.tokens.toLocaleString("en-US")}
                          </span>
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      {!visible.length && (
        <div className="py-16 text-center">
          <p className="text-sm">No prompts match these filters.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setQuery("");
              updateQuery({ provider: null });
            }}
          >
            Reset filters
          </Button>
        </div>
      )}
      <div className="mt-10 flex flex-wrap justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
        <p>Captured text, measured with a shared tokenizer.</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/asgeirtj/system_prompts_leaks"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Source archive
          </a>
          <a
            href="https://github.com/Prajwal-17/codex-prompts"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Codex instructions
          </a>
        </div>
      </div>
    </div>
  );
}
