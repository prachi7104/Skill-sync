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
      createdBy: drives.createdBy,
    })
    .from(drives)
    .where(eq(drives.id, driveId))
    .limit(1);

  if (!drive) {
    notFound();
  }

  // Ownership: faculty must own drive, admin bypasses
  if (user.role === "faculty" && drive.createdBy !== user.id) {
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
            <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900">{guardrailError.reason}</p>
              <p className="text-sm text-muted-foreground">{guardrailError.nextStep}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Fetch richer data ──────────────────────────────────────────────────
  const rows = await db
    .select({
      rankPosition: rankings.rankPosition,
      matchScore: rankings.matchScore,
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
    .orderBy(asc(rankings.rankPosition));

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
      <Card className="overflow-hidden border-none shadow-md ring-1 ring-slate-200">
        <div className="bg-slate-50 border-b p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={cn(
              "h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-black text-white uppercase shadow-lg ring-4 ring-white",
              getCompanyColor(drive.company)
            )}>
              {drive.company.slice(0, 2)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{drive.company}</h1>
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
            <Button asChild variant="outline" size="sm" className="h-10 text-xs font-bold gap-2 border-slate-200 hover:bg-white hover:text-indigo-600 transition-all shadow-sm">
              <Link href={`/api/drives/${driveId}/export`} download>
                <Download className="h-3.5 w-3.5" /> Export All CSV
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-10 text-xs font-bold gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
              <Link href={`/api/drives/${driveId}/export?shortlistedOnly=true`} download>
                <Star className="h-3.5 w-3.5 fill-current" /> Export Shortlisted
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Mini Stat Chips ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100 border-t bg-white">
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Users className="h-3 w-3" /> Total Candidates
            </p>
            <p className="text-3xl font-mono font-black text-slate-900 leading-none">{rows.length}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <TrendingUp className="h-3 w-3" /> Average Score
            </p>
            <p className="text-3xl font-mono font-black text-slate-900 leading-none">{avgScore}%</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Award className="h-3 w-3" /> Top Match
            </p>
            <p className="text-3xl font-mono font-black text-slate-900 leading-none">{topScore}%</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Star className="h-3 w-3 fill-current" /> Shortlisted
            </p>
            <p className="text-3xl font-mono font-black text-slate-900 leading-none">{shortlistedCount}</p>
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
      />
    </div>
  );
}
