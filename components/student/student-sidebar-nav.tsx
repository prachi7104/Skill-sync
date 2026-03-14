"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle, Briefcase, Box } from "lucide-react";
import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/profile", label: "My Profile", icon: UserCircle },
  { href: "/student/drives", label: "Drives", icon: Briefcase },
  { href: "/student/sandbox", label: "AI Sandbox", icon: Box },
];

export default function StudentSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {studentLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "group flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm",
              isActive
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <link.icon
              className={cn(
                "w-5 h-5 transition-all",
                isActive ? "text-indigo-400" : "opacity-60 group-hover:opacity-100"
              )}
            />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
