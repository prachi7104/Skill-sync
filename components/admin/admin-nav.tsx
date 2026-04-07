"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity, Target, Compass, BookOpen, BarChart2,
  Calendar, Users, GraduationCap, Cpu, Settings
} from "lucide-react";

const links = [
  { href: "/admin/health",     label: "System Health",   icon: Activity },
  { href: "/admin/drives",     label: "All Drives",      icon: Target },
  { href: "/admin/experiences",label: "Experiences",     icon: Compass },
  { href: "/admin/resources",  label: "Resources",       icon: BookOpen },
  { href: "/admin/amcat",      label: "AMCAT",           icon: BarChart2 },
  { href: "/admin/seasons",    label: "Seasons",         icon: Calendar },
  { href: "/admin/users",      label: "User Management", icon: Users },
  { href: "/admin/students",   label: "Students",        icon: GraduationCap },
  { href: "/admin/ai-models",  label: "AI Models",       icon: Cpu },
  { href: "/admin/settings",   label: "Settings",        icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <link.icon className="w-4 h-4 shrink-0 opacity-70" strokeWidth={1.5} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
