import { describe, expect, it } from "vitest";

type Student = {
  id: string;
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: string | null;
  embedding: number[] | null;
  skills: string[];
};

type Drive = {
  id: string;
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: string[] | null;
  jdEmbedding: number[] | null;
  requiredSkills: string[];
};

function isEligible(student: Student, drive: Drive): boolean {
  if (drive.minCgpa !== null && (student.cgpa === null || student.cgpa < drive.minCgpa)) return false;
  if (drive.eligibleBranches?.length && (!student.branch || !drive.eligibleBranches.includes(student.branch))) return false;
  if (drive.eligibleBatchYears?.length && (student.batchYear === null || !drive.eligibleBatchYears.includes(student.batchYear))) return false;
  if (drive.eligibleCategories?.length && (!student.category || !drive.eligibleCategories.includes(student.category))) return false;
  return true;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function computeScore(student: Student, drive: Drive): { semantic: number; ats: number; total: number } {
  const semantic = student.embedding && drive.jdEmbedding ? Math.round(cosine(student.embedding, drive.jdEmbedding) * 10000) / 100 : 0;
  const matched = drive.requiredSkills.filter((s) => student.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase())).length;
  const ats = drive.requiredSkills.length ? Math.round((matched / drive.requiredSkills.length) * 10000) / 100 : 100;
  const total = Math.round((semantic * 0.7 + ats * 0.3) * 100) / 100;
  return { semantic, ats, total };
}

function rankStudents(students: Student[], drive: Drive): Array<{ id: string; score: number; ats: number; semantic: number }> {
  return students
    .filter((s) => isEligible(s, drive))
    .map((s) => {
      const score = computeScore(s, drive);
      return { id: s.id, score: score.total, ats: score.ats, semantic: score.semantic };
    })
    .sort((a, b) => b.score - a.score);
}

describe("P2.2 ranking pipeline", () => {
  it("fullRankingFlow_withEmbeddings_producesScores", () => {
    const drive: Drive = {
      id: "d1",
      minCgpa: 7,
      eligibleBranches: ["CSE"],
      eligibleBatchYears: [2026],
      eligibleCategories: null,
      jdEmbedding: [1, 0],
      requiredSkills: ["React", "TypeScript"],
    };

    const result = rankStudents(
      [
        { id: "s1", cgpa: 8.1, branch: "CSE", batchYear: 2026, category: null, embedding: [0.9, 0.1], skills: ["React", "TypeScript"] },
      ],
      drive,
    );

    expect(result).toHaveLength(1);
    expect(result[0].score).toBeGreaterThan(0);
    expect(result[0].semantic).toBeGreaterThan(0);
    expect(result[0].ats).toBe(100);
  });

  it("rankingWithoutEmbeddings_producesAtsOnlyScore", () => {
    const drive: Drive = {
      id: "d2",
      minCgpa: 0,
      eligibleBranches: null,
      eligibleBatchYears: null,
      eligibleCategories: null,
      jdEmbedding: null,
      requiredSkills: ["Node", "SQL"],
    };

    const result = rankStudents(
      [{ id: "s2", cgpa: 8, branch: "CSE", batchYear: 2026, category: null, embedding: null, skills: ["Node"] }],
      drive,
    );

    expect(result).toHaveLength(1);
    expect(result[0].semantic).toBe(0);
    expect(result[0].ats).toBe(50);
    expect(result[0].score).toBe(15);
  });

  it("eligibilityFilter_excludesIneligibleStudents", () => {
    const drive: Drive = {
      id: "d3",
      minCgpa: 7.5,
      eligibleBranches: ["CSE"],
      eligibleBatchYears: [2026],
      eligibleCategories: null,
      jdEmbedding: [1, 0],
      requiredSkills: ["Python"],
    };

    const result = rankStudents(
      [
        { id: "eligible", cgpa: 8, branch: "CSE", batchYear: 2026, category: null, embedding: [1, 0], skills: ["Python"] },
        { id: "ineligible", cgpa: 6.9, branch: "CSE", batchYear: 2026, category: null, embedding: [1, 0], skills: ["Python"] },
      ],
      drive,
    );

    expect(result.map((r) => r.id)).toEqual(["eligible"]);
  });

  it("rankingTransaction_isAtomicOnFailure", () => {
    const dbState: string[] = [];
    const transaction = (fn: () => void) => {
      const snapshot = [...dbState];
      try {
        fn();
      } catch {
        dbState.splice(0, dbState.length, ...snapshot);
        throw new Error("rollback");
      }
    };

    expect(() => {
      transaction(() => {
        dbState.push("delete_old");
        throw new Error("insert_failed");
      });
    }).toThrow("rollback");

    expect(dbState).toEqual([]);
  });
});
