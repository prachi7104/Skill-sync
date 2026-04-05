"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function FacultySandboxPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/faculty/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, taskType: "career_advice", responseFormat: "text" }),
      });
      const json = await res.json();

      if (!res.ok) {
        setResult("");
        setError(json.message || "Sandbox request failed");
        return;
      }

      const output = json.result;
      if (typeof output === "string") {
        setResult(output);
      } else {
        setResult(JSON.stringify(output, null, 2));
      }
    } catch {
      setResult("");
      setError("Sandbox request failed");
    } finally {
      setRunning(false);
    }
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
          {error ? <p className="text-sm text-rose-400 mb-3">{error}</p> : null}
          <pre className="whitespace-pre-wrap text-sm text-slate-300">{result || "No result yet."}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
