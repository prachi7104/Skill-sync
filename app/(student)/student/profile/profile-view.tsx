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
    Upload
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { studentProfileSchema, type StudentProfileInput } from "@/lib/validations/student-profile";
import { computeCompleteness } from "@/lib/profile/completeness";
import type { Skill, Project, WorkExperience, Certification, CodingProfile } from "@/lib/db/schema";

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
    };
}

export default function ProfileView({ user, profile }: ProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    // Compute profile completeness
    const { score, missing } = computeCompleteness(profile);

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
            // Array fields
            skills: profile.skills || [],
            projects: profile.projects || [],
            codingProfiles: profile.codingProfiles || [],
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

    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        if (file.size > 100 * 1024) {
            toast.error("Resume must be less than 100KB");
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Only PDF and DOCX files are allowed");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/student/resume", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Upload failed");
            }

            toast.success("Your resume is being processed. Refresh shortly to see extracted data.");

            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Upload failed");
        } finally {
            setIsUploading(false);
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
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Joined {user.createdAt}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 items-end">
                    <Card className="w-full md:w-64">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Profile Completeness
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span>Progress</span>
                                        <span>{score}%</span>
                                    </div>
                                    <Progress value={score} className="h-2" />
                                </div>

                                {missing.length > 0 && !profile.resumeUrl ? (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground">To improve:</p>
                                        <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-3">
                                            {missing.slice(0, 3).map((msg, i) => (
                                                <li key={i}>{msg}</li>
                                            ))}
                                            {missing.length > 3 && (
                                                <li>+ {missing.length - 3} more...</li>
                                            )}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <Trophy className="h-3 w-3" />
                                        {profile.resumeUrl ? "Profile detailed via Resume" : "Excellent! Profile complete."}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

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
                                    Upload your resume to automatically extract skills and experience.
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
                                    <div>
                                        <Input
                                            type="file"
                                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                            className="cursor-pointer"
                                        />
                                        {isUploading && (
                                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin" /> Uploading and processing...
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            * Uploading a new resume will automatically process and update your profile data.
                                        </p>
                                    </div>
                                )}


                            </CardContent>
                        </Card>

                        {/* Work Experience - Read Only */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-blue-600" />
                                    Work Experience
                                </CardTitle>
                                <CardDescription>Work experience updates are currently disabled.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {profile.workExperience && profile.workExperience.length > 0 ? (
                                    profile.workExperience.map((work: any, i: number) => (
                                        <div key={i} className="relative border-l-2 border-muted pl-4">
                                            <h3 className="font-semibold">{work.role}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {work.company} • {work.startDate} - {work.endDate || "Present"}
                                            </p>
                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                                {work.description}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        No work experience added yet.
                                    </p>
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
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`projects.${index}.url`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Project URL (optional)" {...field} />
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
