// app/page.tsx — unauthenticated landing (role-redirect logic unchanged)
import { getCachedSession } from "@/lib/auth/session-cache";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getCachedSession();
  if (session?.user?.role) {
    switch (session.user.role) {
      case "student": redirect("/student/dashboard");
      case "faculty": redirect("/faculty");
      case "admin": redirect("/admin/health");
    }
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <h1 className="font-heading text-5xl font-black text-foreground tracking-tight">
          Skill<span className="text-primary">Sync.</span>
        </h1>
        <p className="text-lg text-muted-foreground font-light max-w-md">
          AI-Native Placement Ecosystem for UPES
        </p>
        <Link href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-none"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
