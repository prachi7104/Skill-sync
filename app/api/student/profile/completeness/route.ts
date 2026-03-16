import { NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { computeCompleteness } from "@/lib/profile/completeness";
import { isRedirectError } from "next/dist/client/components/redirect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { user, profile } = await requireStudentProfile();

    const result = computeCompleteness({
      ...profile,
      name: user.name,
      email: user.email,
    });

    const required = {
      sapId: Boolean(profile.sapId),
      rollNo: Boolean(profile.rollNo),
      resume: Boolean(profile.resumeUrl),
      skills: Array.isArray(profile.skills) && profile.skills.length > 0,
      projects: Array.isArray(profile.projects) && profile.projects.length > 0,
      branch: Boolean(profile.branch),
      batchYear: typeof profile.batchYear === "number",
      cgpa: typeof profile.cgpa === "number",
    };

    const requiredCompleted = Object.values(required).every(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        score: result.score,
        breakdown: result.breakdown,
        missing: result.missing,
        required,
        requiredCompleted,
      },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ success: false, error: "Failed to compute completeness" }, { status: 500 });
  }
}
