"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { getOnboardingRoute } from "@/lib/onboarding/config";
import OnboardingAcademicsClient from "./client";
import { useEffect } from "react";

const EXPECTED_STEP = 3;

export default function OnboardingAcademicsPage() {
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

    return (
        <OnboardingAcademicsClient
            initialData={{
                tenthPercentage: student.tenthPercentage,
                twelfthPercentage: student.twelfthPercentage,
                cgpa: student.cgpa,
                semester: student.semester,
                branch: student.branch,
                batchYear: student.batchYear,
            }}
        />
    );
}
