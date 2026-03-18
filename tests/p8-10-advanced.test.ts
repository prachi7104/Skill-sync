import { describe, expect, it } from "vitest";
import { z } from "zod";

import { buildSkillGapFrequency, extractRequiredSkills, formatCategoryLabel } from "@/lib/phase8-10";
import { normalizeCompanyName, slugToTitle, stripMarkdown } from "@/lib/content-utils";

const companySubmissionSchema = z.object({
  companyName: z.string().min(1).max(255),
  roleTitle: z.string().max(255).optional().nullable(),
  driveType: z.enum(["placement", "internship", "ppo"]).optional().nullable(),
  outcome: z.enum(["selected", "rejected", "not_disclosed"]).optional().nullable(),
  interviewProcess: z.string().max(1500).optional().nullable(),
  tips: z.string().max(1000).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  wouldRecommend: z.boolean().optional().nullable(),
  showName: z.boolean().optional().nullable(),
});

const resourceSchema = z.object({
  section: z.enum(["technical", "softskills"]),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  body: z.string().max(6000).optional().nullable(),
  bodyFormat: z.enum(["markdown", "text"]).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  companyName: z.string().max(255).optional().nullable(),
});

function hasSubmissionContent(input: z.infer<typeof companySubmissionSchema>) {
  return Boolean(input.companyName && (input.interviewProcess || input.tips));
}

type DriveRow = {
  id: string;
  company: string;
  roleTitle: string;
  deadline: Date | null;
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: string[] | null;
};

type StudentRow = {
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: string | null;
};

function isEligible(drive: DriveRow, student: StudentRow) {
  if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
    if (student.cgpa === null || student.cgpa === undefined || student.cgpa < drive.minCgpa) return false;
  }
  if (drive.eligibleBranches?.length) {
    if (!student.branch || !drive.eligibleBranches.includes(student.branch)) return false;
  }
  if (drive.eligibleBatchYears?.length) {
    if (student.batchYear === null || student.batchYear === undefined || !drive.eligibleBatchYears.includes(student.batchYear)) return false;
  }
  if (drive.eligibleCategories?.length) {
    if (!student.category || !drive.eligibleCategories.includes(student.category)) return false;
  }
  return true;
}

function detectConflicts(drives: DriveRow[], students: StudentRow[]) {
  const conflicts: Array<{ left: string; right: string; overlapCount: number; overlapPercent: number }> = [];

  for (let leftIndex = 0; leftIndex < drives.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < drives.length; rightIndex += 1) {
      const left = drives[leftIndex];
      const right = drives[rightIndex];

      if (left.deadline && right.deadline) {
        const diff = Math.abs(left.deadline.getTime() - right.deadline.getTime());
        if (diff > 7 * 24 * 60 * 60 * 1000) continue;
      }

      const overlapCount = students.filter((student) => isEligible(left, student) && isEligible(right, student)).length;
      const overlapPercent = students.length ? Math.round((overlapCount / students.length) * 100) : 0;

      if (overlapPercent >= 30 && overlapCount > 0) {
        conflicts.push({ left: left.id, right: right.id, overlapCount, overlapPercent });
      }
    }
  }

  return conflicts;
}

describe("Phases 8-10 advanced logic", () => {
  describe("company experience submission", () => {
    it("accepts a valid markdown-backed experience", () => {
      const payload = {
        companyName: "Google",
        roleTitle: "SWE Intern",
        driveType: "internship",
        outcome: "selected",
        interviewProcess: "- OA\n- Technical round\n- Hiring manager",
        tips: "Practice graphs and explain tradeoffs.",
        difficulty: 4,
        wouldRecommend: true,
        showName: false,
      };

      const parsed = companySubmissionSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(hasSubmissionContent(parsed.data)).toBe(true);
      }
    });

    it("rejects invalid enums and out-of-range difficulty", () => {
      const parsed = companySubmissionSchema.safeParse({
        companyName: "Acme",
        driveType: "campus",
        outcome: "pending",
        difficulty: 8,
      });
      expect(parsed.success).toBe(false);
    });

    it("requires at least one content field after schema validation", () => {
      const parsed = companySubmissionSchema.safeParse({
        companyName: "Microsoft",
        interviewProcess: "",
        tips: "",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(hasSubmissionContent(parsed.data)).toBe(false);
      }
    });
  });

  describe("resource publishing", () => {
    it("accepts markdown resources with tags", () => {
      const parsed = resourceSchema.safeParse({
        section: "technical",
        category: "system_design",
        title: "System Design Basics",
        body: "## Start here\nUnderstand load, latency, and storage.",
        bodyFormat: "markdown",
        tags: ["design", "backend"],
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects unsupported section values", () => {
      const parsed = resourceSchema.safeParse({
        section: "aptitude",
        category: "probability",
        title: "Aptitude",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("content utilities", () => {
    it("normalizes company names into stable slugs", () => {
      expect(normalizeCompanyName("  Morgan Stanley  ")).toBe("morgan_stanley");
      expect(slugToTitle("morgan_stanley")).toBe("Morgan Stanley");
    });

    it("strips basic markdown for previews", () => {
      expect(stripMarkdown("## Title\n- Item\n[Guide](https://example.com)")).toBe("Title Item Guide");
    });

    it("formats category labels for UI chips", () => {
      expect(formatCategoryLabel("resume_tips")).toBe("Resume Tips");
    });
  });

  describe("career coach skill-gap analysis", () => {
    it("extracts and deduplicates required skills from parsed JDs", () => {
      const skills = extractRequiredSkills({
        requiredSkills: ["React", "Node.js"],
        preferredSkills: ["Node.js", "Docker"],
      } as never);

      expect(skills).toEqual(["React", "Node.js", "Docker"]);
    });

    it("counts only missing skills across eligible drives", () => {
      const gaps = buildSkillGapFrequency({
        studentSkills: [{ name: "React" }],
        parsedJds: [
          { requiredSkills: ["React", "Node.js"], preferredSkills: ["Docker"] } as never,
          { requiredSkills: ["Node.js", "PostgreSQL"], preferredSkills: [] } as never,
          { requiredSkills: ["Docker"], preferredSkills: ["Node.js"] } as never,
        ],
      });

      expect(gaps).toEqual({
        "Node.js": 3,
        Docker: 2,
        PostgreSQL: 1,
      });
    });
  });

  describe("drive conflict detection", () => {
    it("flags overlapping drives within a 7-day deadline window", () => {
      const baseDate = new Date("2026-01-01T00:00:00.000Z");
      const drives: DriveRow[] = [
        {
          id: "drive-a",
          company: "A",
          roleTitle: "SWE",
          deadline: new Date(baseDate),
          minCgpa: 7,
          eligibleBranches: ["CSE"],
          eligibleBatchYears: [2026],
          eligibleCategories: ["alpha", "beta"],
        },
        {
          id: "drive-b",
          company: "B",
          roleTitle: "Analyst",
          deadline: new Date("2026-01-05T00:00:00.000Z"),
          minCgpa: 7,
          eligibleBranches: ["CSE"],
          eligibleBatchYears: [2026],
          eligibleCategories: ["alpha", "beta"],
        },
        {
          id: "drive-c",
          company: "C",
          roleTitle: "QA",
          deadline: new Date("2026-01-20T00:00:00.000Z"),
          minCgpa: 7,
          eligibleBranches: ["CSE"],
          eligibleBatchYears: [2026],
          eligibleCategories: ["alpha", "beta"],
        },
      ];

      const students: StudentRow[] = [
        { cgpa: 8, branch: "CSE", batchYear: 2026, category: "alpha" },
        { cgpa: 7.8, branch: "CSE", batchYear: 2026, category: "beta" },
        { cgpa: 6.5, branch: "ECE", batchYear: 2026, category: "alpha" },
        { cgpa: 8.2, branch: "CSE", batchYear: 2025, category: "alpha" },
      ];

      expect(detectConflicts(drives, students)).toEqual([
        { left: "drive-a", right: "drive-b", overlapCount: 2, overlapPercent: 50 },
      ]);
    });

    it("ignores overlaps below the threshold", () => {
      const drives: DriveRow[] = [
        {
          id: "drive-a",
          company: "A",
          roleTitle: "SWE",
          deadline: new Date("2026-01-01T00:00:00.000Z"),
          minCgpa: 7,
          eligibleBranches: ["CSE"],
          eligibleBatchYears: [2026],
          eligibleCategories: ["alpha"],
        },
        {
          id: "drive-b",
          company: "B",
          roleTitle: "SWE",
          deadline: new Date("2026-01-02T00:00:00.000Z"),
          minCgpa: 7,
          eligibleBranches: ["CSE"],
          eligibleBatchYears: [2026],
          eligibleCategories: ["alpha"],
        },
      ];

      const students: StudentRow[] = [
        { cgpa: 8, branch: "CSE", batchYear: 2026, category: "alpha" },
        { cgpa: 7.5, branch: "ECE", batchYear: 2026, category: "alpha" },
        { cgpa: 7.2, branch: "ME", batchYear: 2026, category: "alpha" },
        { cgpa: 8.1, branch: "CE", batchYear: 2026, category: "alpha" },
      ];

      expect(detectConflicts(drives, students)).toEqual([]);
    });
  });
});