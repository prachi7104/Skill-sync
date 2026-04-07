"use client";

import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Search,
    Star,
    XCircle,
    ChevronDown,
    ChevronUp,
    Filter,
    ArrowUpDown,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingData {
    rankPosition: number;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    shortExplanation: string;
    detailedExplanation: string;
    shortlisted: boolean | null;
    studentId: string;
    studentName: string;
    sapId: string | null;
    rollNo: string | null;
    branch: string | null;
    cgpa: number | null;
    batchYear: number | null;
}

interface RankingsTableProps {
    rankings: RankingData[];
    distribution: Array<{ label: string; count: number }>;
    driveId: string;
    viewerRole: "faculty" | "admin";
}

export default function RankingsTable({ rankings, distribution, driveId, viewerRole }: RankingsTableProps) {
    // ── State ──────────────────────────────────────────────────────────────────
    const [nameSearch, setNameSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState("all");
    const [minScore, setMinScore] = useState(0);
    const [shortlistedOnly, setShortlistedOnly] = useState(false);
    const [sortOrder, setSortOrder] = useState<"score-desc" | "score-asc" | "rank-asc">("rank-asc");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [localShortlisted, setLocalShortlisted] = useState<Record<string, boolean | null>>({});

    // ── Unique Branches for Filter ─────────────────────────────────────────────
    const branches = useMemo(() => {
        const b = new Set<string>();
        rankings.forEach(r => { if (r.branch) b.add(r.branch); });
        return Array.from(b).sort();
    }, [rankings]);

    // ── Filter & Sort Logic ────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return rankings
            .filter(r => !nameSearch || r.studentName.toLowerCase().includes(nameSearch.toLowerCase()))
            .filter(r => branchFilter === "all" || r.branch === branchFilter)
            .filter(r => r.matchScore >= minScore)
            .filter(r => !shortlistedOnly || (localShortlisted[r.studentId] ?? r.shortlisted) === true)
            .sort((a, b) => {
                if (sortOrder === "score-desc") return b.matchScore - a.matchScore;
                if (sortOrder === "score-asc") return a.matchScore - b.matchScore;
                const rankA = a.rankPosition === 0 ? Number.MAX_SAFE_INTEGER : a.rankPosition;
                const rankB = b.rankPosition === 0 ? Number.MAX_SAFE_INTEGER : b.rankPosition;
                return rankA - rankB;
            });
    }, [rankings, nameSearch, branchFilter, minScore, shortlistedOnly, sortOrder, localShortlisted]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    async function toggleShortlist(studentId: string, current: boolean | null) {
        const next = current === true ? null : true;
        setLocalShortlisted(prev => ({ ...prev, [studentId]: next }));
        try {
            const res = await fetch(`/api/drives/${driveId}/rankings/${studentId}/shortlist`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shortlisted: next }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setLocalShortlisted(prev => ({ ...prev, [studentId]: current }));
        }
    }

    async function passCandidate(studentId: string, current: boolean | null) {
        const next = current === false ? null : false;
        setLocalShortlisted(prev => ({ ...prev, [studentId]: next }));
        try {
            const res = await fetch(`/api/drives/${driveId}/rankings/${studentId}/shortlist`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shortlisted: next }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setLocalShortlisted(prev => ({ ...prev, [studentId]: current }));
        }
    }

    const maxCount = Math.max(...distribution.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            {/* ── Histogram ────────────────────────────────────────────────────────── */}
            {maxCount > 0 && (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-6">
                        <div className="flex items-end justify-around h-24 gap-2 px-4">
                            {distribution.map((d, i) => {
                                const height = (d.count / maxCount) * 80;
                                let colorClass = "bg-rose-500";
                                if (i >= 2) colorClass = "bg-amber-500";
                                if (i >= 3) colorClass = "bg-emerald-500";

                                return (
                                    <div key={d.label} className="flex-1 flex flex-col items-center group">
                                        <span className="text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                            {d.count}
                                        </span>
                                        <div
                                            className={cn("w-full max-w-[40px] rounded-t sm:max-w-[60px] transition-all duration-500", colorClass)}
                                            style={{ height: `${height}px` }}
                                        />
                                        <span className="text-[10px] text-muted-foreground mt-2 font-medium">
                                            {d.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest font-semibold">
                            Score Distribution
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Filter Row ───────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-lg border shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        className="pl-9 bg-muted/50 border-none h-9 text-sm"
                    />
                </div>

                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="w-[180px] h-9 bg-muted/50 border-none text-sm">
                        <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 h-9 border-none">
                    <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Min Score</span>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        className="w-12 bg-transparent text-sm font-mono font-bold focus:outline-none"
                    />
                </div>

                <Button
                    variant={shortlistedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShortlistedOnly(!shortlistedOnly)}
                    className={cn(
                        "h-9 gap-2 font-semibold transition-all",
                        shortlistedOnly ? "bg-indigo-600 hover:bg-indigo-700" : "text-muted-foreground"
                    )}
                >
                    <Star className={cn("h-4 w-4", shortlistedOnly && "fill-current")} />
                    Shortlisted Only
                </Button>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                    <SelectTrigger className="w-[160px] h-9 bg-muted/50 border-none text-sm">
                        <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="rank-asc">Rank: 1 → N</SelectItem>
                        <SelectItem value="score-desc">Score: High → Low</SelectItem>
                        <SelectItem value="score-asc">Score: Low → High</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Table ────────────────────────────────────────────────────────────── */}
            <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="w-16 text-center font-bold text-xs uppercase tracking-wider">Rank</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Candidate Details</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Branch / CGPA</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider w-[180px]">Match Score</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Skills Preview</TableHead>
                            <TableHead className="w-20 text-right font-bold text-xs uppercase tracking-wider">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No candidates match your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => {
                                const isExpanded = expandedId === r.studentId;
                                const currentShortlistState = localShortlisted[r.studentId] !== undefined
                                    ? localShortlisted[r.studentId]
                                    : r.shortlisted;
                                const isShortlisted = currentShortlistState === true;
                                const isPassed = currentShortlistState === false;
                                const profileHref = viewerRole === "admin"
                                    ? `/admin/students/${r.studentId}`
                                    : `/faculty/students?q=${encodeURIComponent(r.sapId ?? r.studentName)}`;

                                const score = r.matchScore;

                                return (
                                    <React.Fragment key={r.studentId}>
                                        <TableRow
                                            className={cn(
                                                "cursor-pointer transition-colors group border-b last:border-0",
                                                isExpanded ? "bg-indigo-50/30" : "hover:bg-muted/50",
                                                isShortlisted && "bg-emerald-50/20"
                                            )}
                                            onClick={() => setExpandedId(isExpanded ? null : r.studentId)}
                                        >
                                            <TableCell className="text-center">
                                                {r.rankPosition === 0 ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ineligible</span>
                                                ) : r.rankPosition === 1 ? (
                                                    <span className="text-2xl" title="Rank 1">🥇</span>
                                                ) : r.rankPosition === 2 ? (
                                                    <span className="text-2xl" title="Rank 2">🥈</span>
                                                ) : r.rankPosition === 3 ? (
                                                    <span className="text-2xl" title="Rank 3">🥉</span>
                                                ) : (
                                                    <span className="font-mono font-bold text-muted-foreground">{r.rankPosition}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
                                                        {r.studentName}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">
                                                        Roll: {r.rollNo ?? "—"} • SAP: {r.sapId ?? "—"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted w-fit">
                                                        {r.branch}
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold text-muted-foreground flex items-center gap-1.5 px-2">
                                                        CGPA: <span className="text-indigo-600">{r.cgpa?.toFixed(1) ?? "—"}</span>
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden shadow-inner">
                                                        <div
                                                            style={{ width: `${score}%` }}
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-700",
                                                                score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"
                                                            )}
                                                        />
                                                    </div>
                                                    <span className="font-mono text-sm font-black text-slate-700 min-w-[50px] text-right">
                                                        {score.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {r.matchedSkills.slice(0, 3).map(s => (
                                                        <Badge key={s} variant="secondary" className="px-1.5 py-0 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                    {r.missingSkills.slice(0, 1).map(s => (
                                                        <Badge key={s} variant="outline" className="px-1.5 py-0 text-[10px] text-rose-600 border-rose-200 bg-rose-50/30">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                    {r.matchedSkills.length + r.missingSkills.length > 4 && (
                                                        <span className="text-[10px] text-muted-foreground font-medium ml-0.5">
                                                            +{r.matchedSkills.length + r.missingSkills.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleShortlist(r.studentId, currentShortlistState);
                                                        }}
                                                        className={cn(
                                                            "p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95",
                                                            isShortlisted
                                                                ? "text-amber-500 bg-amber-50 border border-amber-200 shadow-sm"
                                                                : "text-gray-300 hover:text-amber-400"
                                                        )}
                                                    >
                                                        <Star className={cn("h-5 w-5", isShortlisted && "fill-current")} />
                                                    </button>
                                                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* ── Expanded Content ────────────────────────────────────── */}
                                        {isExpanded && (
                                            <TableRow className="bg-indigo-50/30 border-b hover:bg-indigo-50/30">
                                                <TableCell colSpan={6} className="p-0">
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="space-y-6">
                                                            <div className="space-y-4">
                                                                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-2">
                                                                    <div className="h-1 w-4 bg-indigo-700 rounded-full" />
                                                                    Match Analysis
                                                                </h4>
                                                                <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 italic text-sm text-slate-700 leading-relaxed">
                                                                    &quot;{r.shortExplanation}&quot;
                                                                </blockquote>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-xs font-black uppercase text-emerald-700 tracking-wider flex items-center gap-2">
                                                                    <div className="h-1 w-4 bg-emerald-700 rounded-full" />
                                                                    Skills Alignment
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Matched Skills</p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {r.matchedSkills.map(s => (
                                                                                <Badge key={s} variant="secondary" className="bg-emerald-100 text-emerald-800 border-none px-2 py-0.5 text-xs font-semibold">
                                                                                    {s}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    {r.missingSkills.length > 0 && (
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Missing / Weak Skills</p>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {r.missingSkills.map(s => (
                                                                                    <Badge key={s} variant="outline" className="border-rose-200 text-rose-700 bg-rose-50 px-2 py-0.5 text-xs font-semibold">
                                                                                        {s}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6 flex flex-col">
                                                            <div className="flex-1 space-y-4">
                                                                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                                                                    <div className="h-1 w-4 bg-slate-700 rounded-full" />
                                                                    Score Breakdown & Analysis
                                                                </h4>
                                                                <div className="p-4 bg-white rounded-lg border border-indigo-100 text-sm leading-relaxed text-slate-600 shadow-sm max-h-[250px] overflow-y-auto">
                                                                    {r.detailedExplanation.split('\n').map((line, i) => (
                                                                        <p key={i} className={cn(line.trim() ? "mb-3 last:mb-0" : "h-2")}>
                                                                            {line}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-4 border-t">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => toggleShortlist(r.studentId, currentShortlistState)}
                                                                        className={cn(
                                                                            "h-9 px-4 font-bold shadow-sm transition-all",
                                                                            isShortlisted
                                                                                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                                                                                : "bg-indigo-600 hover:bg-indigo-700"
                                                                        )}
                                                                        variant={isShortlisted ? "outline" : "default"}
                                                                    >
                                                                        <Star className={cn("h-4 w-4 mr-2", isShortlisted && "fill-current")} />
                                                                        {isShortlisted ? "Shortlisted" : "Shortlist Candidate"}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => passCandidate(r.studentId, currentShortlistState)}
                                                                        className={cn(
                                                                            "h-9 px-4 font-semibold transition-all",
                                                                            isPassed ? "text-rose-600 bg-rose-50 hover:bg-rose-100" : "text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                                                                        )}
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        {isPassed ? "Passed ✓" : "Pass/Reject"}
                                                                    </Button>
                                                                </div>

                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    asChild
                                                                    className="text-indigo-600 gap-1 font-bold"
                                                                >
                                                                    <a
                                                                        href={profileHref}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        <BookOpen className="h-4 w-4" /> {viewerRole === "admin" ? "Full Profile" : "Find in Students"}
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
