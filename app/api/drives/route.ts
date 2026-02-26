import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drives, jobs, students, rankings } from "@/lib/db/schema";
import { requireRoleApi, requireStudentProfileApi, ApiError } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ── Zod Schema for drive creation ───────────────────────────────────────────

const createDriveSchema = z.object({
  company: z.string().min(1, "Company name is required").max(255),
  roleTitle: z.string().min(1, "Role title is required").max(255),
  location: z.string().max(255).optional().nullable(),
  packageOffered: z.string().max(100).optional().nullable(),
  rawJd: z.string().min(10, "Job description must be at least 10 characters"),
  minCgpa: z.number().min(0).max(10).optional().nullable(),
  eligibleBranches: z.array(z.string()).optional().nullable(),
  eligibleBatchYears: z.array(z.number().int()).optional().nullable(),
  eligibleCategories: z
    .array(z.enum(["alpha", "beta", "gamma"]))
    .optional()
    .nullable(),
  deadline: z.string().datetime().optional().nullable(),
});

// ── POST /api/drives — Create a new drive ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleApi(["faculty", "admin"]);

    const body = await req.json();
    const parsed = createDriveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Insert drive
    const [drive] = await db
      .insert(drives)
      .values({
        createdBy: user.id,
        company: data.company,
        roleTitle: data.roleTitle,
        location: data.location ?? null,
        packageOffered: data.packageOffered ?? null,
        rawJd: data.rawJd,
        minCgpa: data.minCgpa ?? null,
        eligibleBranches: data.eligibleBranches ?? null,
        eligibleBatchYears: data.eligibleBatchYears ?? null,
        eligibleCategories: data.eligibleCategories ?? null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        isActive: true,
      })
      .returning();

    // Queue enhance_jd job
    await db.insert(jobs).values({
      type: "enhance_jd",
      payload: { driveId: drive.id },
      priority: 7,
    });

    // Revalidate student drives page cache
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/student/drives");
    revalidatePath("/faculty/drives");

    return NextResponse.json(
      { message: "Drive created successfully", drive },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[api/drives] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── GET /api/drives — List drives based on role ─────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    // Try faculty/admin first
    let user: Awaited<ReturnType<typeof requireRoleApi>> | null = null;
    let isStudent = false;

    try {
      user = await requireRoleApi(["faculty", "admin"]);
    } catch {
      // Not faculty/admin — try student
      try {
        const result = await requireStudentProfileApi();
        user = result.user;
        isStudent = true;
      } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    if (!isStudent) {
      // Faculty/Admin: return drives they created, ordered by newest first
      const result = await db.query.drives.findMany({
        where: eq(drives.createdBy, user!.id),
        orderBy: (drives, { desc }) => [desc(drives.createdAt)],
      });

      return NextResponse.json({ drives: result });
    }

    // Student: return active drives matching their eligibility
    const profile = await db.query.students.findFirst({
      where: eq(students.id, user!.id),
    });

    if (!profile) {
      return NextResponse.json({ drives: [] });
    }

    // Fetch all active drives
    const activeDrives = await db.query.drives.findMany({
      where: eq(drives.isActive, true),
      orderBy: (drives, { desc }) => [desc(drives.createdAt)],
    });

    // Filter by eligibility in application code (simpler than dynamic SQL for JSONB)
    const eligible = activeDrives.filter((drive) => {
      // CGPA check
      if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
        if (profile.cgpa === null || profile.cgpa === undefined) return false;
        if (profile.cgpa < drive.minCgpa) return false;
      }

      // Branch check
      const branches = drive.eligibleBranches as string[] | null;
      if (branches && branches.length > 0) {
        if (!profile.branch) return false;
        const normalizedBranches = branches.map((b) => b.toLowerCase().trim());
        if (!normalizedBranches.includes(profile.branch.toLowerCase().trim())) return false;
      }

      // Batch year check
      const batchYears = drive.eligibleBatchYears as number[] | null;
      if (batchYears && batchYears.length > 0) {
        if (profile.batchYear === null || profile.batchYear === undefined) return false;
        if (!batchYears.includes(profile.batchYear)) return false;
      }

      // Category check
      const categories = drive.eligibleCategories as string[] | null;
      if (categories && categories.length > 0) {
        if (!profile.category) return false;
        if (!categories.includes(profile.category)) return false;
      }

      return true;
    });

    // Fetch any existing rankings for this student
    const studentRankings = await db.query.rankings.findMany({
      where: eq(rankings.studentId, user!.id),
    });

    const rankingMap = new Map(
      studentRankings.map((r) => [r.driveId, r])
    );

    // Attach match score to each drive
    const drivesWithScore = eligible.map((drive) => ({
      ...drive,
      ranking: rankingMap.get(drive.id) ?? null,
    }));

    return NextResponse.json({ drives: drivesWithScore });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[api/drives] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
