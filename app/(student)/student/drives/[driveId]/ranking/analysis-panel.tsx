"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalysisResponse = {
  hasAnalysis: boolean;
  analysisGeneratedAt?: string | null;
  resumeImpact?: {
    topStrengths?: string[];
    topGaps?: string[];
    suggestedBullets?: string[];
  } | null;
  interviewPrep?: {
    technicalQuestions?: string[];
    behavioralQuestions?: string[];
    hrQuestions?: string[];
  } | null;
};

export default function AnalysisPanel({ driveId }: { driveId: string }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"resume" | "interview">("resume");
  const [data, setData] = useState<AnalysisResponse>({ hasAnalysis: false });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/drives/${driveId}/analysis/me`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [driveId]);

  async function generate() {
    setGenerating(true);
    const res = await fetch(`/api/drives/${driveId}/analysis/me`, { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      setData(json);
      setTab("resume");
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Loading analysis...</CardContent>
      </Card>
    );
  }

  if (!data.hasAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drive-Specific Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generate personalized guidance for resume impact and interview preparation for this drive.
          </p>
          <Button onClick={generate} disabled={generating}>
            {generating ? "Generating..." : "Generate My Analysis"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive-Specific Analysis</CardTitle>
        <div className="flex gap-2 pt-2">
          <button
            className={`rounded-md px-3 py-1.5 text-sm ${tab === "resume" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            onClick={() => setTab("resume")}
          >
            Resume Impact
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-sm ${tab === "interview" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            onClick={() => setTab("interview")}
          >
            Interview Prep
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tab === "resume" ? (
          <>
            <Section title="Top Strengths" items={data.resumeImpact?.topStrengths ?? []} />
            <Section title="Top Gaps" items={data.resumeImpact?.topGaps ?? []} />
            <Section title="Suggested Resume Bullets" items={data.resumeImpact?.suggestedBullets ?? []} />
          </>
        ) : (
          <>
            <Section title="Technical Questions" items={data.interviewPrep?.technicalQuestions ?? []} />
            <Section title="Behavioral Questions" items={data.interviewPrep?.behavioralQuestions ?? []} />
            <Section title="HR Questions" items={data.interviewPrep?.hrQuestions ?? []} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-sm text-muted-foreground">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
