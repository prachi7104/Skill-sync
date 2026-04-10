import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

describe("Phase 3 — Career Coach UI", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("Test 1: stripMarkdown removes bold stars", () => {
    const stripMarkdown = (t: string) => t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
    expect(stripMarkdown("**Google**: With your skills")).toBe("Google: With your skills");
    expect(stripMarkdown("* Product companies")).toBe("* Product companies");
  });

  it("Test 2: career coach page renders skill name, not markdown", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          summary: "**Strong** profile",
          priority_skills: [
            {
              skill: "PyTorch",
              why_critical: "**Critical** skill",
              resource: { type: "YouTube", name: "PyTorch Tutorials", url_description: "PyTorch beginner" },
              week_start: 1,
              hours_needed: 10,
            },
          ],
          generatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    await waitFor(() => expect(screen.getByText("PyTorch")).toBeInTheDocument());
    expect(screen.queryByText("**Critical**")).not.toBeInTheDocument();
    expect(screen.getByText(/Critical skill/i)).toBeInTheDocument();
  }, 30000);

  it("Test 3: career coach page shows loading skeleton while fetching", async () => {
    global.fetch = vi.fn().mockImplementation(
      () => new Promise<Response>(() => undefined)
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    expect(screen.getByTestId("summary-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("skill-skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByText("PyTorch")).not.toBeInTheDocument();
  });

  it("Test 4: career coach page shows error state when no drives", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ message: "No active drives" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    await waitFor(() => expect(screen.getByText("No drives to analyze")).toBeInTheDocument());
    expect(screen.queryByText("PyTorch")).not.toBeInTheDocument();
  });

  it("Test 5: resource type badge shows correct label", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          summary: "Roadmap",
          priority_skills: [
            {
              skill: "PyTorch",
              why_critical: "Critical",
              resource: { type: "YouTube", name: "PyTorch Tutorials", url_description: "PyTorch tutorials" },
              week_start: 2,
              hours_needed: 8,
            },
          ],
          generatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    ) as any;

    const { default: CareerCoachPage } = await import("@/app/(student)/student/career-coach/page");
    render(<CareerCoachPage />);

    const badge = await screen.findByText("YouTube");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-destructive");
  });
});
