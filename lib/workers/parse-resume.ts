/**
 * Background worker for processing parse_resume jobs.
 *
 * Primary resume parsing now happens client-side (browser) via
 * pdfjs-dist + mammoth.  This worker serves as a fallback for
 * any legacy jobs still in the queue.
 *
 * Audit fixes applied:
 *  - Filters by type = 'parse_resume' (was picking up ALL pending jobs)
 *  - Atomic claim via UPDATE … WHERE status='pending' (race-safe)
 *  - Retry logic that respects maxRetries
 *  - Processes up to MAX_JOBS_PER_TICK per invocation
 *  - Uses pdfjs-dist legacy build (replaces pdf-parse)
 *  - Uses shared parseResumeText from lib/resume/parser
 */

import { db } from "@/lib/db";
import { jobs, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import mammoth from "mammoth";
import { extractTextFromPDFServer, cleanResumeText } from "@/lib/resume/text-extractor";
import { parseResumeText } from "@/lib/resume/parser";
import { logger } from "@/lib/logger";

const MAX_JOBS_PER_TICK = 5;

export async function processResumeParseJobs() {
    logger.info("Checking for pending resume parse jobs");

    for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        // 1. Find one pending parse_resume job
        const [pendingJob] = await db
            .select({ id: jobs.id })
            .from(jobs)
            .where(
                and(
                    eq(jobs.type, "parse_resume"),
                    eq(jobs.status, "pending"),
                ),
            )
            .limit(1);

        if (!pendingJob) break; // queue drained

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

        if (claimed.length === 0) continue; // another worker grabbed it

        const job = claimed[0];
        const processingStart = Date.now();

        try {
            const { resumeUrl, mimeType, studentId } = job.payload as {
                resumeUrl: string;
                mimeType: string;
                studentId: string;
            };

            console.log(`Processing job ${job.id} for student ${studentId}`);

            // 3. Check if the student already has extracted text (from client-side)
            const student = await db.query.students.findFirst({
                where: eq(students.id, studentId),
                columns: { resumeText: true },
            });

            let textContent = student?.resumeText ?? "";

            // 4. If no text yet, download and extract server-side
            if (!textContent) {
                const response = await fetch(resumeUrl);
                if (!response.ok) {
                    throw new Error(
                        `Failed to download resume: ${response.statusText}`,
                    );
                }
                const arrayBuffer = await response.arrayBuffer();

                if (mimeType === "application/pdf") {
                    textContent = await extractTextFromPDFServer(arrayBuffer);
                } else if (
                    mimeType ===
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ) {
                    const result = await mammoth.extractRawText({
                        buffer: Buffer.from(arrayBuffer),
                    });
                    textContent = result.value;
                } else {
                    throw new Error(`Unsupported MIME type: ${mimeType}`);
                }

                textContent = cleanResumeText(textContent);
            }

            // 5. Structured parsing
            const parsedData = parseResumeText(textContent);

            // 6. Update student profile
            await db
                .update(students)
                .set({
                    parsedResumeJson: parsedData,
                    resumeText: textContent,
                    resumeParsedAt: new Date(),
                })
                .where(eq(students.id, studentId));

            // 7. Mark job complete
            await db
                .update(jobs)
                .set({
                    status: "completed",
                    result: parsedData,
                    latencyMs: Date.now() - processingStart,
                    updatedAt: new Date(),
                })
                .where(eq(jobs.id, job.id));

            logger.info("Resume parse job completed", { jobId: job.id, studentId });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Unknown error";
            logger.error("Resume parse job failed", { jobId: job.id, error: message });

            const newRetryCount = (job.retryCount ?? 0) + 1;
            const maxRetries = job.maxRetries ?? 3;

            // Re-queue if retries remaining, else mark permanently failed
            await db
                .update(jobs)
                .set({
                    status: newRetryCount < maxRetries ? "pending" : "failed",
                    error: message,
                    retryCount: newRetryCount,
                    updatedAt: new Date(),
                })
                .where(eq(jobs.id, job.id));
        }
    }
}
