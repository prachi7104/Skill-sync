"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { updateOnboardingStep, updateAcademics } from "@/app/actions/onboarding";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { toast } from "sonner";

interface AcademicsData {
    tenthPercentage: number | null;
    twelfthPercentage: number | null;
    cgpa: number | null;
    semester: number | null;
    branch: string | null;
    batchYear: number | null;
}

const BRANCHES = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Other",
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const BATCH_YEARS = [2025, 2026, 2027, 2028, 2029];

export default function OnboardingAcademicsClient({
    initialData
}: {
    initialData: AcademicsData
}) {
    const router = useRouter();
    const { refresh } = useStudent();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        tenthPercentage: initialData.tenthPercentage?.toString() || "",
        twelfthPercentage: initialData.twelfthPercentage?.toString() || "",
        cgpa: initialData.cgpa?.toString() || "",
        semester: initialData.semester?.toString() || "",
        branch: initialData.branch || "",
        batchYear: initialData.batchYear?.toString() || "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            // Validate percentages and CGPA (all optional but validate if provided)
            const tenth = formData.tenthPercentage ? parseFloat(formData.tenthPercentage) : null;
            const twelfth = formData.twelfthPercentage ? parseFloat(formData.twelfthPercentage) : null;
            const cgpa = formData.cgpa ? parseFloat(formData.cgpa) : null;
            const semester = formData.semester ? parseInt(formData.semester) : null;
            const batchYear = formData.batchYear ? parseInt(formData.batchYear) : null;
            const branch = formData.branch || null;

            // Validate ranges only if values are provided
            if (tenth !== null && (tenth < 0 || tenth > 100)) {
                throw new Error("10th percentage must be between 0 and 100");
            }
            if (twelfth !== null && (twelfth < 0 || twelfth > 100)) {
                throw new Error("12th percentage must be between 0 and 100");
            }
            if (cgpa !== null && (cgpa < 0 || cgpa > 10)) {
                throw new Error("CGPA must be between 0 and 10");
            }

            await updateAcademics({
                tenthPercentage: tenth,
                twelfthPercentage: twelfth,
                cgpa,
                semester,
                branch,
                batchYear,
            });

            await updateOnboardingStep(4);
            await refresh();
            router.push("/student/onboarding/skills");
        } catch (error: any) {
            toast.error(error.message || "Failed to save academic details");
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingStep(4);
            await refresh();
            router.push("/student/onboarding/skills");
        } catch (error: any) {
            toast.error(error.message || "Failed to proceed");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Academic Roots</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Tell us about your educational background. This helps match you with relevant opportunities.
                </p>
            </div>

            <div className="space-y-4">
                {/* 10th & 12th */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tenth">10th Percentage</Label>
                        <Input
                            id="tenth"
                            type="number"
                            placeholder="e.g., 85.5"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.tenthPercentage}
                            onChange={(e) => handleChange("tenthPercentage", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="twelfth">12th Percentage</Label>
                        <Input
                            id="twelfth"
                            type="number"
                            placeholder="e.g., 82.0"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.twelfthPercentage}
                            onChange={(e) => handleChange("twelfthPercentage", e.target.value)}
                        />
                    </div>
                </div>

                {/* Current Degree */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3">Current Degree</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="branch">Branch / Specialization</Label>
                            <Select
                                value={formData.branch}
                                onValueChange={(value) => handleChange("branch", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BRANCHES.map((branch) => (
                                        <SelectItem key={branch} value={branch}>
                                            {branch}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batchYear">Batch Year</Label>
                            <Select
                                value={formData.batchYear}
                                onValueChange={(value) => handleChange("batchYear", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Graduation year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BATCH_YEARS.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="cgpa">Current CGPA</Label>
                            <Input
                                id="cgpa"
                                type="number"
                                placeholder="e.g., 8.5"
                                min="0"
                                max="10"
                                step="0.01"
                                value={formData.cgpa}
                                onChange={(e) => handleChange("cgpa", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="semester">Current Semester</Label>
                            <Select
                                value={formData.semester}
                                onValueChange={(value) => handleChange("semester", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEMESTERS.map((sem) => (
                                        <SelectItem key={sem} value={sem.toString()}>
                                            Semester {sem}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/basic")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground italic hidden md:block">
                        All fields are optional during onboarding
                    </p>
                    <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                        Skip
                    </Button>
                    <Button onClick={handleContinue} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
