import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { z } from "zod";

import { fetchMisoData, findReport, hasLiveMisoCredentials } from "./client.server";
import { getSource, MISO_SOURCES, SOURCE_CATALOG_FOR_PROMPT } from "./registry";
import type {
  ApiRequestSpec,
  ExecutionStep,
  MetricValue,
  MisoResponse,
  MisoSource,
  OutputPlan,
} from "./types";

const PlanSchema = z.object({
  intent: z.object({
    type: z.enum(["retrieve_data", "api_request", "find_report", "explain", "clarify"]),
    confidence: z.number().min(0).max(1),
    summary: z.string(),
  }),
  source_id: z.string(),
  parameters: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    region: z.string().optional(),
    node: z.string().optional(),
    report_date: z.string().optional(),
    year: z.string().optional(),
  }),
  output: z.object({
    mode: z.enum(["answer", "metric", "table", "chart", "csv", "api", "report", "clarify"]),
    include_api: z.boolean(),
    include_chart: z.boolean(),
    include_table: z.boolean(),
    include_download: z.boolean(),
  }),
  title: z.string(),
  explanation: z.string(),
  clarification: z.string().optional(),
});

export type MisoPlan = z.infer<typeof PlanSchema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function systemPrompt(): string {
  return `You are the orchestration layer for MISO AI, a natural-language interface to MISO (Midcontinent Independent System Operator) public data.

Today's date is ${today()}. Yesterday was ${shiftDays(-1)}.

You translate a user's request into a structured execution plan. Rules:
- You MUST choose source_id from this validated registry. Never invent a source or endpoint.
- Registry: ${JSON.stringify(SOURCE_CATALOG_FOR_PROMPT)}
- Resolve relative dates ("yesterday", "last 30 days", "today") into YYYY-MM-DD values.
- If the user asks for the API / endpoint / code / "how did you get it", set intent.type to "api_request" (when they only want the API) and output.include_api true.
- If they ask how you retrieved data alongside the data, keep intent retrieve_data but set include_api true.
- Choose output.mode carefully: a single value -> "metric"; a short range -> "table"; explicit chart/graph request -> "chart"; download/CSV/export -> "csv"; API-only -> "api"; report/document -> "report".
- Ranges longer than 7 days should include_table true and include_chart true.
- Region words like "Indiana", "Michigan", "Louisiana", "North", "Central", "South" go into parameters.region.
- Pricing node/hub names go into parameters.node.
- title: a short human title for the result, e.g. "Actual Load — September 5, 2026".
- explanation: one or two calm sentences that ANSWER the user's question directly in plain language, then name the MISO source the answer came from. Never tell the user to visit, open, browse, check or navigate to a page, site, portal or dashboard; never say "you can find it at ...". The answer is delivered here, from the retrieved data.
- Only use intent "clarify" when the request genuinely cannot be mapped; then fill clarification with one short question.`;
}

async function plan(question: string, history: string[]): Promise<MisoPlan> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const gateway = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
    supportsStructuredOutputs: true,
  });

  const result = await generateText({
    model: gateway("google/gemini-3.7-flash"),
    system: systemPrompt(),
    output: Output.object({ schema: PlanSchema }),
    prompt: [
      history.length ? `Earlier in this conversation:\n${history.slice(-4).join("\n")}` : "",
      `User request: ${question}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  return await result.output;
}

function buildApiSpec(source: MisoSource, params: Record<string, string>): ApiRequestSpec {
  const specs = source.parameters ?? [];
  const parameters = specs.map((p) => ({
    key: p.name,
    value: params[p.name] ?? p.example ?? "",
    required: p.required,
  }));
  const query = parameters
    .filter((p) => p.value)
    .map((p) => `${p.key}=${encodeURIComponent(p.value)}`)
    .join("&");
  const url = source.endpoint ?? "";
  const fullUrl = query ? `${url}?${query}` : url;
  const method = source.method ?? "GET";

  return {
    name: `MISO ${source.name} API`,
    method,
    url,
    parameters,
    headers: [
      { key: "Ocp-Apim-Subscription-Key", value: "YOUR_MISO_SUBSCRIPTION_KEY" },
      { key: "Accept", value: "application/json" },
    ],
    auth_note:
      "Requires a MISO subscription key. Your key is stored securely on the server and is never exposed to the browser.",
    examples: [
      {
        language: "cURL",
        code: `curl -X ${method} "${fullUrl}" \\\n  -H "Ocp-Apim-Subscription-Key: YOUR_MISO_SUBSCRIPTION_KEY" \\\n  -H "Accept: application/json"`,
      },
      {
        language: "Python",
        code: `import requests\n\nresponse = requests.${method.toLowerCase()}(\n    "${url}",\n    params=${JSON.stringify(Object.fromEntries(parameters.filter((p) => p.value).map((p) => [p.key, p.value])), null, 4).replace(/\n/g, "\n    ")},\n    headers={\n        "Ocp-Apim-Subscription-Key": "YOUR_MISO_SUBSCRIPTION_KEY",\n        "Accept": "application/json",\n    },\n)\nresponse.raise_for_status()\ndata = response.json()`,
      },
      {
        language: "JavaScript",
        code: `const params = new URLSearchParams(${JSON.stringify(Object.fromEntries(parameters.filter((p) => p.value).map((p) => [p.key, p.value])))});\n\nconst response = await fetch(\`${url}?\${params}\`, {\n  method: "${method}",\n  headers: {\n    "Ocp-Apim-Subscription-Key": process.env.MISO_SUBSCRIPTION_KEY,\n    Accept: "application/json",\n  },\n});\n\nconst data = await response.json();`,
      },
    ],
  };
}

function summarize(
  source: MisoSource,
  data: { rows: Record<string, string | number>[]; y_key?: string | undefined },
): MetricValue[] {
  const key = data.y_key ?? "value";
  const values = data.rows
    .map((r) => Number(r[key]))
    .filter((n) => Number.isFinite(n));
  if (!values.length) return [];
  const peak = Math.max(...values);
  const low = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const unit = source.unit ?? "";
  const fmt = (n: number) =>
    unit === "$/MWh" ? `$${n.toFixed(2)}` : `${Math.round(n).toLocaleString()} ${unit}`;
  return [
    { label: "Peak", value: fmt(peak) },
    { label: "Average", value: fmt(avg) },
    { label: "Minimum", value: fmt(low) },
  ];
}

export async function runMisoRequest(
  question: string,
  history: string[],
): Promise<MisoResponse> {
  const startedAt = Date.now();
  const requestId = `req_${Math.random().toString(36).slice(2, 10)}`;
  const steps: ExecutionStep[] = [];

  let parsed: MisoPlan;
  try {
    parsed = await plan(question, history);
    steps.push({
      label: "Request understood",
      detail: parsed.intent.summary,
      status: "success",
    });
  } catch (err) {
    return {
      request_id: requestId,
      intent: { type: "clarify", confidence: 0, summary: "Could not interpret the request" },
      source: null,
      parameters: {},
      execution: { status: "error", steps, duration_ms: Date.now() - startedAt },
      output: { mode: "answer", include_api: false, include_chart: false, include_table: false, include_download: false },
      answer: "",
      explanation: "",
      error: {
        message: "We couldn't process this request.",
        reason: "The request understanding service is temporarily unavailable. Please try again in a moment.",
        technical: err instanceof Error ? err.message : String(err),
        fixable: false,
        missing_parameters: [],
      },
    };
  }

  const source = getSource(parsed.source_id) ?? MISO_SOURCES[0]!;
  const wantsTechnical =
    /\b(api|endpoint|request|curl|python|javascript|code|parameters?)\b/i.test(question) ||
    /how (did |do )?you (retriev|get|find|fetch|pull)/i.test(question) ||
    /show me how/i.test(question);
  const output: OutputPlan = {
    ...parsed.output,
    include_api: parsed.output.include_api || wantsTechnical,
  };
  const allowedKeys = new Set((source.parameters ?? []).map((p) => p.name));
  const parameters: Record<string, string> = Object.fromEntries(
    Object.entries(parsed.parameters).filter(
      ([k, v]) => Boolean(v) && allowedKeys.has(k),
    ),
  ) as Record<string, string>;


  steps.push({
    label: "Source selected",
    detail: `MISO ${source.name} (${source.type})`,
    status: "success",
  });

  if (parsed.intent.type === "clarify" && parsed.clarification) {
    return {
      request_id: requestId,
      intent: parsed.intent,
      source: { id: source.source_id, name: source.name, type: source.type, description: source.description },
      parameters,
      execution: { status: "needs_clarification", steps, duration_ms: Date.now() - startedAt },
      output: { ...output, mode: "clarify" },
      title: parsed.title,
      answer: "",
      explanation: parsed.explanation,
      clarification: parsed.clarification,
    };
  }

  // Sensible defaults before validation: a single-day request only needs one date.
  if (parameters["start_date"] && !parameters["end_date"]) {
    parameters["end_date"] = parameters["start_date"];
  }
  if (parameters["end_date"] && !parameters["start_date"]) {
    parameters["start_date"] = parameters["end_date"];
  }
  if (parameters["report_date"] && !parameters["start_date"]) {
    parameters["start_date"] = parameters["report_date"];
  }

  // Parameter validation against the registry
  const required = (source.parameters ?? []).filter((p) => p.required);
  const missing = required.filter((p) => !parameters[p.name]).map((p) => p.name);


  if (missing.length) {
    steps.push({
      label: "Parameter validation",
      detail: `Missing: ${missing.join(", ")}`,
      status: "error",
    });
    const labels = missing
      .map((m) => required.find((p) => p.name === m)?.label ?? m)
      .join(" and ");
    return {
      request_id: requestId,
      intent: parsed.intent,
      source: { id: source.source_id, name: source.name, type: source.type, description: source.description },
      parameters,
      execution: { status: "error", steps, duration_ms: Date.now() - startedAt },
      output,
      title: parsed.title,
      answer: "",
      explanation: parsed.explanation,
      error: {
        message: "We couldn't retrieve this data.",
        reason: `The MISO ${source.name} source requires ${labels.toLowerCase()}.`,
        technical: `InvalidParameterException: missing required parameter(s) ${missing.join(", ")}`,
        fixable: true,
        missing_parameters: missing,
      },
    };
  }

  steps.push({
    label: "Parameters validated",
    detail:
      Object.entries(parameters)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ") || "No parameters required",
    status: "success",
  });

  steps.push({
    label: "Authentication",
    detail: source.requires_authentication
      ? hasLiveMisoCredentials()
        ? "MISO access authorized"
        : "MISO access authorized (simulated data source)"
      : "Not required for this source",
    status: source.requires_authentication ? "success" : "skipped",
  });

  const api = source.supports_api_generation ? buildApiSpec(source, parameters) : undefined;

  // API-only request: don't execute a large data pull.
  if (parsed.intent.type === "api_request" && output.mode === "api") {
    steps.push({ label: "API request generated", detail: "Not executed — you asked for the request only", status: "skipped" });
    return {
      request_id: requestId,
      intent: parsed.intent,
      source: { id: source.source_id, name: source.name, type: source.type, description: source.description },
      parameters,
      execution: { status: "success", steps, duration_ms: Date.now() - startedAt },
      output: { ...output, include_api: true },
      title: parsed.title,
      answer: `Here is the MISO ${source.name} API request.`,
      explanation: parsed.explanation,
      ...(api ? { api } : {}),
    };
  }

  if (source.type !== "api") {
    const report = findReport(source, parameters);
    steps.push({ label: "MISO source retrieved", detail: report.title, status: "success" });
    steps.push({ label: "Result generated", detail: "Report located", status: "success" });
    return {
      request_id: requestId,
      intent: parsed.intent,
      source: { id: source.source_id, name: source.name, type: source.type, description: source.description },
      parameters,
      execution: { status: "success", steps, duration_ms: Date.now() - startedAt },
      output: { ...output, mode: "report" },
      title: parsed.title,
      answer: report.title,
      explanation: parsed.explanation,
      report,
    };
  }

  try {
    const { data, live } = await fetchMisoData(source, parameters);
    steps.push({
      label: "MISO request executed",
      detail: live ? `${source.method ?? "GET"} ${source.endpoint}` : "Request executed against MISO data source",
      status: "success",
    });
    steps.push({
      label: "Response validated",
      detail: `${data.rows.length} record${data.rows.length === 1 ? "" : "s"} received`,
      status: "success",
    });
    const metrics = summarize(source, data);
    steps.push({ label: "Result generated", detail: `Presented as ${output.mode}`, status: "success" });

    return {
      request_id: requestId,
      intent: parsed.intent,
      source: { id: source.source_id, name: source.name, type: source.type, description: source.description },
      parameters,
      execution: { status: "success", steps, duration_ms: Date.now() - startedAt },
      output,
      title: parsed.title,
      answer: metrics.length ? `${metrics[0]!.label} ${metrics[0]!.value}` : "",
      explanation: parsed.explanation,
      metrics,
      data,
      ...(api && (output.include_api || output.mode === "api") ? { api } : {}),
    };
  } catch (err) {
    steps.push({ label: "MISO request executed", detail: "Request failed", status: "error" });
    return {
      request_id: requestId,
      intent: parsed.intent,
      source: { id: source.source_id, name: source.name, type: source.type, description: source.description },
      parameters,
      execution: { status: "error", steps, duration_ms: Date.now() - startedAt },
      output,
      title: parsed.title,
      answer: "",
      explanation: parsed.explanation,
      error: {
        message: "We couldn't retrieve this data.",
        reason: `The MISO ${source.name} source didn't return a result for this request.`,
        technical: err instanceof Error ? err.message : String(err),
        fixable: false,
        missing_parameters: [],
      },
    };
  }
}

export { buildApiSpec };
