import { requireRole } from "@/lib/auth/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import Link from "next/link";
import SidebarNav from "@/components/faculty/sidebar-nav";
import SidebarShell from "@/components/shared/sidebar-shell";
import SignOutButton from "@/components/shared/sign-out-button";
import MobileNav from "@/components/shared/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import HeaderSearchTrigger from "@/components/shared/header-search-trigger";
import BottomTabBar from "@/components/shared/bottom-tab-bar";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["faculty", "admin"]);
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "Faculty";
  const role = session?.user?.role ?? "faculty";

  return (
    <div className='min-h-screen bg-background flex flex-col font-sans text-foreground antialiased'>

      {/* ── Header ── */}
      <header className='h-14 shrink-0 sticky top-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6'>
        {/* Left: Logo + badge */}
        <div className='flex items-center gap-3'>
          <Link
            href='/faculty'
            className='font-sans text-base font-black tracking-tight text-foreground select-none hover:text-primary transition-colors duration-150'
          >
            Skill<span className='text-primary'>Sync.</span>
          </Link>
        </div>

        {/* Center: Search trigger — grows to fill space on desktop */}
        <div className='hidden sm:flex flex-1 justify-center px-4 max-w-xs lg:max-w-sm mx-auto'>
          <HeaderSearchTrigger role='faculty' />
        </div>

        {/* Right: User info + controls */}
        <div className='flex items-center gap-2 sm:gap-3'>
          <span className='hidden md:block text-[13px] font-medium text-muted-foreground'>
            {name}
            <span className='text-primary/60 font-normal ml-1.5 capitalize'>({role})</span>
          </span>
          <div className='sm:hidden'>
            <HeaderSearchTrigger role='faculty' />
          </div>
          <MobileNav userName={name} role='faculty' />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      {/* ── Body ── */}
      <div className='flex flex-1 overflow-hidden' style={{ height: 'calc(100vh - 56px)' }}>

        {/* Sidebar slot */}
        <SidebarShell label='Faculty'>
          <SidebarNav />
        </SidebarShell>

        {/* Main scrollable content */}
        <main className='flex-1 overflow-y-auto'>
          <div className='px-4 sm:px-6 py-6 md:pb-6 pb-[calc(56px+max(env(safe-area-inset-bottom),8px))]'>
            {children}
          </div>
        </main>

      </div>
      <BottomTabBar role='faculty' userName={name} />
    </div>
  );
}
