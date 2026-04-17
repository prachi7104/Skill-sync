import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProfileTabNav from "@/components/student/profile/profile-tab-nav";

describe("ProfileTabNav", () => {
  it("renders tabs with accessible semantics and handles tab change", () => {
    const onChange = vi.fn();

    render(<ProfileTabNav active="identity" onChange={onChange} />);

    const tablist = screen.getByRole("tablist", { name: "Profile sections" });
    expect(tablist).toBeInTheDocument();

    const identityTab = screen.getByRole("tab", { name: "Identity" });
    const projectsTab = screen.getByRole("tab", { name: "Projects" });

    expect(identityTab).toHaveAttribute("aria-selected", "true");
    expect(identityTab).toHaveAttribute("aria-controls", "profile-tabpanel-identity");
    expect(projectsTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(screen.getByText("Projects"));
    expect(onChange).toHaveBeenCalledWith("projects");
  });
});
