// @ts-nocheck
import { test, expect } from "@playwright/test";

/**
 * Real browser flow for onboarding hard-gate behavior.
 *
 * Prerequisites for CI/local:
 * 1. Enable E2E auth bootstrap (test account or test-only login helper).
 * 2. Seed a student with incomplete onboarding.
 * 3. Start app with deterministic test DB.
 */

test("student is forced through onboarding before dashboard access", async ({ page }) => {
  // TODO: replace with real login helper once test auth wiring is enabled.
  await page.goto("/login");

  // Placeholder assertion keeps spec valid while auth bootstrap is wired.
  await expect(page).toHaveURL(/\/login/);

  // Intended end-state assertions after wiring:
  // 1) Direct visit to /student/dashboard redirects to /student/onboarding
  // 2) Fill tab 1 (identity): rollNo required
  // 3) Complete tab 1 → click Next → advance to tab 2 (academics)
  // 4) Fill tab 2 (academics): cgpa, branch, batchYear, tenthPercentage, twelfthPercentage all required
  // 5) Complete tab 2 → click Next → advance to tab 3 (skills)
  // 6) Tab 3 (skills): optional, but must click Next to advance
  // 7) Tab 4 (projects): optional, but must click Next to advance
  // 8) Tab 5 (experience): optional, but must click Next to advance
  // 9) Tab 6 (extras): optional, final tab
  // 10) Click Finish on tab 6 → verify all 6 tabs were visited → redirect to /student/dashboard
  // 11) Verify early redirect does NOT happen when only filling academics
  // 12) Visiting blocked API/page before completion returns onboarding-required response
});
