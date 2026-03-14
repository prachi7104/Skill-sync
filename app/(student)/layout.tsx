export const dynamic = "force-dynamic";

import { requireRole, getStudentProfile } from "@/lib/auth/helpers";
import Link from "next/link";
import { StudentProvider } from "@/app/(student)/providers/student-provider";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { LayoutDashboard, UserCircle, Briefcase, Box } from "lucide-react";

const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/profile", label: "My Profile", icon: UserCircle },
    { href: "/student/drives", label: "Drives", icon: Briefcase },
    { href: "/student/sandbox", label: "AI Sandbox", icon: Box },
];

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireRole(["student"]);
    let profile = await getStudentProfile(user.id);

    if (!profile) {
        try {
            await db.insert(students).values({ id: user.id }).onConflictDoNothing();
            profile = await getStudentProfile(user.id);
        } catch (e) {
            console.error("[StudentLayout] Failed to auto-create profile:", e);
        }
    }

    return (
        <StudentProvider initialStudent={profile} initialUser={user}>
            {/* Soft Dark Canvas using Tailwind Slate */}
            <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 selection:bg-indigo-500/30">
                
                {/* Premium Glassmorphic Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 sticky top-0 z-50">
                    <div className="flex items-center">
                        <h1 className="text-xl font-black tracking-tight text-white select-none">
                            Skill<span className="text-indigo-500">Sync.</span>
                        </h1>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-sm font-medium text-slate-300 hidden md:block">
                            {user.name} <span className="text-slate-500 font-normal ml-1">(student)</span>
                        </div>
                        <button className="text-sm font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-5 py-2 rounded-xl transition-all shadow-sm">
                            Sign out
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
                    
                    {/* Ambient Background Glow */}
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0" />

                    {/* Lighter Slate Sidebar for Depth */}
                    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 hidden md:block shrink-0 z-10">
                        <div className="mb-8 px-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                Student Menu
                            </h2>
                        </div>
                        <nav className="space-y-2">
                            {studentLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white focus:bg-indigo-500/10 focus:text-indigo-400 focus:border focus:border-indigo-500/20"
                                >
                                    <link.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Scrollable Content Area */}
                    <main className="flex-1 overflow-y-auto bg-transparent relative z-10">
                        {children}
                    </main>
                </div>
            </div>
        </StudentProvider>
    );
}