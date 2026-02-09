import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingProjectsClient from "./client";

export default async function OnboardingProjectsPage() {
    const { profile } = await requireStudentProfile();

    // Must have completed skills step (step 5)
    if (profile.onboardingStep < 5) {
        redirect("/student/onboarding/skills");
    }

    // Pass projects from resume parsing as initial data for autofill
    let initialProjects = profile.projects || [];
    
    // If resume was parsed and no projects in profile yet, extract from parsedResumeJson
    if (profile.parsedResumeJson && initialProjects.length === 0) {
        const parsed = profile.parsedResumeJson as { projects?: string[] };
        if (parsed.projects && Array.isArray(parsed.projects)) {
            // Convert string project descriptions to Project objects
            initialProjects = parsed.projects.slice(0, 5).map((desc, idx) => ({
                title: `Project ${idx + 1}`,
                description: desc.trim(),
                techStack: [],
                url: undefined,
            }));
        }
    }

    return <OnboardingProjectsClient initialProjects={initialProjects} />;
}
