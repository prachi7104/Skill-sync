export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, students, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, Star, Award, MapPin, Briefcase, Calendar, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { enforceRankingsExist, GuardrailViolation } from "@/lib/guardrails";
import RankingsTable from "@/components/faculty/rankings-table";
import { getCompanyColor } from "@/lib/utils/company-color";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PageProps {
  params: { driveId: string };
}

export default async function FacultyDriveRankingsPage({ params }: PageProps) {
  const user = await requireRole(["faculty", "admin"]);
  const { driveId } = params;
  const MAX_RANKINGS_ROWS = 2000;
  const viewerRole: "faculty" | "admin" = user.role === "admin" ? "admin" : "faculty";

  // ── Validate UUID ──────────────────────────────────────────────────────
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!driveId || !uuidRegex.test(driveId)) {
    notFound();
  }

  // ── Fetch drive details ────────────────────────────────────────────────
  const [drive] = await db
    .select({
      id: drives.id,
      company: drives.company,
      roleTitle: drives.roleTitle,
      location: drives.location,
      packageOffered: drives.packageOffered,
      deadline: drives.deadline,
      isActive: drives.isActive,
      collegeId: drives.collegeId,
    })
    .from(drives)
    .where(eq(drives.id, driveId))
    .limit(1);

  if (!drive) {
    notFound();
  }

  // Scope: both faculty/admin views are strictly college-scoped in this module.
  if (!user.collegeId || drive.collegeId !== user.collegeId) {
    notFound();
  }

  // ── Enforce rankings exist ─────────────────────────────────────────────
  let guardrailError: { reason: string; nextStep: string } | null = null;
  try {
    await enforceRankingsExist(driveId);
  } catch (err) {
    if (err instanceof GuardrailViolation) {
      guardrailError = { reason: err.reason, nextStep: err.nextStep };
    } else {
      throw err;
    }
  }

  if (guardrailError) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Rankings — {drive.company}</h1>
        <Card className="border-t-4 border-t-amber-500">
          <CardContent className="py-12 text-center space-y-4">
            <div className="bg-amber-500/15 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-200">{guardrailError.reason}</p>
              <p className="text-sm text-muted-foreground">{guardrailError.nextStep}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Fetch richer data ──────────────────────────────────────────────────
  const rowsRaw = await db
    .select({
      rankPosition: rankings.rankPosition,
      matchScore: rankings.matchScore,
      isEligible: rankings.isEligible,
      ineligibilityReason: rankings.ineligibilityReason,
      profileCompletenessAtRank: rankings.profileCompletenessAtRank,
      matchedSkills: rankings.matchedSkills,
      missingSkills: rankings.missingSkills,
      shortExplanation: rankings.shortExplanation,
      detailedExplanation: rankings.detailedExplanation,
      shortlisted: rankings.shortlisted,
      studentId: rankings.studentId,
      studentName: users.name,
      sapId: students.sapId,
      rollNo: students.rollNo,
      branch: students.branch,
      cgpa: students.cgpa,
      batchYear: students.batchYear,
    })
    .from(rankings)
    .innerJoin(students, eq(rankings.studentId, students.id))
    .innerJoin(users, eq(students.id, users.id))
    .where(eq(rankings.driveId, driveId))
    .orderBy(asc(rankings.rankPosition))
    .limit(MAX_RANKINGS_ROWS + 1);

  const isTruncated = rowsRaw.length > MAX_RANKINGS_ROWS;
  const rows = isTruncated ? rowsRaw.slice(0, MAX_RANKINGS_ROWS) : rowsRaw;

  const eligibleRankings = rows.filter((r) => r.isEligible && r.matchScore > 0);
  const incompleteRankings = rows.filter(
    (r) => r.isEligible && r.matchScore === 0 && !r.ineligibilityReason,
  );
  const ineligibleRankings = rows.filter((r) => !r.isEligible);

  // ── Compute score distribution ─────────────────────────────────────────
  const buckets = [0, 20, 40, 60, 80, 100];
  const distribution = buckets.slice(0, -1).map((min, i) => {
    const max = buckets[i + 1];
    let count = rows.filter((r) => r.matchScore >= min && r.matchScore < max).length;
    // Fix: top score (100) lands in the last bucket
    if (max === 100) {
      count += rows.filter((r) => r.matchScore === 100).length;
    }
    return { label: `${min}–${max}`, count };
  });

  // ── Compute summary stats ──────────────────────────────────────────────
  const avgScore = rows.length
    ? (rows.reduce((s, r) => s + r.matchScore, 0) / rows.length).toFixed(1)
    : "—";
  const topScore = rows.length
    ? Math.max(...rows.map((r) => r.matchScore)).toFixed(1)
    : "—";
  const shortlistedCount = rows.filter((r) => r.shortlisted === true).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* ── Drive Header Card ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-none shadow-md ring-1 ring-slate-800">
        <div className="bg-slate-900/50 border-b border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={cn(
              "h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-black text-white uppercase shadow-lg ring-4 ring-white",
              getCompanyColor(drive.company)
            )}>
              {drive.company.slice(0, 2)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">{drive.company}</h1>
                <Badge variant={drive.isActive ? "default" : "outline"} className={cn(
                  "px-2 py-0.5 text-[10px] font-black tracking-widest uppercase",
                  drive.isActive ? "bg-emerald-500 hover:bg-emerald-600" : "text-slate-500 border-slate-300"
                )}>
                  {drive.isActive ? "Active Drive" : "Closed"}
                </Badge>
              </div>
              <p className="text-slate-500 font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> {drive.roleTitle}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                {drive.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {drive.location}</span>
                )}
                {drive.packageOffered && (
                  <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> {drive.packageOffered}</span>
                )}
                {drive.deadline && (
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ends: {format(new Date(drive.deadline), "MMM d, yyyy")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm" className="h-10 text-xs font-bold gap-2 border-slate-800 hover:bg-slate-800 hover:text-indigo-400 transition-all shadow-sm">
              <Link href={`/api/drives/${driveId}/export`} download>
                <Download className="h-3.5 w-3.5" /> Export All CSV
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-10 text-xs font-bold gap-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-all shadow-sm">
              <Link href={`/api/drives/${driveId}/export?shortlistedOnly=true`} download>
                <Star className="h-3.5 w-3.5 fill-current" /> Export Shortlisted
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Mini Stat Chips ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-800 border-t border-slate-800 bg-slate-900/50">
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Users className="h-3 w-3" /> Total Candidates
            </p>
            <p className="text-3xl font-mono font-black text-white leading-none">{rows.length}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <TrendingUp className="h-3 w-3" /> Average Score
            </p>
            <p className="text-3xl font-mono font-black text-white leading-none">{avgScore}%</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Award className="h-3 w-3" /> Top Match
            </p>
            <p className="text-3xl font-mono font-black text-white leading-none">{topScore}%</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Star className="h-3 w-3 fill-current" /> Shortlisted
            </p>
            <p className="text-3xl font-mono font-black text-white leading-none">{shortlistedCount}</p>
          </div>
        </div>
      </Card>

      {/* ── Rankings Table (Client Component) ────────────────────────────── */}
      <RankingsTable
        rankings={rows.map(r => ({
          ...r,
          matchedSkills: r.matchedSkills as string[],
          missingSkills: r.missingSkills as string[],
          shortlisted: r.shortlisted ?? null,
          studentName: r.studentName ?? "Unknown Student"
        }))}
        distribution={distribution}
        driveId={driveId}
        viewerRole={viewerRole}
      />

      {isTruncated && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="py-3 text-sm text-amber-200">
            Showing the first {MAX_RANKINGS_ROWS} candidates for performance. Use CSV export for full data.
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-800 bg-slate-900/40">
        <CardContent className="pt-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">Eligible + Scored</h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{eligibleRankings.length}</Badge>
            </div>
            {eligibleRankings.slice(0, 10).map((r) => (
              <div key={r.studentId} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm flex items-center justify-between">
                <span className="text-slate-200">#{r.rankPosition} {r.studentName}</span>
                <span className="text-emerald-300 font-semibold">{r.matchScore.toFixed(1)}%</span>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">Eligible + Incomplete Profile</h3>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">{incompleteRankings.length}</Badge>
            </div>
            {incompleteRankings.slice(0, 10).map((r) => (
              <div key={r.studentId} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm flex items-center justify-between">
                <span className="text-slate-200">#{r.rankPosition} {r.studentName}</span>
                <Badge variant="outline" className="border-amber-500/40 text-amber-300">Complete Profile</Badge>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Ineligible</h3>
              <Badge className="bg-slate-700/50 text-slate-200 border border-slate-600">{ineligibleRankings.length}</Badge>
            </div>
            {ineligibleRankings.slice(0, 10).map((r) => (
              <div key={r.studentId} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm flex items-center justify-between gap-3">
                <span className="text-slate-300">#{r.rankPosition} {r.studentName}</span>
                <Badge variant="outline" className="border-slate-500 text-slate-300 max-w-[60%] truncate">
                  {r.ineligibilityReason ?? "Does not meet criteria"}
                </Badge>
              </div>
            ))}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
