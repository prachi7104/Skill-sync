import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role) {
    switch (session.user.role) {
      case "student":
        redirect("/student/dashboard");
      case "faculty":
        redirect("/faculty/dashboard");
      case "admin":
        redirect("/admin/health");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SkillSync</h1>
        <p className="text-lg text-gray-600 mb-8">
          AI-powered placement preparation and interview assistant
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Sign in to get started
        </Link>
      </div>
    </main>
  );
}
