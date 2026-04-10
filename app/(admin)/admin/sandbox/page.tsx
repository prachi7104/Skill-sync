"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminSandboxPage() {
  const [prompt, setPrompt] = useState("");
  const [modelOverride, setModelOverride] = useState("");
  const [taskType, setTaskType] = useState("career_advice");
  const [diagnosticsOnly, setDiagnosticsOnly] = useState(false);
  const [result, setResult] = useState("");
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [studentDailyLimit, setStudentDailyLimit] = useState("3");

  useEffect(() => {
    async function loadConfig() {
      const res = await fetch("/api/admin/sandbox-config");
      if (!res.ok) return;
      const json = await res.json();
      setConfig(json.config ?? null);
      if (json.config?.studentDailyLimit) {
        setStudentDailyLimit(String(json.config.studentDailyLimit));
      }
    }

    loadConfig().catch(() => undefined);
  }, []);

  async function run() {
    const res = await fetch("/api/admin/sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        modelOverride,
        taskType,
        diagnosticsOnly,
        metadata: { source: "admin-page" },
      }),
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }

  async function saveConfig() {
    const res = await fetch("/api/admin/sandbox-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentDailyLimit: Number(studentDailyLimit) }),
    });
    const json = await res.json();
    setConfig(json.config ?? null);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-950/60 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Admin Sandbox</h1>
          <p className="text-sm leading-6 text-muted-foreground">Run controlled prompts, inspect payloads, and adjust sandbox limits for the college scope.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admin Sandbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Try an admin-side sandbox prompt" />
            <div className="space-y-2">
              <Label>Task Type</Label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="career_advice">career_advice</option>
                <option value="enhance_jd">enhance_jd</option>
                <option value="generate_questions">generate_questions</option>
                <option value="sandbox_feedback">sandbox_feedback</option>
              </select>
            </div>
            <Input value={modelOverride} onChange={(e) => setModelOverride(e.target.value)} placeholder="Optional model override" />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={diagnosticsOnly}
                onChange={(e) => setDiagnosticsOnly(e.target.checked)}
              />
              Diagnostics-only mode (no model execution)
            </label>
            <Button onClick={run}>{diagnosticsOnly ? "Run Diagnostics" : "Run Sandbox"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sandbox Config</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Student Daily Limit</Label>
              <Input value={studentDailyLimit} onChange={(e) => setStudentDailyLimit(e.target.value)} />
            </div>
            <Button onClick={saveConfig}>Save Config</Button>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(config, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{result || "No result yet."}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
