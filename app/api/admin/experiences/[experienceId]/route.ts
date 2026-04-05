import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

const moderationSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { experienceId: string } }) {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = moderationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (parsed.data.action === "approve") {
      await db.execute(sql`
        UPDATE company_experiences
        SET status = 'published',
            published_at = NOW(),
            rejected_reason = NULL,
            updated_at = NOW()
        WHERE id = ${params.experienceId}
          AND college_id = ${user.collegeId}
      `);
    } else {
      await db.execute(sql`
        UPDATE company_experiences
        SET status = 'rejected',
            rejected_reason = ${parsed.data.rejectionReason ?? null},
            updated_at = NOW()
        WHERE id = ${params.experienceId}
          AND college_id = ${user.collegeId}
      `);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to moderate experience" }, { status: 500 });
  }
}