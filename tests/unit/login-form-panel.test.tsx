import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import LoginFormPanel from "@/components/auth/login-form-panel";

function renderPanel(overrides: Partial<ComponentProps<typeof LoginFormPanel>> = {}) {
  const onDismissError = vi.fn();

  render(
    <LoginFormPanel
      errorMessage="Invalid credentials"
      isStudentLoading={false}
      isStaffLoading={false}
      showStaffForm={false}
      staffEmail=""
      staffPassword=""
      showPassword={false}
      onStudentLogin={vi.fn()}
      onShowStaffForm={vi.fn()}
      onHideStaffForm={vi.fn()}
      onStaffEmailChange={vi.fn()}
      onStaffPasswordChange={vi.fn()}
      onTogglePassword={vi.fn()}
      onStaffSubmit={vi.fn()}
      onDismissError={onDismissError}
      {...overrides}
    />
  );

  return { onDismissError };
}

describe("LoginFormPanel", () => {
  it("dismisses error when alert is clicked", () => {
    const { onDismissError } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /dismiss login error/i }));
    expect(onDismissError).toHaveBeenCalledTimes(1);
  });

  it("dismisses error on Escape", () => {
    const { onDismissError } = renderPanel();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDismissError).toHaveBeenCalledTimes(1);
  });
});
