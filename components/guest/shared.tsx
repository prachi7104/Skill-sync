"use client";

import { AlertCircle, Bot, Calculator, FlaskConical, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiProvenance } from "./api";

/** Labels that tell visitors where a piece of content came from. */
export function SourceTag({ kind, provenance, className }: { kind: "fictional" | "computed" | "ai"; provenance?: AiProvenance | null; className?: string }) {
  const config = {
    fictional: { icon: FlaskConical, text: "Fictional data", cls: "border-border bg-muted text-muted-foreground" },
    computed: { icon: Calculator, text: "Computed score", cls: "border-info/40 bg-info/15 text-info-foreground" },
    ai: { icon: Bot, text: provenance ? `AI-generated · ${provenance.model}` : "AI-generated", cls: "border-primary/40 bg-primary/10 text-primary" },
  }[kind];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold", config.cls, className)}
      title={kind === "ai" && provenance ? `Generated live by ${provenance.provider} model ${provenance.model} at ${new Date(provenance.generatedAt).toLocaleTimeString()}` : undefined}>
      <Icon className="size-3" aria-hidden="true" />{config.text}
    </span>
  );
}

export function ErrorNote({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-wrap items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm", className)}>
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}><RotateCcw aria-hidden="true" /> Try again</Button>}
    </div>
  );
}

export function LoadingBlock({ label, className }: { label: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-sm text-muted-foreground", className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />{label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const tone = pct >= 70 ? "bg-success" : pct >= 45 ? "bg-warning" : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{pct.toFixed(0)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SkillChips({ skills, tone, empty }: { skills: string[]; tone: "match" | "miss" | "neutral"; empty?: string }) {
  if (skills.length === 0) return <p className="text-xs text-muted-foreground">{empty ?? "None"}</p>;
  const cls = tone === "match" ? "border-success/40 bg-success/15" : tone === "miss" ? "border-destructive/40 bg-destructive/10" : "border-border bg-muted";
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((s) => <li key={s} className={cn("rounded-md border px-2 py-0.5 text-xs", cls)}>{s}</li>)}
    </ul>
  );
}

export function ScorePill({ value }: { value: number }) {
  const tone = value >= 70 ? "text-success" : value >= 45 ? "text-warning" : "text-destructive";
  return <span className={cn("text-2xl font-black tabular-nums", tone)}>{value.toFixed(0)}<span className="text-xs font-semibold text-muted-foreground">/100</span></span>;
}
