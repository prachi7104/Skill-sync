import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingCodingProfilesClient from "./client";

export default async function OnboardingCodingProfilesPage() {
    const { profile } = await requireStudentProfile();

    // Must have completed projects step (step 6)
    if (profile.onboardingStep < 6) {
        redirect("/student/onboarding/projects");
    }

    return (
        <OnboardingCodingProfilesClient 
            initialProfiles={profile.codingProfiles || []}
        />
    );
}
