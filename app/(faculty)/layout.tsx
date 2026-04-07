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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">

      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/faculty" className="text-sm font-semibold text-foreground tracking-tight">
            SkillSync
          </Link>
          <span className="text-xs text-muted-foreground hidden md:block capitalize">/ {role}</span>
        </div>
        <div className="flex items-center gap-3">
          <MobileNav userName={name} role="faculty" />
          <span className="text-xs text-muted-foreground hidden md:block">{name}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        <aside className="w-60 border-r border-border bg-secondary flex-col hidden md:flex shrink-0 overflow-y-auto">
          <div className="flex-1 px-2 py-4">
            <SidebarNav />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>

      </div>
    </div>
  );
}
