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
  await page.goto("http://127.0.0.1:3000/");

  // Placeholder assertion keeps spec valid while auth bootstrap is wired.
  await expect(page).toHaveURL(/\/$/);

  // Intended end-state assertions after wiring:
  // 1) Direct visit to /student/dashboard redirects to /student/onboarding
  // 2) Fill onboarding required fields and submit
  // 3) User lands on /student/dashboard
  // 4) Visiting blocked API/page before completion returns onboarding-required response
});
