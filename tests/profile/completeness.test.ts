import { describe, it, expect } from "vitest";
import { computeCompleteness } from "@/lib/profile/completeness";

describe("computeCompleteness", () => {
    it("should block if critical fields are missing", () => {
        const result = computeCompleteness({});
        expect(result.isBlocked).toBe(true);
        expect(result.blocked).toContain("SAP ID is required");
        expect(result.blocked).toContain("Roll Number is required");
        expect(result.blocked).toContain("Resume upload is required");
        expect(result.score).toBe(0);
        expect(result.isGated).toBe(true); // blocked implies gated
    });

    it("should not block if sapId, rollNo, and resumeUrl are present", () => {
        const result = computeCompleteness({
            sapId: "500123456",
            rollNo: "21BCE1234",
            resumeUrl: "https://example.com/resume.pdf",
        });
        expect(result.isBlocked).toBe(false);
        expect(result.blocked).toHaveLength(0);
    });

    it("should calculate exact score for a partial profile (50%)", () => {
        const result = computeCompleteness({
            sapId: "500123456",
            rollNo: "21BCE1234",
            resumeUrl: "https://example.com/resume.pdf",
            // +15
            cgpa: 8.5,
            // +10
            branch: "Computer Science",
            // +10
            batchYear: 2025,
            // +15
            projects: [{}],
            // Total = 50
        });
        expect(result.isBlocked).toBe(false);
        expect(result.score).toBe(50);
        expect(result.isGated).toBe(true); // under 70
        expect(result.missing).toContain("Add at least one skill (20 pts)");
        expect(result.missing).toContain("Add your phone number (5 pts)");
    });

    it("should calculate exact score for a complete profile (100%)", () => {
        const result = computeCompleteness({
            sapId: "500123456",
            rollNo: "21BCE1234",
            resumeUrl: "https://example.com/resume.pdf",
            cgpa: 9.0, // 15
            branch: "CSE", // 10
            batchYear: 2025, // 10
            skills: [{}], // 20
            projects: [{}], // 15
            phone: "1234567890", // 5
            linkedin: "https://linkedin.com", // 5
            workExperience: [{}], // 10
            codingProfiles: [{}], // 5
            certifications: [{}], // 5
        });

        expect(result.isBlocked).toBe(false);
        expect(result.isGated).toBe(false);
        expect(result.score).toBe(100);
        expect(result.missing).toHaveLength(0);
    });

    it("should handle empty arrays correctly", () => {
        const result = computeCompleteness({
            sapId: "1",
            rollNo: "1",
            resumeUrl: "url",
            skills: [], // empty array should not give points
            projects: [],
            workExperience: [],
        });
        // Base 0 since no points earned
        expect(result.score).toBe(0);
        expect(result.missing).toContain("Add at least one skill (20 pts)");
    });
});
