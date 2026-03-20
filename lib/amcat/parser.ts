import "server-only";

export interface AmcatRowRaw {
  email: string | null;
  sap_id: string;
  full_name: string;
  course: string | null;
  branch: string | null;
  programme_name: string | null;
  status: string | null;
  attendance_pct: number | null;
  cs_score: number | null;
  cp_score: number | null;
  automata_score: number | null;
  automata_fix_score: number | null;
  quant_score: number | null;
  csv_total: number | null;
  csv_category: "alpha" | "beta" | "gamma" | null;
}

export interface AmcatScoreWeights {
  automata: number;
  automata_fix: number;
  computer_programming: number;
  computer_science: number;
  quant: number;
}

export interface AmcatCategoryThresholds {
  alpha_min: number;
  beta_min: number;
  gamma_min: number;
}

export const DEFAULT_WEIGHTS: AmcatScoreWeights = {
  automata: 0.50,
  automata_fix: 0.20,
  computer_programming: 0.10,
  computer_science: 0.10,
  quant: 0.10,
};

export const DEFAULT_THRESHOLDS: AmcatCategoryThresholds = {
  alpha_min: 60,
  beta_min: 40,
  gamma_min: 0,
};

export function computeAmcatTotal(row: AmcatRowRaw, weights: AmcatScoreWeights): number {
  const automata = row.automata_score ?? 0;
  const automataFix = row.automata_fix_score ?? 0;
  const cp = row.cp_score ?? 0;
  const cs = row.cs_score ?? 0;
  const quant = row.quant_score ?? 0;

  const total = (
    automata * weights.automata +
    automataFix * weights.automata_fix +
    cp * weights.computer_programming +
    cs * weights.computer_science +
    quant * weights.quant
  );

  return Math.round(total * 10) / 10;
}

export function computeAmcatCategory(
  total: number,
  thresholds: AmcatCategoryThresholds,
): "alpha" | "beta" | "gamma" {
  if (total >= thresholds.alpha_min) return "alpha";
  if (total >= thresholds.beta_min) return "beta";
  return "gamma";
}

export function validateWeights(weights: AmcatScoreWeights): { valid: boolean; reason?: string } {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    return { valid: false, reason: `Weights must sum to 1.0 (got ${sum.toFixed(3)})` };
  }

  for (const [key, val] of Object.entries(weights)) {
    if (val < 0 || val > 1) {
      return { valid: false, reason: `Weight for ${key} must be between 0 and 1` };
    }
  }

  return { valid: true };
}

const COLUMN_MAP: Record<string, keyof AmcatRowRaw> = {
  "email id": "email",
  "email": "email",
  "emailid": "email",
  "email_id": "email",
  "full name": "full_name",
  "name": "full_name",
  "sapid": "sap_id",
  "sap id": "sap_id",
  "sap_id": "sap_id",
  "course": "course",
  "branch": "branch",
  "programme name(invited)": "programme_name",
  "programme name": "programme_name",
  "programme": "programme_name",
  "computer science(score)": "cs_score",
  "computer science score": "cs_score",
  "computer science": "cs_score",
  "cs(score)": "cs_score",
  "cs score": "cs_score",
  "cs_score": "cs_score",
  "computer programming(score)": "cp_score",
  "computer programming score": "cp_score",
  "computer programming": "cp_score",
  "cp(score)": "cp_score",
  "cp score": "cp_score",
  "cp_score": "cp_score",
  "automata(score)": "automata_score",
  "automata score": "automata_score",
  "automata": "automata_score",
  "automata_score": "automata_score",
  "automata fix(score)": "automata_fix_score",
  "automata fix score": "automata_fix_score",
  "automata fix": "automata_fix_score",
  "automata_fix": "automata_fix_score",
  "automata_fix_score": "automata_fix_score",
  "autofix": "automata_fix_score",
  "quant(score)": "quant_score",
  "quant score": "quant_score",
  "quant": "quant_score",
  "quant_score": "quant_score",
  "quantitative(score)": "quant_score",
  "quantitative": "quant_score",
  "attendance %": "attendance_pct",
  "attendance": "attendance_pct",
  "attendance percent": "attendance_pct",
  "status": "status",
  "total": "csv_total",
  "bifurcated batch": "csv_category",
  "category": "csv_category",
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[\s_]+/g, " ");
}

function parseCategory(value: unknown): "alpha" | "beta" | "gamma" | null {
  const parsed = String(value ?? "").toLowerCase().trim();
  if (parsed === "alpha") return "alpha";
  if (parsed === "beta") return "beta";
  if (parsed === "gamma") return "gamma";
  return null;
}

export function parseAmcatRows(
  headers: string[],
  rows: unknown[][],
): { data: AmcatRowRaw[]; unmapped: string[]; errors: string[] } {
  const mappedHeaders: Array<keyof AmcatRowRaw | null> = headers.map((header) => {
    const key = normalizeHeader(header);
    return COLUMN_MAP[key] ?? null;
  });

  const unmapped = headers.filter((header) => {
    const key = normalizeHeader(header);
    return !COLUMN_MAP[key] && !["formula used", "bifurcation basis", ""].includes(key);
  });

  const data: AmcatRowRaw[] = [];
  const errors: string[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rawRow = rows[rowIndex] as unknown[];
    const sapColumnIndex = mappedHeaders.findIndex((header) => header === "sap_id");
    const sapRaw = sapColumnIndex >= 0 ? rawRow[sapColumnIndex] : null;
    const sapStr = String(sapRaw ?? "").trim().replace(/\s+/g, "");

    // Skip footer/metadata rows.
    if (!sapStr || !/^\d{8,9}$/.test(sapStr)) {
      continue;
    }

    const obj: Partial<AmcatRowRaw> = {};

    for (let columnIndex = 0; columnIndex < mappedHeaders.length; columnIndex++) {
      const field = mappedHeaders[columnIndex];
      if (!field) continue;

      const value = rawRow[columnIndex];

      if (["cs_score", "cp_score", "automata_score", "automata_fix_score", "quant_score"].includes(field)) {
        const strVal = String(value ?? "").trim();
        if (strVal === "" || strVal === "-") {
          (obj as Record<string, unknown>)[field] = null;
        } else {
          const n = Number(strVal);
          (obj as Record<string, unknown>)[field] = Number.isNaN(n) ? null : Math.round(n);
        }
      } else if (field === "csv_total") {
        const strVal = String(value ?? "").trim();
        if (strVal === "" || strVal === "-") {
          obj.csv_total = null;
        } else {
          const n = Number(strVal);
          obj.csv_total = Number.isNaN(n) ? null : n;
        }
      } else if (field === "attendance_pct") {
        const strVal = String(value ?? "").trim();
        obj.attendance_pct = strVal ? Number(strVal) || null : null;
      } else if (field === "csv_category") {
        obj.csv_category = parseCategory(value);
      } else if (field === "email") {
        const emailStr = String(value ?? "").trim();
        obj.email = emailStr || null;
      } else {
        (obj as Record<string, unknown>)[field] =
          value !== null && value !== "" && value !== undefined ? String(value).trim() : null;
      }
    }

    data.push({
      email: obj.email ?? null,
      sap_id: sapStr,
      full_name: obj.full_name ?? "Unknown",
      course: obj.course ?? null,
      branch: obj.branch ?? null,
      programme_name: obj.programme_name ?? null,
      status: obj.status ?? null,
      attendance_pct: obj.attendance_pct ?? null,
      cs_score: obj.cs_score ?? null,
      cp_score: obj.cp_score ?? null,
      automata_score: obj.automata_score ?? null,
      automata_fix_score: obj.automata_fix_score ?? null,
      quant_score: obj.quant_score ?? null,
      csv_total: obj.csv_total ?? null,
      csv_category: obj.csv_category ?? null,
    });
  }

  return { data, unmapped, errors };
}

export interface AmcatProcessedRow extends AmcatRowRaw {
  computed_total: number;
  computed_category: "alpha" | "beta" | "gamma";
  final_category: "alpha" | "beta" | "gamma";
  rank_in_session: number;
  is_absent: boolean;
}

export function processAmcatData(
  raw: AmcatRowRaw[],
  weights: AmcatScoreWeights = DEFAULT_WEIGHTS,
  thresholds: AmcatCategoryThresholds = DEFAULT_THRESHOLDS,
): AmcatProcessedRow[] {
  const withScores = raw.map((row) => {
    const isAbsent = row.status?.toLowerCase() === "absent" || (row.csv_total !== null && row.csv_total < 0);

    if (isAbsent) {
      return {
        ...row,
        computed_total: -1,
        computed_category: "gamma" as const,
        final_category: "gamma" as const,
        rank_in_session: 9999,
        is_absent: true,
      };
    }

    const computed_total = computeAmcatTotal(row, weights);
    const computed_category = computeAmcatCategory(computed_total, thresholds);
    return {
      ...row,
      computed_total,
      computed_category,
      final_category: computed_category,
      rank_in_session: 0,
      is_absent: false,
    };
  });

  const presentStudents = withScores.filter((row) => !row.is_absent);
  const absentStudents = withScores.filter((row) => row.is_absent);

  presentStudents.sort((a, b) => b.computed_total - a.computed_total);
  presentStudents.forEach((row, index) => {
    row.rank_in_session = index + 1;
  });

  const lastRank = presentStudents.length;
  absentStudents.forEach((row, index) => {
    row.rank_in_session = lastRank + index + 1;
  });

  return [...presentStudents, ...absentStudents];
}

export function computeCategoryDistribution(rows: AmcatProcessedRow[]) {
  return {
    total: rows.length,
    alpha: rows.filter((row) => row.final_category === "alpha").length,
    beta: rows.filter((row) => row.final_category === "beta").length,
    gamma: rows.filter((row) => row.final_category === "gamma").length,
  };
}
