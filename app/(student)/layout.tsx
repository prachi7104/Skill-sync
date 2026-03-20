export const dynamic = "force-dynamic";

import { requireRole, getStudentProfile } from "@/lib/auth/helpers";
import SignOutButton from "@/components/shared/sign-out-button";
import MobileNav from "@/components/shared/mobile-nav";
import { StudentProvider } from "@/app/(student)/providers/student-provider";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import StudentSidebarNav from "@/components/student/student-sidebar-nav";
import OnboardingBanner from "@/components/student/onboarding-banner";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireRole(["student"]);
    let profile = await getStudentProfile(user.id);

    if (!profile) {
        if (!user.collegeId) {
            console.error("[StudentLayout] Cannot create student profile: user has no collegeId");
        } else {
            try {
                await db.insert(students).values({ 
                  id: user.id,
                  collegeId: user.collegeId,
                }).onConflictDoNothing();
                profile = await getStudentProfile(user.id);
            } catch (e) {
                console.error("[StudentLayout] Failed to auto-create profile:", e);
            }
        }
    }

    // Derive and store SAP ID if not set
    if (profile && !profile.sapId) {
        const { deriveSapFromEmailPublic } = await import("@/lib/auth/derive-sap");
        const derivedSap = deriveSapFromEmailPublic(user.email);
        if (derivedSap) {
            await db.update(students)
                .set({ sapId: derivedSap, updatedAt: new Date() })
                .where(eq(students.id, user.id))
                .catch(() => {});  // non-fatal
            // Refresh profile to include sapId
            profile = await getStudentProfile(user.id);
        }
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-md space-y-4 p-8">
                    <div className="text-4xl">⚠️</div>
                    <h1 className="text-xl font-bold text-white">Profile Setup Required</h1>
                    <p className="text-slate-400 text-sm">
                        Your account exists but your student profile couldn&apos;t be created.
                        This usually means your college hasn&apos;t been configured yet.
                    </p>
                    <p className="text-xs text-slate-600 font-mono">
                        Error: college_id is null — contact your placement coordinator
                    </p>
                    <div className="pt-4">
                        <SignOutButton />
                    </div>
                </div>
            </div>
        );
    }

    const onboardingRequired = !profile?.sapId ||
        !profile?.rollNo ||
        !profile?.cgpa ||
        !profile?.branch ||
        !profile?.batchYear ||
        typeof profile?.tenthPercentage !== "number" ||
        typeof profile?.twelfthPercentage !== "number";

    const requiredCount = [
        !!profile?.sapId,
        !!profile?.rollNo,
        !!profile?.cgpa,
        !!profile?.branch,
        !!profile?.batchYear,
        typeof profile?.tenthPercentage === "number",
        typeof profile?.twelfthPercentage === "number",
    ].filter(Boolean).length;
    const onboardingProgress = Math.round((requiredCount / 7) * 100);

    return (
        <StudentProvider
            initialStudent={profile}
            initialUser={user}
            onboardingRequired={onboardingRequired}
            onboardingProgress={onboardingProgress}
        >
            {/* Soft Dark Canvas using Tailwind Slate */}
            <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 selection:bg-indigo-500/30">
                
                {/* Premium Glassmorphic Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 sticky top-0 z-50">
                    <div className="flex items-center">
                        <h1 className="text-xl font-black tracking-tight text-white select-none">
                            Skill<span className="text-indigo-500">Sync.</span>
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <MobileNav userName={user.name!} />
                        <div className="text-sm font-medium text-slate-300 hidden md:block">
                            {user.name} <span className="text-slate-500 font-normal ml-1">(student)</span>
                        </div>
                        <SignOutButton />
                    </div>
                </header>

                <OnboardingBanner />

                <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
                    
                    {/* Ambient Background Glow */}
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0" />

                    {/* Lighter Slate Sidebar for Depth */}
                    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 hidden md:block shrink-0 z-10">
                        <div className="mb-8 px-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                Student Menu
                            </h2>
                        </div>
                        <StudentSidebarNav />
                    </aside>

                    {/* Main Scrollable Content Area */}
                    <main className="flex-1 overflow-y-auto bg-transparent relative z-10">
                        {children}
                    </main>
                </div>
            </div>
        </StudentProvider>
    );
}