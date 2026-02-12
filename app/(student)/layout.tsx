import { requireRole, getStudentProfile } from "@/lib/auth/helpers";
import Header from "@/components/shared/header";
import Link from "next/link";
import { StudentProvider } from "@/app/(student)/providers/student-provider";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";

const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/profile", label: "My Profile" },
    { href: "/student/drives", label: "Drives" },
    { href: "/student/sandbox", label: "AI Sandbox" },
];

/**
 * StudentLayout - Server Component
 * 
 * Auth check: requires the user to be a student but does NOT require a
 * completed student profile. This allows onboarding pages (which live under
 * this layout) to render without causing an infinite redirect loop.
 * 
 * If the student profile row doesn't exist (edge case: auth created user
 * but profile insert failed), we auto-create it here.
 */

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth check - redirects to /login if not authenticated,
    // to /unauthorized if not a student. Does NOT require student profile.
    const user = await requireRole(["student"]);

    // Try to fetch the student profile (may not exist yet for brand-new users)
    let profile = await getStudentProfile(user.id);

    // Auto-create student profile row if missing (defensive: signIn callback
    // should have created this, but handle edge cases)
    if (!profile) {
        try {
            await db.insert(students).values({ id: user.id }).onConflictDoNothing();
            profile = await getStudentProfile(user.id);
        } catch (e) {
            console.error("[StudentLayout] Failed to auto-create student profile:", e);
        }
    }

    return (
        <StudentProvider initialStudent={profile} initialUser={user}>
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex h-[calc(100vh-64px)]">
                    <aside className="w-64 border-r bg-white p-6 hidden md:block">
                        <nav className="space-y-4">
                            <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Student Menu
                            </h2>
                            <StudentNavLinks />
                        </nav>
                    </aside>

                    <main className="flex-1 overflow-auto bg-gray-50 p-8">
                        {children}
                    </main>
                </div>
            </div>
        </StudentProvider>
    );
}

function StudentNavLinks() {
    return (
        <div className="space-y-1">
            {studentLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-md px-3 py-2 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                    {link.label}
                </Link>
            ))}
        </div>
    );
}
