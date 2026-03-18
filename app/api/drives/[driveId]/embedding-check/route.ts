import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function GET(
  _req: NextRequest,
  { params }: { params: { driveId: string } },
) {
  try {
    const user = await requireRole(["faculty", "admin"]);

    const [drive] = await db
      .select({
        id: drives.id,
        minCgpa: drives.minCgpa,
        eligibleBranches: drives.eligibleBranches,
        eligibleBatchYears: drives.eligibleBatchYears,
        eligibleCategories: drives.eligibleCategories,
      })
      .from(drives)
      .where(eq(drives.id, params.driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (!user.collegeId) {
      return NextResponse.json({ error: "No college associated with this account" }, { status: 400 });
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

    const eligible = studentRows.filter((s) => {
      if ((s.onboardingStep ?? 0) < 1) return false;
      if (drive.minCgpa != null && (s.cgpa == null || s.cgpa < drive.minCgpa)) return false;

      if (eligibleBranches && eligibleBranches.length > 0) {
        if (!s.branch) return false;
        if (!eligibleBranches.map((b) => b.toLowerCase().trim()).includes(s.branch.toLowerCase().trim())) {
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

      return true;
    });

    const withEmbedding = eligible.filter((s) => Array.isArray(s.embedding) && s.embedding.length > 0).length;

    return NextResponse.json({
      total: eligible.length,
      withEmbedding,
    });
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
