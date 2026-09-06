import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CanvasNode, type CanvasNodeData } from "@/components/miso/CanvasNode";
import { ParameterEditor } from "@/components/miso/ParameterEditor";
import { ResultViewer } from "@/components/miso/ResultViewer";
import { Button } from "@/components/ui/button";
import { getSource } from "@/lib/miso/registry";
import { getLastResponse, setLastResponse } from "@/lib/miso/session-store";
import { rerunMisoRequest } from "@/lib/miso.functions";
import type { MisoResponse } from "@/lib/miso/types";

export const Route = createFileRoute("/canvas")({
  head: () => ({
    meta: [
      { title: "Canvas — MISO AI" },
      {
        name: "description",
        content:
          "Inspect and edit how MISO AI resolved your request: intent, source, parameters, authentication and validation.",
      },
      { property: "og:title", content: "Canvas — MISO AI" },
      {
        property: "og:description",
        content: "A node view of how your MISO data request was resolved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CanvasPage,
});

function CanvasPage() {
  const [response, setResponse] = useState<MisoResponse | null>(() => getLastResponse());
  const [params, setParams] = useState<Record<string, string>>(
    () => getLastResponse()?.parameters ?? {},
  );
  const [selected, setSelected] = useState<string>("source");
  const [extraNodes, setExtraNodes] = useState<CanvasNodeData[]>([]);
  const [running, setRunning] = useState(false);
  const rerun = useServerFn(rerunMisoRequest);

  const source = response?.source ? getSource(response.source.id) : undefined;
  const specs = source?.parameters ?? [];
  const missing = specs.filter((s) => s.required && !params[s.name]);

  const nodes: CanvasNodeData[] = useMemo(() => {
    if (!response) return [];
    const ok = response.execution.status === "success";
    return [
      {
        id: "request",
        title: "User request",
        subtitle: response.intent.summary,
        state: "valid",
      },
      {
        id: "intent",
        title: "Intent",
        subtitle: `${response.intent.type} · ${(response.intent.confidence * 100).toFixed(0)}% confidence`,
        state: "valid",
      },
      {
        id: "source",
        title: "MISO source",
        subtitle: response.source ? `${response.source.name} (${response.source.type})` : "None",
        state: response.source ? "active" : "invalid",
        detail: "No source resolved.",
      },
      {
        id: "parameters",
        title: "Parameters",
        subtitle:
          Object.entries(params)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ") || "None set",
        state: missing.length ? "invalid" : "valid",
        detail: missing.length ? `${missing[0]!.label} is required.` : undefined,
        editable: true,
      },
      {
        id: "auth",
        title: "Authentication",
        subtitle: source?.requires_authentication
          ? "MISO access authorized"
          : "Not required",
        state: "valid",
      },
      {
        id: "execution",
        title: source?.type === "api" ? "API request" : "Report lookup",
        subtitle: ok ? "Executed" : "Not executed",
        state: ok ? "valid" : "idle",
      },
      {
        id: "validation",
        title: "Validation",
        subtitle: ok ? "Response validated" : "Pending",
        state: ok ? "valid" : "idle",
      },
      {
        id: "results",
        title: "Results",
        subtitle: response.title ?? "—",
        state: ok ? "valid" : "idle",
      },
      ...extraNodes,
    ];
  }, [response, params, missing, source, extraNodes]);

  const run = async () => {
    if (!response || !source) return;
    if (missing.length) {
      toast.error(`${missing[0]!.label} is required before this can run.`);
      return;
    }
    setRunning(true);
    try {
      const detail = Object.entries(params)
        .map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`)
        .join(", ");
      const next = await rerun({
        data: {
          question: `Retrieve ${source.name} from MISO with ${detail}. Present it the same way as before.`,
          conversation_id: null,
        },
      });
      setResponse(next);
      setLastResponse(next);
      toast.success("Request re-run");
    } catch {
      toast.error("Couldn't re-run this request.");
    } finally {
      setRunning(false);
    }
  };

  if (!response) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-[24px] font-medium tracking-tight">Canvas</h1>
        <p className="max-w-sm text-[14.5px] text-muted-foreground">
          Ask something first, then open Canvas to inspect and adjust how the answer was found.
        </p>
        <Button asChild className="rounded-full">
          <Link to="/">Back to chat</Link>
        </Button>
      </main>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selected);

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/85 px-5 py-3 backdrop-blur-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Chat
        </Link>
        <p className="text-[13.5px] font-medium">Canvas</p>
        <Button size="sm" className="rounded-full" disabled={running} onClick={() => void run()}>
          <Play className="size-3.5" />
          {running ? "Running" : "Re-run"}
        </Button>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <section aria-label="Request pipeline" className="space-y-2">
          {nodes.map((node, i) => (
            <div key={node.id}>
              <CanvasNode node={node} selected={selected === node.id} onSelect={setSelected} />
              {i < nodes.length - 1 && (
                <div className="mx-auto h-4 w-px bg-border" aria-hidden="true" />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() =>
                setExtraNodes((prev) => [
                  ...prev,
                  {
                    id: `custom_${prev.length + 1}`,
                    title: `Custom step ${prev.length + 1}`,
                    subtitle: "Not yet executed",
                    state: "idle",
                  },
                ])
              }
            >
              <Plus className="size-3.5" />
              Add node
            </Button>
            {extraNodes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => setExtraNodes((prev) => prev.slice(0, -1))}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-[15px] font-medium">{selectedNode?.title ?? "Node"}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{selectedNode?.subtitle}</p>
            <div className="mt-5">
              {selected === "parameters" ? (
                <ParameterEditor
                  specs={specs}
                  values={params}
                  onChange={(k, v) => setParams((prev) => ({ ...prev, [k]: v }))}
                />
              ) : selected === "source" ? (
                <p className="text-[13.5px] text-muted-foreground">
                  {source?.description ?? response.source?.description}
                </p>
              ) : (
                <p className="text-[13.5px] text-muted-foreground">
                  {selectedNode?.detail ?? "Select the parameters node to edit this request."}
                </p>
              )}
            </div>
          </div>

          <ResultViewer response={response} />
        </section>
      </div>
    </main>
  );
}
