"use client";

import { SessionProvider } from "next-auth/react";
import AuthGate from "@/components/providers/auth-gate";

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <AuthGate>{children}</AuthGate>
        </SessionProvider>
    );
}
