/**
 * Client-side resume text extraction.
 *
 * Uses pdfjs-dist (Mozilla PDF.js) for PDFs and mammoth for DOCX.
 * Designed to run in the browser so parsing happens before upload,
 * eliminating the need for a server-side background job.
 *
 * Server-side (Node.js) usage is also supported via the legacy
 * pdfjs-dist build — see extractTextFromPDFServer().
 */

import mammoth from "mammoth";

// ---------------------------------------------------------------------------
// Client-side (browser) extraction
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF ArrayBuffer using pdfjs-dist (browser build).
 * Dynamically imports pdfjs-dist to avoid SSR issues in Next.js.
 */
export async function extractTextFromPDF(
    arrayBuffer: ArrayBuffer,
): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist");

    // Configure worker only in browser
    if (
        typeof window !== "undefined" &&
        !pdfjsLib.GlobalWorkerOptions.workerSrc
    ) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
        .promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item) => ("str" in item ? item.str : ""))
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

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
        .promise;
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
