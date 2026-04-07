"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Mail, User,
    Loader2, Plus, Trash2, X, FileText, Upload,
    ExternalLink,
} from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/validations/student-profile";
import { computeCompleteness } from "@/lib/profile/completeness";
import { extractTextFromResume, cleanResumeText } from "@/lib/resume/text-extractor";
import { toResumeDownloadUrl } from "@/lib/resume/download-url";
import { cn } from "@/lib/utils";

interface StudentUser { name: string; email: string; }
interface ProfileViewProps { user: StudentUser; profile: any; }

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 300000;
function sleep(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }

export default function ProfileView({ user, profile }: ProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isPollingParse, setIsPollingParse] = useState(false);
    const [parseChoiceDialogOpen, setParseChoiceDialogOpen] = useState(false);
    const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
    const [isApplyingMerge, setIsApplyingMerge] = useState(false);
    const [softSkillInput, setSoftSkillInput] = useState("");
    const router = useRouter();

    const { score } = computeCompleteness({ ...profile, name: user.name, email: user.email });
    const initials = user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "ST";
    const currentYear = new Date().getFullYear();
    const batchYears = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);
    const resumeDownloadUrl = profile.resumeUrl ? toResumeDownloadUrl(profile.resumeUrl) : null;
    const resumeDownloadLabel = (profile.resumeMime || "").toLowerCase().includes("pdf") ? "Download PDF" : "Download Resume";

    const form = useForm<StudentProfileInput>({
        resolver: zodResolver(studentProfileSchema),
        defaultValues: {
            rollNo: profile.rollNo || "", sapId: profile.sapId || "", branch: profile.branch || "",
            batchYear: profile.batchYear || undefined, cgpa: profile.cgpa || undefined, semester: profile.semester || undefined,
            tenthPercentage: profile.tenthPercentage || undefined, twelfthPercentage: profile.twelfthPercentage || undefined,
            skills: profile.skills || [], projects: profile.projects || [], codingProfiles: profile.codingProfiles || [],
            workExperience: profile.workExperience || [], certifications: profile.certifications || [],
            researchPapers: profile.researchPapers || [], achievements: profile.achievements || [], softSkills: profile.softSkills || [],
        },
    });

    const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: form.control, name: "skills" });
    const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control: form.control, name: "projects" });
    const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control: form.control, name: "workExperience" });
    const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control: form.control, name: "certifications" });
    const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({ control: form.control, name: "codingProfiles" });
    useFieldArray({ control: form.control, name: "researchPapers" });
    useFieldArray({ control: form.control, name: "achievements" });

    const handleCancel = () => { form.reset(); setIsEditing(false); };
    const onSubmit = async (data: StudentProfileInput) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/student/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload?.error || payload?.message || "Database sync failed.");
            toast.success("Profile updated seamlessly.");
            setIsEditing(false);
            router.refresh();
        } catch (error) { toast.error(error instanceof Error ? error.message : "Database sync failed."); }
        finally { setIsLoading(false); }
    };

    const waitForParseJob = async (jobId: string): Promise<"completed" | "failed" | "timeout"> => {
        const deadline = Date.now() + POLL_TIMEOUT_MS;
        while (Date.now() < deadline) {
            const response = await fetch(`/api/jobs/${jobId}`).catch(() => null);
            if (response?.ok) {
                const data = await response.json().catch(() => null);
                const status = data?.status as string | undefined;
                if (status === "completed") return "completed";
                if (status === "failed") return "failed";
            }
            await sleep(POLL_INTERVAL_MS);
        }
        return "timeout";
    };

    const applyResumeSync = async () => {
        setIsApplyingMerge(true);
        try {
            const response = await fetch("/api/student/profile/merge", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "replace",
                    sections: { skills: true, projects: true, workExperience: true, certifications: true, codingProfiles: true, researchPapers: true, achievements: true, softSkills: true, contact: true, academics: false },
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload?.message || "Failed to sync profile from resume");
            toast.success("Profile data populated from resume parsing.");
            router.refresh();
        } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to sync profile from resume"); }
        finally { setIsApplyingMerge(false); }
    };

    const uploadResumeFile = async (file: File, shouldParseProfile: boolean) => {
        setIsUploading(true); setIsPollingParse(false); setParseChoiceDialogOpen(false); setPendingResumeFile(null);
        try {
            const formData = new FormData();
            formData.append("file", file); formData.append("source", "profile_update"); formData.append("parseProfile", shouldParseProfile ? "true" : "false");
            try {
                const extracted = await extractTextFromResume(file);
                const cleaned = cleanResumeText(extracted);
                if (cleaned.length >= 50) formData.append("resumeText", cleaned);
            } catch { /* Ignored */ }
            const response = await fetch("/api/student/resume", { method: "POST", body: formData });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload?.error || payload?.message || "Upload failed");
            router.refresh();
            if (!shouldParseProfile) { toast.success("New master resume saved."); return; }
            toast.success("Resume uploaded. Parsing and updating your profile...");
            const jobId = typeof payload?.data?.jobId === "string" ? payload.data.jobId : null;
            if (!jobId) throw new Error("Parsing could not be started. Please try again.");
            setIsPollingParse(true);
            const status = await waitForParseJob(jobId);
            if (status === "completed") { await applyResumeSync(); return; }
            if (status === "failed") { toast.error("Resume parsing failed. You can still keep the uploaded file."); return; }
            toast.error("Parsing takes longer than expected. Continue your work, we will update shortly.");
        } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed."); }
        finally { setIsUploading(false); setIsPollingParse(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const MAX_SIZE = 5 * 1024 * 1024;
        const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (file.size > MAX_SIZE) { toast.error("Max file size is 5MB"); e.currentTarget.value = ""; return; }
        if (!ALLOWED_TYPES.includes(file.type)) { toast.error("Only PDF and DOCX files are supported"); e.currentTarget.value = ""; return; }
        setPendingResumeFile(file); setParseChoiceDialogOpen(true); e.currentTarget.value = "";
    };

    return (
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md bg-secondary flex items-center justify-center text-xl font-semibold text-foreground border border-border shrink-0">
                        {initials}
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">{user.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground mt-1">
                            <span className="flex items-center gap-1.5 text-sm"><Mail className="w-4 h-4" /> {user.email}</span>
                            <Badge variant="secondary" className="font-normal border-border">Student</Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3 w-full sm:w-auto pr-4 border-r border-border">
                        <span className="text-sm font-medium text-foreground">Score: {score}%</span>
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
                        </div>
                    </div>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                            <User className="w-4 h-4 mr-2" /> Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>Cancel</Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            <Form {...form}>
                <div className="space-y-10">

                    {/* Master Resume Upload */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Master Resume</h2>
                        <div className="rounded-md border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-foreground truncate max-w-[280px]">
                                        {profile.resumeFilename || "No file uploaded"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Primary resume used for parsed recommendations.</p>
                                </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                {isEditing ? (
                                    <>
                                        <div className="relative">
                                            <Input type="file" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isUploading || isPollingParse || isApplyingMerge} className="absolute inset-0 w-full cursor-pointer opacity-0 z-10" />
                                            <Button variant="outline" size="sm" disabled={isUploading || isPollingParse || isApplyingMerge} className="relative pointer-events-none">
                                                {(isUploading || isPollingParse || isApplyingMerge) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                                {isUploading ? "Uploading..." : isPollingParse ? "Parsing..." : isApplyingMerge ? "Updating..." : "Upload New"}
                                            </Button>
                                        </div>
                                    </>
                                ) : null}
                                {resumeDownloadUrl && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={resumeDownloadUrl} target="_blank" rel="noreferrer">{resumeDownloadLabel}</a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Left & Right Rails merged into logical sections for clean Notion Flow */}

                    {/* Academics */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Academic Information</h2>
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="rollNo" render={({ field }) => (
                                    <FormItem><FormLabel>Roll No</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="sapId" render={({ field }) => (
                                    <FormItem><FormLabel>SAP ID</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="branch" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                                <SelectItem value="Information Technology">Information Technology</SelectItem>
                                                <SelectItem value="Electronics">Electronics</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="batchYear" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Batch</FormLabel>
                                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() ?? ""}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {batchYears.map(yr => <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="semester" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Semester</FormLabel>
                                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() ?? ""}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Sem" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <SelectItem key={sem} value={sem.toString()}>Sem {sem}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="cgpa" render={({ field }) => (
                                    <FormItem><FormLabel>CGPA</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="tenthPercentage" render={({ field }) => (
                                    <FormItem><FormLabel>10th %</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="twelfthPercentage" render={({ field }) => (
                                    <FormItem><FormLabel>12th %</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} /></FormControl></FormItem>
                                )} />
                            </div>
                        ) : (
                            <div className="rounded-md border border-border">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {[
                                            { label: "Roll No.", value: profile.rollNo },
                                            { label: "SAP ID", value: profile.sapId },
                                            { label: "Branch", value: profile.branch },
                                            { label: "Batch Year", value: profile.batchYear },
                                            { label: "Semester", value: profile.semester },
                                            { label: "CGPA", value: profile.cgpa },
                                            { label: "10th Percentage", value: profile.tenthPercentage ? `${profile.tenthPercentage}%` : null },
                                            { label: "12th Percentage", value: profile.twelfthPercentage ? `${profile.twelfthPercentage}%` : null }
                                        ].map((row, i) => (
                                            <tr key={row.label} className={cn("border-b border-border last:border-0", i % 2 !== 0 ? "bg-muted/50" : "")}>
                                                <td className="px-4 py-3 font-medium text-muted-foreground w-1/3">{row.label}</td>
                                                <td className="px-4 py-3 text-foreground font-medium">{row.value || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Hard Skills */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h2 className="text-sm font-semibold text-foreground">Skills / Technologies</h2>
                            {isEditing && <Button variant="ghost" size="sm" onClick={() => appendSkill({ name: "", proficiency: 1 })}><Plus className="w-4 h-4 mr-2" /> Add</Button>}
                        </div>
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {skillFields.map((f, i) => (
                                    <div key={f.id} className="flex items-center gap-2">
                                        <FormField control={form.control} name={`skills.${i}.name`} render={({ field }) => (
                                            <FormItem className="flex-1 space-y-0"><FormControl><Input placeholder="Skill name" {...field} /></FormControl></FormItem>
                                        )} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile.skills?.length > 0 ? profile.skills.map((s: any, i: number) => (
                                    <Badge key={i} variant="secondary">{s.name}</Badge>
                                )) : <p className="text-sm text-muted-foreground">No technical skills added.</p>}
                            </div>
                        )}
                    </section>
                    
                    {/* Soft Skills */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Soft Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {(form.watch("softSkills") || profile.softSkills || []).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="flex items-center gap-1.5">
                                    {skill}
                                    {isEditing && <X className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => {
                                        const current = form.getValues("softSkills") || [];
                                        form.setValue("softSkills", current.filter((_, i) => i !== idx));
                                    }} />}
                                </Badge>
                            ))}
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Input value={softSkillInput} onChange={(e) => setSoftSkillInput(e.target.value)} placeholder="Add soft skill" className="w-[150px] h-7 text-xs" onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (softSkillInput.trim()) {
                                                form.setValue("softSkills", [...(form.getValues("softSkills") || []), softSkillInput.trim()]);
                                                setSoftSkillInput("");
                                            }
                                        }
                                    }} />
                                    <Button type="button" size="sm" className="h-7 px-2" onClick={() => {
                                        if (softSkillInput.trim()) {
                                            form.setValue("softSkills", [...(form.getValues("softSkills") || []), softSkillInput.trim()]);
                                            setSoftSkillInput("");
                                        }
                                    }}><Plus className="w-3 h-3" /></Button>
                                </div>
                            )}
                        </div>
                        {!isEditing && (!profile.softSkills || profile.softSkills.length === 0) && <p className="text-sm text-muted-foreground">No soft skills added.</p>}
                    </section>

                    {/* Experience */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h2 className="text-sm font-semibold text-foreground">Work Experience</h2>
                            {isEditing && <Button variant="ghost" size="sm" onClick={() => appendExp({ company: "", role: "", description: "", startDate: "", endDate: "", location: "" })}><Plus className="w-4 h-4 mr-2" /> Add</Button>}
                        </div>
                        {isEditing ? (
                            <div className="space-y-6">
                                {expFields.map((field, idx) => (
                                    <div key={field.id} className="p-4 bg-muted/30 border border-border rounded-md relative space-y-4">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExp(idx)} className="absolute top-2 right-2"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                                            <FormField control={form.control} name={`workExperience.${idx}.role`} render={({ field }) => <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                            <FormField control={form.control} name={`workExperience.${idx}.company`} render={({ field }) => <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                            <FormField control={form.control} name={`workExperience.${idx}.startDate`} render={({ field }) => <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="month" {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                            <FormField control={form.control} name={`workExperience.${idx}.endDate`} render={({ field }) => <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="month" {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                        </div>
                                        <FormField control={form.control} name={`workExperience.${idx}.description`} render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:text-sm min-h-[100px]" {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {profile.workExperience?.length > 0 ? profile.workExperience.map((exp: any, i: number) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-foreground shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-foreground text-base">{exp.role}</h3>
                                            <p className="text-sm font-medium text-foreground mt-0.5">{exp.company} <span className="text-muted-foreground mx-1">•</span> <span className="text-muted-foreground font-normal">{exp.startDate} – {exp.endDate || "Present"}</span></p>
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground">No experience listed.</p>}
                            </div>
                        )}
                    </section>

                    {/* Projects */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
                            {isEditing && <Button variant="ghost" size="sm" onClick={() => appendProject({ title: "", description: "", techStack: [], url: "" })}><Plus className="w-4 h-4 mr-2" /> Add</Button>}
                        </div>
                        {isEditing ? (
                            <div className="space-y-6">
                                {projectFields.map((field, idx) => (
                                    <div key={field.id} className="p-4 bg-muted/30 border border-border rounded-md relative space-y-4">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeProject(idx)} className="absolute top-2 right-2"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                                            <FormField control={form.control} name={`projects.${idx}.title`} render={({ field }) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                            <FormField control={form.control} name={`projects.${idx}.url`} render={({ field }) => <FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                            <div className="md:col-span-2">
                                                <FormField control={form.control} name={`projects.${idx}.techStack`} render={({ field }) => <FormItem><FormLabel>Tech Stack (comma separated)</FormLabel><FormControl><Input value={field.value?.join(", ") || ""} onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} /></FormControl></FormItem>} />
                                            </div>
                                        </div>
                                        <FormField control={form.control} name={`projects.${idx}.description`} render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:text-sm min-h-[80px]" {...field} value={field.value ?? ""} /></FormControl></FormItem>} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.projects?.length > 0 ? profile.projects.map((p: any, i: number) => (
                                    <div key={i} className="border border-border p-5 rounded-md bg-card flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                {p.title}
                                                {p.url && <a href={p.url} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></a>}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-grow">{p.description}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-auto">
                                            {p.techStack?.map((t: string, ti: number) => (
                                                <Badge key={ti} variant="outline" className="text-[10px]">{t}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )) : <div className="col-span-2"><p className="text-sm text-muted-foreground">No projects listed.</p></div>}
                            </div>
                        )}
                    </section>

                    {/* Certifications and Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <h2 className="text-sm font-semibold text-foreground">Certifications</h2>
                                {isEditing && <Button variant="ghost" size="sm" onClick={() => appendCert({ title: "", issuer: "", url: "", dateIssued: "" })}><Plus className="w-4 h-4 mr-2" /> Add</Button>}
                            </div>
                            {isEditing ? (
                                <div className="space-y-4">
                                    {certFields.map((field, idx) => (
                                        <div key={field.id} className="p-4 bg-muted/30 border border-border rounded-md relative space-y-4">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCert(idx)} className="absolute top-2 right-2"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                            <div className="space-y-3 mr-8">
                                                <FormField control={form.control} name={`certifications.${idx}.title`} render={({field}) => <FormItem className="space-y-1"><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value ?? ""}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`certifications.${idx}.issuer`} render={({field}) => <FormItem className="space-y-1"><FormLabel>Issuer</FormLabel><FormControl><Input {...field} value={field.value ?? ""}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`certifications.${idx}.dateIssued`} render={({field}) => <FormItem className="space-y-1"><FormLabel>Date (YYYY-MM)</FormLabel><FormControl><Input type="month" {...field} value={field.value ?? ""}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`certifications.${idx}.url`} render={({field}) => <FormItem className="space-y-1"><FormLabel>URL</FormLabel><FormControl><Input {...field} value={field.value ?? ""}/></FormControl></FormItem>} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {profile.certifications?.length > 0 ? profile.certifications.map((cert: any, i: number) => (
                                        <li key={i} className="flex flex-col text-sm border-l-2 border-primary pl-3 py-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">{cert.title}</span>
                                                {cert.url && <a href={cert.url} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></a>}
                                            </div>
                                            <span className="text-muted-foreground text-xs mt-0.5">{cert.issuer} {cert.dateIssued && `• ${cert.dateIssued}`}</span>
                                        </li>
                                    )) : <p className="text-sm text-muted-foreground">No certifications added.</p>}
                                </ul>
                            )}
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <h2 className="text-sm font-semibold text-foreground">Links & Profiles</h2>
                                {isEditing && <Button variant="ghost" size="sm" onClick={() => appendLink({ platform: "", username: "", url: "" })}><Plus className="w-4 h-4 mr-2" /> Add</Button>}
                            </div>
                            {isEditing ? (
                                <div className="space-y-4">
                                    {linkFields.map((field, idx) => (
                                        <div key={field.id} className="p-4 bg-muted/30 border border-border rounded-md relative space-y-4">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(idx)} className="absolute top-2 right-2"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                            <div className="space-y-3 mr-8">
                                                <FormField control={form.control} name={`codingProfiles.${idx}.platform`} render={({field}) => <FormItem className="space-y-1"><FormLabel>Platform (e.g. GitHub)</FormLabel><FormControl><Input {...field} value={field.value ?? ""}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`codingProfiles.${idx}.username`} render={({field}) => <FormItem className="space-y-1"><FormLabel>Username</FormLabel><FormControl><Input {...field} value={field.value ?? ""}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`codingProfiles.${idx}.url`} render={({field}) => <FormItem className="space-y-1"><FormLabel>URL</FormLabel><FormControl><Input {...field} value={field.value ?? ""}/></FormControl></FormItem>} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {profile.codingProfiles?.length > 0 ? profile.codingProfiles.map((cp: { platform: string, url: string, username: string }, i: number) => (
                                        <a key={i} href={cp.url || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md bg-card hover:bg-muted text-sm transition-colors group">
                                            <span className="font-medium text-foreground">{cp.platform}</span>
                                            <span className="text-muted-foreground text-xs">{cp.username && `(${cp.username})`}</span>
                                            {cp.url && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />}
                                        </a>
                                    )) : <p className="text-sm text-muted-foreground">No links added.</p>}
                                </div>
                            )}
                        </section>
                    </div>

                </div>
            </Form>

            <Dialog open={parseChoiceDialogOpen} onOpenChange={(open) => {
                setParseChoiceDialogOpen(open);
                if (!open && !isUploading && !isPollingParse && !isApplyingMerge) {
                    setPendingResumeFile(null);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Profile From This Resume?</DialogTitle>
                        <DialogDescription>
                            Choose what should happen after upload. If you pick yes, we will parse and update your profile automatically. Otherwise we just save this as your resume document.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
                        <Button variant="outline" onClick={() => { if (pendingResumeFile) void uploadResumeFile(pendingResumeFile, false); }} disabled={!pendingResumeFile || isUploading || isPollingParse || isApplyingMerge}>
                            No, Save Resume Only
                        </Button>
                        <Button onClick={() => { if (pendingResumeFile) void uploadResumeFile(pendingResumeFile, true); }} disabled={!pendingResumeFile || isUploading || isPollingParse || isApplyingMerge}>
                            Yes, Parse and Update Profile
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}