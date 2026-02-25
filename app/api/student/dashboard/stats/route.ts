import { NextResponse } from "next/server";
import { requireStudentProfileApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        const { user } = await requireStudentProfileApi();

        const [activeDrivesResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(drives)
            .where(eq(drives.isActive, true));
        const activeDrivesCount = activeDrivesResult?.count ?? 0;

        const [rankingsResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(rankings)
            .where(eq(rankings.studentId, user.id));
        const rankingsCount = rankingsResult?.count ?? 0;

        return NextResponse.json({
            success: true,
            data: {
                activeDrivesCount,
                rankingsCount,
            }
        });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
