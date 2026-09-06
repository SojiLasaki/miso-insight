/**
 * Shared contract between the AI orchestration layer, the MISO clients and the UI.
 * The UI renders itself dynamically from `MisoResponse` — never from hardcoded data.
 */

export type SourceType = "api" | "report" | "dataset" | "webpage" | "document";

export interface MisoParameterSpec {
  name: string;
  label: string;
  type: "date" | "string" | "enum" | "number";
  required: boolean;
  description: string;
  options?: string[];
  example?: string;
}

export interface MisoSource {
  source_id: string;
  name: string;
  type: SourceType;
  description: string;
  supports: string[];
  requires_authentication: boolean;
  supports_api_generation: boolean;
  supports_visualization: boolean;
  endpoint?: string;
  method?: "GET" | "POST";
  parameters?: MisoParameterSpec[];
  documentation_url?: string;
  value_label?: string;
  unit?: string;
}

export type OutputMode =
  | "answer"
  | "metric"
  | "table"
  | "chart"
  | "csv"
  | "api"
  | "report"
  | "clarify";

export interface IntentEnvelope {
  type:
    | "retrieve_data"
    | "api_request"
    | "find_report"
    | "explain"
    | "clarify";
  confidence: number;
  summary: string;
}

export interface OutputPlan {
  mode: OutputMode;
  include_api: boolean;
  include_chart: boolean;
  include_table: boolean;
  include_download: boolean;
}

export type StepStatus = "success" | "error" | "skipped" | "pending";

export interface ExecutionStep {
  label: string;
  detail: string;
  status: StepStatus;
}

export interface DataSeries {
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
  unit?: string | undefined;
  x_key?: string | undefined;
  y_key?: string | undefined;
}

export interface MetricValue {
  label: string;
  value: string;
  sub?: string;
}

export interface ApiRequestSpec {
  name: string;
  method: string;
  url: string;
  parameters: { key: string; value: string; required: boolean }[];
  headers: { key: string; value: string }[];
  auth_note: string;
  examples: { language: "cURL" | "Python" | "JavaScript"; code: string }[];
}

export interface ReportRef {
  title: string;
  published: string;
  format: string;
  description: string;
  url: string;
}

export interface MisoError {
  message: string;
  reason: string;
  technical: string;
  fixable: boolean;
  missing_parameters: string[];
}

export interface MisoResponse {
  request_id: string;
  intent: IntentEnvelope;
  source: {
    id: string;
    name: string;
    type: SourceType;
    description: string;
  } | null;
  parameters: Record<string, string>;
  execution: {
    status: "success" | "error" | "needs_clarification" | "needs_auth";
    steps: ExecutionStep[];
    duration_ms: number;
  };
  output: OutputPlan;
  title?: string;
  answer: string;
  explanation: string;
  metrics?: MetricValue[];
  data?: DataSeries;
  api?: ApiRequestSpec;
  report?: ReportRef;
  clarification?: string;
  error?: MisoError;
}
