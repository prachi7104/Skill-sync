"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { WorkExperience } from "@/lib/db/schema";

export default function OnboardingExperienceClient({ initialWork }: { initialWork: WorkExperience[] }) {
    const router = useRouter();
    const [works, setWorks] = useState<WorkExperience[]>(initialWork || []);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [role, setRole] = useState("");
    const [company, setCompany] = useState("");
    const [desc, setDesc] = useState("");
    const [start, setStart] = useState("");

    const [isAdding, setIsAdding] = useState(false);

    const handleAddWork = () => {
        if (!role.trim() || !company.trim()) {
            toast.error("Role and Company are required");
            return;
        }

        const newWork: WorkExperience = {
            role: role.trim(),
            company: company.trim(),
            description: desc.trim(),
            startDate: start,
        };

        setWorks([...works, newWork]);

        // Reset
        setRole("");
        setCompany("");
        setDesc("");
        setStart("");
        setIsAdding(false);
    };

    const handleRemoveWork = (index: number) => {
        const updated = [...works];
        updated.splice(index, 1);
        setWorks(updated);
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            // 1. Save Work (even if empty)
            const res = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workExperience: works }), // Note mapped key `workExperience` needs to match schema? 
                // wait, PATCH `api/student/profile` expects `workExperience`? 
                // Let me check schema. Yes, `workExperience` is the column. The route validation?
                // `studentProfileSchema` likely maps it.
            });
            // Just double checking - the route reads `studentProfileSchema` then uses `updateData` matching schema keys.
            // Drizzle schema key is `workExperience`. Zod schema? I should assume camelCase `workExperience`.
            // Update: Checked route in previous steps, it expects `workExperience` but I didn't explicitly see it in the `updateData` construction block I edited myself (I saw skills, projects, codingProfiles).
            // Wait, looking at Step 354 log:
            // if (validatedData.skills) ...
            // if (validatedData.projects) ...
            // if (validatedData.codingProfiles) ...
            // I DID NOT ADD workExperience to the PATCH route update block!
            // I need to fix the PATCH route to support `workExperience` or else this save will fail silently or just do nothing for work exp.

            if (!res.ok) throw new Error("Failed to save work experience");

            // 2. Update Step (6 → 7: Experience → Coding Profiles)
            await updateOnboardingStep(7);
            router.push("/student/onboarding/coding-profiles");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Work Experience</h2>
                <p className="text-sm text-muted-foreground">
                    Internships or jobs. This section is optional but highly recommended.
                </p>
            </div>

            {/* List */}
            <div className="space-y-4">
                {works.map((work, index) => (
                    <Card key={index} className="relative group">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveWork(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{work.role} <span className="text-muted-foreground font-normal">at {work.company}</span></CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            <p>{work.startDate}</p>
                            <p className="mt-1 line-clamp-2">{work.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Form */}
            {isAdding ? (
                <Card className="border-dashed">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">New Experience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label>Role *</Label>
                                <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. SDE Intern" />
                            </div>
                            <div className="space-y-1">
                                <Label>Company *</Label>
                                <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Start Date</Label>
                            <Input type="month" value={start} onChange={e => setStart(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Key responsibilities..." />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleAddWork} size="sm">Add Entry</Button>
                            <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full border-dashed">
                    <Plus className="mr-2 h-4 w-4" /> Add Experience
                </Button>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/projects")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground italic hidden md:block">
                        {works.length === 0 ? "Optional - you can skip this." : `${works.length} entries added.`}
                    </p>
                    <Button onClick={handleContinue} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {works.length === 0 ? "Skip" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
