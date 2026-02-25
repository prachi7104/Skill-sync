import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, facultyUploads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/faculty/categories
 * 
 * CSV format: roll_no,category
 * e.g.:
 *   R2142233333,alpha
 *   R2142233334,beta
 * 
 * Faculty only. Updates student.category for matching roll numbers.
 * Returns summary of rows processed / failed.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requireRoleApi(["faculty", "admin"]);
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!file.name.endsWith(".csv")) {
            return NextResponse.json({ error: "File must be a .csv" }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

        // Remove header row if present
        const dataLines = lines[0]?.toLowerCase().includes("roll") ? lines.slice(1) : lines;

        const validCategories = ["alpha", "beta", "gamma"] as const;
        type Category = typeof validCategories[number];

        const updates: { rollNo: string; category: Category }[] = [];
        const errors: { row: number; reason: string }[] = [];

        for (let i = 0; i < dataLines.length; i++) {
            const parts = dataLines[i].split(",").map((p) => p.trim().toLowerCase());
            if (parts.length < 2) {
                errors.push({ row: i + 1, reason: "Invalid format — expected roll_no,category" });
                continue;
            }

            const [rollNo, category] = parts;

            if (!rollNo || rollNo.length !== 11) {
                errors.push({ row: i + 1, reason: `Invalid roll number: ${rollNo}` });
                continue;
            }

            if (!validCategories.includes(category as Category)) {
                errors.push({ row: i + 1, reason: `Invalid category "${category}" — must be alpha, beta, or gamma` });
                continue;
            }

            updates.push({ rollNo: rollNo.toUpperCase(), category: category as Category });
        }

        // Batch update
        let processed = 0;
        for (const { rollNo, category } of updates) {
            const result = await db
                .update(students)
                .set({ category, updatedAt: new Date() })
                .where(eq(students.rollNo, rollNo))
                .returning({ id: students.id });

            if (result.length === 0) {
                errors.push({ row: -1, reason: `Roll number not found: ${rollNo}` });
            } else {
                processed++;
            }
        }

        // Log upload
        await db.insert(facultyUploads).values({
            uploadedBy: user.id,
            uploadType: "category_assignment",
            rowsProcessed: processed,
            rowsFailed: errors.length,
            errors: errors.length > 0 ? errors : null,
        });

        return NextResponse.json({
            message: "Category upload complete",
            processed,
            failed: errors.length,
            errors: errors.slice(0, 20),
        });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        console.error("[POST /api/faculty/categories]", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
