import Link from "next/link";
import { apiFetch, ApiError } from "../../../lib/api";

type ReportSummary = {
  filesScanned: number;
  findings: number;
  blocks: number;
  warnings: number;
  finalVerdict: string;
};

type ReportDetails = {
  reportId: string;
  projectId: string;
  timestamp: string;
  scanMode: string;
  summary: ReportSummary;
  createdAt: string;
};

type Finding = {
  findingId: string;
  ruleId: string;
  severity: string;
  confidence: string;
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  explanation: string;
  createdAt: string;
};

type ReportResponse = {
  success: boolean;
  report: ReportDetails;
  findings: Finding[];
};

interface ReportPageProps {
  params: Promise<{ reportId: string }>;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { reportId } = await params;
  let data: ReportResponse | null = null;
  let notFound = false;
  let error: string | null = null;

  try {
    data = await apiFetch<ReportResponse>(`/api/reports/${reportId}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound = true;
    } else {
      error =
        err instanceof Error ? err.message : "Unable to load report details.";
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/70 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Report not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested report is unavailable or you do not have access.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/70 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Unable to load report
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {error ?? "An unexpected error occurred while loading this report."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { report, findings } = data;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Report
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Report {report.reportId}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Scan mode: <span className="font-medium">{report.scanMode}</span>{" "}
              · Run at {formatDate(report.timestamp)}
            </p>
          </div>
          <Link
            href={`/project/${report.projectId}`}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            View project
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Files scanned
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {report.summary.filesScanned}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Findings
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {report.summary.findings}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Blocks
            </p>
            <p className="mt-2 text-2xl font-semibold text-rose-600">
              {report.summary.blocks}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Final verdict
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {report.summary.finalVerdict}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Findings
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Detailed issues detected during this scan.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {findings.length} items
            </p>
          </div>

          {findings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              No findings were recorded for this report.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
              <div className="grid grid-cols-12 gap-4 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Rule</div>
                <div className="col-span-2">Severity</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-3">Snippet</div>
              </div>
              {findings.map((finding) => (
                <div
                  key={finding.findingId}
                  className="grid grid-cols-12 gap-4 border-b border-slate-100 px-6 py-4 text-sm text-slate-700 last:border-b-0"
                >
                  <div className="col-span-3">
                    <div className="font-mono text-xs text-slate-700">
                      {finding.filePath}
                    </div>
                    <div className="text-xs text-slate-500">
                      Line {finding.lineNumber}
                    </div>
                  </div>
                  <div className="col-span-2 text-xs font-semibold text-slate-800">
                    {finding.ruleId}
                  </div>
                  <div className="col-span-2 text-xs text-slate-700">
                    {finding.severity}
                  </div>
                  <div className="col-span-2 text-xs text-slate-700">
                    {finding.confidence}
                  </div>
                  <div className="col-span-3">
                    <pre className="max-h-32 overflow-auto rounded-xl bg-slate-950/90 p-3 text-xs text-slate-50">
                      <code>{finding.codeSnippet}</code>
                    </pre>
                    <p className="mt-2 text-xs text-slate-600">
                      {finding.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
