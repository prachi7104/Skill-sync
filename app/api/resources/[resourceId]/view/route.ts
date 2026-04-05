import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { resourceId: string } },
) {
  try {
    const user = await requireAuth();
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    await db.execute(sql`
      UPDATE resources
      SET view_count = view_count + 1,
          updated_at = NOW()
      WHERE id = ${params.resourceId}
        AND college_id = ${user.collegeId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to update resource view count" }, { status: 500 });
  }
}