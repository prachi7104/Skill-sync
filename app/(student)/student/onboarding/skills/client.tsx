"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { Skill } from "@/lib/db/schema";


// This duplicates some logic from ProfileView to ensure isolation and independence for the onboarding flow
export default function OnboardingSkillsClient({ initialSkills }: { initialSkills: Skill[] }) {
    const router = useRouter();
    const { refresh } = useStudent();
    const [skills, setSkills] = useState<Skill[]>(initialSkills || []);
    const [newSkill, setNewSkill] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        if (skills.some(s => s.name.toLowerCase() === newSkill.toLowerCase())) {
            toast.error("Skill already exists");
            return;
        }

        const skill: Skill = {
            name: newSkill.trim(),
            proficiency: 1, // Defaulting to 1 as level is removed from UI
        };
        setSkills([...skills, skill]);
        setNewSkill("");
    };

    const handleRemoveSkill = (index: number) => {
        const updated = [...skills];
        updated.splice(index, 1);
        setSkills(updated);
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            // 1. Save Skills to Profile (even if empty)
            const res = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skills }),
            });

            if (!res.ok) throw new Error("Failed to save skills");

            // 2. Update Step
            await updateOnboardingStep(5);
            await refresh();
            router.push("/student/onboarding/projects");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingStep(5);
            await refresh();
            router.push("/student/onboarding/projects");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Review Your Skills</h2>
                <p className="text-sm text-muted-foreground">
                    {initialSkills.length > 0
                        ? "We've pre-filled skills from your resume. Review or add more."
                        : "Add at least 5 skills to proceed. This helps us match you with relevant drives."
                    }
                </p>
            </div>

            {initialSkills.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    ✅ {initialSkills.length} skills auto-filled from your resume!
                </div>
            )}

            {/* Add Skill Form */}
            <div className="flex gap-2 items-end p-4 border rounded-md bg-muted/20">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor="skill-name">Skill Name</Label>
                    <Input
                        id="skill-name"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="e.g. React, Python"
                    />
                </div>
                <Button onClick={handleAddSkill} size="icon" variant="secondary">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Skills List */}
            <div className="min-h-[100px] border rounded-md p-4 bg-background">
                {skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No skills added yet.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-2">
                                <span>{skill.name}</span>
                                <button
                                    onClick={() => handleRemoveSkill(index)}
                                    className="hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/academics")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground italic hidden md:block">
                        {skills.length === 0 ? "Optional - you can skip this" : `${skills.length} skill(s) added`}
                    </p>
                    <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                        Skip
                    </Button>
                    <Button onClick={handleContinue} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {skills.length === 0 ? "Skip" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
