import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, students, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
    req: Request,
    { params }: { params: { driveId: string } }
) {
    const user = await requireRole(["faculty", "admin"]);
    const { driveId } = params;
    const url = new URL(req.url);
    const shortlistedOnly = url.searchParams.get("shortlistedOnly") === "true";

    // Ownership check
    const [drive] = await db
        .select({
            createdBy: drives.createdBy,
            company: drives.company,
            roleTitle: drives.roleTitle
        })
        .from(drives)
        .where(eq(drives.id, driveId))
        .limit(1);

    if (!drive) {
        return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build query conditions
    const conditions = [eq(rankings.driveId, driveId)];
    if (shortlistedOnly) {
        conditions.push(eq(rankings.shortlisted, true));
    }

    const rows = await db
        .select({
            rankPosition: rankings.rankPosition,
            matchScore: rankings.matchScore,
            matchedSkills: rankings.matchedSkills,
            missingSkills: rankings.missingSkills,
            shortlisted: rankings.shortlisted,
            studentName: users.name,
            sapId: students.sapId,
            rollNo: students.rollNo,
            branch: students.branch,
            cgpa: students.cgpa,
            batchYear: students.batchYear,
        })
        .from(rankings)
        .innerJoin(students, eq(rankings.studentId, students.id))
        .innerJoin(users, eq(students.id, users.id))
        .where(and(...conditions))
        .orderBy(asc(rankings.rankPosition));

    // Build CSV
    const header = "Rank,Name,SAP ID,Roll No,Branch,CGPA,Batch Year,Match Score %,Matched Skills,Missing Skills,Shortlisted";
    const csvRows = rows.map((r) =>
        [
            r.rankPosition,
            r.studentName,
            r.sapId ?? "",
            r.rollNo ?? "",
            r.branch ?? "",
            r.cgpa ?? "",
            r.batchYear ?? "",
            r.matchScore.toFixed(1),
            (r.matchedSkills as string[]).join("|"),
            (r.missingSkills as string[]).join("|"),
            r.shortlisted === true ? "Yes" : r.shortlisted === false ? "No" : "",
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
    );

    const csv = [header, ...csvRows].join("\n");
    const filename = `rankings-${drive.company}-${drive.roleTitle}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 60) + ".csv";

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
