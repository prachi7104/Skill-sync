import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingFooterStrip from "@/components/landing/landing-footer-strip";
import MarkdownRenderer from "@/components/shared/markdown-renderer";
import RankingsTable from "@/components/faculty/rankings-table";

describe("Phase 3 responsive UI", () => {
  it("markdown renderer uses responsive prose sizing", () => {
    const { container } = render(<MarkdownRenderer content="# Title" />);

    expect(container.firstElementChild?.className).toContain("prose-sm");
    expect(container.firstElementChild?.className).toContain("sm:prose-base");
    expect(container.firstElementChild?.className).toContain("lg:prose-lg");
    expect(container.firstElementChild?.className).toContain("prose-pre:overflow-x-auto");
  });

  it("landing footer uses token-driven foreground colors", () => {
    const { container } = render(<LandingFooterStrip />);

    expect(container.querySelector("footer")?.className).toContain("bg-background");
    expect(screen.getByText("2,400+").className).toContain("text-foreground");
    expect(screen.getByText("Companies").className).toContain("text-muted-foreground");
  });

  it("rankings table renders mobile and desktop wrappers", () => {
    render(
      <RankingsTable
        rankings={[
          {
            rankPosition: 1,
            matchScore: 92.5,
            matchedSkills: ["React", "TypeScript", "Testing", "SQL"],
            missingSkills: ["Docker", "CI/CD"],
            shortExplanation: "Strong match across core frontend skills.",
            detailedExplanation: "Strong match across core frontend skills.\nReliable project history.",
            shortlisted: null,
            studentId: "student-1",
            studentName: "Ananya Sharma",
            sapId: "SAP001",
            rollNo: "22BCS001",
            branch: "CSE",
            cgpa: 8.9,
          },
        ]}
        distribution={[{ label: "80–100", count: 1 }]}
        driveId="drive-1"
        viewerRole="faculty"
      />,
    );

    expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
    expect(document.querySelector('[class*="md:hidden"]')).not.toBeNull();
    expect(document.querySelector('[class*="hidden md:block"]')).not.toBeNull();
  });
});