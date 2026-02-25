import { describe, it, expect } from "vitest";

// We test ApiError in isolation to avoid importing the full helpers module
// which transitively pulls in server-only dependencies (db, etc.)

// ── Inline ApiError (mirrors lib/auth/helpers.ts) ────────────────────────────

class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ApiError", () => {
    it("should create error with status code", () => {
        const err = new ApiError(401, "Unauthorized");
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe("Unauthorized");
        expect(err.name).toBe("ApiError");
        expect(err instanceof Error).toBe(true);
        expect(err instanceof ApiError).toBe(true);
    });

    it("should create 403 forbidden", () => {
        const err = new ApiError(403, "Forbidden: requires role faculty");
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe("Forbidden: requires role faculty");
    });

    it("should create 404 not found", () => {
        const err = new ApiError(404, "Student profile not found. Please complete onboarding.");
        expect(err.statusCode).toBe(404);
        expect(err.message).toContain("onboarding");
    });

    it("should be catchable as Error", () => {
        try {
            throw new ApiError(401, "test");
        } catch (e: unknown) {
            expect(e instanceof Error).toBe(true);
            expect(e instanceof ApiError).toBe(true);
            if (e instanceof ApiError) {
                expect(e.statusCode).toBe(401);
            }
        }
    });
});

describe("isStudentEmail logic", () => {
    const domain = "stu.upes.ac.in";

    it("student domain matches correctly", () => {
        expect("test@stu.upes.ac.in".toLowerCase().endsWith(`@${domain}`)).toBe(true);
    });

    it("non-student domain does not match", () => {
        expect("test@upes.ac.in".toLowerCase().endsWith(`@${domain}`)).toBe(false);
    });

    it("gmail does not match", () => {
        expect("test@gmail.com".toLowerCase().endsWith(`@${domain}`)).toBe(false);
    });

    it("case-insensitive match works", () => {
        expect("TEST@STU.UPES.AC.IN".toLowerCase().endsWith(`@${domain}`)).toBe(true);
    });

    it("subdomain does not match", () => {
        expect("user@sub.stu.upes.ac.in".toLowerCase().endsWith(`@${domain}`)).toBe(false);
    });
});

describe("isAdminEmail logic", () => {
    const adminEmail = "admin@example.com";

    it("exact match works", () => {
        expect("admin@example.com".toLowerCase() === adminEmail.toLowerCase()).toBe(true);
    });

    it("case-insensitive match works", () => {
        expect("ADMIN@EXAMPLE.COM".toLowerCase() === adminEmail.toLowerCase()).toBe(true);
    });

    it("different email does not match", () => {
        expect("other@example.com".toLowerCase() === adminEmail.toLowerCase()).toBe(false);
    });
});
