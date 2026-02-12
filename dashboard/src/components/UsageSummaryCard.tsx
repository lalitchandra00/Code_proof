type UsageSummaryCardProps = {
  plan: "free" | "premium";
  used: number;
  limit: number;
  remaining: number;
};

const planStyles = {
  free: "border-slate-200 bg-slate-100 text-slate-700",
  premium: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

export default function UsageSummaryCard({
  plan,
  used,
  limit,
  remaining,
}: UsageSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Token usage
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monthly run limits and remaining capacity.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${planStyles[plan]}`}
        >
          {plan}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Used tokens
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {used} / {limit}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Remaining
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {remaining}
          </div>
        </div>
      </div>
    </div>
  );
}
