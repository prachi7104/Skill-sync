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
      default: redirect("/unauthorized");
    }
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-semibold text-foreground tracking-tight">
          Skill<span className="text-primary">Sync.</span>
        </h1>
        <p className="text-base text-muted-foreground font-light max-w-md">
          AI-Native Placement Ecosystem for UPES
        </p>
        <Link href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
