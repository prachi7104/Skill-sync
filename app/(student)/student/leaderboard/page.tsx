"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/empty-state";
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

type LeaderboardSession = {
  id: string;
  session_name: string;
  test_date: string | null;
  batch_year: number | null;
  total_students?: number;
  alpha_count?: number;
  beta_count?: number;
  gamma_count?: number;
};

type LeaderboardRow = {
  rank: number;
  name: string;
  branch: string | null;
  score: number;
  category: "alpha" | "beta" | "gamma";
};

type LeaderboardApiResponse = {
  hasData?: boolean;
  error?: string;
  message?: string;
  session?: LeaderboardSession;
  sessions?: LeaderboardSession[];
  branches?: string[];
  appliedBranch?: string;
  top50?: LeaderboardRow[];
  myRank?: MyRank;
  isInTop50?: boolean;
};

type MyRank = {
  rank: number;
  score: number;
  category: "alpha" | "beta" | "gamma";
} | null;

const badgeStyles: Record<string, string> = {
  alpha: "bg-success/10 text-success border-success/20",
  beta: "bg-warning/10 text-warning border-warning/20",
  gamma: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function StudentLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [session, setSession] = useState<LeaderboardSession | null>(null);
  const [sessions, setSessions] = useState<LeaderboardSession[]>([]);
  const [top50, setTop50] = useState<LeaderboardRow[]>([]);
  const [myRank, setMyRank] = useState<MyRank>(null);
  const [isInTop50, setIsInTop50] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  async function safeReadJson(res: Response): Promise<LeaderboardApiResponse> {
    const raw = await res.text();
    if (!raw.trim()) return {};

    try {
      return JSON.parse(raw) as LeaderboardApiResponse;
    } catch {
      return { error: raw.trim() };
    }
  }

  function getApiError(data: LeaderboardApiResponse, fallback: string): string {
    if (typeof data.error === "string" && data.error.trim()) return data.error;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    return fallback;
  }

  async function fetchLeaderboard(sessionId?: string, branch: string = "all") {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sessionId) params.set("sessionId", sessionId);
      if (branch !== "all") params.set("branch", branch);

      const res = await fetch(`/api/student/amcat/leaderboard?${params.toString()}`);
      const data = await safeReadJson(res);

      if (!res.ok) throw new Error(getApiError(data, "Failed to load leaderboard"));
      if (!data.hasData) {
        setHasData(false);
        setTop50([]);
        setMyRank(null);
        setBranches([]);
        return;
      }

      const sessionData = data.session ?? null;
      if (!sessionData) {
        setHasData(false);
        setTop50([]);
        setMyRank(null);
        setBranches([]);
        throw new Error("Invalid leaderboard response");
      }

      setHasData(true);
      setSession(sessionData);
      setSessions((data.sessions ?? []) as LeaderboardSession[]);
      setTop50((data.top50 ?? []) as LeaderboardRow[]);
      setMyRank((data.myRank ?? null) as MyRank);
      setIsInTop50(Boolean(data.isInTop50));
      setBranches((data.branches ?? []).filter((item) => typeof item === "string" && item.trim().length > 0));
      setSelectedSessionId(String(sessionData.id));
      setSelectedBranch(typeof data.appliedBranch === "string" && data.appliedBranch.trim() ? data.appliedBranch : "all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard(undefined, "all");
  }, []);

  const stats = useMemo(
    () => ({
      total: Number(session?.total_students ?? 0),
      alpha: Number(session?.alpha_count ?? 0),
      beta: Number(session?.beta_count ?? 0),
      gamma: Number(session?.gamma_count ?? 0),
    }),
    [session],
  );

  function downloadCsv() {
    const rows = [
      ["Rank", "Name", "Branch", "Score", "Category"],
      ...top50.map((row) => [row.rank, row.name, row.branch ?? "", row.score, row.category]),
    ];

    if (!isInTop50 && myRank) {
      rows.push(["", "", "", "", ""]);
      rows.push([myRank.rank, "You", "", myRank.score, myRank.category]);
    }

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `amcat-leaderboard-${selectedSessionId || "latest"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6 text-foreground animate-in fade-in duration-500 sm:px-6 md:px-10 md:pt-10">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">AMCAT Leaderboard</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">Published session rankings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Top performers from published AMCAT sessions, with branch filters and CSV export.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedSessionId}
              onValueChange={(value) => {
                setSelectedSessionId(value);
                setSelectedBranch("all");
                fetchLeaderboard(value, "all");
              }}
              disabled={!hasData || loading}
            >
              <SelectTrigger className="w-[260px] border-border bg-background text-foreground">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((sessionRow) => (
                  <SelectItem key={sessionRow.id} value={sessionRow.id}>
                    {sessionRow.session_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedBranch}
              onValueChange={(value) => {
                setSelectedBranch(value);
                fetchLeaderboard(selectedSessionId || undefined, value);
              }}
              disabled={!hasData || loading || branches.length === 0}
            >
              <SelectTrigger className="w-[180px] border-border bg-background text-foreground">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="gap-2 border-border bg-background text-foreground hover:bg-muted"
              onClick={downloadCsv}
              disabled={!hasData || loading || top50.length === 0}
            >
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div
          className="flex min-h-[240px] items-center justify-center"
          role="status"
          aria-label="Loading leaderboard"
        >
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading...</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : !hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No AMCAT scores yet"
          description="Your leaderboard rank will appear here after you complete an AMCAT session. Scores are published by your placement coordinator."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat title="Total Participants" value={stats.total} />
            <Stat title="Alpha" value={stats.alpha} />
            <Stat title="Beta" value={stats.beta} />
            <Stat title="Gamma" value={stats.gamma} />
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top50.map((row) => (
                  <TableRow key={`${row.rank}-${row.name}`}>
                    <TableCell className="font-semibold">#{row.rank}</TableCell>
                    <TableCell className="max-w-[160px] font-semibold">
                      <span className="block truncate" title={row.name}>{row.name}</span>
                    </TableCell>
                    <TableCell>{row.branch ?? "-"}</TableCell>
                    <TableCell>{row.score}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badgeStyles[row.category]}>
                        {row.category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}

                {!isInTop50 && myRank && (
                  <>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">...</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-semibold">#{myRank.rank}</TableCell>
                      <TableCell className="font-semibold">You</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{myRank.score}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(badgeStyles[myRank.category], "font-semibold")}>
                          {myRank.category}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}
