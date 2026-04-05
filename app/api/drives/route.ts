import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drives, jobs, students, rankings, seasons } from "@/lib/db/schema";
import { hasComponent, requireRole, requireStudentProfile } from "@/lib/auth/helpers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";
import { expandBranches } from "@/lib/constants/branches";

// ── Zod Schema for drive creation ───────────────────────────────────────────

const createDriveSchema = z.object({
  company: z.string().min(1, "Company name is required").max(255),
  roleTitle: z.string().min(1, "Role title is required").max(255),
  location: z.string().max(255).optional().nullable(),
  packageOffered: z.string().max(100).optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  rankingsVisible: z.boolean().optional().default(true),
  placementType: z.enum(["placement", "internship", "ppo", "other"]).optional().default("placement"),
  rawJd: z.string()
    .min(50, "Job description must be at least 50 characters")
    .max(50000, "Job description cannot exceed 50,000 characters"),
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
    const user = await requireRole(["faculty", "admin"]);

    if (user.role === "faculty") {
      const permitted = await hasComponent("drive_management");
      if (!permitted) {
        return NextResponse.json(
          { message: "Permission denied: drive_management required" },
          { status: 403 }
        );
      }
    }

    if (!user.collegeId) {
      return NextResponse.json(
        { message: "Your account must be associated with a college to create drives" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createDriveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.seasonId && user.collegeId) {
      const season = await db.query.seasons.findFirst({
        where: and(eq(seasons.id, data.seasonId), eq(seasons.collegeId, user.collegeId)),
        columns: { id: true },
      });
      if (!season) {
        return NextResponse.json({ message: "Invalid season for your college" }, { status: 400 });
      }
    }

    // Insert drive
    const [drive] = await db
      .insert(drives)
      .values({
        collegeId: user.collegeId ?? (() => { 
          throw new Error("Faculty must be assigned to a college before creating drives"); 
        })(),
        createdBy: user.id,
        company: data.company,
        roleTitle: data.roleTitle,
        seasonId: data.seasonId ?? null,
        location: data.location ?? null,
        packageOffered: data.packageOffered ?? null,
        rankingsVisible: data.rankingsVisible ?? true,
        placementType: data.placementType ?? "placement",
        rawJd: data.rawJd,
        minCgpa: data.minCgpa ?? null,
        eligibleBranches: data.eligibleBranches ?? null,
        eligibleBatchYears: data.eligibleBatchYears ?? null,
        eligibleCategories: data.eligibleCategories ?? null,
        deadline: data.deadline ? new Date(data.deadline) : null,
      })
      .returning();

    // Queue enhance_jd job
    await db.insert(jobs).values({
      type: "enhance_jd",
      payload: { driveId: drive.id, titleHint: data.roleTitle, companyHint: data.company },
      priority: 7,
    });

    return NextResponse.json(
      { message: "Drive created successfully", drive },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ message }, { status: 403 });
    }
    console.error("[api/drives] POST error:", err);
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
    let user: Awaited<ReturnType<typeof requireRole>> | null = null;
    let isStudent = false;

    try {
      user = await requireRole(["faculty", "admin"]);
    } catch {
      // Not faculty/admin — try student
      try {
        const result = await requireStudentProfile();
        user = result.user;
        isStudent = true;
      } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    if (!isStudent) {
      // Faculty/Admin: return all drives in their college, ordered by newest first
      if (!user!.collegeId) {
        return NextResponse.json({ drives: [] });
      }

      const result = await db.query.drives.findMany({
        where: eq(drives.collegeId, user!.collegeId),
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

    if (!profile.collegeId) {
      return NextResponse.json({ drives: [] });
    }

    // Fetch active drives for the student's college only
    const activeDrives = await db.query.drives.findMany({
      where: and(eq(drives.isActive, true), eq(drives.collegeId, profile.collegeId)),
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
        const normalizedBranches = expandBranches(branches).map((b) => b.toLowerCase().trim());
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
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err;
    console.error("[api/drives] GET error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
