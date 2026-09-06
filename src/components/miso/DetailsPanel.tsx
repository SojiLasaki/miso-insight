import { Check, Minus, X } from "lucide-react";

import type { ExecutionStep, MisoResponse } from "@/lib/miso/types";

function StepIcon({ status }: { status: ExecutionStep["status"] }) {
  if (status === "error")
    return (
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <X className="size-2.5" />
      </span>
    );
  if (status === "skipped")
    return (
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Minus className="size-2.5" />
      </span>
    );
  return (
    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
      <Check className="size-2.5" />
    </span>
  );
}

/** Persistent right-hand panel describing how the latest answer was found. */
export function DetailsPanel({ response }: { response: MisoResponse }) {
  const { execution, source } = response;

  return (
    <div className="animate-fade space-y-5">
      <div>
        <p className="text-[11.5px] uppercase tracking-wide text-muted-foreground">
          How this was found
        </p>
        {source && <p className="mt-1 text-[13.5px] font-medium">{source.name}</p>}
        {execution.duration_ms != null && (
          <p className="text-[12px] tabular-nums text-muted-foreground">
            Completed in {(execution.duration_ms / 1000).toFixed(1)}s
          </p>
        )}
      </div>

      <ol className="space-y-3.5">
        {execution.steps.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <StepIcon status={step.status} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-foreground">{step.label}</p>
              <p className="break-words text-[12px] leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
