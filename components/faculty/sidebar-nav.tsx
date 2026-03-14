"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/faculty", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/faculty/drives", label: "My Drives", icon: FolderOpen },
  { href: "/faculty/drives/new", label: "New Drive", icon: Plus },
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
              "group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm",
              isActive
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <link.icon className={cn(
              "w-5 h-5 transition-all",
              isActive ? "text-indigo-400" : "opacity-60 group-hover:opacity-100"
            )} />
            {link.label}
          </Link>
        );
      })}
      <div className="mt-8 px-4 pt-6 border-t border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Signed in as</p>
        <p className="text-xs text-slate-400 mt-1 font-medium truncate">{name}</p>
      </div>
    </nav>
  );
}
