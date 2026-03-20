import { describe, expect, it } from "vitest";

type CardFeedback = {
  cards: {
    technicalSkills: { score: number; bullets: string[] };
    experienceDepth: { score: number; bullets: string[] };
    domainAlignment: { score: number; bullets: string[]; multiDomainNote: string | null };
    resumeQuality: { score: number; bullets: string[] };
  };
  feedback: Array<{ priority: "Critical" | "Medium" | "Low"; type: string; title: string; body: string; evidence: string }>;
  softSkillSignals: string[];
};

function isV2CardsPayload(payload: { feedbackVersion?: string; cardFeedback?: CardFeedback | null }): boolean {
  return payload.feedbackVersion === "v2_cards" && !!payload.cardFeedback;
}

describe("P3.2 sandbox cards", () => {
  it("renders v2 cards payload shape", () => {
    const payload = {
      feedbackVersion: "v2_cards",
      cardFeedback: {
        cards: {
          technicalSkills: { score: 80, bullets: ["React"] },
          experienceDepth: { score: 75, bullets: ["Internship"] },
          domainAlignment: { score: 78, bullets: ["Web"], multiDomainNote: null },
          resumeQuality: { score: 82, bullets: ["Quantified impact"] },
        },
        feedback: [{ priority: "Critical" as const, type: "add_to_resume", title: "Add metrics", body: "Use numbers", evidence: "JD asks impact" }],
        softSkillSignals: ["communication"],
      },
    };

    expect(isV2CardsPayload(payload)).toBe(true);
  });

  it("falls back to v1 text when cardFeedback is missing", () => {
    const payload = { feedbackVersion: "v1_text", cardFeedback: null };
    expect(isV2CardsPayload(payload)).toBe(false);
  });
});
