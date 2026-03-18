"use client";
import React, { useEffect, useState } from 'react';

// Reusable Metric Component
const Metric = ({ label, value, sub, status }: { label: string, value: string | number, sub?: string, status?: 'ok' | 'warning' | 'error' | 'neutral' }) => {
  const statusColors = {
    ok: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    error: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    neutral: "bg-slate-500/15 text-slate-400 border border-slate-500/20"
  };

  return (
    <div className="flex flex-col">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <div className="flex items-baseline space-x-2">
        <h4 className="text-2xl font-bold text-slate-100">{value}</h4>
        {status && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColors[status]}`}>
            {status === 'ok' ? 'OK' : status === 'warning' ? 'Processing' : status}
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

// Types for API responses
interface HealthData {
  totalStudents: number;
  studentsOnboarded: number;
  studentsWithEmbeddings: number;
  drivesCreated: number;
  drivesRanked: number;
  jobFailures: number;
  redisOk: boolean;
  timestamp: string;
}

interface JobsHealthData {
  pending: {
    total: number;
    byType: {
      parse_resume: number;
      generate_embedding: number;
      enhance_jd: number;
      rank_students: number;
    };
  };
  processing: { total: number };
  failed24h: { total: number };
  completed24h: { total: number; avgLatencyMs: number | null };
  lastActivity: { type: string; status: string; updatedAt: string } | null;
}

interface CloudinaryHealth {
  status: 'ok' | 'error';
  error?: string;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [jobsHealth, setJobsHealth] = useState<JobsHealthData | null>(null);
  const [cloudinaryHealth, setCloudinaryHealth] = useState<CloudinaryHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cronTriggering, setCronTriggering] = useState<Record<string, boolean>>({});
  const [cronErrors, setCronErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAllHealth = async () => {
      try {
        setLoading(true);
        setError(null);

        const [healthRes, jobsRes, cloudinaryRes] = await Promise.all([
          fetch('/api/admin/health'),
          fetch('/api/admin/health/jobs'),
          fetch('/api/admin/health/cloudinary'),
        ]);

        if (!healthRes.ok) {
          throw new Error(`Health API failed: ${healthRes.statusText}`);
        }
        if (!jobsRes.ok) {
          throw new Error(`Jobs API failed: ${jobsRes.statusText}`);
        }

        const healthData = await healthRes.json();
        const jobsData = await jobsRes.json();
        const cloudinaryData = cloudinaryRes.ok ? await cloudinaryRes.json() : { status: 'error' };

        setHealth(healthData);
        setJobsHealth(jobsData);
        setCloudinaryHealth(cloudinaryData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch health data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllHealth();
  }, []);

  const handleTriggerCron = async (type: 'resumes' | 'embeddings' | 'jd-enhancement' | 'rankings') => {
    try {
      setCronTriggering(prev => ({ ...prev, [type]: true }));
      setCronErrors(prev => ({ ...prev, [type]: '' }));

      const response = await fetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Failed with status ${response.status}`);
      }

      setCronTriggering(prev => ({ ...prev, [type]: false }));
    } catch (err: any) {
      setCronErrors(prev => ({ ...prev, [type]: err.message || 'Unknown error' }));
      setCronTriggering(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-1">System Health</h2>
          <p className="text-sm text-slate-400">Operational dashboard — live snapshot</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-12 text-center">
          <p className="text-slate-400">Loading health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-1">System Health</h2>
          <p className="text-sm text-slate-400">Operational dashboard — live snapshot</p>
        </div>
        <div className="bg-rose-500/15 border border-rose-500/20 rounded-xl p-6">
          <p className="text-rose-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const onboardingPercent = health ? Math.round((health.studentsOnboarded / health.totalStudents) * 100) || 0 : 0;
  const embeddingPercent = health ? Math.round((health.studentsWithEmbeddings / health.totalStudents) * 100) || 0 : 0;
  const successRate = jobsHealth ? Math.round(((jobsHealth.completed24h.total - jobsHealth.failed24h.total) / Math.max(jobsHealth.completed24h.total, 1)) * 100) : 0;
  const lastActivityTime = jobsHealth?.lastActivity ? getTimeAgo(new Date(jobsHealth.lastActivity.updatedAt)) : 'N/A';

  return (
    <div className="p-8 max-w-6xl w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-1">System Health</h2>
        <p className="text-sm text-slate-400">Operational dashboard — live snapshot</p>
      </div>

      <div className="space-y-6">
        {/* System Overview */}
        <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">System Overview</h3>
          <p className="text-sm text-slate-400 mb-6">Core platform metrics</p>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            <Metric label="Total Students" value={health?.totalStudents ?? 0} />
            <Metric label="Onboarded" value={`${health?.studentsOnboarded ?? 0}`} sub={`${onboardingPercent}% complete`} status={onboardingPercent >= 80 ? 'ok' : 'warning'} />
            <Metric label="With Embeddings" value={`${health?.studentsWithEmbeddings ?? 0}`} sub={`${embeddingPercent}% coverage`} status={embeddingPercent >= 80 ? 'ok' : 'neutral'} />
            <Metric label="Drives Created" value={health?.drivesCreated ?? 0} />
            <Metric label="Drives Ranked" value={health?.drivesRanked ?? 0} />
            <Metric label="Job Failures" value={health?.jobFailures ?? 0} status={health?.jobFailures ? 'error' : 'ok'} />
          </div>
        </section>

        {/* Job Queue Health */}
        <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">Job Queue Health</h3>
          <p className="text-sm text-slate-400 mb-6">Last 24 hours</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <Metric label="Total Pending" value={jobsHealth?.pending.total ?? 0} status={jobsHealth?.pending.total ? 'warning' : 'ok'} />
            <Metric label="Completed (24h)" value={jobsHealth?.completed24h.total ?? 0} status="ok" />
            <Metric label="Failed (24h)" value={jobsHealth?.failed24h.total ?? 0} status={jobsHealth?.failed24h.total ? 'error' : 'ok'} />
            <Metric label="Success Rate" value={`${successRate}%`} />
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 mb-2">Pending by Type</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">parse_resume: {jobsHealth?.pending.byType.parse_resume ?? 0}</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">generate_embedding: {jobsHealth?.pending.byType.generate_embedding ?? 0}</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">enhance_jd: {jobsHealth?.pending.byType.enhance_jd ?? 0}</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">rank_students: {jobsHealth?.pending.byType.rank_students ?? 0}</span>
            </div>
          </div>

          {jobsHealth?.completed24h.avgLatencyMs && (
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">Avg Latency (24h completed jobs)</p>
              <div className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">
                {jobsHealth.completed24h.avgLatencyMs}ms
              </div>
            </div>
          )}

          {jobsHealth?.lastActivity && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs font-bold text-slate-400 mb-2">Last Activity</p>
              <p className="text-sm text-slate-300">{jobsHealth.lastActivity.type} <span className="text-slate-500">({jobsHealth.lastActivity.status})</span> — {lastActivityTime}</p>
            </div>
          )}
        </section>

        {/* Infrastructure */}
        <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">Infrastructure</h3>
          <p className="text-sm text-slate-400 mb-6">External services status</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Metric label="Database" value="OK" status="ok" sub="Connected" />
            <Metric label="Redis" value={health?.redisOk ? 'OK' : 'Error'} status={health?.redisOk ? 'ok' : 'error'} />
            <Metric label="Cloudinary" value={cloudinaryHealth?.status === 'ok' ? 'OK' : 'Error'} status={cloudinaryHealth?.status === 'ok' ? 'ok' : 'error'} sub={cloudinaryHealth?.error ? `${cloudinaryHealth.error}` : undefined} />
          </div>
        </section>

        {/* Manual Cron Triggers */}
        <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">Manual Cron Triggers</h3>
          <p className="text-sm text-slate-400 mb-6">Used for testing — GitHub Actions handles production scheduling</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['resumes', 'embeddings', 'jd-enhancement', 'rankings'] as const).map(type => (
              <div key={type}>
                <button
                  onClick={() => handleTriggerCron(type)}
                  disabled={cronTriggering[type]}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    cronTriggering[type]
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {cronTriggering[type] ? 'Running...' : `Run ${formatCronType(type)}`}
                </button>
                {cronErrors[type] && (
                  <p className="text-rose-400 text-xs mt-1">{cronErrors[type]}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatCronType(type: string): string {
  const map: Record<string, string> = {
    resumes: 'Resume Worker',
    embeddings: 'Embeddings',
    'jd-enhancement': 'JD Enhancement',
    rankings: 'Rankings',
  };
  return map[type] || type;
}