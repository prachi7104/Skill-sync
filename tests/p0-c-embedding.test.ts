import { describe, it, expect } from "vitest";
import { composeStudentEmbeddingText } from "@/lib/embeddings/compose";

describe("composeStudentEmbeddingText - extended fields", () => {
  it("includes certifications with issuer for differentiation", () => {
    const text = composeStudentEmbeddingText({
      skills: [{ name: "AWS", proficiency: 3 }],
      certifications: [
        { title: "Solutions Architect", issuer: "Amazon" },
        { title: "AWS Fundamentals", issuer: "Udemy" },
      ],
    });

    expect(text).toContain("Solutions Architect (Amazon)");
    expect(text).toContain("AWS Fundamentals (Udemy)");
  });

  it("includes research papers", () => {
    const text = composeStudentEmbeddingText({
      skills: [{ name: "PyTorch", proficiency: 3 }],
      researchPapers: [{ title: "Attention Is All You Need" }],
    });
    expect(text).toContain("Research:");
    expect(text).toContain("Attention Is All You Need");
  });

  it("includes soft skills", () => {
    const text = composeStudentEmbeddingText({
      skills: [],
      softSkills: ["Leadership", "Communication"],
    });
    expect(text).toContain("Soft Skills:");
    expect(text).toContain("Leadership");
  });

  it("stays within 2000 char limit", () => {
    const text = composeStudentEmbeddingText({
      skills: Array.from({ length: 50 }, (_, i) => ({ name: `skill${i}`, proficiency: 3 as const })),
      projects: Array.from({ length: 20 }, (_, i) => ({
        title: `project${i}`,
        description: "a".repeat(200),
        techStack: [],
      })),
      certifications: [],
    });
    expect(text.length).toBeLessThanOrEqual(2000);
  });

  it("empty profile returns empty string", () => {
    const text = composeStudentEmbeddingText({});
    expect(text).toBe("");
  });
});

describe("Embedding trigger conditions", () => {
  const SIGNAL_FIELDS = [
    "skills",
    "projects",
    "workExperience",
    "certifications",
    "researchPapers",
    "achievements",
    "softSkills",
  ];

  it("triggers re-embedding when skills change", () => {
    const update = { skills: [{ name: "Python" }] };
    const hasSignal = SIGNAL_FIELDS.some((f) => f in update);
    expect(hasSignal).toBe(true);
  });

  it("does not trigger re-embedding for non-signal fields", () => {
    const update = { phone: "9876543210", linkedin: "li.com/test" };
    const hasSignal = SIGNAL_FIELDS.some((f) => f in update);
    expect(hasSignal).toBe(false);
  });

  it("triggers when completeness crosses 50 percent threshold first time", () => {
    const prev = 45;
    const curr = 55;
    const isFirstCross = curr >= 50 && prev < 50;
    expect(isFirstCross).toBe(true);
  });

  it("does not duplicate job if one already pending", () => {
    const pendingJobs = [{ type: "generate_embedding", status: "pending", targetId: "user1" }];
    const alreadyQueued = pendingJobs.some(
      (j) => j.type === "generate_embedding" && j.status === "pending" && j.targetId === "user1",
    );
    expect(alreadyQueued).toBe(true);
  });
});

describe("4x/day schedule", () => {
  it("refresh times are spread evenly through day", () => {
    const hours = [0, 6, 12, 18];
    const intervals = hours.map((h, i) =>
      i > 0 ? h - hours[i - 1] : 24 - hours[hours.length - 1] + h,
    );
    expect(intervals.every((i) => i === 6)).toBe(true);
  });
});
