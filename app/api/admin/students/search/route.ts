import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Auth check
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user to verify they are admin/faculty and get collegeId
    const userRow = await db
      .select({ role: users.role, collegeId: users.collegeId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!userRow.length || !["admin", "faculty"].includes(userRow[0]?.role ?? "")) {
      return NextResponse.json(
        { error: "Admin or Faculty access required" },
        { status: 403 }
      );
    }

    const adminCollegeId = userRow[0].collegeId;

    // Parse query parameters
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const branch = url.searchParams.get("branch") || "";
    const batchYear = url.searchParams.get("batchYear") || "";
    const verificationFilter = url.searchParams.get("verification") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    // Build WHERE conditions array
    const whereConditions: any[] = [eq(students.collegeId, adminCollegeId!)];

    // Search filter: name, email, or SAP ID
    if (q.trim()) {
      whereConditions.push(
        or(
          ilike(users.name, `%${q}%`),
          ilike(users.email, `%${q}%`),
          ilike(students.sapId, `%${q}%`)
        ) as any
      );
    }

    // Branch filter
    if (branch && branch !== "all") {
      whereConditions.push(eq(students.branch, branch));
    }

    // Batch year filter
    if (batchYear && batchYear !== "all") {
      whereConditions.push(eq(students.batchYear, parseInt(batchYear, 10)));
    }

    if (verificationFilter && verificationFilter !== "all") {
      whereConditions.push(eq(sql<string>`verification_status`, verificationFilter));
    }

    // Get total count
    const countResult = await db
      .select({ count: students.id })
      .from(students)
      .innerJoin(users, eq(students.id, users.id))
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));

    const total = countResult.length;

    // Get paginated results
    const offset = (page - 1) * 20;
    const results = await db
      .select({
        // User fields
        id: students.id,
        name: users.name,
        email: users.email,
        // Student fields
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
        embedding: students.embedding,
      })
      .from(students)
      .innerJoin(users, eq(students.id, users.id))
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
      .orderBy(users.name)
      .limit(20)
      .offset(offset);

    return NextResponse.json(
      {
        students: results.map((r) => ({
          ...r,
          hasEmbedding: r.embedding !== null,
          embedding: undefined, // Don't return the vector to client
        })),
        total,
        page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Students Search] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
