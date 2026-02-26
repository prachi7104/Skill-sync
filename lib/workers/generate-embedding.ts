import { db } from "@/lib/db";
import { jobs, students, drives } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
    generateEmbedding,
    composeStudentEmbeddingText,
    composeJDEmbeddingText,
} from "@/lib/embeddings";
import { safeRequestBudget } from "@/lib/embeddings/rate-limit-db";
import { logger } from "@/lib/logger";

/**
 * Enqueue an embedding job with dedup guard.
 * Skips if a pending/processing job already exists for the same target.
 */
export async function enqueueEmbeddingJob(
    targetId: string,
    targetType: "student" | "drive",
    priority: number = 5,
): Promise<string | null> {
    // Dedup: don't queue if pending or processing job already exists for this target
    const [existing] = await db
        .select({ id: jobs.id, status: jobs.status })
        .from(jobs)
        .where(
            and(
                eq(jobs.type, "generate_embedding"),
                inArray(jobs.status, ["pending", "processing"]),
                sql`${jobs.payload}->>'targetId' = ${targetId}`,
            ),
        )
        .limit(1);

    if (existing) {
        logger.info("Embedding job already queued", {
            targetId,
            existingJobId: existing.id,
        });
        return existing.id;
    }

    const [job] = await db
        .insert(jobs)
        .values({
            type: "generate_embedding",
            payload: { targetId, targetType },
            priority,
        })
        .returning({ id: jobs.id });

    return job.id;
}

/**
 * Worker to process pending generate_embedding jobs.
 * Uses DB-backed rate limits to determine batch size.
 * Supports both student and drive embeddings.
 */
export async function processEmbeddingJobs() {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        logger.error(
            "[Worker:Embeddings] GOOGLE_GENERATIVE_AI_API_KEY not set — skipping tick",
        );
        return { processed: 0, failed: 0, rateLimited: 0, budget: 0 };
    }

    // Get system setting for max batch size (default 8)
    const maxPerTick = await db.query.systemSettings
        ?.findFirst({
            where: (s, { eq: eqFn }) => eqFn(s.key, "embedding_batch_size"),
        })
        .then((s) => parseInt(String(s?.value ?? "8")))
        .catch(() => 8) ?? 8;

    // Check how many embeddings we can safely make this tick
    const budget = await safeRequestBudget("gemini_embedding", maxPerTick);

    if (budget === 0) {
        logger.info("Embedding rate limit reached for today — skipping tick");
        return { processed: 0, failed: 0, rateLimited: 0, budget: 0 };
    }

    logger.info(`Embedding budget this tick: ${budget}`);

    let processed = 0;
    let rateLimited = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < budget; i++) {
        // Find one pending job
        const [pendingJob] = await db
            .select({ id: jobs.id })
            .from(jobs)
            .where(
                and(
                    eq(jobs.type, "generate_embedding"),
                    eq(jobs.status, "pending"),
                ),
            )
            .orderBy(jobs.priority, jobs.createdAt)
            .limit(1);

        if (!pendingJob) break; // queue drained

        // Atomically claim it
        const claimed = await db
            .update(jobs)
            .set({ status: "processing", updatedAt: new Date() })
            .where(
                and(eq(jobs.id, pendingJob.id), eq(jobs.status, "pending")),
            )
            .returning();

        if (claimed.length === 0) continue; // another worker grabbed it

        const job = claimed[0];
        const startTime = Date.now();

        try {
            const { targetType, targetId } = job.payload as {
                targetType: "student" | "drive";
                targetId: string;
            };

            let embedding: number[];

            if (targetType === "student") {
                const student = await db.query.students.findFirst({
                    where: eq(students.id, targetId),
                    columns: {
                        skills: true,
                        projects: true,
                        workExperience: true,
                        certifications: true,
                    },
                });

                if (!student) throw new Error(`Student ${targetId} not found`);

                const text = composeStudentEmbeddingText({
                    skills: student.skills,
                    projects: student.projects,
                    workExperience: student.workExperience,
                    certifications: student.certifications,
                });

                if (!text || text.trim().length === 0) {
                    throw new Error(
                        "Profile has no text content to embed — student must add skills/projects first",
                    );
                }

                embedding = await generateEmbedding(text, "profile");

                await db
                    .update(students)
                    .set({ embedding, updatedAt: new Date() })
                    .where(eq(students.id, targetId));
            } else if (targetType === "drive") {
                const drive = await db.query.drives.findFirst({
                    where: eq(drives.id, targetId),
                    columns: {
                        parsedJd: true,
                        rawJd: true,
                        roleTitle: true,
                        company: true,
                    },
                });

                if (!drive) throw new Error(`Drive ${targetId} not found`);

                const text = composeJDEmbeddingText({
                    parsedJd: drive.parsedJd,
                    rawJd: drive.rawJd,
                    roleTitle: drive.roleTitle,
                    company: drive.company,
                });

                embedding = await generateEmbedding(text, "jd");

                await db
                    .update(drives)
                    .set({ jdEmbedding: embedding, updatedAt: new Date() })
                    .where(eq(drives.id, targetId));
            } else {
                throw new Error(`Unknown target type: ${targetType}`);
            }

            // Mark complete
            await db
                .update(jobs)
                .set({
                    status: "completed",
                    result: {
                        dimension: embedding.length,
                        model: "gemini-embedding-001",
                    },
                    latencyMs: Date.now() - startTime,
                    modelUsed: "gemini-embedding-001",
                    updatedAt: new Date(),
                })
                .where(eq(jobs.id, job.id));

            processed++;
            logger.info("Embedding job completed", {
                jobId: job.id,
                targetType,
                targetId,
                durationMs: Date.now() - startTime,
            });
        } catch (error: unknown) {
            const msg =
                error instanceof Error ? error.message : "Unknown error";

            // Rate limit hit — reset to pending for next tick (don't count as failure)
            if (msg.includes("RATE_LIMIT")) {
                await db
                    .update(jobs)
                    .set({ status: "pending", updatedAt: new Date() })
                    .where(eq(jobs.id, job.id));
                rateLimited++;
                logger.warn("Embedding rate limited — job reset to pending", {
                    jobId: job.id,
                });
                break; // Stop processing this tick
            }

            // Dimension mismatch — deterministic failure, mark failed immediately without retry
            if (msg.includes("Invalid embedding:") || msg.includes("dims, expected")) {
                await db
                    .update(jobs)
                    .set({
                        status: "failed",
                        error: `Non-retryable: ${msg}`,
                        retryCount: (job.retryCount ?? 0) + 1,
                        latencyMs: Date.now() - startTime,
                        updatedAt: new Date(),
                    })
                    .where(eq(jobs.id, job.id));

                errors.push(`Job ${job.id}: ${msg}`);
                failed++;
                logger.error("Embedding job failed (non-retryable dimension mismatch)", {
                    jobId: job.id,
                    error: msg,
                });
                continue; // Don't break — process next job
            }

            const newRetryCount = (job.retryCount ?? 0) + 1;
            const maxRetries = job.maxRetries ?? 3;

            await db
                .update(jobs)
                .set({
                    status: newRetryCount < maxRetries ? "pending" : "failed",
                    error: msg,
                    retryCount: newRetryCount,
                    latencyMs: Date.now() - startTime,
                    updatedAt: new Date(),
                })
                .where(eq(jobs.id, job.id));

            errors.push(`Job ${job.id}: ${msg}`);
            failed++;
            logger.error("Embedding job failed", {
                jobId: job.id,
                error: msg,
            });
        }
    }

    return { processed, failed, rateLimited, budget, errors: errors.slice(0, 5) };
}
