"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Code2, Plus, X } from "lucide-react";
import { updateOnboardingStep, updateCodingProfiles } from "@/app/actions/onboarding";
import { toast } from "sonner";
import type { CodingProfile } from "@/lib/db/schema";

const PLATFORMS = [
    { id: "leetcode", name: "LeetCode", urlPrefix: "https://leetcode.com/u/" },
    { id: "codeforces", name: "Codeforces", urlPrefix: "https://codeforces.com/profile/" },
    { id: "codechef", name: "CodeChef", urlPrefix: "https://www.codechef.com/users/" },
    { id: "hackerrank", name: "HackerRank", urlPrefix: "https://www.hackerrank.com/profile/" },
    { id: "github", name: "GitHub", urlPrefix: "https://github.com/" },
    { id: "hackerearth", name: "HackerEarth", urlPrefix: "https://www.hackerearth.com/@" },
];

export default function OnboardingCodingProfilesClient({
    initialProfiles
}: {
    initialProfiles: CodingProfile[]
}) {
    const router = useRouter();
    const { refresh } = useStudent();
    const [isLoading, setIsLoading] = useState(false);
    const [profiles, setProfiles] = useState<CodingProfile[]>(
        initialProfiles.length > 0
            ? initialProfiles
            : [{ platform: "", username: "", url: "" }]
    );

    const addProfile = () => {
        if (profiles.length >= 6) {
            toast.error("Maximum 6 profiles allowed");
            return;
        }
        setProfiles([...profiles, { platform: "", username: "", url: "" }]);
    };

    const removeProfile = (index: number) => {
        if (profiles.length <= 1) return;
        setProfiles(profiles.filter((_, i) => i !== index));
    };

    const updateProfile = (index: number, field: keyof CodingProfile, value: string | number) => {
        const updated = [...profiles];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-generate URL when platform and username are set
        if (field === "platform" || field === "username") {
            const platform = PLATFORMS.find(p => p.id === (field === "platform" ? value : updated[index].platform));
            const username = field === "username" ? value : updated[index].username;
            if (platform && username) {
                updated[index].url = `${platform.urlPrefix}${username}`;
            }
        }

        setProfiles(updated);
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            // Filter out empty profiles
            const validProfiles = profiles.filter(
                p => p.platform && p.username && p.url
            );

            await updateCodingProfiles(validProfiles);
            await updateOnboardingStep(8);
            await refresh();
            router.push("/student/onboarding/soft-skills");
        } catch (error: any) {
            toast.error(error.message || "Failed to save coding profiles");
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingStep(8);
            await refresh();
            router.push("/student/onboarding/soft-skills");
        } catch (error: any) {
            toast.error(error.message || "Failed to proceed");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Coder Identity</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Link your competitive programming and coding profiles to showcase your problem-solving skills.
                </p>
            </div>

            <div className="space-y-4">
                {profiles.map((profile, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                        {profiles.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => removeProfile(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Platform</Label>
                                <Select
                                    value={profile.platform}
                                    onValueChange={(value) => updateProfile(index, "platform", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PLATFORMS.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    placeholder="your_username"
                                    value={profile.username}
                                    onChange={(e) => updateProfile(index, "username", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Rating (optional)</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 1800"
                                    value={profile.rating || ""}
                                    onChange={(e) => updateProfile(index, "rating", parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Problems Solved (optional)</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 250"
                                    value={profile.problemsSolved || ""}
                                    onChange={(e) => updateProfile(index, "problemsSolved", parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        {profile.url && (
                            <div className="text-xs text-muted-foreground">
                                Profile URL: <a href={profile.url} target="_blank" className="text-primary hover:underline">{profile.url}</a>
                            </div>
                        )}
                    </div>
                ))}

                <Button
                    variant="outline"
                    onClick={addProfile}
                    className="w-full"
                    disabled={profiles.length >= 6}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Another Profile
                </Button>
            </div>

            <div className="flex justify-between pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/experience")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                        Skip for now
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
