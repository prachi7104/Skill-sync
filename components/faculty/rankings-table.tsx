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
    driveId: string;
    viewerRole: "faculty" | "admin";
}

export default function RankingsTable({ rankings, driveId, viewerRole }: RankingsTableProps) {
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
                return a.rankPosition - b.rankPosition;
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

    return (
        <div className="space-y-4">
            {/* ── Filter Row ───────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="w-[180px] h-9">
                        <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2 border border-input rounded-md px-3 h-9 bg-background">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Min Score</span>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        className="w-12 bg-transparent text-sm font-medium focus:outline-none"
                    />
                </div>

                <Button
                    variant={shortlistedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShortlistedOnly(!shortlistedOnly)}
                    className="h-9 gap-2"
                >
                    <Star className={cn("h-4 w-4", shortlistedOnly && "fill-current")} />
                    Shortlisted Only
                </Button>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                    <SelectTrigger className="w-[160px] h-9">
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
            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-16 font-medium text-xs">Rank</TableHead>
                            <TableHead className="font-medium text-xs">Candidate Details</TableHead>
                            <TableHead className="font-medium text-xs">Branch / CGPA</TableHead>
                            <TableHead className="font-medium text-xs w-[180px]">Match Score</TableHead>
                            <TableHead className="font-medium text-xs">Skills Preview</TableHead>
                            <TableHead className="w-32 text-right font-medium text-xs">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                                    No candidates match your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r, index) => {
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
                                                "cursor-pointer transition-colors group",
                                                !isExpanded && index % 2 === 1 && "bg-secondary/40",
                                                isExpanded && "bg-accent/50"
                                            )}
                                            onClick={() => setExpandedId(isExpanded ? null : r.studentId)}
                                        >
                                            <TableCell className="py-3">
                                                <span className="font-mono text-xs text-muted-foreground">#{r.rankPosition}</span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-foreground">
                                                        {r.studentName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground mt-0.5">
                                                        {r.sapId ?? r.rollNo ?? "—"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-foreground truncate max-w-[150px]" title={r.branch ?? ""}>
                                                        {r.branch}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        CGPA: {r.cgpa?.toFixed(1) ?? "—"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            style={{ width: `${score}%` }}
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-700",
                                                                score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-primary" : "bg-muted-foreground"
                                                            )}
                                                        />
                                                    </div>
                                                    <span className="font-medium text-xs text-foreground min-w-[40px] text-right">
                                                        {score.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {r.matchedSkills.slice(0, 3).map(s => (
                                                        <Badge key={s} variant="secondary" className="px-1.5 py-0 text-[10px]">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                    {r.missingSkills.slice(0, 1).map(s => (
                                                        <Badge key={s} variant="outline" className="px-1.5 py-0 text-[10px]">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                    {r.matchedSkills.length + r.missingSkills.length > 4 && (
                                                        <span className="text-[10px] text-muted-foreground ml-1 flex items-center">
                                                            +{r.matchedSkills.length + r.missingSkills.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Button
                                                        variant={isShortlisted ? "default" : "outline"}
                                                        size="sm"
                                                        className="h-7 text-xs px-2.5"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleShortlist(r.studentId, currentShortlistState);
                                                        }}
                                                    >
                                                        <Star className={cn("w-3 h-3 mr-1.5", isShortlisted && "fill-current")} />
                                                        {isShortlisted ? "Shortlisted" : "Shortlist"}
                                                    </Button>
                                                    <div className="text-muted-foreground w-4 flex justify-center">
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* ── Expanded Content ────────────────────────────────────── */}
                                        {isExpanded && (
                                            <TableRow className="bg-accent/30 hover:bg-accent/30">
                                                <TableCell colSpan={6} className="p-0 border-b">
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-6">
                                                            <div className="space-y-2">
                                                                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                                                    Match Analysis
                                                                </h4>
                                                                <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-border pl-4">
                                                                    {r.shortExplanation}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                                                    Skills Alignment
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-1">Matched Skills</p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {r.matchedSkills.map(s => (
                                                                                <Badge key={s} variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                                                                                    {s}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    {r.missingSkills.length > 0 && (
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground mb-1">Missing / Weak Skills</p>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {r.missingSkills.map(s => (
                                                                                    <Badge key={s} variant="outline" className="px-2 py-0.5 text-xs font-medium border-dashed">
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
                                                            <div className="flex-1 space-y-2">
                                                                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                                                    Detailed Breakdown
                                                                </h4>
                                                                <div className="text-sm leading-relaxed text-muted-foreground max-h-[250px] overflow-y-auto pr-4">
                                                                    {r.detailedExplanation.split('\n').map((line, i) => (
                                                                        <p key={i} className={cn(line.trim() ? "mb-2 last:mb-0" : "h-2")}>
                                                                            {line}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 pt-4">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => passCandidate(r.studentId, currentShortlistState)}
                                                                    className={cn("h-8 text-xs", isPassed && "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:text-destructive")}
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                                                    {isPassed ? "Rejected" : "Reject"}
                                                                </Button>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    asChild
                                                                    className="h-8 text-xs text-foreground px-0"
                                                                >
                                                                    <a
                                                                        href={profileHref}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        <BookOpen className="h-3.5 w-3.5 mr-1.5" /> 
                                                                        {viewerRole === "admin" ? "Full Profile" : "Find Profile"}
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
