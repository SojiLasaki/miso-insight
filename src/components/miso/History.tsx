import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

export function History({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] text-foreground transition-colors hover:bg-sidebar-accent"
      >
        <Plus className="size-4" />
        New request
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="px-2.5 pb-2 text-[11.5px] uppercase tracking-wide text-muted-foreground">
          Recent
        </p>
        <ul className="space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full truncate rounded-lg py-2 pl-2.5 pr-8 text-left text-[13.5px] transition-colors",
                  activeId === c.id
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                {c.title}
              </button>
              <button
                type="button"
                aria-label="Delete request"
                onClick={() => onDelete(c.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
          {conversations.length === 0 && (
            <li className="px-2.5 py-2 text-[13px] text-muted-foreground/70">
              Your requests will appear here.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
