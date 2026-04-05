import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function PATCH(
    req: Request,
    { params }: { params: { driveId: string; studentId: string } }
) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    const { driveId, studentId } = params;

    // Verify ownership: drive must belong to user (or user is admin)
    const [drive] = await db
        .select({ createdBy: drives.createdBy, collegeId: drives.collegeId })
        .from(drives)
        .where(eq(drives.id, driveId))
        .limit(1);

    if (!drive) {
        return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "admin" && (!user.collegeId || drive.collegeId !== user.collegeId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const shortlisted = body.shortlisted;

    // Validate: only boolean or null is accepted
    if (shortlisted !== true && shortlisted !== false && shortlisted !== null) {
        return NextResponse.json(
            { error: "shortlisted must be true, false, or null" },
            { status: 400 }
        );
    }

    const updated = await db
        .update(rankings)
        .set({ shortlisted })
        .where(and(eq(rankings.driveId, driveId), eq(rankings.studentId, studentId)))
        .returning({ id: rankings.studentId });

    if (updated.length === 0) {
        return NextResponse.json(
            { error: "Ranking not found for this student/drive" },
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true, shortlisted });
  } catch (err: unknown) {
    if (isRedirectError(err)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[shortlist] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
