"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Settings, LibraryBig, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/faculty", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/faculty/drives", label: "Drives", icon: FolderOpen },
  { href: "/faculty/students", label: "Students", icon: Users },
  { href: "/faculty/resources", label: "Resources", icon: LibraryBig },
  { href: "/faculty/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-2">
      {links.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href) && link.href !== "/faculty";
        return (
          <Link
            key={link.href}
            href={link.href}
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
            {link.label}
          </Link>
        );
      })}
      <div className="mt-8 px-4 pt-6 border-t border-border">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Signed in as</p>
        <p className="text-xs text-muted-foreground mt-1 font-medium truncate">{name}</p>
      </div>
    </nav>
  );
}
