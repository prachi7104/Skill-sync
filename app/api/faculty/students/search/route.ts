import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq, and, ilike, or, count, sql, SQL } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["faculty", "admin"]);

    if (!user.collegeId) {
      return NextResponse.json({ students: [], total: 0, page: 1 }, { status: 200 });
    }

    const url = new URL(req.url);

    // ── Fast path: return just filter options ──
    if (url.searchParams.get("filtersOnly") === "true") {
      const [branchRows, yearRows] = await Promise.all([
        db
          .selectDistinct({ branch: students.branch })
          .from(students)
          .where(eq(students.collegeId, user.collegeId!))
          .then((rows) => rows.map((r) => r.branch).filter((branch): branch is string => Boolean(branch)).sort()),
        db
          .selectDistinct({ batchYear: students.batchYear })
          .from(students)
          .where(eq(students.collegeId, user.collegeId!))
          .then((rows) =>
            rows
              .map((r) => r.batchYear)
              .filter((y): y is number => y !== null)
              .sort((a, b) => b - a)
          ),
      ]);

      return NextResponse.json({ branches: branchRows, batchYears: yearRows });
    }

    const q = url.searchParams.get("q") || "";
    const branch = url.searchParams.get("branch") || "";
    const batchYear = url.searchParams.get("batchYear") || "";
    const verificationFilter = url.searchParams.get("verification") || "";
    const pageValue = Number(url.searchParams.get("page") || "1");
    const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;

    const whereConditions: SQL[] = [eq(students.collegeId, user.collegeId)];

    if (q.trim()) {
      whereConditions.push(
        or(
          ilike(users.name, `%${q}%`),
          ilike(users.email, `%${q}%`),
          ilike(students.sapId, `%${q}%`)
        )!
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

    if (verificationFilter && verificationFilter !== "all") {
      whereConditions.push(eq(sql<string>`verification_status`, verificationFilter));
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
        verificationStatus: sql<string>`verification_status`.as("verificationStatus"),
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
