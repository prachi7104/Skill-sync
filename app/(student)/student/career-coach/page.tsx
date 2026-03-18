"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CoachResponse = {
  cached?: boolean;
  summary?: string;
  priority_skills?: Array<{
    skill: string;
    why_critical: string;
    resource: { type: string; name: string; url_description: string };
    week_start: number;
    hours_needed: number;
  }>;
  amcat_tip?: string;
  message?: string;
  error?: string;
};

export default function CareerCoachPage() {
  const [data, setData] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/student/career-coach");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Career Coach</h1>
          <p className="mt-1 text-sm text-slate-400">Get a 90-day upskilling roadmap based on the drives you are currently eligible for.</p>
        </div>
        <Button onClick={load} className="bg-indigo-600 hover:bg-indigo-500">Refresh Plan</Button>
      </div>

      {loading ? <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-sm text-slate-400">Generating your roadmap...</div> : null}
      {!loading && data?.message ? <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-sm text-slate-300">{data.message}</div> : null}
      {!loading && data?.error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-sm text-rose-200">{data.error}</div> : null}

      {!loading && data?.summary ? (
        <>
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-white">Personalized Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-300">
              <p>{data.summary}</p>
              <p className="text-xs text-slate-500">{data.cached ? "Loaded from 24h cache" : "Freshly generated"}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {(data.priority_skills ?? []).map((item) => (
              <Card key={item.skill} className="border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="text-white">{item.skill}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  <p>{item.why_critical}</p>
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                    <p className="font-semibold text-slate-100">{item.resource.name}</p>
                    <p className="text-xs text-slate-400">{item.resource.type} • Search: {item.resource.url_description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Start week {item.week_start}</span>
                    <span>{item.hours_needed} hours</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.amcat_tip ? (
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-white">AMCAT Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">{data.amcat_tip}</CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}