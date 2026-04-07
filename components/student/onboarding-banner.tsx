"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudent } from "@/app/(student)/providers/student-provider";

export default function OnboardingBanner() {
  const pathname = usePathname();
  const { onboardingRequired } = useStudent();

  if (!onboardingRequired || pathname.startsWith("/student/onboarding")) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-6 py-2.5 flex items-center justify-between gap-4">
      <p className="text-xs text-amber-800 dark:text-amber-300">
        Complete your profile to unlock all features — drives, rankings, and AI sandbox.
      </p>
      <Link href="/student/onboarding" className="text-xs font-medium text-amber-800 dark:text-amber-300 underline whitespace-nowrap">
        Complete setup
      </Link>
    </div>
  );
}
