import { requireRole } from "@/lib/auth/helpers";
import Header from "@/components/shared/header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import SidebarNav from "@/components/faculty/sidebar-nav";

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

    // Fetch the session to get faculty name
    const session = await getServerSession(authOptions);
    const name = session?.user?.name ?? "Faculty";

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex h-[calc(100vh-64px)]">
                {/* Unified Sidebar Navigation */}
                <aside className="w-64 border-r bg-white flex flex-col hidden md:flex">
                    <div className="border-b px-6 py-4">
                        <span className="font-bold text-indigo-600 tracking-tight text-lg">
                            SkillSync
                        </span>
                    </div>

                    <SidebarNav name={name} />
                </aside>

                <main className="flex-1 overflow-auto bg-gray-50 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
