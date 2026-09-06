import { Database, FileText, Globe, Layers, Table2 } from "lucide-react";

import type { SourceType } from "@/lib/miso/types";

const ICONS: Record<SourceType, typeof Database> = {
  api: Database,
  report: FileText,
  dataset: Table2,
  webpage: Globe,
  document: Layers,
};

export function SourceIndicator({ name, type }: { name: string; type: SourceType }) {
  const Icon = ICONS[type];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[12px] text-muted-foreground">
      <Icon className="size-3" />
      {name}
    </span>
  );
}
