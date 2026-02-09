import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { rankings, drives } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { enforceProfileGate, enforceRankingsExist, GuardrailViolation } from "@/lib/guardrails";

/**
 * GET /api/drives/[driveId]/rankings/me
 *
 * Student endpoint: returns only the authenticated student's own ranking
 * entry for the specified drive.
 *
 * Authorization:
 *  - student role only
 *  - WHERE student_id = auth user ID (query-level enforcement)
 *
 * Response shape (ranked):
 *  {
 *    drive: { id, company, roleTitle },
 *    ranking: { rank, matchScore, semanticScore, structuredScore, matchedSkills, missingSkills, shortExplanation, detailedExplanation }
 *  }
 *
 * Response shape (not ranked):
 *  { drive: { id, company, roleTitle }, ranking: null }
 *
 * Security:
 *  - Returns exactly 0 or 1 row
 *  - Student cannot infer other students' ranks, count, or score distribution
 *  - No information about other candidates is exposed
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { driveId: string } },
) {
  try {
    const user = await requireRole(["student"]);
    const { driveId } = params;

    // ── Validate driveId format ──────────────────────────────────────────
    if (!driveId || typeof driveId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid driveId" },
        { status: 400 },
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(driveId)) {
      return NextResponse.json(
        { error: "Invalid driveId format" },
        { status: 400 },
      );
    }

    // ── Fetch drive (minimal fields, no ownership data) ──────────────────
    const [drive] = await db
      .select({
        id: drives.id,
        company: drives.company,
        roleTitle: drives.roleTitle,
      })
      .from(drives)
      .where(eq(drives.id, driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json(
        { error: "Drive not found" },
        { status: 404 },
      );
    }

    // ── Phase 5.5: Profile gate — student must meet minimum bar ──────────
    await enforceProfileGate(user.id);

    // ── Phase 5.5: Rankings must exist for this drive ────────────────────
    await enforceRankingsExist(driveId);

    // ── Fetch only this student's ranking ────────────────────────────────
    // Query-level access control: WHERE student_id = authenticated user ID
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

    return NextResponse.json(
      {
        drive: {
          id: drive.id,
          company: drive.company,
          roleTitle: drive.roleTitle,
        },
        ranking: myRanking
          ? {
              rank: myRanking.rankPosition,
              matchScore: myRanking.matchScore,
              semanticScore: myRanking.semanticScore,
              structuredScore: myRanking.structuredScore,
              matchedSkills: myRanking.matchedSkills,
              missingSkills: myRanking.missingSkills,
              shortExplanation: myRanking.shortExplanation,
              detailedExplanation: myRanking.detailedExplanation,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[GET /api/drives/[driveId]/rankings/me]", err);

    const message = err?.message ?? "Internal server error";

    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Phase 5.5: Structured guardrail errors
    if (err instanceof GuardrailViolation) {
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    return NextResponse.json(
      { error: "Failed to retrieve your ranking" },
      { status: 500 },
    );
  }
}
