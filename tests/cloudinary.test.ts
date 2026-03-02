/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Cloudinary Upload Validation Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - Allowed MIME types (PDF, DOCX only)
 *   - Rejected MIME types (JPEG, PNG, etc.)
 *   - Max file size (5 MB)
 *
 * No actual Cloudinary calls — pure validation logic tests.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Inline validation constants (mirrors app/api/student/resume/upload) ─────

const ALLOWED_MIMES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function isAllowedMime(mime: string): boolean {
    return ALLOWED_MIMES.includes(mime);
}

function isWithinSizeLimit(sizeBytes: number): boolean {
    return sizeBytes <= MAX_SIZE;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Cloudinary Upload — MIME validation", () => {
    it("should allow PDF", () => {
        expect(isAllowedMime("application/pdf")).toBe(true);
    });

    it("should allow DOCX", () => {
        expect(
            isAllowedMime(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        ).toBe(true);
    });

    it("should reject JPEG", () => {
        expect(isAllowedMime("image/jpeg")).toBe(false);
    });

    it("should reject PNG", () => {
        expect(isAllowedMime("image/png")).toBe(false);
    });

    it("should reject plain text", () => {
        expect(isAllowedMime("text/plain")).toBe(false);
    });

    it("should reject empty string", () => {
        expect(isAllowedMime("")).toBe(false);
    });
});

describe("Cloudinary Upload — Size validation", () => {
    it("should allow files under 5 MB", () => {
        expect(isWithinSizeLimit(1024)).toBe(true); // 1 KB
        expect(isWithinSizeLimit(1 * 1024 * 1024)).toBe(true); // 1 MB
        expect(isWithinSizeLimit(4.9 * 1024 * 1024)).toBe(true); // 4.9 MB
    });

    it("should allow files exactly 5 MB", () => {
        expect(isWithinSizeLimit(5 * 1024 * 1024)).toBe(true);
    });

    it("should reject files over 5 MB", () => {
        expect(isWithinSizeLimit(5 * 1024 * 1024 + 1)).toBe(false);
        expect(isWithinSizeLimit(10 * 1024 * 1024)).toBe(false);
    });

    it("should allow 0-byte files", () => {
        expect(isWithinSizeLimit(0)).toBe(true);
    });

    it("MAX_SIZE should equal 5,242,880 bytes", () => {
        expect(MAX_SIZE).toBe(5_242_880);
    });
});
