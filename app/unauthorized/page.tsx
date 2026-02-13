
"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center max-w-md space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-red-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Access Denied
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    You don&apos;t have permission to access this page.
                    This may happen if you&apos;re trying to access a page meant for a different role.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
                    >
                        Go to My Dashboard
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
                <p className="text-xs text-gray-500">
                    If you believe this is an error, please contact your administrator.
                </p>
            </div>
        </div>
    );
}
