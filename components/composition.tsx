"use client";
import { useState, type ReactNode } from "react";
import {
  categories,
  categoryIds,
  type Capture,
  type Category,
} from "@/lib/content/types";
import { cn } from "@/lib/utils";
import type { Measure } from "@/components/measurement";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CompositionCapture = Pick<
  Capture,
  "bytes" | "tokens" | "categoryBytes" | "categoryTokens" | "categorySections"
>;
function CompactDetails({
  capture,
  measure,
  children,
}: {
  capture: CompositionCapture;
  measure: Measure;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const counts =
    measure === "tokens" ? capture.categoryTokens : capture.categoryBytes;
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Composition details, ${capture[measure].toLocaleString("en-US")} ${measure}`}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => setOpen(!open)}
          className="flex h-8 w-full items-center rounded"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <ul className="space-y-2">
          {categoryIds
            .filter((category) => counts[category] > 0)
            .map((category) => (
              <li key={category}>
                <p className="font-medium">
                  {categories[category].short}{" "}
                  <span className="font-mono font-normal">
                    {(
                      (counts[category] / Math.max(capture[measure], 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </p>
                <p className="font-mono text-xs">
                  {counts[category].toLocaleString("en-US")} {measure} ·{" "}
                  {capture.categorySections[category]}{" "}
                  {capture.categorySections[category] === 1
                    ? "section"
                    : "sections"}
                </p>
              </li>
            ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
export function CategoryDot({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ background: `var(--${category})` }}
    />
  );
}
export function Composition({
  capture,
  compact = false,
  measure = "tokens",
  onSelect,
}: {
  capture: CompositionCapture;
  compact?: boolean;
  measure?: Measure;
  onSelect?: (category: Category) => void;
}) {
  const counts =
    measure === "tokens" ? capture.categoryTokens : capture.categoryBytes;
  const total = Math.max(capture[measure], 1);
  const bar = (
    <div
      data-testid="composition"
      role="group"
      aria-label={`Document composition by ${measure}`}
      className={cn(
        "flex w-full overflow-hidden rounded",
        compact ? "h-2" : "h-4",
      )}
    >
      {categoryIds
        .filter((category) => counts[category] > 0)
        .map((category) => {
          const percent = (counts[category] / total) * 100;
          const label = `${categories[category].short}: ${counts[category].toLocaleString("en-US")} ${measure} (${percent.toFixed(1)}%)`;
          const style = {
            width: `${percent}%`,
            background: `var(--${category})`,
          };
          const trigger = onSelect ? (
            <button
              type="button"
              aria-label={label}
              data-category={category}
              style={style}
              className="min-w-px outline-offset-[-2px] hover:brightness-110"
              onClick={() => onSelect(category)}
            />
          ) : (
            <span
              role="img"
              aria-label={label}
              tabIndex={compact ? undefined : 0}
              data-category={category}
              style={style}
              className="min-w-px outline-offset-[-2px]"
            />
          );
          return (
            <Tooltip key={category}>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{categories[category].label}</p>
                <p className="mt-1 font-mono tabular-nums">
                  {counts[category].toLocaleString("en-US")} {measure} ·{" "}
                  {percent.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs opacity-85">
                  {capture.categorySections[category]}{" "}
                  {capture.categorySections[category] === 1
                    ? "section"
                    : "sections"}{" "}
                  ·{" "}
                  {measure === "tokens"
                    ? `${capture.categoryBytes[category].toLocaleString("en-US")} bytes`
                    : `${capture.categoryTokens[category].toLocaleString("en-US")} tokens`}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
    </div>
  );
  return compact ? (
    <CompactDetails capture={capture} measure={measure}>
      {bar}
    </CompactDetails>
  ) : (
    bar
  );
}
export function CompositionLegend({
  capture,
  percentages = false,
  measure = "tokens",
}: {
  capture: CompositionCapture;
  percentages?: boolean;
  measure?: Measure;
}) {
  const counts =
    measure === "tokens" ? capture.categoryTokens : capture.categoryBytes;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {categoryIds
        .filter((category) => counts[category] > 0)
        .map((category) => (
          <span key={category} className="inline-flex items-center gap-1.5">
            <CategoryDot category={category} />
            {categories[category].short}
            {percentages && (
              <span className="font-mono tabular-nums">
                {(
                  (counts[category] / Math.max(capture[measure], 1)) *
                  100
                ).toFixed(1)}
                %
              </span>
            )}
          </span>
        ))}
    </div>
  );
}
