"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/shared/pagination";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, RefreshCw, Trash2, UploadCloud } from "lucide-react";

type SessionRow = {
  id: string;
  session_name: string;
  test_date: string | null;
  batch_year: number | null;
  academic_year: string | null;
  status: "draft" | "review" | "published";
  total_students: number;
  alpha_count?: number;
  beta_count?: number;
  gamma_count?: number;
  unmatched_count?: number;
};

type ResultRow = {
  id: string;
  sap_id: string;
  full_name: string;
  branch: string | null;
  status: string | null;
  cs_score: number | null;
  cp_score: number | null;
  automata_score: number | null;
  automata_fix_score: number | null;
  quant_score: number | null;
  csv_category: "alpha" | "beta" | "gamma" | null;
  computed_category: "alpha" | "beta" | "gamma";
  final_category: "alpha" | "beta" | "gamma";
  computed_total: number;
  rank_in_session: number;
  linked: boolean;
};

type Summary = {
  linked: number;
  unmatched: number;
  overridden: number;
};

type ApiResponse = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

type SortBy = "rank" | "total" | "name";
type SortDir = "asc" | "desc";

const defaultWeights = {
  automata: 50,
  automata_fix: 20,
  computer_programming: 10,
  computer_science: 10,
  quant: 10,
};

const defaultThresholds = {
  alpha_min: 60,
  beta_min: 40,
  gamma_min: 0,
};

function categoryClass(category: string) {
  if (category === "alpha") return "bg-success/10 text-success border-success/20";
  if (category === "beta") return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

async function safeReadJson(res: Response): Promise<ApiResponse> {
  const raw = await res.text();
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw) as ApiResponse;
  } catch {
    return { error: raw.trim() };
  }
}

function getApiError(data: ApiResponse, fallback: string): string {
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

export default function AdminAmcatPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);

  const [results, setResults] = useState<ResultRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ linked: 0, unmatched: 0, overridden: 0 });
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [leaderboardPreview, setLeaderboardPreview] = useState<ResultRow[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const pageSize = 50;

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sapSearch, setSapSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [weights, setWeights] = useState(defaultWeights);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [recalculating, setRecalculating] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [uploading, setUploading] = useState(false);

  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<{
    resultId: string;
    studentName: string;
    from: "alpha" | "beta" | "gamma";
    to: "alpha" | "beta" | "gamma";
    note: string;
  } | null>(null);
  const [overrideSaving, setOverrideSaving] = useState(false);

  const totalWeight = useMemo(() =>
    weights.automata +
      weights.automata_fix +
      weights.computer_programming +
      weights.computer_science +
      weights.quant,
  [weights]);

  const sortedResults = useMemo(() => {
    const copy = [...results];
    copy.sort((a, b) => {
      let compare = 0;
      if (sortBy === "rank") compare = a.rank_in_session - b.rank_in_session;
      if (sortBy === "total") compare = a.computed_total - b.computed_total;
      if (sortBy === "name") compare = a.full_name.localeCompare(b.full_name);
      return sortDir === "asc" ? compare : -compare;
    });
    return copy;
  }, [results, sortBy, sortDir]);

  async function fetchSessions() {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await fetch("/api/admin/amcat");
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(getApiError(data, "Failed to load sessions"));

      const fetched = Array.isArray(data.sessions) ? (data.sessions as SessionRow[]) : [];
      setSessions(fetched);

      if (!selectedSessionId && fetched.length > 0) {
        setSelectedSessionId(fetched[0].id);
        setSelectedSession(fetched[0]);
      } else if (selectedSessionId) {
        setSelectedSession(fetched.find((session) => session.id === selectedSessionId) ?? null);
      }
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : "Failed to load sessions");
    } finally {
      setSessionsLoading(false);
    }
  }

  async function fetchSessionResults(sessionId: string, page = 1) {
    setResultsLoading(true);
    setFeedbackError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (sapSearch.trim()) params.set("sap", sapSearch.trim());

      const res = await fetch(`/api/admin/amcat/${sessionId}?${params.toString()}`);
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(getApiError(data, "Failed to load results"));

      const nextResults = Array.isArray(data.results) ? (data.results as ResultRow[]) : [];
      const nextTotal = typeof data.total === "number" ? data.total : 0;
      const nextSummary = data.summary && typeof data.summary === "object"
        ? (data.summary as Summary)
        : { linked: 0, unmatched: 0, overridden: 0 };
      const nextSession = data.session && typeof data.session === "object"
        ? (data.session as SessionRow)
        : null;

      setResults(nextResults);
      setResultsTotal(nextTotal);
      setSummary(nextSummary);
      if (nextSession) {
        setSelectedSession(nextSession);
      }
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Failed to load results");
    } finally {
      setResultsLoading(false);
    }
  }

  async function fetchLeaderboardPreview(sessionId: string) {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const res = await fetch(`/api/admin/amcat/${sessionId}?page=1`);
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(getApiError(data, "Failed to load leaderboard preview"));

      const rows = Array.isArray(data.results) ? (data.results as ResultRow[]) : [];
      setLeaderboardPreview(rows.slice(0, 10));
    } catch (error) {
      setLeaderboardPreview([]);
      setLeaderboardError(error instanceof Error ? error.message : "Failed to load leaderboard preview");
    } finally {
      setLeaderboardLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;
    fetchSessionResults(selectedSessionId, resultsPage);
  }, [selectedSessionId, resultsPage, categoryFilter]);

  useEffect(() => {
    if (!selectedSessionId) {
      setLeaderboardPreview([]);
      setLeaderboardError(null);
      return;
    }
    fetchLeaderboardPreview(selectedSessionId);
  }, [selectedSessionId]);

  async function handleUpload() {
    if (!uploadFile || !sessionName.trim()) {
      setFeedbackError("Please select file and session name");
      return;
    }

    setUploading(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("session_name", sessionName.trim());
      if (testDate) form.append("test_date", testDate);
      if (batchYear) form.append("batch_year", batchYear);
      if (academicYear) form.append("academic_year", academicYear);

      const res = await fetch("/api/admin/amcat", { method: "POST", body: form });
      const data = await safeReadJson(res);

      if (!res.ok) throw new Error(getApiError(data, "Upload failed"));

      setFeedbackSuccess("AMCAT file uploaded successfully");
      setSessionName("");
      setTestDate("");
      setBatchYear("");
      setAcademicYear("");
      setUploadFile(null);

      await fetchSessions();
      const sessionId = typeof data.sessionId === "string" ? data.sessionId : null;
      if (sessionId) {
        setSelectedSessionId(sessionId);
        setResultsPage(1);
        await fetchSessionResults(sessionId, 1);
      }
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRecalculate() {
    if (!selectedSessionId) return;
    if (totalWeight !== 100) {
      setFeedbackError("Total weight must be 100% before recalculation");
      return;
    }

    setRecalculating(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const payload = {
        weights: {
          automata: weights.automata / 100,
          automata_fix: weights.automata_fix / 100,
          computer_programming: weights.computer_programming / 100,
          computer_science: weights.computer_science / 100,
          quant: weights.quant / 100,
        },
        thresholds,
      };

      const res = await fetch(`/api/admin/amcat/${selectedSessionId}/weights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(getApiError(data, "Recalculate failed"));

      setFeedbackSuccess(
        typeof data.message === "string" && data.message.trim() ? data.message : "Recalculation completed",
      );
      await fetchSessions();
      await fetchSessionResults(selectedSessionId, resultsPage);
      await fetchLeaderboardPreview(selectedSessionId);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Recalculate failed");
    } finally {
      setRecalculating(false);
    }
  }

  async function handleOverride(resultId: string, finalCategory: "alpha" | "beta" | "gamma", overrideNote?: string) {
    if (!selectedSessionId) return;

    setFeedbackError(null);
    setOverrideSaving(true);
    try {
      const res = await fetch(`/api/admin/amcat/${selectedSessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId,
          finalCategory,
          overrideNote: overrideNote || "Updated from review table",
        }),
      });
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(getApiError(data, "Override update failed"));

      await fetchSessionResults(selectedSessionId, resultsPage);
      await fetchSessions();
      await fetchLeaderboardPreview(selectedSessionId);
      setFeedbackSuccess("Category override updated");
      setOverrideOpen(false);
      setPendingOverride(null);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Override update failed");
    } finally {
      setOverrideSaving(false);
    }
  }

  async function handlePublish() {
    if (!selectedSessionId) return;
    setPublishing(true);
    setFeedbackError(null);

    try {
      const res = await fetch(`/api/admin/amcat/${selectedSessionId}/publish`, { method: "POST" });
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(getApiError(data, "Publish failed"));

      setFeedbackSuccess(
        typeof data.message === "string" && data.message.trim() ? data.message : "Published",
      );
      setPublishOpen(false);
      await fetchSessions();
      await fetchSessionResults(selectedSessionId, resultsPage);
      await fetchLeaderboardPreview(selectedSessionId);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeleteAllSessions() {
    setDeletingAll(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await fetch("/api/admin/amcat", { method: "DELETE" });
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(getApiError(data, "Failed to delete sessions"));

      const deletedCount = typeof data.deletedSessions === "number" ? data.deletedSessions : 0;

      setSessions([]);
      setSelectedSessionId(null);
      setSelectedSession(null);
      setResults([]);
      setResultsTotal(0);
      setResultsPage(1);
      setLeaderboardPreview([]);
      setLeaderboardError(null);
      setSummary({ linked: 0, unmatched: 0, overridden: 0 });
      setDeleteAllOpen(false);
      setFeedbackSuccess(`Deleted ${deletedCount} AMCAT session(s)`);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Failed to delete sessions");
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">AMCAT Upload System</h1>
            <p className="text-sm leading-6 text-muted-foreground">Upload, review, recalculate and publish session results.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSessions} className="gap-2 self-start">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1 border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Upload Session File</CardTitle>
            <CardDescription>CSV/XLSX up to 10MB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a 
              href="/amcat-template.csv" 
              download 
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground rounded transition-colors"
            >
              <UploadCloud className="h-3 w-3" />
              Download CSV Template
            </a>

            <div
              className="border border-dashed rounded-md p-5 text-center bg-muted/20 hover:bg-muted/30 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0] ?? null;
                setUploadFile(file);
              }}
            >
              <UploadCloud className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Drag and drop AMCAT CSV/XLSX here</p>
              <p className="text-xs text-muted-foreground mt-1">or select file below</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amcat-file">File</Label>
              <Input id="amcat-file" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
              {uploadFile && <p className="text-xs text-muted-foreground">Selected: {uploadFile.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-name">Session Name</Label>
              <Input id="session-name" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="AMCAT Oct 2025 - Batch IV" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="test-date">Test Date</Label>
                <Input id="test-date" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-year">Batch Year</Label>
                <Input id="batch-year" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} placeholder="2026" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Input id="academic-year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26" />
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="w-full gap-2 bg-primary hover:bg-primary/90">
              {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload AMCAT File"}
            </Button>

            <div className="pt-4 border-t">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Past Sessions</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={sessionsLoading || sessions.length === 0 || deletingAll}
                  onClick={() => setDeleteAllOpen(true)}
                  className="gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete All
                </Button>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
                {sessionsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No AMCAT sessions yet.</p>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setSelectedSession(session);
                        setResultsPage(1);
                      }}
                      className={cn(
                        "w-full text-left border rounded-md p-3 transition-colors",
                        selectedSessionId === session.id ? "border-primary/30 bg-primary/5" : "hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{session.session_name}</p>
                        <Badge variant="outline" className={categoryClass(session.status === "published" ? "alpha" : session.status === "review" ? "beta" : "gamma")}>
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.total_students} students
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{selectedSession?.session_name ?? "Select a Session"}</CardTitle>
                  <CardDescription>
                    Status: {selectedSession?.status ?? "-"}
                  </CardDescription>
                </div>
                <Button
                  disabled={!selectedSessionId || selectedSession?.status !== "review"}
                  onClick={() => setPublishOpen(true)}
                  className="bg-success/10 hover:bg-primary-hover"
                >
                  Publish to Students
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard Preview</CardTitle>
              <CardDescription>Top 10 performers from the selected session</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedSessionId ? (
                <p className="text-sm text-muted-foreground">Select a session to view leaderboard preview.</p>
              ) : leaderboardLoading ? (
                <p className="text-sm text-muted-foreground">Loading leaderboard preview...</p>
              ) : leaderboardError ? (
                <p className="text-sm text-destructive">{leaderboardError}</p>
              ) : leaderboardPreview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ranked students found for this session.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardPreview.map((row) => (
                      <TableRow key={`preview-${row.id}`}>
                        <TableCell>#{row.rank_in_session}</TableCell>
                        <TableCell>{row.full_name}</TableCell>
                        <TableCell>{row.branch || "-"}</TableCell>
                        <TableCell>{row.computed_total}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={categoryClass(row.final_category)}>
                            {row.final_category}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configure Scoring Formula</CardTitle>
              <CardDescription>Total weight must be exactly 100%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                ["automata", "Automata (Coding)"],
                ["automata_fix", "Automata Fix"],
                ["computer_programming", "Computer Programming"],
                ["computer_science", "Computer Science"],
                ["quant", "Quantitative"],
              ] as Array<[keyof typeof weights, string]>).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-muted-foreground">{weights[key]}%</span>
                  </div>
                  <Input
                    type="range"
                    min={0}
                    max={100}
                    value={weights[key]}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <p className="text-sm font-semibold">Total weight: {totalWeight}%</p>
                <Button onClick={handleRecalculate} disabled={!selectedSessionId || recalculating || totalWeight !== 100}>
                  {recalculating ? "Recalculating..." : "Recalculate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Alpha minimum</Label>
                  <Input type="number" value={thresholds.alpha_min} onChange={(e) => setThresholds((prev) => ({ ...prev, alpha_min: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Beta minimum</Label>
                  <Input type="number" value={thresholds.beta_min} onChange={(e) => setThresholds((prev) => ({ ...prev, beta_min: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gamma minimum</Label>
                  <Input type="number" value={thresholds.gamma_min} onChange={(e) => setThresholds((prev) => ({ ...prev, gamma_min: Number(e.target.value) }))} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Distribution: {summary.linked} linked | {summary.unmatched} unmatched
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {feedbackError && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {feedbackError}
        </div>
      )}
      {feedbackSuccess && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-success/10 border border-success/20 px-3 py-2 text-sm text-success">
          <Check className="h-4 w-4 shrink-0" /> {feedbackSuccess}
        </div>
      )}
      {sessionsError && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {sessionsError}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Session Results</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Sort: Rank</SelectItem>
                  <SelectItem value="total">Sort: Total</SelectItem>
                  <SelectItem value="name">Sort: Name</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortDir} onValueChange={(value) => setSortDir(value as SortDir)}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setResultsPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="gamma">Gamma</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search SAP ID"
                className="w-[180px]"
                value={sapSearch}
                onChange={(e) => setSapSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedSessionId) {
                    setResultsPage(1);
                    fetchSessionResults(selectedSessionId, 1);
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedSessionId) return;
                  setResultsPage(1);
                  fetchSessionResults(selectedSessionId, 1);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SAP ID</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>CS</TableHead>
                <TableHead>CP</TableHead>
                <TableHead>Auto</TableHead>
                <TableHead>Fix</TableHead>
                <TableHead>Quant</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>CSV Cat</TableHead>
                <TableHead>Computed</TableHead>
                <TableHead>Final</TableHead>
                <TableHead>Linked</TableHead>
                <TableHead>Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultsLoading ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center text-muted-foreground py-6">Loading results...</TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center text-muted-foreground py-6">No rows found</TableCell>
                </TableRow>
              ) : (
                sortedResults.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      row.final_category === "alpha" && "bg-success/10",
                      row.final_category === "beta" && "bg-warning/10",
                      row.final_category === "gamma" && "bg-destructive/10",
                    )}
                  >
                    <TableCell>{row.rank_in_session}</TableCell>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.sap_id}</TableCell>
                    <TableCell>{row.branch || "-"}</TableCell>
                    <TableCell>{row.cs_score ?? "-"}</TableCell>
                    <TableCell>{row.cp_score ?? "-"}</TableCell>
                    <TableCell>{row.automata_score ?? "-"}</TableCell>
                    <TableCell>{row.automata_fix_score ?? "-"}</TableCell>
                    <TableCell>{row.quant_score ?? "-"}</TableCell>
                    <TableCell>{row.computed_total}</TableCell>
                    <TableCell>
                      {row.csv_category ? <Badge variant="outline" className={categoryClass(row.csv_category)}>{row.csv_category}</Badge> : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={categoryClass(row.computed_category)}>{row.computed_category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={categoryClass(row.final_category)}>{row.final_category}</Badge>
                    </TableCell>
                    <TableCell>{row.linked ? "✓" : "✗"}</TableCell>
                    <TableCell>
                      <Select
                        value={row.final_category}
                        onValueChange={(value) => {
                          const next = value as "alpha" | "beta" | "gamma";
                          if (next === row.final_category) return;
                          setPendingOverride({
                            resultId: row.id,
                            studentName: row.full_name,
                            from: row.final_category,
                            to: next,
                            note: "",
                          });
                          setOverrideOpen(true);
                        }}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alpha">alpha</SelectItem>
                          <SelectItem value="beta">beta</SelectItem>
                          <SelectItem value="gamma">gamma</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {resultsTotal > pageSize && (
            <div className="mt-4">
              <Pagination page={resultsPage} total={resultsTotal} pageSize={pageSize} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish AMCAT Results</DialogTitle>
            <DialogDescription>
              You are about to publish results for "{selectedSession?.session_name}".
              This will update categories for {summary.linked} students in SkillSync.
              {" "}{summary.unmatched} students have no SkillSync account and will not be updated.
              {" "}{summary.overridden} categories were manually overridden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-success/10 hover:bg-primary-hover" onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing..." : "Publish Results"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Category Override</DialogTitle>
            <DialogDescription>
              Change final category for {pendingOverride?.studentName} from {pendingOverride?.from} to {pendingOverride?.to}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="override-note">Override Note</Label>
            <Input
              id="override-note"
              placeholder="Reason for manual override"
              value={pendingOverride?.note ?? ""}
              onChange={(e) => {
                setPendingOverride((prev) => prev ? { ...prev, note: e.target.value } : prev);
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOverrideOpen(false); setPendingOverride(null); }}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!pendingOverride || overrideSaving}
              onClick={() => {
                if (!pendingOverride) return;
                handleOverride(pendingOverride.resultId, pendingOverride.to, pendingOverride.note);
              }}
            >
              {overrideSaving ? "Saving..." : "Apply Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All AMCAT Sessions</DialogTitle>
            <DialogDescription>
              This will permanently delete all AMCAT sessions and results for your college.
              Published student categories will remain unchanged until you republish a new session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteAllOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteAllSessions} disabled={deletingAll}>
              {deletingAll ? "Deleting..." : "Delete All Sessions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
