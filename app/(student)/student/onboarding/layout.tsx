"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { TOTAL_ONBOARDING_STEPS } from "@/lib/onboarding/config";
import { useEffect } from "react";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { student, isLoading } = useStudent();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && student) {
            // If already fully onboarded (step 10), go to dashboard
            if (student.onboardingStep >= TOTAL_ONBOARDING_STEPS) {
                router.push("/student/dashboard");
            }
        }
    }, [student, isLoading, router]);

    if (isLoading || !student) {
        return null; // Or a loading spinner
    }

    // Calculate progress percentage based on current step
    // 10 steps total (steps 0-9), completing at step 10
    const currentStep = student.onboardingStep;
    const progress = Math.min(100, (currentStep / TOTAL_ONBOARDING_STEPS) * 100);

    return (
        <div className="min-h-screen bg-muted/10 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header / Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>Onboarding</span>
                        <span>Step {currentStep + 1} of {TOTAL_ONBOARDING_STEPS}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="bg-background rounded-lg border p-6 shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}
