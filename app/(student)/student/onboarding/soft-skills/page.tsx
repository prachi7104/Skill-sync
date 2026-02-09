import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingSoftSkillsClient from "./client";

export default async function OnboardingSoftSkillsPage() {
    const { profile } = await requireStudentProfile();

    // Must have completed coding profiles step (step 7)
    if (profile.onboardingStep < 7) {
        redirect("/student/onboarding/coding-profiles");
    }

    return (
        <OnboardingSoftSkillsClient 
            initialSoftSkills={profile.softSkills || []}
            initialAchievements={profile.achievements || []}
        />
    );
}
