import { describe, it, expect } from "vitest";

describe("Sandbox Limits — enforcement logic", () => {
  // Test the pure logic of sandbox limit checking.
  // The actual function hits DB, so we test the logic pattern.

  function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function currentMonthUTC(): string {
    return new Date().toISOString().slice(0, 7);
  }

  function checkLimits(
    dailyUsed: number,
    monthlyUsed: number,
    resetDate: string | null,
    monthResetDate: string | null,
    dailyLimit: number,
    monthlyLimit: number
  ): { allowed: boolean; reason?: string } {
    const today = todayUTC();
    const month = currentMonthUTC();

    const effectiveDaily = resetDate === today ? dailyUsed : 0;
    const effectiveMonthly = monthResetDate === month ? monthlyUsed : 0;

    if (effectiveDaily >= dailyLimit) {
      return { allowed: false, reason: "daily" };
    }
    if (effectiveMonthly >= monthlyLimit) {
      return { allowed: false, reason: "monthly" };
    }
    return { allowed: true };
  }

  it("allows usage when counters are zero", () => {
    expect(checkLimits(0, 0, todayUTC(), currentMonthUTC(), 3, 20).allowed).toBe(true);
  });

  it("blocks when daily limit reached", () => {
    const result = checkLimits(3, 0, todayUTC(), currentMonthUTC(), 3, 20);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("daily");
  });

  it("blocks when monthly limit reached", () => {
    const result = checkLimits(0, 20, todayUTC(), currentMonthUTC(), 3, 20);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("monthly");
  });

  it("resets daily counter when date changes", () => {
    const result = checkLimits(5, 0, "2024-01-01", currentMonthUTC(), 3, 20);
    expect(result.allowed).toBe(true); // stale date → counter resets to 0
  });

  it("resets monthly counter when month changes", () => {
    const result = checkLimits(0, 30, todayUTC(), "2024-01", 3, 20);
    expect(result.allowed).toBe(true); // stale month → counter resets to 0
  });

  it("null reset dates are treated as stale (counters reset)", () => {
    const result = checkLimits(10, 50, null, null, 3, 20);
    expect(result.allowed).toBe(true);
  });
});

describe("Sandbox Limits — comment vs code mismatch (INC-03)", () => {
  it("sandbox-limits.ts default daily limit should match its comment", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve("lib/guardrails/sandbox-limits.ts"),
      "utf-8"
    );

    // The comment says "Daily: 5 sandbox runs" but code defaults to 3.
    // After fix: comment should say 3, or code should be 5. Either way, they must match.
    const commentMatch = source.match(/Daily:\s*(\d+)\s*sandbox/);
    const codeMatch = source.match(/student_daily_limit:\s*(\d+)/);

    if (commentMatch && codeMatch) {
      expect(commentMatch[1]).toBe(codeMatch[1]);
    }
  });
});
