import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, students, users } from "@/lib/db/schema";
import { expandBranches } from "@/lib/constants/branches";

type DriveRow = {
  id: string;
  company: string;
  roleTitle: string;
  deadline: Date | null;
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: string[] | null;
};

function isStudentEligibleForDrive(drive: DriveRow, student: {
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: string | null;
}) {
  if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
    if (student.cgpa === null || student.cgpa === undefined || student.cgpa < drive.minCgpa) return false;
  }
  if (drive.eligibleBranches?.length) {
    if (!student.branch) return false;
    const expanded = expandBranches(drive.eligibleBranches).map((b) => b.toLowerCase().trim());
    if (!expanded.includes(student.branch.toLowerCase().trim())) return false;
  }
  if (drive.eligibleBatchYears?.length) {
    if (student.batchYear === null || student.batchYear === undefined || !drive.eligibleBatchYears.includes(student.batchYear)) return false;
  }
  if (drive.eligibleCategories?.length) {
    if (!student.category || !drive.eligibleCategories.includes(student.category)) return false;
  }
  return true;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireRole(["faculty", "admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ conflicts: [] });
    }

    const activeDriveRows = await db
      .select({
        id: drives.id,
        company: drives.company,
        roleTitle: drives.roleTitle,
        deadline: drives.deadline,
        minCgpa: drives.minCgpa,
        eligibleBranches: drives.eligibleBranches,
        eligibleBatchYears: drives.eligibleBatchYears,
        eligibleCategories: drives.eligibleCategories,
      })
      .from(drives)
      .innerJoin(users, eq(users.id, drives.createdBy))
      .where(
        user.role === "faculty"
          ? and(eq(drives.isActive, true), eq(drives.createdBy, user.id))
          : and(eq(drives.isActive, true), eq(users.collegeId, user.collegeId)),
      )
      .orderBy(desc(drives.createdAt));

    const studentPool = await db
      .select({
        id: students.id,
        cgpa: students.cgpa,
        branch: students.branch,
        batchYear: students.batchYear,
        category: students.category,
      })
      .from(students)
      .where(and(eq(students.collegeId, user.collegeId), sql`${students.profileCompleteness} >= 80`));

    const total = studentPool.length;
    const conflicts: Array<{ drive1: DriveRow; drive2: DriveRow; overlapPercent: number; overlapCount: number }> = [];

    for (let i = 0; i < activeDriveRows.length; i += 1) {
      for (let j = i + 1; j < activeDriveRows.length; j += 1) {
        const drive1 = activeDriveRows[i] as DriveRow;
        const drive2 = activeDriveRows[j] as DriveRow;

        if (drive1.deadline && drive2.deadline) {
          const diff = Math.abs(new Date(drive1.deadline).getTime() - new Date(drive2.deadline).getTime());
          if (diff > 7 * 24 * 60 * 60 * 1000) continue;
        }

        const overlapCount = studentPool.filter(
          (student) => isStudentEligibleForDrive(drive1, student) && isStudentEligibleForDrive(drive2, student),
        ).length;

        if (overlapCount === 0) continue;

        const overlapPercent = total > 0 ? Math.round((overlapCount / total) * 100) : 0;
        if (overlapPercent >= 30) {
          conflicts.push({ drive1, drive2, overlapPercent, overlapCount });
        }
      }
    }

    return NextResponse.json({ conflicts: conflicts.sort((a, b) => b.overlapPercent - a.overlapPercent) });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to detect conflicts" }, { status: 500 });
  }
}