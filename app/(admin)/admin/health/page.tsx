"use client";
import React from 'react';

// Reusable Metric Component just for this dashboard
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
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
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

export default function SystemHealthPage() {
  return (
    <div className="p-8 max-w-6xl w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-1">System Health</h2>
        <p className="text-sm text-slate-400">Operational dashboard — live snapshot</p>
      </div>

      <div className="space-y-6">
        {/* Job Queue Health */}
        <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">Job Queue Health</h3>
          <p className="text-sm text-slate-400 mb-6">Last 24 hours</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <Metric label="Total Pending" value="17" status="warning" />
            <Metric label="Completed (24h)" value="1" status="ok" />
            <Metric label="Failed (24h)" value="0" status="neutral" />
            <Metric label="Success Rate" value="100%" />
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-slate-700 mb-2">Pending by Type</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">parse_resume: 1</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">generate_embedding: 2</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">enhance_jd: 7</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">rank_students: 7</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">Avg Latency (completed jobs)</p>
            <div className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md">
              parse_resume: 5542ms
            </div>
          </div>
        </section>

        {/* Embedding Status */}
        <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">Embedding Status</h3>
          <p className="text-sm text-slate-400 mb-6">Student profile vectorization</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Metric label="Total Students" value="3" />
            <Metric label="With Embedding" value="1" status="ok" sub="33% coverage" />
            <Metric label="Missing Embedding" value="2" status="neutral" sub="Needs generate_embedding job" />
            <Metric label="No Resume" value="0" status="ok" sub="Cannot generate embedding" />
          </div>
        </section>
        
        {/* System Status */}
        <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">System Status</h3>
          <p className="text-sm text-slate-400 mb-6">Infrastructure health checks</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Metric label="Database Connection" value="3ms" status="ok" sub="SELECT 1 latency" />
            <Metric label="Last Cron Activity" value="Just now" status="ok" sub="Job type: parse_resume" />
            <Metric label="Drives Created" value="7" />
          </div>
        </section>
      </div>
    </div>
  );
}