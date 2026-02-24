import mammoth from "mammoth";
import { cleanResumeText } from "@/lib/resume/text-extractor";

/**
 * Download a resume from `url` and extract cleaned plain text.
 * `mimeHint` may be provided to help choose the parser.
 */
export async function extractTextFromUrl(url: string, mimeHint?: string): Promise<string> {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to download resume (status ${resp.status})`);

    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mime = (mimeHint || resp.headers.get("content-type") || "").toLowerCase();

    let text = "";

    if (mime.includes("pdf") || mime.includes("application/pdf")) {
        // Dynamic import: pdf-parse reads a test PDF at module load time,
        // which crashes serverless environments without a local filesystem.
        const pdfParse = (await import("pdf-parse")).default;
        const pdfRes: any = await pdfParse(buffer);
        text = pdfRes?.text || "";
    } else {
        const docRes = await mammoth.extractRawText({ arrayBuffer });
        text = docRes?.value || "";
    }

    return cleanResumeText(text || "");
}

export default extractTextFromUrl;
