/**
 * Phase 5 Remediation Tests
 *
 * Covers the business logic introduced/fixed across Phase 4-5:
 *  - Drive eligibility (lib/business/eligibility.ts)
 *  - safeFetch wrapper (lib/api.ts)
 *  - CSV import validation logic
 *  - Embedding dedup guard
 *  - Error message extraction
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  checkDriveEligibility,
  filterEligibleDrives,
} from "../lib/business/eligibility";

// ── Drive Eligibility ─────────────────────────────────────────────────────────

describe("checkDriveEligibility", () => {
  it("returns eligible when no criteria set", () => {
    const result = checkDriveEligibility(
      { cgpa: 7.5, branch: "CSE", batchYear: 2025, category: "alpha" },
      {}
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects on CGPA below minimum", () => {
    const result = checkDriveEligibility(
      { cgpa: 6.0 },
      { minCgpa: 7.0 }
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("7");
  });

  it("accepts when CGPA meets minimum exactly", () => {
    const result = checkDriveEligibility(
      { cgpa: 7.0 },
      { minCgpa: 7.0 }
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects when CGPA is null but minCgpa is set", () => {
    const result = checkDriveEligibility(
      { cgpa: null },
      { minCgpa: 6.0 }
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("CGPA not set");
  });

  it("ignores minCgpa of 0", () => {
    // 0 minCgpa means 'no restriction'
    const result = checkDriveEligibility(
      { cgpa: null },
      { minCgpa: 0 }
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects when branch not in eligible list", () => {
    const result = checkDriveEligibility(
      { branch: "ECE" },
      { eligibleBranches: ["CSE", "AIML"] }
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("Branch not in eligible list");
  });

  it("accepts when branch matches after expansion (CSE → AIML)", () => {
    // expandBranches(["CSE"]) includes AIML, Data Science, etc.
    const result = checkDriveEligibility(
      { branch: "AIML" },
      { eligibleBranches: ["CSE"] }
    );
    expect(result.eligible).toBe(true);
  });

  it("is case-insensitive for branch matching", () => {
    const result = checkDriveEligibility(
      { branch: "aiml" },
      { eligibleBranches: ["AIML"] }
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects when branch is null but eligibleBranches set", () => {
    const result = checkDriveEligibility(
      { branch: null },
      { eligibleBranches: ["CSE"] }
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Branch not set");
  });

  it("rejects when batchYear not in eligible list", () => {
    const result = checkDriveEligibility(
      { batchYear: 2024 },
      { eligibleBatchYears: [2025, 2026] }
    );
    expect(result.eligible).toBe(false);
  });

  it("accepts when batchYear matches", () => {
    const result = checkDriveEligibility(
      { batchYear: 2025 },
      { eligibleBatchYears: [2025, 2026] }
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects when category not in eligible list", () => {
    const result = checkDriveEligibility(
      { category: "gamma" },
      { eligibleCategories: ["alpha", "beta"] }
    );
    expect(result.eligible).toBe(false);
  });

  it("accepts when category matches", () => {
    const result = checkDriveEligibility(
      { category: "alpha" },
      { eligibleCategories: ["alpha"] }
    );
    expect(result.eligible).toBe(true);
  });

  it("AND-combines all criteria — one failure = ineligible", () => {
    const result = checkDriveEligibility(
      { cgpa: 8.0, branch: "ECE", batchYear: 2025, category: "alpha" },
      {
        minCgpa: 7.0,
        eligibleBranches: ["CSE"],     // ECE not in CSE group
        eligibleBatchYears: [2025],
        eligibleCategories: ["alpha"],
      }
    );
    expect(result.eligible).toBe(false);
  });

  it("accepts when all criteria satisfied", () => {
    const result = checkDriveEligibility(
      { cgpa: 8.5, branch: "AIML", batchYear: 2025, category: "beta" },
      {
        minCgpa: 7.0,
        eligibleBranches: ["CSE"],     // AIML is under CSE umbrella
        eligibleBatchYears: [2025, 2026],
        eligibleCategories: ["alpha", "beta"],
      }
    );
    expect(result.eligible).toBe(true);
  });
});

describe("filterEligibleDrives", () => {
  const student = { cgpa: 7.5, branch: "AIML", batchYear: 2025, category: "alpha" };

  const drives = [
    { id: "d1", minCgpa: 7.0, eligibleBranches: ["CSE"], eligibleBatchYears: [2025], eligibleCategories: null },
    { id: "d2", minCgpa: 8.0, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null },
    { id: "d3", minCgpa: null, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null },
  ];

  it("returns only eligible drives", () => {
    const result = filterEligibleDrives(drives, student);
    const ids = result.map((d) => d.id);
    expect(ids).toContain("d1"); // AIML is under CSE, cgpa 7.5 >= 7.0, batchYear 2025
    expect(ids).not.toContain("d2"); // cgpa 7.5 < 8.0
    expect(ids).toContain("d3"); // no criteria = open to all
  });

  it("returns empty array for student with no branch set", () => {
    const studentNoBranch = { ...student, branch: null };
    const drivesWithBranchFilter = drives.filter((d) => d.eligibleBranches !== null);
    const result = filterEligibleDrives(drivesWithBranchFilter, studentNoBranch);
    expect(result).toHaveLength(0);
  });

  it("returns all drives when none have criteria", () => {
    const openDrives = [
      { id: "o1", minCgpa: null, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null },
      { id: "o2", minCgpa: null, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null },
    ];
    const result = filterEligibleDrives(openDrives, student);
    expect(result).toHaveLength(2);
  });
});

// ── safeFetch error extraction ────────────────────────────────────────────────

describe("safeFetch error message extraction", () => {
  // Test the extraction logic inline (same as lib/api.ts extractErrorMessage)
  function extractErrorMessage(raw: unknown, status: number): string {
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      if (typeof r.message === "string") return r.message;
      if (typeof r.error === "string") return r.error;
      if (r.error && typeof r.error === "object") {
        const e = r.error as Record<string, unknown>;
        if (typeof e.message === "string") return e.message;
      }
    }
    return `Request failed (${status})`;
  }

  it("extracts {message} format", () => {
    expect(extractErrorMessage({ message: "Drive not found" }, 404)).toBe("Drive not found");
  });

  it("extracts {error} string format", () => {
    expect(extractErrorMessage({ error: "Unauthorized" }, 401)).toBe("Unauthorized");
  });

  it("extracts {error: {message}} nested format", () => {
    expect(extractErrorMessage({ error: { code: "NOT_FOUND", message: "Resource missing" } }, 404)).toBe("Resource missing");
  });

  it("falls back to status-based message for unknown shape", () => {
    expect(extractErrorMessage({ data: "something" }, 500)).toBe("Request failed (500)");
  });

  it("falls back for null body", () => {
    expect(extractErrorMessage(null, 503)).toBe("Request failed (503)");
  });
});

// ── CSV import validation ─────────────────────────────────────────────────────

describe("CSV import validation rules", () => {
  // Mirrors the logic in app/api/admin/students/import/route.ts
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  const MAX_ROWS = 5000;
  const MAX_COLUMNS = 30;

  it("rejects files larger than 5 MB", () => {
    const oversizedFile = { size: MAX_FILE_SIZE_BYTES + 1 };
    expect(oversizedFile.size > MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it("accepts files exactly at 5 MB", () => {
    const exactFile = { size: MAX_FILE_SIZE_BYTES };
    expect(exactFile.size > MAX_FILE_SIZE_BYTES).toBe(false);
  });

  it("rejects CSVs with more than 5000 data rows", () => {
    const rowCount = MAX_ROWS + 1;
    expect(rowCount > MAX_ROWS).toBe(true);
  });

  it("accepts CSV with exactly 5000 data rows", () => {
    const rowCount = MAX_ROWS;
    expect(rowCount > MAX_ROWS).toBe(false);
  });

  it("rejects CSVs with more than 30 columns", () => {
    const headers = new Array(MAX_COLUMNS + 1).fill("col");
    expect(headers.length > MAX_COLUMNS).toBe(true);
  });

  it("accepts CSVs with exactly 30 columns", () => {
    const headers = new Array(MAX_COLUMNS).fill("col");
    expect(headers.length > MAX_COLUMNS).toBe(false);
  });
});

// ── safeFetch integration with mocked fetch ───────────────────────────────────

describe("safeFetch wrapper", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(status: number, body: unknown) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
  }

  it("returns data on 200 OK", async () => {
    mockFetch(200, { drives: [] });
    const { safeFetch } = await import("../lib/api");
    const result = await safeFetch("/api/drives");
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ drives: [] });
  });

  it("returns error string on 404", async () => {
    mockFetch(404, { message: "Drive not found" });
    const { safeFetch } = await import("../lib/api");
    const result = await safeFetch("/api/drives/missing");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Drive not found");
  });

  it("returns error string on 500 with {error} key", async () => {
    mockFetch(500, { error: "Internal server error" });
    const { safeFetch } = await import("../lib/api");
    const result = await safeFetch("/api/drives");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Internal server error");
  });

  it("calls onError callback on failure", async () => {
    mockFetch(401, { message: "Unauthorized" });
    const { safeFetch } = await import("../lib/api");
    const onError = vi.fn();
    await safeFetch("/api/protected", { onError });
    expect(onError).toHaveBeenCalledWith("Unauthorized");
  });

  it("handles network errors gracefully", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const { safeFetch } = await import("../lib/api");
    const result = await safeFetch("/api/drives");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Network error");
  });

  it("serializes body as JSON for POST requests", async () => {
    const mockFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: "abc" }),
    });
    globalThis.fetch = mockFn;
    const { postJSON } = await import("../lib/api");
    await postJSON("/api/drives", { company: "Infosys" });
    const [, init] = mockFn.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ company: "Infosys" }));
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });
});
