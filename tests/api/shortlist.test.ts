import { describe, it, expect } from "vitest";
import { z } from "zod";

const shortlistSchema = z.object({
    shortlisted: z.boolean().nullable(),
});

describe("Shortlist input validation", () => {
    it("accepts true", () => {
        expect(shortlistSchema.parse({ shortlisted: true }).shortlisted).toBe(true);
    });

    it("accepts false", () => {
        expect(shortlistSchema.parse({ shortlisted: false }).shortlisted).toBe(false);
    });

    it("accepts null", () => {
        expect(shortlistSchema.parse({ shortlisted: null }).shortlisted).toBe(null);
    });

    it("rejects strings", () => {
        expect(() => shortlistSchema.parse({ shortlisted: "yes" })).toThrow();
    });

    it("rejects numbers", () => {
        expect(() => shortlistSchema.parse({ shortlisted: 1 })).toThrow();
    });
});
