import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { isOnboardingRequiredError, requireStudentApiPolicyAccess } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { experienceId: string } },
) {
  try {
    const { user } = await requireStudentApiPolicyAccess("/api/student/experiences");

    const [existingVote] = await db.execute(sql`
      SELECT id
      FROM company_experience_votes
      WHERE experience_id = ${params.experienceId}
        AND user_id = ${user.id}
      LIMIT 1
    `) as unknown as Array<{ id: string }>;

    if (existingVote) {
      await db.execute(sql`
        DELETE FROM company_experience_votes
        WHERE id = ${existingVote.id}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO company_experience_votes (experience_id, user_id)
        VALUES (${params.experienceId}, ${user.id})
      `);
    }

    const [updated] = await db.execute(sql`
      WITH counts AS (
        SELECT COUNT(*)::int AS helpful_count
        FROM company_experience_votes
        WHERE experience_id = ${params.experienceId}
      )
      UPDATE company_experiences ce
      SET helpful_count = counts.helpful_count,
          updated_at = NOW()
      FROM counts
      WHERE ce.id = ${params.experienceId}
      RETURNING ce.helpful_count
    `) as unknown as Array<{ helpful_count: number }>;

    return NextResponse.json({ success: true, helpfulCount: updated?.helpful_count ?? 0, hasVoted: !existingVote });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isOnboardingRequiredError(error)) {
      return NextResponse.json({ error: error.message, code: "ONBOARDING_REQUIRED" }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update helpful vote" }, { status: 500 });
  }
}