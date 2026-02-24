"use client";

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search } from "lucide-react";
import { UPES_BRANCHES } from "@/lib/constants/branches";

// ── Types ───────────────────────────────────────────────────────────────────

export interface RankingRow {
    rankPosition: number;
    matchScore: number;
    semanticScore: number;
    structuredScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    shortExplanation: string;
    detailedExplanation: string | null;
    studentName: string | null;
    studentBranch: string | null;
    studentCgpa: number | null;
    sapId: string | null;
    rollNo: string | null;
}

interface RankingsTableProps {
    rankings: RankingRow[];
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RankingsTable({ rankings }: RankingsTableProps) {
    const [nameSearch, setNameSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [minCGPA, setMinCGPA] = useState("");
    const [sortAsc, setSortAsc] = useState(false);

    const filtered = useMemo(() => {
        return rankings
            .filter(
                (r) =>
                    nameSearch === "" ||
                    (r.studentName ?? "").toLowerCase().includes(nameSearch.toLowerCase()),
            )
            .filter((r) => branchFilter === "" || r.studentBranch === branchFilter)
            .filter(
                (r) =>
                    !minCGPA ||
                    (r.studentCgpa !== null && r.studentCgpa >= parseFloat(minCGPA)),
            )
            .sort((a, b) =>
                sortAsc
                    ? a.matchScore - b.matchScore
                    : b.matchScore - a.matchScore,
            );
    }, [rankings, nameSearch, branchFilter, minCGPA, sortAsc]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ranked Candidates</CardTitle>
                <CardDescription>
                    {filtered.length} of {rankings.length} students shown
                </CardDescription>
            </CardHeader>

            {/* ── Filter Controls ──────────────────────────────────────────── */}
            <CardContent className="border-b pb-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Search by name */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {/* Branch filter */}
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Branches</SelectItem>
                            {UPES_BRANCHES.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                    {b.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Min CGPA */}
                    <Input
                        type="number"
                        placeholder="Min CGPA"
                        min={0}
                        max={10}
                        step={0.1}
                        value={minCGPA}
                        onChange={(e) => setMinCGPA(e.target.value)}
                    />

                    {/* Sort toggle */}
                    <Button
                        variant="outline"
                        onClick={() => setSortAsc(!sortAsc)}
                        className="gap-2"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        Score: {sortAsc ? "Low → High" : "High → Low"}
                    </Button>
                </div>
            </CardContent>

            {/* ── Table ────────────────────────────────────────────────────── */}
            <CardContent className="p-0">
                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        No students match the current filters.
                    </div>
                ) : (
                    <div className="overflow-auto max-h-[70vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 text-center">Rank</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead className="text-center">CGPA</TableHead>
                                    <TableHead className="text-center">Match %</TableHead>
                                    <TableHead>Matched Skills</TableHead>
                                    <TableHead>Missing Skills</TableHead>
                                    <TableHead className="max-w-xs">Explanation</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((r, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="text-center font-bold">
                                            {r.rankPosition}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {r.studentName || "—"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {r.sapId && <>SAP: {r.sapId}</>}
                                                {r.sapId && r.rollNo && <> · </>}
                                                {r.rollNo && <>Roll: {r.rollNo}</>}
                                                {!r.sapId && !r.rollNo && <>—</>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {r.studentBranch || "—"}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                            {r.studentCgpa !== null
                                                ? r.studentCgpa.toFixed(1)
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {r.matchScore.toFixed(1)}%
                                        </TableCell>
                                        <TableCell className="max-w-[180px]">
                                            <div className="flex flex-wrap gap-1">
                                                {(r.matchedSkills as string[])
                                                    .slice(0, 3)
                                                    .map((s) => (
                                                        <Badge
                                                            key={s}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                {(r.matchedSkills as string[]).length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{(r.matchedSkills as string[]).length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[180px]">
                                            <div className="flex flex-wrap gap-1">
                                                {(r.missingSkills as string[])
                                                    .slice(0, 3)
                                                    .map((s) => (
                                                        <Badge
                                                            key={s}
                                                            variant="destructive"
                                                            className="text-xs"
                                                        >
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                {(r.missingSkills as string[]).length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{(r.missingSkills as string[]).length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <p
                                                className="text-sm truncate"
                                                title={r.shortExplanation}
                                            >
                                                {r.shortExplanation}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
