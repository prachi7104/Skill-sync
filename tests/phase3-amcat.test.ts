import { describe, it, expect } from "vitest";
import { parseAmcatRows, processAmcatData, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS } from "@/lib/amcat/parser";

describe("AMCAT parser - absent row handling", () => {
  it("includes absent rows with computed_total = -1", () => {
    const headers = ["Email Id", "SAPID", "Full Name", "COURSE", "BRANCH",
      "Programme name(invited)", "Computer Science(Score)", "Computer Programming(Score)",
      "Automata(Score)", "Automata Fix(Score)", "Quant(Score)", "Attendance %",
      "Status", "Total", "Bifurcated Batch"];
    const rows = [
      ["student@stu.upes.ac.in", 500124596, "Absent Student", "BTech", "AIML",
        "BT-CSE-SPZ-AI-ML-IV-B1", "", "", "", "", "", 0, "Absent", -1, null]
    ];
    const { data } = parseAmcatRows(headers, rows);
    expect(data.length).toBe(1);
    expect(data[0].status).toBe("Absent");
    expect(data[0].branch).toBe("AIML");
    expect(data[0].csv_total).toBe(-1);
    expect(data[0].automata_score).toBeNull();
  });

  it("excludes footer rows", () => {
    const headers = ["Email Id", "SAPID", "Full Name"];
    const rows = [
      [null, "Formula Used for Computing Final Score:", "Bifurcation Basis"],
      ["akshat@stu.upes.ac.in", 500124372, "Akshat"],
    ];
    const { data } = parseAmcatRows(headers, rows);
    expect(data.length).toBe(1);
    expect(data[0].full_name).toBe("Akshat");
  });
});

describe("AMCAT processAmcatData - absent sorting", () => {
  it("absent students rank after all present students", () => {
    const raw = [
      { sap_id: "500000001", full_name: "Present A", email: null, course: null, branch: null,
        programme_name: null, status: "Present", attendance_pct: 90, csv_total: 75,
        csv_category: "alpha" as const, cs_score: 80, cp_score: 70, automata_score: 90,
        automata_fix_score: 60, quant_score: 65 },
      { sap_id: "500000002", full_name: "Absent B", email: null, course: null, branch: null,
        programme_name: null, status: "Absent", attendance_pct: 0, csv_total: -1,
        csv_category: null, cs_score: null, cp_score: null, automata_score: null,
        automata_fix_score: null, quant_score: null },
    ];
    const processed = processAmcatData(raw, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
    const absentRow = processed.find((r) => r.sap_id === "500000002");
    const presentRow = processed.find((r) => r.sap_id === "500000001");
    expect(absentRow!.rank_in_session).toBeGreaterThan(presentRow!.rank_in_session);
  });
});

describe("Email normalization for AMCAT matching", () => {
  function normalize(email: string): string {
    return email.toLowerCase().trim()
      .replace("gmail.om", "gmail.com")
      .replace("stu.upe.ac.in", "stu.upes.ac.in");
  }

  it("fixes common typos", () => {
    expect(normalize("User@GMAIL.OM")).toBe("user@gmail.com");
    expect(normalize("user@stu.upe.ac.in")).toBe("user@stu.upes.ac.in");
  });

  it("handles uppercase domain", () => {
    expect(normalize("User@STU.UPES.AC.IN")).toBe("user@stu.upes.ac.in");
  });
});
