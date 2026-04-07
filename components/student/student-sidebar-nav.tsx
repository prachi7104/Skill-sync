"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, UserCircle, Briefcase, Box, Settings,
  Trophy, Building2, LibraryBig, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/student/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/student/profile",      label: "My Profile",   icon: UserCircle },
  { href: "/student/drives",       label: "Drives",       icon: Briefcase },
  { href: "/student/companies",    label: "Companies",    icon: Building2 },
  { href: "/student/resources",    label: "Resources",    icon: LibraryBig },
  { href: "/student/career-coach", label: "Career Coach", icon: Sparkles },
  { href: "/student/leaderboard",  label: "Leaderboard",  icon: Trophy },
  { href: "/student/sandbox",      label: "AI Sandbox",   icon: Box },
  { href: "/student/settings",     label: "Settings",     icon: Settings },
];

export default function StudentSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { onboardingRequired } = useStudent();

  return (
    <nav className="space-y-0.5">
      {studentLinks.map((link) => {
        const isActive  = pathname.startsWith(link.href);
        const isBlocked = onboardingRequired && link.href !== "/student/onboarding";

        return (
          <button
            key={link.href}
            type="button"
            onClick={() => {
              if (isBlocked) {
                toast.info("Complete your profile setup first", {
                  description: "Fill in your SAP ID, roll number, and academic details.",
                  action: { label: "Go to Onboarding", onClick: () => router.push("/student/onboarding") },
                });
                return;
              }
              router.push(link.href);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors text-left",
              isActive && !isBlocked
                ? "bg-accent text-accent-foreground font-medium"
                : isBlocked
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <link.icon
              className={cn("w-4 h-4 shrink-0", isActive && !isBlocked ? "opacity-100" : "opacity-70")}
              strokeWidth={1.5}
            />
            <span>{link.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
