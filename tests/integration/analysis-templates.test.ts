import { describe, it, expect } from "vitest";

describe("Analysis Endpoint — template content (MAJ-04)", () => {
  it("analysis/me route POST should NOT use hardcoded template strings", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/drives/[driveId]/analysis/me/route.ts"),
      "utf-8"
    );

    // These are the hardcoded template strings from the audit.
    // After Phase 2D, either:
    //   a) These should be replaced with AI-generated content, OR
    //   b) The response should include a flag like `isTemplated: true`
    const hasTemplateFlag =
      routeSource.includes("isTemplated") ||
      routeSource.includes("templateBased") ||
      routeSource.includes("ai-generated") ||
      routeSource.includes("source: ");

    const hasHardcodedTemplates =
      routeSource.includes("Collaborated in delivery-focused work") ||
      routeSource.includes("Tell us about a difficult deadline");

    // Either templates should be gone OR there should be a transparency flag
    if (hasHardcodedTemplates) {
      expect(hasTemplateFlag).toBe(true);
    }
  });
});
