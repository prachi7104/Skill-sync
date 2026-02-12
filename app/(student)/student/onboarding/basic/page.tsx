"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { getOnboardingRoute } from "@/lib/onboarding/config";
import OnboardingBasicClient from "./client";
import { useEffect } from "react";

const EXPECTED_STEP = 2;

export default function OnboardingBasic() {
    const { user, student, isLoading, refresh } = useStudent();
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

    if (isLoading || !student || !user) return null;

    return (
        <OnboardingBasicClient
            userName={user.name}
            userEmail={user.email}
            initialRollNo={student.rollNo || ""}
            initialSapId={student.sapId || ""}
            initialPhone={student.phone || ""}
            initialLinkedin={student.linkedin || ""}
        />
    );
}
