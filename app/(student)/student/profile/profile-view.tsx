"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


import { Form } from "@/components/ui/form";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/validations/student-profile";
import { sanitizeProfilePayload } from "@/lib/profile/sanitize";
import { computeCompleteness } from "@/lib/profile/completeness";
import { extractTextFromResume, cleanResumeText } from "@/lib/resume/text-extractor";
import { toResumeDownloadUrl } from "@/lib/resume/download-url";

import ProfileHeader from '@/components/student/profile/profile-header';
import ProfileTabNav, { type ProfileTab } from '@/components/student/profile/profile-tab-nav';
import TabIdentity from '@/components/student/profile/tab-identity';
import TabSkills from '@/components/student/profile/tab-skills';
import TabProjects from '@/components/student/profile/tab-projects';
import TabDocs from '@/components/student/profile/tab-docs';
import { AnimatePresence, motion } from 'framer-motion';

interface StudentUser {
    name: string;
    email: string;
}

interface ProfileViewProps {
    user: StudentUser;
    profile: any;
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ProfileView({ user, profile }: ProfileViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get active tab from URL query param, default to 'identity'
    const tabFromUrl = searchParams.get('tab') as ProfileTab | null;
    const isValidTab = (tab: string | null): tab is ProfileTab => {
        return tab === 'identity' || tab === 'skills' || tab === 'projects' || tab === 'documents';
    };
    const defaultTab: ProfileTab = isValidTab(tabFromUrl) ? tabFromUrl : 'identity';

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isPollingParse, setIsPollingParse] = useState(false);
    const [parseChoiceDialogOpen, setParseChoiceDialogOpen] = useState(false);
    const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
    const [isApplyingMerge, setIsApplyingMerge] = useState(false);
    const [softSkillInput, setSoftSkillInput] = useState("");

    const { score } = computeCompleteness({
        ...profile,
        name: user.name,
        email: user.email,
    });

    const currentYear = new Date().getFullYear();
    const batchYears = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);
    const resumeDownloadUrl = profile.resumeUrl ? toResumeDownloadUrl(profile.resumeUrl) : null;
    const resumeDownloadLabel = (profile.resumeMime || "").toLowerCase().includes("pdf")
        ? "Download PDF"
        : "Download Resume";

    const form = useForm<StudentProfileInput>({
        resolver: zodResolver(studentProfileSchema),
        defaultValues: {
            rollNo: profile.rollNo || "",
            sapId: profile.sapId || "",
            branch: profile.branch || "",
            batchYear: profile.batchYear || undefined,
            cgpa: profile.cgpa || undefined,
            semester: profile.semester || undefined,
            tenthPercentage: profile.tenthPercentage || undefined,
            twelfthPercentage: profile.twelfthPercentage || undefined,
            skills: (profile.skills || []).filter((s: { name?: string }) => s.name?.trim()),
            projects: profile.projects || [],
            codingProfiles: (profile.codingProfiles || []).filter((c: { platform?: string }) => c.platform?.trim()),
            workExperience: profile.workExperience || [],
            certifications: profile.certifications || [],
            researchPapers: profile.researchPapers || [],
            achievements: profile.achievements || [],
            softSkills: profile.softSkills || [],
        },
    });

    const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: form.control, name: "skills" });
    const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control: form.control, name: "projects" });
    const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control: form.control, name: "workExperience" });
    const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control: form.control, name: "certifications" });
    const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({ control: form.control, name: "codingProfiles" });
    const { fields: researchFields, append: appendResearch, remove: removeResearch } = useFieldArray({ control: form.control, name: "researchPapers" });
    const { fields: achieveFields, append: appendAchieve, remove: removeAchieve } = useFieldArray({ control: form.control, name: "achievements" });

    const handleCancel = () => {
        form.reset(); 
        setIsEditing(false);
    };

    // Update URL when tab changes (URL-backed state)
    const handleTabChange = (tab: ProfileTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`?${params.toString()}`);
    };

    const onSubmit = async (data: StudentProfileInput) => {
        setIsLoading(true);
        try {
            const sanitized = sanitizeProfilePayload(data);
            const res = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sanitized),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload?.error || payload?.message || "Database sync failed.");
            }
            toast.success("Profile synced with master database.");
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Database sync failed.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
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
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "replace",
                    sections: {
                        skills: true,
                        projects: true,
                        workExperience: true,
                        certifications: true,
                        codingProfiles: true,
                        researchPapers: true,
                        achievements: true,
                        softSkills: true,
                        contact: true,
                        academics: false,
                    },
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.message || "Failed to sync profile from resume");
            }

            toast.success("Profile replaced from your latest resume. Academic roots were kept unchanged.");
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to sync profile from resume";
            toast.error(message);
        } finally {
            setIsApplyingMerge(false);
        }
    };

    const uploadResumeFile = async (file: File, shouldParseProfile: boolean) => {
        setIsUploading(true);
        setIsPollingParse(false);
        setParseChoiceDialogOpen(false);
        setPendingResumeFile(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("source", "profile_update");
            formData.append("parseProfile", shouldParseProfile ? "true" : "false");

            try {
                const extracted = await extractTextFromResume(file);
                const cleaned = cleanResumeText(extracted);
                if (cleaned.length >= 50) {
                    formData.append("resumeText", cleaned);
                }
            } catch {
                // Keep upload functional even if client-side extraction fails.
            }

            const response = await fetch("/api/student/resume", { method: "POST", body: formData });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload?.error || payload?.message || "Upload failed");
            }

            router.refresh();

            if (!shouldParseProfile) {
                toast.success("New master resume saved. Profile details were kept unchanged.");
                return;
            }

            toast.success("Resume uploaded. Parsing and updating your profile...");

            const jobId = typeof payload?.data?.jobId === "string" ? payload.data.jobId : null;
            if (!jobId) {
                throw new Error("Parsing could not be started. Please try again.");
            }

            setIsPollingParse(true);
            const status = await waitForParseJob(jobId);

            if (status === "completed") {
                await applyResumeSync();
                return;
            }

            if (status === "failed") {
                toast.error("Resume parsing failed. You can still keep the uploaded file.");
                return;
            }

            toast.error("Parsing is taking longer than expected. Please try syncing in a moment.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
            toast.error(message);
        } finally {
            setIsUploading(false);
            setIsPollingParse(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 5 * 1024 * 1024;
        const ALLOWED_TYPES = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (file.size > MAX_SIZE) {
            toast.error("Max file size is 5MB");
            e.currentTarget.value = "";
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Only PDF and DOCX files are supported");
            e.currentTarget.value = "";
            return;
        }

        setPendingResumeFile(file);
        setParseChoiceDialogOpen(true);
        e.currentTarget.value = "";
    };

    return (
        <>
            <Dialog open={parseChoiceDialogOpen} onOpenChange={(open) => {
                setParseChoiceDialogOpen(open);
                if (!open && !isUploading && !isPollingParse && !isApplyingMerge) {
                    setPendingResumeFile(null);
                }
            }}>
                <DialogContent className="border border-border bg-card text-foreground sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Update Profile From This Resume?</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Choose what should happen after upload. If you pick yes, we will parse and update your profile. If you pick no, we only save this as your new master resume.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
                        <button
                            type="button"
                            onClick={() => {
                                if (!pendingResumeFile) return;
                                void uploadResumeFile(pendingResumeFile, false);
                            }}
                            disabled={!pendingResumeFile || isUploading || isPollingParse || isApplyingMerge}
                            className="rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                        >
                            No, Save Resume Only
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!pendingResumeFile) return;
                                void uploadResumeFile(pendingResumeFile, true);
                            }}
                            disabled={!pendingResumeFile || isUploading || isPollingParse || isApplyingMerge}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary disabled:opacity-60"
                        >
                            Yes, Parse and Update Profile
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className='mx-auto w-full md:max-w-4xl lg:max-w-6xl animate-in space-y-3 md:space-y-4 px-0 md:px-4 py-0 md:py-6 fade-in duration-700'>
                {/* Header */}
                <ProfileHeader
                    name={user.name}
                    email={user.email}
                    sapId={profile.sapId}
                    rollNo={profile.rollNo}
                    batchYear={profile.batchYear}
                    branch={profile.branch}
                    completeness={score}
                    isEditing={isEditing}
                    isLoading={isLoading}
                    onEdit={() => setIsEditing(true)}
                    onSave={form.handleSubmit(onSubmit)}
                    onCancel={handleCancel}
                />

                {/* Tab navigation */}
                <div className='bg-transparent md:bg-card border-b md:border md:border-border rounded-none md:rounded-lg overflow-hidden'>
                    <ProfileTabNav active={defaultTab} onChange={handleTabChange} />

                    {/* Tab content */}
                    <Form {...form}>
                    <AnimatePresence mode='wait' initial={false}>
                        <motion.div
                        id={`profile-tabpanel-${defaultTab}`}
                        role='tabpanel'
                        aria-labelledby={`profile-tab-${defaultTab}`}
                        key={defaultTab}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className='p-4 md:p-6'
                        >
                        {defaultTab === 'identity' && (
                            <TabIdentity
                            form={form}
                            isEditing={isEditing}
                            profile={profile}
                            batchYears={batchYears}
                            />
                        )}
                        {defaultTab === 'skills' && (
                            <TabSkills
                            form={form}
                            isEditing={isEditing}
                            skillFields={skillFields}
                            appendSkill={appendSkill}
                            removeSkill={removeSkill}
                            softSkillInput={softSkillInput}
                            setSoftSkillInput={setSoftSkillInput}
                            profile={profile}
                            />
                        )}
                        {defaultTab === 'projects' && (
                            <TabProjects
                            form={form}
                            isEditing={isEditing}
                            projectFields={projectFields}
                            appendProject={appendProject}
                            removeProject={removeProject}
                            workFields={expFields}
                            appendWork={appendExp}
                            removeWork={removeExp}
                            profile={profile}
                            />
                        )}
                        {defaultTab === 'documents' && (
                            <TabDocs
                            form={form}
                            isEditing={isEditing}
                            resumeUrl={profile.resumeUrl}
                            resumeFilename={profile.resumeFilename}
                            resumeDownloadUrl={resumeDownloadUrl}
                            resumeDownloadLabel={resumeDownloadLabel}
                            isUploading={isUploading}
                            isPollingParse={isPollingParse}
                            onResumeFileChange={handleFileUpload}
                            certFields={certFields}
                            appendCert={appendCert}
                            removeCert={removeCert}
                            codingFields={linkFields}
                            appendCoding={appendLink}
                            removeCoding={removeLink}
                            achievementFields={achieveFields}
                            appendAchievement={appendAchieve}
                            removeAchievement={removeAchieve}
                            researchFields={researchFields}
                            appendResearch={appendResearch}
                            removeResearch={removeResearch}
                            profile={profile}
                            />
                        )}
                        </motion.div>
                    </AnimatePresence>
                    </Form>
                </div>
            </div>
        </>
    );
}