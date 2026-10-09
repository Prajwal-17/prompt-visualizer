"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowUpRight, Brackets, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { catalog } from "@/lib/content/catalog";
import { captureHref, variantLabels } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matches = catalog
    .filter((capture) =>
      `${capture.title} ${capture.provider} ${capture.product}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 10);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((previous) => !previous);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background">
      <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          >
            <Brackets className="size-5" strokeWidth={1.8} />
            <span>
              <span className="hidden sm:inline">System </span>prompts
            </span>
          </Link>
        </div>
        <nav
          aria-label="Main navigation"
          className="flex h-full items-center gap-3 sm:gap-7"
        >
          {[
            { href: "/", label: "Library" },
            { href: "/compare/", label: "Compare" },
          ].map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/prompts/")
                : pathname === item.href.slice(0, -1) ||
                  pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full items-center text-sm text-muted-foreground transition-colors hover:text-foreground",
                  active &&
                    "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-0.5 sm:gap-2">
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Search prompts"
              >
                <Search className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="gap-3">
              <DialogHeader>
                <DialogTitle>Find a prompt</DialogTitle>
                <DialogDescription>
                  Search the collection by model, product, or provider.
                </DialogDescription>
              </DialogHeader>
              <label className="flex items-center gap-2 rounded-md border px-3">
                <Search className="size-4 text-muted-foreground" />
                <input
                  aria-label="Search all prompts"
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Claude, Codex, Gemini…"
                  className="h-11 w-full bg-transparent text-sm outline-none"
                />
              </label>
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {matches.map((capture) => (
                  <Link
                    key={capture.id}
                    href={captureHref(capture)}
                    prefetch={false}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 hover:bg-accent"
                  >
                    <span>
                      <span className="block text-sm">{capture.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {capture.product} · {variantLabels[capture.variant]}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
                {!matches.length && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No matches. Try a provider name.
                  </p>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Open with <kbd className="rounded border px-1">⌘ K</kbd> or{" "}
                <kbd className="rounded border px-1">Ctrl K</kbd>
              </p>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle color theme"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
        </div>
      </div>
    </header>
  );
}
