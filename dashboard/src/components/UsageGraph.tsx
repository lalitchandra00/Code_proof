"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UsageHistoryEntry = {
  date: string;
  count: number;
};

type UsageGraphProps = {
  usageHistory: UsageHistoryEntry[];
  limit: number;
};

function formatLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function UsageGraph({ usageHistory, limit }: UsageGraphProps) {
  if (!usageHistory.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No usage history recorded yet.
      </div>
    );
  }

  const data = [...usageHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: formatLabel(entry.date),
      runs: entry.count,
    }));

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Daily run usage
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Track daily CodeProof run executions for the current month.
        </p>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                borderColor: "#e5e7eb",
                fontSize: "12px",
              }}
            />
            <ReferenceLine y={limit} stroke="#fb7185" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="runs"
              stroke="#60a5fa"
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
