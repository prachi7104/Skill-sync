"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface OnboardingBasicClientProps {
    userName: string;
    userEmail: string;
    initialRollNo: string;
    initialSapId: string;
    initialPhone: string;
    initialLinkedin: string;
}

export default function OnboardingBasicClient({
    userName,
    userEmail,
    initialRollNo,
    initialSapId,
    initialPhone,
    initialLinkedin,
}: OnboardingBasicClientProps) {
    const router = useRouter();
    const { refresh } = useStudent();
    const [rollNo, setRollNo] = useState(initialRollNo);
    const [sapId, setSapId] = useState(initialSapId);
    const [phone, setPhone] = useState(initialPhone);
    const [linkedin, setLinkedin] = useState(initialLinkedin);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onContinue = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Client-side validation for required fields only
            const rollNoRegex = /^R\d{10}$/;
            const sapIdRegex = /^\d{9}$/;

            if (!rollNo) throw new Error("Roll Number is required");
            if (!sapId) throw new Error("SAP ID is required");
            if (!rollNoRegex.test(rollNo)) throw new Error("Roll Number must be 'R' followed by 10 digits (e.g., R2142233333)");
            if (!sapIdRegex.test(sapId)) throw new Error("SAP ID must be exactly 9 digits (e.g., 500123456)");

            // Save roll number, SAP ID, and optional fields
            const res = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rollNo,
                    sapId,
                    phone: phone || null,
                    linkedin: linkedin || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                // Handle Zod errors (array of objects)
                if (data.errors && Array.isArray(data.errors)) {
                    const firstError = data.errors[0];
                    throw new Error(firstError.message || "Invalid input");
                }
                throw new Error(data.message || "Failed to save information");
            }

            // Update onboarding step
            await updateOnboardingStep(3);
            await refresh();
            router.push("/student/onboarding/academics");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                <p className="text-sm text-muted-foreground">
                    Confirm your details and enter your Roll Number and SAP ID.
                </p>
            </div>

            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={userName} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">From university login</p>
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={userEmail} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">From university login</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rollNo">Roll Number *</Label>
                    <Input
                        id="rollNo"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="e.g., R2142233333"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sapId">SAP ID *</Label>
                    <Input
                        id="sapId"
                        value={sapId}
                        onChange={(e) => setSapId(e.target.value)}
                        placeholder="e.g., 500123456"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g., +919876543210"
                    />
                    {initialPhone && <p className="text-xs text-green-600">Auto-filled from resume</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
                    <Input
                        id="linkedin"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="e.g., linkedin.com/in/yourname"
                    />
                    {initialLinkedin && <p className="text-xs text-green-600">Auto-filled from resume</p>}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => router.push("/student/onboarding/resume")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
