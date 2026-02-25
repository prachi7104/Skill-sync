/**
 * Background worker for processing parse_resume jobs.
 *
 * Uses the AI-powered parser (direct Gemini/Groq calls) with 2-second
 * delays between jobs to respect API rate limits.
 *
 * Job lifecycle:  pending → processing → completed | failed
 * Atomic claim:   UPDATE … WHERE status='pending' prevents double-processing.
 * Rate limiting:  2-second gap between consecutive AI calls.
 */

import { db } from "@/lib/db";
import { jobs, students } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { parseResumeWithAI, mapParsedResumeToProfile } from "@/lib/resume/ai-parser";
import { extractTextFromUrl } from "@/lib/resume/server-extractor";
import { computeCompleteness } from "@/lib/profile/completeness";
import { logger } from "@/lib/logger";



export async function processResumeParseJobs(): Promise<number> {
    // 1. Find one pending parse_resume job (highest priority first, oldest first)
    const [pendingJob] = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(
            and(
                eq(jobs.type, "parse_resume"),
                eq(jobs.status, "pending"),
            ),
        )
        .orderBy(desc(jobs.priority), asc(jobs.createdAt))
        .limit(1);

    if (!pendingJob) {
        // No jobs pending
        return 0;
    }

    // 2. Atomically claim it (optimistic lock: only succeed if still pending)
    const claimed = await db
        .update(jobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(
            and(
                eq(jobs.id, pendingJob.id),
                eq(jobs.status, "pending"),
            ),
        )
        .returning();

    if (claimed.length === 0) return 0; // another worker grabbed it

    const job = claimed[0];
    const processingStart = Date.now();

    try {
        const payload = job.payload as {
            studentId: string;
            resumeText: string;
            resumeUrl?: string;
            mimeType?: string;
        };

        const { studentId } = payload;
        let resumeText = (payload.resumeText as string | null) ?? null;

        // If client didn't provide usable text, attempt server-side extraction
        if (!resumeText || resumeText.length < 50) {
            logger.info("[ResumeWorker] No client text — attempting server-side extraction", { jobId: job.id, studentId, resumeUrl: payload.resumeUrl });

            if (!payload.resumeUrl) {
                throw new Error("Resume text too short or missing and no resumeUrl available for server extraction");
            }

            try {
                resumeText = await extractTextFromUrl(payload.resumeUrl, payload.mimeType);
            } catch (err) {
                throw new Error("Server-side resume extraction failed: " + (err instanceof Error ? err.message : String(err)));
            }
        }

        if (!resumeText || resumeText.length < 50) {
            throw new Error("Resume text too short or missing after server-side extraction");
        }

        logger.info("[ResumeWorker] Processing job", { jobId: job.id, studentId, textLength: resumeText.length });

        // 3. AI-powered structured parsing
        const parsedData = await parseResumeWithAI(resumeText);
        const mappedProfile = mapParsedResumeToProfile(parsedData);
        const latencyMs = Date.now() - processingStart;

        logger.info("[ResumeWorker] Parsing complete", {
            jobId: job.id,
            latencyMs,
            skills: mappedProfile.skills.length,
            projects: mappedProfile.projects.length,
            experience: mappedProfile.workExperience.length,
        });

        // 4. Update student profile — auto-fill empty fields only
        const currentProfile = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });

        if (currentProfile) {
            const updateData: Record<string, unknown> = {
                parsedResumeJson: parsedData,
                resumeParsedAt: new Date(),
                updatedAt: new Date(),
            };

            // Auto-fill only empty fields
            if (!currentProfile.phone && mappedProfile.phone) updateData.phone = mappedProfile.phone;
            if (!currentProfile.linkedin && mappedProfile.linkedin) updateData.linkedin = mappedProfile.linkedin;
            if (!currentProfile.tenthPercentage && mappedProfile.tenthPercentage) updateData.tenthPercentage = mappedProfile.tenthPercentage;
            if (!currentProfile.twelfthPercentage && mappedProfile.twelfthPercentage) updateData.twelfthPercentage = mappedProfile.twelfthPercentage;
            if (!currentProfile.cgpa && mappedProfile.cgpa) updateData.cgpa = mappedProfile.cgpa;
            if ((!currentProfile.skills || currentProfile.skills.length === 0) && mappedProfile.skills.length > 0) updateData.skills = mappedProfile.skills;
            if ((!currentProfile.projects || currentProfile.projects.length === 0) && mappedProfile.projects.length > 0) updateData.projects = mappedProfile.projects;
            if ((!currentProfile.workExperience || currentProfile.workExperience.length === 0) && mappedProfile.workExperience.length > 0) updateData.workExperience = mappedProfile.workExperience;
            if ((!currentProfile.codingProfiles || currentProfile.codingProfiles.length === 0) && mappedProfile.codingProfiles.length > 0) updateData.codingProfiles = mappedProfile.codingProfiles;
            if ((!currentProfile.certifications || currentProfile.certifications.length === 0) && mappedProfile.certifications.length > 0) updateData.certifications = mappedProfile.certifications;
            if ((!currentProfile.researchPapers || currentProfile.researchPapers.length === 0) && mappedProfile.researchPapers.length > 0) updateData.researchPapers = mappedProfile.researchPapers;
            if ((!currentProfile.achievements || currentProfile.achievements.length === 0) && mappedProfile.achievements.length > 0) updateData.achievements = mappedProfile.achievements;
            if ((!currentProfile.softSkills || currentProfile.softSkills.length === 0) && mappedProfile.softSkills.length > 0) updateData.softSkills = mappedProfile.softSkills;

            await db.update(students).set(updateData).where(eq(students.id, studentId));

            // Recompute profile completeness
            const freshProfile = await db.query.students.findFirst({ where: eq(students.id, studentId) });
            if (freshProfile) {
                const user = await db.query.users.findFirst({
                    where: eq(students.id, studentId),
                    columns: { name: true, email: true },
                });
                if (user) {
                    const { score } = computeCompleteness({ ...freshProfile, name: user.name, email: user.email });
                    await db.update(students).set({ profileCompleteness: score, updatedAt: new Date() }).where(eq(students.id, studentId));
                }
            }
        }

        // 5. Mark job complete
        await db
            .update(jobs)
            .set({
                status: "completed",
                result: parsedData,
                latencyMs,
                modelUsed: "mixed", // Generic as we use a chain
                updatedAt: new Date(),
            })
            .where(eq(jobs.id, job.id));

        return 1; // Processed 1 job

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const latencyMs = Date.now() - processingStart;
        logger.error("[ResumeWorker] ❌ Job failed", {
            jobId: job.id,
            error: message,
            stack: error instanceof Error ? error.stack : undefined,
            latencyMs
        });

        const newRetryCount = (job.retryCount ?? 0) + 1;
        const maxRetries = job.maxRetries ?? 3;

        await db
            .update(jobs)
            .set({
                status: newRetryCount < maxRetries ? "pending" : "failed",
                error: message,
                retryCount: newRetryCount,
                latencyMs,
                updatedAt: new Date(),
            })
            .where(eq(jobs.id, job.id));

        return 0;
    }
}
