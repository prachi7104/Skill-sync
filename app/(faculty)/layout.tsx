import { requireRole } from "@/lib/auth/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import Link from "next/link";
import SidebarNav from "@/components/faculty/sidebar-nav";
import SignOutButton from "@/components/shared/sign-out-button";
import MobileNav from "@/components/shared/mobile-nav";
export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["faculty", "admin"]);
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "Faculty";
  const role = session?.user?.role ?? "faculty";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 sticky top-0 z-50">
        <Link href="/faculty" className="text-xl font-black tracking-tight text-white select-none">
          Skill<span className="text-indigo-500">Sync.</span>
        </Link>
        <div className="flex items-center space-x-6">
          <div className="text-sm font-medium text-slate-300 hidden md:block">
            {name}
            <span className="text-slate-500 font-normal ml-1.5 capitalize">({role})</span>
          </div>
          <MobileNav userName={name} role="faculty" />
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
        
        {/* Ambient glow */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0" />

        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 hidden md:block shrink-0 z-10">
          <div className="mb-8 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Faculty Menu
            </h2>
          </div>
          <SidebarNav name={name} />
        </aside>

        <main className="flex-1 overflow-y-auto bg-transparent relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
