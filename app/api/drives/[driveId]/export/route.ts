import { NextResponse } from "next/server";
import { ApiAuthError, requireApiRole } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { drives, rankings, students, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

function sanitizeCsvCell(value: string): string {
    const trimmed = value.trimStart();
    if (!trimmed) return value;

    const firstChar = trimmed.charAt(0);
    if (firstChar === "=" || firstChar === "+" || firstChar === "-" || firstChar === "@") {
        return `'${value}`;
    }

    return value;
}

export async function GET(
    req: Request,
    { params }: { params: { driveId: string } }
) {
    try {
        const user = await requireApiRole(["faculty", "admin"]);
        const { driveId } = params;
        const url = new URL(req.url);
        const shortlistedOnly = url.searchParams.get("shortlistedOnly") === "true";

        // Ownership check
        const [drive] = await db
        .select({
            createdBy: drives.createdBy,
            collegeId: drives.collegeId,
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

        if (!user.collegeId || drive.collegeId !== user.collegeId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Build query conditions
        const conditions = [eq(rankings.driveId, driveId)];
        if (shortlistedOnly) {
            conditions.push(eq(rankings.shortlisted, true));
        }

        const MAX_EXPORT_ROWS = 5000;

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
        .orderBy(asc(rankings.rankPosition))
        .limit(MAX_EXPORT_ROWS + 1);

        const isTruncated = rows.length > MAX_EXPORT_ROWS;
        const exportRows = isTruncated ? rows.slice(0, MAX_EXPORT_ROWS) : rows;

        // Build CSV
        const header = "Rank,Name,SAP ID,Roll No,Branch,CGPA,Batch Year,Match Score %,Matched Skills,Missing Skills,Shortlisted";
        const csvRows = exportRows.map((r) =>
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
            .map((v) => {
                const safe = sanitizeCsvCell(String(v));
                return `"${safe.replace(/"/g, '""')}"`;
            })
            .join(",")
        );

        if (isTruncated) {
            csvRows.push(`"","","","","","","","","","","TRUNCATED: showing first ${MAX_EXPORT_ROWS} rows"`);
        }

        const csv = [header, ...csvRows].join("\n");
        const filename = `rankings-${drive.company}-${drive.roleTitle}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 60) + ".csv";

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "X-Export-Truncated": isTruncated ? "true" : "false",
            },
        });
    } catch (error) {
        if (error instanceof ApiAuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        return NextResponse.json({ error: "Failed to export rankings" }, { status: 500 });
    }
}
