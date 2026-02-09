import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingReviewClient from "./client";

export default async function OnboardingReviewPage() {
    const { profile } = await requireStudentProfile();

    if (profile.onboardingStep < 8) {
        redirect("/student/onboarding/soft-skills");
    }

    return <OnboardingReviewClient profile={profile} />;
}
