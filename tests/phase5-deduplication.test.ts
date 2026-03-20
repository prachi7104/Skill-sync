import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadPatchRoute(findFirstResponses: Array<{ id: string } | null>) {
  const mockFindFirst = vi.fn();
  for (const value of findFirstResponses) {
    mockFindFirst.mockResolvedValueOnce(value);
  }
  if (findFirstResponses.length === 0) {
    mockFindFirst.mockResolvedValue(null);
  }

  const mockInsertValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

  vi.doMock("@/lib/db", () => ({
    db: {
      query: {
        jobs: { findFirst: mockFindFirst },
      },
      update: mockUpdate,
      insert: mockInsert,
    },
  }));

  vi.doMock("@/lib/auth/helpers", () => ({
    requireStudentProfile: vi.fn().mockResolvedValue({
      user: { id: "student-1", name: "Student", email: "student@stu.upes.ac.in" },
      profile: {
        profileCompleteness: 70,
        skills: [{ name: "React" }],
      },
    }),
  }));

  vi.doMock("@/lib/validations/student-profile", () => ({
    studentProfileSchema: {
      partial: () => ({
        parse: (payload: unknown) => payload,
      }),
    },
  }));

  vi.doMock("@/lib/profile/completeness", () => ({
    computeCompleteness: vi.fn().mockReturnValue({ score: 80 }),
  }));

  vi.doMock("@/lib/workers/generate-embedding", () => ({
    processEmbeddingJobs: vi.fn().mockResolvedValue(undefined),
  }));

  vi.doMock("@/lib/logger", () => ({
    logger: { info: vi.fn() },
  }));

  const mod = await import("@/app/api/student/profile/route");
  return {
    PATCH: mod.PATCH,
    mockInsert,
    mockInsertValues,
    mockFindFirst,
  };
}

describe("Phase 5 - embedding job deduplication", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("multiple profile saves create only one embedding job", async () => {
    const { PATCH, mockInsert, mockFindFirst } = await loadPatchRoute([null, { id: "job-1" }]);

    const req1 = new Request("http://localhost/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills: [{ name: "TypeScript" }] }),
    });
    const req2 = new Request("http://localhost/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills: [{ name: "TypeScript" }] }),
    });

    const res1 = await PATCH(req1 as any);
    const res2 = await PATCH(req2 as any);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(mockFindFirst).toHaveBeenCalledTimes(2);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("completed job allows new embedding job", async () => {
    const { PATCH, mockInsertValues } = await loadPatchRoute([null]);

    const req = new Request("http://localhost/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills: [{ name: "Node.js" }] }),
    });

    const res = await PATCH(req as any);
    expect(res.status).toBe(200);
    expect(mockInsertValues).toHaveBeenCalledTimes(1);
  });
});
