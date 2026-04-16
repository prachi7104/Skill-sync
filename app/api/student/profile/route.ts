import { NextRequest, NextResponse } from "next/server";
import {
    isOnboardingRequiredError,
    requireStudentApiPolicyAccess,
    requireRole,
} from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs, students } from "@/lib/db/schema";
import { isRedirectError } from "next/dist/client/components/redirect";
import { and, eq, sql } from "drizzle-orm";
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
        const user = await requireRole(["student"]);

        const profile = await db.query.students.findFirst({
            where: eq(students.id, user.id),
        });

        if (!profile) {
            return NextResponse.json(
                { success: false, error: "Profile missing" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    role: user.role,
                    name: user.name,
                    email: user.email,
                    // passwordHash explicitly NOT included
                },
                profile,
            },
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[API] Error in /api/student/profile GET:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}


export async function PATCH(req: NextRequest) {
    try {
        const { user, profile } = await requireStudentApiPolicyAccess("/api/student/profile");

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

        // Contact fields
        if (validatedData.phone !== undefined) {
            updateData.phone = validatedData.phone;
        }
        if (validatedData.linkedin !== undefined) {
            updateData.linkedin = validatedData.linkedin;
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
            let jobQueued = false;

            // Use atomic SQL when available (production DB), but keep a fallback
            // for test environments that mock only query/insert APIs.
            if (typeof (db as unknown as { execute?: unknown }).execute === "function") {
                const [inserted] = await db.execute(sql`
                    INSERT INTO jobs (type, status, payload, priority)
                    SELECT 'generate_embedding', 'pending',
                           ${JSON.stringify({ targetType: "student", targetId: user.id })}::jsonb,
                           6
                    WHERE NOT EXISTS (
                        SELECT 1 FROM jobs
                        WHERE type = 'generate_embedding'
                          AND status = 'pending'
                          AND payload->>'targetId' = ${user.id}
                    )
                    RETURNING id
                `) as unknown as Array<{ id: string }>;
                jobQueued = Boolean(inserted?.id);
            } else {
                const existingPending = await db.query.jobs.findFirst({
                    where: and(
                        eq(jobs.type, "generate_embedding"),
                        eq(jobs.status, "pending"),
                        sql`${jobs.payload}->>'targetId' = ${user.id}`,
                    ),
                    columns: { id: true },
                });

                if (!existingPending) {
                    await db.insert(jobs).values({
                        type: "generate_embedding",
                        status: "pending",
                        payload: { targetType: "student", targetId: user.id },
                        priority: 6,
                    });
                    jobQueued = true;
                }
            }

            if (jobQueued) {

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
        if (isRedirectError(error)) throw error;
        if (isOnboardingRequiredError(error)) {
            return NextResponse.json(
                { success: false, error: error.message, code: "ONBOARDING_REQUIRED" },
                { status: error.status }
            );
        }
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
