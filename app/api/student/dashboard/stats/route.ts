import { NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        const { user } = await requireStudentProfile();

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
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
