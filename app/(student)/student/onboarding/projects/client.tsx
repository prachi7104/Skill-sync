"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, ArrowRight, Loader2, Trash2, Pencil } from "lucide-react";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { Project } from "@/lib/db/schema";

export default function OnboardingProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
    const router = useRouter();
    const { refresh } = useStudent();

    // Helper to fix potential bad date formats
    const normalizeProject = (p: Project) => {
        const fixDate = (d?: string) => {
            if (!d) return undefined;
            if (/^\d{4}-\d{2}$/.test(d)) return d;
            const parsed = new Date(d);
            return !isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 7) : undefined;
        };
        return {
            ...p,
            startDate: fixDate(p.startDate),
            endDate: fixDate(p.endDate),
        };
    };

    const [projects, setProjects] = useState<Project[]>(
        (initialProjects || []).map(normalizeProject)
    );
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [tech, setTech] = useState("");
    const [link, setLink] = useState("");

    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleAddProject = () => {
        if (!title.trim() || !desc.trim()) {
            toast.error("Title and Description are required");
            return;
        }

        const newProject: Project = {
            title: title.trim(),
            description: desc.trim(),
            techStack: tech.split(",").map(t => t.trim()).filter(Boolean),
            url: link.trim() || undefined,
        };

        if (editingIndex !== null) {
            const updated = [...projects];
            updated[editingIndex] = newProject;
            setProjects(updated);
            toast.success("Project updated");
        } else {
            setProjects([...projects, newProject]);
            toast.success("Project added");
        }

        // Reset form
        resetForm();
    };

    const resetForm = () => {
        setTitle("");
        setDesc("");
        setTech("");
        setLink("");
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleEditProject = (index: number) => {
        const p = projects[index];
        setTitle(p.title);
        setDesc(p.description);
        setTech(p.techStack.join(", "));
        setLink(p.url || "");
        setEditingIndex(index);
        setIsAdding(true);
    };

    const handleRemoveProject = (index: number) => {
        const updated = [...projects];
        updated.splice(index, 1);
        setProjects(updated);
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            // 1. Save Projects (even if empty)
            const res = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projects }),
            });

            if (!res.ok) throw new Error("Failed to save projects");

            // 2. Update Step (5 → 6: Projects → Experience)
            await updateOnboardingStep(6);
            await refresh();
            router.push("/student/onboarding/experience");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingStep(6);
            await refresh();
            router.push("/student/onboarding/experience");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Review Your Projects</h2>
                <p className="text-sm text-muted-foreground">
                    {initialProjects.length > 0
                        ? "We've pre-filled projects from your resume. Edit titles, add details, or add more."
                        : "Add at least 1 project (academic or personal) to verify your hands-on experience."
                    }
                </p>
            </div>

            {initialProjects.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    ✅ {initialProjects.length} project(s) auto-filled from your resume! Click to edit and add more details.
                </div>
            )}

            {/* Project List */}
            <div className="space-y-4">
                {projects.map((project, index) => (
                    <Card key={index} className="relative group">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveProject(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-secondary"
                            onClick={() => handleEditProject(index)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{project.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p className="line-clamp-2">{project.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {project.techStack.map((t, i) => (
                                    <span key={i} className="bg-secondary px-1.5 rounded text-[10px] text-secondary-foreground">{t}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Form */}
            {isAdding ? (
                <Card className="border-dashed">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">New Project</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <Label>Project Title *</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. E-Commerce App" />
                        </div>
                        <div className="space-y-1">
                            <Label>Description *</Label>
                            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does it do? What was your role?" />
                        </div>
                        <div className="space-y-1">
                            <Label>Tech Stack (comma separated)</Label>
                            <Input value={tech} onChange={e => setTech(e.target.value)} placeholder="e.g. React, Node, SQL" />
                        </div>
                        <div className="space-y-1">
                            <Label>Link (Optional)</Label>
                            <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://github.com/..." />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleAddProject} size="sm">
                                {editingIndex !== null ? "Update Project" : "Add Project"}
                            </Button>
                            <Button onClick={resetForm} variant="ghost" size="sm">Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Button onClick={() => { resetForm(); setIsAdding(true); }} variant="outline" className="w-full border-dashed">
                    <Plus className="mr-2 h-4 w-4" /> Add Project
                </Button>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/skills")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground italic hidden md:block">
                        {projects.length === 0 ? "Optional - you can skip this" : `${projects.length} project(s) added`}
                    </p>
                    <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                        Skip
                    </Button>
                    <Button onClick={handleContinue} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {projects.length === 0 ? "Skip" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
