import { beforeEach, describe, expect, it, vi } from "vitest";

type MappedProfile = {
  phone: string | null;
  linkedin: string | null;
  skills: Array<{ name: string; proficiency: 1 | 2 | 3 | 4 | 5 }>;
  projects: Array<{ title: string; description: string; techStack: string[]; url?: string }>;
  workExperience: Array<{ company: string; role: string; description: string; startDate: string; endDate?: string }>;
  codingProfiles: Array<{ platform: string; username: string; rating?: number; url?: string }>;
  certifications: Array<{ title: string; issuer: string; url?: string; dateIssued?: string }>;
  researchPapers: Array<{ title: string; abstract?: string; url?: string }>;
  achievements: Array<{ title: string; description?: string; issuer?: string; date?: string }>;
  softSkills: string[];
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  cgpa: number | null;
};

async function loadMergeRoute(options?: { withParsedResume?: boolean }) {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn((payload: Record<string, unknown>) => ({ where: mockWhere, payload }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  const mapped: MappedProfile = {
    phone: "+911234567890",
    linkedin: "https://linkedin.com/in/new-profile",
    skills: [
      { name: "React", proficiency: 3 },
      { name: "Node.js", proficiency: 3 },
    ],
    projects: [
      { title: "Resume Project", description: "Updated project", techStack: ["React"] },
    ],
    workExperience: [
      { company: "New Co", role: "Intern", description: "Did work", startDate: "2024-01" },
    ],
    codingProfiles: [
      { platform: "GitHub", username: "newuser", url: "https://github.com/newuser" },
    ],
    certifications: [{ title: "AWS", issuer: "Amazon" }],
    researchPapers: [{ title: "Edge AI" }],
    achievements: [{ title: "Hack Winner" }],
    softSkills: ["Communication"],
    tenthPercentage: 90,
    twelfthPercentage: 88,
    cgpa: 8.5,
  };

  vi.doMock("@/lib/db", () => ({
    db: {
      update: mockUpdate,
    },
  }));

  vi.doMock("@/lib/auth/helpers", () => ({
    requireStudentProfile: vi.fn().mockResolvedValue({
      user: { id: "student-1", name: "Student", email: "student@stu.upes.ac.in" },
      profile: {
        parsedResumeJson: options?.withParsedResume === false ? null : { raw: true },
        skills: [{ name: "React", proficiency: 5 }],
        projects: [{ title: "Old Project", description: "legacy", techStack: [] }],
        workExperience: [{ company: "Old Co", role: "Dev", description: "legacy", startDate: "2023-01" }],
        codingProfiles: [{ platform: "GitHub", username: "olduser", url: "https://github.com/olduser" }],
        certifications: [{ title: "Old Cert", issuer: "Org" }],
        researchPapers: [{ title: "Old Paper" }],
        achievements: [{ title: "Old Achievement" }],
        softSkills: ["Teamwork"],
        phone: null,
        linkedin: null,
        tenthPercentage: null,
        twelfthPercentage: null,
        cgpa: null,
      },
    }),
  }));

  vi.doMock("@/lib/profile/completeness", () => ({
    computeCompleteness: vi.fn().mockReturnValue({ score: 82 }),
  }));

  vi.doMock("@/lib/resume/ai-parser", () => ({
    mapParsedResumeToProfile: vi.fn().mockReturnValue(mapped),
  }));

  const mod = await import("@/app/api/student/profile/merge/route");
  return { POST: mod.POST, mockSet, mockWhere, mapped };
}

describe("profile merge route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("mode=replace overwrites profile arrays with latest resume mapping", async () => {
    const { POST, mockSet, mapped } = await loadMergeRoute();

    const req = new Request("http://localhost/api/student/profile/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "replace" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    expect(mockSet).toHaveBeenCalledTimes(1);
    const [updatePayload] = mockSet.mock.calls[0] as [Record<string, unknown>];
    expect(updatePayload.skills).toEqual(mapped.skills);
    expect(updatePayload.projects).toEqual(mapped.projects);
    expect(updatePayload.workExperience).toEqual(mapped.workExperience);
  });

  it("mode=merge keeps existing and appends only new unique entries", async () => {
    const { POST, mockSet } = await loadMergeRoute();

    const req = new Request("http://localhost/api/student/profile/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "merge" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    expect(mockSet).toHaveBeenCalledTimes(1);
    const [updatePayload] = mockSet.mock.calls[0] as [Record<string, unknown>];
    const skills = updatePayload.skills as Array<{ name: string }>;
    expect(skills).toHaveLength(2);
    expect(skills.map((s) => s.name)).toEqual(["React", "Node.js"]);
  });

  it("returns 400 when no sections are selected", async () => {
    const { POST } = await loadMergeRoute();

    const req = new Request("http://localhost/api/student/profile/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "replace",
        sections: {
          skills: false,
          projects: false,
          workExperience: false,
          certifications: false,
          codingProfiles: false,
          researchPapers: false,
          achievements: false,
          softSkills: false,
          contact: false,
          academics: false,
        },
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when parsed resume data is missing", async () => {
    const { POST } = await loadMergeRoute({ withParsedResume: false });

    const req = new Request("http://localhost/api/student/profile/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "replace" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });
});
