import { useState } from "react";

import type { DataSeries } from "@/lib/miso/types";

export function DataTable({ data }: { data: DataSeries }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? data.rows : data.rows.slice(0, 12);

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface/70">
              {data.columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-muted-foreground"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                {data.columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 tabular-nums">
                    {typeof row[c.key] === "number"
                      ? Number(row[c.key]).toLocaleString()
                      : String(row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.rows.length > 12 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t bg-surface/50 px-4 py-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? "Show less" : `Show all ${data.rows.length} rows`}
        </button>
      )}
    </div>
  );
}
