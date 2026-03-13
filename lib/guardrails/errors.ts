/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Structured Guardrail Error
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Every hard failure in Phase 5.5 returns:
 *   - code:     Machine-readable error identifier
 *   - reason:   Human-readable explanation
 *   - nextStep: Actionable guidance for the user
 *   - status:   HTTP status code (for API responses)
 *
 * No generic 500s for expected states.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export interface GuardrailError {
  code: string;
  reason: string;
  nextStep: string;
  status: number;
}

export class GuardrailViolation extends Error {
  public readonly code: string;
  public readonly reason: string;
  public readonly nextStep: string;
  public readonly status: number;

  constructor(err: GuardrailError) {
    super(err.reason);
    this.name = "GuardrailViolation";
    this.code = err.code;
    this.reason = err.reason;
    this.nextStep = err.nextStep;
    this.status = err.status;
  }

  /** Serialize to a JSON-safe shape for API responses. */
  toJSON(): GuardrailError {
    return {
      code: this.code,
      reason: this.reason,
      nextStep: this.nextStep,
      status: this.status,
    };
  }
}

// ── Pre-defined error factories ─────────────────────────────────────────────

export const ERRORS = {
  SANDBOX_DAILY_LIMIT: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "SANDBOX_DAILY_LIMIT",
      reason: "Daily sandbox limit exceeded (5/day).",
      nextStep: "Try again tomorrow. Limits reset at midnight UTC.",
      status: 429,
    }),

  SANDBOX_MONTHLY_LIMIT: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "SANDBOX_MONTHLY_LIMIT",
      reason: "Monthly sandbox limit exceeded (30/month).",
      nextStep: "Limit resets at the start of next month.",
      status: 429,
    }),

  PROFILE_INCOMPLETE: (score: number, missing: string[]): GuardrailViolation =>
    new GuardrailViolation({
      code: "PROFILE_INCOMPLETE",
      reason: `Profile completeness is ${score}%. Minimum required: 70%.`,
      nextStep:
        missing.length > 0
          ? `Action needed: ${missing.slice(0, 3).join("; ")}.`
          : "Complete your profile to proceed.",
      status: 403,
    }),

  RESUME_MISSING: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "RESUME_MISSING",
      reason: "No resume uploaded.",
      nextStep: "Upload a resume from your profile page before proceeding.",
      status: 403,
    }),

  EMBEDDING_MISSING: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "EMBEDDING_MISSING",
      reason: "Profile embedding has not been generated yet.",
      nextStep:
        "Ensure your profile is at least 50% complete and a resume is uploaded. Embedding generation may take a few minutes.",
      status: 403,
    }),

  SKILLS_EMPTY: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "SKILLS_EMPTY",
      reason: "No skills listed in your profile.",
      nextStep: "Add at least one skill to your profile to proceed.",
      status: 403,
    }),

  RANKINGS_NOT_GENERATED: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "RANKINGS_NOT_GENERATED",
      reason: "Rankings have not been generated for this drive yet.",
      nextStep: "Ask the drive creator to run ranking computation first.",
      status: 404,
    }),

  RANKING_REGEN_BLOCKED: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "RANKING_REGEN_BLOCKED",
      reason: "Rankings already exist for this drive. Only admins can regenerate.",
      nextStep: "Contact an admin if re-ranking is required.",
      status: 403,
    }),

  DRIVE_NOT_FOUND: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "DRIVE_NOT_FOUND",
      reason: "The specified drive does not exist.",
      nextStep: "Verify the drive ID and try again.",
      status: 404,
    }),

  DRIVE_INVALID_ID: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "DRIVE_INVALID_ID",
      reason: "Invalid drive ID format.",
      nextStep: "Provide a valid UUID for the drive.",
      status: 400,
    }),

  STUDENT_NOT_FOUND: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "STUDENT_NOT_FOUND",
      reason: "Student record not found.",
      nextStep: "Ensure the student has completed onboarding and a profile exists.",
      status: 404,
    }),

  DETAILED_DAILY_LIMIT: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "DETAILED_DAILY_LIMIT",
      reason: "Daily detailed analysis limit exceeded (3/day).",
      nextStep: "Try again tomorrow. Limits reset at midnight UTC.",
      status: 429,
    }),

  DETAILED_MONTHLY_LIMIT: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "DETAILED_MONTHLY_LIMIT",
      reason: "Monthly detailed analysis limit exceeded (15/month).",
      nextStep: "Limit resets at the start of next month.",
      status: 429,
    }),
} as const;
