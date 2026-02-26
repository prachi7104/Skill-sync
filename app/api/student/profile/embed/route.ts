import { NextResponse } from "next/server";
import { requireStudentProfileApi } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { enqueueEmbeddingJob, processEmbeddingJobs } from "@/lib/workers/generate-embedding";
import { computeCompleteness } from "@/lib/profile/completeness";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const { user, profile } = await requireStudentProfileApi();

        // Check completeness
        const { score } = computeCompleteness(profile as any);
        if (score < 50) {
            return NextResponse.json(
                { error: `Profile is only ${score}% complete. Minimum 50% required.` },
                { status: 400 }
            );
        }

        if (!profile.resumeUrl) {
            return NextResponse.json(
                { error: "Please upload your resume before generating an embedding." },
                { status: 400 }
            );
        }

        // Enqueue with high priority
        const jobId = await enqueueEmbeddingJob(user.id, "student", 10);

        // Try inline processing (fast path)
        const result = await processEmbeddingJobs().catch((err) => {
            console.error("[ManualEmbed] Inline processing failed:", err);
            return { processed: 0, failed: 0 };
        });

        // Check if embedding was generated
        const [updated] = await db
            .select({ embedding: students.embedding })
            .from(students)
            .where(eq(students.id, user.id))
            .limit(1);

        return NextResponse.json({
            success: true,
            jobId,
            embeddingGenerated: !!updated?.embedding,
            processed: (result as any).processed ?? 0,
            message: updated?.embedding
                ? "Embedding generated successfully!"
                : "Embedding job queued. It will process in the next batch (within 5 minutes).",
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to trigger embedding" },
            { status: 500 }
        );
    }
}
