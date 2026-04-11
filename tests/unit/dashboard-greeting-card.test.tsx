import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DashboardGreetingCard from "@/components/student/dashboard/dashboard-greeting-card";

describe("DashboardGreetingCard", () => {
  it("exposes profile completion chart with accessible label", () => {
    render(
      <DashboardGreetingCard
        studentName="Aniruddh Sharma"
        profileCompletion={72}
        onboardingRequired={false}
      />
    );

    expect(screen.getByRole("img", { name: "Profile completion: 72%" })).toBeInTheDocument();
  });
});
