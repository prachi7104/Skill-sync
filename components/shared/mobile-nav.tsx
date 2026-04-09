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
  LucideIcon,
  Activity,
  Users,
  CalendarDays
} from "lucide-react";
import SignOutButton from "./sign-out-button";
import { cn } from "@/lib/utils";

export interface NavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
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
    { href: "/admin/health", label: "System Health", icon: Activity },
    { href: "/admin/drives", label: "All Drives", icon: Briefcase },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/seasons", label: "Seasons", icon: CalendarDays },
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

  const activeColor = "bg-primary/10 text-primary border border-primary/20";

  return (
    <>
      {/* Mobile hamburger button — only shows on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-muted-foreground hover:text-foreground"
        aria-label="Open navigation"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay + Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-background border-r border-border z-50 flex flex-col p-6 md:hidden">
            <div className="flex items-center justify-between mb-8">
              <span className="font-heading text-xl font-black text-foreground">
                Skill<span className="text-primary">Sync.</span>
              </span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
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
                      "flex items-center gap-3 px-4 py-3.5 rounded-md font-semibold text-sm transition-all",
                      isActive
                        ? activeColor
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {link.icon && <link.icon className="w-5 h-5" />}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-border space-y-3">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Signed in as</p>
              <p className="text-sm text-foreground font-medium">{userName}</p>
              <SignOutButton />
            </div>
          </div>
        </>
      )}
    </>
  );
}
