import { requireRole } from "@/lib/auth/helpers";
import Link from "next/link";
import SignOutButton from "@/components/shared/sign-out-button";
import AdminNav from "@/components/admin/admin-nav";
import SidebarShell from "@/components/shared/sidebar-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import BottomTabBar from "@/components/shared/bottom-tab-bar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin"]);
  const name = user.name ?? "Admin";

  return (
    <div className='h-screen bg-background flex flex-col font-sans text-foreground antialiased'>

      {/* ── Header ── */}
      <header className='h-14 shrink-0 sticky top-0 z-50 header-glass flex items-center justify-between px-4 sm:px-6'>
        {/* Left: Logo + badge */}
        <div className='flex items-center gap-3'>
          <Link
            href='/admin/health'
            className='font-sans text-lg font-black tracking-tight text-foreground select-none hover:text-primary transition-colors duration-150'
          >
            Skill<span className='text-primary'>Sync</span>
          </Link>
          <span className='hidden sm:inline-flex items-center h-5 px-2 rounded-sm bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.15em] text-primary'>
            Master
          </span>
        </div>

        {/* Right: User info + controls */}
        <div className='flex items-center gap-2 sm:gap-3'>
          <span className='hidden md:block text-[13px] font-medium text-muted-foreground'>
            {name}
            <span className='text-primary/60 font-normal ml-1'>(admin)</span>
          </span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      {/* ── Body ── */}
      <div className='flex flex-1 overflow-hidden'>

        <SidebarShell label='Admin'>
          <AdminNav />
        </SidebarShell>

        {/* Main scrollable content */}
        <main className='flex-1 overflow-y-auto'>
          <div className='px-4 sm:px-6 py-6 md:pb-6 pb-[calc(56px+max(env(safe-area-inset-bottom),8px))]'>
            {children}
          </div>
        </main>

      </div>
      <BottomTabBar userRole='admin' userName={name} />
    </div>
  );
}
