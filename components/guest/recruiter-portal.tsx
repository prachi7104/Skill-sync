"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Search, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { guestApi, type AiProvenance, type DriveSummary, type RankingRow } from "./api";
import { EmptyState, ErrorNote, LoadingBlock, ScoreBar, ScorePill, SkillChips, SourceTag } from "./shared";

type DriveListItem = DriveSummary & { candidates: number; eligible: number; shortlisted: number; topScore: number };
interface DriveDetail { drive: DriveSummary; rankings: RankingRow[] }

export function RecruiterPortal() {
  const [drives, setDrives] = useState<DriveListItem[] | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const loadDrives = useCallback(async () => {
    setError("");
    const r = await guestApi<{ drives: DriveListItem[] }>("drives");
    if (!r.ok) { setError(r.error); return; }
    setDrives(r.data.drives);
    setSelected((s) => s ?? r.data.drives[0]?.id ?? null);
  }, []);
  useEffect(() => { void loadDrives(); }, [loadDrives]);

  if (error && !drives) return <ErrorNote message={error} onRetry={() => void loadDrives()} />;
  if (!drives) return <LoadingBlock label="Loading openings…" />;
  if (drives.length === 0) return <EmptyState title="No openings in this workspace" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Recruiter workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Rank fictional candidates against your openings and build a shortlist.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Openings" className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Openings <SourceTag kind="fictional" className="ml-1 normal-case tracking-normal" /></p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {drives.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => setSelected(d.id)} aria-current={selected === d.id ? "true" : undefined}
                  className={cn("w-full rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected === d.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted")}>
                  <p className="font-semibold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.company}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{d.eligible} eligible · {d.shortlisted} shortlisted · top {d.topScore.toFixed(0)}</p>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {selected && <DrivePanel key={selected} driveId={selected} onChanged={() => void loadDrives()} />}
      </div>
    </div>
  );
}

function DrivePanel({ driveId, onChanged }: { driveId: string; onChanged: () => void }) {
  const [detail, setDetail] = useState<DriveDetail | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [sort, setSort] = useState<"score" | "cgpa">("score");
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState<RankingRow | null>(null);
  const [pendingShortlist, setPendingShortlist] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    const r = await guestApi<DriveDetail>(`drives/${driveId}`);
    if (r.ok) setDetail(r.data); else setError(r.error);
  }, [driveId]);
  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    if (!detail) return [];
    const q = query.trim().toLowerCase();
    return detail.rankings
      .filter((r) => !eligibleOnly || r.isEligible)
      .filter((r) => !shortlistedOnly || r.shortlisted)
      .filter((r) => r.matchScore >= minScore)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.skills.some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => sort === "cgpa" ? (b.cgpa ?? 0) - (a.cgpa ?? 0) : (a.rank || 999) - (b.rank || 999));
  }, [detail, query, minScore, eligibleOnly, shortlistedOnly, sort]);

  async function toggleShortlist(row: RankingRow) {
    setPendingShortlist(row.studentId);
    const next = !row.shortlisted;
    const r = await guestApi<{ shortlisted: boolean }>(`drives/${driveId}/shortlist`, { method: "PATCH", json: { studentId: row.studentId, shortlisted: next } });
    setPendingShortlist(null);
    if (!r.ok) { setNotice(r.error); return; }
    setDetail((d) => d && { ...d, rankings: d.rankings.map((x) => x.studentId === row.studentId ? { ...x, shortlisted: next } : x) });
    setViewing((v) => v && v.studentId === row.studentId ? { ...v, shortlisted: next } : v);
    setNotice(`${row.name} ${next ? "added to" : "removed from"} the shortlist.`);
    onChanged();
  }

  if (error && !detail) return <ErrorNote message={error} onRetry={() => void load()} />;
  if (!detail) return <LoadingBlock label="Loading rankings…" />;
  const { drive } = detail;
  const shortlisted = detail.rankings.filter((r) => r.shortlisted);

  return (
    <section aria-labelledby="drive-title" className="min-w-0 space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="drive-title" className="text-xl font-bold">{drive.title}</h2>
            <p className="text-sm text-muted-foreground">{[drive.company, drive.location, drive.packageOffered, drive.minCgpa ? `Min CGPA ${drive.minCgpa}` : null].filter(Boolean).join(" · ")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil aria-hidden="true" /> Edit opening</Button>
        </div>
        {drive.summary && <p className="mt-3 text-sm">{drive.summary}</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><p className="mb-1 text-xs font-semibold">Required skills</p><SkillChips skills={drive.requiredSkills} tone="neutral" /></div>
          <div><p className="mb-1 text-xs font-semibold">Preferred skills</p><SkillChips skills={drive.preferredSkills} tone="neutral" /></div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1">
            <label htmlFor="cand-search" className="mb-1 block text-xs font-semibold">Search</label>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-muted-foreground" aria-hidden="true" />
            <Input id="cand-search" className="pl-9" placeholder="Name or skill" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div>
            <label htmlFor="min-score" className="mb-1 block text-xs font-semibold">Min score: {minScore}</label>
            <input id="min-score" type="range" min={0} max={90} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-36 accent-[hsl(var(--primary))]" />
          </div>
          <div>
            <label htmlFor="sort" className="mb-1 block text-xs font-semibold">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as "score" | "cgpa")} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="score">Match rank</option><option value="cgpa">CGPA</option>
            </select>
          </div>
          <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} /> Eligible only</label>
          <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={shortlistedOnly} onChange={(e) => setShortlistedOnly(e.target.checked)} /> Shortlisted ({shortlisted.length})</label>
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{notice || `${rows.length} of ${detail.rankings.length} candidates shown.`}</p>

      {rows.length === 0 ? <EmptyState title="No candidates match these filters">Try clearing the search or lowering the minimum score.</EmptyState> : (
        <ol className="space-y-2" aria-label="Ranked candidates">
          {rows.map((r) => (
            <li key={r.studentId} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <span className="w-10 text-center text-lg font-black tabular-nums text-muted-foreground">{r.isEligible ? `#${r.rank}` : "—"}</span>
              <div className="min-w-[160px] flex-1">
                <p className="font-semibold">{r.name} <span className="text-xs font-normal text-muted-foreground">(fictional)</span></p>
                <p className="text-xs text-muted-foreground">{[r.branch, r.cgpa ? `CGPA ${r.cgpa}` : null].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.isEligible ? `${r.matchedSkills.length} matched · ${r.missingSkills.length} missing required` : r.ineligibilityReason}</p>
              </div>
              {r.isEligible ? <ScorePill value={r.matchScore} /> : <span className="text-xs font-semibold text-warning">Ineligible</span>}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setViewing(r)}>View<span className="sr-only"> {r.name}</span></Button>
                <Button size="sm" variant={r.shortlisted ? "default" : "ghost"} aria-pressed={!!r.shortlisted} disabled={pendingShortlist === r.studentId}
                  onClick={() => void toggleShortlist(r)} aria-label={`${r.shortlisted ? "Remove" : "Add"} ${r.name} ${r.shortlisted ? "from" : "to"} shortlist`}>
                  {pendingShortlist === r.studentId ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Star className={r.shortlisted ? "fill-current" : ""} aria-hidden="true" />}
                  <span className="hidden sm:inline">{r.shortlisted ? "Shortlisted" : "Shortlist"}</span>
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {editing && <EditDriveDialog drive={drive} onClose={() => setEditing(false)}
        onSaved={(d) => { setDetail(d); setEditing(false); setNotice("Opening saved and candidates re-ranked."); onChanged(); }} />}
      {viewing && <CandidateDialog driveId={driveId} row={viewing} outOf={detail.rankings.filter((r) => r.isEligible).length}
        onClose={() => setViewing(null)} onToggleShortlist={() => void toggleShortlist(viewing)} pending={pendingShortlist === viewing.studentId} />}
    </section>
  );
}

const splitList = (v: string) => v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

function EditDriveDialog({ drive, onClose, onSaved }: { drive: DriveSummary; onClose: () => void; onSaved: (d: DriveDetail) => void }) {
  const [title, setTitle] = useState(drive.title);
  const [summary, setSummary] = useState(drive.summary);
  const [required, setRequired] = useState(drive.requiredSkills.join(", "));
  const [preferred, setPreferred] = useState(drive.preferredSkills.join(", "));
  const [responsibilities, setResponsibilities] = useState(drive.responsibilities.join("\n"));
  const [minCgpa, setMinCgpa] = useState(drive.minCgpa?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cgpa = minCgpa.trim() === "" ? null : Number(minCgpa);
    if (cgpa !== null && (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10)) { setError("Minimum CGPA must be between 0 and 10."); return; }
    if (splitList(required).length === 0) { setError("Add at least one required skill."); return; }
    setSaving(true);
    const r = await guestApi<DriveDetail>(`drives/${drive.id}`, { method: "PATCH", json: {
      title: title.trim(), summary: summary.trim(), requiredSkills: splitList(required), preferredSkills: splitList(preferred),
      responsibilities: responsibilities.split("\n").map((s) => s.trim()).filter(Boolean), minCgpa: cgpa,
    } });
    setSaving(false);
    if (r.ok) onSaved(r.data); else setError(r.error);
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Edit opening</DialogTitle>
          <DialogDescription>Saving re-embeds the job description and re-ranks every candidate.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => void save(e)} className="space-y-3">
          <div><label htmlFor="ed-title" className="mb-1 block text-xs font-semibold">Job title</label><Input id="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={120} /></div>
          <div><label htmlFor="ed-summary" className="mb-1 block text-xs font-semibold">Summary</label><Textarea id="ed-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={1000} /></div>
          <div><label htmlFor="ed-req" className="mb-1 block text-xs font-semibold">Required skills (comma separated)</label><Input id="ed-req" value={required} onChange={(e) => setRequired(e.target.value)} /></div>
          <div><label htmlFor="ed-pref" className="mb-1 block text-xs font-semibold">Preferred skills (comma separated)</label><Input id="ed-pref" value={preferred} onChange={(e) => setPreferred(e.target.value)} /></div>
          <div><label htmlFor="ed-resp" className="mb-1 block text-xs font-semibold">Responsibilities (one per line)</label><Textarea id="ed-resp" value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} /></div>
          <div><label htmlFor="ed-cgpa" className="mb-1 block text-xs font-semibold">Minimum CGPA (blank for none)</label><Input id="ed-cgpa" inputMode="decimal" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} /></div>
          {error && <ErrorNote message={error} />}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <><Loader2 className="animate-spin" aria-hidden="true" /> Re-ranking…</> : "Save and re-rank"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CandidateDetail {
  candidate: {
    id: string; name: string; cgpa: number | null; branch: string | null; batchYear: number | null;
    skills: Array<{ name: string }> | null; projects: Array<{ title: string; description: string; techStack: string[] }> | null;
    workExperience: Array<{ company: string; role: string; description: string }> | null;
    certifications: Array<{ title: string }> | null; achievements: Array<{ title: string }> | null;
  };
  fits: Array<{ driveId: string; title: string; company: string; matchScore: number; rank: number; isEligible: boolean; outOf: number }>;
}
interface Explanation { verdict: string; strengths: string[]; concerns: string[]; interviewFocus: string[]; provenance: AiProvenance }

function CandidateDialog({ driveId, row, outOf, onClose, onToggleShortlist, pending }: { driveId: string; row: RankingRow; outOf: number; onClose: () => void; onToggleShortlist: () => void; pending: boolean }) {
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [error, setError] = useState("");
  const [ai, setAi] = useState<{ loading: boolean; data?: Explanation; error?: string }>({ loading: false });

  const load = useCallback(async () => {
    setError("");
    const r = await guestApi<CandidateDetail>(`candidates/${row.studentId}`);
    if (r.ok) setDetail(r.data); else setError(r.error);
  }, [row.studentId]);
  useEffect(() => { void load(); }, [load]);

  async function explain() {
    setAi({ loading: true });
    const r = await guestApi<Explanation>(`drives/${driveId}/explain`, { method: "POST", json: { studentId: row.studentId } });
    setAi(r.ok ? { loading: false, data: r.data } : { loading: false, error: r.error });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
          <DialogDescription>{[row.branch, row.cgpa ? `CGPA ${row.cgpa}` : null, "fictional candidate"].filter(Boolean).join(" · ")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5"><SourceTag kind="fictional" /><SourceTag kind="computed" /></div>
            <Button size="sm" variant={row.shortlisted ? "default" : "outline"} onClick={onToggleShortlist} disabled={pending} aria-pressed={!!row.shortlisted}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Star className={row.shortlisted ? "fill-current" : ""} aria-hidden="true" />}
              {row.shortlisted ? "Shortlisted" : "Add to shortlist"}
            </Button>
          </div>
          {row.isEligible ? (
            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div><ScorePill value={row.matchScore} /><p className="text-xs text-muted-foreground">Rank {row.rank} of {outOf}</p></div>
              <div className="space-y-2">
                <ScoreBar label="Semantic similarity (profile vs JD)" value={row.semanticScore} />
                <ScoreBar label="Structured skill score" value={row.structuredScore} />
              </div>
            </div>
          ) : <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2">Ineligible: {row.ineligibilityReason}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="mb-1 text-xs font-semibold">Matched skills</p><SkillChips skills={row.matchedSkills} tone="match" /></div>
            <div><p className="mb-1 text-xs font-semibold">Missing required skills</p><SkillChips skills={row.missingSkills} tone="miss" empty="None" /></div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">Scoring breakdown</p>
            <p className="whitespace-pre-line text-muted-foreground">{row.detailedExplanation}</p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">AI explanation</p>
              {ai.data && <SourceTag kind="ai" provenance={ai.data.provenance} />}
            </div>
            {!ai.data && !ai.loading && <Button size="sm" className="mt-2" onClick={() => void explain()}><Sparkles aria-hidden="true" /> Explain this ranking</Button>}
            {ai.loading && <LoadingBlock className="mt-2 py-6" label="Generating explanation…" />}
            {ai.error && <ErrorNote className="mt-2" message={ai.error} onRetry={() => void explain()} />}
            {ai.data && (
              <div className="mt-2 space-y-3">
                <p>{ai.data.verdict}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><p className="text-xs font-semibold">Strengths</p><ul className="mt-1 list-disc space-y-1 pl-5">{ai.data.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
                  <div><p className="text-xs font-semibold">Concerns</p><ul className="mt-1 list-disc space-y-1 pl-5">{ai.data.concerns.map((s) => <li key={s}>{s}</li>)}</ul></div>
                </div>
                {ai.data.interviewFocus.length > 0 && <div><p className="text-xs font-semibold">Interview focus</p><ul className="mt-1 list-disc space-y-1 pl-5">{ai.data.interviewFocus.map((s) => <li key={s}>{s}</li>)}</ul></div>}
              </div>
            )}
          </div>

          {error && <ErrorNote message={error} onRetry={() => void load()} />}
          {!detail && !error && <LoadingBlock label="Loading profile…" className="py-6" />}
          {detail && (
            <>
              <div>
                <p className="mb-1 text-xs font-semibold">All skills</p>
                <SkillChips skills={(detail.candidate.skills ?? []).map((s) => s.name)} tone="neutral" />
              </div>
              {(detail.candidate.projects ?? []).length > 0 && (
                <div><p className="mb-1 text-xs font-semibold">Projects</p>
                  <ul className="space-y-2">{detail.candidate.projects!.map((p) => <li key={p.title}><span className="font-medium">{p.title}</span> — <span className="text-muted-foreground">{p.description}</span></li>)}</ul></div>
              )}
              {(detail.candidate.workExperience ?? []).length > 0 && (
                <div><p className="mb-1 text-xs font-semibold">Experience</p>
                  <ul className="space-y-2">{detail.candidate.workExperience!.map((w) => <li key={w.company + w.role}><span className="font-medium">{w.role}, {w.company}</span> — <span className="text-muted-foreground">{w.description}</span></li>)}</ul></div>
              )}
              <div><p className="mb-1 text-xs font-semibold">Fit across your openings</p>
                <ul className="space-y-1">{detail.fits.map((f) => (
                  <li key={f.driveId} className={cn("flex justify-between rounded-md px-2 py-1", f.driveId === driveId && "bg-primary/10")}>
                    <span>{f.title}</span><span className="tabular-nums">{f.isEligible ? `${f.matchScore.toFixed(0)} · #${f.rank}/${f.outOf}` : "ineligible"}</span>
                  </li>))}</ul></div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
