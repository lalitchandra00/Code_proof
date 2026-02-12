"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MetricsGrid from "../../components/charts/MetricsGrid";
import ReportsBarChart from "../../components/charts/ReportsBarChart";
import BlockedPieChart from "../../components/charts/BlockedPieChart";
import FindingsLineChart from "../../components/charts/FindingsLineChart";
import UsageGraph from "../../components/UsageGraph";
import UsageSummaryCard from "../../components/UsageSummaryCard";
import ProjectsTable from "../../components/ProjectsTable";
import ReportsTable from "../../components/ReportsTable";
import { apiFetch } from "../../lib/api";
import { clearToken } from "../../lib/auth";

type ProjectSummary = {
  projectId: string;
  name: string;
  repoIdentifier: string;
  createdAt: string;
  lastReportAt: string;
};

type ProjectsResponse = {
  success: boolean;
  projects: ProjectSummary[];
};

type ReportSummary = {
  reportId: string;
  projectId: string;
  timestamp: string;
  scanMode: string;
  summary: {
    findings: number;
    blocks: number;
    warnings: number;
    finalVerdict: string;
  };
  createdAt: string;
};

type ReportsResponse = {
  success: boolean;
  projectId: string;
  totalReports: number;
  totalBlocked?: number;
  totalFindings?: number;
  reports: ReportSummary[];
};

type UsageHistoryEntry = {
  date: string;
  count: number;
};

type UsageResponse = {
  success: boolean;
  plan: "free" | "premium";
  limit: number;
  used: number;
  remaining: number;
  usageHistory: UsageHistoryEntry[];
};

type ProjectWithCounts = ProjectSummary & {
  reportCount: number;
  totalBlocked: number;
  totalFindings: number;
};

const PROJECT_LIMIT = 6;
const REPORTS_PER_PROJECT = 10;
const RECENT_REPORTS_LIMIT = 6;

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [allReports, setAllReports] = useState<ReportSummary[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);

  const recentProjects = useMemo(
    () => projects.slice(0, PROJECT_LIMIT),
    [projects],
  );

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const projectsResponse = await apiFetch<ProjectsResponse>(
          "/api/projects",
        );
        const projectList = projectsResponse.projects ?? [];
        const reportPages = await Promise.all(
          projectList.map(async (project) => {
            try {
              return await apiFetch<ReportsResponse>(
                `/api/projects/${project.projectId}/reports?limit=${REPORTS_PER_PROJECT}&offset=0`,
              );
            } catch {
              return null;
            }
          }),
        );

        if (!isActive) {
          return;
        }

        const projectsWithCounts = projectList.map((project, index) => {
          const page = reportPages[index];
          const reportItems = page?.reports ?? [];
          const reportCount = page?.totalReports ?? reportItems.length;
          const totalBlocked =
            page?.totalBlocked ??
            reportItems.reduce((sum, report) => sum + report.summary.blocks, 0);
          const totalFindings =
            page?.totalFindings ??
            reportItems.reduce(
              (sum, report) => sum + report.summary.findings,
              0,
            );

          return {
            ...project,
            reportCount,
            totalBlocked,
            totalFindings,
          };
        });

        const reportItems = reportPages.flatMap(
          (page) => page?.reports ?? [],
        );

        reportItems.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        const recentReports = reportItems.slice(0, RECENT_REPORTS_LIMIT);
        const totalReportsCount = projectsWithCounts.reduce(
          (sum, project) => sum + project.reportCount,
          0,
        );

        let usageSnapshot: UsageResponse | null = null;
        let usageMessage: string | null = null;
        try {
          usageSnapshot = await apiFetch<UsageResponse>("/api/usage");
        } catch (usageErr) {
          usageMessage =
            usageErr instanceof Error
              ? usageErr.message
              : "Unable to load usage metrics.";
        }

        setProjects(projectsWithCounts);
        setAllReports(reportItems);
        setReports(recentReports);
        setTotalReports(totalReportsCount);
        setUsageData(usageSnapshot);
        setUsageError(usageMessage);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const blockedCommits = projects.reduce(
      (sum, project) => sum + project.totalBlocked,
      0,
    );
    const totalFindingsCount = projects.reduce(
      (sum, project) => sum + project.totalFindings,
      0,
    );

    return {
      totalProjects: projects.length,
      totalReports,
      blockedCommits,
      totalFindings: totalFindingsCount,
    };
  }, [projects, totalReports]);

  const metricsItems = useMemo(
    () => [
      {
        label: "Total Projects",
        value: metrics.totalProjects.toString(),
        helper: "Active project scopes",
      },
      {
        label: "Total Reports",
        value: metrics.totalReports.toString(),
        helper: "Reports visible to this account",
      },
      {
        label: "Blocked Commits",
        value: metrics.blockedCommits.toString(),
        helper: `Based on ${metrics.totalReports} total reports`,
        tone: "danger" as const,
      },
      {
        label: "Total Findings",
        value: metrics.totalFindings.toString(),
        helper: `Based on ${metrics.totalReports} total reports`,
        tone: "warning" as const,
      },
    ],
    [metrics],
  );

  const reportsPerProject = useMemo(
    () =>
      projects.map((project) => ({
        name: project.name || project.repoIdentifier || project.projectId,
        reports: project.reportCount,
      })),
    [projects],
  );

  const blockedDistribution = useMemo(() => {
    const allowed = Math.max(metrics.totalReports - metrics.blockedCommits, 0);
    return { blocked: metrics.blockedCommits, allowed };
  }, [metrics]);

  const findingsTrend = useMemo(() => {
    const sorted = [...allReports].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const byDate = new Map<string, number>();

    sorted.forEach((report) => {
      const key = new Date(report.timestamp).toISOString().slice(0, 10);
      byDate.set(key, (byDate.get(key) ?? 0) + report.summary.findings);
    });

    return Array.from(byDate.entries()).map(([date, findings]) => ({
      dateLabel: formatDateLabel(date),
      findings,
    }));
  }, [allReports]);

  const handleLogout = () => {
    clearToken();
    router.replace("/");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="hidden w-full max-w-[220px] shrink-0 rounded-2xl border border-slate-200/70 bg-white p-6 text-sm text-slate-500 shadow-sm lg:block">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Navigation
          </div>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
            <div>Overview</div>
            <div className="text-slate-400">Projects</div>
            <div className="text-slate-400">Reports</div>
          </div>
        </aside>

        <section className="flex-1 space-y-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Overview
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                High-level security posture across your connected projects.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              onClick={handleLogout}
            >
              Log out
            </button>
          </header>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Security analytics
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Visual summary of your project activity and risk signals.
              </p>
            </div>
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading analytics...
              </div>
            ) : (
              <MetricsGrid items={metricsItems} />
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                  Loading charts...
                </div>
              ) : (
                <ReportsBarChart data={reportsPerProject} />
              )}
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                  Loading charts...
                </div>
              ) : (
                <BlockedPieChart
                  blocked={blockedDistribution.blocked}
                  allowed={blockedDistribution.allowed}
                />
              )}
            </div>
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading trends...
              </div>
            ) : (
              <FindingsLineChart data={findingsTrend} />
            )}
          </section>

          <div className="border-t border-slate-200" />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Usage tracking
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Monthly run limits and daily usage volume.
              </p>
            </div>
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading usage metrics...
              </div>
            ) : usageError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {usageError}
              </div>
            ) : usageData ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <UsageSummaryCard
                  plan={usageData.plan}
                  used={usageData.used}
                  limit={usageData.limit}
                  remaining={usageData.remaining}
                />
                <UsageGraph
                  usageHistory={usageData.usageHistory}
                  limit={usageData.limit}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Usage data not available yet.
              </div>
            )}
          </section>

          <div className="border-t border-slate-200" />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Projects
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Most active projects connected to your clientId.
              </p>
            </div>
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading projects...
              </div>
            ) : (
              <ProjectsTable projects={recentProjects} />
            )}
          </section>

          <div className="border-t border-slate-200" />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Reports
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Latest security scans across your most active projects.
              </p>
            </div>
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading reports...
              </div>
            ) : (
              <ReportsTable reports={reports} />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
