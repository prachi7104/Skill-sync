"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
    { href: "/faculty", label: "Dashboard", icon: LayoutDashboard },
    { href: "/faculty/drives", label: "My Drives", icon: Briefcase },
    { href: "/faculty/drives/new", label: "Create Drive", icon: PlusCircle },
];

interface SidebarNavProps { name: string; }

export default function SidebarNav({ name }: SidebarNavProps) {
    const pathname = usePathname();

    function isActive(href: string): boolean {
        if (href === "/faculty") return pathname === "/faculty";
        return pathname.startsWith(href);
    }

    const initials = name.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

    return (
        <>
            <nav className="flex-1 space-y-1 px-3 mt-4">
                <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Faculty Console
                </p>
                {links.map(link => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                        <Link key={link.href} href={link.href}
                            className={cn(
                                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                                active
                                    ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}>
                            <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", active ? "text-indigo-600" : "text-slate-400")} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t bg-slate-50/50 px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-indigo-200 shadow-lg ring-2 ring-white">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800 tracking-tight">{name}</p>
                        <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty Access</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
