export const dynamic = "force-dynamic";

import { requireRole, getStudentProfile } from "@/lib/auth/helpers";
import Link from "next/link";
import SignOutButton from "@/components/shared/sign-out-button";
import { StudentProvider } from "@/app/(student)/providers/student-provider";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import StudentSidebarNav from "@/components/student/student-sidebar-nav";
import SidebarShell from "@/components/shared/sidebar-shell";
import MobileNavToggle from "@/components/shared/mobile-nav-toggle";
import MobileSidebarOverlay from "@/components/shared/mobile-sidebar-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { TriangleAlert } from "lucide-react";
import BottomTabBar from "@/components/shared/bottom-tab-bar";
import { computeOnboardingProgress } from "@/lib/utils/onboarding";
import { deriveSapFromEmailPublic } from "@/lib/auth/derive-sap";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireRole(["student"]);
    let profile = await getStudentProfile(user.id);

    if (!profile) {
        try {
            if (user.collegeId) {
                const sapId = user.email ? deriveSapFromEmailPublic(user.email) : null;
                const verificationStatus = sapId ? "auto_verified" : "unverified";

                await db.insert(students).values({
                    id: user.id,
                    collegeId: user.collegeId,
                    sapId,
                    verificationStatus,
                    sapIdLocked: sapId ? true : false,
                } as any).onConflictDoNothing();

                const freshProfile = await getStudentProfile(user.id);
                if (freshProfile && !freshProfile.sapId && sapId) {
                    await db.update(students)
                        .set({
                            sapId,
                            verificationStatus: "auto_verified",
                            sapIdLocked: true,
                            updatedAt: new Date(),
                        } as any)
                        .where(eq(students.id, user.id))
                        .catch(() => {});
                }

                profile = freshProfile ?? await getStudentProfile(user.id);
            }
        } catch (e) {
            console.error("[StudentLayout] Failed to auto-create profile:", e);
        }
    }

    if (!profile) {
        return (
            <div className='min-h-screen bg-background flex items-center justify-center p-8'>
                <div className='text-center space-y-4 max-w-md'>
                    <div className='flex justify-center'>
                        <TriangleAlert size={40} className='text-warning' />
                    </div>
                    <h1 className='text-lg font-bold text-foreground'>Account Setup Required</h1>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                        Your student profile could not be created. Your college may not be configured yet.
                        Please contact your placement coordinator.
                    </p>
                    <p className='text-xs font-mono text-muted-foreground bg-muted px-3 py-2 rounded-md inline-block'>
                        Error: college_id is null — admin action required
                    </p>
                    <SignOutButton />
                </div>
            </div>
        );
    }

    const { progress: onboardingProgress, onboardingRequired } = computeOnboardingProgress(profile);

    return (
        <StudentProvider
            initialStudent={profile}
            initialUser={user}
            onboardingRequired={onboardingRequired}
            onboardingProgress={onboardingProgress}
        >
            <div className='h-screen bg-background flex flex-col font-sans text-foreground antialiased'>

                {/* ── Header ── */}
                <header className='h-14 shrink-0 sticky top-0 z-50 header-glass flex items-center justify-between px-4 sm:px-6'>
                    <div className='flex items-center gap-3'>
                        <MobileNavToggle />
                        <Link
                            href='/student/dashboard'
                            className='font-sans text-lg font-black tracking-tight text-foreground select-none hover:text-primary transition-colors duration-150'
                        >
                            Skill<span className='text-primary'>Sync</span>
                        </Link>
                    </div>
                    <div className='flex items-center gap-2 sm:gap-3'>
                        <span className='hidden md:block text-[13px] font-medium text-muted-foreground'>
                            {user.name}
                            <span className='text-primary/60 font-normal ml-1'>(student)</span>
                        </span>
                        <ThemeToggle />
                        <SignOutButton />
                    </div>
                </header>

                {/* ── Body ── */}
                <div className='flex flex-1 overflow-hidden'>

                    {/* Sidebar slot */}
                    <SidebarShell label='Student Menu'>
                        <StudentSidebarNav />
                    </SidebarShell>

                    {/* Mobile overlay sidebar */}
                    <MobileSidebarOverlay label='Student Menu'>
                        <StudentSidebarNav />
                    </MobileSidebarOverlay>

                    {/* Main scrollable content */}
                    <main className='flex-1 overflow-y-auto'>
                        <div className='px-4 sm:px-6 py-6 md:pb-6 pb-[calc(56px+max(env(safe-area-inset-bottom),8px))]'>
                            {children}
                        </div>
                    </main>

                </div>
                <BottomTabBar userRole='student' userName={user.name ?? ''} />
            </div>
        </StudentProvider>
    );
}
