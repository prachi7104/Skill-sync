"use client";

import { useRequireRole } from "@/lib/auth/hooks";
import Header from "@/components/shared/header";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoading } = useRequireRole(["student"]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-lg text-gray-500">Loading student portal...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex h-[calc(100vh-64px)]">
                {/* Placeholder Sidebar */}
                <aside className="w-64 border-r bg-white p-6 hidden md:block">
                    <nav className="space-y-4">
                        <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Student Menu
                        </h2>
                        <div className="space-y-1">
                            <div className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                                Dashboard
                            </div>
                            <div className="px-3 py-2 text-sm font-medium text-gray-600">
                                My Profile
                            </div>
                            <div className="px-3 py-2 text-sm font-medium text-gray-600">
                                Drives
                            </div>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gray-50 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
