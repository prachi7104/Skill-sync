"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

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
  alpha: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-none",
  beta: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-none",
  gamma: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-none",
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

  const stats = useMemo(() => ({
    total: Number(session?.total_students ?? 0),
    alpha: Number(session?.alpha_count ?? 0),
    beta: Number(session?.beta_count ?? 0),
    gamma: Number(session?.gamma_count ?? 0),
  }), [session]);

  function downloadCsv() {
    const rows = [
      ["Rank", "Name", "Branch", "Score", "Category"],
      ...top50.map((row) => [row.rank, row.name, row.branch ?? "", row.score, row.category]),
    ];

    if (!isInTop50 && myRank) {
      rows.push(["", "", "", "", ""]);
      rows.push([myRank.rank, "You", "", myRank.score, myRank.category]);
    }

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
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
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AMCAT Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Top performers from published AMCAT sessions</p>
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
            <SelectTrigger className="w-full md:w-[220px]">
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
            <SelectTrigger className="w-full md:w-[160px]">
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

          <Button variant="outline" size="sm" className="gap-2 w-full md:w-auto" onClick={downloadCsv} disabled={!hasData || loading || top50.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <Separator />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : error ? (
        <div className="py-12 border border-destructive/20 bg-destructive/10 rounded-md">
          <EmptyState 
            message="Error loading leaderboard" 
            description={error}
            action={
              <Button variant="outline" className="mt-4" onClick={() => void fetchLeaderboard(selectedSessionId || undefined, selectedBranch)}>
                Retry
              </Button>
            }
          />
        </div>
      ) : !hasData ? (
        <div className="py-20 border border-border bg-card rounded-md">
          <EmptyState 
            message="No data available" 
            description="No published AMCAT data is available yet for this session or branch."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat title="Total Participants" value={stats.total} />
            <Stat title="Alpha" value={stats.alpha} />
            <Stat title="Beta" value={stats.beta} />
            <Stat title="Gamma" value={stats.gamma} />
          </div>

          <div className="rounded-md border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50 text-sm">
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top50.map((row) => (
                  <TableRow key={`${row.rank}-${row.name}`}>
                    <TableCell className="font-semibold text-foreground">#{row.rank}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.branch ?? "-"}</TableCell>
                    <TableCell className="font-medium">{row.score}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(badgeStyles[row.category], "text-[11px] uppercase tracking-wider")}>
                        {row.category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}

                {!isInTop50 && myRank && (
                  <>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-xs font-semibold tracking-widest">•••</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-bold text-foreground">#{myRank.rank}</TableCell>
                      <TableCell className="font-bold text-foreground">You</TableCell>
                      <TableCell className="text-muted-foreground">-</TableCell>
                      <TableCell className="font-bold">{myRank.score}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(badgeStyles[myRank.category], "text-[11px] uppercase tracking-wider font-bold")}>
                          {myRank.category}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 flex flex-col justify-between">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">{title}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
