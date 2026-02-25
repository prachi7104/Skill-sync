import { NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
    req: Request,
    { params }: { params: { driveId: string; studentId: string } }
) {
    try {
        const user = await requireRoleApi(["faculty", "admin"]);
        const { driveId, studentId } = params;

        // Verify ownership: drive must belong to user (or user is admin)
        const [drive] = await db
            .select({ createdBy: drives.createdBy })
            .from(drives)
            .where(eq(drives.id, driveId))
            .limit(1);

        if (!drive) {
            return NextResponse.json({ error: "Drive not found" }, { status: 404 });
        }

        if (user.role === "faculty" && drive.createdBy !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const shortlisted = body.shortlisted; // boolean | null

        await db
            .update(rankings)
            .set({ shortlisted })
            .where(and(eq(rankings.driveId, driveId), eq(rankings.studentId, studentId)));

        return NextResponse.json({ success: true, shortlisted });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        console.error("[PATCH /api/drives/[driveId]/rankings/[studentId]/shortlist]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
