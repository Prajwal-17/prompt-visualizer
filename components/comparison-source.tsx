"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentSchema } from "@/lib/content/schema";
import {
  captureHref,
  dataHref,
  type Capture,
  type PromptDocument,
} from "@/lib/content/types";

export default function SourceText({ capture }: { capture: Capture }) {
  const [state, setState] = useState<{
    id: string;
    document?: PromptDocument;
    error?: string;
  }>({ id: "" });
  const [expanded, setExpanded] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    fetch(dataHref(capture), { signal: abort.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Could not load source (${response.status}).`);
        return response.json();
      })
      .then((payload) => {
        const document = documentSchema.parse(payload);
        if (document.id !== capture.id || document.sha256 !== capture.sha256)
          throw new Error("Source identity mismatch.");
        setState({ id: capture.id, document });
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setState({
            id: capture.id,
            error:
              error instanceof Error ? error.message : "Could not load source.",
          });
      });
    return () => abort.abort();
  }, [capture, retry]);
  if (state.id !== capture.id)
    return (
      <div
        role="status"
        className="flex h-32 items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <LoaderCircle className="size-3.5 animate-spin" />
        Loading source…
      </div>
    );
  if (state.error)
    return (
      <div className="py-8">
        <p role="alert" className="text-xs text-muted-foreground">
          {state.error}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setRetry((previous) => previous + 1)}
        >
          Try again
        </Button>
      </div>
    );
  const raw = state.document!.text;
  return (
    <div>
      <pre
        tabIndex={0}
        aria-label="Compared instruction source"
        className="max-h-[650px] overflow-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-7"
      >
        {expanded ? raw : raw.slice(0, 2200)}
      </pre>
      {raw.length > 2200 && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 text-xs"
          onClick={() => setExpanded((previous) => !previous)}
        >
          {expanded ? "Show excerpt" : "Show complete source"}
        </Button>
      )}
      <Link
        href={captureHref(capture)}
        prefetch={false}
        className="mt-4 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        Open in the reader <ArrowUpRight className="size-3" />
      </Link>
    </div>
  );
}
