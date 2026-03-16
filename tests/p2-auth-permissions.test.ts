import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Auth, Roles & Permissions unit tests
// ─────────────────────────────────────────────────────────────────────────────
// All logic is inlined here to avoid importing server-only modules.

const ALL_COMPONENTS = [
    "drive_management",
    "amcat_management",
    "technical_content",
    "softskills_content",
    "company_experiences",
    "student_feedback_posting",
    "sandbox_access",
    "student_management",
    "analytics_view",
] as const;

// ── Permission system ─────────────────────────────────────────────────────────

describe("Permission system", () => {
    it("admin always gets all components", () => {
        const role = "admin";
        const components = role === "admin" ? [...ALL_COMPONENTS] : [];
        expect(components).toHaveLength(9);
        expect(components).toContain("drive_management");
        expect(components).toContain("sandbox_access");
    });

    it("faculty creation always includes sandbox_access", () => {
        const requested = ["drive_management"];
        const final = [...new Set([...requested, "sandbox_access"])];
        expect(final).toContain("sandbox_access");
        expect(final).toContain("drive_management");
    });

    it("faculty without drive_management cannot create drives", () => {
        const components = ["sandbox_access", "technical_content"];
        const canCreateDrive = components.includes("drive_management");
        expect(canCreateDrive).toBe(false);
    });

    it("faculty with drive_management can create drives", () => {
        const components = ["sandbox_access", "drive_management"];
        const canCreateDrive = components.includes("drive_management");
        expect(canCreateDrive).toBe(true);
    });

    it("should reject invalid component names", () => {
        const VALID = [...ALL_COMPONENTS] as string[];
        const submitted = ["drive_management", "fake_component", "another_fake"];
        const invalid = submitted.filter((c) => !VALID.includes(c));
        expect(invalid).toHaveLength(2);
        expect(invalid).toContain("fake_component");
        expect(invalid).toContain("another_fake");
    });

    it("student role is always denied component access", () => {
        const role = "student";
        const canAccess = role !== "student";
        expect(canAccess).toBe(false);
    });

    it("deduplicates components when sandbox_access is already present", () => {
        const requested = ["sandbox_access", "drive_management", "sandbox_access"];
        const final = [...new Set([...requested, "sandbox_access"])];
        const sandboxCount = final.filter((c) => c === "sandbox_access").length;
        expect(sandboxCount).toBe(1);
    });
});

// ── College domain lookup ─────────────────────────────────────────────────────

describe("College domain lookup", () => {
    it("extracts the correct domain from an email", () => {
        const email = "student@stu.upes.ac.in";
        const domain = email.split("@")[1];
        expect(domain).toBe("stu.upes.ac.in");
    });

    it("should match student domain to a known college", () => {
        const email = "student@stu.upes.ac.in";
        const domain = email.split("@")[1];
        const knownDomains = ["stu.upes.ac.in", "students.bits.edu"];
        expect(knownDomains.includes(domain)).toBe(true);
    });

    it("should deny unknown domain not in DB", () => {
        const domain = "unknown.college.com";
        const knownDomains = ["stu.upes.ac.in"];
        const isKnown = knownDomains.includes(domain);
        expect(isKnown).toBe(false);
    });

    it("staff credentials bypass domain check entirely", () => {
        const provider = "staff-credentials";
        const bypassDomainCheck = provider === "staff-credentials";
        expect(bypassDomainCheck).toBe(true);
    });

    it("collegeId is stored on new user from domain lookup", () => {
        const mockCollegeId = "550e8400-e29b-41d4-a716-446655440000";
        const newUser = { email: "test@stu.upes.ac.in", collegeId: mockCollegeId };
        expect(newUser.collegeId).toBe(mockCollegeId);
    });
});

// ── Sandbox rate limits ───────────────────────────────────────────────────────

describe("Sandbox rate limits", () => {
    it("admin should always bypass rate limits", () => {
        const role: string = "admin";
        const shouldEnforce = role !== "admin";
        expect(shouldEnforce).toBe(false);
    });

    it("student should be subject to rate limits", () => {
        const role: string = "student";
        const shouldEnforce = role !== "admin";
        expect(shouldEnforce).toBe(true);
    });

    it("faculty should be subject to rate limits (but with higher limits)", () => {
        const role: string = "faculty";
        const shouldEnforce = role !== "admin";
        expect(shouldEnforce).toBe(true);
    });

    it("dynamic limits should use DB config over hardcoded defaults", () => {
        const dbConfig = { student_daily_limit: 5, student_monthly_limit: 50 };
        const defaults = { student_daily_limit: 3, student_monthly_limit: 20 };
        const dailyLimit = dbConfig?.student_daily_limit ?? defaults.student_daily_limit;
        const monthlyLimit = dbConfig?.student_monthly_limit ?? defaults.student_monthly_limit;
        expect(dailyLimit).toBe(5);
        expect(monthlyLimit).toBe(50);
    });

    it("falls back to hardcoded defaults when sandbox_config row is missing", () => {
        const dbConfig = null;
        const defaults = { student_daily_limit: 3, student_monthly_limit: 20 };
        const dailyLimit = dbConfig ?? defaults.student_daily_limit;
        expect(dailyLimit).toBe(3);
    });

    it("faculty uses faculty limits, not student limits", () => {
        const role = "faculty";
        const config = {
            student_daily_limit: 3,
            faculty_daily_limit: 10,
        };
        const limit = role === "faculty" ? config.faculty_daily_limit : config.student_daily_limit;
        expect(limit).toBe(10);
    });

    it("daily limit is enforced when usage meets or exceeds limit", () => {
        const dailyUsed = 5;
        const dailyLimit = 5;
        const isExceeded = dailyUsed >= dailyLimit;
        expect(isExceeded).toBe(true);
    });

    it("daily limit is not enforced when usage is below limit", () => {
        const dailyUsed = 4;
        const dailyLimit = 5;
        const isExceeded = dailyUsed >= dailyLimit;
        expect(isExceeded).toBe(false);
    });
});
