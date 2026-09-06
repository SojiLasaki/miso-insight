import { useState } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ExecutionStep } from "@/lib/miso/types";

function StepIcon({ status }: { status: ExecutionStep["status"] }) {
  if (status === "error")
    return (
      <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <X className="size-2.5" />
      </span>
    );
  if (status === "skipped")
    return (
      <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Minus className="size-2.5" />
      </span>
    );
  return (
    <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-success-soft text-success">
      <Check className="size-2.5" />
    </span>
  );
}

export function ExecutionTimeline({
  steps,
  label = "How this was found",
  durationMs,
}: {
  steps: ExecutionStep[];
  label?: string;
  durationMs?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        <span className="flex items-center gap-2">
          {durationMs != null && (
            <span className="text-[11px] tabular-nums opacity-70">
              {(durationMs / 1000).toFixed(1)}s
            </span>
          )}
          <ChevronDown
            className={cn("size-4 transition-transform duration-300", open && "rotate-180")}
          />
        </span>
      </button>
      {open && (
        <ol className="animate-fade space-y-3 border-t px-4 py-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <StepIcon status={step.status} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground">{step.label}</p>
                <p className="break-words text-[12.5px] text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
