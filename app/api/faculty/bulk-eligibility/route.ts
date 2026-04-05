import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, students } from "@/lib/db/schema";
import { expandBranches } from "@/lib/constants/branches";

const querySchema = z.object({
  driveId: z.string().uuid(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    const { searchParams } = new URL(req.url);

    if (!user.collegeId) {
      return NextResponse.json({ message: "College not found" }, { status: 400 });
    }

    const parsed = querySchema.safeParse({ driveId: searchParams.get("driveId") });
    if (!parsed.success) {
      return NextResponse.json({ message: "driveId is required" }, { status: 400 });
    }

    const drive = await db.query.drives.findFirst({
      where: and(eq(drives.id, parsed.data.driveId), eq(drives.collegeId, user.collegeId)),
    });
    if (!drive) {
      return NextResponse.json({ message: "Drive not found" }, { status: 404 });
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const pool = await db.query.students.findMany({
      where: eq(students.collegeId, user.collegeId),
      columns: {
        id: true,
        cgpa: true,
        branch: true,
        batchYear: true,
        category: true,
      },
    });

    const eligible = pool.filter((candidate) => {
      if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
        if (candidate.cgpa === null || candidate.cgpa === undefined || candidate.cgpa < drive.minCgpa) return false;
      }

      const branches = drive.eligibleBranches as string[] | null;
      if (branches?.length) {
        if (!candidate.branch) return false;
        const expandedBranches = expandBranches(branches).map((v) => v.toLowerCase().trim());
        if (!expandedBranches.includes(candidate.branch.toLowerCase().trim())) return false;
      }

      const years = drive.eligibleBatchYears as number[] | null;
      if (years?.length) {
        if (candidate.batchYear === null || candidate.batchYear === undefined || !years.includes(candidate.batchYear)) return false;
      }

      const categories = drive.eligibleCategories as string[] | null;
      if (categories?.length) {
        if (!candidate.category || !categories.includes(candidate.category)) return false;
      }

      return true;
    });

    return NextResponse.json({
      totalStudents: pool.length,
      eligibleStudents: eligible.length,
      ineligibleStudents: Math.max(pool.length - eligible.length, 0),
    });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ message: "Failed to compute eligibility" }, { status: 500 });
  }
}
