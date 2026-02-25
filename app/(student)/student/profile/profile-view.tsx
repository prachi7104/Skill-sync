"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Briefcase,
    Code2,
    GraduationCap,
    Link2,
    Mail,
    Trophy,
    User,
    Loader2,
    Plus,
    Trash2,
    Save,
    X,
    FileText,
    Upload,
    Sparkles,
    ExternalLink
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompletenessCard } from "@/components/student/completeness-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { studentProfileSchema, type StudentProfileInput } from "@/lib/validations/student-profile";
import { computeCompleteness } from "@/lib/profile/completeness";
import type { Skill, Project, WorkExperience, Certification, CodingProfile, ResearchPaper, Achievement } from "@/lib/db/schema";

interface ProfileViewProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
    };
    profile: {
        skills: Skill[] | null;
        projects: Project[] | null;
        workExperience: WorkExperience[] | null;
        certifications: Certification[] | null;
        codingProfiles: CodingProfile[] | null;
        researchPapers: ResearchPaper[] | null;
        achievements: Achievement[] | null;
        softSkills: string[] | null;
        // Academic fields - editable by students
        rollNo: string | null;
        sapId: string | null;
        branch: string | null;
        batchYear: number | null;
        cgpa: number | null;
        semester: number | null;
        tenthPercentage: number | null;
        twelfthPercentage: number | null;
        // Resume
        resumeUrl: string | null;
        resumeFilename: string | null;
        resumeUploadedAt: string | null;
        parsedResumeJson: any;
        profileCompleteness: number;
        category: string | null;
    };
}

export default function ProfileView({ user, profile }: ProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    // Compute profile completeness
    const { score, missing, isBlocked, isGated, blocked } = computeCompleteness(profile);

    // Helper to get initials
    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Initialize form
    const form = useForm<StudentProfileInput>({
        resolver: zodResolver(studentProfileSchema),
        defaultValues: {
            // Academic fields
            rollNo: profile.rollNo || "",
            sapId: profile.sapId || "",
            branch: profile.branch || "",
            batchYear: profile.batchYear || undefined,
            cgpa: profile.cgpa || undefined,
            semester: profile.semester || undefined,
            tenthPercentage: profile.tenthPercentage || undefined,
            twelfthPercentage: profile.twelfthPercentage || undefined,
            // Array fields - ALL must be present for useFieldArray to work
            skills: profile.skills || [],
            projects: profile.projects || [],
            codingProfiles: profile.codingProfiles || [],
            workExperience: profile.workExperience || [],
            certifications: profile.certifications || [],
            researchPapers: profile.researchPapers || [],
            achievements: profile.achievements || [],
            softSkills: profile.softSkills || [],
        },
    });

    const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
        control: form.control,
        name: "skills",
    });

    const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
        control: form.control,
        name: "projects",
    });

    const { fields: codingProfileFields, append: appendCodingProfile, remove: removeCodingProfile } = useFieldArray({
        control: form.control,
        name: "codingProfiles",
    });

    const { fields: workExperienceFields, append: appendWorkExperience, remove: removeWorkExperience } = useFieldArray({
        control: form.control,
        name: "workExperience",
    });

    const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
        control: form.control,
        name: "certifications",
    });

    const { fields: researchPaperFields, append: appendResearchPaper, remove: removeResearchPaper } = useFieldArray({
        control: form.control,
        name: "researchPapers",
    });

    const { fields: achievementFields, append: appendAchievement, remove: removeAchievement } = useFieldArray({
        control: form.control,
        name: "achievements",
    });

    const [softSkillInput, setSoftSkillInput] = useState("");

    const handleCancel = () => {
        form.reset({
            // Academic fields
            rollNo: profile.rollNo || "",
            sapId: profile.sapId || "",
            branch: profile.branch || "",
            batchYear: profile.batchYear || undefined,
            cgpa: profile.cgpa || undefined,
            semester: profile.semester || undefined,
            tenthPercentage: profile.tenthPercentage || undefined,
            twelfthPercentage: profile.twelfthPercentage || undefined,
            // Array fields
            skills: profile.skills || [],
            projects: profile.projects || [],
            codingProfiles: profile.codingProfiles || [],
            workExperience: profile.workExperience || [],
            certifications: profile.certifications || [],
            researchPapers: profile.researchPapers || [],
            achievements: profile.achievements || [],
            softSkills: profile.softSkills || [],
        });
        setIsEditing(false);
    };

    const onSubmit = async (data: StudentProfileInput) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update profile");
            }

            toast.success("Your changes have been saved successfully.");

            router.refresh();
            setIsEditing(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback className="bg-blue-600 text-xl text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                            <Badge variant="secondary" className="ml-2 capitalize">
                                {user.role}
                            </Badge>
                            {profile.category && (
                                <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20">
                                    {profile.category} Category
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Joined {user.createdAt}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 items-end">
                    <div className="w-full md:w-80">
                        <CompletenessCard
                            score={score}
                            isBlocked={isBlocked}
                            isGated={isGated}
                            missing={missing}
                            blocked={blocked}
                        />
                    </div>

                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            <Form {...form}>
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column: Academic & Skills */}
                    <div className="space-y-6">

                        {/* Academic Info - Editable by Students */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                    Academic Details
                                </CardTitle>
                                <CardDescription>
                                    {isEditing ? "Update your academic information" : "Your academic information"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {/* Roll Number and SAP ID */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="rollNo"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>Roll Number</Label>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g., 21BCE1234"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="sapId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>SAP ID</Label>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g., 500012345"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Branch and Batch */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="branch"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>Branch</Label>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value || ""}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select branch" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                                                <SelectItem value="Information Technology">Information Technology</SelectItem>
                                                                <SelectItem value="Electronics & Communication">Electronics & Communication</SelectItem>
                                                                <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                                                                <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                                                                <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                                                                <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                                                                <SelectItem value="Other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="batchYear"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>Batch Year</Label>
                                                        <Select
                                                            onValueChange={(v) => field.onChange(parseInt(v))}
                                                            value={field.value?.toString() || ""}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select batch" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {[2024, 2025, 2026, 2027, 2028].map(year => (
                                                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* CGPA and Semester */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="cgpa"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>CGPA (0-10)</Label>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="10"
                                                                placeholder="e.g., 8.5"
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="semester"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>Semester</Label>
                                                        <Select
                                                            onValueChange={(v) => field.onChange(parseInt(v))}
                                                            value={field.value?.toString() || ""}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select semester" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* 10th and 12th Percentages */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="tenthPercentage"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>10th Percentage</Label>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                placeholder="e.g., 85.5"
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="twelfthPercentage"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>12th Percentage</Label>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                placeholder="e.g., 88.0"
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Roll Number</p>
                                                <p>{profile.rollNo || "Not set"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">SAP ID</p>
                                                <p>{profile.sapId || "Not set"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Branch</p>
                                                <p>{profile.branch || "Not set"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Batch</p>
                                                <p>{profile.batchYear || "Not set"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">CGPA</p>
                                                <p className="font-semibold">{profile.cgpa ?? "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Semester</p>
                                                <p>{profile.semester ?? "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">10th %</p>
                                                <p>{profile.tenthPercentage ?? "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">12th %</p>
                                                <p>{profile.twelfthPercentage ?? "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Skills */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Code2 className="h-5 w-5 text-blue-600" />
                                            Skills
                                        </CardTitle>
                                        <CardDescription>
                                            Technologies and tools you are proficient in
                                        </CardDescription>
                                    </div>
                                    {isEditing && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => appendSkill({ name: "", proficiency: 1 })}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {skillFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2 items-start">
                                                <FormField
                                                    control={form.control}
                                                    name={`skills.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input placeholder="Skill (e.g. React)" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeSkill(index)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    profile.skills && profile.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill: any, i: number) => (
                                                <Badge key={i} variant="outline" className="px-3 py-1">
                                                    {skill.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No skills added yet.
                                        </p>
                                    )
                                )}
                            </CardContent>
                        </Card>

                        {/* Coding Profiles */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Link2 className="h-5 w-5 text-blue-600" />
                                        Coding Platforms
                                    </CardTitle>
                                    {isEditing && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => appendCodingProfile({ platform: "", username: "", url: "" })}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {codingProfileFields.map((field, index) => (
                                            <div key={field.id} className="space-y-2 border p-3 rounded-md">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-medium">Profile {index + 1}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCodingProfile(index)}
                                                        className="h-8 w-8 p-0 text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`codingProfiles.${index}.platform`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Platform (e.g. LeetCode)" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`codingProfiles.${index}.username`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Username" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name={`codingProfiles.${index}.url`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Profile URL" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    profile.codingProfiles && profile.codingProfiles.length > 0 ? (
                                        profile.codingProfiles.map((cp: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium">{cp.platform}</p>
                                                    <p className="text-sm text-muted-foreground">{cp.username}</p>
                                                </div>
                                                {cp.url && (
                                                    <a href={cp.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                        <Link2 className="h-3 w-3" /> View
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No coding profiles linked.
                                        </p>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Projects & Experience */}
                    <div className="space-y-6">

                        {/* Resume Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Resume
                                </CardTitle>
                                <CardDescription>
                                    Your uploaded resume. Updating it will re-parse and overwrite your profile data.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile.resumeUrl ? (
                                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-100 p-2 rounded">
                                                <FileText className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium">{profile.resumeFilename || "Resume"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Uploaded {profile.resumeUploadedAt || "Recently"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                    View
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-6 border-2 border-dashed rounded-md bg-muted/10">
                                        <div className="mx-auto w-10 h-10 bg-muted/30 rounded-full flex items-center justify-center mb-2">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium">No resume uploaded</p>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            Upload PDF or DOCX (max 100KB)
                                        </p>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="pt-2">
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href="/student/onboarding/resume" target="_blank">
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload / Update Resume
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                            </CardContent>
                        </Card>

                        {/* Work Experience Section (Editable) */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-blue-600" />
                                        Work Experience
                                    </CardTitle>
                                    <CardDescription>Add your internships and full-time roles</CardDescription>
                                </div>
                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendWorkExperience({
                                            company: "",
                                            role: "",
                                            description: "",
                                            startDate: "",
                                            endDate: "",
                                            location: ""
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        {workExperienceFields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 p-4 border rounded-lg relative bg-muted/20">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeWorkExperience(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Company</Label>
                                                        <Input
                                                            {...form.register(`workExperience.${index}.company`)}
                                                            placeholder="Company Name"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Role</Label>
                                                        <Input
                                                            {...form.register(`workExperience.${index}.role`)}
                                                            placeholder="Job Title"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Start Date</Label>
                                                        <Input
                                                            type="month"
                                                            {...form.register(`workExperience.${index}.startDate`)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>End Date</Label>
                                                        <Input
                                                            type="month"
                                                            {...form.register(`workExperience.${index}.endDate`)}
                                                        />
                                                        <p className="text-[10px] text-muted-foreground">Leave empty if currently working here</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Description</Label>
                                                    <textarea
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                        {...form.register(`workExperience.${index}.description`)}
                                                        placeholder="Describe your responsibilities..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Location</Label>
                                                    <Input
                                                        {...form.register(`workExperience.${index}.location`)}
                                                        placeholder="e.g. Remote, Bangalore"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    profile.workExperience && profile.workExperience.length > 0 ? (
                                        profile.workExperience.map((work: any, i: number) => (
                                            <div key={i} className="relative border-l-2 border-primary/20 pl-4 pb-4 last:pb-0">
                                                <h3 className="font-semibold">{work.role}</h3>
                                                <div className="text-primary font-medium">{work.company}</div>
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    {work.startDate} - {work.endDate || "Present"}
                                                    {work.location && ` • ${work.location}`}
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-5 whitespace-pre-wrap">
                                                    {work.description}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No work experience added yet.
                                        </p>
                                    )
                                )}
                            </CardContent>
                        </Card>

                        {/* Certifications Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-blue-600" />
                                    Certifications
                                </CardTitle>
                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendCertification({ title: "", issuer: "", url: "", dateIssued: "" })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        {certificationFields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 p-4 border rounded-lg relative bg-muted/20">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeCertification(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Title</Label>
                                                        <Input {...form.register(`certifications.${index}.title`)} placeholder="Certificate Name" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Issuer</Label>
                                                        <Input {...form.register(`certifications.${index}.issuer`)} placeholder="Issuing Org" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date Issued</Label>
                                                        <Input type="month" {...form.register(`certifications.${index}.dateIssued`)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>URL</Label>
                                                        <Input {...form.register(`certifications.${index}.url`)} placeholder="https://..." />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    profile.certifications && profile.certifications.length > 0 ? (
                                        <div className="space-y-4">
                                            {profile.certifications.map((cert: any, i: number) => (
                                                <div key={i} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                                                    <div>
                                                        <div className="font-medium">{cert.title}</div>
                                                        <div className="text-sm text-muted-foreground">{cert.issuer} • {cert.dateIssued}</div>
                                                    </div>
                                                    {cert.url && (
                                                        <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                            <ExternalLink className="h-3 w-3" /> Verify
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No certifications added yet.</p>
                                    )
                                )}
                            </CardContent>
                        </Card>

                        {/* Research Papers Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Research Papers
                                </CardTitle>
                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendResearchPaper({ title: "", abstract: "", url: "", publicationDate: "" })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        {researchPaperFields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 p-4 border rounded-lg relative bg-muted/20">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeResearchPaper(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Title</Label>
                                                        <Input {...form.register(`researchPapers.${index}.title`)} placeholder="Paper Title" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input type="month" {...form.register(`researchPapers.${index}.publicationDate`)} />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>URL</Label>
                                                        <Input {...form.register(`researchPapers.${index}.url`)} placeholder="https://..." />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>Abstract</Label>
                                                        <textarea
                                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                            {...form.register(`researchPapers.${index}.abstract`)}
                                                            placeholder="Short abstract..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    profile.researchPapers && profile.researchPapers.length > 0 ? (
                                        <div className="space-y-6">
                                            {profile.researchPapers.map((paper: any, i: number) => (
                                                <div key={i}>
                                                    <div className="font-medium flex items-center justify-between">
                                                        <span>{paper.title}</span>
                                                        {paper.url && (
                                                            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                                <ExternalLink className="h-3 w-3" /> Link
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mb-1">{paper.publicationDate}</div>
                                                    <p className="text-sm text-gray-600 line-clamp-3">{paper.abstract}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No research papers added yet.</p>
                                    )
                                )}
                            </CardContent>
                        </Card>

                        {/* Achievements Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-blue-600" />
                                    Achievements
                                </CardTitle>
                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendAchievement({ title: "", description: "", date: "", issuer: "" })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        {achievementFields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 p-4 border rounded-lg relative bg-muted/20">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeAchievement(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Title</Label>
                                                        <Input {...form.register(`achievements.${index}.title`)} placeholder="Title" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input type="month" {...form.register(`achievements.${index}.date`)} />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>Issuer</Label>
                                                        <Input {...form.register(`achievements.${index}.issuer`)} placeholder="Organization / Event" />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>Description</Label>
                                                        <textarea
                                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                            {...form.register(`achievements.${index}.description`)}
                                                            placeholder="Details..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    profile.achievements && profile.achievements.length > 0 ? (
                                        <div className="space-y-4">
                                            {profile.achievements.map((ach: any, i: number) => (
                                                <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                                                    <div className="font-medium">{ach.title}</div>
                                                    <div className="text-sm text-muted-foreground">{ach.issuer} • {ach.date}</div>
                                                    <p className="text-sm text-gray-600 mt-1">{ach.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No achievements added yet.</p>
                                    )
                                )}
                            </CardContent>
                        </Card>

                        {/* Soft Skills Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Soft Skills</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {(form.watch("softSkills") || profile.softSkills || []).map((skill: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="px-3 py-1">
                                            {skill}
                                            {isEditing && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-4 w-4 ml-2 hover:text-destructive p-0"
                                                    onClick={() => {
                                                        const current = form.getValues("softSkills") || [];
                                                        form.setValue("softSkills", current.filter((_: any, i: number) => i !== index));
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </Badge>
                                    ))}
                                    {(!form.watch("softSkills")?.length && (!profile.softSkills || profile.softSkills.length === 0)) && (
                                        <p className="text-sm text-muted-foreground italic">No soft skills added yet.</p>
                                    )}
                                </div>

                                {isEditing && (
                                    <div className="flex gap-2 max-w-sm">
                                        <Input
                                            value={softSkillInput}
                                            onChange={(e) => setSoftSkillInput(e.target.value)}
                                            placeholder="Add soft skill"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    if (softSkillInput.trim()) {
                                                        const current = form.getValues("softSkills") || [];
                                                        if (!current.includes(softSkillInput.trim())) {
                                                            form.setValue("softSkills", [...current, softSkillInput.trim()]);
                                                        }
                                                        setSoftSkillInput("");
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            onClick={() => {
                                                if (softSkillInput.trim()) {
                                                    const current = form.getValues("softSkills") || [];
                                                    if (!current.includes(softSkillInput.trim())) {
                                                        form.setValue("softSkills", [...current, softSkillInput.trim()]);
                                                    }
                                                    setSoftSkillInput("");
                                                }
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Projects */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-blue-600" />
                                        Projects
                                    </CardTitle>
                                    {isEditing && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => appendProject({ title: "", description: "", techStack: [], url: "" })}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        {projectFields.map((field, index) => (
                                            <div key={field.id} className="space-y-4 border p-4 rounded-md">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-medium">Project {index + 1}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeProject(index)}
                                                        className="h-8 w-8 p-0 text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name={`projects.${index}.title`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Project Title" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`projects.${index}.description`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <textarea
                                                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                                    placeholder="Description"
                                                                    {...field}
                                                                    value={field.value ?? ""}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="grid grid-cols-1 gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`projects.${index}.url`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Project URL (optional)" {...field} value={field.value ?? ""} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {/* Tech Stack Input - simplified as comma separated string for now or just array? 
                                                         Schema says string array. Providing a helper to convert. 
                                                         Or we can use a multi-select. 
                                                         For MVP, let's use a text input and split by comma.
                                                      */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`projects.${index}.techStack`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Tech Stack (comma separated)"
                                                                        value={field.value?.join(", ") || ""}
                                                                        onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    profile.projects && profile.projects.length > 0 ? (
                                        profile.projects.map((project: any, i: number) => (
                                            <div key={i}>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold">{project.title}</h3>
                                                    {project.url && (
                                                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            <Link2 className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {project.techStack?.map((t: string, ti: number) => (
                                                        <span key={ti} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{t}</span>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                                    {project.description}
                                                </p>
                                                {i < (profile.projects?.length || 0) - 1 && <Separator className="my-4" />}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No projects added yet.
                                        </p>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Form>
        </div>
    );
}
