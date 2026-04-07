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

function deriveSapFromEmail(email: string): string | null {
  if (!email.toLowerCase().includes("stu.upes.ac.in")) return null;
  const username = email.split("@")[0].toLowerCase();
  const match = username.match(/\.(\d+)$/);
  if (!match) return null;
  const digits = match[1];
  const padded = digits.padStart(6, "0");
  const prefix = digits.length >= 6 ? "500" : "590";
  return prefix + padded;
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["student"]);
  let profile = await getStudentProfile(user.id);

  if (!profile) {
    try {
      if (user.collegeId) {
        await db.insert(students).values({ id: user.id, collegeId: user.collegeId })
          .onConflictDoNothing();
      }
      const freshProfile = await getStudentProfile(user.id);
      if (freshProfile && !freshProfile.sapId && user.email) {
        const sapId = deriveSapFromEmail(user.email);
        if (sapId) {
          await db.update(students)
            .set({ sapId, updatedAt: new Date() })
            .where(eq(students.id, user.id))
            .catch(() => {});
        }
      }
      profile = await getStudentProfile(user.id);
    } catch (e) {
      console.error("[StudentLayout] Failed to auto-create profile:", e);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-2xl">⚠️</p>
          <h1 className="text-base font-semibold text-foreground">Account Setup Required</h1>
          <p className="text-sm text-muted-foreground">
            Your student profile could not be created. Please contact your placement coordinator.
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  const onboardingRequired =
    !profile?.sapId || !profile?.rollNo || !profile?.cgpa ||
    !profile?.branch || !profile?.batchYear ||
    typeof profile?.tenthPercentage !== "number" ||
    typeof profile?.twelfthPercentage !== "number";

  const requiredCount = [
    !!profile?.sapId, !!profile?.rollNo, !!profile?.cgpa,
    !!profile?.branch, !!profile?.batchYear,
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
      <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">

        {/* Top bar — compact, border only */}
        <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              SkillSync
            </span>
            <span className="text-xs text-muted-foreground hidden md:block">/ Student</span>
          </div>
          <div className="flex items-center gap-3">
            <MobileNav userName={user.name!} />
            <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[160px]">
              {user.name}
            </span>
            <SignOutButton />
          </div>
        </header>

        <OnboardingBanner />

        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar — Notion style */}
          <aside className="w-60 border-r border-border bg-secondary flex-col hidden md:flex shrink-0 overflow-y-auto">
            <div className="flex-1 px-2 py-4">
              <StudentSidebarNav />
            </div>
            <div className="px-3 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground/60 truncate">{user.email}</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>

        </div>
      </div>
    </StudentProvider>
  );
}