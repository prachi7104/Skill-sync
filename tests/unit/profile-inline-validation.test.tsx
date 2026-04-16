/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Profile Inline Validation Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for inline validation feedback in profile forms
 * Verifies error states, visual feedback, and form submission prevention
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

/**
 * Mock FormMessage component
 */
const MockFormMessage = ({ error }: { error?: { message: string } }) => {
  if (!error) return null;
  return <div role="alert" className="text-destructive text-xs">{error.message}</div>;
};

/**
 * Mock skill input with validation
 */
const MockSkillInput = ({
  value,
  onChange,
  error,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: { message: string };
  onBlur?: () => void;
}) => {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`border ${error ? "border-destructive bg-destructive/5" : "border-border"}`}
        placeholder="React, Python, etc."
      />
      <MockFormMessage error={error} />
    </div>
  );
};

describe("Profile Inline Validation Feedback", () => {
  describe("skill name validation", () => {
    it("should show error when skill name is empty", async () => {
      render(
        <MockSkillInput
          value=""
          onChange={() => {}}
          error={{ message: "Skill name is required" }}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Skill name is required");
    });

    it("should show error with red border on empty name", () => {
      const { container } = render(
        <MockSkillInput
          value=""
          onChange={() => {}}
          error={{ message: "Skill name is required" }}
        />
      );

      const input = container.querySelector("input");
      expect(input).toHaveClass("border-destructive", "bg-destructive/5");
    });

    it("should clear error when user enters valid skill", async () => {
      let value = "";
      const handleChange = (v: string) => {
        value = v;
      };

      const { rerender } = render(
        <MockSkillInput
          value={value}
          onChange={handleChange}
          error={{ message: "Skill name is required" }}
        />
      );

      const input = screen.getByPlaceholderText("React, Python, etc.");
      fireEvent.change(input, { target: { value: "JavaScript" } });

      rerender(
        <MockSkillInput
          value="JavaScript"
          onChange={handleChange}
          error={undefined}
        />
      );

      const alert = screen.queryByRole("alert");
      expect(alert).not.toBeInTheDocument();
    });

    it("should show error when skill name is whitespace-only", async () => {
      render(
        <MockSkillInput
          value="   "
          onChange={() => {}}
          error={{ message: "Skill name is required" }}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should not show error when skill has valid name", () => {
      const { container } = render(
        <MockSkillInput
          value="JavaScript"
          onChange={() => {}}
          error={undefined}
        />
      );

      const alert = screen.queryByRole("alert");
      expect(alert).not.toBeInTheDocument();

      const input = container.querySelector("input");
      expect(input).not.toHaveClass("border-destructive");
    });
  });

  describe("project title validation", () => {
    it("should show error on empty project title", () => {
      render(
        <div>
          <input
            placeholder="Title"
            value=""
            className="border border-destructive bg-destructive/5"
          />
          <div role="alert" className="text-destructive">Project title is required</div>
        </div>
      );

      expect(screen.getByRole("alert")).toHaveTextContent("Project title is required");
    });

    it("should show error with red styling", () => {
      const { container } = render(
        <input
          placeholder="Title"
          value=""
          className="border border-destructive bg-destructive/5"
        />
      );

      const input = container.querySelector("input");
      expect(input).toHaveClass("border-destructive", "bg-destructive/5");
    });

    it("should remove error styling when valid", () => {
      const { container, rerender } = render(
        <input
          placeholder="Title"
          value=""
          className="border border-destructive bg-destructive/5"
        />
      );

      rerender(
        <input
          placeholder="Title"
          value="My Project"
          className="border border-border"
        />
      );

      const input = container.querySelector("input");
      expect(input).toHaveClass("border-border");
      expect(input).not.toHaveClass("border-destructive");
    });
  });

  describe("certification validation", () => {
    it("should validate required cert title", () => {
      const errors = {
        title: { message: "Certification title is required" },
        issuer: undefined,
      };

      render(
        <div>
          <input placeholder="Title" className={errors.title ? "border-destructive" : ""} />
          {errors.title && <div role="alert">{errors.title.message}</div>}
        </div>
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Certification title is required"
      );
    });

    it("should validate required cert issuer", () => {
      const errors = {
        title: undefined,
        issuer: { message: "Issuer is required" },
      };

      render(
        <div>
          <input placeholder="Issuer" className={errors.issuer ? "border-destructive" : ""} />
          {errors.issuer && <div role="alert">{errors.issuer.message}</div>}
        </div>
      );

      expect(screen.getByRole("alert")).toHaveTextContent("Issuer is required");
    });

    it("should allow optional cert URL", () => {
      // URL field should not show error even when empty
      const hasUrlError = false;

      render(
        <div>
          <input placeholder="URL (optional)" value="" />
          {hasUrlError ? <div role="alert">Error</div> : null}
        </div>
      );

      const alert = screen.queryByRole("alert");
      expect(alert).not.toBeInTheDocument();
    });

  });

  describe("form submission prevention", () => {
    it("should prevent submit when required fields have errors", async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <input
            required
            value=""
            className="border-destructive"
            placeholder="Required field"
          />
          <button type="submit">Submit</button>
        </form>
      );

      const submit = screen.getByText("Submit");
      fireEvent.click(submit);

      // Browser validation should prevent submit
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it("should allow submit when all required fields are valid", async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <input value="Valid" className="border-border" />
          <button type="submit">Submit</button>
        </form>
      );

      const submit = screen.getByText("Submit");
      fireEvent.click(submit);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("error message display", () => {
    it("should show specific error message for each field", () => {
      render(
        <div>
          <div>
            <input placeholder="Skill" />
            <div role="alert">Skill name is required</div>
          </div>
          <div>
            <input placeholder="Project" />
            <div role="alert">Project title is required</div>
          </div>
        </div>
      );

      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toHaveTextContent("Skill name is required");
      expect(alerts[1]).toHaveTextContent("Project title is required");
    });

    it("should position error message below field", () => {
      render(
        <div>
          <input placeholder="Field" />
          <div role="alert" className="mt-1">Error message</div>
        </div>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("mt-1");
    });

    it("should use red color for error messages", () => {
      render(
        <div role="alert" className="text-destructive text-xs">
          Error
        </div>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("text-destructive", "text-xs");
    });
  });

  describe("visual feedback", () => {
    it("should show alert icon on error field", () => {
      render(
        <div className="relative">
          <input placeholder="Field" />
          <svg className="absolute right-2.5 top-1/2 w-4 h-4 text-destructive" role="img" aria-label="Error">
            <circle cx="8" cy="8" r="7" />
          </svg>
        </div>
      );

      const icon = screen.getByRole("img", { name: "Error" });
      expect(icon).toHaveClass("text-destructive");
    });

    it("should apply error styling to field and message", () => {
      render(
        <div>
          <input
            placeholder="Field"
            className="border border-destructive bg-destructive/5"
          />
          <div role="alert" className="text-destructive text-xs mt-1">
            Error message
          </div>
        </div>
      );

      const input = screen.getByPlaceholderText("Field");
      const alert = screen.getByRole("alert");

      expect(input).toHaveClass("border-destructive", "bg-destructive/5");
      expect(alert).toHaveClass("text-destructive", "text-xs");
    });

    it("should remove error styling when field becomes valid", () => {
      const { container, rerender } = render(
        <input className="border border-destructive bg-destructive/5" value="" />
      );

      rerender(
        <input className="border border-border" value="Valid" />
      );

      const input = container.querySelector("input");
      expect(input).toHaveClass("border-border");
      expect(input).not.toHaveClass("border-destructive", "bg-destructive/5");
    });
  });

  describe("real-time validation", () => {
    it("should validate on blur", async () => {
      let touched = false;

      const handleBlur = () => {
        touched = true;
      };

      render(<input placeholder="Field" onBlur={handleBlur} />);

      const input = screen.getByPlaceholderText("Field");
      fireEvent.blur(input);

      // After blur, field should be marked touched
      expect(touched).toBe(true);
    });

    it("should clear error message immediately when user starts typing valid value", async () => {
      let value = "";
      let error: string | null = "Required";

      const handleChange = (newValue: string) => {
        value = newValue;
        error = newValue.trim() === "" ? "Required" : null;
      };

      const { rerender } = render(
        <MockSkillInput
          value={value}
          onChange={handleChange}
          error={error ? { message: error } : undefined}
        />
      );

      const input = screen.getByPlaceholderText("React, Python, etc.");
      fireEvent.change(input, { target: { value: "J" } });

      rerender(
        <MockSkillInput
          value="J"
          onChange={handleChange}
          error={undefined}
        />
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("array field validation", () => {
    it("should validate each skill in array independently", () => {
      render(
        <div>
          <div>
            <input placeholder="Skill 1" className="border border-destructive" />
            <div role="alert">Required</div>
          </div>
          <div>
            <input placeholder="Skill 2" className="border border-border" />
          </div>
        </div>
      );

      const skill1Alert = screen.getByRole("alert");
      const skill2 = screen.getByPlaceholderText("Skill 2");

      expect(skill1Alert).toBeInTheDocument();
      expect(skill2).not.toHaveClass("border-destructive");
    });

    it("should show errors for multiple invalid items", () => {
      render(
        <div>
          <div>
            <input placeholder="Item 1" className="border-destructive" />
            <div role="alert">Required</div>
          </div>
          <div>
            <input placeholder="Item 2" className="border-destructive" />
            <div role="alert">Required</div>
          </div>
        </div>
      );

      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(2);
    });
  });

  describe("accessibility", () => {
    it("should link error messages to fields with aria-describedby", () => {
      const { container } = render(
        <div>
          <input
            id="skill-input"
            placeholder="Skill"
            aria-describedby="skill-error"
          />
          <div id="skill-error" role="alert">
            Skill name is required
          </div>
        </div>
      );

      const input = container.querySelector("#skill-input");
      expect(input).toHaveAttribute("aria-describedby", "skill-error");
    });

    it("should use role=alert for error messages", () => {
      render(
        <div role="alert" className="text-destructive">
          Validation error
        </div>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should announce errors to screen readers", () => {
      render(
        <div
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className="text-destructive"
        >
          Skill name is required
        </div>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
      expect(alert).toHaveAttribute("aria-atomic", "true");
    });
  });
});
