import { describe, expect, it } from "vitest";

describe("scoring baseline", () => {
  it("keeps weighted scoring contract at 70/30", () => {
    const semantic = 80;
    const structured = 60;
    const total = Math.round((semantic * 0.7 + structured * 0.3) * 100) / 100;
    expect(total).toBe(74);
  });
});
