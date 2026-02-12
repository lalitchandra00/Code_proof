"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type BlockedPieChartProps = {
  blocked: number;
  allowed: number;
};

const COLORS = ["#f87171", "#93c5fd"];

export default function BlockedPieChart({ blocked, allowed }: BlockedPieChartProps) {
  const total = blocked + allowed;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No commit decisions recorded yet.
      </div>
    );
  }

  const data = [
    { name: "Blocked", value: blocked },
    { name: "Allowed", value: allowed },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Blocked commit distribution
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Share of blocked versus allowed security checks.
        </p>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                borderColor: "#e5e7eb",
                fontSize: "12px",
              }}
            />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
