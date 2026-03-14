
import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { enforceProfileGate, enforceDetailedAnalysisLimits, incrementDetailedAnalysisUsage, GuardrailViolation } from "@/lib/guardrails";
import { parseResumeWithAI } from "@/lib/resume/ai-parser";
import { performDetailedAnalysis } from "@/lib/ats/detailed-analysis";
import { generateEmbedding } from "@/lib/embeddings/generate";
import { parseJD } from "@/lib/jd/parser";
import { type StudentProfileInput } from "@/lib/validations/student-profile";

// Maximum execution time (Next.js default is often 10-60s, Vercel Pro is 60s)
// This process is heavy (3 AI calls + 2 Embeddings), might take 30s+.
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth + profile
        const { profile: student } = await requireStudentProfile();

        // 2. Profile gate (must meet placement profile requirements)
        await enforceProfileGate(student.id);

        // 3. Limit Check
        try {
            await enforceDetailedAnalysisLimits(student.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // GuardrailViolation carries the correct status (429) and structured JSON
            if (error instanceof GuardrailViolation) {
                return NextResponse.json(error.toJSON(), { status: error.status });
            }
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        // 4. Parse JSON body (text extracted client-side)
        const body = await req.json();
        const { resumeText, jdText } = body as { resumeText?: string; jdText?: string };

        if (!resumeText || !jdText) {
            return NextResponse.json({ error: "Missing resume text or JD text" }, { status: 400 });
        }

        if (resumeText.length < 50) {
            return NextResponse.json({ error: "Resume text is too sparse or empty." }, { status: 400 });
        }

        // 5. Parallel AI Processing
        // We need:
        // A. Parsed Resume (AI)
        // B. Structured JD (AI)
        // C. Resume Embedding (Model)
        // D. JD Embedding (Model)

        // Run AI parsing in parallel (these are independent of embeddings)
        const [parsedResume, structuredJD] = await Promise.all([
            parseResumeWithAI(resumeText),
            parseJD(jdText),
        ]);

        // Embeddings: fail gracefully — analysis continues without them
        let jdEmbedding: number[] | null = null;
        let studentProfileEmbedding: number[] | null = student.embedding ?? null;
        let embeddingWarning = false;

        try {
            jdEmbedding = await generateEmbedding(jdText, "jd");
        } catch (err) {
            console.warn("[sandbox/detailed] JD embedding failed, using keyword match:", err);
            embeddingWarning = true;
        }

        if (!studentProfileEmbedding) {
            try {
                const profileString = [
                    student.softSkills?.join(", "),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    student.skills?.map((s: any) => s.name).join(" "),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    student.projects?.map((p: any) => p.title + " " + p.description).join(" "),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    student.workExperience?.map((e: any) => e.role + " " + e.description).join(" "),
                ].filter(Boolean).join(" ");
                studentProfileEmbedding = await generateEmbedding(profileString);
            } catch (err) {
                console.warn("[sandbox/detailed] Profile embedding failed, using keyword match:", err);
                embeddingWarning = true;
            }
        }

        // 7. Perform Analysis
        // performDetailedAnalysis accepts null embeddings and falls back to keyword scoring
        const typedProfile = student as unknown as StudentProfileInput;

        const analysisResult = await performDetailedAnalysis(
            structuredJD,
            jdEmbedding,
            resumeText,
            parsedResume,
            typedProfile,
            studentProfileEmbedding
        );

        // 8. Increment Usage
        await incrementDetailedAnalysisUsage(student.id);

        return NextResponse.json({
            success: true,
            data: analysisResult,
            ...(embeddingWarning && { warning: "Semantic matching unavailable — keyword analysis used instead" }),
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Detailed Analysis Error:", error);
        return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
    }
}
