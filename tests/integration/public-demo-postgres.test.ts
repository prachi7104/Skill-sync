// @vitest-environment node
/**
 * Guest-mode data isolation against a real PostgreSQL engine (in-process
 * PGlite + pgvector, schema generated from lib/db/schema.ts). The queries in
 * lib/demo/* are what keep one visitor out of another's workspace and out of
 * institutional data, so they are exercised here end to end through the route
 * handler. AI and embedding providers are mocked; nothing leaves the process.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { and, eq, like, sql } from "drizzle-orm";
import {
  aiRateLimits, colleges, demoResumeFiles, demoWorkspaces, drives, rankings, students, users,
} from "@/lib/db/schema";
import { createTestDatabase } from "./helpers/pglite-db";

const fixtures = vi.hoisted(() => ({
  database: undefined as unknown,
  session: vi.fn(),
  ai: vi.fn(),
  embed: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: new Proxy({}, {
    get: (_target, key) => {
      if (!fixtures.database) throw new Error("Test database not ready");
      const value = Reflect.get(fixtures.database as object, key, fixtures.database);
      return typeof value === "function" ? value.bind(fixtures.database) : value;
    },
  }),
}));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("next-auth", async (original) => ({ ...await original<typeof import("next-auth")>(), getServerSession: fixtures.session }));
vi.mock("@/lib/env", () => ({ validateCronAuth: (auth: string | null) => auth === "Bearer fixture-cleanup-secret", env: {} }));
vi.mock("@/lib/ai/generate", async (original) => ({ ...await original<typeof import("@/lib/ai/generate")>(), runAi: fixtures.ai }));
vi.mock("@/lib/embeddings", async (original) => ({ ...await original<typeof import("@/lib/embeddings")>(), generateEmbedding: fixtures.embed }));

const origin = "http://localhost:3000";
const DOCX = readFileSync(path.resolve(__dirname, "../../playwright/fixtures/resumes/fictional-resume.docx"));
const PARSED = {
  full_name: "Riley Morgan", email: "riley.morgan@example.invalid",
  skills: [{ name: "Python", category: "programming" }, { name: "PostgreSQL", category: "database" }, { name: "React", category: "framework" }],
  projects: [{ title: "Campus Events Portal", description: "React and Node.js app.", tech_stack: ["React", "Node.js"] }],
  education_history: [{ institution: "Example Institute of Technology", degree: "B.Tech", branch: "Computer Science", cgpa: 8.4 }],
};
const unitVector = (i: number) => Array.from({ length: 768 }, (_, k) => (k === i ? 1 : 0.001));

type Route = typeof import("@/app/api/demo/[...action]/route");
let route: Route;
let workspace: typeof import("@/lib/demo/workspace");
let resume: typeof import("@/lib/demo/resume");
let close: () => Promise<void>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

type Identity = { id: string; collegeId: string; email: string };
const roleOf = (kind: "student" | "recruiter") => (kind === "recruiter" ? "faculty" : "student");

function signInAs(identity: Identity, kind: "student" | "recruiter") {
  fixtures.session.mockResolvedValue({ user: { id: identity.id, collegeId: identity.collegeId, role: roleOf(kind), isGuest: true, email: identity.email } });
}

function send(method: "GET" | "POST" | "PATCH", target: string, init: { body?: BodyInit; headers?: Record<string, string> } = {}) {
  const handler = { GET: route.GET, POST: route.POST, PATCH: route.PATCH }[method];
  const headers = { ...(method === "GET" ? {} : { origin }), ...init.headers };
  const request = new NextRequest(`${origin}/api/demo/${target}`, { method, body: init.body, headers });
  return handler(request, { params: { action: target.split("/") } });
}
const sendJson = (method: "POST" | "PATCH", target: string, body: unknown) =>
  send(method, target, { body: JSON.stringify(body), headers: { "content-type": "application/json" } });

async function workspaceIds(collegeId: string) {
  const [ws] = await db.select().from(demoWorkspaces).where(eq(demoWorkspaces.collegeId, collegeId));
  const driveRows = await db.select({ id: drives.id }).from(drives).where(eq(drives.collegeId, collegeId));
  const candidates = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.collegeId, collegeId), like(users.email, "candidate-%")));
  return { ws, driveIds: driveRows.map((d: { id: string }) => d.id), candidateIds: candidates.map((c: { id: string }) => c.id) };
}

describe("Guest mode against PostgreSQL (PGlite)", () => {
  let studentA: Identity, recruiterA: Identity, studentB: Identity;
  let institutionalCollegeId: string;

  beforeAll(async () => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    vi.stubEnv("NEXTAUTH_URL", origin);
    const test = await createTestDatabase();
    fixtures.database = test.db;
    db = test.db;
    close = test.close;
    route = await import("@/app/api/demo/[...action]/route");
    workspace = await import("@/lib/demo/workspace");
    resume = await import("@/lib/demo/resume");

    // An institutional college with a real student, which guests must never see.
    const [inst] = await db.insert(colleges).values({ name: "Institutional College", shortCode: "inst", studentDomain: "inst.example.edu" })
      .returning({ id: colleges.id });
    institutionalCollegeId = inst.id;
    const [instUser] = await db.insert(users).values({ name: "Real Student", email: "real@inst.example.edu", role: "student", collegeId: inst.id })
      .returning({ id: users.id });
    await db.insert(students).values({ id: instUser.id, collegeId: inst.id, embedding: unitVector(3) });

    const a = await workspace.provisionDemoWorkspace("student");
    const b = await workspace.provisionDemoWorkspace("student");
    expect(a && b).toBeTruthy();
    studentA = a!;
    studentB = b!;
    const switched = await workspace.switchDemoIdentity("recruiter", studentA);
    recruiterA = switched!;
  }, 120_000);

  afterAll(async () => {
    vi.unstubAllEnvs();
    await close?.();
  });

  beforeEach(() => {
    fixtures.ai.mockReset();
    fixtures.embed.mockReset();
    fixtures.session.mockReset();
  });

  it("provisions separate workspaces with 12 fictional candidates and computed rankings", async () => {
    expect(studentA.collegeId).not.toBe(studentB.collegeId);
    const ids = await workspaceIds(studentA.collegeId);
    expect(ids.ws.studentUserId).toBe(studentA.id);
    expect(ids.ws.recruiterUserId).toBe(recruiterA.id);
    expect(ids.candidateIds).toHaveLength(12);
    expect(ids.driveIds.length).toBeGreaterThan(0);
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(rankings).where(eq(rankings.collegeId, studentA.collegeId));
    expect(n).toBe(ids.driveIds.length * 13);
  });

  it("switching role only works within the caller's own workspace", async () => {
    expect(await workspace.switchDemoIdentity("recruiter", { id: studentB.id, collegeId: studentA.collegeId })).toBeNull();
    const back = await workspace.switchDemoIdentity("student", recruiterA);
    expect(back?.id).toBe(studentA.id);
  });

  it("rejects sessions whose identity does not match the live workspace", async () => {
    // Student B's id presented with workspace A's college.
    fixtures.session.mockResolvedValue({ user: { id: studentB.id, collegeId: studentA.collegeId, role: "student", isGuest: true } });
    expect((await send("GET", "overview")).status).toBe(401);
    // A student id claiming the recruiter role.
    fixtures.session.mockResolvedValue({ user: { id: studentA.id, collegeId: studentA.collegeId, role: "faculty", isGuest: true } });
    expect((await send("GET", "drives")).status).toBe(401);
    // A non-guest institutional session.
    fixtures.session.mockResolvedValue({ user: { id: studentA.id, collegeId: studentA.collegeId, role: "student", isGuest: false } });
    expect((await send("GET", "overview")).status).toBe(401);
    fixtures.session.mockResolvedValue(null);
    const res = await send("GET", "overview");
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("session_expired");
  });

  it("enforces roles on the server", async () => {
    signInAs(studentA, "student");
    expect((await send("GET", "drives")).status).toBe(403);
    expect((await send("GET", "candidates/00000000-0000-4000-8000-000000000000")).status).toBe(403);
    signInAs(recruiterA, "recruiter");
    expect((await send("GET", "overview")).status).toBe(403);
    expect((await sendJson("POST", "chat", { message: "hi" })).status).toBe(403);
  });

  it("rejects cross-origin writes", async () => {
    signInAs(recruiterA, "recruiter");
    const { driveIds, candidateIds } = await workspaceIds(studentA.collegeId);
    const res = await send("PATCH", `drives/${driveIds[0]}/shortlist`, {
      body: JSON.stringify({ studentId: candidateIds[0], shortlisted: true }),
      headers: { "content-type": "application/json", origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });

  it("scopes recruiter drives, candidates and shortlists to the caller's workspace", async () => {
    const own = await workspaceIds(studentA.collegeId);
    const other = await workspaceIds(studentB.collegeId);
    signInAs(recruiterA, "recruiter");

    const list = await (await send("GET", "drives")).json();
    expect(list.drives.map((d: { id: string }) => d.id).sort()).toEqual([...own.driveIds].sort());

    const drive = await (await send("GET", `drives/${own.driveIds[0]}`)).json();
    expect(drive.rankings).toHaveLength(12);
    expect(drive.rankings.some((r: { studentId: string }) => r.studentId === studentA.id)).toBe(false);

    expect((await send("GET", `drives/${other.driveIds[0]}`)).status).toBe(404);
    expect((await send("GET", `candidates/${other.candidateIds[0]}`)).status).toBe(404);
    expect((await send("GET", `candidates/${studentA.id}`)).status).toBe(404); // guest student is not a candidate
    expect((await sendJson("PATCH", `drives/${other.driveIds[0]}/shortlist`, { studentId: other.candidateIds[0], shortlisted: true })).status).toBe(404);
    expect((await sendJson("PATCH", `drives/${own.driveIds[0]}/shortlist`, { studentId: other.candidateIds[0], shortlisted: true })).status).toBe(404);

    const candidate = await (await send("GET", `candidates/${own.candidateIds[0]}`)).json();
    expect(candidate.candidate.id).toBe(own.candidateIds[0]);
    expect(candidate.fits.length).toBe(own.driveIds.length);
  });

  it("persists shortlist changes only in the caller's workspace", async () => {
    const own = await workspaceIds(studentA.collegeId);
    signInAs(recruiterA, "recruiter");
    const res = await sendJson("PATCH", `drives/${own.driveIds[0]}/shortlist`, { studentId: own.candidateIds[0], shortlisted: true });
    expect(res.status).toBe(200);
    const after = await (await send("GET", `drives/${own.driveIds[0]}`)).json();
    expect(after.rankings.find((r: { studentId: string }) => r.studentId === own.candidateIds[0]).shortlisted).toBe(true);
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(rankings)
      .where(and(eq(rankings.collegeId, studentB.collegeId), eq(rankings.shortlisted, true)));
    expect(n).toBe(0);
  });

  it("re-ranks after an opening edit and keeps the shortlist", async () => {
    const own = await workspaceIds(studentA.collegeId);
    signInAs(recruiterA, "recruiter");
    fixtures.embed.mockResolvedValue(unitVector(7));
    const res = await sendJson("PATCH", `drives/${own.driveIds[0]}`, {
      title: "Edited Opening", summary: "Edited.", requiredSkills: ["Python"], preferredSkills: [], responsibilities: [], minCgpa: 9.9,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.drive.title).toBe("Edited Opening");
    expect(body.drive.minCgpa).toBe(9.9);
    expect(body.rankings.find((r: { studentId: string }) => r.studentId === own.candidateIds[0]).shortlisted).toBe(true);
    expect(body.rankings.every((r: { isEligible: boolean; cgpa: number | null }) => !r.isEligible || (r.cgpa ?? 0) >= 9.9)).toBe(true);
  });

  it("commits an uploaded resume, its embedding and the private file together", async () => {
    signInAs(studentA, "student");
    fixtures.ai.mockImplementation(async (_task: string, _options: unknown, parse: (text: string) => unknown) =>
      ({ value: parse(JSON.stringify(PARSED)), model: "test-model", provider: "google", attempts: [] }));
    fixtures.embed.mockResolvedValue(unitVector(5));
    const form = new FormData();
    form.set("file", new File([DOCX], "fictional-resume.docx", { type: resume.DOCX_MIME }));
    form.set("jobId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    form.set("consent", "true");
    const request = new Request("http://x", { method: "POST", body: form });
    const body = await request.arrayBuffer();
    const res = await send("POST", "resume", {
      body, headers: { "content-type": request.headers.get("content-type")!, "content-length": String(body.byteLength) },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).model).toBe("test-model");
    // The AI saw text extracted from the real DOCX.
    expect(fixtures.ai.mock.calls[0][1].user).toContain("Riley Morgan");

    const [profile] = await db.select().from(students).where(eq(students.id, studentA.id));
    expect(profile.embedding).toHaveLength(768);
    expect(profile.resumeFilename).toBe("fictional-resume.docx");
    const file = await (await send("GET", "resume")).arrayBuffer();
    expect(Buffer.from(file).equals(DOCX)).toBe(true);

    // Other workspaces cannot reach the file or the job.
    signInAs(studentB, "student");
    expect((await send("GET", "resume")).status).toBe(404);
    expect((await send("GET", "jobs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).status).toBe(404);
    signInAs(studentA, "student");
    expect((await (await send("GET", "jobs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).json()).status).toBe("completed");
  });

  it("leaves the profile unchanged when the embedding step fails", async () => {
    signInAs(studentA, "student");
    const [before] = await db.select().from(students).where(eq(students.id, studentA.id));
    fixtures.ai.mockImplementation(async (_t: string, _o: unknown, parse: (text: string) => unknown) =>
      ({ value: parse(JSON.stringify({ ...PARSED, full_name: "Someone Else" })), model: "test-model", provider: "google", attempts: [] }));
    fixtures.embed.mockRejectedValue(new Error("Embedding provider unavailable"));
    const res = await sendJson("POST", "resume/sample", { jobId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    expect(res.status).toBe(503);
    const [after] = await db.select().from(students).where(eq(students.id, studentA.id));
    expect(after.resumeParsedAt?.getTime()).toBe(before.resumeParsedAt?.getTime());
    expect(after.resumeFilename).toBe(before.resumeFilename);
    expect(after.embedding).toEqual(before.embedding);
    const [file] = await db.select({ id: demoResumeFiles.studentId }).from(demoResumeFiles).where(eq(demoResumeFiles.studentId, studentA.id));
    expect(file).toBeTruthy();
    expect((await (await send("GET", "jobs/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")).json()).status).toBe("failed");
  });

  it("rejects disguised files and missing consent before any AI call", async () => {
    signInAs(studentA, "student");
    const upload = async (file: File, consent = "true") => {
      const form = new FormData();
      form.set("file", file);
      form.set("jobId", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
      form.set("consent", consent);
      const request = new Request("http://x", { method: "POST", body: form });
      const body = await request.arrayBuffer();
      return send("POST", "resume", { body, headers: { "content-type": request.headers.get("content-type")!, "content-length": String(body.byteLength) } });
    };
    expect((await upload(new File(["not a pdf at all"], "x.pdf", { type: "application/pdf" }))).status).toBe(415);
    expect((await upload(new File([DOCX], "x.docx", { type: resume.DOCX_MIME }), "false")).status).toBe(400);
    expect(fixtures.ai).not.toHaveBeenCalled();
  });

  it("returns 429 once the per-workspace quota is used up", async () => {
    signInAs(studentA, "student");
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    await db.insert(aiRateLimits).values({ modelKey: `demo:chat:${studentA.collegeId}`, windowStart: day, requestCount: 15 })
      .onConflictDoUpdate({ target: [aiRateLimits.modelKey, aiRateLimits.windowStart], set: { requestCount: 15 } });
    const res = await sendJson("POST", "chat", { message: "What should I learn next?" });
    expect(res.status).toBe(429);
    expect(fixtures.ai).not.toHaveBeenCalled();
  });

  it("never exposes institutional students to guests", async () => {
    const [inst] = await db.select({ id: users.id }).from(users).where(eq(users.collegeId, institutionalCollegeId));
    signInAs(recruiterA, "recruiter");
    expect((await send("GET", `candidates/${inst.id}`)).status).toBe(404);
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(rankings).where(eq(rankings.studentId, inst.id));
    expect(n).toBe(0);
  });

  it("expired workspaces lose access and cleanup removes only them", async () => {
    await db.update(demoWorkspaces).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(demoWorkspaces.collegeId, studentA.collegeId));
    signInAs(studentA, "student");
    expect((await send("GET", "overview")).status).toBe(401);

    expect((await send("GET", "cleanup")).status).toBe(401);
    const res = await send("GET", "cleanup", { headers: { authorization: "Bearer fixture-cleanup-secret" } });
    expect(await res.json()).toEqual({ deletedWorkspaces: 1 });

    for (const table of [users, students, drives, rankings]) {
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(table).where(eq(table.collegeId, studentA.collegeId));
      expect(n).toBe(0);
    }
    const [{ files }] = await db.select({ files: sql<number>`count(*)::int` }).from(demoResumeFiles).where(eq(demoResumeFiles.collegeId, studentA.collegeId));
    expect(files).toBe(0);
    expect(await db.select().from(colleges).where(eq(colleges.id, studentA.collegeId))).toHaveLength(0);

    // Workspace B and the institutional college are untouched.
    expect((await workspaceIds(studentB.collegeId)).candidateIds).toHaveLength(12);
    expect(await db.select().from(colleges).where(eq(colleges.id, institutionalCollegeId))).toHaveLength(1);
    signInAs(studentB, "student");
    expect((await send("GET", "overview")).status).toBe(200);
  });

  it("exit ends the caller's own workspace for both roles and leaves others alive", async () => {
    const c = (await workspace.provisionDemoWorkspace("student"))!;
    const cRecruiter = (await workspace.switchDemoIdentity("recruiter", c))!;
    signInAs(c, "student");
    expect((await send("GET", "overview")).status).toBe(200);

    // Exit is a write, so it needs the same origin.
    expect((await send("POST", "exit", { headers: { origin: "https://evil.example" } })).status).toBe(403);
    const res = await send("POST", "exit");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ended: true });

    // The replayed cookies of both roles are now rejected.
    expect((await send("GET", "overview")).status).toBe(401);
    signInAs(cRecruiter, "recruiter");
    expect((await send("GET", "drives")).status).toBe(401);

    // Exit only expires: the guarded cleanup deletes it, and the institutional college survives.
    const cleaned = await send("GET", "cleanup", { headers: { authorization: "Bearer fixture-cleanup-secret" } });
    expect(await cleaned.json()).toEqual({ deletedWorkspaces: 1 });
    expect(await db.select().from(colleges).where(eq(colleges.id, c.collegeId))).toHaveLength(0);
    expect(await db.select().from(colleges).where(eq(colleges.id, institutionalCollegeId))).toHaveLength(1);
    signInAs(studentB, "student");
    expect((await send("GET", "overview")).status).toBe(200);
  });

  it("returns 404 for every guest route when the flag is off", async () => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", "false");
    signInAs(studentB, "student");
    expect((await send("GET", "overview")).status).toBe(404);
    expect((await send("GET", "cleanup", { headers: { authorization: "Bearer fixture-cleanup-secret" } })).status).toBe(404);
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
  });
});
