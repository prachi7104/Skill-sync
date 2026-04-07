export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { enforceProfileGate, enforceRankingsExist, GuardrailViolation } from "@/lib/guardrails";
import Link from "next/link";
import AnalysisPanel from "./analysis-panel";
import MarkdownRenderer from "@/components/shared/markdown-renderer";

interface PageProps {
  params: { driveId: string };
}

export default async function StudentDriveRankingPage({ params }: PageProps) {
  const user = await requireRole(["student"]);
  const { driveId } = params;

  // ── Validate UUID ──────────────────────────────────────────────────────
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!driveId || !uuidRegex.test(driveId)) {
    notFound();
  }

  // ── Fetch drive (minimal, non-leaky) ───────────────────────────────────
  const [drive] = await db
    .select({
      id: drives.id,
      company: drives.company,
      roleTitle: drives.roleTitle,
      rankingsVisible: drives.rankingsVisible,
    })
    .from(drives)
    .where(eq(drives.id, driveId))
    .limit(1);

  if (!drive) {
    notFound();
  }

  if (!drive.rankingsVisible && user.role === "student") {
    return (
      <div className="text-center p-12">
        <p className="text-slate-400">Rankings for this drive have not been published yet.</p>
      </div>
    );
  }

  // ── Phase 5.5: Profile gate + rankings existence ───────────────────────
  let guardrailError: { code: string; reason: string; nextStep: string } | null = null;
  try {
    await enforceProfileGate(user.id);
    await enforceRankingsExist(driveId);
  } catch (err) {
    if (err instanceof GuardrailViolation) {
      guardrailError = { code: err.code, reason: err.reason, nextStep: err.nextStep };
    } else {
      throw err;
    }
  }

  if (guardrailError) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Ranking — {drive.company}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{drive.roleTitle}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-muted-foreground font-medium">{guardrailError.reason}</p>
            <p className="text-sm text-muted-foreground">{guardrailError.nextStep}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Fetch only this student's ranking ──────────────────────────────────
  // Query-level enforcement: WHERE student_id = auth user ID
  const [myRanking] = await db
    .select({
      rankPosition: rankings.rankPosition,
      matchScore: rankings.matchScore,
      semanticScore: rankings.semanticScore,
      structuredScore: rankings.structuredScore,
      matchedSkills: rankings.matchedSkills,
      missingSkills: rankings.missingSkills,
      shortExplanation: rankings.shortExplanation,
      detailedExplanation: rankings.detailedExplanation,
    })
    .from(rankings)
    .where(
      and(
        eq(rankings.driveId, driveId),
        eq(rankings.studentId, user.id),
      ),
    )
    .limit(1);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Link
          href="/student/drives"
          className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Drives
        </Link>
        <div>
        <h1 className="text-2xl font-bold tracking-tight">
          My Ranking — {drive.company}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {drive.roleTitle}
        </p>
        </div>
      </div>

      {!myRanking ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground font-medium">
              You are not ranked for this drive.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Rankings may not have been generated yet, or you may not be eligible for this drive.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Match Result</CardTitle>
              <CardDescription>{myRanking.shortExplanation.replace(/^#+\s*/gm, "")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <ScoreTile
                  label="Rank"
                  value={myRanking.rankPosition > 0 ? `#${myRanking.rankPosition}` : "Ineligible"}
                />
                <ScoreTile
                  label="Match Score"
                  value={myRanking.matchScore.toFixed(1)}
                />
                <ScoreTile
                  label="Semantic"
                  value={myRanking.semanticScore.toFixed(1)}
                />
                <ScoreTile
                  label="Structured"
                  value={myRanking.structuredScore.toFixed(1)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 text-green-700">
                  Matched Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(myRanking.matchedSkills as string[]).length > 0 ? (
                    (myRanking.matchedSkills as string[]).map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2 text-red-700">
                  Missing Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(myRanking.missingSkills as string[]).length > 0 ? (
                    (myRanking.missingSkills as string[]).map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Explanation</CardTitle>
              <CardDescription>
                Detailed scoring breakdown for your ranking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer
                content={myRanking.detailedExplanation}
                className="text-sm"
              />
            </CardContent>
          </Card>

          <AnalysisPanel driveId={driveId} />
        </>
      )}
    </div>
  );
}

/** Small helper component for the score tiles. */
function ScoreTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
