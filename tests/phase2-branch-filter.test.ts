import { describe, it, expect } from "vitest";
import { expandBranches } from "@/lib/constants/branches";

describe("Phase 2 — Branch Filter Fix", () => {
    it("T1: CSE expands to include all CSE specializations", () => {
        const expanded = expandBranches(["CSE"]);
        expect(expanded).toContain("CSE");
        expect(expanded).toContain("CSE-AIML");
        expect(expanded).toContain("CSE-DS");
        expect(expanded).toContain("CSE-Cyber");
        expect(expanded).toContain("CSE-Blockchain");
        expect(expanded).toContain("CSE-Fullstack");
        expect(expanded).toContain("CSE-IoT");
        expect(expanded).toContain("CSE-CCVT");
    });

    it("T2: CSE-AIML does NOT expand to other CSE branches", () => {
        const expanded = expandBranches(["CSE-AIML"]);
        expect(expanded).toContain("CSE-AIML");
        expect(expanded).not.toContain("CSE-DS");
        expect(expanded).not.toContain("CSE"); // No generic CSE added
        expect(expanded).toHaveLength(1);
    });

    it("T3: IT, ECE stay as-is (no expansion)", () => {
        const expanded = expandBranches(["IT", "ECE"]);
        expect(expanded).toContain("IT");
        expect(expanded).toContain("ECE");
        expect(expanded).toHaveLength(2);
    });

    it("T4: AIML student is eligible for CSE drive", () => {
        const eligibleBranches = ["CSE"];
        const studentBranch = "CSE-AIML";
        const expanded = expandBranches(eligibleBranches);
        const isEligible = expanded.some((b) => b.toLowerCase() === studentBranch.toLowerCase());
        expect(isEligible).toBe(true);
    });

    it("T5: ECE student is NOT eligible for CSE-only drive", () => {
        const eligibleBranches = ["CSE"];
        const studentBranch = "ECE";
        const expanded = expandBranches(eligibleBranches);
        const isEligible = expanded.some((b) => b.toLowerCase() === studentBranch.toLowerCase());
        expect(isEligible).toBe(false);
    });

    it("T6: mixed drive [CSE, IT] includes all CSE variants + IT", () => {
        const expanded = expandBranches(["CSE", "IT"]);
        expect(expanded).toContain("CSE-AIML");
        expect(expanded).toContain("IT");
        expect(expanded).not.toContain("ECE");
    });

    it("T7: empty eligibleBranches means all branches eligible", () => {
        // An empty array means "no branch restriction"
        const eligibleBranches: string[] = [];
        // The check: if (eligibleBranches.length > 0) { filter } else { allow all }
        const studentBranch = "ECE";
        const isEligible = eligibleBranches.length === 0 ||
            expandBranches(eligibleBranches).some((b) => b.toLowerCase() === studentBranch.toLowerCase());
        expect(isEligible).toBe(true);
    });
});
