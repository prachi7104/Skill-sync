import { describe, it, expect } from "vitest";
import { composeStudentEmbeddingText } from "@/lib/embeddings/compose";

describe("Extended embedding text composition", () => {
  it("includes research papers", () => {
    const text = composeStudentEmbeddingText({
      skills: [{ name: "PyTorch", category: "technical", proficiency: 3 }],
      researchPapers: [{ title: "Attention Is All You Need" }],
    });
    expect(text).toContain("Research:");
    expect(text).toContain("Attention Is All You Need");
  });

  it("includes certification issuer context", () => {
    const text = composeStudentEmbeddingText({
      skills: [],
      certifications: [
        { title: "Solutions Architect", issuer: "" },
        { title: "AWS Fundamentals", issuer: "Udemy" },
        { title: "AWS Certified", issuer: "Amazon" },
      ],
    });
    // AWS Certified (Amazon) should be distinguished from AWS Fundamentals (Udemy)
    expect(text).toContain("AWS Certified (Amazon)");
    expect(text).toContain("AWS Fundamentals (Udemy)");
  });

  it("stays within 2000 char limit", () => {
    const text = composeStudentEmbeddingText({
      skills: Array.from({ length: 50 }, (_, i) => ({ name: `skill${i}`, category: "technical", proficiency: 3 })),
      projects: Array.from({ length: 20 }, (_, i) => ({
        title: `Project${i}`,
        description: "x".repeat(200),
        techStack: [],
      })),
    });
    expect(text.length).toBeLessThanOrEqual(2000);
  });
});

describe("Content wall author visibility", () => {
  function canSeePost(post: { status: string; author_id: string }, userId: string): boolean {
    if (post.status === "published") return true;
    if (
      post.author_id === userId &&
      ["pending", "ai_approved", "ai_flagged"].includes(post.status)
    )
      return true;
    return false;
  }

  it("published posts visible to everyone", () => {
    expect(canSeePost({ status: "published", author_id: "other" }, "user1")).toBe(true);
  });

  it("pending post visible only to author", () => {
    expect(canSeePost({ status: "pending", author_id: "user1" }, "user1")).toBe(true);
    expect(canSeePost({ status: "pending", author_id: "user2" }, "user1")).toBe(false);
  });
});
