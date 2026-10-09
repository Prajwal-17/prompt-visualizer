"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeftRight } from "lucide-react";
import { catalog } from "@/lib/content/catalog";
import { categories, categoryIds, type Capture } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import {
  EncodingInfo,
  MeasureSwitch,
  type Measure,
} from "@/components/measurement";
import {
  Composition,
  CompositionLegend,
  CategoryDot,
} from "@/components/composition";
import { Button } from "@/components/ui/button";
import { CapturePicker } from "@/components/capture-picker";
import { variantLabels } from "@/lib/content/types";
import { updateQuery, useQueryParam } from "@/components/use-url-state";

function DocumentPicker({
  capture,
  label,
  onChange,
}: {
  capture?: Capture;
  label: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <span className="mb-2 block text-sm text-muted-foreground">{label}</span>
      <CapturePicker capture={capture} label={label} onChange={onChange} />
    </div>
  );
}

const SourceText = dynamic(() => import("@/components/comparison-source"), {
  loading: () => (
    <p role="status" className="py-8 text-sm text-muted-foreground">
      Loading source…
    </p>
  ),
});

export function Comparison() {
  const leftId = useQueryParam("left", "openai--codex--gpt-6.1-sol--runtime");
  const rightId = useQueryParam("right", "anthropic--claude-sonnet-5.5");
  const requestedMeasure = useQueryParam("measure", "tokens");
  const measure: Measure = requestedMeasure === "bytes" ? "bytes" : "tokens";
  const left = catalog.find((capture) => capture.id === leftId);
  const right = catalog.find((capture) => capture.id === rightId);
  const [normalized, setNormalized] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const pair = [left, right];
  const maximum = Math.max(left?.[measure] ?? 0, right?.[measure] ?? 0, 1);
  const difference = left && right ? right[measure] - left[measure] : null;
  return (
    <div className="mx-auto max-w-6xl px-5 py-9 sm:px-9 lg:px-12 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Compare prompts
        </h1>
        <EncodingInfo />
      </div>
      <div className="mt-8 grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] sm:gap-5">
        <DocumentPicker
          capture={left}
          label="First prompt"
          onChange={(id) => updateQuery({ left: id })}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Swap comparison prompts"
          className="mx-auto h-10 w-10 sm:mb-2"
          onClick={() => updateQuery({ left: rightId, right: leftId })}
        >
          <ArrowLeftRight className="size-4" />
        </Button>
        <DocumentPicker
          capture={right}
          label="Second prompt"
          onChange={(id) => updateQuery({ right: id })}
        />
      </div>
      {left && right && left.variant !== right.variant && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Different scopes: {variantLabels[left.variant]} compared with{" "}
          {variantLabels[right.variant]}. Select matching variants for a
          like-for-like comparison.
        </p>
      )}
      {(!left || !right) && (
        <p role="alert" className="mt-4 text-sm text-muted-foreground">
          A selected prompt is unavailable. Choose another above.
        </p>
      )}
      <div className="mt-8 border-y py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <MeasureSwitch
            value={measure}
            onChange={(value) =>
              updateQuery({ measure: value === "tokens" ? null : value })
            }
          />
          <div
            role="group"
            aria-label="Bar scale"
            className="flex rounded-lg bg-muted p-0.5"
          >
            {[false, true].map((value) => (
              <button
                key={String(value)}
                aria-pressed={normalized === value}
                onClick={() => setNormalized(value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium",
                  normalized === value
                    ? "bg-card shadow-xs"
                    : "text-muted-foreground",
                )}
              >
                {value ? "Equal width" : "Actual size"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-7">
          {pair.map(
            (capture, index) =>
              capture && (
                <div key={`${index}-${capture.id}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">
                      {capture.title}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {capture.product}
                      </span>
                    </span>
                    <span className="font-mono text-xs tabular-nums">
                      {capture[measure].toLocaleString("en-US")} {measure}
                      {index === 1 && left && (
                        <span className="ml-2 text-muted-foreground">
                          ·{" "}
                          {(
                            capture[measure] / Math.max(left[measure], 1)
                          ).toFixed(2)}
                          ×
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-md bg-muted">
                    <div
                      style={{
                        width: normalized
                          ? "100%"
                          : `${(capture[measure] / maximum) * 100}%`,
                      }}
                    >
                      <Composition capture={capture} measure={measure} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <CompositionLegend
                      capture={capture}
                      measure={measure}
                      percentages
                    />
                  </div>
                </div>
              ),
          )}
        </div>
        {difference !== null && (
          <p
            data-testid="comparison-difference"
            className="mt-6 text-sm text-muted-foreground"
          >
            {difference === 0 ? (
              `Both prompts contain the same number of ${measure}.`
            ) : (
              <>
                <span className="font-mono font-medium text-foreground">
                  {Math.abs(difference).toLocaleString("en-US")}
                </span>{" "}
                {difference > 0 ? "more" : "fewer"} {measure} in the second
                prompt.
              </>
            )}
          </p>
        )}
      </div>
      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[330px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-3 font-normal">Category</th>
              <th className="px-3 pb-3 text-right font-normal">First prompt</th>
              <th className="pb-3 text-right font-normal">Second prompt</th>
            </tr>
          </thead>
          <tbody>
            {categoryIds
              .filter((category) =>
                pair.some(
                  (capture) =>
                    capture &&
                    (measure === "tokens"
                      ? capture.categoryTokens[category]
                      : capture.categoryBytes[category]) > 0,
                ),
              )
              .map((category) => (
                <tr key={category} className="border-b">
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2">
                      <CategoryDot category={category} />
                      {categories[category].short}
                    </span>
                  </td>
                  {pair.map((capture, index) => (
                    <td
                      key={index}
                      className="py-3 text-right font-mono text-xs tabular-nums first:px-3"
                    >
                      {capture
                        ? (measure === "tokens"
                            ? capture.categoryTokens[category]
                            : capture.categoryBytes[category]
                          ).toLocaleString("en-US")
                        : "—"}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="mt-7">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTextVisible(!textVisible)}
          aria-expanded={textVisible}
        >
          {textVisible ? "Hide source text" : "Show source text"}
        </Button>
        {textVisible && (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {pair.map(
              (capture, index) =>
                capture && (
                  <section key={`${index}-${capture.id}`} className="min-w-0">
                    <h2 className="mb-4 text-sm font-medium">
                      {capture.title}
                    </h2>
                    <SourceText capture={capture} />
                  </section>
                ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
