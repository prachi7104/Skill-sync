/**
 * Onboarding step configuration.
 * Maps step numbers to their corresponding routes.
 * 
 * Complete flow with all profile sections:
 * 0: Welcome
 * 1: Resume Upload (AI parse → autofill all subsequent steps)
 * 2: Basic Info (SAP ID*, Roll No*, Phone, LinkedIn) - *required
 * 3: Academics (10th, 12th, CGPA, branch, semester) - optional
 * 4: Skills (prefilled from resume parse) - optional
 * 5: Projects (prefilled from resume parse) - optional
 * 6: Experience/Work (prefilled from resume parse) - optional
 * 7: Coding Profiles (prefilled from resume parse) - optional
 * 8: Soft Skills & Achievements (prefilled from resume parse) - optional
 * 9: Review & Submit
 * 10: Complete (redirects to dashboard)
 */
export const ONBOARDING_STEP_ROUTES: Record<number, string> = {
    0: "/student/onboarding/welcome",
    1: "/student/onboarding/resume",
    2: "/student/onboarding/basic",
    3: "/student/onboarding/academics",
    4: "/student/onboarding/skills",
    5: "/student/onboarding/projects",
    6: "/student/onboarding/experience",
    7: "/student/onboarding/coding-profiles",
    8: "/student/onboarding/soft-skills",
    9: "/student/onboarding/review",
};

/**
 * Total number of onboarding steps (0-9 = 10 steps).
 * Step 10 marks completion.
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
    return ONBOARDING_STEP_ROUTES[step] || "/student/onboarding/welcome";
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
export function isReviewStep(step: number): boolean {
    return step === 9;
}
