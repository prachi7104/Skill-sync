import { requireRole } from "@/lib/auth/helpers";
import Header from "@/components/shared/header";
import Link from "next/link";

const facultyLinks = [
    { href: "/faculty", label: "Dashboard" },
    { href: "/faculty/drives", label: "Drives" },
    { href: "/faculty/drives/new", label: "Create Drive" },
];

/**
 * FacultyLayout - Server Component
 * 
 * All auth/role checks happen server-side. No client-side hydration mismatch
 * because we're not using useState/useEffect for auth rendering logic.
 */
export default async function FacultyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth check - throws error if not authenticated/authorized
    await requireRole(["faculty", "admin"]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex h-[calc(100vh-64px)]">
                <aside className="w-64 border-r bg-white p-6 hidden md:block">
                    <nav className="space-y-4">
                        <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Faculty Menu
                        </h2>
                        <div className="space-y-1">
                            {facultyLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block rounded-md px-3 py-2 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                </aside>

                <main className="flex-1 overflow-auto bg-gray-50 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
