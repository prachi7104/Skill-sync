import { describe, it, expect } from "vitest";
import {
  computeAmcatTotal,
  computeAmcatCategory,
  validateWeights,
  processAmcatData,
  parseAmcatRows,
  DEFAULT_WEIGHTS,
  DEFAULT_THRESHOLDS,
} from "@/lib/amcat/parser";

describe("AMCAT score computation", () => {
  it("should compute Akshat Mittal score correctly", () => {
    const row = {
      cs_score: 63,
      cp_score: 55,
      automata_score: 100,
      automata_fix_score: 86,
      quant_score: 60,
    } as Parameters<typeof computeAmcatTotal>[0];

    const total = computeAmcatTotal(row, DEFAULT_WEIGHTS);
    expect(total).toBe(85);
  });

  it("should compute Aniruddh Vijayvargia score correctly", () => {
    const row = {
      cs_score: 67,
      cp_score: 69,
      automata_score: 95,
      automata_fix_score: 29,
      quant_score: 76,
    } as Parameters<typeof computeAmcatTotal>[0];

    const total = computeAmcatTotal(row, DEFAULT_WEIGHTS);
    expect(total).toBeCloseTo(74.5, 1);
  });

  it("should classify alpha for score >= 60", () => {
    expect(computeAmcatCategory(85, DEFAULT_THRESHOLDS)).toBe("alpha");
    expect(computeAmcatCategory(60, DEFAULT_THRESHOLDS)).toBe("alpha");
  });

  it("should classify beta for score between 40 and 59", () => {
    expect(computeAmcatCategory(59, DEFAULT_THRESHOLDS)).toBe("beta");
    expect(computeAmcatCategory(40, DEFAULT_THRESHOLDS)).toBe("beta");
  });

  it("should classify gamma for score below 40", () => {
    expect(computeAmcatCategory(39, DEFAULT_THRESHOLDS)).toBe("gamma");
    expect(computeAmcatCategory(0, DEFAULT_THRESHOLDS)).toBe("gamma");
  });

  it("should assign ranks with higher score as better rank", () => {
    const rows = [
      {
        sap_id: "500001",
        full_name: "A",
        status: "Present",
        cs_score: 80,
        cp_score: 80,
        automata_score: 80,
        automata_fix_score: 80,
        quant_score: 80,
        csv_total: null,
        csv_category: null,
        course: null,
        branch: null,
        programme_name: null,
        attendance_pct: null,
      },
      {
        sap_id: "500002",
        full_name: "B",
        status: "Present",
        cs_score: 50,
        cp_score: 50,
        automata_score: 50,
        automata_fix_score: 50,
        quant_score: 50,
        csv_total: null,
        csv_category: null,
        course: null,
        branch: null,
        programme_name: null,
        attendance_pct: null,
      },
    ];

    const result = processAmcatData(rows, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
    expect(result[0].rank_in_session).toBe(1);
    expect(result[0].sap_id).toBe("500001");
    expect(result[1].rank_in_session).toBe(2);
  });
});

describe("Weight validation", () => {
  it("should accept weights that sum to 1.0", () => {
    const valid = validateWeights(DEFAULT_WEIGHTS);
    expect(valid.valid).toBe(true);
  });

  it("should reject weights that do not sum to 1.0", () => {
    const invalid = validateWeights({
      automata: 0.6,
      automata_fix: 0.2,
      computer_programming: 0.1,
      computer_science: 0.1,
      quant: 0.1,
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.reason).toContain("sum to 1.0");
  });
});

describe("CSV column mapping", () => {
  it("should map AMCAT CSV headers to internal fields", () => {
    const headers = [
      "Full Name",
      "SAPID",
      "Automata(Score)",
      "Automata Fix(Score)",
      "Computer Programming(Score)",
      "Computer Science(Score)",
      "Quant(Score)",
      "Total",
      "Bifurcated Batch",
    ];

    const rows = [["John Doe", "500123456", "95", "72", "80", "75", "65", "85", "Alpha"]];
    const { data, errors } = parseAmcatRows(headers, rows);

    expect(errors).toHaveLength(0);
    expect(data[0].sap_id).toBe("500123456");
    expect(data[0].full_name).toBe("John Doe");
    expect(data[0].automata_score).toBe(95);
    expect(data[0].csv_category).toBe("alpha");
  });

  it("should handle missing optional columns gracefully", () => {
    const headers = ["SAPID", "Full Name", "Automata(Score)"];
    const rows = [["500123456", "Jane", "88"]];
    const { data, errors } = parseAmcatRows(headers, rows);

    expect(errors).toHaveLength(0);
    expect(data[0].cs_score).toBeNull();
  });

  it("should reject rows with invalid SAP IDs", () => {
    const headers = ["SAPID", "Full Name"];
    const rows = [["INVALID", "Test"]];
    const { data, errors } = parseAmcatRows(headers, rows);

    expect(data).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });
});
