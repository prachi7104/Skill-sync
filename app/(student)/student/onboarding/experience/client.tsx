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
import { useStudent } from "@/app/(student)/providers/student-provider";
import { toast } from "sonner";
import { WorkExperience } from "@/lib/db/schema";

// Use form-compatible type that matches the Zod validation schema (publicationDate, not datePublished)
interface ResearchPaperForm {
    title: string;
    abstract?: string;
    url?: string;
    publicationDate?: string;
}

export default function OnboardingExperienceClient({ initialWork, initialPapers }: { initialWork: WorkExperience[]; initialPapers?: ResearchPaperForm[] }) {
    const router = useRouter();
    const { refresh } = useStudent();

    // Helper to fix potential bad date formats from AI parser (e.g. "Jan 2022" -> "2022-01")
    const normalizeWorkDate = (w: WorkExperience) => {
        const fixDate = (d: string) => {
            if (!d) return "";
            if (/^\d{4}-\d{2}$/.test(d)) return d; // already YYYY-MM
            const parsed = new Date(d);
            return !isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 7) : "";
        };
        return {
            ...w,
            startDate: fixDate(w.startDate),
            endDate: w.endDate ? fixDate(w.endDate) : undefined,
        };
    };

    const [works, setWorks] = useState<WorkExperience[]>(
        (initialWork || []).map(normalizeWorkDate)
    );
    const [isLoading, setIsLoading] = useState(false);

    // Work Experience Form State
    const [role, setRole] = useState("");
    const [company, setCompany] = useState("");
    const [desc, setDesc] = useState("");
    const [start, setStart] = useState("");

    const [isAdding, setIsAdding] = useState(false);

    // Research Papers State
    const [papers, setPapers] = useState<ResearchPaperForm[]>(initialPapers || []);
    const [isAddingPaper, setIsAddingPaper] = useState(false);
    const [paperTitle, setPaperTitle] = useState("");
    const [paperDate, setPaperDate] = useState("");
    const [paperUrl, setPaperUrl] = useState("");
    const [paperAbstract, setPaperAbstract] = useState("");

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

    const handleAddPaper = () => {
        if (!paperTitle.trim()) {
            toast.error("Paper title is required");
            return;
        }

        const newPaper: ResearchPaperForm = {
            title: paperTitle.trim(),
            publicationDate: paperDate,
            url: paperUrl.trim(),
            abstract: paperAbstract.trim(),
        };

        setPapers([...papers, newPaper]);

        // Reset
        setPaperTitle("");
        setPaperDate("");
        setPaperUrl("");
        setPaperAbstract("");
        setIsAddingPaper(false);
    };

    const handleRemovePaper = (index: number) => {
        const updated = [...papers];
        updated.splice(index, 1);
        setPapers(updated);
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            // Save work experience and research papers
            const res = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workExperience: works, researchPapers: papers }),
            });

            if (!res.ok) throw new Error("Failed to save work experience");

            // Update Step (6 → 7: Experience → Coding Profiles)
            await updateOnboardingStep(7);
            await refresh();
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

            {/* Work Experience List */}
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

            {/* Add Work Form */}
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

            {/* ── Research Papers Section (Optional) ──────────────────── */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Research Papers (Optional)</h3>
                        <p className="text-sm text-muted-foreground">
                            Published papers, conference proceedings, or preprints.
                        </p>
                    </div>
                </div>

                {/* Papers List */}
                <div className="space-y-4">
                    {papers.map((paper, index) => (
                        <Card key={index} className="relative group">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemovePaper(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{paper.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {paper.publicationDate && <p>{paper.publicationDate}</p>}
                                {paper.abstract && <p className="mt-1 line-clamp-2">{paper.abstract}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Add Paper Form */}
                {isAddingPaper ? (
                    <Card className="border-dashed">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">New Research Paper</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label>Title *</Label>
                                <Input value={paperTitle} onChange={e => setPaperTitle(e.target.value)} placeholder="Paper title" />
                            </div>
                            <div className="space-y-1">
                                <Label>Publication Date</Label>
                                <Input type="month" value={paperDate} onChange={e => setPaperDate(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>Link / DOI</Label>
                                <Input value={paperUrl} onChange={e => setPaperUrl(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="space-y-1">
                                <Label>Abstract (Optional)</Label>
                                <Textarea value={paperAbstract} onChange={e => setPaperAbstract(e.target.value)} placeholder="Brief abstract..." rows={3} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={handleAddPaper} size="sm">Add Paper</Button>
                                <Button onClick={() => setIsAddingPaper(false)} variant="ghost" size="sm">Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Button onClick={() => setIsAddingPaper(true)} variant="outline" className="w-full border-dashed">
                        <Plus className="mr-2 h-4 w-4" /> Add Paper
                    </Button>
                )}

                {papers.length === 0 && !isAddingPaper && (
                    <p className="text-sm text-muted-foreground italic">No research papers added. This section is optional.</p>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/projects")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground italic hidden md:block">
                        {works.length === 0 && papers.length === 0 ? "Optional - you can skip this." : `${works.length} experience${works.length !== 1 ? "s" : ""}, ${papers.length} paper${papers.length !== 1 ? "s" : ""} added.`}
                    </p>
                    <Button onClick={handleContinue} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {works.length === 0 && papers.length === 0 ? "Skip" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
