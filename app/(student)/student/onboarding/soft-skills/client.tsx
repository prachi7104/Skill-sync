"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, Heart, Plus, X, Trophy } from "lucide-react";
import { updateOnboardingStep, updateSoftSkillsAndAchievements } from "@/app/actions/onboarding";
import { toast } from "sonner";
import type { Achievement } from "@/lib/db/schema";

const SOFT_SKILL_OPTIONS = [
    "Communication",
    "Leadership",
    "Teamwork",
    "Problem Solving",
    "Time Management",
    "Adaptability",
    "Critical Thinking",
    "Creativity",
    "Work Ethic",
    "Attention to Detail",
    "Conflict Resolution",
    "Emotional Intelligence",
];

export default function OnboardingSoftSkillsClient({ 
    initialSoftSkills,
    initialAchievements,
}: { 
    initialSoftSkills: string[];
    initialAchievements: Achievement[];
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        initialSoftSkills.slice(0, 3)
    );
    const [achievements, setAchievements] = useState<Achievement[]>(
        initialAchievements.length > 0 
            ? initialAchievements 
            : [{ title: "", description: "", date: "", issuer: "" }]
    );

    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        } else if (selectedSkills.length < 3) {
            setSelectedSkills([...selectedSkills, skill]);
        } else {
            toast.error("Select up to 3 soft skills");
        }
    };

    const addAchievement = () => {
        if (achievements.length >= 5) {
            toast.error("Maximum 5 achievements allowed");
            return;
        }
        setAchievements([...achievements, { title: "", description: "", date: "", issuer: "" }]);
    };

    const removeAchievement = (index: number) => {
        if (achievements.length <= 1) return;
        setAchievements(achievements.filter((_, i) => i !== index));
    };

    const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
        const updated = [...achievements];
        updated[index] = { ...updated[index], [field]: value };
        setAchievements(updated);
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            // Filter out empty achievements
            const validAchievements = achievements.filter(a => a.title.trim());

            await updateSoftSkillsAndAchievements({
                softSkills: selectedSkills,
                achievements: validAchievements,
            });

            await updateOnboardingStep(9);
            router.push("/student/onboarding/review");
        } catch (error: any) {
            toast.error(error.message || "Failed to save");
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingStep(9);
            router.push("/student/onboarding/review");
        } catch (error: any) {
            toast.error(error.message || "Failed to proceed");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Soft Skills & Achievements</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Highlight your top 3 soft skills and key achievements that make you stand out.
                </p>
            </div>

            {/* Soft Skills Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Top 3 Soft Skills</Label>
                    <span className="text-xs text-muted-foreground">
                        {selectedSkills.length}/3 selected
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {SOFT_SKILL_OPTIONS.map((skill) => (
                        <Badge
                            key={skill}
                            variant={selectedSkills.includes(skill) ? "default" : "outline"}
                            className="cursor-pointer py-1.5 px-3"
                            onClick={() => toggleSkill(skill)}
                        >
                            {skill}
                            {selectedSkills.includes(skill) && (
                                <X className="ml-1 h-3 w-3" />
                            )}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Achievements */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <Label>Achievements (Optional)</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                    Hackathon wins, competitions, awards, recognitions, etc.
                </p>

                {achievements.map((achievement, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                        {achievements.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => removeAchievement(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}

                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g., 1st Place - HackMIT 2025"
                                value={achievement.title}
                                onChange={(e) => updateAchievement(index, "title", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Issuer / Event</Label>
                                <Input
                                    placeholder="e.g., MIT"
                                    value={achievement.issuer || ""}
                                    onChange={(e) => updateAchievement(index, "issuer", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="month"
                                    value={achievement.date || ""}
                                    onChange={(e) => updateAchievement(index, "date", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Textarea
                                placeholder="Brief description of the achievement..."
                                rows={2}
                                value={achievement.description || ""}
                                onChange={(e) => updateAchievement(index, "description", e.target.value)}
                            />
                        </div>
                    </div>
                ))}

                <Button
                    variant="outline"
                    onClick={addAchievement}
                    className="w-full"
                    disabled={achievements.length >= 5}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Achievement
                </Button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/coding-profiles")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground italic hidden md:block">
                        All fields are optional during onboarding
                    </p>
                    <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                        Skip
                    </Button>
                    <Button onClick={handleContinue} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
