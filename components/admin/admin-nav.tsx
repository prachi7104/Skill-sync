"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/health", label: "System Health", emoji: "⚡" },
  { href: "/admin/drives", label: "All Drives", emoji: "🎯" },
  { href: "/admin/users", label: "User Management", emoji: "👥" },
  { href: "/admin/ai-models", label: "AI Models", emoji: "🤖" },
  { href: "/admin/settings", label: "Settings", emoji: "⚙️" },
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
              "group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm",
              isActive
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <span>{link.emoji}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
