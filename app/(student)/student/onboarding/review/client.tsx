"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2 } from "lucide-react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { computeCompleteness } from "@/lib/profile/completeness";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OnboardingReviewClient({ profile }: { profile: any }) {
    const router = useRouter();
    const [isFinishing, setIsFinishing] = useState(false);

    // Calculate Score
    const { score, missing } = computeCompleteness(profile);

    const handleFinish = async () => {
        setIsFinishing(true);
        try {
            // This saves the final profile state, generates embeddings, and marks onboarding complete
            await completeOnboarding();

            // Force a hard redirect to clear onboarding state from router/middleware
            window.location.href = "/student/dashboard";
        } catch {
            toast.error("Failed to finish onboarding");
            setIsFinishing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold">You&apos;re All Set! 🎉</h2>
                <p className="text-muted-foreground">
                    Your profile has been built from your resume and your inputs. Review the summary below and save your profile.
                </p>
            </div>

            {/* Profile Completeness Card */}
            <Card className="border-primary/20 bg-primary/5 max-w-lg mx-auto">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-lg text-primary">
                        <Sparkles className="h-5 w-5" /> Profile Completeness
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>{score}% Completed</span>
                        </div>
                        <Progress value={score} className="h-3" />
                    </div>
                    {missing.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">You can improve your score later by adding:</p>
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                                {missing.slice(0, 4).map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                                {missing.length > 4 && <li>+ {missing.length - 4} more...</li>}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-green-600 flex items-center gap-2">
                            <Check className="h-4 w-4" /> Your profile is complete. Great job!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* What happens next */}
            <div className="text-center text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
                <p>Clicking <strong>Save Profile</strong> will:</p>
                <ul className="text-xs space-y-1 list-disc text-left pl-6">
                    <li>Save your resume link and all profile data to your account</li>
                    <li>Generate an AI embedding of your profile for smart matching</li>
                    <li>Take you to your student dashboard</li>
                </ul>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/soft-skills")} disabled={isFinishing}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button size="lg" onClick={handleFinish} disabled={isFinishing} className="px-8">
                    {isFinishing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Profile...
                        </>
                    ) : (
                        <>
                            Save Profile <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
