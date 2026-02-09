
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware — guards API routes only.
 *
 * Page-level auth + role checks are handled entirely client-side by:
 *   - AuthGate  (redirects unauthenticated users to /login)
 *   - useRequireRole() in role-group layouts
 *
 * Keeping middleware off page routes prevents it from intercepting
 * Next.js internal RSC / data fetches during soft navigation, which
 * was causing /_not-found recompiles and hydration cascades.
 */
export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role as string | undefined;

        // Role-gate API routes (mirrors the client-side role checks)
        if (path.startsWith("/api/admin") && role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (path.startsWith("/api/faculty") && role !== "faculty" && role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (path.startsWith("/api/student") && role !== "student" && role !== "faculty" && role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Always allow NextAuth endpoints
                if (req.nextUrl.pathname.startsWith("/api/auth")) {
                    return true;
                }
                // Allow cron endpoints (they use their own secret)
                if (req.nextUrl.pathname.startsWith("/api/cron")) {
                    return true;
                }
                // Allow DB test endpoint
                if (req.nextUrl.pathname.startsWith("/api/db-test")) {
                    console.log("Middleware allowing:", req.nextUrl.pathname);
                    return true;
                }
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/api/:path*",
    ],
};
