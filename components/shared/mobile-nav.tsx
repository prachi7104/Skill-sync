"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LucideIcon } from "lucide-react";
import SignOutButton from "./sign-out-button";
import { cn } from "@/lib/utils";

export interface NavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
  emoji?: string;
  exact?: boolean;
}

export default function MobileNav({ 
  userName, 
  links,
  role = "student"
}: { 
  userName: string; 
  links: NavLink[];
  role?: "student" | "faculty" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const activeColor = role === "admin" ? "bg-rose-500/10 text-rose-400 border border-rose-500/15" : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20";

  return (
    <>
      {/* Mobile hamburger button — only shows on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-slate-400 hover:text-white"
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
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 flex flex-col p-6 md:hidden">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-black text-white">
                Skill<span className="text-indigo-500">Sync.</span>
              </span>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
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
                      "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all",
                      isActive
                        ? activeColor
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {link.icon && <link.icon className="w-5 h-5" />}
                    {link.emoji && <span className="text-lg">{link.emoji}</span>}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-slate-800 space-y-3">
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Signed in as</p>
              <p className="text-sm text-slate-300 font-medium">{userName}</p>
              <SignOutButton />
            </div>
          </div>
        </>
      )}
    </>
  );
}
