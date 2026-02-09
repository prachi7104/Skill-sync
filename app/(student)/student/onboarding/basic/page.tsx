import { requireStudentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOnboardingStep } from "@/app/actions/onboarding";
import { ArrowRight } from "lucide-react";

export default async function OnboardingBasic() {
    const { profile, user } = await requireStudentProfile();

    // Enforcement: Must be at least step 2 (after resume upload)
    if (profile.onboardingStep < 2) {
        redirect("/student/onboarding/resume");
    }

    async function onContinue() {
        "use server";
        await updateOnboardingStep(3);
        redirect("/student/onboarding/academics");
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Confirm Basic Information</h2>
                <p className="text-sm text-muted-foreground">
                    This information is verified by your university login.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={user.name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input value={profile.rollNo || "N/A"} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>SAP ID</Label>
                    <Input value={profile.sapId || "N/A"} disabled className="bg-muted" />
                </div>
            </div>

            <form action={onContinue}>
                <Button type="submit" className="w-full md:w-auto">
                    Looks Good, Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
