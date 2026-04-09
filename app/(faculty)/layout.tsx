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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground selection:bg-primary/30">
      
      {/* Header */}
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8 shrink-0 sticky top-0 z-50">
        <Link href="/faculty" className="font-heading text-xl font-black tracking-tight text-foreground select-none">
          Skill<span className="text-primary">Sync.</span>
        </Link>
        <div className="flex items-center space-x-6">
          <div className="text-sm font-medium text-muted-foreground hidden md:block">
            {name}
            <span className="opacity-70 font-normal ml-1.5 capitalize">({role})</span>
          </div>
          <MobileNav userName={name} role="faculty" />
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">

        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-muted/30 p-6 hidden md:block shrink-0 z-10">
          <div className="mb-8 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Faculty Menu
            </h2>
          </div>
          <SidebarNav name={name} />
        </aside>

        <main className="flex-1 overflow-y-auto bg-transparent relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
