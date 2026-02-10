"use client";

import { Button } from "@/components/ui/button";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

export default function OnboardingWelcomeClient() {
    const router = useRouter();
    const { refresh } = useStudent();
    const [isLoading, setIsLoading] = useState(false);

    const onStart = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingStep(1);
            await refresh(); // Sync client cache so resume page sees step=1
            router.push("/student/onboarding/resume");
        } catch (error) {
            console.error("Failed to start onboarding:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Welcome to SkillSync</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Let's set up your profile to help you find the best placement opportunities.
                    This will only take a few minutes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto py-4">
                <div className="p-4 border rounded-lg bg-card text-xs md:text-sm">
                    <span className="font-semibold block mb-1">📋 Complete Profile</span>
                    Add your skills and projects to stand out.
                </div>
                <div className="p-4 border rounded-lg bg-card text-xs md:text-sm">
                    <span className="font-semibold block mb-1">📄 Resume Parsing</span>
                    Upload your resume to auto-fill details.
                </div>
                <div className="p-4 border rounded-lg bg-card text-xs md:text-sm">
                    <span className="font-semibold block mb-1">📈 Visibility</span>
                    Get discovered by top recruiters.
                </div>
                <div className="p-4 border rounded-lg bg-card text-xs md:text-sm">
                    <span className="font-semibold block mb-1">🎯 Smart Match</span>
                    See how well you fit for each drive.
                </div>
            </div>

            <Button size="lg" onClick={onStart} disabled={isLoading} className="mt-4">
                {isLoading ? "Starting..." : "Get Started"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
        </div>
    );
}
