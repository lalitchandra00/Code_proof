"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FindingsLinePoint = {
  dateLabel: string;
  findings: number;
};

type FindingsLineChartProps = {
  data: FindingsLinePoint[];
};

export default function FindingsLineChart({ data }: FindingsLineChartProps) {
  if (data.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Not enough historical data to show findings trend yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Findings trend
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Total findings detected over time.
        </p>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                borderColor: "#e5e7eb",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="findings"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
