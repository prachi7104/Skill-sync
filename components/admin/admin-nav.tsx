"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, Briefcase, Compass, LibraryBig, BarChart, CalendarDays, Users, GraduationCap, Bot, Settings } from "lucide-react";

const links = [
  { href: "/admin/health", label: "System Health", icon: Activity },
  { href: "/admin/drives", label: "All Drives", icon: Briefcase },
  { href: "/admin/experiences", label: "Experiences", icon: Compass },
  { href: "/admin/resources", label: "Resources", icon: LibraryBig },
  { href: "/admin/amcat", label: "AMCAT", icon: BarChart },
  { href: "/admin/seasons", label: "Seasons", icon: CalendarDays },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/ai-models", label: "AI Models", icon: Bot },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-2">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href}
            className={cn(
              "group flex items-center gap-3 px-4 py-3.5 rounded-md transition-all duration-300 font-semibold text-sm",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <link.icon className={cn(
              "w-5 h-5 transition-all",
              isActive ? "text-primary" : "opacity-60 group-hover:opacity-100"
            )} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
