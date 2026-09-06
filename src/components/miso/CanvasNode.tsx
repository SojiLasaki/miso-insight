import { AlertCircle, Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

export type NodeState = "valid" | "invalid" | "idle" | "active";

export interface CanvasNodeData {
  id: string;
  title: string;
  subtitle: string;
  state: NodeState;
  detail?: string | undefined;
  editable?: boolean | undefined;
}

const STATE_STYLES: Record<NodeState, string> = {
  valid: "border-success/40",
  invalid: "border-destructive/60 bg-destructive-soft/40",
  idle: "border-border",
  active: "border-accent/60 bg-accent-soft/40",
};

export function CanvasNode({
  node,
  selected,
  onSelect,
}: {
  node: CanvasNodeData;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={cn(
        "w-full rounded-xl border bg-card px-4 py-3 text-left transition-all duration-200 hover:shadow-soft",
        STATE_STYLES[node.state],
        selected && "shadow-lift ring-1 ring-ring/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium">{node.title}</p>
          <p className="truncate text-[12.5px] text-muted-foreground">{node.subtitle}</p>
          {node.state === "invalid" && node.detail && (
            <p className="mt-1 text-[12.5px] text-destructive">{node.detail}</p>
          )}
        </div>
        {node.state === "valid" && <Check className="mt-0.5 size-3.5 shrink-0 text-success" />}
        {node.state === "invalid" && (
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
        )}
        {node.state === "idle" && (
          <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
        )}
        {node.state === "active" && <Circle className="mt-0.5 size-3.5 shrink-0 fill-accent text-accent" />}
      </div>
    </button>
  );
}
