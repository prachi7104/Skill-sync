"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { computeCompleteness } from "@/lib/profile/completeness";
import {
    FileText, ArrowRight, AlertCircle,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toResumeDownloadUrl } from "@/lib/resume/download-url";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AmcatData = {
    hasAmcat: boolean;
    score?: number;
    category?: "alpha" | "beta" | "gamma";
    rank?: number;
    total_students?: number;
    cs_score?: number | null;
    cp_score?: number | null;
    automata_score?: number | null;
    automata_fix_score?: number | null;
    quant_score?: number | null;
};

type LeaderboardPreviewRow = {
    rank: number;
    name: string;
    branch: string | null;
    score: number;
    category: "alpha" | "beta" | "gamma";
};

type LeaderboardPreviewPayload = {
    hasData?: boolean;
    session?: {
        session_name?: string;
    };
    top50?: LeaderboardPreviewRow[];
};

export default function StudentDashboard() {
    const { user, student, isLoading } = useStudent();
    const router = useRouter();
    const [stats, setStats] = useState({
        activeDrivesCount: 0,
        rankingsCount: 0,
        shortlistedCount: 0,
        sandboxUsageToday: 0,
        requiredCompleted: false,
        hasEmbedding: false,
    });
    const [amcat, setAmcat] = useState<AmcatData>({ hasAmcat: false });
    const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardPreviewRow[]>([]);
    const [leaderboardSessionName, setLeaderboardSessionName] = useState<string>("");
    const [statsLoading, setStatsLoading] = useState(false);
    const [amcatLoading, setAmcatLoading] = useState(false);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [amcatError, setAmcatError] = useState<string | null>(null);
    const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
    const [reloadTick, setReloadTick] = useState(0);

    useEffect(() => {
        if (!isLoading && student) {
            const shouldRedirect = !student.sapId && !student.rollNo && !student.resumeUrl;
            if (shouldRedirect) {
                router.push("/student/onboarding");
            }
        }
    }, [isLoading, student, router]);

    useEffect(() => {
        async function fetchStats() {
            setStatsLoading(true);
            setStatsError(null);
            try {
                const res = await fetch("/api/student/dashboard/stats");
                if (!res.ok) { setStatsError("Could not load dashboard statistics."); return; }
                const data = await res.json();
                setStats(data.data ?? data);
            } catch {
                setStatsError("Could not load dashboard statistics.");
            } finally {
                setStatsLoading(false);
            }
        }
        if (student) fetchStats();
    }, [student, reloadTick]);

    useEffect(() => {
        async function fetchAmcat() {
            setAmcatLoading(true);
            setAmcatError(null);
            try {
                const res = await fetch("/api/student/amcat");
                if (!res.ok) { setAmcatError("Could not load AMCAT data."); return; }
                const data = await res.json();
                setAmcat(data);
            } catch {
                setAmcatError("Could not load AMCAT data.");
            } finally {
                setAmcatLoading(false);
            }
        }
        if (student) fetchAmcat();
    }, [student, reloadTick]);

    useEffect(() => {
        async function fetchLeaderboardPreview() {
            setLeaderboardLoading(true);
            setLeaderboardError(null);
            try {
                const res = await fetch("/api/student/amcat/leaderboard");
                if (!res.ok) { setLeaderboardError("Could not load leaderboard preview."); return; }
                const raw = await res.text();
                if (!raw.trim()) { setLeaderboardRows([]); setLeaderboardSessionName(""); return; }
                const data = JSON.parse(raw) as LeaderboardPreviewPayload;
                if (!data.hasData || !Array.isArray(data.top50)) {
                    setLeaderboardRows([]); setLeaderboardSessionName(""); return;
                }
                setLeaderboardRows(data.top50.slice(0, 5));
                setLeaderboardSessionName(typeof data.session?.session_name === "string" ? data.session.session_name : "");
            } catch {
                setLeaderboardRows([]);
                setLeaderboardSessionName("");
                setLeaderboardError("Could not load leaderboard preview.");
            } finally {
                setLeaderboardLoading(false);
            }
        }
        if (student) fetchLeaderboardPreview();
    }, [student, reloadTick]);

    if (isLoading || !student || !user) {
        return (
            <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-px w-full" />
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
                </div>
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-16 w-full rounded-md" />
            </div>
        );
    }

    const { score, missing } = computeCompleteness({
        ...student,
        name: user.name,
        email: user.email,
    });

    const activeDrives = stats.activeDrivesCount ?? 0;
    const rankings = stats.rankingsCount ?? 0;
    const shortlisted = stats.shortlistedCount ?? 0;
    const sandboxUsageToday = stats.sandboxUsageToday ?? 0;
    const resumeDownloadUrl = student.resumeUrl ? toResumeDownloadUrl(student.resumeUrl) : null;
    const resumeActionLabel = (student.resumeMime || "").toLowerCase().includes("pdf")
        ? "Download PDF"
        : "Download Resume";
    const hasAnyFetchError = Boolean(statsError || amcatError || leaderboardError);
    const isAnyFetchLoading = statsLoading || amcatLoading || leaderboardLoading;

    return (
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">

            {/* Page header */}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                        Welcome back, {user.name}
                    </h1>
                    <div
                        className={cn(
                            "h-2 w-2 rounded-full ml-1",
                            stats.hasEmbedding ? "bg-emerald-500" : "animate-pulse bg-rose-500",
                        )}
                        title={stats.hasEmbedding ? "AI Ready" : "Profile Indexing..."}
                    />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {stats.hasEmbedding ? "Your profile is AI-ready for ranking and sandbox." : "Profile indexing in progress — complete your profile fields to enable ranking."}
                    {isAnyFetchLoading && <span className="ml-2 text-xs">Refreshing...</span>}
                </p>
            </div>

            {hasAnyFetchError && (
                <div className="py-6 border border-destructive/20 bg-destructive/10 rounded-md">
                    <EmptyState 
                        message="Dashboard Error"
                        description={statsError || amcatError || leaderboardError || "An error occurred while loading your dashboard."}
                        action={
                            <Button variant="outline" className="mt-4" onClick={() => setReloadTick((v) => v + 1)}>
                                Retry
                            </Button>
                        }
                    />
                </div>
            )}

            <Separator />

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Active Drives", value: activeDrives },
                    { label: "Rankings", value: rankings },
                    { label: "Shortlisted", value: shortlisted },
                    { label: "Sandbox Today", value: `${sandboxUsageToday}/5` },
                ].map(({ label, value }) => (
                    <div key={label} className="rounded-md border border-border bg-card p-4">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-xl font-semibold text-foreground mt-1">{value}</p>
                    </div>
                ))}
            </div>

            <Separator />

            {/* Profile completeness */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Profile Completeness</h2>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Completeness score</span>
                        <span className="text-sm font-semibold text-foreground">{score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-foreground/80 rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
                    </div>
                    {missing.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Missing: {missing.slice(0, 3).join(", ")}
                        </p>
                    )}
                </div>
            </section>

            <Separator />

            {/* Resume status */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Resume</h2>
                {student.resumeUrl ? (
                    <div className="rounded-md border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[280px]">
                                    {student.resumeFilename || "Resume.pdf"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Uploaded {student.resumeUploadedAt ? format(new Date(student.resumeUploadedAt), "MMM d, yyyy") : "Recently"}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" asChild>
                                <a href={resumeDownloadUrl || "#"} target="_blank" rel="noreferrer">{resumeActionLabel}</a>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/student/profile">Update</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 border border-border bg-card rounded-md">
                        <EmptyState 
                            message="No Resume Uploaded"
                            description="AI match rates are significantly lower without a resume. Upload one now to see matching drives."
                            action={
                                <Button size="sm" className="mt-4" asChild>
                                    <Link href="/student/onboarding">Upload Now</Link>
                                </Button>
                            }
                        />
                    </div>
                )}
            </section>

            {/* AMCAT section */}
            {amcat.hasAmcat && (
                <>
                    <Separator />
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-foreground">AMCAT Performance</h2>
                            <div className="flex items-center gap-3">
                                <CategoryBadge category={amcat.category || "gamma"} />
                                <Link href="/student/leaderboard" className="text-xs text-muted-foreground hover:text-foreground">
                                    View Leaderboard →
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-semibold text-foreground">{amcat.score ?? 0}</span>
                            <span className="text-muted-foreground text-sm">/ 100</span>
                            <span className="text-muted-foreground text-xs ml-auto">
                                Rank #{amcat.rank ?? "–"} of {amcat.total_students ?? "–"}
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {[
                                { label: "Automata", score: amcat.automata_score ?? 0 },
                                { label: "Automata Fix", score: amcat.automata_fix_score ?? 0 },
                                { label: "CS", score: amcat.cs_score ?? 0 },
                                { label: "CP", score: amcat.cp_score ?? 0 },
                                { label: "Quant", score: amcat.quant_score ?? 0 },
                            ].map((section) => (
                                <div key={section.label} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-24 shrink-0">{section.label}</span>
                                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-foreground/60 rounded-full" style={{ width: `${Math.max(0, Math.min(100, section.score))}%` }} />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-6 text-right">{section.score}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {/* Leaderboard preview */}
            {leaderboardRows.length > 0 && (
                <>
                    <Separator />
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">AMCAT Leaderboard Snapshot</h2>
                                {leaderboardSessionName && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{leaderboardSessionName}</p>
                                )}
                            </div>
                            <Link href="/student/leaderboard" className="text-xs text-muted-foreground hover:text-foreground">
                                Open Full Leaderboard →
                            </Link>
                        </div>
                        <div className="rounded-md border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-secondary">
                                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Rank</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Branch</th>
                                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Score</th>
                                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboardRows.map((row, i) => (
                                        <tr key={`${row.rank}-${row.name}`} className={cn("border-b border-border last:border-0", i % 2 !== 0 ? "bg-secondary/40" : "")}>
                                            <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">#{row.rank}</td>
                                            <td className="px-4 py-2.5 font-medium text-foreground">{row.name}</td>
                                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.branch || "N/A"}</td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-foreground">{row.score}</td>
                                            <td className="px-4 py-2.5 text-right"><CategoryBadge category={row.category} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}

            <Separator />

            {/* Data parameters */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Data Parameters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ProfileSectionItem label="Core Skills" count={student.skills?.length || 0} min={5} />
                    <ProfileSectionItem label="Projects" count={student.projects?.length || 0} min={2} />
                    <ProfileSectionItem label="Work Experience" count={student.workExperience?.length || 0} min={1} />
                    <ProfileSectionItem label="Certifications" count={student.certifications?.length || 0} min={1} />
                </div>
            </section>

            <Separator />

            {/* Quick actions */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-foreground">Quick Actions</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Jump to active drives or refine your profile.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/student/onboarding">Edit Onboarding</Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/student/drives">
                            Explore Drives <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ProfileSectionItem({ label, count, min, isOptional }: { label: string; count: number; min: number; isOptional?: boolean }) {
    const isGood = count >= min;
    return (
        <div className="flex items-center justify-between py-3 px-4 rounded-md border border-border bg-card">
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {isOptional ? "Optional" : `Min: ${min}`}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-foreground">{count ?? 0}</span>
                {isGood
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                    : <AlertCircle className="w-4 h-4 text-rose-500" strokeWidth={2} />
                }
            </div>
        </div>
    );
}

function CategoryBadge({ category }: { category: "alpha" | "beta" | "gamma" }) {
    const variant = category === "alpha" ? "green" : category === "beta" ? "yellow" : "red";
    return <Badge variant={variant as "green" | "yellow" | "red"}>{category}</Badge>;
}