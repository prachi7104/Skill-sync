
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";
import { students, jobs } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { eq, and, sql } from "drizzle-orm";
import { parseResumeText } from "@/lib/resume/parser";
import { computeCompleteness } from "@/lib/profile/completeness";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const { user } = await requireStudentProfile();

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { message: "No file provided" },
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
                { message: "File size exceeds 2MB limit" },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { message: "Invalid file type. Only PDF and DOCX are allowed." },
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
                { message: "File content does not match PDF type." },
                { status: 400 }
            );
        }
        if (
            file.type ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
            !isZipMagic
        ) {
            return NextResponse.json(
                { message: "File content does not match DOCX type." },
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

        // Cloudinary 'raw' resources might not include extension in secure_url automatically if format wasn't respected strictly
        // But usually it does: .../resumes/user_resume_12345.pdf
        const resumeUrl = uploadResult.secure_url;

        // 5. Accept client-extracted text and parse inline
        const resumeText = formData.get("resumeText") as string | null;

        // Run deterministic structured parsing on extracted text
        let parsedResumeJson = null;
        let extractedSkills: { name: string; proficiency: 1 | 2 | 3 | 4 | 5 }[] = [];
        let extractedProjects: { title: string; description: string; techStack: string[]; url?: string }[] = [];
        
        if (resumeText && resumeText.length >= 20) {
            try {
                parsedResumeJson = parseResumeText(resumeText);
                
                // Auto-fill skills from parsed resume (default proficiency = 3)
                if (parsedResumeJson.skills && Array.isArray(parsedResumeJson.skills)) {
                    extractedSkills = parsedResumeJson.skills.slice(0, 25).map((name: string) => ({
                        name: name.trim(),
                        proficiency: 3 as const,
                    }));
                }
                
                // Auto-fill projects from parsed resume
                if (parsedResumeJson.projects && Array.isArray(parsedResumeJson.projects)) {
                    extractedProjects = parsedResumeJson.projects.slice(0, 5).map((desc: string, idx: number) => ({
                        title: `Project ${idx + 1}`,
                        description: desc.trim(),
                        techStack: [],
                        url: undefined,
                    }));
                }
            } catch {
                console.error("Resume text parsing failed, storing raw text only");
            }
        }

        // 6. Update DB — store URL, raw text, structured parse, AND auto-fill profile fields
        const updateData: Record<string, any> = {
            resumeUrl: resumeUrl,
            resumeFilename: file.name,
            resumeMime: file.type,
            resumeUploadedAt: new Date(),
            resumeText: resumeText || null,
            parsedResumeJson,
            resumeParsedAt: resumeText ? new Date() : null,
        };
        
        // Only auto-fill if profile fields are currently empty
        const currentProfile = await db.query.students.findFirst({
            where: eq(students.id, user.id),
        });
        
        if (currentProfile) {
            // Auto-fill skills only if currently empty
            if ((!currentProfile.skills || currentProfile.skills.length === 0) && extractedSkills.length > 0) {
                updateData.skills = extractedSkills;
            }
            
            // Auto-fill projects only if currently empty
            if ((!currentProfile.projects || currentProfile.projects.length === 0) && extractedProjects.length > 0) {
                updateData.projects = extractedProjects;
            }
        }
        
        await db
            .update(students)
            .set(updateData)
            .where(eq(students.id, user.id));

        // 7. Check profile completeness and queue embedding if ready
        const freshProfile = await db.query.students.findFirst({
            where: eq(students.id, user.id),
        });

        if (freshProfile) {
            const { score: completeness } = computeCompleteness({
                ...freshProfile,
                name: user.name,
                email: user.email,
            });

            // Persist updated completeness
            await db
                .update(students)
                .set({ profileCompleteness: completeness, updatedAt: new Date() })
                .where(eq(students.id, user.id));

            // Queue embedding generation when profile is >= 50% complete
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
        }

        return NextResponse.json(
            { message: "Resume uploaded and parsed successfully.", url: resumeUrl },
            { status: 200 }
        );

    } catch (error) {
        console.error("Resume upload failed:", error);
        return NextResponse.json(
            { message: "Internal server error during upload" },
            { status: 500 }
        );
    }
}
