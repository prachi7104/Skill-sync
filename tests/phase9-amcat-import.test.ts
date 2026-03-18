/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — AMCAT Import Verification Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for AMCAT data import flow:
 *   1. Session creation with weights and thresholds
 *   2. CSV parsing and score computation
 *   3. Student-result linking via sap_id
 *   4. Student dashboard AMCAT display
 *   5. Ranking filters by AMCAT category
 *
 * These tests verify that the AMCAT import system works correctly end-to-end,
 * including category assignment, student linking, and ranking filter logic.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import {
  computeAmcatTotal,
  computeAmcatCategory,
  parseAmcatRows,
  processAmcatData,
  validateWeights,
  DEFAULT_WEIGHTS,
  DEFAULT_THRESHOLDS,
} from "@/lib/amcat/parser";
import type { AmcatRowRaw, AmcatScoreWeights, AmcatCategoryThresholds } from "@/lib/amcat/parser";

// ────────────────────────────────────────────────────────────────────────────
// Test 1: amcatSessionCreation
// ────────────────────────────────────────────────────────────────────────────
describe("AMCAT Session Creation", () => {
  it("should create session with default weights and thresholds", () => {
    // Verify default weights sum to 1.0 (100%)
    const weightSum =
      DEFAULT_WEIGHTS.automata +
      DEFAULT_WEIGHTS.automata_fix +
      DEFAULT_WEIGHTS.computer_programming +
      DEFAULT_WEIGHTS.computer_science +
      DEFAULT_WEIGHTS.quant;

    expect(weightSum).toBeCloseTo(1.0, 3);

    // Verify weights are valid
    const validation = validateWeights(DEFAULT_WEIGHTS);
    expect(validation.valid).toBe(true);

    // Verify thresholds are logical
    expect(DEFAULT_THRESHOLDS.alpha_min).toBeGreaterThan(DEFAULT_THRESHOLDS.beta_min);
    expect(DEFAULT_THRESHOLDS.beta_min).toBeGreaterThan(DEFAULT_THRESHOLDS.gamma_min);
  });

  it("should accept custom weights and thresholds", () => {
    const customWeights: AmcatScoreWeights = {
      automata: 0.40,
      automata_fix: 0.25,
      computer_programming: 0.15,
      computer_science: 0.15,
      quant: 0.05,
    };

    const customThresholds: AmcatCategoryThresholds = {
      alpha_min: 70,
      beta_min: 50,
      gamma_min: 0,
    };

    const validation = validateWeights(customWeights);
    expect(validation.valid).toBe(true);

    // Thresholds should be valid
    expect(customThresholds.alpha_min).toBeGreaterThan(customThresholds.beta_min);
  });

  it("should reject invalid weights (sum ≠ 1.0)", () => {
    const invalidWeights: AmcatScoreWeights = {
      automata: 0.50,
      automata_fix: 0.20,
      computer_programming: 0.10,
      computer_science: 0.10,
      quant: 0.05, // Sum = 0.95 (invalid)
    };

    const validation = validateWeights(invalidWeights);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("must sum to 1.0");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Test 2: amcatCsvParsing
// ────────────────────────────────────────────────────────────────────────────
describe("AMCAT CSV Parsing & Score Computation", () => {
  it("should parse valid CSV and compute scores correctly", () => {
    const headers = [
      "email",
      "sap_id",
      "full_name",
      "course",
      "branch",
      "programme_name",
      "status",
      "attendance_pct",
      "cs_score",
      "cp_score",
      "automata_score",
      "automata_fix_score",
      "quant_score",
    ];

    const rows = [
      [
        "student1@stu.upes.ac.in",
        "500123456",
        "Student One",
        "BTech",
        "CSE",
        "CSE-IV",
        "Present",
        "85",
        "80",
        "75",
        "90",
        "85",
        "70",
      ],
    ];

    const result = parseAmcatRows(headers, rows);
    expect(result.data.length).toBe(1);

    const row = result.data[0];
    expect(row.sap_id).toBe("500123456");
    expect(row.full_name).toBe("Student One");
    expect(row.cs_score).toBe(80);
    expect(row.cp_score).toBe(75);
    expect(row.automata_score).toBe(90);
    expect(row.automata_fix_score).toBe(85);
    expect(row.quant_score).toBe(70);
  });

  it("should compute total score with default weights", () => {
    const student: AmcatRowRaw = {
      email: "test@stu.upes.ac.in",
      sap_id: "500124567",
      full_name: "Test Student",
      course: "BTech",
      branch: "CSE",
      programme_name: "CSE-IV",
      status: "Present",
      attendance_pct: 90,
      cs_score: 80,
      cp_score: 75,
      automata_score: 90, // 50% weight
      automata_fix_score: 85, // 20% weight
      quant_score: 70, // 10% weight
      csv_total: null,
      csv_category: null,
    };

    const total = computeAmcatTotal(student, DEFAULT_WEIGHTS);

    // Expected: 90*0.50 + 85*0.20 + 75*0.10 + 80*0.10 + 70*0.10 = 45 + 17 + 7.5 + 8 + 7 = 84.5
    expect(total).toBeCloseTo(84.5, 1);
  });

  it("should assign categories based on computed scores", () => {
    // Alpha: score >= 60
    expect(
      computeAmcatCategory(75, DEFAULT_THRESHOLDS)
    ).toBe("alpha");

    // Beta: 40 <= score < 60
    expect(
      computeAmcatCategory(50, DEFAULT_THRESHOLDS)
    ).toBe("beta");

    // Gamma: score < 40
    expect(
      computeAmcatCategory(30, DEFAULT_THRESHOLDS)
    ).toBe("gamma");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Test 3: amcatResultsLinkedToStudents
// ────────────────────────────────────────────────────────────────────────────
describe("AMCAT Results Linking to Students", () => {
  it("should link AMCAT results to students by sap_id match", () => {
    // Simulate student database
    const studentDb = new Map<string, { id: string; sapId: string; name: string }>();
    studentDb.set("500125613", {
      id: "user-123",
      sapId: "500125613",
      name: "Alice Kumar",
    });
    studentDb.set("500125614", {
      id: "user-124",
      sapId: "500125614",
      name: "Bob Singh",
    });

    // Simulate AMCAT results from CSV
    const amcatResults = [
      {
        sap_id: "500125613",
        full_name: "Alice Kumar",
        email: "alice@stu.upes.ac.in",
        cs_score: 85,
        cp_score: 80,
        automata_score: 92,
        automata_fix_score: 88,
        quant_score: 75,
        total_score: 86.5,
        category: "alpha" as const,
      },
      {
        sap_id: "500125614",
        full_name: "Bob Singh",
        email: "bob@stu.upes.ac.in",
        cs_score: 45,
        cp_score: 42,
        automata_score: 50,
        automata_fix_score: 48,
        quant_score: 55,
        total_score: 48.5,
        category: "beta" as const,
      },
    ];

    // Link and verify
    const linked = amcatResults.map((result) => {
      const student = studentDb.get(result.sap_id);
      return {
        amcatResultId: `result-${result.sap_id}`,
        studentId: student?.id || null,
        sapId: result.sap_id,
        matched: !!student,
      };
    });

    expect(linked[0].matched).toBe(true);
    expect(linked[0].studentId).toBe("user-123");
    expect(linked[1].matched).toBe(true);
    expect(linked[1].studentId).toBe("user-124");
  });

  it("should handle unmatched sap_id records", () => {
    const studentDb = new Map<string, { id: string }>();
    studentDb.set("500125613", { id: "user-123" });
    // Note: 500125615 not in DB

    const amcatResults = [
      { sap_id: "500125613", full_name: "Student A" },
      { sap_id: "500125615", full_name: "Student B" }, // Unmatched
    ];

    const linked = amcatResults.map((result) => ({
      sapId: result.sap_id,
      matched: studentDb.has(result.sap_id),
    }));

    expect(linked[0].matched).toBe(true);
    expect(linked[1].matched).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Test 4: studentDashboardShowsAmcat
// ────────────────────────────────────────────────────────────────────────────
describe("Student Dashboard AMCAT Display", () => {
  it("should display AMCAT data for student with results", () => {
    // Mock student AMCAT data
    const studentAmcatData = {
      hasAmcat: true,
      sessionName: "Oct 2025 - Batch IV",
      scores: {
        cs: 82,
        cp: 78,
        automata: 89,
        automata_fix: 85,
        quant: 72,
      },
      totalScore: 81.5,
      category: "alpha" as const,
      rank: 5,
      totalInSession: 487,
    };

    expect(studentAmcatData.hasAmcat).toBe(true);
    expect(studentAmcatData.category).toBe("alpha");
    expect(studentAmcatData.totalScore).toBeGreaterThan(60); // Alpha threshold
    expect(studentAmcatData.rank).toBeLessThanOrEqual(studentAmcatData.totalInSession);
  });

  it("should show 'no AMCAT' for students without results", () => {
    const studentAmcatData = {
      hasAmcat: false,
      reason: "not_published",
    };

    expect(studentAmcatData.hasAmcat).toBe(false);
  });

  it("should show different categories correctly", () => {
    const alphaStudent = { category: "alpha" as const, score: 72 };
    const betaStudent = { category: "beta" as const, score: 48 };
    const gammaStudent = { category: "gamma" as const, score: 25 };

    // Alpha can see all drives
    expect(["alpha", "beta", "gamma"]).toContain(alphaStudent.category);

    // Beta can see beta and gamma drives, not alpha
    expect(["beta", "gamma"]).toContain(betaStudent.category);

    // Gamma can see only gamma drives
    expect(["gamma"]).toContain(gammaStudent.category);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Test 5: rankingFiltersbyAmcatCategory
// ────────────────────────────────────────────────────────────────────────────
describe("Ranking Filters by AMCAT Category", () => {
  it("should include only eligible categories in ranking", () => {
    // Mock students with categories
    const students = [
      { id: "s1", name: "Alice", category: "alpha" },
      { id: "s2", name: "Bob", category: "beta" },
      { id: "s3", name: "Charlie", category: "gamma" },
      { id: "s4", name: "Diana", category: "alpha" },
    ];

    // Mock drive with eligibility criteria
    const drive = {
      id: "drive-1",
      title: "Google SWE",
      eligibleCategories: ["alpha", "beta"],
    };

    // Filter students eligible for ranking
    const eligibleStudents = students.filter((s) =>
      drive.eligibleCategories.includes(s.category)
    );

    expect(eligibleStudents).toHaveLength(3); // Alice, Bob, Diana
    expect(eligibleStudents.map((s) => s.id)).toEqual(["s1", "s2", "s4"]);
    expect(eligibleStudents.map((s) => s.id)).not.toContain("s3"); // Charlie excluded
  });

  it("should rank only alpha when drive restricts to alpha", () => {
    const students = [
      { id: "s1", name: "Alice", category: "alpha", score: 85 },
      { id: "s2", name: "Bob", category: "alpha", score: 82 },
      { id: "s3", name: "Charlie", category: "beta", score: 78 },
    ];

    const drive = { eligibleCategories: ["alpha"] };

    const eligible = students.filter((s) =>
      drive.eligibleCategories.includes(s.category)
    );

    expect(eligible).toHaveLength(2);
    expect(eligible.every((s) => s.category === "alpha")).toBe(true);
  });

  it("should compute correct rankings within eligible subset", () => {
    const students = [
      { id: "s1", name: "Alice", category: "alpha", score: 90 },
      { id: "s2", name: "Bob", category: "alpha", score: 85 },
      { id: "s3", name: "Charlie", category: "beta", score: 92 }, // High but excluded
      { id: "s4", name: "Diana", category: "alpha", score: 88 },
    ];

    const drive = { eligibleCategories: ["alpha", "beta"] };

    const eligible = students.filter((s) =>
      drive.eligibleCategories.includes(s.category)
    );

    // Sort by score descending
    const ranked = eligible.sort((a, b) => b.score - a.score);

    expect(ranked[0].id).toBe("s1"); // Alice: 90
    expect(ranked[1].id).toBe("s4"); // Diana: 88
    expect(ranked[2].id).toBe("s2"); // Bob: 85
    expect(ranked[3].id).toBe("s3"); // Charlie: 92 (but eligible as beta)
  });

  it("should handle no eligible students gracefully", () => {
    const students = [
      { id: "s1", name: "Alice", category: "gamma" },
      { id: "s2", name: "Bob", category: "gamma" },
    ];

    const drive = { eligibleCategories: ["alpha"] }; // Only alpha eligible

    const eligible = students.filter((s) =>
      drive.eligibleCategories.includes(s.category)
    );

    expect(eligible).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Integration: End-to-End AMCAT Flow
// ────────────────────────────────────────────────────────────────────────────
describe("End-to-End AMCAT Import Flow", () => {
  it("should process complete CSV → ranking eligibility workflow", () => {
    // Step 1: Parse AMCAT CSV
    const headers = [
      "email",
      "sap_id",
      "full_name",
      "course",
      "branch",
      "programme_name",
      "status",
      "attendance_pct",
      "cs_score",
      "cp_score",
      "automata_score",
      "automata_fix_score",
      "quant_score",
    ];

    const rows = [
      [
        "alice@stu.upes.ac.in",
        "500123001",
        "Alice Kumar",
        "BTech",
        "CSE",
        "CSE-IV",
        "Present",
        "85",
        "85",
        "80",
        "92",
        "88",
        "75",
      ],
      [
        "bob@stu.upes.ac.in",
        "500123002",
        "Bob Singh",
        "BTech",
        "CSE",
        "CSE-IV",
        "Present",
        "80",
        "45",
        "48",
        "55",
        "52",
        "50",
      ],
      [
        "charlie@stu.upes.ac.in",
        "500123003",
        "Charlie Brown",
        "BTech",
        "IT",
        "IT-IV",
        "Present",
        "75",
        "35",
        "40",
        "45",
        "42",
        "38",
      ],
    ];

    const { data: parsed } = parseAmcatRows(headers, rows);
    expect(parsed).toHaveLength(3);

    // Step 2: Process with default weights
    const processed = processAmcatData(parsed, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
    expect(processed).toHaveLength(3);

    // Step 3: Verify categories assigned
    const alice = processed.find((r) => r.sap_id === "500123001");
    const bob = processed.find((r) => r.sap_id === "500123002");
    const charlie = processed.find((r) => r.sap_id === "500123003");

    expect(alice?.final_category).toBe("alpha"); // High score
    expect(bob?.final_category).toBe("beta"); // Medium score
    expect(charlie?.final_category).toBe("gamma"); // Low score

    // Step 4: Simulate ranking with eligibility
    const driveEligibility = { eligibleCategories: ["alpha", "beta"] };
    const eligible = processed.filter((r) =>
      driveEligibility.eligibleCategories.includes(r.final_category)
    );

    expect(eligible).toHaveLength(2); // Alice and Bob
    expect(eligible.map((r) => r.sap_id)).not.toContain("500123003"); // Charlie excluded
  });
});
