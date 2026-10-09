"use client";

import { useId, useRef, useState } from "react";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { catalog, providers } from "@/lib/content/catalog";
import { variantLabels, type Capture } from "@/lib/content/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function CapturePicker({
  capture,
  label,
  onChange,
  compact = false,
}: {
  capture?: Capture;
  label: string;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border bg-card px-3.5 text-left hover:border-foreground/30",
            compact ? "h-10 text-sm" : "h-14",
          )}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {capture
                ? `${capture.title} · ${capture.product}`
                : "Choose a prompt"}
            </span>
            {!compact && capture && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {variantLabels[capture.variant]} ·{" "}
                {capture.tokens.toLocaleString("en-US")} tokens
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(520px,var(--radix-popover-trigger-width))] min-w-[min(320px,calc(100vw-32px))] p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          input.current?.focus();
        }}
      >
        <Command
          label={`Search ${label.toLowerCase()}`}
          filter={(value, search, keywords) =>
            `${value} ${(keywords ?? []).join(" ")}`
              .toLowerCase()
              .includes(search.trim().toLowerCase())
              ? 1
              : 0
          }
        >
          <div className="flex items-center gap-2 border-b px-3.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Command.Input
              ref={input}
              aria-label={`Search ${label.toLowerCase()}`}
              placeholder="Search models, products, or variants…"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <Command.List
            id={listId}
            className="max-h-[min(420px,60svh)] overflow-y-auto p-2"
          >
            <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
              No matching prompts.
            </Command.Empty>
            {providers.map((provider) => (
              <Command.Group
                key={provider}
                heading={provider}
                className="picker-group"
              >
                {catalog
                  .filter((item) => item.provider === provider)
                  .map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      keywords={[
                        item.title,
                        item.product,
                        provider,
                        variantLabels[item.variant],
                      ]}
                      onSelect={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-3 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {item.title} · {item.product}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {variantLabels[item.variant]}
                        </span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {item.tokens.toLocaleString("en-US")}
                      </span>
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          capture?.id !== item.id && "invisible",
                        )}
                      />
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
