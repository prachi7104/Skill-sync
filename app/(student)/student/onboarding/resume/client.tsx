"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, UploadCloud } from "lucide-react";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { extractTextFromResume, cleanResumeText } from "@/lib/resume/text-extractor";

export default function OnboardingResumeClient() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        setIsUploading(true);

        try {
            // 1. Extract text client-side (pdfjs-dist for PDF, mammoth for DOCX)
            const rawText = await extractTextFromResume(file);
            const resumeText = cleanResumeText(rawText);

            if (!resumeText || resumeText.length < 20) {
                throw new Error("Could not extract meaningful text from this file. Please try a different resume.");
            }

            // 2. Upload file + extracted text to server
            const formData = new FormData();
            formData.append("file", file);
            formData.append("resumeText", resumeText);

            const res = await fetch("/api/student/resume", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Upload failed");
            }

            const data = await res.json();
            setUploadedUrl(data.url);
            toast.success("Resume uploaded & parsed successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to process resume");
        } finally {
            setIsUploading(false);
        }
    };

    const [isLoadingNext, setIsLoadingNext] = useState(false);

    const handleContinue = async () => {
        setIsLoadingNext(true);
        try {
            await updateOnboardingStep(2);
            router.push("/student/onboarding/basic");
        } catch (error) {
            toast.error("Failed to proceed");
            setIsLoadingNext(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Upload Your Resume</h2>
                <p className="text-sm text-muted-foreground">
                    Start by uploading your resume. We'll automatically extract your skills, projects, and experience to pre-fill your profile — saving you time!
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Why upload first?</strong> Your resume contains valuable information. We'll parse it and auto-fill your skills and projects, so you just need to review and adjust.
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>

                {uploadedUrl ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600 justify-center">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Upload Successful</span>
                        </div>
                        <a href={uploadedUrl} target="_blank" className="text-xs text-primary hover:underline block">
                            View Uploaded File
                        </a>
                        <p className="text-xs text-muted-foreground">
                            Text extracted and parsed.
                        </p>
                        <div className="pt-4">
                            <Label htmlFor="re-upload" className="cursor-pointer text-xs text-muted-foreground hover:text-foreground underline">
                                Upload different file
                            </Label>
                            <Input
                                id="re-upload"
                                type="file"
                                accept=".pdf,.docx,application/pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 w-full max-w-xs">
                        <Label htmlFor="resume-upload" className="cursor-pointer">
                            <div className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Select File"}
                            </div>
                        </Label>
                        <Input
                            id="resume-upload"
                            type="file"
                            accept=".pdf,.docx,application/pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <p className="text-xs text-muted-foreground">Supported: PDF, DOCX</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/welcome")} disabled={isUploading || isLoadingNext}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground italic hidden md:block">
                        {uploadedUrl ? "Ready to proceed." : "Upload a resume for best autofill experience"}
                    </p>
                    {!uploadedUrl && (
                        <Button variant="ghost" onClick={handleContinue} disabled={isUploading || isLoadingNext}>
                            Skip
                        </Button>
                    )}
                    <Button onClick={handleContinue} disabled={isUploading || isLoadingNext}>
                        {isLoadingNext && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
