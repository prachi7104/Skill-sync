/**
 * Onboarding is rendered on a single tabbed page for steps 0-9.
 * Step 10 indicates completion and routes to dashboard.
 */
export const ONBOARDING_STEP_ROUTES: Record<number, string> = {
    0: "/student/onboarding",
    1: "/student/onboarding",
    2: "/student/onboarding",
    3: "/student/onboarding",
    4: "/student/onboarding",
    5: "/student/onboarding",
    6: "/student/onboarding",
    7: "/student/onboarding",
    8: "/student/onboarding",
    9: "/student/onboarding",
};

/**
 * Step index used by server actions when onboarding is complete.
 */
export const TOTAL_ONBOARDING_STEPS = 10;

/**
 * Get the route for a given onboarding step.
 * Returns the dashboard URL for step 10+.
 */
export function getOnboardingRoute(step: number): string {
    if (step >= TOTAL_ONBOARDING_STEPS) {
        return "/student/dashboard";
    }
    return ONBOARDING_STEP_ROUTES[step] || "/student/onboarding";
}

/**
 * Get the next step number.
 */
export function getNextStep(currentStep: number): number {
    return Math.min(currentStep + 1, TOTAL_ONBOARDING_STEPS);
}

/**
 * Check if a step is the final review step.
 */
export function isReviewStep(_step: number): boolean {
    return _step === 9;
}
