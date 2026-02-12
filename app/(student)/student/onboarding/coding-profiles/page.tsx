"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { getOnboardingRoute } from "@/lib/onboarding/config";
import OnboardingCodingProfilesClient from "./client";
import { useEffect } from "react";

const EXPECTED_STEP = 7;

export default function OnboardingCodingProfilesPage() {
    const { student, isLoading, refresh } = useStudent();
    const router = useRouter();

    // Always re-fetch on mount so we pick up autofilled data from resume parsing
    useEffect(() => {
        refresh();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!isLoading && student) {
            if (student.onboardingStep < EXPECTED_STEP) {
                router.push(getOnboardingRoute(student.onboardingStep));
            }
        }
    }, [student, isLoading, router]);

    if (isLoading || !student) return null;

    return (
        <OnboardingCodingProfilesClient
            initialProfiles={student.codingProfiles || []}
        />
    );
}
