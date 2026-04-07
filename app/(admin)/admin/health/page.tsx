"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  if (n === undefined || n === null || n === -1) return "—";
  return String(n);
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
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {status && (
          <Badge variant={status === "error" ? "red" : status === "warning" ? "yellow" : status === "ok" ? "green" : "default"}>
            {status.toUpperCase()}
          </Badge>
        )}
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
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">System Health</h1>
        <div className="h-px bg-border w-full" />
        <div className="rounded-md border border-border bg-card p-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading health data...
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">System Health</h1>
        <div className="h-px bg-border w-full" />
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-6 text-red-500">
          Health data unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">System Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">Operational dashboard — live snapshot</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="h-px bg-border w-full" />

      {error && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">
          <Badge variant="yellow" className="mr-2">WARN</Badge>{error}
        </div>
      )}

      {health.degraded ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">
          <Badge variant="yellow" className="mr-2">WARN</Badge>Partial health data: some checks failed within timeout
          {health.failedChecks && health.failedChecks.length > 0 ? ` (${health.failedChecks.join(", ")})` : ""}.
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Core Metrics</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-5">
          <Metric label="Total Students" value={displayCount(health.totalStudents)} />
          <Metric label="Students Onboarded" value={displayCount(health.studentsOnboarded)} />
          <Metric label="With Embeddings" value={displayCount(health.studentsWithEmbeddings)} />
          <Metric label="Drives Created" value={displayCount(health.drivesCreated)} />
          <Metric label="Drives Ranked" value={displayCount(health.drivesRanked)} />
          <Metric label="Jobs Pending" value={displayCount(health.jobsPending)} status={health.jobsPending > 0 ? "warning" : "ok"} />
          <Metric label="Jobs Failed" value={displayCount(health.jobsFailed)} status={health.jobsFailed > 0 ? "error" : "ok"} />
          <Metric label="Jobs Completed Today" value={displayCount(health.jobsCompletedToday)} status="ok" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Services & Crons</h2>
        <div className="rounded-md border border-border bg-card">
          {[
            { name: "Redis", status: health.redisOk ? "healthy" as const : "down" as const, action: undefined },
            { name: "Cloudinary", status: cloudinary?.status === "ok" ? "healthy" as const : "down" as const, action: undefined },
            ...(["resumes", "embeddings", "jd-enhancement", "rankings", "cleanup"] as const).map(type => ({
              name: `Worker: ${type}`,
              status: triggering[type] ? "processing" as const : "healthy" as const,
              action: type as string
            }))
          ].map((service) => (
            <div key={service.name} className={cn("p-4 border-b border-border last:border-0 flex items-center justify-between gap-4", service.status === "processing" ? "bg-secondary/20" : "")}>
              <div className="flex items-center gap-2.5">
                <div className={cn("w-2 h-2 rounded-full", {
                  "bg-green-500": service.status === "healthy",
                  "bg-yellow-500": service.status === "processing",
                  "bg-red-500": service.status === "down",
                })} />
                <span className="text-sm text-foreground">{service.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={service.status === "healthy" ? "green" : service.status === "down" ? "red" : "yellow"}>
                  {service.status === "processing" ? "Running" : service.status === "healthy" ? "Healthy" : "Offline"}
                </Badge>
                {service.action && (
                  <Button variant="outline" size="sm" onClick={() => handleTrigger(service.action)} disabled={!!triggering[service.action]}>
                    Ping
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {triggerMessage && <p className="text-xs text-muted-foreground">{triggerMessage}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Job Queue Breakdown</h2>
        <div className="rounded-md border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric label="Pending Total" value={displayCount(pendingTotal)} status={pendingTotal > 0 ? "warning" : "ok"} />
            <Metric label="Failed (24h)" value={displayCount(failed24h)} status={failed24h > 0 ? "error" : "ok"} />
            <Metric label="Success Rate" value={`${successRate}%`} status={successRate >= 90 ? "ok" : "warning"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" className="font-normal">parse_resume: {displayCount(pendingByType.parse_resume)}</Badge>
            <Badge variant="secondary" className="font-normal">generate_embedding: {displayCount(pendingByType.generate_embedding)}</Badge>
            <Badge variant="secondary" className="font-normal">enhance_jd: {displayCount(pendingByType.enhance_jd)}</Badge>
            <Badge variant="secondary" className="font-normal">rank_students: {displayCount(pendingByType.rank_students)}</Badge>
            <Badge variant="secondary" className="font-normal">avg_latency_ms: {displayCount(jobsHealth.avgLatencyMs)}</Badge>
          </div>
          {jobsHealth.lastActivity && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last activity: {jobsHealth.lastActivity.type} ({jobsHealth.lastActivity.status}) - {getTimeAgo(new Date(jobsHealth.lastActivity.updated_at))}
            </p>
          )}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">Last updated: {new Date(health.timestamp).toLocaleString()}</p>
    </div>
  );
}
