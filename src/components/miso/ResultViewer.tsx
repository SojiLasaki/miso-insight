import { ArrowUpRight } from "lucide-react";

import { ApiRequestViewer } from "./ApiRequestViewer";
import { ChartViewer } from "./ChartViewer";
import { DataTable } from "./DataTable";
import { DownloadButton } from "./DownloadButton";
import { ErrorState } from "./ErrorState";
import { ExecutionTimeline } from "./ExecutionTimeline";
import { SourceIndicator } from "./SourceIndicator";
import type { MisoResponse } from "@/lib/miso/types";

export function ResultViewer({
  response,
  onFix,
  onEdit,
}: {
  response: MisoResponse;
  onFix?: (question: string) => void;
  onEdit?: () => void;
}) {
  const { output, data, api, report, metrics, error } = response;

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState
          error={error}
          {...(error.fixable && onFix
            ? { onFix: () => onFix(`${response.intent.summary} — use a complete date range`) }
            : {})}
          {...(onEdit ? { onEdit } : {})}
        />
        <div className="lg:hidden">
          <ExecutionTimeline
            steps={response.execution.steps}
            durationMs={response.execution.duration_ms}
          />
        </div>
      </div>
    );
  }

  if (response.clarification) {
    return (
      <div className="animate-rise space-y-3">
        <p className="text-[15.5px] leading-relaxed">{response.clarification}</p>
      </div>
    );
  }

  const showChart =
    output.mode === "chart" || (output.include_chart && (data?.rows.length ?? 0) > 1);
  const showTable =
    output.mode === "table" ||
    output.mode === "csv" ||
    (output.include_table && (data?.rows.length ?? 0) > 1);
  const showMetrics = Boolean(metrics?.length) && output.mode !== "api";

  return (
    <div className="animate-rise space-y-5">
      {response.title && (
        <div className="space-y-2">
          <h3 className="text-[19px] font-medium tracking-tight">{response.title}</h3>
          {response.source && (
            <SourceIndicator name={response.source.name} type={response.source.type} />
          )}
        </div>
      )}

      {showMetrics && (
        <div className="grid gap-3 sm:grid-cols-3">
          {metrics!.map((m) => (
            <div key={m.label} className="rounded-xl border bg-card px-4 py-3">
              <p className="text-[12px] text-muted-foreground">{m.label}</p>
              <p className="mt-0.5 text-[21px] font-medium tabular-nums tracking-tight">
                {m.value}
              </p>
              {m.sub && <p className="text-[12px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {showChart && data && <ChartViewer data={data} />}
      {showTable && data && <DataTable data={data} />}

      {report && (
        <a
          href={report.url}
          target="_blank"
          rel="noreferrer"
          className="group block rounded-xl border bg-card p-5 transition-shadow hover:shadow-soft"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[15px] font-medium">{report.title}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{report.description}</p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Published {report.published} · {report.format}
              </p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </a>
      )}

      {api && (output.include_api || output.mode === "api") && <ApiRequestViewer api={api} />}

      {data && (output.include_download || output.mode === "csv") && (
        <DownloadButton data={data} filename={response.source?.id ?? "miso-data"} />
      )}

      {response.explanation && (
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">
          {response.explanation}
        </p>
      )}

      <ExecutionTimeline
        steps={response.execution.steps}
        durationMs={response.execution.duration_ms}
      />
    </div>
  );
}
