
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DetailedAnalysisResult } from "@/lib/ats/detailed-analysis";

export default function DetailedSandboxPage() {
    const [jdText, setJdText] = useState("");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DetailedAnalysisResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File input must be less than 5MB");
                return;
            }
            if (file.type !== "application/pdf" && !file.type.includes("wordprocessing")) {
                toast.error("Only PDF and DOCX files are supported");
                return;
            }
            setResumeFile(file);
        }
    };

    const handleAnalyze = async () => {
        if (!resumeFile || jdText.trim().length < 50) {
            toast.error("Please provide both a resume and a detailed Job Description");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("resume", resumeFile);
            formData.append("jdText", jdText);

            const res = await fetch("/api/student/sandbox/detailed", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            setResult(data.data as DetailedAnalysisResult);
            toast.success("Analysis complete!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    function getScoreColor(score: number): string {
        if (score >= 75) return "text-green-600";
        if (score >= 50) return "text-yellow-600";
        return "text-red-600";
    }

    return (
        <div className="space-y-6">

            <div className="grid gap-6 md:grid-cols-2">
                {/* Inputs */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Upload Resume</CardTitle>
                            <CardDescription>PDF or DOCX (Max 5MB)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer">
                                    <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${resumeFile ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"}`}>
                                        {resumeFile ? (
                                            <>
                                                <FileText className="h-8 w-8 text-green-600 mb-2" />
                                                <span className="text-sm font-medium text-green-700 truncate max-w-[200px]">{resumeFile.name}</span>
                                                <span className="text-xs text-green-600 mt-1">Click to change</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-600">Click to upload</span>
                                            </>
                                        )}
                                        <Input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>2. Job Description</CardTitle>
                            <CardDescription>Paste the full JD text here</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Paste JD content..."
                                className="min-h-[200px]"
                                value={jdText}
                                onChange={(e) => setJdText(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Button
                        size="lg"
                        className="w-full"
                        onClick={handleAnalyze}
                        disabled={isLoading || !resumeFile || jdText.length < 50}
                    >
                        {isLoading ? "Analyzing..." : "Run Detailed Analysis"}
                    </Button>
                </div>

                {/* Results / Placeholder */}
                <div className="space-y-6">
                    {!result ? (
                        <Card className="h-full flex items-center justify-center bg-gray-50 border-dashed">
                            <CardContent className="text-center py-12">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Ready to Analyze</h3>
                                <p className="text-sm text-gray-500 max-w-sm mt-2">
                                    Upload your resume and paste a JD to see how well you are targeting the role compared to your full student profile.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* Scores */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Match Comparison</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-medium">Uploaded Resume Match</span>
                                            <span className={`text-2xl font-bold ${getScoreColor(result.resumeMatchScore)}`}>
                                                {result.resumeMatchScore}%
                                            </span>
                                        </div>
                                        <Progress value={result.resumeMatchScore} className="h-3" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Based on content found in the uploaded file.
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-medium">Potential Profile Match</span>
                                            <span className={`text-2xl font-bold ${getScoreColor(result.profileMatchScore)}`}>
                                                {result.profileMatchScore}%
                                            </span>
                                        </div>
                                        <Progress value={result.profileMatchScore} className="h-3 bg-gray-100" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Based on your full Skillsync profile data.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Missed Opportunities */}
                            <Card className="border-orange-200 bg-orange-50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        <CardTitle className="text-orange-900">Missed Opportunities</CardTitle>
                                    </div>
                                    <CardDescription className="text-orange-700">
                                        Skills present in your Profile & JD, but <b>missing</b> from your Resume.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {result.missedOpportunities.length > 0 ? (
                                        <ul className="space-y-3">
                                            {result.missedOpportunities.map((miss, idx) => (
                                                <li key={idx} className="bg-white p-3 rounded-md border border-orange-100 shadow-sm flex items-start gap-3">
                                                    <ArrowRight className="h-4 w-4 text-orange-400 mt-1 shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{miss.skill}</div>
                                                        <p className="text-xs text-gray-500 mt-0.5">{miss.reason}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-sm text-green-700 font-medium flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            Great job! Your resume includes all relevant skills from your profile.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Debug / Semantic Only if Result */}
            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500 uppercase tracking-widest">Semantic Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Resume Semantic Similarity</div>
                            <div className="text-xl font-mono">{(result.resumeSemanticScore * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Profile Semantic Similarity</div>
                            <div className="text-xl font-mono">{(result.profileSemanticScore * 100).toFixed(1)}%</div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
