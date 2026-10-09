"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { loadOriginal } from "@/components/reader-data";
import { Button } from "@/components/ui/button";
import type { Capture } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export default memo(function RawView({ capture }: { capture: Capture }) {
  const [raw, setRaw] = useState<string>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [wrap, setWrap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadOriginal(capture)
      .then((text) => {
        if (!cancelled) {
          setRaw(text);
          setError("");
        }
      })
      .catch((error) => {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load original source.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [capture, retry]);
  const numbers = useMemo(
    () =>
      raw
        ?.split("\n")
        .map((_, index) => index + 1)
        .join("\n"),
    [raw],
  );
  // Native text layout stays isolated from Contents and reader scroll updates.
  return (
    <div className="py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {capture.rawTokens.toLocaleString("en-US")} tokens ·{" "}
          {capture.rawBytes.toLocaleString("en-US")} bytes · original file
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
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setRetry((previous) => previous + 1)}
          >
            Try again
          </Button>
        </div>
      ) : raw === undefined ? (
        <p role="status" className="py-6 text-sm text-muted-foreground">
          Loading original source…
        </p>
      ) : (
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
              {numbers}
            </pre>
          )}
          <pre
            data-testid="raw-source"
            className={cn(
              "min-w-0 flex-1 font-mono text-[13px] leading-7",
              wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
            )}
          >
            {raw}
          </pre>
        </div>
      )}
    </div>
  );
});
