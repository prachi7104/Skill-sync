import { NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
            activeDrivesCount,
            rankingsCount,
        });
    } catch (error) {
        if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
