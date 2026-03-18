import { NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, students } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        const { user, profile } = await requireStudentProfile();

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

        const [shortlistedResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(rankings)
            .where(and(eq(rankings.studentId, user.id), eq(rankings.shortlisted, true)));
        const shortlistedCount = shortlistedResult?.count ?? 0;

        const [embeddingStatus] = await db
            .select({
                hasEmbedding: sql<boolean>`${students.embedding} IS NOT NULL`,
                updatedAt: students.updatedAt,
            })
            .from(students)
            .where(eq(students.id, user.id))
            .limit(1);

        const requiredCompleted = Boolean(
            profile.sapId &&
            profile.rollNo &&
            profile.resumeUrl &&
            profile.branch &&
            typeof profile.batchYear === "number" &&
            typeof profile.cgpa === "number" &&
            Array.isArray(profile.skills) &&
            profile.skills.length > 0 &&
            Array.isArray(profile.projects) &&
            profile.projects.length > 0
        );

        return NextResponse.json({
            success: true,
            data: {
                activeDrivesCount,
                rankingsCount,
                shortlistedCount,
                profileCompleteness: profile.profileCompleteness ?? 0,
                sandboxUsageToday: profile.sandboxUsageToday ?? 0,
                sandboxUsageMonth: profile.sandboxUsageMonth ?? 0,
                requiredCompleted,
                hasEmbedding: embeddingStatus?.hasEmbedding ?? false,
                profileUpdatedAt: embeddingStatus?.updatedAt ?? null,
            }
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
