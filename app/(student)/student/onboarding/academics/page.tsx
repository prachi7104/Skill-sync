import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import OnboardingAcademicsClient from "./client";

export default async function OnboardingAcademicsPage() {
    const { profile } = await requireStudentProfile();

    // Must have completed basic step (step 3)
    if (profile.onboardingStep < 3) {
        redirect("/student/onboarding/basic");
    }

    return (
        <OnboardingAcademicsClient 
            initialData={{
                tenthPercentage: profile.tenthPercentage,
                twelfthPercentage: profile.twelfthPercentage,
                cgpa: profile.cgpa,
                semester: profile.semester,
                branch: profile.branch,
                batchYear: profile.batchYear,
            }}
        />
    );
}
