"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { computeCompleteness } from "@/lib/profile/completeness";
import {
    FileText, ArrowRight, Sparkles, AlertCircle,
    Briefcase, Award, Eye, CheckCircle2,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toResumeDownloadUrl } from "@/lib/resume/download-url";

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

    useEffect(() => {
        if (!isLoading && student) {
            // Only redirect if the student has truly never started onboarding
            // (no SAP ID AND no rollNo AND no resume — they haven't done anything)
            // A student who finished onboarding but skipped some fields should see the dashboard
            // with a "complete your profile" banner, not get bounced back
            const shouldRedirect = !student.sapId && !student.rollNo && !student.resumeUrl;

            if (shouldRedirect) {
                router.push("/student/onboarding");
            }
        }
    }, [isLoading, student, router]);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/student/dashboard/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.data ?? data);
                }
            } catch {
                // Silently handle to fix unused error linting
            }
        }
        if (student) fetchStats();
    }, [student]);

    useEffect(() => {
        async function fetchAmcat() {
            try {
                const res = await fetch("/api/student/amcat");
                if (res.ok) {
                    const data = await res.json();
                    setAmcat(data);
                }
            } catch {
                // AMCAT is optional on dashboard
            }
        }

        if (student) fetchAmcat();
    }, [student]);

    useEffect(() => {
        async function fetchLeaderboardPreview() {
            try {
                const res = await fetch("/api/student/amcat/leaderboard");
                if (!res.ok) return;

                const raw = await res.text();
                if (!raw.trim()) return;

                const data = JSON.parse(raw) as LeaderboardPreviewPayload;
                if (!data.hasData || !Array.isArray(data.top50)) {
                    setLeaderboardRows([]);
                    setLeaderboardSessionName("");
                    return;
                }

                setLeaderboardRows(data.top50.slice(0, 5));
                setLeaderboardSessionName(typeof data.session?.session_name === "string" ? data.session.session_name : "");
            } catch {
                setLeaderboardRows([]);
                setLeaderboardSessionName("");
            }
        }

        if (student) fetchLeaderboardPreview();
    }, [student]);

    if (isLoading || !student || !user) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
            
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
                    Student Dashboard
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                    Welcome back, <span className="text-foreground font-bold">{user.name}</span>. Here&apos;s what&apos;s happening.
                </p>
                <div className="flex items-center gap-2 pt-1">
                    <div
                        className={cn(
                            "h-2 w-2 rounded-full",
                            stats.hasEmbedding ? "bg-success" : "animate-pulse bg-warning",
                        )}
                        title={
                            stats.hasEmbedding
                                ? "Profile embedding generated. You are ready for ranking and sandbox."
                                : "Profile embedding pending. Complete profile fields to enable ranking and sandbox."
                        }
                    />
                    <span className="text-xs text-muted-foreground">
                        {stats.hasEmbedding ? "AI Ready" : "Profile Indexing..."}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <StatCard title="Active Drives" value={activeDrives} icon={Briefcase} subtitle="Eligible now" />
                    <StatCard title="Rankings" value={rankings} icon={Award} subtitle="Generated" />
                    <StatCard title="Shortlisted" value={shortlisted} icon={CheckCircle2} subtitle="Positive outcomes" />
                    <StatCard title="Sandbox Usage" value={`${sandboxUsageToday}/5`} icon={Eye} subtitle="Today" />
                </div>
                <div className="col-span-12 lg:col-span-5">
                    <div className="bg-card rounded-md border border-border p-6 h-full flex flex-col justify-center">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Profile Completeness</h3>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-3xl font-bold text-foreground">{score}%</p>
                            <Link href="/student/onboarding" className="text-sm text-primary hover:text-primary/80 font-medium">Improve profile</Link>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {amcat.hasAmcat && (
                <div className="bg-card rounded-md border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-foreground">AMCAT Performance</h3>
                            <Link href="/student/leaderboard" className="text-xs text-primary hover:text-primary/80 font-semibold">
                                View Leaderboard
                            </Link>
                        </div>
                        <CategoryBadge category={amcat.category || "gamma"} />
                    </div>

                    <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-3xl font-bold text-foreground">{amcat.score ?? 0}</span>
                        <span className="text-muted-foreground text-sm">/ 100</span>
                        <span className="text-muted-foreground text-sm ml-auto">
                            Rank #{amcat.rank ?? "-"} of {amcat.total_students ?? "-"}
                        </span>
                    </div>

                    <div className="space-y-3 mt-4">
                        {[
                            { label: "Automata", score: amcat.automata_score ?? 0 },
                            { label: "Automata Fix", score: amcat.automata_fix_score ?? 0 },
                            { label: "CS", score: amcat.cs_score ?? 0 },
                            { label: "CP", score: amcat.cp_score ?? 0 },
                            { label: "Quant", score: amcat.quant_score ?? 0 },
                        ].map((section) => (
                            <div key={section.label} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-24 font-medium">{section.label}</span>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${Math.max(0, Math.min(100, section.score))}%` }}
                                    />
                                </div>
                                <span className="text-xs text-foreground w-8 text-right font-medium">{section.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {leaderboardRows.length > 0 && (
                <div className="bg-card rounded-md border border-border p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className="font-bold text-foreground">AMCAT Leaderboard Snapshot</h3>
                            {leaderboardSessionName && (
                                <p className="text-xs text-muted-foreground mt-1">{leaderboardSessionName}</p>
                            )}
                        </div>
                        <Link href="/student/leaderboard" className="text-sm text-primary hover:text-primary/80 font-semibold">
                            Open Full Leaderboard
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {leaderboardRows.map((row) => (
                            <div key={`${row.rank}-${row.name}`} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                                <span className="w-12 text-sm font-bold text-foreground">#{row.rank}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-foreground truncate">{row.name}</p>
                                    <p className="text-xs text-muted-foreground">{row.branch || "Branch N/A"}</p>
                                </div>
                                <span className="w-12 text-right text-sm font-semibold text-foreground">{row.score}</span>
                                <CategoryBadge category={row.category} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6 md:gap-8">
                
                {/* Resume Status Card */}
                <div className="col-span-12 lg:col-span-8 bg-card rounded-md border border-border p-8 space-y-6 relative overflow-hidden group">
                    <div className="flex items-center space-x-3 text-primary relative z-10">
                        <FileText className="w-6 h-6" />
                        <h3 className="font-bold text-foreground text-xl tracking-tight">Resume Status</h3>
                    </div>
                    <p className="text-muted-foreground font-medium relative z-10">Your current master resume on file.</p>
                    
                    <div className="bg-muted/30 rounded-md p-6 flex flex-col sm:flex-row sm:items-center justify-between border border-border relative z-10">
                        {student.resumeUrl ? (
                            <>
                                <div className="mb-5 sm:mb-0">
                                    <p className="font-bold text-foreground text-base truncate max-w-[300px]">
                                        {student.resumeFilename || "Resume.pdf"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1.5 font-bold tracking-wide uppercase">
                                        Uploaded {student.resumeUploadedAt ? format(new Date(student.resumeUploadedAt), "MMM d, yyyy") : "Recently"}
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <a href={resumeDownloadUrl || "#"} target="_blank" rel="noreferrer"
                                       className="px-6 py-2.5 border border-border bg-background hover:bg-muted rounded-md text-sm font-bold text-foreground transition-all">
                                        {resumeActionLabel}
                                    </a>
                                    <Link href="/student/profile"
                                          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-bold transition-all shadow-sm">
                                        Update
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 w-full">
                                <div className="p-3 bg-warning/10 rounded-full shrink-0">
                                    <AlertCircle className="h-6 w-6 text-warning" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-foreground text-base">No Resume Uploaded</p>
                                    <p className="text-sm text-muted-foreground mt-1 font-medium">AI match rates are significantly lower without a resume.</p>
                                </div>
                                <Link href="/student/onboarding"
                                      className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-bold transition-all whitespace-nowrap shadow-sm">
                                    Upload Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Completeness Score (Additional Card if needed, or replace to match clean design) */}
                <div className="col-span-12 lg:col-span-4 bg-card rounded-md border border-border p-8 space-y-8 relative overflow-hidden">
                    <h3 className="font-bold text-foreground flex items-center space-x-3 text-xl tracking-tight">
                        <Sparkles className="w-6 h-6 text-success" />
                        <span>Completeness</span>
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <p className="text-3xl font-bold text-foreground tracking-tighter">{score}%</p>
                            <p className={`text-sm font-bold mb-1 ${
                                score >= 80 ? "text-success" :
                                score >= 60 ? "text-info" :
                                score >= 40 ? "text-warning" : "text-destructive"
                            }`}>
                                {score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs work"}
                            </p>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                           <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", 
                                score >= 80 ? "bg-success" :
                                score >= 60 ? "bg-info" :
                                score >= 40 ? "bg-warning" : "bg-destructive")} style={{ width: `${score}%` }} />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        {missing.length > 0 ? (
                            <>
                                <p className="text-sm font-bold text-foreground mb-3 tracking-tight">Action Items:</p>
                                <ul className="text-sm text-muted-foreground space-y-3 list-none font-medium">
                                    {missing.slice(0, 3).map((msg, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="mr-3 text-primary font-bold">•</span>
                                            {msg}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p className="text-sm font-bold text-success flex items-center bg-success/10 p-4 rounded-md border border-success/20">
                                <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                                Profile is perfectly optimized.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-md border border-border bg-muted/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <p className="text-foreground font-semibold">Quick Actions</p>
                    <p className="text-sm text-muted-foreground mt-1">Jump to active drives or refine your profile to improve shortlist odds.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link href="/student/drives" className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold text-center flex-1 md:flex-none hover:bg-primary/90 transition-colors">Explore Drives</Link>
                    <Link href="/student/onboarding" className="px-5 py-2.5 rounded-md border border-border bg-background text-foreground text-sm font-semibold text-center flex-1 md:flex-none hover:bg-muted transition-colors">Edit Onboarding</Link>
                </div>
            </div>

            {/* Profile Sections Grid */}
            <div className="bg-card rounded-md border border-border p-8 md:p-10">
                <h3 className="font-bold text-foreground mb-8 text-xl tracking-tight">Data Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <ProfileSectionItem label="Core Skills" count={student.skills?.length || 0} min={5} />
                   <ProfileSectionItem label="Projects" count={student.projects?.length || 0} min={2} />
                   <ProfileSectionItem label="Work Experience" count={student.workExperience?.length || 0} min={1} />
                   <ProfileSectionItem label="Certifications" count={student.certifications?.length || 0} min={1} />
                </div>
                <div className="mt-10 flex justify-end">
                   <Link href="/student/profile"
                         className="group flex items-center bg-background border border-border text-foreground rounded-md px-8 py-4 font-bold text-sm hover:bg-muted transition-all shadow-sm">
                         Manage Full Profile 
                         <ArrowRight className="ml-3 w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all" />
                   </Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <div className="bg-card p-6 rounded-md border border-border relative group hover:border-primary/40 transition-all duration-300">
      <div className="flex flex-col justify-between h-full space-y-4">
         <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
        <div>
            <p className="text-3xl font-bold text-foreground tracking-tight leading-none">{value ?? 0}</p>
            <p className="text-xs font-medium text-muted-foreground mt-2">{subtitle}</p>
        </div>
      </div>
      <div className="absolute top-6 right-6 z-10 rounded-md bg-muted p-2 transition-colors duration-300 group-hover:bg-primary/10">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
      </div>
    </div>
  );
}

function ProfileSectionItem({ label, count, min, isOptional }: any) {
  const isGood = count >= min;
  return (
    <div className="flex items-center justify-between p-6 rounded-md border border-border bg-muted/20 hover:bg-muted/50 transition-all duration-300">
      <div>
        <p className="font-bold text-foreground text-sm tracking-tight">{label}</p>
        <p className="text-xs text-muted-foreground font-medium mt-1">
           {isOptional ? "Optional Data" : `Min Req: ${min}`}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-2xl font-bold text-foreground">{count ?? 0}</span>
        <div className={isGood ? "bg-success/10 rounded-md p-2 text-success" : "bg-destructive/10 border border-destructive/20 rounded-md p-2 text-destructive"}>
           {isGood ? (
               <CheckCircle2 className="w-5 h-5 mx-auto" />
           ) : (
               <AlertCircle className="w-5 h-5 mx-auto" />
           )}
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: "alpha" | "beta" | "gamma" }) {
    const style = category === "alpha"
        ? "bg-success/10 text-success border-success/20"
        : category === "beta"
            ? "bg-warning/10 text-warning border-warning/20"
            : "bg-destructive/10 text-destructive border-destructive/20";

    return (
        <span className={`text-xs uppercase font-bold px-2.5 py-1 rounded-full border ${style}`}>
            {category}
        </span>
    );
}