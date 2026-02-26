import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfileApi, ApiError } from "@/lib/auth/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { computeCompleteness } from "@/lib/profile/completeness";
import { processEmbeddingJobs, enqueueEmbeddingJob } from "@/lib/workers/generate-embedding";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        console.log("[API] /api/student/profile - Check started");

        // 1. Check Session
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            console.log("[API] /api/student/profile - No Session");
            return NextResponse.json({ success: false, error: "Unauthorized: No Session" }, { status: 401 });
        }
        console.log(`[API] Session found for: ${session.user.email}`);

        // 2. Check User in DB
        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
        });

        if (!user) {
            console.log("[API] User not found in DB");
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // 3. Check Student Profile
        const profile = await db.query.students.findFirst({
            where: eq(students.id, user.id),
        });

        if (!profile) {
            console.log("[API] Student profile missing for user", user.id);
            // Do NOT redirect here for API calls
            return NextResponse.json({ success: false, error: "Profile missing" }, { status: 404 });
        }

        console.log("[API] Success");
        return NextResponse.json({ success: true, data: { user, profile } });

    } catch (error: any) {
        console.error("[API] Error in /api/student/profile:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { user, profile } = await requireStudentProfileApi();
        const body = await req.json();

        // Validate incoming data — students cannot set their own category
        const allowed = z.object({
            sapId: z.string().length(9).regex(/^\d+$/).optional(),
            rollNo: z.string().min(1).max(20).optional(),
            phone: z.string().max(20).optional().nullable(),
            linkedin: z.string().url().max(500).optional().nullable(),
            cgpa: z.number().min(0).max(10).optional().nullable(),
            tenthPercentage: z.number().min(0).max(100).optional().nullable(),
            twelfthPercentage: z.number().min(0).max(100).optional().nullable(),
            semester: z.number().int().min(1).max(10).optional().nullable(),
            branch: z.string().max(100).optional().nullable(),
            batchYear: z.number().int().min(2020).max(2035).optional().nullable(),
            skills: z.array(z.object({
                name: z.string().min(1).max(100),
                proficiency: z.number().int().min(1).max(5).default(3),
                category: z.string().max(50).optional().nullable(),
            }).passthrough()).optional(),
            projects: z.array(z.any()).optional(),
            workExperience: z.array(z.any()).optional(),
            certifications: z.array(z.any()).optional(),
            codingProfiles: z.array(z.any()).optional(),
            researchPapers: z.array(z.any()).optional(),
            achievements: z.array(z.any()).optional(),
            softSkills: z.array(z.string()).optional(),
        }).passthrough(); // passthrough() allows extra fields like `id` from useFieldArray

        const data = allowed.parse(body);

        // Build update object — only include provided fields
        const update: Record<string, unknown> = {};

        if (data.sapId !== undefined) update.sapId = data.sapId;
        if (data.rollNo !== undefined) update.rollNo = data.rollNo;
        if (data.phone !== undefined) update.phone = data.phone;
        if (data.linkedin !== undefined) update.linkedin = data.linkedin;
        if (data.cgpa !== undefined) update.cgpa = data.cgpa;
        if (data.tenthPercentage !== undefined) update.tenthPercentage = data.tenthPercentage;
        if (data.twelfthPercentage !== undefined) update.twelfthPercentage = data.twelfthPercentage;
        if (data.semester !== undefined) update.semester = data.semester;
        if (data.branch !== undefined) update.branch = data.branch;
        if (data.batchYear !== undefined) update.batchYear = data.batchYear;
        if (data.skills !== undefined) update.skills = data.skills;
        if (data.projects !== undefined) update.projects = data.projects;
        if (data.workExperience !== undefined) update.workExperience = data.workExperience;
        if (data.certifications !== undefined) update.certifications = data.certifications;
        if (data.codingProfiles !== undefined) update.codingProfiles = data.codingProfiles;
        if (data.researchPapers !== undefined) update.researchPapers = data.researchPapers;
        if (data.achievements !== undefined) update.achievements = data.achievements;
        if (data.softSkills !== undefined) update.softSkills = data.softSkills;

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        // Compute updated completeness
        const mergedProfile = { ...profile, ...update };
        const { score } = computeCompleteness({
            sapId: mergedProfile.sapId as string,
            rollNo: mergedProfile.rollNo as string,
            cgpa: mergedProfile.cgpa as number,
            branch: mergedProfile.branch as string,
            batchYear: mergedProfile.batchYear as number,
            skills: mergedProfile.skills as unknown[],
            projects: mergedProfile.projects as unknown[],
            workExperience: mergedProfile.workExperience as unknown[],
            certifications: mergedProfile.certifications as unknown[],
            codingProfiles: mergedProfile.codingProfiles as unknown[],
            phone: mergedProfile.phone as string,
            linkedin: mergedProfile.linkedin as string,
            resumeUrl: mergedProfile.resumeUrl as string,
        });
        update.profileCompleteness = score;
        update.updatedAt = new Date();

        // Save to DB
        const [updated] = await db
            .update(students)
            .set(update as any)
            .where(eq(students.id, user.id))
            .returning();

        // Re-queue embedding if profile content changed
        const contentFields = ["skills", "projects", "workExperience", "certifications"];
        const contentChanged = contentFields.some((f) => f in update);
        if (contentChanged && score >= 50) {
            // Use the dedup guard we made in Phase 1B
            await enqueueEmbeddingJob(user.id, "student", 5);
            // Trigger worker immediately (fire-and-forget)
            processEmbeddingJobs().catch((err) =>
                console.error("[Profile Update] Inline embedding generation failed:", err)
            );
        }

        revalidatePath("/student");

        return NextResponse.json({
            success: true,
            profile: updated,
            completeness: score,
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.flatten().fieldErrors },
                { status: 400 },
            );
        }
        // Handle unique constraint violations (sap_id or roll_no taken)
        if (error instanceof Error && error.message.includes("unique")) {
            if (error.message.includes("sap_id")) {
                return NextResponse.json({ error: "This SAP ID is already registered to another account" }, { status: 409 });
            }
            if (error.message.includes("roll_no")) {
                return NextResponse.json({ error: "This Roll Number is already registered to another account" }, { status: 409 });
            }
        }
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        console.error("[PATCH /api/student/profile]", error);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }
}
