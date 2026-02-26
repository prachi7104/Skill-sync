"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { computeCompleteness } from "@/lib/profile/completeness";
import { FileText, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getOnboardingRoute, TOTAL_ONBOARDING_STEPS } from "@/lib/onboarding/config";

export default function StudentDashboard() {
    const { user, student, isLoading } = useStudent();
    const router = useRouter();
    const [stats, setStats] = useState({ activeDrivesCount: 0, rankingsCount: 0 });

    useEffect(() => {
        if (!isLoading && student) {
            if (student.onboardingStep < TOTAL_ONBOARDING_STEPS) {
                router.push(getOnboardingRoute(student.onboardingStep));
            }
        }
    }, [isLoading, student, router]);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/student/dashboard/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        }
        if (student) {
            fetchStats();
        }
    }, [student]);

    if (isLoading || !student || !user) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    const { score, missing } = computeCompleteness(student);
    const sandboxUsageToday = student.sandboxUsageToday ?? 0;
    const profileCompleteness = score;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user.name}. Here&apos;s what&apos;s happening with your profile.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Quick Stats - Real Data */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Placement Drives</CardTitle>
                        <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeDrivesCount}</div>
                        <p className="text-xs text-muted-foreground">Active now</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rankings</CardTitle>
                        <SendIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rankingsCount}</div>
                        <p className="text-xs text-muted-foreground">Received</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Score</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profileCompleteness}%</div>
                        <p className="text-xs text-muted-foreground">Completeness</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sandbox Usage</CardTitle>
                        <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sandboxUsageToday}</div>
                        <p className="text-xs text-muted-foreground">Used today</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Main Content Area */}
                <div className="md:col-span-4 space-y-6">
                    {/* Resume Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Resume Status
                            </CardTitle>
                            <CardDescription>Your current resume on file.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {student.resumeUrl ? (
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm truncate max-w-[200px]">{student.resumeFilename}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Uploaded {student.resumeUploadedAt ? format(new Date(student.resumeUploadedAt), "MMM d, yyyy") : "Unknown"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={student.resumeUrl} target="_blank">View</a>
                                        </Button>
                                        <Button variant="secondary" size="sm" asChild>
                                            <Link href="/student/profile">Update</Link>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/5">
                                    <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                                    <p className="font-medium text-sm">No Resume Uploaded</p>
                                    <Button variant="link" size="sm" asChild>
                                        <Link href="/student/onboarding/resume">Upload Now</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section Checklist Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Sections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <SectionStatus label="Skills" count={student.skills?.length || 0} min={5} />
                                <SectionStatus label="Projects" count={student.projects?.length || 0} min={2} />
                                <SectionStatus label="Work Exp" count={student.workExperience?.length || 0} min={0} optional />
                                <SectionStatus label="Certifications" count={student.certifications?.length || 0} min={0} optional />
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button asChild>
                                    <Link href="/student/profile">
                                        Manage Full Profile <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <Sparkles className="h-5 w-5" /> Completeness Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{score}% Completed</span>
                                </div>
                                <Progress value={score} className="h-3" />
                            </div>

                            {missing.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Action Items:</p>
                                    <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                                        {missing.slice(0, 5).map((msg, i) => (
                                            <li key={i}>{msg}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-green-600 font-medium">
                                    Your profile is robust!
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Simple Helper Components for Stats
function BriefcaseIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}

function SendIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
        </svg>
    )
}

function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </svg>
    )
}

function EyeIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function SectionStatus({ label, count, min, optional }: { label: string, count: number, min: number, optional?: boolean }) {
    const isGood = count >= min;
    return (
        <div className="flex items-center justify-between p-3 border rounded bg-background">
            <div className="flex flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{optional ? "Optional" : `Min: ${min}`}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{count}</span>
                <Badge variant={isGood ? (optional && count === 0 ? "secondary" : "default") : "destructive"} className="h-5 px-1.5 pointer-events-none">
                    {isGood ? <CheckIcon className="h-3 w-3" /> : "!"}
                </Badge>
            </div>
        </div>
    )
}

function CheckIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}


