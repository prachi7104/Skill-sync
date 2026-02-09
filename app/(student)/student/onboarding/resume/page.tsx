import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingResumeClient from "./client";

export default async function OnboardingResumePage() {
    const { profile } = await requireStudentProfile();

    // Must have completed welcome step (step 1)
    if (profile.onboardingStep < 1) {
        redirect("/student/onboarding/welcome");
    }

    return <OnboardingResumeClient />;
}
