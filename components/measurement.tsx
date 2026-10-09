"use client";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export type Measure = "tokens" | "bytes";
export function MeasureSwitch({
  value,
  onChange,
}: {
  value: Measure;
  onChange: (measure: Measure) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Measurement unit"
      className="inline-flex rounded-lg bg-muted p-0.5"
    >
      {(["tokens", "bytes"] as const).map((measure) => (
        <button
          type="button"
          key={measure}
          aria-pressed={measure === value}
          onClick={() => onChange(measure)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium",
            value === measure
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {measure === "tokens" ? "Tokens" : "Bytes"}
        </button>
      ))}
    </div>
  );
}
export function EncodingInfo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="About token counts"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="font-mono">o200k_base</span>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">OpenAI o200k_base encoding</p>
        <p className="mt-1 opacity-85">
          The original text is tokenized once at build time. This is a
          comparison estimate for other models, whose native tokenizers may
          differ. API message overhead is excluded.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
