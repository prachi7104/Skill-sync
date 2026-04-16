import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadJobsRoute(options: {
  user: { id: string; role: "student" | "faculty" | "admin" };
  jobPayload: Record<string, unknown>;
}) {
  vi.doMock("@/lib/auth/helpers", () => ({
    requireAuth: vi.fn().mockResolvedValue(options.user),
  }));

  vi.doMock("@/lib/db", () => ({
    db: {
      query: {
        jobs: {
          findFirst: vi.fn().mockResolvedValue({
            id: "job-1",
            type: "parse_resume",
            status: "pending",
            payload: options.jobPayload,
            result: null,
            error: null,
            retryCount: 0,
            maxRetries: 3,
            modelUsed: null,
            latencyMs: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        },
      },
    },
  }));

  const mod = await import("@/app/api/jobs/[id]/route");
  return mod.GET;
}

describe("GET /api/jobs/[id] ownership", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("blocks student from reading another student's job", async () => {
    const GET = await loadJobsRoute({
      user: { id: "student-a", role: "student" },
      jobPayload: { studentId: "student-b" },
    });

    const res = await GET(new Request("http://localhost/api/jobs/job-1") as any, {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(res.status).toBe(403);
  });

  it("allows student to read own parse job", async () => {
    const GET = await loadJobsRoute({
      user: { id: "student-a", role: "student" },
      jobPayload: { studentId: "student-a" },
    });

    const res = await GET(new Request("http://localhost/api/jobs/job-1") as any, {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(res.status).toBe(200);
  });

  it("allows admin to read any job", async () => {
    const GET = await loadJobsRoute({
      user: { id: "admin-1", role: "admin" },
      jobPayload: { studentId: "student-b" },
    });

    const res = await GET(new Request("http://localhost/api/jobs/job-1") as any, {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(res.status).toBe(200);
  });
});
