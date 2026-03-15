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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-black text-white tracking-tight">
          Skill<span className="text-indigo-500">Sync.</span>
        </h1>
        <p className="text-lg text-slate-400 font-light max-w-md">
          AI-Native Placement Ecosystem for UPES
        </p>
        <Link href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
