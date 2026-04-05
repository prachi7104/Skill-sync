import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq, and, ilike, or, count, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["faculty", "admin"]);

    if (!user.collegeId) {
      return NextResponse.json({ students: [], total: 0, page: 1 }, { status: 200 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const branch = url.searchParams.get("branch") || "";
    const batchYear = url.searchParams.get("batchYear") || "";
    const pageValue = Number(url.searchParams.get("page") || "1");
    const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;

    const whereConditions: any[] = [eq(students.collegeId, user.collegeId)];

    if (q.trim()) {
      whereConditions.push(
        or(
          ilike(users.name, `%${q}%`),
          ilike(users.email, `%${q}%`),
          ilike(students.sapId, `%${q}%`)
        ) as any
      );
    }

    if (branch && branch !== "all") {
      whereConditions.push(eq(students.branch, branch));
    }

    if (batchYear && batchYear !== "all") {
      const parsedBatchYear = Number(batchYear);
      if (!Number.isInteger(parsedBatchYear)) {
        return NextResponse.json({ error: "Invalid batchYear" }, { status: 400 });
      }
      whereConditions.push(eq(students.batchYear, parsedBatchYear));
    }

    const whereClause = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);

    const [{ total }] = await db
      .select({ total: count() })
      .from(students)
      .innerJoin(users, eq(students.id, users.id))
      .where(whereClause);

    const offset = (page - 1) * 20;

    const results = await db
      .select({
        id: students.id,
        name: users.name,
        email: users.email,
        sapId: students.sapId,
        rollNo: students.rollNo,
        branch: students.branch,
        batchYear: students.batchYear,
        cgpa: students.cgpa,
        category: students.category,
        profileCompleteness: students.profileCompleteness,
        tenthPercentage: students.tenthPercentage,
        twelfthPercentage: students.twelfthPercentage,
        semester: students.semester,
        resumeUrl: students.resumeUrl,
        resumeFilename: students.resumeFilename,
        resumeUploadedAt: students.resumeUploadedAt,
        skills: students.skills,
        projects: students.projects,
        workExperience: students.workExperience,
        certifications: students.certifications,
        codingProfiles: students.codingProfiles,
        researchPapers: students.researchPapers,
        achievements: students.achievements,
        softSkills: students.softSkills,
        hasEmbedding: sql<boolean>`${students.embedding} IS NOT NULL`.as("hasEmbedding"),
      })
      .from(students)
      .innerJoin(users, eq(students.id, users.id))
      .where(whereClause)
      .orderBy(users.name)
      .limit(20)
      .offset(offset);

    return NextResponse.json(
      {
        students: results,
        total: Number(total ?? 0),
        page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Faculty Students Search] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
