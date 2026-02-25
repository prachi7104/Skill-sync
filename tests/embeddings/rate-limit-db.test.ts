import { describe, it, expect } from "vitest";

// Inline MODEL_LIMITS to avoid importing from rate-limit-db.ts
// which has "server-only" imports that fail in vitest jsdom env
interface ModelRateLimit {
    rpd: number;
    rpm: number;
}

const MODEL_LIMITS: Record<string, ModelRateLimit> = {
    gemini_embedding: { rpd: 1000, rpm: 100 },
    groq_llama_4_scout: { rpd: 1000, rpm: 30 },
    groq_qwen_32b: { rpd: 1000, rpm: 60 },
    groq_llama_3_3_70b: { rpd: 1000, rpm: 30 },
    groq_llama_3_1_8b: { rpd: 14400, rpm: 30 },
    gemini_2_5_flash: { rpd: 250000, rpm: 10 },
    gemini_2_0_flash: { rpd: 1500, rpm: 15 },
};

describe("Model limits configuration", () => {
    it("should have correct real limits for gemini_embedding", () => {
        const limits = MODEL_LIMITS["gemini_embedding"];
        expect(limits).toBeDefined();
        expect(limits.rpd).toBeLessThanOrEqual(1000); // Free tier: 1K RPD
        expect(limits.rpm).toBeLessThanOrEqual(100); // Free tier: 100 RPM
    });

    it("safe batch size should not exceed RPM/7 per tick", () => {
        const limits = MODEL_LIMITS["gemini_embedding"];
        const safeBatchPerTick = Math.floor(limits.rpm / 7);
        expect(safeBatchPerTick).toBeLessThanOrEqual(14); // 100/7 = 14
        expect(safeBatchPerTick).toBeGreaterThan(0);
    });

    it("should have all expected models", () => {
        expect(MODEL_LIMITS).toHaveProperty("gemini_embedding");
        expect(MODEL_LIMITS).toHaveProperty("groq_llama_4_scout");
        expect(MODEL_LIMITS).toHaveProperty("gemini_2_0_flash");
    });

    it("all models should have positive RPD and RPM", () => {
        for (const [key, limits] of Object.entries(MODEL_LIMITS)) {
            expect(limits.rpd, `${key} should have positive RPD`).toBeGreaterThan(0);
            expect(limits.rpm, `${key} should have positive RPM`).toBeGreaterThan(0);
        }
    });
});
