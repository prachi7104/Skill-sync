import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile } = await requireStudentProfile();

    // If already fully onboarded (step 9), go to dashboard
    if (profile.onboardingStep >= 9) {
        redirect("/student/dashboard");
    }

    // Calculate progress percentage based on current step
    // 9 steps total (steps 1-9), completing at step 9
    const currentStep = profile.onboardingStep;
    const totalSteps = 9;
    const progress = Math.min(100, (currentStep / totalSteps) * 100);

    return (
        <div className="min-h-screen bg-muted/10 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header / Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>Onboarding</span>
                        <span>Step {currentStep} of {totalSteps}</span>
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
