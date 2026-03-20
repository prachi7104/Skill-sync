import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
  });

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

  it("UI quick chip sends message on click", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: "Try Python + DSA next." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    const chip = screen.getByRole("button", { name: "What drives am I eligible for?" });
    fireEvent.click(chip);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.message).toBe("What drives am I eligible for?");
  });

  it("UI shows typing indicator while loading", async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    global.fetch = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    fireEvent.click(screen.getByRole("button", { name: "How can I improve my ranking?" }));

    expect(screen.getByTestId("typing-indicator")).toBeInTheDocument();

    resolveFetch?.(
      new Response(JSON.stringify({ reply: "Practice aptitude + core CS." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await waitFor(() => expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument());
  });
});
