"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReportBarDatum = {
  name: string;
  reports: number;
};

type ReportsBarChartProps = {
  data: ReportBarDatum[];
};

export default function ReportsBarChart({ data }: ReportsBarChartProps) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No project reports available yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Reports per project
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Activity volume across your monitored repositories.
        </p>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-15}
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
              contentStyle={{
                borderRadius: "12px",
                borderColor: "#e5e7eb",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="reports" fill="#60a5fa" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
