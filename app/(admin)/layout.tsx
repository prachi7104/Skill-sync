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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">

      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin/health" className="text-sm font-semibold text-foreground tracking-tight">
            SkillSync
          </Link>
          <span className="text-xs text-muted-foreground hidden md:block">/ Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <MobileNav userName={name} role="admin" />
          <span className="text-xs text-muted-foreground hidden md:block">{name}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        <aside className="w-60 border-r border-border bg-secondary flex-col hidden md:flex shrink-0 overflow-y-auto">
          <div className="px-3 py-4 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">Admin workspace</span>
          </div>
          <div className="flex-1 px-2 py-3">
            <AdminNav />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>

      </div>
    </div>
  );
}
