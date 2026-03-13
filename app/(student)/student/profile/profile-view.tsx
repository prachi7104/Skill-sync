"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
    Briefcase, Code2, GraduationCap, Link2, Mail, Trophy, User, 
    Loader2, Plus, Trash2, Save, X, FileText, Upload, Sparkles, 
    ExternalLink, BookOpen, Award
} from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/validations/student-profile";
import { computeCompleteness } from "@/lib/profile/completeness";

export default function ProfileView({ user, profile }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // FIXED BUG: Merged user details into profile so the score perfectly matches the Dashboard
    const { score } = computeCompleteness({
        ...profile,
        name: user.name,
        email: user.email,
    });

    const initials = user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "ST";
    const currentYear = new Date().getFullYear();
    const batchYears = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);

    // Initialize Form with Real Database Profile Data
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
    const { fields: researchFields, append: appendResearch, remove: removeResearch } = useFieldArray({ control: form.control, name: "researchPapers" });
    const { fields: achieveFields, append: appendAchieve, remove: removeAchieve } = useFieldArray({ control: form.control, name: "achievements" });

    const [softSkillInput, setSoftSkillInput] = useState("");

    const handleCancel = () => {
        form.reset(); 
        setIsEditing(false);
    };

    // Actual Database Patch Logic
    const onSubmit = async (data: StudentProfileInput) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/student/profile", {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error();
            toast.success("Profile saved and synced securely.");
            setIsEditing(false);
            router.refresh();
        } catch (e) { toast.error("Failed to sync with database."); } 
        finally { setIsLoading(false); }
    };

    const [isUploading, setIsUploading] = useState(false);

    // Actual Resume Upload Logic
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return toast.error("Max file size is 2MB");
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/student/resume", { method: "POST", body: formData });
            if (!response.ok) throw new Error();
            toast.success("Resume processed! AI has updated your profile.");
            router.refresh();
        } catch (error) { toast.error("Upload failed"); } 
        finally { setIsUploading(false); }
    };

    const inputClass = "bg-slate-950/50 border-slate-800 text-white rounded-xl focus:ring-indigo-500 w-full";

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* HERO HEADER */}
            <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl border border-white/10 shrink-0">
                            {initials}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black text-white tracking-tight">{user.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-slate-400 font-medium">
                                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-400">Student Platform</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                        <div className="bg-slate-950/50 p-5 rounded-3xl border border-white/5 w-full sm:w-auto min-w-[240px]">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-indigo-400" /> Identity Score
                                </span>
                                <span className="text-sm font-black text-white">{score}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${score}%` }} />
                            </div>
                        </div>
                        
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="bg-white hover:bg-slate-200 text-slate-950 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto">
                                <User className="w-4 h-4" /> Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-3 w-full sm:w-auto h-full">
                                <button onClick={handleCancel} disabled={isLoading} className="flex-1 sm:flex-none bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all disabled:opacity-50">Cancel</button>
                                <button onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Form {...form}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT RAIL */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Academics */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl"><GraduationCap className="w-5 h-5 text-blue-400" /></div>
                                <h2 className="font-bold text-white text-lg">Academic Roots</h2>
                            </div>
                            
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="rollNo" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Roll No</FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ""} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="sapId" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">SAP ID</FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ""} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="branch" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-slate-400 font-bold uppercase">Branch</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl><SelectTrigger className={inputClass}><SelectValue placeholder="Branch" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                                                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="batchYear" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-slate-400 font-bold uppercase">Batch</FormLabel>
                                                <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                                                    <FormControl><SelectTrigger className={inputClass}><SelectValue placeholder="Year" /></SelectTrigger></FormControl>
                                                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                                        {batchYears.map(yr => <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="semester" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-slate-400 font-bold uppercase">Semester</FormLabel>
                                                <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                                                    <FormControl><SelectTrigger className={inputClass}><SelectValue placeholder="Sem" /></SelectTrigger></FormControl>
                                                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                                        {[1,2,3,4,5,6,7,8].map(sem => <SelectItem key={sem} value={sem.toString()}>Sem {sem}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="cgpa" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">CGPA</FormLabel><FormControl><Input type="number" step="0.01" className={inputClass} {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="tenthPercentage" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">10th %</FormLabel><FormControl><Input type="number" step="0.01" className={inputClass} {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <MetaField label="Roll No" value={profile.rollNo} />
                                    <MetaField label="SAP ID" value={profile.sapId} />
                                    <div className="col-span-2"><MetaField label="Branch" value={profile.branch} /></div>
                                    <MetaField label="Batch" value={profile.batchYear} />
                                    <MetaField label="Semester" value={profile.semester} />
                                    <MetaField label="CGPA" value={profile.cgpa} highlight />
                                    <MetaField label="10th %" value={profile.tenthPercentage} />
                                </div>
                            )}
                        </div>

                        {/* Skills */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Code2 className="w-5 h-5 text-emerald-400" /></div>
                                    <h2 className="font-bold text-white text-lg">Core Skills</h2>
                                </div>
                                {isEditing && <button type="button" onClick={() => appendSkill({ name: "", proficiency: 1 })} className="text-emerald-400 p-2 hover:bg-emerald-400/10 rounded-lg transition"><Plus className="w-5 h-5" /></button>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {isEditing ? (
                                    skillFields.map((f, i) => (
                                        <div key={f.id} className="flex items-center gap-2 w-full">
                                            <FormField control={form.control} name={`skills.${i}.name`} render={({ field }) => (
                                                <FormItem className="flex-1"><FormControl><Input className={inputClass} placeholder="Skill name" {...field} /></FormControl></FormItem>
                                            )} />
                                            <button onClick={() => removeSkill(i)} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))
                                ) : (
                                    profile.skills?.length > 0 ? profile.skills.map((s: any, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg">{s.name}</span>
                                    )) : <EmptyState message="No skills provided." />
                                )}
                            </div>
                        </div>

                        {/* Soft Skills */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-pink-500/10 rounded-xl"><Sparkles className="w-5 h-5 text-pink-400" /></div>
                                <h2 className="font-bold text-white text-lg">Soft Skills</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(form.watch("softSkills") || profile.softSkills || []).map((skill: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-2">
                                        {skill}
                                        {isEditing && <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white" onClick={() => {
                                            const current = form.getValues("softSkills") || [];
                                            form.setValue("softSkills", current.filter((_, i) => i !== idx));
                                        }}/>}
                                    </span>
                                ))}
                            </div>
                            {isEditing && (
                                <div className="flex gap-2 mt-4">
                                    <Input value={softSkillInput} onChange={(e) => setSoftSkillInput(e.target.value)} placeholder="Add soft skill" className={inputClass} onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            e.preventDefault();
                                            if(softSkillInput.trim()) {
                                                form.setValue("softSkills", [...(form.getValues("softSkills") || []), softSkillInput.trim()]);
                                                setSoftSkillInput("");
                                            }
                                        }
                                    }}/>
                                    <button type="button" onClick={() => {
                                        if(softSkillInput.trim()) {
                                            form.setValue("softSkills", [...(form.getValues("softSkills") || []), softSkillInput.trim()]);
                                            setSoftSkillInput("");
                                        }
                                    }} className="px-4 bg-slate-800 text-white rounded-xl"><Plus className="w-4 h-4"/></button>
                                </div>
                            )}
                            {!isEditing && (!profile.softSkills || profile.softSkills.length === 0) && <EmptyState message="No soft skills added." />}
                        </div>

                        {/* Platforms */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-cyan-500/10 rounded-xl"><Link2 className="w-5 h-5 text-cyan-400" /></div>
                                    <h2 className="font-bold text-white text-lg">Platforms</h2>
                                </div>
                                {isEditing && <button type="button" onClick={() => appendLink({ platform: "", username: "", url: "" })} className="text-cyan-400"><Plus className="w-5 h-5" /></button>}
                            </div>
                            
                            {isEditing ? (
                                <div className="space-y-4">
                                    {linkFields.map((field, idx) => (
                                        <div key={field.id} className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl relative space-y-3">
                                            <button onClick={() => removeLink(idx)} className="absolute top-3 right-3 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                            <FormField control={form.control} name={`codingProfiles.${idx}.platform`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="Platform" {...field}/></FormControl></FormItem>} />
                                            <FormField control={form.control} name={`codingProfiles.${idx}.url`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="URL" {...field}/></FormControl></FormItem>} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {profile.codingProfiles?.length > 0 ? profile.codingProfiles.map((cp: any, i: number) => (
                                        <a key={i} href={cp.url || "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-600 group">
                                            <span className="font-bold text-slate-200 text-sm">{cp.platform}</span>
                                            {cp.url && <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white" />}
                                        </a>
                                    )) : <EmptyState message="No profiles linked." />}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT RAIL */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Resume */}
                        <div className="bg-slate-900 rounded-[2rem] border border-white/5 p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-indigo-500/10 rounded-2xl"><FileText className="w-6 h-6 text-indigo-400" /></div>
                                <div>
                                    <h2 className="font-bold text-white text-lg">Master Resume</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">{profile.resumeFilename || "No file uploaded"}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 w-full sm:w-auto">
                                {isEditing ? (
                                    <div className="relative w-full sm:w-auto">
                                        <Input type="file" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                                        <button type="button" disabled={isUploading} className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {isUploading ? "Parsing..." : "Upload New"}
                                        </button>
                                    </div>
                                ) : (
                                    profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm text-center">View PDF</a>
                                )}
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-500/10 rounded-xl"><Briefcase className="w-5 h-5 text-amber-400" /></div>
                                    <h2 className="font-bold text-white text-xl">Experience</h2>
                                </div>
                                {isEditing && <button type="button" onClick={() => appendExp({ company: "", role: "", description: "", startDate: "", endDate: "", location: "" })} className="text-xs font-bold text-amber-400 bg-amber-400/10 px-4 py-2 rounded-xl">+ Add Role</button>}
                            </div>

                            {isEditing ? (
                                <div className="space-y-6">
                                    {expFields.map((field, idx) => (
                                        <div key={field.id} className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl relative space-y-4">
                                            <button type="button" onClick={() => removeExp(idx)} className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                                                <FormField control={form.control} name={`workExperience.${idx}.role`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Role</FormLabel><FormControl><Input className={inputClass} {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`workExperience.${idx}.company`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Company</FormLabel><FormControl><Input className={inputClass} {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`workExperience.${idx}.startDate`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Start Date</FormLabel><FormControl><Input type="month" className={inputClass} {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`workExperience.${idx}.endDate`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">End Date</FormLabel><FormControl><Input type="month" className={inputClass} {...field}/></FormControl></FormItem>} />
                                            </div>
                                            <FormField control={form.control} name={`workExperience.${idx}.description`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Description</FormLabel><FormControl><textarea className={`${inputClass} min-h-[100px] py-3`} {...field}/></FormControl></FormItem>} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                                    {profile.workExperience?.length > 0 ? profile.workExperience.map((exp: any, i: number) => (
                                        <div key={i} className="relative pl-12 group">
                                            <div className="absolute left-0 top-1.5 w-9 h-9 rounded-full bg-slate-900 border-4 border-slate-950 flex items-center justify-center z-10 group-hover:border-amber-500/30 transition-all">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold text-white">{exp.role}</h3>
                                                <p className="text-amber-400 font-semibold text-sm">{exp.company} <span className="text-slate-600 mx-2">•</span> <span className="text-slate-400 font-medium">{exp.startDate} - {exp.endDate || "Present"}</span></p>
                                                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl whitespace-pre-wrap">{exp.description}</p>
                                            </div>
                                        </div>
                                    )) : <EmptyState message="No experience data found." />}
                                </div>
                            )}
                        </div>

                        {/* Projects */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-500/10 rounded-xl"><BookOpen className="w-5 h-5 text-purple-400" /></div>
                                    <h2 className="font-bold text-white text-xl">Projects</h2>
                                </div>
                                {isEditing && <button type="button" onClick={() => appendProject({ title: "", description: "", techStack: [], url: "" })} className="text-xs font-bold text-purple-400 bg-purple-400/10 px-4 py-2 rounded-xl">+ Add Project</button>}
                            </div>

                            {isEditing ? (
                                <div className="space-y-6">
                                    {projectFields.map((field, idx) => (
                                        <div key={field.id} className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl relative space-y-4">
                                            <button type="button" onClick={() => removeProject(idx)} className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                                                <FormField control={form.control} name={`projects.${idx}.title`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Title</FormLabel><FormControl><Input className={inputClass} {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`projects.${idx}.url`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">URL</FormLabel><FormControl><Input className={inputClass} {...field} value={field.value||""}/></FormControl></FormItem>} />
                                                <div className="md:col-span-2">
                                                    <FormField control={form.control} name={`projects.${idx}.techStack`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Tech Stack (comma separated)</FormLabel><FormControl><Input className={inputClass} value={field.value?.join(", ")||""} onChange={(e) => field.onChange(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}/></FormControl></FormItem>} />
                                                </div>
                                            </div>
                                            <FormField control={form.control} name={`projects.${idx}.description`} render={({field}) => <FormItem><FormLabel className="text-xs text-slate-400 font-bold uppercase">Description</FormLabel><FormControl><textarea className={`${inputClass} min-h-[80px] py-3`} {...field} value={field.value||""}/></FormControl></FormItem>} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.projects?.length > 0 ? profile.projects.map((p: any, i: number) => (
                                        <div key={i} className="bg-slate-950/50 border border-slate-800 p-6 rounded-[1.5rem] flex flex-col h-full hover:border-indigo-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                                                {p.url && <a href={p.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-slate-500 hover:text-white" /></a>}
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-6 flex-grow">{p.description}</p>
                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                {p.techStack?.map((t: string, ti: number) => (
                                                    <span key={ti} className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-300">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )) : <div className="col-span-2"><EmptyState message="No projects added." /></div>}
                                </div>
                            )}
                        </div>

                        {/* Certifications */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-yellow-500/10 rounded-xl"><Award className="w-5 h-5 text-yellow-400" /></div>
                                    <h2 className="font-bold text-white text-xl">Certifications</h2>
                                </div>
                                {isEditing && <button type="button" onClick={() => appendCert({ title: "", issuer: "", url: "", dateIssued: "" })} className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-xl">+ Add Cert</button>}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    {certFields.map((field, idx) => (
                                        <div key={field.id} className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl relative space-y-4">
                                            <button type="button" onClick={() => removeCert(idx)} className="absolute top-4 right-4 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                                                <FormField control={form.control} name={`certifications.${idx}.title`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="Title" {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`certifications.${idx}.issuer`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="Issuer" {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`certifications.${idx}.dateIssued`} render={({field}) => <FormItem><FormControl><Input type="month" className={inputClass} {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`certifications.${idx}.url`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="URL" {...field}/></FormControl></FormItem>} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {profile.certifications?.length > 0 ? profile.certifications.map((cert: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem]">
                                            <div>
                                                <h3 className="font-bold text-white">{cert.title}</h3>
                                                <p className="text-sm text-slate-400 mt-1">{cert.issuer} • {cert.dateIssued}</p>
                                            </div>
                                            {cert.url && <a href={cert.url} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition"><ExternalLink className="w-4 h-4 text-white" /></a>}
                                        </div>
                                    )) : <EmptyState message="No certifications added." />}
                                </div>
                            )}
                        </div>

                        {/* Achievements */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl"><Trophy className="w-5 h-5 text-orange-400" /></div>
                                    <h2 className="font-bold text-white text-xl">Achievements</h2>
                                </div>
                                {isEditing && <button type="button" onClick={() => appendAchieve({ title: "", description: "", date: "", issuer: "" })} className="text-xs font-bold text-orange-400 bg-orange-400/10 px-4 py-2 rounded-xl">+ Add Achv</button>}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    {achieveFields.map((field, idx) => (
                                        <div key={field.id} className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl relative space-y-4">
                                            <button type="button" onClick={() => removeAchieve(idx)} className="absolute top-4 right-4 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                                                <FormField control={form.control} name={`achievements.${idx}.title`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="Title" {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`achievements.${idx}.issuer`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="Issuer" {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`achievements.${idx}.date`} render={({field}) => <FormItem><FormControl><Input type="month" className={inputClass} {...field}/></FormControl></FormItem>} />
                                            </div>
                                            <FormField control={form.control} name={`achievements.${idx}.description`} render={({field}) => <FormItem><FormControl><textarea className={`${inputClass} min-h-[60px] py-3`} placeholder="Description" {...field}/></FormControl></FormItem>} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {profile.achievements?.length > 0 ? profile.achievements.map((ach: any, i: number) => (
                                        <div key={i} className="p-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem]">
                                            <h3 className="font-bold text-white">{ach.title}</h3>
                                            <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mt-1 mb-3">{ach.issuer} • {ach.date}</p>
                                            <p className="text-sm text-slate-400 leading-relaxed">{ach.description}</p>
                                        </div>
                                    )) : <EmptyState message="No achievements added." />}
                                </div>
                            )}
                        </div>

                        {/* Research Papers */}
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-sky-500/10 rounded-xl"><FileText className="w-5 h-5 text-sky-400" /></div>
                                    <h2 className="font-bold text-white text-xl">Research Papers</h2>
                                </div>
                                {isEditing && <button type="button" onClick={() => appendResearch({ title: "", abstract: "", url: "", publicationDate: "" })} className="text-xs font-bold text-sky-400 bg-sky-400/10 px-4 py-2 rounded-xl">+ Add Paper</button>}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    {researchFields.map((field, idx) => (
                                        <div key={field.id} className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl relative space-y-4">
                                            <button type="button" onClick={() => removeResearch(idx)} className="absolute top-4 right-4 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                                                <FormField control={form.control} name={`researchPapers.${idx}.title`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="Paper Title" {...field}/></FormControl></FormItem>} />
                                                <FormField control={form.control} name={`researchPapers.${idx}.publicationDate`} render={({field}) => <FormItem><FormControl><Input type="month" className={inputClass} {...field}/></FormControl></FormItem>} />
                                                <div className="md:col-span-2">
                                                    <FormField control={form.control} name={`researchPapers.${idx}.url`} render={({field}) => <FormItem><FormControl><Input className={inputClass} placeholder="URL" {...field}/></FormControl></FormItem>} />
                                                </div>
                                            </div>
                                            <FormField control={form.control} name={`researchPapers.${idx}.abstract`} render={({field}) => <FormItem><FormControl><textarea className={`${inputClass} min-h-[80px] py-3`} placeholder="Abstract" {...field}/></FormControl></FormItem>} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {profile.researchPapers?.length > 0 ? profile.researchPapers.map((paper: any, i: number) => (
                                        <div key={i} className="p-6 bg-slate-950/50 border border-slate-800 rounded-[1.5rem]">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-white text-lg">{paper.title}</h3>
                                                {paper.url && <a href={paper.url} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition"><ExternalLink className="w-4 h-4 text-white" /></a>}
                                            </div>
                                            <p className="text-xs text-sky-400 font-bold uppercase tracking-widest mb-4">Published: {paper.publicationDate}</p>
                                            <p className="text-sm text-slate-400 leading-relaxed">{paper.abstract}</p>
                                        </div>
                                    )) : <EmptyState message="No research papers added." />}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </Form>
        </div>
    );
}

// Reusable Subcomponents
function MetaField({ label, value, highlight = false }: any) {
    return (
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:bg-slate-900 transition-colors">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1.5">{label}</p>
            <p className={`text-sm font-bold truncate ${highlight ? 'text-indigo-400' : 'text-slate-200'}`}>
                {value || "—"}
            </p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="w-full py-8 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-slate-500">{message}</p>
        </div>
    );
}