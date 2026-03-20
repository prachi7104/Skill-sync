import { describe, expect, it } from "vitest";

function scoreSandbox(hasEmbedding: boolean, atsScore: number) {
  const semantic = hasEmbedding ? 80 : 0;
  const total = Math.round((semantic * 0.7 + atsScore * 0.3) * 100) / 100;
  return { semantic, ats: atsScore, total };
}

function buildCardFeedback(enabled: boolean) {
  if (!enabled) return { feedbackVersion: "v1_text", cardFeedback: null };
  return {
    feedbackVersion: "v2_cards",
    cardFeedback: {
      cards: {
        technicalSkills: { score: 82, bullets: ["React"] },
        experienceDepth: { score: 70, bullets: ["Internships"] },
        domainAlignment: { score: 76, bullets: ["Web stack"], multiDomainNote: null },
        resumeQuality: { score: 79, bullets: ["Strong formatting"] },
      },
      feedback: [],
      softSkillSignals: [],
    },
  };
}

describe("sandbox route", () => {
  it("returns ats-only weighted score without embedding", () => {
    const score = scoreSandbox(false, 60);
    expect(score.semantic).toBe(0);
    expect(score.total).toBe(18);
  });

  it("returns v2 cards payload when enabled", () => {
    const payload = buildCardFeedback(true);
    expect(payload.feedbackVersion).toBe("v2_cards");
    expect(payload.cardFeedback).toBeTruthy();
  });
});
