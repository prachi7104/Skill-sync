import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractTextFromUrl } from "@/lib/resume/server-extractor";
import mammoth from "mammoth";

describe("server-extractor", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("uses mammoth for DOCX and returns cleaned text (mocked)", async () => {
        const fakeText = "This is a test docx content";

        // Mock global.fetch to return a minimal response
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(0),
            headers: { get: () => "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        }));

        // Mock mammoth to return our fake text
        vi.spyOn(mammoth, "extractRawText").mockResolvedValue({ value: fakeText } as any);

        const text = await extractTextFromUrl("https://example.com/fake.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        expect(text).toContain("test docx");
    });
});
