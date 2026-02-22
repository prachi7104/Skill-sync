import { db } from "@/lib/db";
import { jobs, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateEmbedding, composeStudentEmbeddingText } from "@/lib/embeddings";

const MAX_JOBS_PER_TICK = 3;

/**
 * Worker to process pending generate_embedding jobs.
 * Can be called by cron or inline.
 */
export async function processEmbeddingJobs() {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error("[Worker:Embeddings] GOOGLE_GENERATIVE_AI_API_KEY not set — skipping tick");
        return { processed: 0, failed: 0 };
    }

    console.log("[Worker:Embeddings] Checking for pending generate_embedding jobs...");

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        // 1. Find one pending generate_embedding job
        const [pendingJob] = await db
            .select({ id: jobs.id })
            .from(jobs)
            .where(
                and(
                    eq(jobs.type, "generate_embedding"),
                    eq(jobs.status, "pending"),
                ),
            )
            .limit(1);

        if (!pendingJob) break; // queue drained

        // 2. Atomically claim it
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

            console.log(
                `[Worker:Embeddings] Processing job ${job.id} for ${targetType} ${targetId}`,
            );

            if (targetType === "student") {
                // Fetch student profile
                const student = await db.query.students.findFirst({
                    where: eq(students.id, targetId),
                    columns: {
                        id: true,
                        skills: true,
                        projects: true,
                        workExperience: true,
                        certifications: true,
                    },
                });

                if (!student) {
                    throw new Error(`Student not found: ${targetId}`);
                }

                const text = composeStudentEmbeddingText({
                    skills: student.skills,
                    projects: student.projects,
                    workExperience: student.workExperience,
                    certifications: student.certifications,
                });

                if (!text || text.trim().length === 0) {
                    throw new Error("Empty profile text, cannot generate embedding");
                }

                const embedding = await generateEmbedding(text);

                await db
                    .update(students)
                    .set({ embedding, updatedAt: new Date() })
                    .where(eq(students.id, targetId));
            } else {
                // Drive embeddings are handled by the ranking pipeline
                throw new Error(`Unsupported target type: ${targetType}`);
            }

            // Mark complete
            await db
                .update(jobs)
                .set({
                    status: "completed",
                    result: { targetType, targetId },
                    latencyMs: Date.now() - startTime,
                    updatedAt: new Date(),
                })
                .where(eq(jobs.id, job.id));

            console.log(`[Worker:Embeddings] Job ${job.id} completed successfully.`);
            processed++;
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Unknown error";
            console.error(`[Worker:Embeddings] Job ${job.id} failed:`, message);

            const newRetryCount = (job.retryCount ?? 0) + 1;
            const maxRetries = job.maxRetries ?? 3;

            await db
                .update(jobs)
                .set({
                    status: newRetryCount < maxRetries ? "pending" : "failed",
                    error: message,
                    retryCount: newRetryCount,
                    latencyMs: Date.now() - startTime,
                    updatedAt: new Date(),
                })
                .where(eq(jobs.id, job.id));

            failed++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return { processed, failed };
}
