"use server";

import { requireStudentProfile } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, jobs } from "@/lib/db/schema";
import type { CodingProfile, Achievement } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { computeCompleteness } from "@/lib/profile/completeness";
import { academicsSchema } from "@/lib/validations/student-profile";

/**
 * Valid onboarding step transitions.
 * Each key is the current step, the value is the allowed next step.
 * This ensures strict sequential progression without skipping.
 * 
 * NEW FLOW (Resume-first autofill approach):
 * 0: Welcome
 * 1: Resume Upload (parse → populate skills, projects, experience)
 * 2: Basic Info (pre-filled from auth, confirm)
 * 3: Academics (10th, 12th, CGPA, branch)
 * 4: Skills (PRE-FILLED from resume parse)
 * 5: Projects (PRE-FILLED from resume parse)
 * 6: Coding Profiles
 * 7: Soft Skills + Achievements
 * 8: Review → Complete
 */
const VALID_TRANSITIONS: Record<number, number> = {
    0: 1, // Welcome → Resume Upload
    1: 2, // Resume → Basic Info
    2: 3, // Basic → Academics
    3: 4, // Academics → Skills
    4: 5, // Skills → Projects
    5: 6, // Projects → Coding Profiles
    6: 7, // Coding Profiles → Soft Skills
    7: 8, // Soft Skills → Review
    8: 9, // Review → Complete
};

export async function updateOnboardingStep(step: number) {
    // 1. Auth & Role Check
    const { user, profile } = await requireStudentProfile();

    // 2. Validate step transition (CRITICAL SECURITY CHECK)
    const currentStep = profile.onboardingStep;
    const allowedNextStep = VALID_TRANSITIONS[currentStep];

    // Only allow moving to the exact next step in sequence
    if (step !== allowedNextStep) {
        throw new Error(
            `Invalid step transition: cannot go from step ${currentStep} to step ${step}. ` +
            `Only step ${allowedNextStep} is allowed.`
        );
    }

    // Prevent regression (going backwards)
    if (step < currentStep) {
        throw new Error("Cannot regress to a previous onboarding step.");
    }

    // 3. Update DB
    await db
        .update(students)
        .set({ onboardingStep: step })
        .where(eq(students.id, user.id));

    // 4. Revalidate
    revalidatePath("/student");

    return { success: true };
}

/**
 * Update academic information during onboarding.
 * Validated with Zod schema for CGPA (0-10), percentages (0-100), semester (1-10).
 */
export async function updateAcademics(data: {
    tenthPercentage: number | null;
    twelfthPercentage: number | null;
    cgpa: number | null;
    semester: number | null;
    branch: string | null;
    batchYear: number | null;
}) {
    const { user } = await requireStudentProfile();

    // Validate with Zod schema
    const validated = academicsSchema.parse(data);

    await db
        .update(students)
        .set({
            tenthPercentage: validated.tenthPercentage ?? null,
            twelfthPercentage: validated.twelfthPercentage ?? null,
            cgpa: validated.cgpa ?? null,
            semester: validated.semester ?? null,
            branch: validated.branch ?? null,
            batchYear: validated.batchYear ?? null,
        })
        .where(eq(students.id, user.id));

    revalidatePath("/student");
    return { success: true };
}

/**
 * Update coding profiles during onboarding.
 */
export async function updateCodingProfiles(profiles: CodingProfile[]) {
    const { user } = await requireStudentProfile();

    await db
        .update(students)
        .set({ codingProfiles: profiles })
        .where(eq(students.id, user.id));

    revalidatePath("/student");
    return { success: true };
}

/**
 * Update soft skills and achievements during onboarding.
 */
export async function updateSoftSkillsAndAchievements(data: {
    softSkills: string[];
    achievements: Achievement[];
}) {
    const { user } = await requireStudentProfile();

    await db
        .update(students)
        .set({
            softSkills: data.softSkills,
            achievements: data.achievements,
        })
        .where(eq(students.id, user.id));

    revalidatePath("/student");
    return { success: true };
}

/**
 * Complete onboarding: transitions step 8 → 9, computes profile completeness,
 * and queues a generate_embedding job when the profile is sufficiently complete.
 */
export async function completeOnboarding() {
    const { user, profile } = await requireStudentProfile();

    // Validate we're on the review step (8) ready to complete (9)
    const currentStep = profile.onboardingStep;
    if (currentStep !== 8) {
        throw new Error(
            `Cannot complete onboarding from step ${currentStep}. Must be at step 8 (Review).`
        );
    }

    // Re-fetch the full profile to compute completeness
    const freshProfile = await db.query.students.findFirst({
        where: eq(students.id, user.id),
    });

    if (!freshProfile) {
        throw new Error("Student profile not found.");
    }

    // Add name/email from user for completeness core score
    const profileForCompleteness = {
        ...freshProfile,
        name: user.name,
        email: user.email,
    };

    const { score: completeness } = computeCompleteness(profileForCompleteness);

    // Update step to 9 (complete) and persist completeness
    await db
        .update(students)
        .set({
            onboardingStep: 9,
            profileCompleteness: completeness,
            updatedAt: new Date(),
        })
        .where(eq(students.id, user.id));

    // Queue embedding generation when profile is sufficiently complete
    if (completeness >= 50) {
        const existingJob = await db.query.jobs.findFirst({
            where: and(
                eq(jobs.type, "generate_embedding"),
                eq(jobs.status, "pending"),
                sql`${jobs.payload}->>'targetId' = ${user.id}`,
            ),
        });

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

    revalidatePath("/student");
    return { success: true, completeness };
}
