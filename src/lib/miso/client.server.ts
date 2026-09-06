import type { DataSeries, MisoSource, ReportRef } from "./types";

/**
 * MISO API client layer.
 *
 * If a MISO subscription key is configured (MISO_SUBSCRIPTION_KEY) the client
 * calls the live MISO API. Otherwise it returns deterministic, realistic
 * simulated data so the whole product works end to end. The subscription key
 * never leaves this module and is never returned to the frontend.
 */

export function hasLiveMisoCredentials(): boolean {
  return Boolean(process.env["MISO_SUBSCRIPTION_KEY"]);
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pseudoRandom(seed: string): number {
  return (hash(seed) % 10000) / 10000;
}

function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [start];
  for (let d = s; d <= e && days.length < 400; d = new Date(d.getTime() + 86400000)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days.length ? days : [start];
}

const FUELS = ["Natural Gas", "Coal", "Nuclear", "Wind", "Solar", "Hydro", "Other"];

function simulate(source: MisoSource, params: Record<string, string>): DataSeries {
  const start = params["start_date"] ?? new Date().toISOString().slice(0, 10);
  const end = params["end_date"] ?? start;
  const days = eachDay(start, end);
  const region = params["region"] ?? params["node"] ?? "MISO";
  const regionScale = region === "MISO" ? 1 : 0.22 + pseudoRandom(region) * 0.25;

  if (source.source_id === "miso_generation_fuel_mix") {
    const base = 78000 * regionScale;
    return {
      columns: [
        { key: "fuel", label: "Fuel type" },
        { key: "output", label: `Average output (MW)` },
        { key: "share", label: "Share" },
      ],
      unit: "MW",
      x_key: "fuel",
      y_key: "output",
      rows: FUELS.map((fuel) => {
        const weight = 0.05 + pseudoRandom(`${fuel}${start}${region}`) * 0.3;
        const output = Math.round(base * weight);
        return { fuel, output, share: `${Math.round(weight * 100)}%` };
      }),
    };
  }

  const isPrice = source.unit === "$/MWh";
  const hourly = days.length === 1;

  if (hourly) {
    const rows = Array.from({ length: 24 }, (_, hour) => {
      const noise = pseudoRandom(`${source.source_id}${start}${region}${hour}`);
      const shape = Math.sin(((hour - 4) / 24) * Math.PI * 2) * 0.5 + 0.5;
      const value = isPrice
        ? Math.round((22 + shape * 48 + noise * 14) * 100) / 100
        : Math.round((62000 + shape * 22000 + noise * 4000) * regionScale);
      return {
        hour: `${String(hour).padStart(2, "0")}:00`,
        value,
      };
    });
    return {
      columns: [
        { key: "hour", label: "Hour (EST)" },
        { key: "value", label: `${source.value_label} (${source.unit})` },
      ],
      unit: source.unit,
      x_key: "hour",
      y_key: "value",
      rows,
    };
  }

  const rows = days.map((day) => {
    const noise = pseudoRandom(`${source.source_id}${day}${region}`);
    const value = isPrice
      ? Math.round((26 + noise * 42) * 100) / 100
      : Math.round((68000 + noise * 22000) * regionScale);
    return { date: day, value };
  });

  return {
    columns: [
      { key: "date", label: "Date" },
      { key: "value", label: `${source.value_label} (${source.unit})` },
    ],
    unit: source.unit,
    x_key: "date",
    y_key: "value",
    rows,
  };
}

async function callLiveMiso(
  source: MisoSource,
  params: Record<string, string>,
): Promise<DataSeries | null> {
  const key = process.env["MISO_SUBSCRIPTION_KEY"];
  if (!key || !source.endpoint) return null;
  const url = new URL(source.endpoint);
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: source.method ?? "GET",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`MISO API responded with ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  const records = Array.isArray(json)
    ? json
    : ((json as { data?: unknown[] }).data ?? []);
  if (!Array.isArray(records) || records.length === 0) return null;
  const first = records[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 6);
  return {
    columns: keys.map((k) => ({ key: k, label: k.replace(/_/g, " ") })),
    rows: records.slice(0, 500) as Record<string, string | number>[],
    unit: source.unit,
    x_key: keys[0],
    y_key: keys[1],
  };
}

export async function fetchMisoData(
  source: MisoSource,
  params: Record<string, string>,
): Promise<{ data: DataSeries; live: boolean }> {
  if (hasLiveMisoCredentials() && source.endpoint) {
    const live = await callLiveMiso(source, params);
    if (live) return { data: live, live: true };
  }
  return { data: simulate(source, params), live: false };
}

export function findReport(source: MisoSource, params: Record<string, string>): ReportRef {
  const date = params["report_date"] ?? new Date().toISOString().slice(0, 10);
  const monthly = source.source_id === "miso_market_report_monthly";
  return {
    title: monthly
      ? `MISO Monthly Market Assessment — ${new Date(`${date}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}`
      : `MISO Daily Market Report — ${date}`,
    published: date,
    format: monthly ? "PDF" : "PDF / XLS",
    description: source.description,
    url:
      source.documentation_url ??
      "https://www.misoenergy.org/markets-and-operations/real-time--market-data/market-reports/",
  };
}
