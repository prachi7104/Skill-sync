"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Send, Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "@/components/shared/markdown-renderer";
import { guestApi, type AiProvenance, type DriveSummary, type RankingRow } from "./api";
import { EmptyState, ErrorNote, LoadingBlock, ScoreBar, ScorePill, SkillChips, SourceTag } from "./shared";

interface Overview {
  resume: { source: "preloaded" | "sample" | "upload"; model: string | null; provider: string | null; parsedAt: string | null; filename: string | null; downloadable: boolean };
  profile: {
    name: string | null; summary: string | null; cgpa: number | null; branch: string | null; batchYear: number | null; completeness: number;
    skills: Array<{ name: string; category: string }>;
    projects: Array<{ title: string; description: string; techStack: string[] }>;
    experience: Array<{ company: string; role: string; description: string; startDate?: string; endDate?: string }>;
    education: Array<{ institution: string; degree: string; branch?: string; year: string | number | null; cgpa: string | number | null }>;
    certifications: string[]; achievements: string[];
  };
  health: { score: number; checks: Array<{ key: string; label: string; ok: boolean; tip: string }> };
  fit: Array<{ drive: DriveSummary; you: RankingRow | null; outOf: number; peers: Array<{ name: string; matchScore: number; rank: number; isEligible: boolean }> }>;
}

const STAGES = [
  { key: "extracting", label: "Reading file" },
  { key: "parsing", label: "AI extraction" },
  { key: "embedding", label: "Building profile vector" },
  { key: "ranking", label: "Re-ranking openings" },
] as const;

const newJobId = () => crypto.randomUUID();

export function StudentPortal() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("fit");

  const load = useCallback(async () => {
    setLoadError("");
    const result = await guestApi<Overview>("overview");
    if (result.ok) setOverview(result.data); else setLoadError(result.error);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loadError && !overview) return <ErrorNote message={loadError} onRetry={() => void load()} />;
  if (!overview) return <LoadingBlock label="Loading your workspace…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Student workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your profile, how it matches each opening, and how to improve it.</p>
      </div>
      <ResumePanel overview={overview} onProcessed={async () => { await load(); setTab("fit"); }} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="fit">Job fit</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="analysis">Resume analysis</TabsTrigger>
          <TabsTrigger value="coach">Career coach</TabsTrigger>
        </TabsList>
        <TabsContent value="fit" className="mt-4"><FitTab fit={overview.fit} /></TabsContent>
        <TabsContent value="profile" className="mt-4"><ProfileTab overview={overview} /></TabsContent>
        <TabsContent value="analysis" className="mt-4"><AnalysisTab overview={overview} /></TabsContent>
        <TabsContent value="coach" className="mt-4"><CoachTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Resume panel ────────────────────────────────────────────────────────────

function ResumePanel({ overview, onProcessed }: { overview: Overview; onProcessed: () => Promise<void> }) {
  const [busy, setBusy] = useState<"sample" | "upload" | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [consentOpen, setConsentOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { resume, profile } = overview;

  async function run(kind: "sample" | "upload") {
    const jobId = newJobId();
    setBusy(kind);
    setError("");
    setStage("extracting");
    const poll = window.setInterval(async () => {
      const job = await guestApi<{ status: string; stage: string | null }>(`jobs/${jobId}`);
      if (job.ok && job.data.stage) setStage(job.data.stage);
    }, 1200);
    let result;
    if (kind === "sample") {
      result = await guestApi("resume/sample", { method: "POST", json: { jobId } });
    } else {
      const form = new FormData();
      form.set("file", file!);
      form.set("jobId", jobId);
      form.set("consent", "true");
      result = await guestApi("resume", { method: "POST", body: form });
    }
    window.clearInterval(poll);
    if (result.ok) {
      await onProcessed();
      setFile(null);
    } else {
      setError(result.error);
    }
    setBusy(null);
    setStage(null);
  }

  function chooseFile(f: File | undefined) {
    if (!f) return;
    setError("");
    if (!/\.(pdf|docx)$/i.test(f.name)) { setError("Choose a PDF or DOCX file."); return; }
    if (f.size > 2 * 1024 * 1024) { setError("Resumes must be 2 MB or smaller."); return; }
    setFile(f);
    setConsent(false);
    setConsentOpen(true);
  }

  const sourceText = resume.source === "preloaded"
    ? "Showing the pre-loaded sample profile (fictional student Jordan Lee). No AI has run yet."
    : resume.source === "sample"
      ? `Parsed live from the sample resume by ${resume.model}.`
      : `Parsed live from ${resume.filename ?? "your upload"} by ${resume.model}.`;

  return (
    <section aria-labelledby="resume-heading" className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="resume-heading" className="font-bold">{profile.name ?? "Your profile"}</h2>
            {resume.source === "upload" ? <SourceTag kind="ai" provenance={resume.model ? { source: "live-ai", model: resume.model, provider: resume.provider ?? "", generatedAt: resume.parsedAt ?? "" } : null} />
              : resume.source === "sample" ? <><SourceTag kind="fictional" /><SourceTag kind="ai" provenance={resume.model ? { source: "live-ai", model: resume.model, provider: resume.provider ?? "", generatedAt: resume.parsedAt ?? "" } : null} /></>
                : <SourceTag kind="fictional" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{sourceText}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[profile.branch, profile.cgpa ? `CGPA ${profile.cgpa}` : null, `${profile.skills.length} skills`, `${profile.projects.length} projects`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void run("sample")} disabled={!!busy}>
            {busy === "sample" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Wand2 aria-hidden="true" />} Try Sample Resume
          </Button>
          <Button onClick={() => inputRef.current?.click()} disabled={!!busy}>
            {busy === "upload" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />} Upload My Resume
          </Button>
          <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only" aria-label="Choose a resume file" data-testid="resume-input"
            onChange={(e) => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
          {resume.downloadable && (
            <Button asChild variant="ghost"><a href="/api/demo/resume" download><Download aria-hidden="true" /> My upload</a></Button>
          )}
        </div>
      </div>

      {busy && (
        <ol aria-label="Resume processing progress" className="mt-4 grid gap-2 sm:grid-cols-4" aria-live="polite">
          {STAGES.map((s, i) => {
            const current = STAGES.findIndex((x) => x.key === stage);
            const state = i < current ? "done" : i === current ? "active" : "todo";
            return (
              <li key={s.key} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
                state === "active" ? "border-primary/50 bg-primary/10" : state === "done" ? "border-success/40 bg-success/10" : "border-border text-muted-foreground")}>
                {state === "active" ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <span aria-hidden="true">{state === "done" ? "✓" : i + 1}</span>}
                {s.label}<span className="sr-only">{state === "done" ? " (done)" : state === "active" ? " (in progress)" : ""}</span>
              </li>
            );
          })}
        </ol>
      )}
      {error && <ErrorNote className="mt-4" message={error} />}

      <Dialog open={consentOpen} onOpenChange={(open) => { setConsentOpen(open); if (!open) setFile(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Analyse {file?.name}</DialogTitle>
            <DialogDescription>
              The text of your resume is extracted here and sent to the configured AI provider (Google Gemini) to pull out skills,
              education and projects. The file is stored privately in your guest workspace and deleted with it within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I&apos;m happy for this resume&apos;s text to be sent to the AI provider for parsing.
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => { setConsentOpen(false); setFile(null); }}>Cancel</Button>
            <Button disabled={!consent} onClick={() => { setConsentOpen(false); void run("upload"); }}><FileText aria-hidden="true" /> Analyse resume</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Job fit ─────────────────────────────────────────────────────────────────

function FitTab({ fit }: { fit: Overview["fit"] }) {
  if (fit.length === 0) return <EmptyState title="No openings yet" />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {fit.map((f) => <FitCard key={f.drive.id} item={f} />)}
    </div>
  );
}

function FitCard({ item }: { item: Overview["fit"][number] }) {
  const { drive, you, outOf, peers } = item;
  const [showPeers, setShowPeers] = useState(false);
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5" aria-label={`${drive.title} at ${drive.company}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">{drive.title}</h3>
          <p className="text-sm text-muted-foreground">{drive.company} · {drive.location}</p>
        </div>
        {you && you.isEligible ? <ScorePill value={you.matchScore} /> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5"><SourceTag kind="fictional" /><SourceTag kind="computed" /></div>
      {!you ? (
        <p className="mt-4 text-sm text-muted-foreground">Not ranked yet — analyse a resume to be ranked.</p>
      ) : !you.isEligible ? (
        <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">Not eligible: {you.ineligibilityReason}</p>
      ) : (
        <>
          <p className="mt-3 text-sm"><strong>Rank {you.rank}</strong> of {outOf} eligible applicants · {you.shortExplanation}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ScoreBar label="Semantic similarity" value={you.semanticScore} />
            <ScoreBar label="Structured skill score" value={you.structuredScore} />
          </div>
          <div className="mt-4 space-y-3">
            <div><p className="mb-1 text-xs font-semibold">Matched skills</p><SkillChips skills={you.matchedSkills} tone="match" /></div>
            <div><p className="mb-1 text-xs font-semibold">Missing required skills</p><SkillChips skills={you.missingSkills} tone="miss" empty="None — you cover every required skill." /></div>
          </div>
        </>
      )}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" onClick={() => setShowPeers((v) => !v)} aria-expanded={showPeers}>
          {showPeers ? "Hide comparison" : "Compare with candidates"}
        </Button>
        <AtsButton driveId={drive.id} />
      </div>
      {showPeers && (
        <ol className="mt-3 space-y-1 text-sm" aria-label="Top fictional candidates for this opening">
          {[...peers, ...(you ? [{ name: "You", matchScore: you.matchScore, rank: you.rank, isEligible: you.isEligible, isYou: true }] : [])]
            .sort((a, b) => (a.rank || 99) - (b.rank || 99))
            .map((p) => (
              <li key={p.name} className={cn("flex justify-between rounded-md px-2 py-1", "isYou" in p ? "bg-primary/10 font-semibold" : "")}>
                <span>{p.isEligible ? `#${p.rank}` : "—"} {p.name}{"isYou" in p ? "" : " (fictional)"}</span>
                <span className="tabular-nums">{p.isEligible ? p.matchScore.toFixed(0) : "ineligible"}</span>
              </li>
            ))}
        </ol>
      )}
    </article>
  );
}

interface AtsResult {
  role: string | null; overall: number; interpretation: string; recommendation: string;
  matched: string[]; missingCritical: string[]; toBecomeCompetitive: string[]; redFlags: string[];
  components: Record<string, { percentage: number; verdict: string }>; jdProvenance: AiProvenance;
}

function AtsButton({ driveId }: { driveId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><Sparkles aria-hidden="true" /> Detailed ATS check</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Detailed ATS check</DialogTitle>
            <DialogDescription>The opening is structured live by AI, then scored against your profile by SkillSync&apos;s ATS engine.</DialogDescription></DialogHeader>
          {open && <AtsRunner request={{ driveId }} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AtsRunner({ request }: { request: { driveId: string } | { jd: string } }) {
  const [state, setState] = useState<{ loading: boolean; data?: AtsResult; error?: string }>({ loading: true });
  const key = JSON.stringify(request);
  const run = useCallback(async () => {
    setState({ loading: true });
    const r = await guestApi<AtsResult>("ats", { method: "POST", json: JSON.parse(key) });
    setState(r.ok ? { loading: false, data: r.data } : { loading: false, error: r.error });
  }, [key]);
  useEffect(() => { void run(); }, [run]);
  if (state.loading) return <LoadingBlock label="Structuring the job description and scoring…" />;
  if (state.error || !state.data) return <ErrorNote message={state.error ?? "No result"} onRetry={() => void run()} />;
  const d = state.data;
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div><p className="font-semibold">{d.role ?? "This role"}</p><p className="text-muted-foreground">{d.interpretation}</p></div>
        <ScorePill value={d.overall} />
      </div>
      <div className="flex flex-wrap gap-1.5"><SourceTag kind="computed" /><SourceTag kind="ai" provenance={d.jdProvenance} /></div>
      <p className="text-xs text-muted-foreground">
        This ATS-style score is a stricter rubric than the match score on your job-fit cards: it checks the requirement
        categories the AI pulls out of the job description and subtracts penalties, so it is usually lower.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(d.components).map(([k, v]) => <ScoreBar key={k} label={k.replace(/_/g, " ")} value={v.percentage} />)}
      </div>
      <div><p className="mb-1 text-xs font-semibold">Matched</p><SkillChips skills={d.matched} tone="match" /></div>
      <div><p className="mb-1 text-xs font-semibold">Missing critical skills</p><SkillChips skills={d.missingCritical} tone="miss" empty="None" /></div>
      {d.redFlags.length > 0 && (
        <div><p className="mb-1 text-xs font-semibold">Penalties applied</p>
          <ul className="list-disc space-y-1 pl-5">{d.redFlags.map((t) => <li key={t}>{t}</li>)}</ul></div>
      )}
      {d.toBecomeCompetitive.length > 0 && (
        <div><p className="mb-1 text-xs font-semibold">To become competitive</p>
          <ul className="list-disc space-y-1 pl-5">{d.toBecomeCompetitive.map((t) => <li key={t}>{t}</li>)}</ul></div>
      )}
    </div>
  );
}

// ── Profile ─────────────────────────────────────────────────────────────────

function ProfileTab({ overview }: { overview: Overview }) {
  const p = overview.profile;
  const groups = p.skills.reduce<Record<string, string[]>>((acc, s) => { (acc[s.category] ??= []).push(s.name); return acc; }, {});
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-4 rounded-xl border border-border bg-card p-5 lg:col-span-1">
        <h3 className="font-bold">Extracted skills</h3>
        {Object.keys(groups).length === 0 ? <p className="text-sm text-muted-foreground">No skills found.</p> :
          Object.entries(groups).map(([cat, names]) => (
            <div key={cat}><p className="mb-1 text-xs font-semibold text-muted-foreground">{cat}</p><SkillChips skills={names} tone="neutral" /></div>
          ))}
        <h3 className="pt-2 font-bold">Education</h3>
        {p.education.length === 0 ? <p className="text-sm text-muted-foreground">No education found.</p> : (
          <ul className="space-y-2 text-sm">{p.education.map((e, i) => (
            <li key={i}><p className="font-medium">{e.degree}{e.branch ? `, ${e.branch}` : ""}</p>
              <p className="text-muted-foreground">{e.institution}{e.year ? ` · ${e.year}` : ""}{e.cgpa ? ` · CGPA ${e.cgpa}` : ""}</p></li>
          ))}</ul>
        )}
      </section>
      <section className="space-y-4 rounded-xl border border-border bg-card p-5 lg:col-span-2">
        {p.summary && <p className="text-sm text-muted-foreground">{p.summary}</p>}
        <h3 className="font-bold">Projects</h3>
        {p.projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects found.</p> : (
          <ul className="space-y-3">{p.projects.map((pr, i) => (
            <li key={i} className="rounded-lg border border-border p-3"><p className="font-medium">{pr.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{pr.description}</p>
              {pr.techStack?.length > 0 && <div className="mt-2"><SkillChips skills={pr.techStack} tone="neutral" /></div>}</li>
          ))}</ul>
        )}
        <h3 className="font-bold">Experience</h3>
        {p.experience.length === 0 ? <p className="text-sm text-muted-foreground">No experience found.</p> : (
          <ul className="space-y-3">{p.experience.map((x, i) => (
            <li key={i}><p className="font-medium">{x.role} · {x.company}</p>
              <p className="text-xs text-muted-foreground">{[x.startDate, x.endDate].filter(Boolean).join(" – ")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{x.description}</p></li>
          ))}</ul>
        )}
        {(p.certifications.length > 0 || p.achievements.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><h3 className="font-bold">Certifications</h3><ul className="mt-1 list-disc pl-5 text-sm">{p.certifications.map((c) => <li key={c}>{c}</li>)}</ul></div>
            <div><h3 className="font-bold">Achievements</h3><ul className="mt-1 list-disc pl-5 text-sm">{p.achievements.map((c) => <li key={c}>{c}</li>)}</ul></div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Analysis ────────────────────────────────────────────────────────────────

interface Recommendations { summary: string; strengths: string[]; improvements: Array<{ title: string; detail: string }>; skillsToLearn: string[]; provenance: AiProvenance }

function AnalysisTab({ overview }: { overview: Overview }) {
  const [rec, setRec] = useState<{ loading: boolean; data?: Recommendations; error?: string }>({ loading: false });
  const [jd, setJd] = useState("");
  const [atsRequest, setAtsRequest] = useState<{ jd: string } | null>(null);

  async function getRecommendations() {
    setRec({ loading: true });
    const r = await guestApi<Recommendations>("recommendations", { method: "POST" });
    setRec(r.ok ? { loading: false, data: r.data } : { loading: false, error: r.error });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold">Resume health</h3>
          <SourceTag kind="computed" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Rule-based checks on the parsed resume.</p>
        <div className="mt-3"><ScoreBar label="Checks passed" value={overview.health.score} /></div>
        <ul className="mt-4 space-y-2 text-sm">
          {overview.health.checks.map((c) => (
            <li key={c.key} className="flex gap-2">
              <span aria-hidden="true" className={c.ok ? "text-success" : "text-warning"}>{c.ok ? "✓" : "!"}</span>
              <span><span className="font-medium">{c.label}</span><span className="sr-only">{c.ok ? " — passed" : " — needs work"}</span>
                {!c.ok && <span className="block text-muted-foreground">{c.tip}</span>}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold">AI improvement recommendations</h3>
          {rec.data && <SourceTag kind="ai" provenance={rec.data.provenance} />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Generated live from your profile and computed match scores.</p>
        {!rec.data && !rec.loading && (
          <Button className="mt-4" onClick={() => void getRecommendations()}><Sparkles aria-hidden="true" /> Get recommendations</Button>
        )}
        {rec.loading && <LoadingBlock className="mt-4" label="Asking the AI coach…" />}
        {rec.error && <ErrorNote className="mt-4" message={rec.error} onRetry={() => void getRecommendations()} />}
        {rec.data && (
          <div className="mt-4 space-y-4 text-sm">
            <p>{rec.data.summary}</p>
            {rec.data.strengths.length > 0 && <div><p className="mb-1 text-xs font-semibold">Strengths</p><ul className="list-disc space-y-1 pl-5">{rec.data.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>}
            <div><p className="mb-1 text-xs font-semibold">Improvements</p>
              <ul className="space-y-2">{rec.data.improvements.map((i) => <li key={i.title} className="rounded-md border border-border p-3"><p className="font-medium">{i.title}</p><p className="text-muted-foreground">{i.detail}</p></li>)}</ul></div>
            {rec.data.skillsToLearn.length > 0 && <div><p className="mb-1 text-xs font-semibold">Skills to learn</p><SkillChips skills={rec.data.skillsToLearn} tone="neutral" /></div>}
            <Button size="sm" variant="outline" onClick={() => void getRecommendations()}>Regenerate</Button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <h3 className="font-bold">Check against any job description</h3>
        <p className="mt-1 text-sm text-muted-foreground">Paste a real or imagined job description to get an ATS-style score for your current profile.</p>
        <label htmlFor="jd-input" className="sr-only">Job description</label>
        <Textarea id="jd-input" className="mt-3 min-h-32" value={jd} onChange={(e) => setJd(e.target.value)} maxLength={8000}
          placeholder="Paste a job description (at least 80 characters)…" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{jd.trim().length}/8000</span>
          <Button disabled={jd.trim().length < 80} onClick={() => setAtsRequest({ jd: jd.trim() })}>Score my profile</Button>
        </div>
        {atsRequest && <div className="mt-4"><AtsRunner key={atsRequest.jd} request={atsRequest} /></div>}
      </section>
    </div>
  );
}

// ── Coach ───────────────────────────────────────────────────────────────────

type ChatMessage = { role: "user" | "assistant"; content: string; provenance?: AiProvenance };
const SUGGESTIONS = ["Which opening should I apply to first?", "How do I close my biggest skill gap?", "What should I highlight in an interview?"];

function CoachTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  // State updates are async, so a fast double submit can pass a `sending` check; the ref can't.
  const inFlight = useRef(false);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || inFlight.current) return;
    inFlight.current = true;
    setError("");
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    const r = await guestApi<{ reply: string; provenance: AiProvenance }>("chat", { method: "POST", json: { message, history } });
    inFlight.current = false;
    setSending(false);
    if (r.ok) setMessages((m) => [...m, { role: "assistant", content: r.data.reply, provenance: r.data.provenance }]);
    else { setError(r.error); setMessages((m) => m.slice(0, -1)); setInput(message); }
  }

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card" aria-label="Career coach chat">
      <div className="border-b border-border p-4">
        <h3 className="font-bold">Career coach</h3>
        <p className="text-sm text-muted-foreground">Ask about applications, skills or interviews. Replies are AI-generated live and use your profile and scores.</p>
      </div>
      <div className="max-h-[28rem] min-h-[14rem] space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => <Button key={s} size="sm" variant="outline" onClick={() => void send(s)}>{s}</Button>)}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
            {m.role === "assistant"
              ? <MarkdownRenderer content={m.content} className="text-sm leading-6 [&_li]:my-0.5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5" />
              : <p className="whitespace-pre-wrap">{m.content}</p>}
            {m.provenance && <SourceTag className="mt-2" kind="ai" provenance={m.provenance} />}
          </div>
        ))}
        {sending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Coach is thinking…</p>}
        <div ref={endRef} />
      </div>
      {error && <ErrorNote className="mx-4 mb-3" message={error} />}
      <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <label htmlFor="coach-input" className="sr-only">Message the career coach</label>
        <input id="coach-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000}
          placeholder="Ask the career coach…" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Button type="submit" disabled={!input.trim() || sending} aria-label="Send message"><Send aria-hidden="true" /></Button>
      </form>
    </section>
  );
}
