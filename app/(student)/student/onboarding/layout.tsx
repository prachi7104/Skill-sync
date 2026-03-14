"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
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
        return (
            <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Calculate progress percentage based on current step
    const currentStep = student.onboardingStep;
    const progress = Math.min(100, (currentStep / TOTAL_ONBOARDING_STEPS) * 100);

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-200 p-6 md:p-12 relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] left-[20%] w-[50%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="max-w-3xl mx-auto space-y-8 relative z-10">

                {/* Header / Progress */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-slate-500 tracking-tight uppercase">Onboarding</span>
                        <span className="text-sm font-bold text-white tracking-tight">
                            Step {currentStep + 1} of {TOTAL_ONBOARDING_STEPS}
                        </span>
                    </div>
                    
                    {/* Dark Mode Glowing Progress Bar */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-[#0B1221] rounded-3xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Subtle inner card glow */}
                    <div className="absolute top-[-20%] right-[-10%] w-[30%] h-[40%] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>

            </div>
        </div>
    );
}