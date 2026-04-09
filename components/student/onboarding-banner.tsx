"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useStudent } from "@/app/(student)/providers/student-provider";

export default function OnboardingBanner() {
  const pathname = usePathname();
  const { onboardingRequired, onboardingProgress } = useStudent();

  if (!onboardingRequired || pathname.startsWith("/student/onboarding")) return null;

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-6 py-3 flex items-center gap-4 shrink-0">
      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-foreground truncate">
            Complete your profile to unlock Sandbox, Rankings &amp; Drives
          </span>
          <span className="text-xs text-warning ml-2 shrink-0">{onboardingProgress}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-warning rounded-full transition-all duration-500"
            style={{ width: `${onboardingProgress}%` }}
          />
        </div>
      </div>
      <Link
        href="/student/onboarding"
        className="text-xs font-bold text-warning hover:text-warning/80 whitespace-nowrap ml-2"
      >
        Continue setup &rarr;
      </Link>
    </div>
  );
}
