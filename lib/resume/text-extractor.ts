/**
 * Client-side resume text extraction.
 *
 * Uses PDF.js loaded from CDN for PDFs and mammoth for DOCX.
 * Designed to run in the browser so parsing happens before upload,
 * eliminating the need for a server-side background job.
 *
 * Server-side (Node.js) usage is also supported via the legacy
 * pdfjs-dist build — see extractTextFromPDFServer().
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
// Server-side (Node.js) extraction  — used by the fallback worker
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF ArrayBuffer using the pdfjs-dist legacy build.
 * The legacy build avoids browser-only globals like DOMMatrix.
 */
export async function extractTextFromPDFServer(
    arrayBuffer: ArrayBuffer,
): Promise<string> {
    // Use the legacy build that works in Node.js (no DOMMatrix dependency)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Disable the worker — Vercel Lambda doesn't bundle pdf.worker.mjs
    // and we only need text extraction, not rendering.
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        disableAutoFetch: true,
        useWorkerFetch: false,
    }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item: unknown) => {
                const rec = item as Record<string, unknown>;
                return typeof rec.str === "string" ? rec.str : "";
            })
            .join(" ");
        pages.push(pageText);
    }

    return pages.join("\n");
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
