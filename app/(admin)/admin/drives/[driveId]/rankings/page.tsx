export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, students, users } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { enforceRankingsExist, GuardrailViolation } from "@/lib/guardrails";
import DriveRankingsView, { type RankingRow } from "@/components/drives/drive-rankings-view";

interface PageProps {
  params: { driveId: string };
}

export default async function AdminDriveRankingsPage({ params }: PageProps) {
  const admin = await requireRole(["admin"]);
  const { driveId } = params;
  const MAX_RANKINGS_ROWS = 2000;

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

  // Scope: admins are college-scoped.
  if (!admin.collegeId || drive.collegeId !== admin.collegeId) {
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Rankings</h1>
          <p className="text-sm text-muted-foreground">
            {drive.company} • {drive.roleTitle}
          </p>
        </div>
        <Card className="border-warning/20 bg-card shadow-sm">
          <CardContent className="space-y-4 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">{guardrailError.reason}</p>
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
    })
    .from(rankings)
    .innerJoin(students, eq(rankings.studentId, students.id))
    .innerJoin(users, eq(students.id, users.id))
    .where(eq(rankings.driveId, driveId))
    .orderBy(desc(rankings.isEligible), asc(rankings.rankPosition))
    .limit(MAX_RANKINGS_ROWS + 1);

  const isTruncated = rowsRaw.length > MAX_RANKINGS_ROWS;
  const rows: RankingRow[] = (isTruncated ? rowsRaw.slice(0, MAX_RANKINGS_ROWS) : rowsRaw).map(
    (r) => ({
      ...r,
      matchedSkills: r.matchedSkills as string[],
      missingSkills: r.missingSkills as string[],
      shortlisted: r.shortlisted ?? null,
      studentName: r.studentName ?? "Unknown Student",
    }),
  );

  // ── Compute score distribution ─────────────────────────────────────────
  const buckets = [0, 20, 40, 60, 80, 100];
  const distribution = buckets.slice(0, -1).map((min, i) => {
    const max = buckets[i + 1];
    let count = rows.filter((r) => r.matchScore >= min && r.matchScore < max).length;
    if (max === 100) {
      count += rows.filter((r) => r.matchScore === 100).length;
    }
    return { label: `${min}–${max}`, count };
  });

  return (
    <DriveRankingsView
      driveId={driveId}
      rankings={rows}
      drive={drive}
      backHref="/admin/drives"
      isTruncated={isTruncated}
      maxRankingsRows={MAX_RANKINGS_ROWS}
      distribution={distribution}
      userRole="admin"
    />
  );
}
