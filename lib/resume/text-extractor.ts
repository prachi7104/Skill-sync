/**
 * Client-side resume text extraction.
 *
 * Uses PDF.js loaded from CDN for PDFs and mammoth for DOCX.
 * ALL text extraction runs in the browser — the server never
 * needs to parse PDF/DOCX files directly.
 */

import mammoth from "mammoth";

// ---------------------------------------------------------------------------
// PDF.js CDN loader (avoids webpack bundling issues)
// ---------------------------------------------------------------------------

const PDFJS_VERSION = "4.4.168"; // Stable version with good ESM support
const PDFJS_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLibCache: any = null;

async function loadPdfJs() {
    if (pdfjsLibCache) return pdfjsLibCache;
    
    if (typeof window === "undefined") {
        throw new Error("PDF extraction requires browser environment");
    }
    
    // Dynamic import from CDN
    const pdfjsLib = await import(/* webpackIgnore: true */ PDFJS_CDN_URL);
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    pdfjsLibCache = pdfjsLib;
    return pdfjsLib;
}

// ---------------------------------------------------------------------------
// Client-side (browser) extraction
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF ArrayBuffer using PDF.js loaded from CDN.
 * This avoids webpack ESM bundling issues with pdfjs-dist.
 */
export async function extractTextFromPDF(
    arrayBuffer: ArrayBuffer,
): Promise<string> {
    const pdfjsLib = await loadPdfJs();

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
        .promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => (item.str ?? ""))
            .join(" ");
        pages.push(pageText);
    }

    return pages.join("\n");
}

/**
 * Extract text from a DOCX ArrayBuffer using mammoth.
 * Works in both browser and Node.js.
 */
export async function extractTextFromDOCX(
    arrayBuffer: ArrayBuffer,
): Promise<string> {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/**
 * Dispatch: extract text from a File based on its MIME type.
 * Intended for client-side use (takes a browser File object).
 */
export async function extractTextFromResume(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === "application/pdf") {
        return extractTextFromPDF(arrayBuffer);
    }

    if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        return extractTextFromDOCX(arrayBuffer);
    }

    throw new Error(`Unsupported file type: ${file.type}`);
}

// ---------------------------------------------------------------------------
// Text cleaning utility
// ---------------------------------------------------------------------------

/**
 * Clean and normalize extracted resume text.
 * Collapses whitespace, strips non-printable control chars but preserves
 * Unicode characters (accented names, currency symbols, etc.).
 */
export function cleanResumeText(text: string): string {
    return text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars only (preserve Unicode)
        .replace(/[ \t]+/g, " ")           // collapse horizontal whitespace
        .replace(/\n{3,}/g, "\n\n")        // collapse excessive newlines
        .trim();
}
