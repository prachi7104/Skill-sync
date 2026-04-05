import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { students, users, jobs } from "@/lib/db/schema";
import { isRedirectError } from "next/dist/client/components/redirect";
import { eq, and, sql } from "drizzle-orm";
import { studentProfileSchema } from "@/lib/validations/student-profile";
import { computeCompleteness } from "@/lib/profile/completeness";
import { processEmbeddingJobs } from "@/lib/workers/generate-embedding";
import { normalizeBranch } from "@/lib/constants/branches";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        logger.info("[API] /api/student/profile - Check started");

        // 1. Check Session
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            logger.info("[API] /api/student/profile - No Session");
            return NextResponse.json({ success: false, error: "Unauthorized: No Session" }, { status: 401 });
        }
        logger.info(`[API] Session found for: ${session.user.email}`);

        // 2. Check User in DB
        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
            columns: {
                id: true,
                role: true,
                name: true,
                email: true,
                // passwordHash explicitly excluded
            }
        });

        if (!user) {
            logger.info("[API] User not found in DB");
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // 3. Check Student Profile
        const profile = await db.query.students.findFirst({
            where: eq(students.id, user.id),
        });

        if (!profile) {
            logger.info("[API] Student profile missing for user", { userId: user.id });
            // Do NOT redirect here for API calls
            return NextResponse.json({ success: false, error: "Profile missing" }, { status: 404 });
        }

        logger.info("[API] Success");
        return NextResponse.json({ success: true, data: { user, profile } });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.error("[API] Error in /api/student/profile:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}


export async function PATCH(req: NextRequest) {
    try {
        const { user, profile } = await requireStudentProfile();

        // Parse Body
        const body = await req.json();

        // Validate - allow partial updates for PATCH
        const validatedData = studentProfileSchema.partial().parse(body);

        const LOCKED_FIELDS = ["batchYear", "sapId"] as const;
        for (const field of LOCKED_FIELDS) {
            const incoming = (validatedData as Record<string, unknown>)[field];
            if (incoming === undefined || incoming === null) continue;

            const current = (profile as Record<string, unknown>)[field];
            if (current !== null && current !== undefined && current !== "") {
                if (incoming !== current) {
                    const fieldLabel = field === "batchYear" ? "Batch year" : "SAP ID";
                    return NextResponse.json(
                        {
                            error: `${fieldLabel} cannot be changed after it has been set. Contact admin if correction is needed.`
                        },
                        { status: 400 }
                    );
                }
            }
        }

        // Build update object
        const updateData: Record<string, unknown> = {};

        // Academic fields - editable by students
        if (validatedData.rollNo !== undefined) {
            updateData.rollNo = validatedData.rollNo;
        }
        if (validatedData.sapId !== undefined) {
            updateData.sapId = validatedData.sapId;
        }
        if (validatedData.tenthPercentage !== undefined) {
            updateData.tenthPercentage = validatedData.tenthPercentage;
        }
        if (validatedData.twelfthPercentage !== undefined) {
            updateData.twelfthPercentage = validatedData.twelfthPercentage;
        }
        if (validatedData.cgpa !== undefined) {
            updateData.cgpa = validatedData.cgpa;
        }
        if (validatedData.semester !== undefined) {
            updateData.semester = validatedData.semester;
        }
        if (validatedData.branch !== undefined) {
            updateData.branch = validatedData.branch
                ? normalizeBranch(validatedData.branch)
                : null;
        }
        if (validatedData.batchYear !== undefined) {
            updateData.batchYear = validatedData.batchYear;
        }

        // Array fields
        if (validatedData.skills !== undefined) {
            updateData.skills = validatedData.skills;
        }
        if (validatedData.projects !== undefined) {
            updateData.projects = validatedData.projects;
        }
        if (validatedData.workExperience !== undefined) {
            updateData.workExperience = validatedData.workExperience;
        }
        if (validatedData.certifications !== undefined) {
            updateData.certifications = validatedData.certifications;
        }
        if (validatedData.codingProfiles !== undefined) {
            updateData.codingProfiles = validatedData.codingProfiles;
        }
        if (validatedData.achievements !== undefined) {
            updateData.achievements = validatedData.achievements;
        }
        if (validatedData.researchPapers !== undefined) {
            updateData.researchPapers = validatedData.researchPapers;
        }
        if (validatedData.softSkills !== undefined) {
            updateData.softSkills = validatedData.softSkills;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: "No valid fields to update" },
                { status: 400 }
            );
        }

        // Merge updates with current profile to compute completeness
        const updatedProfileSnapshot = { ...profile, ...updateData };
        // computeCompleteness expects name/email for core score; these live on users table
        // Since auth is guaranteed, we give them credit
        (updatedProfileSnapshot as Record<string, unknown>).name = user.name;
        (updatedProfileSnapshot as Record<string, unknown>).email = user.email;

        const { score: completeness } = computeCompleteness(updatedProfileSnapshot);
        updateData.profileCompleteness = Math.round(completeness);
        updateData.updatedAt = new Date();

        // Perform the update
        await db
            .update(students)
            .set(updateData)
            .where(eq(students.id, user.id));

        const EMBEDDING_SIGNAL_FIELDS = [
            "skills",
            "projects",
            "workExperience",
            "certifications",
            "researchPapers",
            "achievements",
            "softSkills",
        ] as const;

        const hasSignalChange = EMBEDDING_SIGNAL_FIELDS.some((field) => field in updateData);
        const isFirstTimeComplete =
            completeness >= 50 && (profile.profileCompleteness ?? 0) < 50;
        const shouldQueueEmbedding = hasSignalChange || isFirstTimeComplete;

        if (shouldQueueEmbedding && completeness >= 50) {
            const existing = await db.query.jobs.findFirst({
                where: and(
                    eq(jobs.type, "generate_embedding"),
                    eq(jobs.status, "pending"),
                    sql`${jobs.payload}->>'targetId' = ${user.id}`,
                ),
                columns: { id: true },
            });

            if (!existing) {
                await db.insert(jobs).values({
                    type: "generate_embedding",
                    payload: { targetType: "student", targetId: user.id },
                    priority: 6,
                });

                logger.info("[Profile PATCH] Queued embedding job", {
                    userId: user.id,
                    completeness,
                });

                // Trigger worker immediately (fire-and-forget)
                processEmbeddingJobs().catch((err) =>
                    console.error("[Profile Update] Inline embedding generation failed:", err),
                );
            }
        }

        return NextResponse.json(
            { success: true, message: "Profile updated successfully", data: { completeness } },
            { status: 200 }
        );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Validation failed", errors: error.errors },
                { status: 400 }
            );
        }

        // Handle authentication errors (usually thrown by requireStudentProfile)
        if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 401 }
            );
        }

        console.error("Error updating student profile:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
