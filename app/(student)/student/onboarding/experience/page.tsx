import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingExperienceClient from "./client";

export default async function OnboardingExperiencePage() {
    const { profile } = await requireStudentProfile();

    if (profile.onboardingStep < 4) {
        redirect("/student/onboarding/projects");
    }

    return <OnboardingExperienceClient initialWork={profile.workExperience || []} />;
}
