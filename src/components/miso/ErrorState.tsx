import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MisoError } from "@/lib/miso/types";

export function ErrorState({
  error,
  onFix,
  onEdit,
}: {
  error: MisoError;
  onFix?: () => void;
  onEdit?: () => void;
}) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="animate-rise rounded-xl border border-destructive/25 bg-destructive-soft/50 p-5">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">{error.message}</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{error.reason}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {error.fixable && onFix && (
              <Button size="sm" className="rounded-full" onClick={onFix}>
                Fix automatically
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" className="rounded-full" onClick={onEdit}>
                Edit request
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTechnical((v) => !v)}
            className="mt-4 text-[12.5px] text-muted-foreground underline-offset-4 hover:underline"
          >
            {showTechnical ? "Hide technical details" : "View technical details"}
          </button>
          {showTechnical && (
            <pre className="animate-fade mt-2 overflow-x-auto rounded-lg border bg-card p-3 font-mono text-[12px] text-muted-foreground">
              {error.technical}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
