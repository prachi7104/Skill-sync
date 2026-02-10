
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Optimized Middleware — guards ONLY protected API routes.
 * 
 * Performance optimizations:
 * 1. Excludes public routes from matcher (no session check overhead)
 * 2. Only runs on routes that actually need authentication
 * 3. Fast-path for role checks without redundant token lookups
 */
export default withAuth(
    function middleware(req) {
        const start = Date.now();
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const method = req.method;
        const role = token?.role as string | undefined;

        const logResponse = (res: NextResponse) => {
            const duration = Date.now() - start;
            console.log(`[REQ] ${method} ${path} ${res.status} ${duration}ms`);
            return res;
        };

        // Role-gate API routes (fast-path with early returns)
        if (path.startsWith("/api/admin")) {
            if (role !== "admin") {
                return logResponse(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
            }
            return logResponse(NextResponse.next());
        }

        if (path.startsWith("/api/faculty")) {
            if (role !== "faculty" && role !== "admin") {
                return logResponse(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
            }
            return logResponse(NextResponse.next());
        }

        if (path.startsWith("/api/student")) {
            if (role !== "student" && role !== "faculty" && role !== "admin") {
                return logResponse(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
            }
            return logResponse(NextResponse.next());
        }

        // Default: allow
        // Default: allow
        return logResponse(NextResponse.next());
    },
    {
        callbacks: {
            authorized: ({ token }) => {
                // Simplified: token must exist for protected routes
                return !!token;
            },
        },
    }
);

/**
 * Matcher configuration - ONLY runs on protected API routes.
 * Excludes:
 * - /api/auth/* (NextAuth endpoints - public)
 * - /api/cron/* (Uses own secret)
 * - /api/db-test (Development endpoint)
 * - /_next/* (Next.js internals)
 * - /login, /unauthorized (Public pages)
 */
export const config = {
    matcher: [
        // Only protected API routes
        "/api/admin/:path*",
        "/api/faculty/:path*",
        "/api/student/:path*",
        "/api/drives/:path*",
    ],
};
