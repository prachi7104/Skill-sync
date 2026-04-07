export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, students, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, Star, Award, MapPin, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { enforceRankingsExist, GuardrailViolation } from "@/lib/guardrails";
import RankingsTable from "@/components/faculty/rankings-table";
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
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Rankings &mdash; {drive.company}</h1>
        <Card className="border border-border shadow-none">
          <CardContent className="py-12 text-center space-y-4">
            <div className="bg-secondary w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium text-foreground">{guardrailError.reason}</p>
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



  // ── Compute summary stats ──────────────────────────────────────────────
  const avgScore = rows.length
    ? (rows.reduce((s, r) => s + r.matchScore, 0) / rows.length).toFixed(1)
    : "—";
  const topScore = rows.length
    ? Math.max(...rows.map((r) => r.matchScore)).toFixed(1)
    : "—";
  const shortlistedCount = rows.filter((r) => r.shortlisted === true).length;

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-in fade-in duration-500">
      {/* ── Drive Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start justify-between">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold text-foreground tracking-tight">{drive.company}</h1>
                <Badge variant={drive.isActive ? "default" : "secondary"}>
                    {drive.isActive ? "Active" : "Closed"}
                </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" /> {drive.roleTitle}
                </span>
                {drive.location && (
                    <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {drive.location}
                    </span>
                )}
                {drive.packageOffered && (
                    <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13h2.5c2.5 0 5-1.7 5-4s-2.5-4-5-4M6 13l6 8M6 8l7 5"/></svg>
                        {drive.packageOffered}
                    </span>
                )}
                {drive.deadline && (
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> {format(new Date(drive.deadline), "MMM d, yyyy")}
                    </span>
                )}
            </div>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
                <Link href={`/api/drives/${driveId}/export`} download>
                <Download className="w-4 h-4 mr-2" /> Export All
                </Link>
            </Button>
            <Button asChild variant="default" size="sm">
                <Link href={`/api/drives/${driveId}/export?shortlistedOnly=true`} download>
                <Star className="w-4 h-4 mr-2" /> Export Shortlisted
                </Link>
            </Button>
        </div>
      </div>

      {/* ── Mini Stat Chips ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-md p-4 bg-card text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
            <Users className="h-3.5 w-3.5" /> Total Candidates
          </p>
          <p className="text-2xl font-mono font-medium text-foreground">{rows.length}</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-card text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Average Score
          </p>
          <p className="text-2xl font-mono font-medium text-foreground">{avgScore}%</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-card text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
            <Award className="h-3.5 w-3.5" /> Top Match
          </p>
          <p className="text-2xl font-mono font-medium text-foreground">{topScore}%</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-card text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
            <Star className="h-3.5 w-3.5" /> Shortlisted
          </p>
          <p className="text-2xl font-mono font-medium text-foreground">{shortlistedCount}</p>
        </div>
      </div>

      {/* ── Rankings Table (Client Component) ────────────────────────────── */}
      <RankingsTable
        rankings={rows.map(r => ({
          ...r,
          matchedSkills: r.matchedSkills as string[],
          missingSkills: r.missingSkills as string[],
          shortlisted: r.shortlisted ?? null,
          studentName: r.studentName ?? "Unknown Student"
        }))}
        driveId={driveId}
        viewerRole={viewerRole}
      />

      {isTruncated && (
        <div className="border border-border bg-secondary/50 rounded-md p-4 text-sm text-foreground">
          Showing the first {MAX_RANKINGS_ROWS} candidates for performance. Use CSV export for full data.
        </div>
      )}

      {/* ── Summary Rules ──────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-6 pt-4">
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Eligible + Scored</h3>
            <span className="text-xs font-medium text-muted-foreground">{eligibleRankings.length}</span>
          </div>
          <div className="space-y-2">
            {eligibleRankings.slice(0, 5).map((r) => (
                <div key={r.studentId} className="flex justify-between items-center text-sm">
                    <span className="text-foreground truncate max-w-[180px]">#{r.rankPosition} {r.studentName}</span>
                    <span className="text-muted-foreground font-mono">{r.matchScore.toFixed(1)}%</span>
                </div>
            ))}
            {eligibleRankings.length > 5 && <p className="text-xs text-muted-foreground pt-1">and {eligibleRankings.length - 5} more</p>}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Profile Incomplete</h3>
            <span className="text-xs font-medium text-muted-foreground">{incompleteRankings.length}</span>
          </div>
          <div className="space-y-2">
            {incompleteRankings.slice(0, 5).map((r) => (
                <div key={r.studentId} className="flex justify-between items-center text-sm">
                    <span className="text-foreground truncate max-w-[180px]">#{r.rankPosition} {r.studentName}</span>
                    <span className="text-muted-foreground text-xs bg-secondary px-1.5 py-0.5 rounded">Incomplete</span>
                </div>
            ))}
            {incompleteRankings.length > 5 && <p className="text-xs text-muted-foreground pt-1">and {incompleteRankings.length - 5} more</p>}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Ineligible</h3>
            <span className="text-xs font-medium text-muted-foreground">{ineligibleRankings.length}</span>
          </div>
          <div className="space-y-2">
            {ineligibleRankings.slice(0, 5).map((r) => (
                <div key={r.studentId} className="flex justify-between items-center text-sm">
                    <span className="text-foreground truncate max-w-[120px]">#{r.rankPosition} {r.studentName}</span>
                    <span className="text-muted-foreground text-xs truncate max-w-[100px] text-right" title={r.ineligibilityReason ?? "Does not meet criteria"}>
                        {r.ineligibilityReason ?? "Does not meet criteria"}
                    </span>
                </div>
            ))}
            {ineligibleRankings.length > 5 && <p className="text-xs text-muted-foreground pt-1">and {ineligibleRankings.length - 5} more</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
