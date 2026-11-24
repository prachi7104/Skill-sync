// @vitest-environment node
/**
 * Request-level guarantees of /api/demo/*: flag gating, session and origin
 * checks, role separation, input limits, consent, and honest error mapping.
 * Data isolation itself is covered against PostgreSQL in
 * tests/integration/public-demo-postgres.test.ts.
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH, POST } from "@/app/api/demo/[...action]/route";
import { AiError } from "@/lib/ai/generate";
import { DemoQuotaExceeded } from "@/lib/demo/quota";

const mocks = vi.hoisted(() => ({
  guest: vi.fn(), transaction: vi.fn(), quota: vi.fn(),
  overview: vi.fn(), chat: vi.fn(), ats: vi.fn(), recommend: vi.fn(), explain: vi.fn(),
  drives: vi.fn(), drive: vi.fn(), update: vi.fn(), shortlist: vi.fn(), candidate: vi.fn(),
  job: vi.fn(), file: vi.fn(), process: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { transaction: mocks.transaction } }));
vi.mock("@/lib/env", () => ({ validateCronAuth: (auth: string | null) => auth === "Bearer test-cron-secret", env: {} }));
vi.mock("@/lib/demo/quota", async (original) => ({ ...await original<typeof import("@/lib/demo/quota")>(), consumeDemoQuota: mocks.quota }));
vi.mock("@/lib/demo/session", () => ({
  demoUuid: /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,
  requireDemoGuest: mocks.guest,
}));
vi.mock("@/lib/demo/overview", () => ({ getStudentOverview: mocks.overview }));
vi.mock("@/lib/demo/insights", () => ({
  careerChat: mocks.chat, atsAnalysis: mocks.ats, studentRecommendations: mocks.recommend, recruiterExplanation: mocks.explain,
}));
vi.mock("@/lib/demo/ranking", () => ({
  listRecruiterDrives: mocks.drives, getRecruiterDrive: mocks.drive, updateRecruiterDrive: mocks.update,
  setShortlist: mocks.shortlist, getCandidate: mocks.candidate,
}));
vi.mock("@/lib/demo/resume", async (original) => {
  const actual = await original<typeof import("@/lib/demo/resume")>();
  return { ...actual, getDemoResumeJob: mocks.job, getDemoResumeFile: mocks.file, processDemoResume: mocks.process };
});

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const student = { id: "s", collegeId: "college-a", role: "student", kind: "student", studentUserId: "s", recruiterUserId: "r", expiresAt: Date.now() + 1e6 };
const recruiter = { ...student, id: "r", role: "faculty", kind: "recruiter" };
const origin = "http://localhost:3000";

function send(method: "GET" | "POST" | "PATCH", path: string, init: { body?: BodyInit; headers?: Record<string, string> } = {}) {
  const handler = { GET, POST, PATCH }[method];
  return handler(new NextRequest(`${origin}/api/demo/${path}`, { method, ...init }), { params: { action: path.split("/") } });
}
const jsonInit = (body: unknown, extra: Record<string, string> = {}) =>
  ({ body: JSON.stringify(body), headers: { origin, "content-type": "application/json", ...extra } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
  vi.stubEnv("NEXTAUTH_URL", origin);
});
afterEach(() => vi.unstubAllEnvs());

describe("Guest API route", () => {
  it("is invisible when the flag is off, and requires a live guest session and same origin", async () => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", undefined);
    expect((await send("GET", "drives")).status).toBe(404);
    expect(mocks.guest).not.toHaveBeenCalled();
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    mocks.guest.mockResolvedValue(null);
    const anon = await send("GET", "drives");
    expect(anon.status).toBe(401);
    expect((await anon.json()).code).toBe("session_expired");
    mocks.guest.mockResolvedValue(student);
    expect((await send("POST", "chat", jsonInit({ message: "hi" }, { origin: "https://elsewhere.invalid" }))).status).toBe(403);
    expect((await send("POST", "chat", { body: "{}", headers: { "content-type": "application/json" } })).status).toBe(403);
    expect(mocks.chat).not.toHaveBeenCalled();
  });

  it("separates student and recruiter actions on the server", async () => {
    mocks.guest.mockResolvedValue(student);
    for (const path of ["drives", `drives/${id}`, `candidates/${id}`]) expect((await send("GET", path)).status).toBe(403);
    expect((await send("PATCH", `drives/${id}/shortlist`, jsonInit({ studentId: id, shortlisted: true }))).status).toBe(403);
    mocks.guest.mockResolvedValue(recruiter);
    for (const path of ["overview", "resume", `jobs/${id}`]) expect((await send("GET", path)).status).toBe(403);
    expect((await send("POST", "chat", jsonInit({ message: "hi" }))).status).toBe(403);
    expect((await send("GET", "unknown")).status).toBe(404);
    expect(mocks.drives).not.toHaveBeenCalled();
    expect(mocks.overview).not.toHaveBeenCalled();
    expect(mocks.chat).not.toHaveBeenCalled();
  });

  it("passes the verified guest (not request data) to every query", async () => {
    mocks.guest.mockResolvedValue(recruiter);
    mocks.shortlist.mockResolvedValue(false);
    expect((await send("PATCH", `drives/${id}/shortlist`, jsonInit({ studentId: id, shortlisted: true, collegeId: "other" }))).status).toBe(404);
    expect(mocks.shortlist).toHaveBeenCalledWith(recruiter, id, id, true);
    mocks.drive.mockResolvedValue(null);
    expect((await send("GET", `drives/${id}`)).status).toBe(404);
    expect((await send("GET", "drives/not-a-uuid")).status).toBe(404);
    expect(mocks.drive).toHaveBeenCalledTimes(1);
  });

  it("keeps job status and the private resume file scoped and uncached", async () => {
    mocks.guest.mockResolvedValue(student);
    mocks.job.mockResolvedValue(null);
    expect((await send("GET", `jobs/${id}`)).status).toBe(404);
    expect(mocks.job).toHaveBeenCalledWith(student, id);
    mocks.job.mockResolvedValue({ status: "completed", stage: "done", error: null });
    const status = await send("GET", `jobs/${id}`);
    expect(status.headers.get("cache-control")).toContain("no-store");

    mocks.file.mockResolvedValue({ data: Buffer.from("%PDF-1.7"), filename: 'a"b<script>.pdf', mime: "application/pdf" });
    const file = await send("GET", "resume");
    expect(file.headers.get("cache-control")).toBe("private, no-store");
    expect(file.headers.get("x-content-type-options")).toBe("nosniff");
    expect(file.headers.get("content-disposition")).toBe('attachment; filename="a_b_script_.pdf"');
  });

  it("refuses uploads without consent, without a size, or over 2 MB before any processing", async () => {
    mocks.guest.mockResolvedValue(student);
    const form = (consent?: string) => {
      const body = new FormData();
      body.append("file", new File(["%PDF-1.7 fictional"], "resume.pdf", { type: "application/pdf" }));
      body.append("jobId", id);
      if (consent) body.append("consent", consent);
      return body;
    };
    expect((await send("POST", "resume", { body: form(), headers: { origin, "content-length": "400" } })).status).toBe(400);
    expect((await send("POST", "resume", { body: form("true"), headers: { origin } })).status).toBe(413);
    expect((await send("POST", "resume", { body: form("true"), headers: { origin, "content-length": String(3 * 1024 * 1024) } })).status).toBe(413);
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it("validates JSON bodies", async () => {
    mocks.guest.mockResolvedValue(student);
    expect((await send("POST", "chat", jsonInit({ message: "x".repeat(1001) }))).status).toBe(400);
    expect((await send("POST", "chat", { body: "not json", headers: { origin, "content-type": "application/json" } })).status).toBe(400);
    expect((await send("POST", "ats", jsonInit({ jd: "too short" }))).status).toBe(400);
    expect((await send("POST", "resume/sample", jsonInit({ jobId: "nope" }))).status).toBe(400);
    mocks.guest.mockResolvedValue(recruiter);
    expect((await send("PATCH", `drives/${id}`, jsonInit({ title: "Role", requiredSkills: [] }))).status).toBe(400);
    expect(mocks.quota).not.toHaveBeenCalled();
    expect(mocks.chat).not.toHaveBeenCalled();
  });

  it("maps quota and provider failures to honest status codes", async () => {
    mocks.guest.mockResolvedValue(student);
    const chat = () => send("POST", "chat", jsonInit({ message: "How should I prepare?" }));
    mocks.chat.mockRejectedValueOnce(new DemoQuotaExceeded("Daily demo limit reached."));
    const quota = await chat();
    expect(quota.status).toBe(429);
    expect((await quota.json()).code).toBe("quota");
    mocks.chat.mockRejectedValueOnce(new AiError("rate_limited", "x"));
    expect((await chat()).status).toBe(429);
    mocks.chat.mockRejectedValueOnce(new AiError("timeout", "x"));
    expect((await chat()).status).toBe(504);
    mocks.chat.mockRejectedValueOnce(new AiError("invalid_key", "x"));
    const unavailable = await chat();
    expect(unavailable.status).toBe(503);
    expect((await unavailable.json()).code).toBe("ai_unavailable");
    mocks.chat.mockResolvedValueOnce({ reply: "Practice explaining your project.", model: "m", provider: "google" });
    expect(await (await chat()).json()).toEqual({ reply: "Practice explaining your project.", model: "m", provider: "google" });
  });

  it("charges the edit quota before re-embedding an opening", async () => {
    mocks.guest.mockResolvedValue(recruiter);
    mocks.quota.mockRejectedValueOnce(new DemoQuotaExceeded("limit"));
    const edit = { title: "Role", requiredSkills: ["Python"] };
    expect((await send("PATCH", `drives/${id}`, jsonInit(edit))).status).toBe(429);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.quota).toHaveBeenCalledWith("jd_edit", recruiter.collegeId);
  });

  it("requires the cron secret before touching cleanup tables", async () => {
    expect((await send("GET", "cleanup")).status).toBe(401);
    expect((await send("GET", "cleanup", { headers: { authorization: "Bearer wrong" } })).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
    mocks.transaction.mockResolvedValue(2);
    const response = await send("GET", "cleanup", { headers: { authorization: "Bearer test-cron-secret" } });
    expect(await response.json()).toEqual({ deletedWorkspaces: 2 });
    expect(mocks.guest).not.toHaveBeenCalled();
  });
});
