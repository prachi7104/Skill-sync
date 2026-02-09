"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, Check, RefreshCw } from "lucide-react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { computeCompleteness } from "@/lib/profile/completeness";

export default function OnboardingReviewClient({ profile }: { profile: any }) {
    const router = useRouter();
    const [isFinishing, setIsFinishing] = useState(false);
    const [isMerging, setIsMerging] = useState(false);

    // Calculate Score
    const { score, missing } = computeCompleteness(profile);

    // Merge Logic (Simplified Reuse)
    const handleMerge = async (sections: { skills: boolean, projects: boolean, workExperience: boolean }) => {
        setIsMerging(true);
        try {
            const res = await fetch('/api/student/profile/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sections })
            });
            if (res.ok) {
                toast.success("Merged successfully!");
                router.refresh(); // Refresh to show score update
            } else {
                toast.error("Merge failed");
            }
        } catch (e) {
            toast.error("Error merging");
        } finally {
            setIsMerging(false);
        }
    };

    const handleFinish = async () => {
        setIsFinishing(true);
        try {
            await completeOnboarding(); // Transitions 8→9, computes completeness, queues embedding
            router.push("/student/dashboard");
        } catch (error) {
            toast.error("Failed to finish");
            setIsFinishing(false);
        }
    };

    const parsed = profile.parsedResumeJson as any;
    const hasSuggestions = parsed && (parsed.skills?.length || parsed.projects?.length || parsed.workExperience?.length);

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold">You're Almost Done!</h2>
                <p className="text-muted-foreground">
                    Review your profile completeness and apply final suggestions.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Score Card */}
                <Card className="border-primary/20 bg-primary/5">
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
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4 pt-2">
                                {missing.slice(0, 3).map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                                {missing.length > 3 && <li>+ {missing.length - 3} more...</li>}
                            </ul>
                        ) : (
                            <p className="text-sm text-green-600 flex items-center gap-2">
                                <Check className="h-4 w-4" /> Great job!
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Merge Card */}
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="font-semibold text-lg">Resume Suggestions</div>
                        {hasSuggestions ? (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    We found items in your resume that are missing from your profile.
                                </p>
                                <div className="flex flex-col gap-2">
                                    {parsed.skills?.length > 0 && (
                                        <div className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                                            <span>Skills ({parsed.skills.length})</span>
                                            <Button size="sm" variant="outline" onClick={() => handleMerge({ skills: true, projects: false, workExperience: false })} disabled={isMerging}>
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                    {parsed.projects?.length > 0 && (
                                        <div className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                                            <span>Projects ({parsed.projects.length})</span>
                                            <Button size="sm" variant="outline" onClick={() => handleMerge({ skills: false, projects: true, workExperience: false })} disabled={isMerging}>
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                    {parsed.workExperience?.length > 0 && (
                                        <div className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                                            <span>Experience ({parsed.workExperience.length})</span>
                                            <Button size="sm" variant="outline" onClick={() => handleMerge({ skills: false, projects: false, workExperience: true })} disabled={isMerging}>
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground py-4 text-center">
                                {profile.resumeUrl ? "Parsing... please wait or click refresh." : "No resume uploaded."}
                                {profile.resumeUrl && (
                                    <Button variant="ghost" size="sm" onClick={() => router.refresh()} className="mt-2 text-xs">
                                        <RefreshCw className="mr-2 h-3 w-3" /> Refresh
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleFinish} disabled={isFinishing} className="w-full md:w-auto px-8">
                    {isFinishing ? "Finalizing..." : "Finish Onboarding"}
                    {!isFinishing && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
