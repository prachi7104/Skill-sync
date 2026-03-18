"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function FacultySandboxPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    const res = await fetch("/api/faculty/sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
    setRunning(false);
  }

  return (
    <div className="mx-auto max-w-5xl p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Faculty Sandbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Try a faculty-side sandbox prompt" />
          <Button onClick={run} disabled={running}>{running ? "Running..." : "Run Sandbox"}</Button>
        </CardContent>
      </Card>
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
