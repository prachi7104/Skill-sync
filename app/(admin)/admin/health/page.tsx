"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/page-header";

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
  degraded?: boolean;
  failedChecks?: string[];
  queryTimeoutMs?: number;
  timestamp: string;
};

type JobsByType = {
  parse_resume: number;
  generate_embedding: number;
  enhance_jd: number;
  rank_students: number;
};

type JobsHealthData = {
  breakdown: Record<string, Record<string, number>>;
  lastActivity: { type: string; status: string; updated_at: string } | null;
  avgLatencyMs: number | null;
};

type CloudinaryHealth = {
  status: "ok" | "error";
  error?: string;
};

const EMPTY_JOBS: JobsHealthData = {
  breakdown: {},
  lastActivity: null,
  avgLatencyMs: null,
};

function fallbackHealthData(): HealthData {
  return {
    totalStudents: -1,
    studentsOnboarded: -1,
    studentsWithEmbeddings: -1,
    drivesCreated: -1,
    drivesRanked: -1,
    jobsPending: -1,
    jobsFailed: -1,
    jobsCompletedToday: -1,
    redisOk: false,
    degraded: true,
    failedChecks: ["health_endpoint_unavailable"],
    queryTimeoutMs: 0,
    timestamp: new Date().toISOString(),
  };
}

function displayCount(n: number | undefined | null): string {
  if (n === undefined || n === null) return "…";    // still loading
  if (n === -1) return "N/A";                       // fetch failed
  return String(n);                                  // real value including 0
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return fallback;
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
    ok: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    neutral: "bg-muted text-muted-foreground border-border",
  };

  const isUnavailable = value === "N/A";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className={cn(
          "text-3xl font-black tracking-tight",
          isUnavailable ? "text-xl text-muted-foreground" : "text-foreground"
        )}>
          {value}
        </p>
        {status && <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold border", statusClass[status])}>{status.toUpperCase()}</span>}
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
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState<Record<string, boolean>>({});
  const [triggerMessage, setTriggerMessage] = useState("");

  const pendingByType = useMemo<JobsByType>(() => ({
    parse_resume: asNumber(jobsHealth.breakdown.parse_resume?.pending),
    generate_embedding: asNumber(jobsHealth.breakdown.generate_embedding?.pending),
    enhance_jd: asNumber(jobsHealth.breakdown.enhance_jd?.pending),
    rank_students: asNumber(jobsHealth.breakdown.rank_students?.pending),
  }), [jobsHealth]);

  const pendingTotal = useMemo(
    () => Object.values(pendingByType).reduce((a, b) => a + b, 0),
    [pendingByType],
  );

  const failed24h = useMemo(
    () => asNumber(Object.values(jobsHealth.breakdown).reduce((acc, v) => acc + asNumber(v.failed), 0)),
    [jobsHealth],
  );

  const completed24h = useMemo(
    () => asNumber(Object.values(jobsHealth.breakdown).reduce((acc, v) => acc + asNumber(v.completed), 0)),
    [jobsHealth],
  );

  const successRate = useMemo(() => {
    if (completed24h <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round(((completed24h - failed24h) / completed24h) * 100)));
  }, [completed24h, failed24h]);

  async function loadHealth(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const [healthRes, jobsRes, cloudinaryRes] = await Promise.allSettled([
        fetch("/api/admin/health", { cache: "no-store" }),
        fetch("/api/admin/health/jobs", { cache: "no-store" }),
        fetch("/api/admin/health/cloudinary", { cache: "no-store" }),
      ]);

      let healthData: HealthData = health ?? fallbackHealthData();
      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        healthData = await healthRes.value.json() as HealthData;
      } else {
        const status = healthRes.status === "fulfilled" ? healthRes.value.status : "network";
        setError(`Health metrics unavailable (${status}). Showing partial data.`);
      }

      const jobsData = jobsRes.status === "fulfilled" && jobsRes.value.ok
        ? await jobsRes.value.json()
        : EMPTY_JOBS;
      const cloudData = cloudinaryRes.status === "fulfilled" && cloudinaryRes.value.ok
        ? await cloudinaryRes.value.json() as CloudinaryHealth
        : { status: "error" as const, error: "Unavailable" };

      setHealth(healthData);
      setJobsHealth((jobsData ?? EMPTY_JOBS) as JobsHealthData);
      setCloudinary(cloudData);
    } catch (e) {
      setError((e as Error).message || "Failed to fetch health data");
      setHealth((prev) => prev ?? fallbackHealthData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadHealth(true);
  }

  async function handleTrigger(type: string) {
    setTriggering((prev) => ({ ...prev, [type]: true }));
    setTriggerMessage("");
    try {
      const res = await fetch("/api/admin/trigger-cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTriggerMessage(`Triggered ${type} (${data.status})`);
      } else {
        setTriggerMessage(`Failed: ${data.error ?? "unknown error"}`);
      }
      await loadHealth(true);
    } finally {
      setTriggering((prev) => ({ ...prev, [type]: false }));
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            Operations monitoring
          </div>
          <h1 className="text-3xl font-black text-foreground">System Health</h1>
          <p className="text-sm text-muted-foreground">Operational dashboard — live snapshot</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          Loading health data...
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            Operations monitoring
          </div>
          <h1 className="text-3xl font-black text-foreground">System Health</h1>
          <p className="text-sm text-muted-foreground">Operational dashboard — live snapshot</p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          Health data unavailable
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 animate-in fade-in duration-300 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Operations monitoring"
        title="System Health"
        description="Operational dashboard — live snapshot"
        actions={
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning-foreground">
          {error}
        </div>
      )}

      {health.degraded ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning-foreground">
          Partial health data: some checks failed within timeout
          {health.failedChecks && health.failedChecks.length > 0 ? ` (${health.failedChecks.join(", ")})` : ""}.
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">Core metrics</h2>
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

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">Job queue</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Metric label="Pending Total" value={displayCount(pendingTotal)} status={pendingTotal > 0 ? "warning" : "ok"} />
          <Metric label="Failed (24h)" value={displayCount(failed24h)} status={failed24h > 0 ? "error" : "ok"} />
          <Metric label="Success Rate" value={`${successRate}%`} status={successRate >= 90 ? "ok" : "warning"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-card px-3 py-1">parse_resume: {displayCount(pendingByType.parse_resume)}</span>
          <span className="rounded bg-card px-3 py-1">generate_embedding: {displayCount(pendingByType.generate_embedding)}</span>
          <span className="rounded bg-card px-3 py-1">enhance_jd: {displayCount(pendingByType.enhance_jd)}</span>
          <span className="rounded bg-card px-3 py-1">rank_students: {displayCount(pendingByType.rank_students)}</span>
          <span className="rounded bg-card px-3 py-1">avg_latency_ms: {displayCount(jobsHealth.avgLatencyMs)}</span>
        </div>
        {jobsHealth.lastActivity && (
          <p className="mt-4 text-xs text-muted-foreground">
            Last activity: {jobsHealth.lastActivity.type} ({jobsHealth.lastActivity.status}) - {getTimeAgo(new Date(jobsHealth.lastActivity.updated_at))}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">Manual triggers</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {(["resumes", "embeddings", "jd-enhancement", "rankings", "cleanup"] as const).map((type) => (
            <Button
              key={type}
              onClick={() => handleTrigger(type)}
              disabled={!!triggering[type]}
              className="rounded-xl px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {triggering[type] ? "Running..." : type}
            </Button>
          ))}
        </div>
        {triggerMessage && <p className="mt-3 text-xs text-muted-foreground">{triggerMessage}</p>}
      </section>

      <p className="text-xs text-muted-foreground">Last updated: {new Date(health.timestamp).toLocaleString()}</p>
    </div>
  );
}
