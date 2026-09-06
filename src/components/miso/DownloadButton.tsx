import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DataSeries } from "@/lib/miso/types";

function toCsv(data: DataSeries): string {
  const header = data.columns.map((c) => `"${c.label}"`).join(",");
  const body = data.rows
    .map((row) => data.columns.map((c) => `"${String(row[c.key] ?? "")}"`).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function DownloadButton({
  data,
  filename,
  label = "Download CSV",
}: {
  data: DataSeries;
  filename: string;
  label?: string;
}) {
  const download = () => {
    const blob = new Blob([toCsv(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={download} className="rounded-full">
      <Download className="size-3.5" />
      {label}
    </Button>
  );
}
