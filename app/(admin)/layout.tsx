import { requireRole } from "@/lib/auth/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import Link from "next/link";
import SignOutButton from "@/components/shared/sign-out-button";
import MobileNav from "@/components/shared/mobile-nav";
import AdminNav from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "Admin";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin/health" className="text-xl font-black tracking-tight text-white select-none">
            Skill<span className="text-indigo-500">Sync.</span>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2.5 py-1">
            Master
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-sm font-medium text-slate-300 hidden md:block">
            {name} <span className="text-rose-400 font-normal ml-1">(admin)</span>
          </div>
          <MobileNav userName={name} role="admin" />
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
        
        {/* Ambient glow — rose for admin distinction */}
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-rose-600/8 blur-[100px] rounded-full mix-blend-screen pointer-events-none z-0" />

        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 hidden md:block shrink-0 z-10">
          <div className="mb-8 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Master Dashboard
            </h2>
          </div>
          <AdminNav />
        </aside>

        <main className="flex-1 overflow-y-auto bg-transparent relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
