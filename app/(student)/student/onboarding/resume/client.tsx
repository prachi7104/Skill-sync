"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, XCircle, UploadCloud, Sparkles } from "lucide-react";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { extractTextFromResume, cleanResumeText } from "@/lib/resume/text-extractor";

type ParseStatus = "idle" | "uploading" | "queued" | "processing" | "completed" | "failed";

export default function OnboardingResumeClient() {
    const router = useRouter();
    const { refresh } = useStudent();
    const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    // Poll for job completion
    const startPolling = useCallback((id: string) => {
        if (pollRef.current) clearInterval(pollRef.current);

        setParseStatus("processing");
        let pollCount = 0;
        const MAX_POLLS = 40; // 2 minutes max

        pollRef.current = setInterval(async () => {
            pollCount++;
            if (pollCount >= MAX_POLLS) {
                clearInterval(pollRef.current!);
                setParseStatus("failed");
                toast.error("Resume parsing timed out. You can continue and fill details manually.");
                return;
            }

            try {
                const res = await fetch(`/api/jobs/${id}`);
                if (!res.ok) return;

                const job = await res.json();

                if (job.status === "completed") {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    setParseStatus("completed");
                    // Refresh student context so subsequent steps have autofilled data
                    await refresh();
                    toast.success("Resume parsed! Your profile has been auto-filled.");
                } else if (job.status === "failed") {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    setParseStatus("failed");
                    toast.error("Resume parsing failed. You can still continue and fill fields manually.");
                }
                // else still "pending" or "processing" — keep polling
            } catch {
                // Network error — keep polling silently
            }
        }, 3000); // Poll every 3 seconds
    }, [refresh]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        setParseStatus("uploading");

        try {
            // 1. Extract text client-side
            const rawText = await extractTextFromResume(file);
            const resumeText = cleanResumeText(rawText);

            if (!resumeText || resumeText.length < 20) {
                throw new Error("Could not extract meaningful text from this file. Please try a different resume.");
            }

            // 2. Upload file + extracted text to server (Cloudinary upload happens here)
            const formData = new FormData();
            formData.append("file", file);
            formData.append("resumeText", resumeText);
            formData.append("source", "onboarding");

            const res = await fetch("/api/student/resume", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Upload failed");
            }

            const data = await res.json();
            const payload = data?.data ?? data;
            const uploaded = payload?.url ?? null;
            const jobId = payload?.jobId ?? null;
            const warnings = payload?.warnings ?? data?.warnings;

            setUploadedUrl(uploaded);

            if (Array.isArray(warnings) && warnings.length > 0) {
                toast.warning(warnings[0]);
            }

            // Immediate user feedback that upload succeeded and parsing is queued
            if (jobId) {
                toast.success("Resume uploaded. Parsing queued — we'll auto-fill your profile shortly.");
                setParseStatus("queued");
                // Start polling for AI parsing completion
                startPolling(jobId);
            } else {
                toast.success("Resume uploaded. No AI parsing was queued — you can continue to fill details manually.");
                // No job created (text too short or onboarding complete) — allow proceed anyway
                setParseStatus("completed");
            }
        } catch (error: unknown) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to process resume");
            setParseStatus("failed");
        }
    };

    const handleContinue = async () => {
        // If parsing is still running, wait for it before navigating
        if (parseStatus === "queued" || parseStatus === "processing") {
            toast.info("Waiting for resume parsing to finish...");
            return;
        }

        setIsLoadingNext(true);
        try {
            // Refresh to pick up any autofilled data from parsing
            await refresh();
            await updateOnboardingStep(2);
            router.push("/student/onboarding/basic");
        } catch {
            toast.error("Failed to proceed");
            setIsLoadingNext(false);
        }
    };

    const canContinue = parseStatus === "completed" || parseStatus === "failed";
    const isProcessing = parseStatus === "uploading" || parseStatus === "queued" || parseStatus === "processing";

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Upload Your Resume</h2>
                <p className="text-sm text-muted-foreground">
                    Start by uploading your resume. We&apos;ll use AI to extract your skills, projects, and experience — pre-filling every step so you just verify and move ahead!
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Why upload first?</strong> Our AI will parse your resume and auto-fill your entire profile. You&apos;ll just need to review and adjust — saving you 5+ minutes of manual entry.
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>

                {/* State: Processing */}
                {isProcessing && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-blue-400 justify-center">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="font-medium">
                                {parseStatus === "uploading" ? "Uploading to cloud..." : "AI is parsing your resume..."}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            This usually takes 5-15 seconds. Your skills, projects, experience, and more will be auto-filled into the next steps.
                        </p>
                        {uploadedUrl && (
                            <a href={uploadedUrl} target="_blank" className="text-xs text-primary hover:underline block">
                                View Uploaded File ↗
                            </a>
                        )}
                    </div>
                )}

                {/* State: Completed */}
                {parseStatus === "completed" && uploadedUrl && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 justify-center">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-medium">Resume Parsed & Profile Auto-Filled!</span>
                        </div>
                        <a href={uploadedUrl} target="_blank" className="text-xs text-primary hover:underline block">
                            View Uploaded File ↗
                        </a>
                        <p className="text-xs text-muted-foreground">
                            Click <strong>Continue</strong> to review your auto-filled profile.
                        </p>
                        <div className="pt-2">
                            <Label htmlFor="re-upload" className="cursor-pointer text-xs text-muted-foreground hover:text-foreground underline">
                                Upload different file
                            </Label>
                            <Input
                                id="re-upload"
                                type="file"
                                accept=".pdf,.docx,application/pdf"
                                className="hidden"
                                style={{ display: "none" }}
                                onChange={handleFileUpload}
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                )}

                {/* State: Failed */}
                {parseStatus === "failed" && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 justify-center">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="font-medium">Resume uploaded, but AI parsing had an issue</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            You can still continue and fill in your details manually.
                        </p>
                        <div className="pt-2">
                            <Label htmlFor="retry-upload" className="cursor-pointer text-xs text-primary hover:text-primary/80 underline">
                                Try uploading again
                            </Label>
                            <Input
                                id="retry-upload"
                                type="file"
                                accept=".pdf,.docx,application/pdf"
                                className="hidden"
                                style={{ display: "none" }}
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                )}

                {/* State: Idle (initial) */}
                {parseStatus === "idle" && (
                    <div className="space-y-2 w-full max-w-xs">
                        <Label htmlFor="resume-upload" className="cursor-pointer">
                            <div className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                                Select File
                            </div>
                        </Label>
                        <Input
                            id="resume-upload"
                            type="file"
                            accept=".pdf,.docx,application/pdf"
                            className="hidden"
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                        />
                        <p className="text-xs text-muted-foreground">Supported: PDF, DOCX (max 2MB)</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/welcome")} disabled={isProcessing || isLoadingNext}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    {parseStatus === "idle" && (
                        <Button variant="ghost" onClick={handleContinue} disabled={isLoadingNext}>
                            Skip
                        </Button>
                    )}
                    <Button
                        onClick={handleContinue}
                        disabled={!canContinue && parseStatus !== "idle" || isLoadingNext}
                    >
                        {isLoadingNext && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isProcessing ? "Processing..." : "Continue"}
                        {!isProcessing && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
