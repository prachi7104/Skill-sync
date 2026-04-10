import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

async function loadPostRoute(options?: {
  user?: { id: string; role: "student" | "admin" | "faculty" } | null;
  profile?: Record<string, unknown> | null;
  executeResult?: { success: boolean; data?: unknown };
}) {
  const execute = vi.fn().mockResolvedValue(options?.executeResult ?? { success: true, data: "Advisor reply" });
  const mockUser = options && "user" in options ? options.user : { id: "stu-1", role: "student" as const };
  const mockProfile = options && "profile" in options
    ? options.profile
    : {
      branch: "CSE",
      batchYear: 2026,
      category: "GEN",
      cgpa: 8.1,
      skills: [{ name: "React" }, { name: "TypeScript" }],
    };

  vi.doMock("@/lib/auth/helpers", () => ({
    getCurrentUser: vi.fn().mockResolvedValue(mockUser),
    getStudentProfile: vi.fn().mockResolvedValue(mockProfile),
    requireStudentProfile: vi.fn(),
  }));

  vi.doMock("@/lib/antigravity/instance", () => ({
    getRouter: () => ({ execute }),
  }));

  vi.doMock("@/lib/db", () => ({
    db: {
      select: vi.fn(),
      query: {},
      execute: vi.fn(),
    },
  }));

  const mod = await import("@/app/api/student/career-coach/route");
  return { POST: mod.POST, execute };
}

describe("Phase 4 - Career Advisor multi-turn", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("POST with history includes prior messages in context", async () => {
    const { POST, execute } = await loadPostRoute();

    const req = new Request("http://localhost/api/student/career-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What should I do this week?",
        history: [
          { role: "user", content: "How do I improve placements?" },
          { role: "assistant", content: "Focus on DSA and projects." },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const prompt = execute.mock.calls[0]?.[1] as string;
    expect(prompt).toContain("User: How do I improve placements?");
    expect(prompt).toContain("Assistant: Focus on DSA and projects.");
    expect(prompt).toContain("User: What should I do this week?");
  }, 30000);

  it("POST without profile returns 403", async () => {
    const { POST } = await loadPostRoute({ profile: null });

    const req = new Request("http://localhost/api/student/career-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBeTruthy();
  });

  it("history is limited to 8 messages before current", async () => {
    const { POST, execute } = await loadPostRoute();

    const history = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: `history-${index + 1}`,
    }));

    const req = new Request("http://localhost/api/student/career-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "final-question",
        history,
      }),
    });

    await POST(req);

    const prompt = execute.mock.calls[0]?.[1] as string;
    expect(prompt).not.toContain("User: history-1\n");
    expect(prompt).not.toContain("Assistant: history-2\n");
    expect(prompt).not.toContain("User: history-3\n");
    expect(prompt).not.toContain("Assistant: history-4\n");
    expect(prompt).toContain("User: history-5");
    expect(prompt).toContain("Assistant: history-12");
    expect(prompt).toContain("User: final-question");
  });

  it("UI renders roadmap from GET payload", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        summary: "**Strong** trajectory for product roles",
        priority_skills: [{
          skill: "PyTorch",
          why_critical: "**Critical** for target drives",
          resource: { type: "YouTube", name: "PyTorch Tutorials", url_description: "PyTorch beginner" },
          week_start: 1,
          hours_needed: 12,
        }],
        generatedAt: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    await waitFor(() => expect(screen.getByText("Career Coach")).toBeInTheDocument());
    expect(screen.getByText("PyTorch")).toBeInTheDocument();
    expect(screen.queryByText("**Critical**")).not.toBeInTheDocument();
    expect(screen.getByText(/Critical for target drives/i)).toBeInTheDocument();
  }, 30000);

  it("UI shows error state for no active drives", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "No active drives" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    await waitFor(() => expect(screen.getByText("No drives to analyze")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
