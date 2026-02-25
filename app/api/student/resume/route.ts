
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";
import { students, jobs } from "@/lib/db/schema";
import { requireStudentProfileApi, ApiError } from "@/lib/auth/helpers";
import { eq, and, sql } from "drizzle-orm";
import { processResumeParseJobs } from "@/lib/workers/parse-resume";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const { user, profile } = await requireStudentProfileApi();

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // 3. Validation
        // Max size: 2MB = 2 * 1024 * 1024 bytes
        const MAX_SIZE = 2 * 1024 * 1024;
        const ALLOWED_TYPES = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        ];

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, error: "File size exceeds 2MB limit" },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Invalid file type. Only PDF and DOCX are allowed." },
                { status: 400 }
            );
        }

        // Extra MIME validation: verify magic bytes match declared type
        const headerBytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
        const isPdfMagic =
            headerBytes[0] === 0x25 &&
            headerBytes[1] === 0x50 &&
            headerBytes[2] === 0x44 &&
            headerBytes[3] === 0x46; // %PDF
        const isZipMagic =
            headerBytes[0] === 0x50 &&
            headerBytes[1] === 0x4b &&
            headerBytes[2] === 0x03 &&
            headerBytes[3] === 0x04; // PK.. (DOCX is a ZIP)

        if (file.type === "application/pdf" && !isPdfMagic) {
            return NextResponse.json(
                { success: false, error: "File content does not match PDF type." },
                { status: 400 }
            );
        }
        if (
            file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
            !isZipMagic
        ) {
            return NextResponse.json(
                { success: false, error: "File content does not match DOCX type." },
                { status: 400 }
            );
        }

        // 4. Upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate a unique public_id to prevent caching issues or collisions
        const timestamp = Date.now();
        const publicId = `${user.id}_resume_${timestamp}`;
        // Determine format explicitly
        const isPdf = file.type === "application/pdf";
        const format = isPdf ? "pdf" : "docx";

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "resumes",
                    resource_type: "raw", // Use 'raw' for all binary files (PDF, DOCX) to ensure public access
                    public_id: `${publicId}.${format}`,
                    access_mode: "public", // Explicitly set public access
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        const resumeUrl = uploadResult.secure_url;

        // 5. Get client-extracted text
        const resumeText = formData.get("resumeText") as string | null;
        const source = (formData.get("source") as string | null)?.toString() || "";

        // 6. Update DB — store URL and raw text immediately (fast response)
        await db
            .update(students)
            .set({
                resumeUrl: resumeUrl,
                resumeFilename: file.name,
                resumeMime: file.type,
                resumeUploadedAt: new Date(),
                resumeText: resumeText || null,
                updatedAt: new Date(),
            })
            .where(eq(students.id, user.id));

        // 7. Enqueue AI parsing job (ONLY if onboarding is NOT complete)
        // Post-onboarding uploads are storage-only updates.
        let jobId: string | null = null;
        const isOnboarded = profile.onboardingStep >= 10;
        const shouldQueue = source === "onboarding" || !isOnboarded;

        // If onboarding flow or not yet complete, enqueue a parse job so the server
        // can attempt server-side extraction when client-side text is missing.
        // We include resumeText if present, otherwise null and the worker will fetch the file.
        if (shouldQueue) {
            // Check for existing pending parse job for this student (dedup)
            const existingJob = await db.query.jobs.findFirst({
                where: and(
                    eq(jobs.type, "parse_resume"),
                    eq(jobs.status, "pending"),
                    sql`${jobs.payload}->>'studentId' = ${user.id}`,
                ),
            });

            if (existingJob) {
                // Update existing pending job with new text
                await db
                    .update(jobs)
                    .set({
                        payload: {
                            studentId: user.id,
                            resumeText: resumeText && resumeText.length >= 50 ? resumeText : null,
                            resumeUrl,
                            mimeType: file.type,
                        },
                        updatedAt: new Date(),
                    })
                    .where(eq(jobs.id, existingJob.id));
                jobId = existingJob.id;
                console.log(`[Resume API] Updated existing job ${jobId} for student ${user.id}`);
            } else {
                // Insert new job (payload.resumeText may be null)
                const [newJob] = await db
                    .insert(jobs)
                    .values({
                        type: "parse_resume",
                        status: "pending",
                        priority: 7, // Resume parsing is high priority
                        payload: {
                            studentId: user.id,
                            resumeText: resumeText && resumeText.length >= 50 ? resumeText : null,
                            resumeUrl,
                            mimeType: file.type,
                        },
                    })
                    .returning({ id: jobs.id });
                jobId = newJob.id;
                console.log(`[Resume API] Enqueued new job ${jobId} for student ${user.id}`);
            }
            // Fire-and-forget: trigger worker immediately so the job is processed
            // without waiting for the external cron. Errors are caught silently.
            processResumeParseJobs().catch((err) =>
                console.error("[Resume API] Background parse failed:", err)
            );
        }

        // Warn early if AI keys are not present — parsing will likely fail.
        const warnings: string[] = [];
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GROQ_API_KEY) {
            warnings.push("AI provider not configured — resume parsing may fail until API keys are set on the server.");
            console.warn("[Resume API] No AI keys configured; parsing jobs will likely fail.");
        }

        return NextResponse.json(
            {
                success: true,
                message: "Resume uploaded.",
                data: {
                    url: resumeUrl,
                    jobId,
                    status: jobId ? "queued" : "uploaded",
                    warnings,
                }
            },
            { status: 202 }
        );

    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }
        console.error("Resume upload failed:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error during upload" },
            { status: 500 }
        );
    }
}
