"use client";

import { useEffect, useMemo, useState } from "react";

type HealthData = {
  totalStudents: number;
  studentsOnboarded: number;
  studentsWithEmbeddings: number;
  drivesCreated: number;
  drivesRanked: number;
  jobsPending: number;
  jobsFailed: number;
  jobsCompletedToday: number;
  redisOk: boolean;
  timestamp: string;
};

type JobsByType = {
  parse_resume: number;
  generate_embedding: number;
  enhance_jd: number;
  rank_students: number;
};

type JobsHealthData = {
  pending: {
    total: number;
    byType: JobsByType;
  };
  processing: { total: number };
  failed24h: { total: number };
  completed24h: { total: number; avgLatencyMs: number | null };
  lastActivity: { type: string; status: string; updatedAt: string } | null;
};

type CloudinaryHealth = {
  status: "ok" | "error";
  error?: string;
};

const EMPTY_JOBS: JobsHealthData = {
  pending: {
    total: 0,
    byType: {
      parse_resume: 0,
      generate_embedding: 0,
      enhance_jd: 0,
      rank_students: 0,
    },
  },
  processing: { total: 0 },
  failed24h: { total: 0 },
  completed24h: { total: 0, avgLatencyMs: null },
  lastActivity: null,
};

function displayCount(n: number | undefined | null): string {
  if (n === undefined || n === null || n === -1) return "—";
  return String(n);
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return fallback;
}

function normalizeJobsHealth(raw: unknown): JobsHealthData {
  const data = (raw ?? {}) as Record<string, unknown>;

  if (typeof data.pending === "object" && data.pending !== null) {
    const pending = data.pending as Record<string, unknown>;
    const byType = (pending.byType ?? {}) as Record<string, unknown>;
    return {
      pending: {
        total: asNumber(pending.total),
        byType: {
          parse_resume: asNumber(byType.parse_resume),
          generate_embedding: asNumber(byType.generate_embedding),
          enhance_jd: asNumber(byType.enhance_jd),
          rank_students: asNumber(byType.rank_students),
        },
      },
      processing: { total: asNumber((data.processing as Record<string, unknown> | undefined)?.total) },
      failed24h: { total: asNumber((data.failed24h as Record<string, unknown> | undefined)?.total) },
      completed24h: {
        total: asNumber((data.completed24h as Record<string, unknown> | undefined)?.total),
        avgLatencyMs: ((data.completed24h as Record<string, unknown> | undefined)?.avgLatencyMs as number | null | undefined) ?? null,
      },
      lastActivity: (data.lastActivity as JobsHealthData["lastActivity"]) ?? null,
    };
  }

  const breakdown = (data.breakdown ?? {}) as Record<string, Record<string, number>>;
  const pendingByType: JobsByType = {
    parse_resume: asNumber(breakdown.parse_resume?.pending),
    generate_embedding: asNumber(breakdown.generate_embedding?.pending),
    enhance_jd: asNumber(breakdown.enhance_jd?.pending),
    rank_students: asNumber(breakdown.rank_students?.pending),
  };
  const pendingTotal = Object.values(pendingByType).reduce((a, b) => a + b, 0);
  const completed24h = asNumber((data.completed24h as Record<string, unknown> | undefined)?.total);
  const failed24h = asNumber((data.failed24h as Record<string, unknown> | undefined)?.total);

  return {
    pending: { total: pendingTotal, byType: pendingByType },
    processing: { total: 0 },
    failed24h: { total: failed24h },
    completed24h: {
      total: completed24h,
      avgLatencyMs: (data.avgLatencyMs as number | null | undefined) ?? null,
    },
    lastActivity: (data.lastActivity as JobsHealthData["lastActivity"]) ?? null,
  };
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Metric({ label, value, status }: { label: string; value: string; status?: "ok" | "warning" | "error" | "neutral" }) {
  const statusClass = {
    ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    error: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    neutral: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-2xl font-black text-white">{value}</p>
        {status && <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${statusClass[status]}`}>{status.toUpperCase()}</span>}
      </div>
    </div>
  );
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [jobsHealth, setJobsHealth] = useState<JobsHealthData>(EMPTY_JOBS);
  const [cloudinary, setCloudinary] = useState<CloudinaryHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [healthRes, jobsRes, cloudinaryRes] = await Promise.allSettled([
          fetch("/api/admin/health"),
          fetch("/api/admin/health/jobs"),
          fetch("/api/admin/health/cloudinary"),
        ]);

        if (healthRes.status !== "fulfilled" || !healthRes.value.ok) {
          const status = healthRes.status === "fulfilled" ? healthRes.value.status : "network";
          throw new Error(`Health API failed (${status})`);
        }

        const healthData = (await healthRes.value.json()) as HealthData;
        const jobsData = jobsRes.status === "fulfilled" && jobsRes.value.ok ? await jobsRes.value.json() : EMPTY_JOBS;
        const cloudinaryData = cloudinaryRes.status === "fulfilled" && cloudinaryRes.value.ok
          ? ((await cloudinaryRes.value.json()) as CloudinaryHealth)
          : { status: "error" as const, error: "Unavailable" };

        if (cancelled) return;
        setHealth(healthData);
        setJobsHealth(normalizeJobsHealth(jobsData));
        setCloudinary(cloudinaryData);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || "Failed to fetch health data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const successRate = useMemo(() => {
    const done = jobsHealth.completed24h.total;
    const failed = jobsHealth.failed24h.total;
    if (done <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round(((done - failed) / done) * 100)));
  }, [jobsHealth]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl p-8">
        <h1 className="text-3xl font-black text-white">System Health</h1>
        <p className="mt-1 text-sm text-slate-400">Operational dashboard — live snapshot</p>
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
          Loading health data...
        </div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="w-full max-w-6xl p-8">
        <h1 className="text-3xl font-black text-white">System Health</h1>
        <p className="mt-1 text-sm text-slate-400">Operational dashboard — live snapshot</p>
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          {error ?? "Health data unavailable"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl p-8 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-white">System Health</h1>
        <p className="mt-1 text-sm text-slate-400">Operational dashboard — live snapshot</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Core Metrics</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-5">
          <Metric label="Total Students" value={displayCount(health.totalStudents)} />
          <Metric label="Students Onboarded" value={displayCount(health.studentsOnboarded)} />
          <Metric label="With Embeddings" value={displayCount(health.studentsWithEmbeddings)} />
          <Metric label="Drives Created" value={displayCount(health.drivesCreated)} />
          <Metric label="Drives Ranked" value={displayCount(health.drivesRanked)} />
          <Metric label="Jobs Pending" value={displayCount(health.jobsPending)} status={health.jobsPending > 0 ? "warning" : "ok"} />
          <Metric label="Jobs Failed" value={displayCount(health.jobsFailed)} status={health.jobsFailed > 0 ? "error" : "ok"} />
          <Metric label="Jobs Completed Today" value={displayCount(health.jobsCompletedToday)} status="ok" />
          <Metric label="Redis" value={health.redisOk ? "OK" : "Error"} status={health.redisOk ? "ok" : "error"} />
          <Metric label="Cloudinary" value={cloudinary?.status === "ok" ? "OK" : "Error"} status={cloudinary?.status === "ok" ? "ok" : "error"} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Job Queue</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Metric label="Pending Total" value={displayCount(jobsHealth.pending.total)} status={jobsHealth.pending.total > 0 ? "warning" : "ok"} />
          <Metric label="Failed (24h)" value={displayCount(jobsHealth.failed24h.total)} status={jobsHealth.failed24h.total > 0 ? "error" : "ok"} />
          <Metric label="Success Rate" value={`${successRate}%`} status={successRate >= 90 ? "ok" : "warning"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded bg-slate-800 px-3 py-1">parse_resume: {displayCount(jobsHealth.pending.byType.parse_resume)}</span>
          <span className="rounded bg-slate-800 px-3 py-1">generate_embedding: {displayCount(jobsHealth.pending.byType.generate_embedding)}</span>
          <span className="rounded bg-slate-800 px-3 py-1">enhance_jd: {displayCount(jobsHealth.pending.byType.enhance_jd)}</span>
          <span className="rounded bg-slate-800 px-3 py-1">rank_students: {displayCount(jobsHealth.pending.byType.rank_students)}</span>
          <span className="rounded bg-slate-800 px-3 py-1">avg_latency_ms: {displayCount(jobsHealth.completed24h.avgLatencyMs)}</span>
        </div>
        {jobsHealth.lastActivity && (
          <p className="mt-4 text-xs text-slate-400">
            Last activity: {jobsHealth.lastActivity.type} ({jobsHealth.lastActivity.status}) - {getTimeAgo(new Date(jobsHealth.lastActivity.updatedAt))}
          </p>
        )}
      </section>

      <p className="text-xs text-slate-500">Last updated: {new Date(health.timestamp).toLocaleString()}</p>
    </div>
  );
}
