
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Optimized Middleware — guards ONLY protected API routes.
 * 
 * Production monitoring:
 * - Logs all requests with method, path, status, duration
 * - Warns on forbidden access attempts (potential auth attacks)
 * - Tracks 500 errors with context for debugging
 */
export default withAuth(
    function middleware(req) {
        const start = Date.now();
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const method = req.method;
        const role = token?.role as string | undefined;

        const logResponse = (res: NextResponse, context?: string) => {
            const duration = Date.now() - start;
            const status = res.status;

            // Standard request log
            console.log(`[REQ] ${method} ${path} ${status} ${duration}ms`);

            // ⚠️ Track forbidden access attempts
            if (status === 403) {
                console.warn(JSON.stringify({
                    level: "warn",
                    ts: new Date().toISOString(),
                    msg: "Forbidden access attempt",
                    context: { method, path, role: role || "none", duration, reason: context },
                }));
            }

            // 🔴 Track 500 errors
            if (status >= 500) {
                console.error(JSON.stringify({
                    level: "error",
                    ts: new Date().toISOString(),
                    msg: "Server error in middleware",
                    context: { method, path, status, role: role || "none", duration },
                }));
            }

            return res;
        };

        // Role-gate API routes (fast-path with early returns)
        if (path.startsWith("/api/admin")) {
            if (role !== "admin") {
                return logResponse(
                    NextResponse.json({ error: "Forbidden" }, { status: 403 }),
                    "non-admin accessing /api/admin"
                );
            }
            return logResponse(NextResponse.next());
        }

        if (path.startsWith("/api/faculty")) {
            if (role !== "faculty" && role !== "admin") {
                return logResponse(
                    NextResponse.json({ error: "Forbidden" }, { status: 403 }),
                    "non-faculty accessing /api/faculty"
                );
            }
            return logResponse(NextResponse.next());
        }

        if (path.startsWith("/api/student")) {
            if (role !== "student" && role !== "faculty" && role !== "admin") {
                return logResponse(
                    NextResponse.json({ error: "Forbidden" }, { status: 403 }),
                    "unauthorized role accessing /api/student"
                );
            }
            return logResponse(NextResponse.next());
        }

        // Default: allow
        return logResponse(NextResponse.next());
    },
    {
        callbacks: {
            authorized: ({ token }) => {
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
