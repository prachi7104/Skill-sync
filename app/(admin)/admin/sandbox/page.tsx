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
      body: JSON.stringify({ prompt, modelOverride, metadata: { source: "admin-page" } }),
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
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Sandbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Try an admin-side sandbox prompt" />
            <Input value={modelOverride} onChange={(e) => setModelOverride(e.target.value)} placeholder="Optional model override" />
            <Button onClick={run}>Run Sandbox</Button>
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
            <pre className="whitespace-pre-wrap text-xs text-slate-300">{JSON.stringify(config, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-slate-300">{result || "No result yet."}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
