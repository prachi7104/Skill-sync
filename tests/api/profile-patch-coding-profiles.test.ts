import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadPatchRoute() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn((payload: Record<string, unknown>) => ({ where: mockWhere, payload }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  vi.doMock("@/lib/db", () => ({
    db: {
      update: mockUpdate,
      query: {
        jobs: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn(() => ({ values: vi.fn() })),
    },
  }));

  vi.doMock("@/lib/auth/helpers", () => ({
    requireStudentProfile: vi.fn().mockResolvedValue({
      user: {
        id: "student-1",
        name: "Student One",
        email: "student1@stu.upes.ac.in",
      },
      profile: {
        sapId: null,
        batchYear: null,
        profileCompleteness: 40,
      },
    }),
  }));

  vi.doMock("@/lib/profile/completeness", () => ({
    computeCompleteness: vi.fn().mockReturnValue({ score: 45 }),
  }));

  vi.doMock("@/lib/workers/generate-embedding", () => ({
    processEmbeddingJobs: vi.fn().mockResolvedValue(undefined),
  }));

  vi.doMock("@/lib/logger", () => ({
    logger: { info: vi.fn() },
  }));

  const mod = await import("@/app/api/student/profile/route");
  return { PATCH: mod.PATCH, mockSet };
}

describe("profile route PATCH - coding profile URL optional", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("saves coding profile even when URL is omitted", async () => {
    const { PATCH, mockSet } = await loadPatchRoute();

    const req = new Request("http://localhost/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codingProfiles: [
          {
            platform: "LeetCode",
            username: "student123",
          },
        ],
      }),
    });

    const res = await PATCH(req as any);
    expect(res.status).toBe(200);
    expect(mockSet).toHaveBeenCalledTimes(1);

    const [updatePayload] = mockSet.mock.calls[0] as [Record<string, unknown>];
    expect(updatePayload.codingProfiles).toEqual([
      {
        platform: "LeetCode",
        username: "student123",
      },
    ]);
  });

  it("returns 400 when coding profile URL is non-empty but invalid", async () => {
    const { PATCH } = await loadPatchRoute();

    const req = new Request("http://localhost/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codingProfiles: [
          {
            platform: "GitHub",
            username: "octocat",
            url: "invalid-url",
          },
        ],
      }),
    });

    const res = await PATCH(req as any);
    expect(res.status).toBe(400);
  });
});
