import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { isOnboardingRequiredError, requireStudentApiPolicyAccess } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, students } from "@/lib/db/schema";
import { filterEligibleDrives } from "@/lib/business/eligibility";

// Backward-compatible endpoint retained for older clients.
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireStudentApiPolicyAccess("/api/student/drives");

    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active") !== "false";
    const requestedLimit = Number(url.searchParams.get("limit") ?? "4");
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.floor(requestedLimit), 50))
      : 4;

    const profile = await db.query.students.findFirst({
      where: eq(students.id, user.id),
    });

    if (!profile || !profile.collegeId) {
      return NextResponse.json({ drives: [] });
    }

    const driveRows = await db.query.drives.findMany({
      where: activeOnly
        ? and(eq(drives.collegeId, profile.collegeId), eq(drives.isActive, true))
        : eq(drives.collegeId, profile.collegeId),
      orderBy: (drives, { desc }) => [desc(drives.createdAt)],
    });

    const eligible = filterEligibleDrives(driveRows, {
      cgpa: profile.cgpa,
      branch: profile.branch,
      batchYear: profile.batchYear,
      category: profile.category,
    });

    const serialized = eligible.slice(0, limit).map((drive) => ({
      id: drive.id,
      companyName: drive.company,
      role: drive.roleTitle,
      deadline: drive.deadline ? new Date(drive.deadline).toISOString() : null,
      isEligible: true,
    }));

    return NextResponse.json({ drives: serialized });
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err;
    if (isOnboardingRequiredError(err)) {
      return NextResponse.json({ error: err.message, code: "ONBOARDING_REQUIRED" }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Internal server error";

    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
