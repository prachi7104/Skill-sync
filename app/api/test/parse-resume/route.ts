
import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDFServer, extractTextFromDOCX, cleanResumeText } from "@/lib/resume/text-extractor";
import { parseResumeWithAI, mapParsedResumeToProfile } from "@/lib/resume/ai-parser";

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/parse-resume
 * 
 * Test endpoint to manually verify resume parsing (AI-powered).
 * Upload a file (multipart/form-data) to see the extracted text and parsed JSON.
 * 
 * ⚠️ Dev only — blocked in production.
 * 
 * Query params:
 *   ?map=true  — also returns the DB-mapped profile fields
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Dev-only guard
        if (process.env.NODE_ENV !== "development") {
            return NextResponse.json({ error: "Test endpoint available in development only" }, { status: 403 });
        }

        // 2. Handle File Upload
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided. Use: curl -X POST -F 'file=@resume.pdf' ..." }, { status: 400 });
        }

        console.log(`[Test] Parsing file: ${file.name} (${file.type}, ${file.size} bytes)`);

        // 3. Extract Text
        const arrayBuffer = await file.arrayBuffer();
        let textContent = "";

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            textContent = await extractTextFromPDFServer(arrayBuffer);
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.name.endsWith(".docx")
        ) {
            textContent = await extractTextFromDOCX(arrayBuffer);
        } else {
            return NextResponse.json({ error: `Unsupported file type: ${file.type}. Use PDF or DOCX.` }, { status: 400 });
        }

        const cleanedText = cleanResumeText(textContent);

        if (!cleanedText || cleanedText.length < 50) {
            return NextResponse.json({ error: "Extracted text is too short or empty", textLength: cleanedText.length }, { status: 422 });
        }

        console.log(`[Test] Extracted ${cleanedText.length} chars. Sending to AI parser...`);

        // 4. AI-Powered Parsing
        const start = Date.now();
        const parsed = await parseResumeWithAI(cleanedText);
        const aiDuration = Date.now() - start;

        console.log(`[Test] AI parsing completed in ${aiDuration}ms`);

        // 5. Optionally map to DB profile format
        const shouldMap = req.nextUrl.searchParams.get("map") === "true";
        const profileData = shouldMap ? mapParsedResumeToProfile(parsed) : undefined;

        // 6. Return Result
        return NextResponse.json({
            success: true,
            meta: {
                fileName: file.name,
                fileSize: file.size,
                textLength: cleanedText.length,
                aiParsingDurationMs: aiDuration,
            },
            parsed,
            ...(profileData ? { profileMapping: profileData } : {}),
            rawTextPreview: cleanedText.substring(0, 500) + (cleanedText.length > 500 ? "..." : ""),
        });

    } catch (error: any) {
        console.error("[Test] Parse failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        }, { status: 500 });
    }
}
