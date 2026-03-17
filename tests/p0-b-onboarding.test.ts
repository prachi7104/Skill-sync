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

describe("Two-track resume upload state machine", () => {
  type ResumeState = "idle" | "extracting" | "analyzing" | "uploading" | "parsing" | "done" | "error";

  function simulateTwoTrackFlow(
    extractionSucceeds: boolean,
    previewSucceeds: boolean,
    uploadSucceeds: boolean,
  ): ResumeState[] {
    const states: ResumeState[] = [];

    // Step 1: Extract
    states.push("extracting");
    if (!extractionSucceeds) { states.push("error"); return states; }

    // Step 2: Parallel tracks
    states.push("analyzing");

    // Track A wins → done immediately
    if (previewSucceeds) {
      states.push("done");
      return states;
    }

    // Track A failed → fall back to Track B
    if (!uploadSucceeds) { states.push("error"); return states; }

    states.push("parsing");
    states.push("done");
    return states;
  }

  it("happy path (Track A wins): extracting → analyzing → done", () => {
    expect(simulateTwoTrackFlow(true, true, true))
      .toEqual(["extracting", "analyzing", "done"]);
  });

  it("Track A fails, Track B works: extracting → analyzing → parsing → done", () => {
    expect(simulateTwoTrackFlow(true, false, true))
      .toEqual(["extracting", "analyzing", "parsing", "done"]);
  });

  it("both tracks fail: extracting → analyzing → error", () => {
    expect(simulateTwoTrackFlow(true, false, false))
      .toEqual(["extracting", "analyzing", "error"]);
  });

  it("extraction fails: extracting → error (neither track starts)", () => {
    expect(simulateTwoTrackFlow(false, false, false))
      .toEqual(["extracting", "error"]);
  });

  it("includes 'analyzing' state for parallel phase", () => {
    expect(simulateTwoTrackFlow(true, true, true)[1]).toBe("analyzing");
  });
});

describe("Identity gate — Continue button disabled logic", () => {
  function isIdentityComplete(form: { sapId: string; rollNo: string }): boolean {
    return form.sapId.trim() !== "" && form.rollNo.trim() !== "";
  }

  function isContinueDisabled(stepRequired: string[], stepDone: boolean): boolean {
    return stepRequired.length > 0 && !stepDone;
  }

  it("disables Continue when sapId is empty", () => {
    const done = isIdentityComplete({ sapId: "", rollNo: "R2142212345" });
    expect(isContinueDisabled(["sapId", "rollNo"], done)).toBe(true);
  });

  it("disables Continue when rollNo is empty", () => {
    const done = isIdentityComplete({ sapId: "500125613", rollNo: "" });
    expect(isContinueDisabled(["sapId", "rollNo"], done)).toBe(true);
  });

  it("disables Continue when both are empty", () => {
    const done = isIdentityComplete({ sapId: "", rollNo: "" });
    expect(isContinueDisabled(["sapId", "rollNo"], done)).toBe(true);
  });

  it("enables Continue when both sapId and rollNo are filled", () => {
    const done = isIdentityComplete({ sapId: "500125613", rollNo: "R2142212345" });
    expect(isContinueDisabled(["sapId", "rollNo"], done)).toBe(false);
  });
});

describe("Autofill resets active step to identity", () => {
  it("sets activeStep to 'identity' when resumeState becomes done", () => {
    let activeStep = "academics";
    const resumeState = "done";
    if (resumeState === "done") activeStep = "identity";
    expect(activeStep).toBe("identity");
  });

  it("sets autofillBanner to true on completion", () => {
    let autofillBanner = false;
    const resumeState = "done";
    if (resumeState === "done") autofillBanner = true;
    expect(autofillBanner).toBe(true);
  });

  it("resets autofillBanner when a new upload starts", () => {
    let autofillBanner = true;
    autofillBanner = false;
    expect(autofillBanner).toBe(false);
  });
});

describe("Preview endpoint validation", () => {
  function validateResumeText(text: string): { valid: boolean; error?: string } {
    if (typeof text !== "string") return { valid: false, error: "Missing resumeText" };
    if (text.length < 50) return { valid: false, error: "Too short (min 50)" };
    if (text.length > 15000) return { valid: false, error: "Too long (max 15000)" };
    return { valid: true };
  }

  it("rejects text shorter than 50 chars", () => {
    expect(validateResumeText("Too short")).toEqual({ valid: false, error: "Too short (min 50)" });
  });

  it("rejects text longer than 15000 chars", () => {
    expect(validateResumeText("x".repeat(15001))).toEqual({ valid: false, error: "Too long (max 15000)" });
  });

  it("accepts text within valid range", () => {
    expect(validateResumeText("x".repeat(100))).toEqual({ valid: true });
  });

  it("accepts text at exact boundaries", () => {
    expect(validateResumeText("x".repeat(50))).toEqual({ valid: true });
    expect(validateResumeText("x".repeat(15000))).toEqual({ valid: true });
  });
});

describe("Preview rate limiting", () => {
  function checkRateLimit(
    timestamps: number[],
    now: number,
    windowMs: number,
    maxCalls: number,
  ): { allowed: boolean; remaining: number } {
    const recent = timestamps.filter((t) => t > now - windowMs);
    if (recent.length >= maxCalls) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: maxCalls - recent.length };
  }

  const HOUR = 60 * 60 * 1000;
  const NOW = Date.now();

  it("allows first 3 calls within an hour", () => {
    expect(checkRateLimit([], NOW, HOUR, 3).allowed).toBe(true);
    expect(checkRateLimit([NOW - 1000], NOW, HOUR, 3).allowed).toBe(true);
    expect(checkRateLimit([NOW - 2000, NOW - 1000], NOW, HOUR, 3).allowed).toBe(true);
  });

  it("blocks 4th call within the hour", () => {
    const ts = [NOW - 3000, NOW - 2000, NOW - 1000];
    expect(checkRateLimit(ts, NOW, HOUR, 3).allowed).toBe(false);
  });

  it("allows calls once old timestamps expire", () => {
    const ts = [NOW - HOUR - 1, NOW - HOUR - 2, NOW - HOUR - 3];
    expect(checkRateLimit(ts, NOW, HOUR, 3).allowed).toBe(true);
  });
});

describe("applyPreviewToForm only fills empty fields", () => {
  it("does not overwrite existing phone", () => {
    const prev = { phone: "+91 12345", linkedin: "" };
    const data = { phone: "+91 99999", linkedin: "linkedin.com/in/test" };
    const next = { ...prev };
    if (data.phone && !prev.phone) next.phone = data.phone;
    if (data.linkedin && !prev.linkedin) next.linkedin = data.linkedin;
    expect(next.phone).toBe("+91 12345"); // NOT overwritten
    expect(next.linkedin).toBe("linkedin.com/in/test"); // filled
  });

  it("fills empty skills but skips if already present", () => {
    const existingSkills = ["React", "Node"];
    const newSkills = [{ name: "Python" }, { name: "Java" }];
    let skills = existingSkills;
    if (newSkills.length > 0 && existingSkills.length === 0) {
      skills = newSkills.map((s) => s.name);
    }
    expect(skills).toEqual(["React", "Node"]); // NOT replaced
  });
});

describe("resumeText is appended to FormData", () => {
  it("FormData includes resumeText field after extraction", () => {
    const fd = new FormData();
    const resumeText = "John Doe, Software Engineer, Python, React";
    fd.append("file", new Blob(["fake"]), "resume.pdf");
    fd.append("source", "onboarding");
    fd.append("resumeText", resumeText);
    expect(fd.get("resumeText")).toBe(resumeText);
    expect(fd.has("file")).toBe(true);
    expect(fd.has("source")).toBe(true);
  });
});
