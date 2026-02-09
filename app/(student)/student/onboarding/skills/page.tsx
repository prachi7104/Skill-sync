import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingSkillsClient from "./client";

export default async function OnboardingSkillsPage() {
    const { profile } = await requireStudentProfile();

    // Must have completed academics step (step 4)
    if (profile.onboardingStep < 4) {
        redirect("/student/onboarding/academics");
    }

    // Pass skills from resume parsing as initial data for autofill
    const initialSkills = profile.skills || [];
    
    // If resume was parsed, also extract skills from parsedResumeJson
    if (profile.parsedResumeJson && initialSkills.length === 0) {
        const parsed = profile.parsedResumeJson as { skills?: string[] };
        if (parsed.skills && Array.isArray(parsed.skills)) {
            // Convert string skills to Skill objects with default proficiency
            const resumeSkills = parsed.skills.slice(0, 20).map(name => ({
                name: name.trim(),
                proficiency: 3 as const, // Default to mid-level
            }));
            return <OnboardingSkillsClient initialSkills={resumeSkills} />;
        }
    }

    return <OnboardingSkillsClient initialSkills={initialSkills} />;
}
