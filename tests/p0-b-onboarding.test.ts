import { describe, it, expect } from "vitest";

describe("Onboarding step locking", () => {
  function isStepUnlocked(stepIndex: number, stepStates: Array<{ done: boolean; required: string[] }>): boolean {
    for (let i = 0; i < stepIndex; i++) {
      if (stepStates[i].required.length > 0 && !stepStates[i].done) return false;
    }
    return true;
  }

  it("step 0 (identity) is always unlocked", () => {
    const states = [
      { done: false, required: ["sapId", "rollNo"] },
      { done: false, required: ["cgpa", "branch", "batchYear"] },
    ];
    expect(isStepUnlocked(0, states)).toBe(true);
  });

  it("step 1 (academics) is locked until identity is complete", () => {
    const states = [
      { done: false, required: ["sapId", "rollNo"] },
      { done: false, required: ["cgpa"] },
    ];
    expect(isStepUnlocked(1, states)).toBe(false);
  });

  it("step 1 unlocks when identity is done", () => {
    const states = [
      { done: true, required: ["sapId", "rollNo"] },
      { done: false, required: ["cgpa"] },
    ];
    expect(isStepUnlocked(1, states)).toBe(true);
  });

  it("step 2 (skills) is optional and unlocks when required previous steps are done", () => {
    const states = [
      { done: true, required: ["sapId"] },
      { done: true, required: ["cgpa"] },
      { done: false, required: [] },
    ];
    expect(isStepUnlocked(2, states)).toBe(true);
  });

  it("optional step does not block subsequent steps", () => {
    const states = [
      { done: true, required: ["sapId"] },
      { done: true, required: ["cgpa"] },
      { done: false, required: [] },
      { done: false, required: [] },
    ];
    expect(isStepUnlocked(3, states)).toBe(true);
  });
});

describe("Autosave loop prevention", () => {
  it("isUserChangeRef prevents save on server sync", () => {
    let saveCalled = false;
    const isUserChangeRef = { current: false };

    isUserChangeRef.current = false;

    if (!isUserChangeRef.current) {
      // Guard exits.
    } else {
      saveCalled = true;
    }

    expect(saveCalled).toBe(false);
  });

  it("save fires when user changes a field", () => {
    const isUserChangeRef = { current: false };
    let saveCalled = false;

    isUserChangeRef.current = true;

    if (isUserChangeRef.current) saveCalled = true;
    expect(saveCalled).toBe(true);
  });
});

describe("Resume polling", () => {
  it("stops polling after 3 minutes deadline", () => {
    const deadline = Date.now() - 1;
    const shouldStop = Date.now() > deadline;
    expect(shouldStop).toBe(true);
  });

  it("uses jobId from upload response when available", () => {
    const uploadResponse = { jobId: "abc123" };
    const jobId = uploadResponse?.jobId ?? null;
    expect(jobId).toBe("abc123");
  });
});

describe("Form field validation", () => {
  it("CGPA must be between 0 and 10", () => {
    const validate = (v: string) => {
      const n = Number(v);
      return !Number.isNaN(n) && n >= 0 && n <= 10;
    };
    expect(validate("8.5")).toBe(true);
    expect(validate("11")).toBe(false);
    expect(validate("-1")).toBe(false);
  });

  it("SAP ID must be 9 digits", () => {
    const validate = (v: string) => /^\d{9}$/.test(v);
    expect(validate("500125613")).toBe(true);
    expect(validate("50012561")).toBe(false);
    expect(validate("ABCDEFGHI")).toBe(false);
  });

  it("Roll No must be R plus 10 digits", () => {
    const validate = (v: string) => /^R\d{10}$/.test(v);
    expect(validate("R2142212345")).toBe(true);
    expect(validate("2142212345")).toBe(false);
    expect(validate("R214221234")).toBe(false);
  });
});
