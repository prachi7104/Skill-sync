import { getCachedSession } from "@/lib/auth/session-cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText, BarChart3, Database, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle"; // Assuming this exists based on Copilot output

export default async function Home() {
  const session = await getCachedSession();

  // Role routing remains untouched
  if (session?.user?.role) {
    switch (session.user.role) {
      case "student": redirect("/student/dashboard");
      case "faculty": redirect("/faculty");
      case "admin": redirect("/admin/health");
    }
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 flex flex-col">
      {/* Navbar Shell */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="font-heading text-xl font-black tracking-tight text-foreground">
            Skill<span className="text-primary">Sync.</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">

        {/* Subtle Background Glow for Enterprise feel (Light & Dark compatible) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 dark:opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/40 via-background to-background" />

        {/* Hero Copy */}
        <div className="text-center max-w-3xl z-10 space-y-6">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Placement Season 2026 Ready
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-black text-foreground tracking-tight leading-[1.1]">
            The Intelligent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              Placement Ecosystem
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            Connecting UPES Admins, Faculty, and Students through an AMCAT-integrated intelligence hub. AI-native matching, real-time analytics, and zero conflicts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all group"
            >
              Student SSO
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login?faculty=true" // Example trigger for the staff form
              className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-background px-8 text-base font-medium text-foreground hover:bg-muted transition-colors"
            >
              Faculty / Admin Login
            </Link>
          </div>
        </div>

        {/* Bento Box UI Mockups (Replaces AI Images) */}
        <div className="w-full mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
          {/* Card 1: ATS Resume */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">Score: 92%</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground">ATS AI-Parsing</h3>
              <p className="text-sm text-muted-foreground mt-1">Real-time resume scoring against actual job descriptions.</p>
            </div>
          </div>

          {/* Card 2: Faculty Analytics */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-2">
              {/* Mock bar chart bars */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="w-3/4 h-full bg-blue-500 rounded-full"></div></div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="w-1/2 h-full bg-primary rounded-full"></div></div>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Drive Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">Instantly resolve conflicts and track student shortlists.</p>
            </div>
          </div>

          {/* Card 3: AMCAT Sync */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <Database className="w-6 h-6" />
              </div>
              <CheckCircle2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AMCAT Integrated</h3>
              <p className="text-sm text-muted-foreground mt-1">Global database synchronization for unbiased student ranking.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}