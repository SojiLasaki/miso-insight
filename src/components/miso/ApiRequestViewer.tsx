import { useState } from "react";
import { Lock } from "lucide-react";

import { CodeBlock } from "./CodeBlock";
import { cn } from "@/lib/utils";
import type { ApiRequestSpec } from "@/lib/miso/types";

export function ApiRequestViewer({ api }: { api: ApiRequestSpec }) {
  const [tab, setTab] = useState(api.examples[0]?.language ?? "cURL");
  const active = api.examples.find((e) => e.language === tab) ?? api.examples[0];

  return (
    <div className="animate-rise overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <p className="text-[13px] font-medium">{api.name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-[11px] font-medium text-accent">
            {api.method}
          </span>
          <span className="break-all font-mono text-[12.5px] text-muted-foreground">{api.url}</span>
        </div>
      </div>

      {api.parameters.length > 0 && (
        <div className="border-b px-5 py-4">
          <p className="mb-2 text-[12px] uppercase tracking-wide text-muted-foreground">
            Parameters
          </p>
          <div className="space-y-1.5">
            {api.parameters.map((p) => (
              <div key={p.key} className="flex flex-wrap items-baseline gap-x-3 font-mono text-[12.5px]">
                <span className="min-w-[132px] text-foreground">{p.key}</span>
                <span className="text-muted-foreground">{p.value || "—"}</span>
                {!p.required && (
                  <span className="font-sans text-[11px] text-muted-foreground/70">optional</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-b px-5 py-4">
        <p className="mb-2 text-[12px] uppercase tracking-wide text-muted-foreground">
          Authentication
        </p>
        <div className="space-y-1.5">
          {api.headers.map((h) => (
            <div key={h.key} className="flex flex-wrap items-baseline gap-x-3 font-mono text-[12.5px]">
              <span className="min-w-[132px] text-foreground">{h.key}</span>
              <span className="text-muted-foreground">{h.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-2 text-[12.5px] text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          {api.auth_note}
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="mb-3 flex gap-1">
          {api.examples.map((e) => (
            <button
              key={e.language}
              type="button"
              onClick={() => setTab(e.language)}
              className={cn(
                "rounded-full px-3 py-1 text-[12.5px] transition-colors",
                tab === e.language
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {e.language}
            </button>
          ))}
        </div>
        {active && <CodeBlock code={active.code} />}
      </div>
    </div>
  );
}
