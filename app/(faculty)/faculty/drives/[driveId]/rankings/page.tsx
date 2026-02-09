import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, students, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
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
import { enforceRankingsExist, GuardrailViolation } from "@/lib/guardrails";

interface PageProps {
  params: { driveId: string };
}

export default async function FacultyDriveRankingsPage({ params }: PageProps) {
  const user = await requireRole(["faculty", "admin"]);
  const { driveId } = params;

  // ── Validate UUID ──────────────────────────────────────────────────────
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!driveId || !uuidRegex.test(driveId)) {
    notFound();
  }

  // ── Fetch drive ────────────────────────────────────────────────────────
  const [drive] = await db
    .select({
      id: drives.id,
      company: drives.company,
      roleTitle: drives.roleTitle,
      createdBy: drives.createdBy,
    })
    .from(drives)
    .where(eq(drives.id, driveId))
    .limit(1);

  if (!drive) {
    notFound();
  }

  // ── Ownership: faculty must own drive, admin bypasses ──────────────────
  if (user.role === "faculty" && drive.createdBy !== user.id) {
    notFound();
  }

  // ── Phase 5.5: Enforce rankings exist ──────────────────────────────────
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rankings — {drive.company}: {drive.roleTitle}
          </h1>
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

  // ── Fetch ranked list ──────────────────────────────────────────────────
  const rows = await db
    .select({
      rankPosition: rankings.rankPosition,
      matchScore: rankings.matchScore,
      semanticScore: rankings.semanticScore,
      structuredScore: rankings.structuredScore,
      matchedSkills: rankings.matchedSkills,
      missingSkills: rankings.missingSkills,
      shortExplanation: rankings.shortExplanation,
      detailedExplanation: rankings.detailedExplanation,
      studentName: users.name,
      sapId: students.sapId,
      rollNo: students.rollNo,
    })
    .from(rankings)
    .innerJoin(students, eq(rankings.studentId, students.id))
    .innerJoin(users, eq(students.id, users.id))
    .where(eq(rankings.driveId, driveId))
    .orderBy(asc(rankings.rankPosition));

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Rankings — {drive.company}: {drive.roleTitle}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {rows.length} student{rows.length !== 1 ? "s" : ""} ranked
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No rankings have been generated for this drive yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Run ranking computation first via the drive management page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ranked Candidates</CardTitle>
            <CardDescription>
              Sorted by rank. Includes match scores and AI-generated explanations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">Match</TableHead>
                    <TableHead className="text-center">Semantic</TableHead>
                    <TableHead className="text-center">Structured</TableHead>
                    <TableHead>Explanation</TableHead>
                    <TableHead>Skills</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center font-bold">
                        {r.rankPosition}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.sapId && <>SAP: {r.sapId}</>}
                          {r.sapId && r.rollNo && <> · </>}
                          {r.rollNo && <>Roll: {r.rollNo}</>}
                          {!r.sapId && !r.rollNo && <>—</>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {r.matchScore.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {r.semanticScore.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {r.structuredScore.toFixed(1)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate" title={r.shortExplanation}>
                          {r.shortExplanation}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {(r.matchedSkills as string[]).slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
