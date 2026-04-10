import { requireRole } from "@/lib/auth/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import Link from "next/link";
import SignOutButton from "@/components/shared/sign-out-button";
import MobileNav from "@/components/shared/mobile-nav";
import AdminNav from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "Admin";

  return (
    <div className='min-h-screen bg-background flex flex-col font-sans text-foreground antialiased'>

      {/* ── Header ── */}
      <header className='h-14 shrink-0 sticky top-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6'>
        <div className='flex items-center gap-3'>
          <Link
            href='/admin/health'
            className='font-sans text-base font-black tracking-tight text-foreground select-none hover:text-primary transition-colors duration-150'
          >
            Skill<span className='text-primary'>Sync.</span>
          </Link>
          <span className='hidden sm:inline-flex items-center h-5 px-2 rounded-sm bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.15em] text-primary'>
            Master
          </span>
        </div>
        <div className='flex items-center gap-2 sm:gap-3'>
          <span className='hidden md:block text-[13px] font-medium text-muted-foreground'>
            {name}
            <span className='text-primary/60 font-normal ml-1'>(admin)</span>
          </span>
          <MobileNav userName={name} role='admin' />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      {/* ── Body ── */}
      <div className='flex flex-1 overflow-hidden' style={{ height: 'calc(100vh - 56px)' }}>

        {/* Sidebar slot — SidebarShell renders AdminNav inside */}
        <aside className='hidden md:block shrink-0 relative z-10'>
          {/* Phase 05 inserts: <AdminSidebarShell /> here */}
          <AdminNav />
        </aside>

        {/* Main scrollable content */}
        <main className='flex-1 overflow-y-auto'>
          <div className='px-4 sm:px-6 py-6'>
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
