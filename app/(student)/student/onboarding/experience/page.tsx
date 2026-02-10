"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { getOnboardingRoute } from "@/lib/onboarding/config";
import OnboardingExperienceClient from "./client";
import { useEffect } from "react";

const EXPECTED_STEP = 6;

export default function OnboardingExperiencePage() {
    const { student, isLoading } = useStudent();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && student) {
            if (student.onboardingStep !== EXPECTED_STEP) {
                router.push(getOnboardingRoute(student.onboardingStep));
            }
        }
    }, [student, isLoading, router]);

    if (isLoading || !student) return null;

    return <OnboardingExperienceClient initialWork={student.workExperience || []} />;
}
