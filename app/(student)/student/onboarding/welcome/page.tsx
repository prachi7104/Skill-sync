"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { getOnboardingRoute } from "@/lib/onboarding/config";
import OnboardingWelcomeClient from "./client";
import { useEffect } from "react";

const EXPECTED_STEP = 0;

export default function OnboardingWelcomePage() {
    const { student, isLoading } = useStudent();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && student) {
            // If they've already passed the welcome step, send them to their current step
            if (student.onboardingStep > EXPECTED_STEP) {
                router.push(getOnboardingRoute(student.onboardingStep));
            }
        }
    }, [student, isLoading, router]);

    if (isLoading || !student) return null;

    return <OnboardingWelcomeClient />;
}
