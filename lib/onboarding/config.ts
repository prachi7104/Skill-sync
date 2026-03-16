/**
 * Onboarding routing has been simplified to a single tabbed page.
 * Legacy step constants remain only for backward compatibility.
 */
export const ONBOARDING_STEP_ROUTES: Record<number, string> = {
    0: "/student/onboarding/welcome",
    1: "/student/onboarding",
};

/**
 * Legacy constant retained for compatibility with older code.
 */
export const TOTAL_ONBOARDING_STEPS = 1;

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
    return false;
}
