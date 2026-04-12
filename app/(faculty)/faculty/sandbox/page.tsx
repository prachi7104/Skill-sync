"use client";

import { useState } from "react";
import { Copy, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MarkdownRenderer from "@/components/shared/markdown-renderer";

const TASK_TYPES = [
  { value: "career_advice", label: "Career Advice" },
  { value: "jd_analysis", label: "JD Analysis" },
  { value: "skill_gap", label: "Skill Gap Analysis" },
] as const;

type TaskType = typeof TASK_TYPES[number]["value"];

export default function FacultySandboxPage() {
  const [prompt, setPrompt] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("career_advice");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  async function run() {
    if (!prompt.trim()) {
      toast.warning("Enter a prompt before running.");
      return;
    }
    setRunning(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/faculty/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, taskType, responseFormat: "text" }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Sandbox request failed. Please try again.");
        return;
      }

      const output = json.result;
      setResult(typeof output === "string" ? output : JSON.stringify(output, null, 2));
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">

      {/* Page header */}
      <header className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-primary" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Faculty Tools
            </p>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              AI Sandbox
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Run AI-assisted analysis for career advice, JD review, and skill gap identification.
        </p>
      </header>

      {/* Input card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="sandbox-prompt" className="text-sm font-semibold text-foreground">
              Prompt
            </Label>
            <Textarea
              id="sandbox-prompt"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your request — e.g. 'Analyze this JD for skill requirements' or 'What careers suit a CSE student with ML skills?'"
              className="resize-none"
            />
          </div>
          <div className="sm:w-48 space-y-1.5">
            <Label htmlFor="task-type" className="text-sm font-semibold text-foreground">
              Task Type
            </Label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
              <SelectTrigger id="task-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={run} disabled={running || !prompt.trim()} className="w-full sm:w-auto">
          {running ? (
            <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Running…</>
          ) : (
            "Run Analysis"
          )}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Result</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyResult}
              aria-label="Copy result to clipboard"
            >
              {copied
                ? <><Check size={14} aria-hidden="true" /> Copied</>
                : <><Copy size={14} aria-hidden="true" /> Copy</>
              }
            </Button>
          </div>
          <div className="prose prose-sm max-w-none text-foreground break-words overflow-x-auto">
            <MarkdownRenderer content={result} />
          </div>
        </div>
      )}

    </div>
  );
}
