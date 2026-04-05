import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, students, jobs } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { expandBranches } from "@/lib/constants/branches";

export async function POST(
  _req: NextRequest,
  { params }: { params: { driveId: string } },
) {
  try {
    const user = await requireRole(["faculty", "admin"]);

    if (!user.collegeId) {
      return NextResponse.json({ error: "No college associated with this account" }, { status: 400 });
    }

    const [drive] = await db
      .select({
        id: drives.id,
        createdBy: drives.createdBy,
        collegeId: drives.collegeId,
        minCgpa: drives.minCgpa,
        eligibleBranches: drives.eligibleBranches,
        eligibleBatchYears: drives.eligibleBatchYears,
        eligibleCategories: drives.eligibleCategories,
      })
      .from(drives)
      .where(and(eq(drives.id, params.driveId), eq(drives.collegeId, user.collegeId)))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentRows = await db
      .select({
        id: students.id,
        embedding: students.embedding,
        onboardingStep: students.onboardingStep,
        cgpa: students.cgpa,
        branch: students.branch,
        batchYear: students.batchYear,
        category: students.category,
      })
      .from(students)
      .where(eq(students.collegeId, user.collegeId));

    const eligibleBranches = (drive.eligibleBranches as string[] | null) ?? null;
    const eligibleBatchYears = (drive.eligibleBatchYears as number[] | null) ?? null;
    const eligibleCategories = (drive.eligibleCategories as string[] | null) ?? null;
    const normalizedEligibleBranches =
      eligibleBranches && eligibleBranches.length > 0
        ? new Set(expandBranches(eligibleBranches).map((b) => b.toLowerCase().trim()))
        : null;

    const missingIds = studentRows
      .filter((s) => {
        if ((s.onboardingStep ?? 0) < 1) return false;
        if (drive.minCgpa != null && (s.cgpa == null || s.cgpa < drive.minCgpa)) return false;

        if (normalizedEligibleBranches && normalizedEligibleBranches.size > 0) {
          if (!s.branch) return false;
          if (!normalizedEligibleBranches.has(s.branch.toLowerCase().trim())) {
            return false;
          }
        }

        if (eligibleBatchYears && eligibleBatchYears.length > 0) {
          if (s.batchYear == null) return false;
          if (!eligibleBatchYears.includes(s.batchYear)) return false;
        }

        if (eligibleCategories && eligibleCategories.length > 0) {
          if (!s.category) return false;
          if (!eligibleCategories.includes(s.category)) return false;
        }

        return !(Array.isArray(s.embedding) && s.embedding.length > 0);
      })
      .map((s) => s.id);

    if (missingIds.length === 0) {
      return NextResponse.json({ queued: 0, skipped: 0, message: "No missing embeddings." });
    }

    const existingRows = await db
      .select({ targetId: sql<string>`${jobs.payload}->>'targetId'` })
      .from(jobs)
      .where(
        and(
          eq(jobs.type, "generate_embedding"),
          sql`${jobs.status} IN ('pending', 'processing')`,
          sql`${jobs.payload}->>'targetType' = 'student'`,
          inArray(sql<string>`${jobs.payload}->>'targetId'`, missingIds),
        ),
      );

    const existingTargetIds = new Set(existingRows.map((r) => r.targetId));
    const toQueue = missingIds.filter((id) => !existingTargetIds.has(id));

    if (toQueue.length > 0) {
      await db.insert(jobs).values(
        toQueue.map((studentId) => ({
          type: "generate_embedding" as const,
          status: "pending" as const,
          priority: 7,
          payload: { targetType: "student", targetId: studentId },
        })),
      );
    }

    return NextResponse.json({
      queued: toQueue.length,
      skipped: missingIds.length - toQueue.length,
      totalMissing: missingIds.length,
    });
  } catch (error: unknown) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
