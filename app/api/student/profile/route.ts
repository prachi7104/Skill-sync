import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfileApi, ApiError } from "@/lib/auth/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { students, users, jobs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { studentProfileSchema } from "@/lib/validations/student-profile";
import { computeCompleteness } from "@/lib/profile/completeness";
import { processEmbeddingJobs } from "@/lib/workers/generate-embedding";
import { z } from "zod";

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

        // Parse Body
        const body = await req.json();

        // Validate - allow partial updates for PATCH
        const validatedData = studentProfileSchema.partial().parse(body);

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
            updateData.branch = validatedData.branch;
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
        updateData.profileCompleteness = completeness;
        updateData.updatedAt = new Date();

        // Perform the update
        await db
            .update(students)
            .set(updateData)
            .where(eq(students.id, user.id));

        // Queue embedding generation when profile is sufficiently complete (>= 50%)
        if (completeness >= 50) {
            // Check if there's already a pending embedding job for THIS student
            const existingJob = await db.query.jobs.findFirst({
                where: and(
                    eq(jobs.type, "generate_embedding"),
                    eq(jobs.status, "pending"),
                    sql`${jobs.payload}->>'targetId' = ${user.id}`,
                ),
            });

            // Only queue if no pending job exists for this student
            if (!existingJob) {
                await db.insert(jobs).values({
                    type: "generate_embedding",
                    status: "pending",
                    priority: 5,
                    payload: {
                        targetType: "student",
                        targetId: user.id,
                    },
                });

                // Trigger worker immediately (fire-and-forget)
                processEmbeddingJobs().catch((err) =>
                    console.error(
                        "[Profile Update] Inline embedding generation failed:",
                        err,
                    ),
                );
            }
        }

        return NextResponse.json(
            { success: true, message: "Profile updated successfully", data: { completeness } },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Validation failed", errors: error.errors },
                { status: 400 }
            );
        }

        console.error("Error updating student profile:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
