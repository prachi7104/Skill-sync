"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Settings, LibraryBig, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/faculty",           label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/faculty/drives",    label: "Drives",    icon: FolderOpen },
  { href: "/faculty/students",  label: "Students",  icon: Users },
  { href: "/faculty/resources", label: "Resources", icon: LibraryBig },
  { href: "/faculty/settings",  label: "Settings",  icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {links.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href) && link.href !== "/faculty";
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
