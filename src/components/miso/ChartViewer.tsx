import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DataSeries } from "@/lib/miso/types";

export function ChartViewer({ data }: { data: DataSeries }) {
  const xKey = data.x_key ?? data.columns[0]?.key ?? "x";
  const yKey = data.y_key ?? data.columns[1]?.key ?? "value";

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="misoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
                boxShadow: "var(--shadow-soft)",
              }}
              formatter={(v: number | string) => [
                `${Number(v).toLocaleString()}${data.unit ? ` ${data.unit}` : ""}`,
                "",
              ]}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#misoFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
