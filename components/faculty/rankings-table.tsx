"use client";

import React, { useMemo, useState } from "react";
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
import { ArrowUpDown, BookOpen, ChevronDown, ChevronUp, Filter, Search, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { patchJSON } from "@/lib/api";
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
}

interface RankingsTableProps {
    rankings: RankingData[];
    distribution: Array<{ label: string; count: number }>;
    driveId: string;
    viewerRole: "faculty" | "admin";
}

export default function RankingsTable({ rankings, distribution, driveId, viewerRole }: RankingsTableProps) {
    const [nameSearch, setNameSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState("all");
    const [minScore, setMinScore] = useState(0);
    const [shortlistedOnly, setShortlistedOnly] = useState(false);
    const [sortOrder, setSortOrder] = useState<"score-desc" | "score-asc" | "rank-asc">("rank-asc");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [localShortlisted, setLocalShortlisted] = useState<Record<string, boolean | null>>({});

    const branches = useMemo(() => {
        const set = new Set<string>();
        rankings.forEach((ranking) => {
            if (ranking.branch) set.add(ranking.branch);
        });
        return Array.from(set).sort();
    }, [rankings]);

    const filtered = useMemo(() => {
        return rankings
            .filter((ranking) => !nameSearch || ranking.studentName.toLowerCase().includes(nameSearch.toLowerCase()))
            .filter((ranking) => branchFilter === "all" || ranking.branch === branchFilter)
            .filter((ranking) => ranking.matchScore >= minScore)
            .filter((ranking) => !shortlistedOnly || (localShortlisted[ranking.studentId] ?? ranking.shortlisted) === true)
            .sort((a, b) => {
                if (sortOrder === "score-desc") return b.matchScore - a.matchScore;
                if (sortOrder === "score-asc") return a.matchScore - b.matchScore;
                const rankA = a.rankPosition === 0 ? Number.MAX_SAFE_INTEGER : a.rankPosition;
                const rankB = b.rankPosition === 0 ? Number.MAX_SAFE_INTEGER : b.rankPosition;
                return rankA - rankB;
            });
    }, [rankings, nameSearch, branchFilter, minScore, shortlistedOnly, sortOrder, localShortlisted]);

    function renderSkillBadges(skills: string[], variant: "matched" | "missing") {
        const baseClassName = variant === "matched"
            ? "border-success/20 bg-success/10 text-success"
            : "border-destructive/20 bg-destructive/10 text-destructive";

        return (
            <>
                {skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className={cn("text-xs", baseClassName)}>
                        {skill}
                    </Badge>
                ))}
                {skills.length > 3 ? <Badge variant="outline" className="text-xs">+{skills.length - 3}</Badge> : null}
            </>
        );
    }

    async function toggleShortlist(studentId: string, current: boolean | null) {
        const next = current === true ? null : true;
        setLocalShortlisted((previous) => ({ ...previous, [studentId]: next }));
        const { error } = await patchJSON(
          `/api/drives/${driveId}/rankings/${studentId}/shortlist`,
          { shortlisted: next }
        );
        if (error) {
            setLocalShortlisted((previous) => ({ ...previous, [studentId]: current }));
            toast.error(error);
        }
    }

    async function passCandidate(studentId: string, current: boolean | null) {
        const next = current === false ? null : false;
        setLocalShortlisted((previous) => ({ ...previous, [studentId]: next }));
        const { error } = await patchJSON(
          `/api/drives/${driveId}/rankings/${studentId}/shortlist`,
          { shortlisted: next }
        );
        if (error) {
            setLocalShortlisted((previous) => ({ ...previous, [studentId]: current }));
            toast.error(error);
        }
    }

    const maxCount = Math.max(...distribution.map((item) => item.count), 1);

    return (
        <div className="space-y-6">
            {maxCount > 0 ? (
                <Card className="border-dashed border-border bg-card shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex h-24 items-end justify-around gap-2 px-4">
                            {distribution.map((item, index) => {
                                const height = (item.count / maxCount) * 80;
                                let colorClass = "bg-destructive/10";
                                if (index >= 2) colorClass = "bg-warning/10";
                                if (index >= 3) colorClass = "bg-success/10";

                                return (
                                    <div key={item.label} className="group flex flex-1 flex-col items-center">
                                        <span className="mb-1 text-[10px] font-mono font-bold opacity-0 transition-opacity group-hover:opacity-100">
                                            {item.count}
                                        </span>
                                        <div
                                            className={cn("w-full max-w-[40px] rounded-t transition-all duration-500 sm:max-w-[60px]", colorClass)}
                                            style={{ height: `${height}px` }}
                                        />
                                        <span className="mt-2 text-[10px] font-medium text-muted-foreground">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Score Distribution
                        </p>
                    </CardContent>
                </Card>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={nameSearch}
                        onChange={(event) => setNameSearch(event.target.value)}
                        className="h-9 border-border bg-background pl-9 text-sm"
                    />
                </div>

                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-9 w-[180px] border-border bg-background text-sm">
                        <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map((branch) => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex h-9 items-center gap-2 rounded-md bg-muted/50 px-3">
                    <span className="whitespace-nowrap text-xs font-semibold text-muted-foreground">Min Score</span>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={minScore}
                        onChange={(event) => setMinScore(Number(event.target.value))}
                        className="w-12 bg-transparent text-sm font-mono font-bold text-foreground focus:outline-none"
                    />
                </div>

                <Button
                    variant={shortlistedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShortlistedOnly(!shortlistedOnly)}
                    className={cn(
                        "h-9 gap-2 font-semibold transition-all",
                        shortlistedOnly ? "bg-primary hover:bg-primary/90" : "text-muted-foreground",
                    )}
                >
                    <Star className={cn("h-4 w-4", shortlistedOnly && "fill-current")} />
                    Shortlisted Only
                </Button>

                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
                    <SelectTrigger className="h-9 w-[160px] border-none bg-muted/50 text-sm">
                        <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="rank-asc">Rank: 1 → N</SelectItem>
                        <SelectItem value="score-desc">Score: High → Low</SelectItem>
                        <SelectItem value="score-asc">Score: Low → High</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="overflow-hidden border border-border bg-card shadow-sm">
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            No candidates match your filters.
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 px-4 pb-4 md:hidden">
                                {filtered.map((ranking, index) => {
                                    const mobileId = `mobile-${index}`;
                                    const isExpanded = expandedId === mobileId;
                                    const currentShortlistState = localShortlisted[ranking.studentId] !== undefined
                                        ? localShortlisted[ranking.studentId]
                                        : ranking.shortlisted;

                                    return (
                                        <article key={`${ranking.studentId}-${index}`} className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", currentShortlistState === true && "bg-success/10") }>
                                            <button
                                                type="button"
                                                onClick={() => setExpandedId(isExpanded ? null : mobileId)}
                                                className="flex w-full items-start justify-between gap-4 text-left"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary text-xs">#{ranking.rankPosition}</Badge>
                                                        <span className="text-sm font-semibold text-muted-foreground">{ranking.matchScore.toFixed(1)}% match</span>
                                                    </div>
                                                    <p className="text-base font-bold text-foreground">{ranking.studentName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {ranking.sapId && <>SAP: {ranking.sapId}</>}
                                                        {ranking.sapId && ranking.rollNo && <> · </>}
                                                        {ranking.rollNo && <>Roll: {ranking.rollNo}</>}
                                                        {!ranking.sapId && !ranking.rollNo && <>—</>}
                                                    </p>
                                                </div>
                                                <div className="text-right text-xs text-muted-foreground">
                                                    <p>{ranking.branch || "—"}</p>
                                                    <p>{ranking.cgpa !== null ? `CGPA ${ranking.cgpa.toFixed(1)}` : "CGPA —"}</p>
                                                </div>
                                            </button>

                                            <div className="mt-4 space-y-3">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Matched Skills</p>
                                                    <div className="flex flex-wrap gap-1.5">{renderSkillBadges(ranking.matchedSkills, "matched")}</div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Missing Skills</p>
                                                    <div className="flex flex-wrap gap-1.5">{renderSkillBadges(ranking.missingSkills, "missing")}</div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{ranking.shortExplanation}</p>

                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setExpandedId(isExpanded ? null : mobileId)}
                                                        variant="outline"
                                                        className="h-9 border-border bg-background text-foreground hover:bg-muted"
                                                    >
                                                        {isExpanded ? "Hide details" : "View details"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => toggleShortlist(ranking.studentId, currentShortlistState)}
                                                        className="h-9 bg-primary px-4 font-bold hover:bg-primary/90"
                                                    >
                                                        Shortlist
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => passCandidate(ranking.studentId, currentShortlistState)}
                                                        className="h-9 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        Pass
                                                    </Button>
                                                </div>

                                                {isExpanded ? (
                                                    <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                                                        {ranking.detailedExplanation.split("\n").map((line, lineIndex) => (
                                                            <p key={lineIndex} className={cn(line.trim() ? "last:mb-0" : "h-2")}>{line}</p>
                                                        ))}
                                                        <Button asChild variant="link" className="h-auto justify-start px-0 text-primary">
                                                            <a href={viewerRole === "admin" ? `/admin/students/${ranking.studentId}` : `/faculty/students?q=${encodeURIComponent(ranking.sapId ?? ranking.studentName)}`} target="_blank" rel="noreferrer">
                                                                <BookOpen className="h-4 w-4" /> {viewerRole === "admin" ? "Full Profile" : "Find in Students"}
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="hidden md:block">
                                <div className="max-h-[70vh] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16 text-center">Rank</TableHead>
                                                <TableHead>Candidate Details</TableHead>
                                                <TableHead>Branch / CGPA</TableHead>
                                                <TableHead className="w-[180px] text-center">Match Score</TableHead>
                                                <TableHead>Skills Preview</TableHead>
                                                <TableHead className="w-20 text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filtered.map((ranking) => {
                                                const isExpanded = expandedId === ranking.studentId;
                                                const currentShortlistState = localShortlisted[ranking.studentId] !== undefined
                                                    ? localShortlisted[ranking.studentId]
                                                    : ranking.shortlisted;
                                                const isShortlisted = currentShortlistState === true;
                                                const isPassed = currentShortlistState === false;
                                                const profileHref = viewerRole === "admin"
                                                    ? `/admin/students/${ranking.studentId}`
                                                    : `/faculty/students?q=${encodeURIComponent(ranking.sapId ?? ranking.studentName)}`;

                                                return (
                                                    <React.Fragment key={ranking.studentId}>
                                                        <TableRow
                                                            className={cn(
                                                                "cursor-pointer border-b last:border-0 transition-colors group",
                                                                isExpanded ? "bg-primary/5" : "hover:bg-muted/50",
                                                                isShortlisted && "bg-success/10",
                                                            )}
                                                            onClick={() => setExpandedId(isExpanded ? null : ranking.studentId)}
                                                        >
                                                            <TableCell className="text-center">
                                                                {ranking.rankPosition === 0 ? (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ineligible</span>
                                                                ) : ranking.rankPosition === 1 ? (
                                                                    <span className="text-2xl" title="Rank 1">🥇</span>
                                                                ) : ranking.rankPosition === 2 ? (
                                                                    <span className="text-2xl" title="Rank 2">🥈</span>
                                                                ) : ranking.rankPosition === 3 ? (
                                                                    <span className="text-2xl" title="Rank 3">🥉</span>
                                                                ) : (
                                                                    <span className="font-mono font-bold text-muted-foreground">{ranking.rankPosition}</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold tracking-tight transition-colors group-hover:text-primary">
                                                                        {ranking.studentName}
                                                                    </span>
                                                                    <span className="mt-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                                                                        Roll: {ranking.rollNo ?? "—"} • SAP: {ranking.sapId ?? "—"}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                                                                        {ranking.branch}
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5 px-2 font-mono text-[11px] font-bold text-muted-foreground">
                                                                        CGPA: <span className="text-primary">{ranking.cgpa?.toFixed(1) ?? "—"}</span>
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted shadow-inner">
                                                                        <div
                                                                            style={{ width: `${ranking.matchScore}%` }}
                                                                            className={cn(
                                                                                "h-full rounded-full transition-all duration-700",
                                                                                ranking.matchScore >= 75 ? "bg-success/10" : ranking.matchScore >= 50 ? "bg-warning/10" : "bg-destructive/10",
                                                                            )}
                                                                        />
                                                                    </div>
                                                                    <span className="min-w-[50px] text-right font-mono text-sm font-black text-muted-foreground">
                                                                        {ranking.matchScore.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {renderSkillBadges(ranking.matchedSkills, "matched")}
                                                                    {renderSkillBadges(ranking.missingSkills, "missing")}
                                                                    {ranking.matchedSkills.length + ranking.missingSkills.length > 4 ? (
                                                                        <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">
                                                                            +{ranking.matchedSkills.length + ranking.missingSkills.length - 4} more
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            toggleShortlist(ranking.studentId, currentShortlistState);
                                                                        }}
                                                                        className={cn(
                                                                            "rounded-full p-2 transition-all duration-200 hover:scale-110 active:scale-95",
                                                                            isShortlisted
                                                                                ? "border border-warning/20 bg-warning/10 text-warning shadow-sm"
                                                                                : "text-muted-foreground hover:text-warning",
                                                                        )}
                                                                    >
                                                                        <Star className={cn("h-5 w-5", isShortlisted && "fill-current")} />
                                                                    </button>
                                                                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>

                                                        {isExpanded ? (
                                                            <TableRow className="border-b bg-primary/5 hover:bg-primary/5">
                                                                <TableCell colSpan={6} className="p-0">
                                                                    <div className="grid grid-cols-1 gap-8 p-6 animate-in slide-in-from-top-2 duration-300 md:grid-cols-2">
                                                                        <div className="space-y-6">
                                                                            <div className="space-y-4">
                                                                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                                                                                    <div className="h-1 w-4 rounded-full bg-primary" />
                                                                                    Match Analysis
                                                                                </h4>
                                                                                <blockquote className="border-l-4 border-primary/30 py-1 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                                                                                    &quot;{ranking.shortExplanation}&quot;
                                                                                </blockquote>
                                                                            </div>

                                                                            <div className="space-y-4">
                                                                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-success">
                                                                                    <div className="h-1 w-4 rounded-full bg-success/10" />
                                                                                    Skills Alignment
                                                                                </h4>
                                                                                <div className="space-y-3">
                                                                                    <div>
                                                                                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Matched Skills</p>
                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {ranking.matchedSkills.map((skill) => (
                                                                                                <Badge key={skill} variant="secondary" className="border-none bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                                                                                                    {skill}
                                                                                                </Badge>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    {ranking.missingSkills.length > 0 ? (
                                                                                        <div>
                                                                                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Missing / Weak Skills</p>
                                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                                {ranking.missingSkills.map((skill) => (
                                                                                                    <Badge key={skill} variant="outline" className="border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                                                                                                        {skill}
                                                                                                    </Badge>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : null}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-col space-y-6">
                                                                            <div className="flex-1 space-y-4">
                                                                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                                                                                    <div className="h-1 w-4 rounded-full bg-card" />
                                                                                    Score Breakdown & Analysis
                                                                                </h4>
                                                                                <div className="max-h-[250px] overflow-y-auto rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground shadow-sm">
                                                                                    {ranking.detailedExplanation.split("\n").map((line, lineIndex) => (
                                                                                        <p key={lineIndex} className={cn(line.trim() ? "mb-3 last:mb-0" : "h-2")}>
                                                                                            {line}
                                                                                        </p>
                                                                                    ))}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={() => toggleShortlist(ranking.studentId, currentShortlistState)}
                                                                                        className={cn(
                                                                                            "h-9 px-4 font-bold shadow-sm transition-all",
                                                                                            isShortlisted
                                                                                                ? "border-warning/20 bg-warning/10 text-warning hover:bg-warning/10"
                                                                                                : "bg-primary hover:bg-primary/90",
                                                                                        )}
                                                                                        variant={isShortlisted ? "outline" : "default"}
                                                                                    >
                                                                                        <Star className={cn("mr-2 h-4 w-4", isShortlisted && "fill-current")} />
                                                                                        {isShortlisted ? "Shortlisted" : "Shortlist Candidate"}
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => passCandidate(ranking.studentId, currentShortlistState)}
                                                                                        className={cn(
                                                                                            "h-9 px-4 font-semibold transition-all",
                                                                                            isPassed ? "bg-destructive/10 text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                                                                                        )}
                                                                                    >
                                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                                        {isPassed ? "Passed ✓" : "Pass/Reject"}
                                                                                    </Button>
                                                                                </div>

                                                                                <Button variant="link" size="sm" asChild className="gap-1 font-bold text-primary">
                                                                                    <a href={profileHref} target="_blank" rel="noreferrer">
                                                                                        <BookOpen className="h-4 w-4" /> {viewerRole === "admin" ? "Full Profile" : "Find in Students"}
                                                                                    </a>
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : null}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
