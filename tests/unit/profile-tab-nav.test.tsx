import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProfileTabNav from "@/components/student/profile/profile-tab-nav";

describe("ProfileTabNav", () => {
  it("renders readable labels on mobile and handles tab change", () => {
    const onChange = vi.fn();

    render(<ProfileTabNav active="identity" onChange={onChange} />);

    expect(screen.getByText("Identity")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Projects"));
    expect(onChange).toHaveBeenCalledWith("projects");
  });
});
