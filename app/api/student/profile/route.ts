import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, jobs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { studentProfileSchema } from "@/lib/validations/student-profile";
import { computeCompleteness } from "@/lib/profile/completeness";
import { z } from "zod";

export async function PATCH(req: NextRequest) {
    try {
        const { user, profile } = await requireStudentProfile();

        // Parse Body
        const body = await req.json();

        // Validate
        const validatedData = studentProfileSchema.parse(body);

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

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { message: "No valid fields to update" },
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
            }
        }

        return NextResponse.json(
            { message: "Profile updated successfully", completeness },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation failed", errors: error.errors },
                { status: 400 }
            );
        }

        // Handle authentication errors (usually thrown by requireStudentProfile)
        if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
            return NextResponse.json(
                { message: error.message },
                { status: 401 }
            );
        }

        console.error("Error updating student profile:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
