import { describe, expect, it } from "vitest";

type StudentRow = {
  id: string;
  collegeId: string;
  name: string;
  email: string;
  sapId: string | null;
  branch: string | null;
  batchYear: number | null;
};

function searchStudents(rows: StudentRow[], collegeId: string, q: string): StudentRow[] {
  const query = q.toLowerCase();
  return rows.filter((r) =>
    r.collegeId === collegeId &&
    (r.name.toLowerCase().includes(query) || r.email.toLowerCase().includes(query) || (r.sapId ?? "").toLowerCase().includes(query)),
  );
}

describe("P3.3 admin search", () => {
  it("filters by admin college isolation", () => {
    const rows: StudentRow[] = [
      { id: "1", collegeId: "A", name: "Alice", email: "alice@a.edu", sapId: "500111111", branch: "CSE", batchYear: 2026 },
      { id: "2", collegeId: "B", name: "Bob", email: "bob@b.edu", sapId: "500222222", branch: "CSE", batchYear: 2026 },
    ];

    const result = searchStudents(rows, "A", "");
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("supports name, email, and sapId query", () => {
    const rows: StudentRow[] = [
      { id: "1", collegeId: "A", name: "Alice", email: "alice@a.edu", sapId: "500111111", branch: "CSE", batchYear: 2026 },
    ];

    expect(searchStudents(rows, "A", "ali")).toHaveLength(1);
    expect(searchStudents(rows, "A", "@a.edu")).toHaveLength(1);
    expect(searchStudents(rows, "A", "500111")).toHaveLength(1);
  });
});
