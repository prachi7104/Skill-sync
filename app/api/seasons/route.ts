import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireRole(["faculty", "admin"]);

    if (!user.collegeId) {
      return NextResponse.json({ seasons: [] });
    }

    const rows = await db.query.seasons.findMany({
      where: and(eq(seasons.collegeId, user.collegeId), eq(seasons.isActive, true)),
      orderBy: [desc(seasons.createdAt)],
      columns: {
        id: true,
        name: true,
        startsAt: true,
        endsAt: true,
      },
    });

    return NextResponse.json({ seasons: rows });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to load seasons" }, { status: 500 });
  }
}
