"use client";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, UserCircle, Briefcase, Box, Settings, Trophy, Building2, LibraryBig, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/profile", label: "My Profile", icon: UserCircle },
  { href: "/student/drives", label: "Drives", icon: Briefcase },
  { href: "/student/companies", label: "Companies", icon: Building2 },
  { href: "/student/resources", label: "Resources", icon: LibraryBig },
  { href: "/student/career-coach", label: "Career Coach", icon: Sparkles },
  { href: "/student/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/student/sandbox", label: "AI Sandbox", icon: Box },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

export default function StudentSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { onboardingRequired } = useStudent();

  return (
    <nav className="space-y-2">
      {studentLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);
        const isBlocked = onboardingRequired && link.href !== "/student/onboarding";
        return (
          <button
            key={link.href}
            type="button"
            onClick={() => {
              if (isBlocked) {
                toast.info("Complete your profile setup first", {
                  description: "Fill in your SAP ID, roll number, academic details, and more.",
                  action: { label: "Go to Onboarding", onClick: () => router.push("/student/onboarding") },
                });
                return;
              }
              router.push(link.href);
            }}
            className={cn(
              "group flex w-full items-center space-x-3 px-4 py-3.5 rounded-md transition-all duration-300 font-semibold text-sm text-left",
              isActive && !isBlocked
                ? "bg-primary/10 text-primary"
                : isBlocked
                  ? "text-muted-foreground cursor-not-allowed opacity-50"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <link.icon
              className={cn(
                "w-5 h-5 transition-all",
                isActive && !isBlocked ? "text-primary" : "opacity-60 group-hover:opacity-100"
              )}
            />
            <span>{link.label}</span>
            {isBlocked && <Lock className="w-3 h-3 ml-auto text-muted-foreground" />}
          </button>
        );
      })}
    </nav>
  );
}
