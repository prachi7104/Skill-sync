import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { rankings, drives, students, users } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { enforceRankingsExist, GuardrailViolation } from "@/lib/guardrails";
import { isRedirectError } from "next/dist/client/components/redirect";

/**
 * GET /api/drives/[driveId]/rankings
 *
 * Faculty/Admin endpoint: returns the complete ranked list for a drive.
 *
 * Authorization:
 *  - faculty: drives within their college
 *  - admin: any drive
 *
 * Response shape:
 *  {
 *    drive: { id, company, roleTitle },
 *    rankings: [{ rank, studentName, sapId, rollNo, matchScore, semanticScore, structuredScore, matchedSkills, missingSkills, shortExplanation, detailedExplanation }]
 *  }
 *
 * Security:
 *  - No resume URLs
 *  - No private student profile fields
 *  - No student user IDs
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { driveId: string } },
) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    const { driveId } = params;
    const url = new URL(req.url);
    const pageValue = Number(url.searchParams.get("page") ?? "1");
    const pageSizeValue = Number(url.searchParams.get("pageSize") ?? "200");
    const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
    const pageSize = Number.isFinite(pageSizeValue)
      ? Math.min(Math.max(Math.floor(pageSizeValue), 1), 1000)
      : 200;
    const offset = (page - 1) * pageSize;

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

    // ── Fetch drive ──────────────────────────────────────────────────────
    const [drive] = await db
      .select({
        id: drives.id,
        company: drives.company,
        roleTitle: drives.roleTitle,
        collegeId: drives.collegeId,
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

    // ── College scope check for faculty/admin ─────────────────────────────
    if (!user.collegeId || drive.collegeId !== user.collegeId) {
      return NextResponse.json(
        { error: "Forbidden: drive not in your college" },
        { status: 403 },
      );
    }

    // ── Phase 5.5: Enforce rankings exist before querying ────────────────
    await enforceRankingsExist(driveId);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(rankings)
      .where(eq(rankings.driveId, driveId));

    // ── Fetch rankings joined with student identity ──────────────────────
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
      .orderBy(asc(rankings.rankPosition))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json(
      {
        drive: {
          id: drive.id,
          company: drive.company,
          roleTitle: drive.roleTitle,
        },
        rankings: rows.map((r) => ({
          rank: r.rankPosition,
          studentName: r.studentName,
          sapId: r.sapId ?? null,
          rollNo: r.rollNo ?? null,
          matchScore: r.matchScore,
          semanticScore: r.semanticScore,
          structuredScore: r.structuredScore,
          matchedSkills: r.matchedSkills,
          missingSkills: r.missingSkills,
          shortExplanation: r.shortExplanation,
          detailedExplanation: r.detailedExplanation,
        })),
        pagination: {
          page,
          pageSize,
          total: Number(total ?? 0),
        },
      },
      { status: 200 },
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (isRedirectError(err)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[GET /api/drives/[driveId]/rankings]", err);

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
      { error: "Failed to retrieve rankings" },
      { status: 500 },
    );
  }
}
