"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UserCircle, 
  Briefcase, 
  Box, 
  FolderOpen, 
  Plus,
  Menu, 
  X, 
  LucideIcon 
} from "lucide-react";
import SignOutButton from "./sign-out-button";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
  emoji?: string;
  exact?: boolean;
}

const ROLE_LINKS: Record<string, NavLink[]> = {
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/profile", label: "My Profile", icon: UserCircle },
    { href: "/student/drives", label: "Drives", icon: Briefcase },
    { href: "/student/sandbox", label: "AI Sandbox", icon: Box },
  ],
  faculty: [
    { href: "/faculty", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/faculty/drives", label: "My Drives", icon: FolderOpen },
    { href: "/faculty/drives/new", label: "New Drive", icon: Plus },
  ],
  admin: [
    { href: "/admin/health", label: "System Health", emoji: "⚡" },
    { href: "/admin/drives", label: "All Drives", emoji: "🎯" },
    { href: "/admin/users", label: "User Management", emoji: "👥" },
    { href: "/admin/seasons", label: "Seasons", emoji: "🗓️" },
  ],
};

export default function MobileNav({ 
  userName, 
  role = "student"
}: { 
  userName: string; 
  role?: "student" | "faculty" | "admin";
}) {
  const links = ROLE_LINKS[role] || [];
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const activeColor = "bg-accent text-accent-foreground";

  return (
    <>
      {/* Mobile hamburger button — only shows on mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden text-muted-foreground hover:text-foreground"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Overlay + Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-secondary border-r border-border z-50 flex flex-col p-6 md:hidden">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-semibold text-foreground tracking-tight">
                SkillSync
              </span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="space-y-2 flex-1">
              {links.map((link) => {
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href) && (link.href !== "/faculty" && link.href !== "/admin");
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-1.5 rounded-md font-medium text-sm transition-all",
                      isActive
                        ? activeColor
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {link.icon && <link.icon className="w-5 h-5" />}
                    {link.emoji && <span className="text-lg">{link.emoji}</span>}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-border space-y-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Signed in as</p>
              <p className="text-sm text-foreground font-medium">{userName}</p>
              <SignOutButton />
            </div>
          </div>
        </>
      )}
    </>
  );
}
