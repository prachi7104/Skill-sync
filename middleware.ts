
import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import { guestAccessEnabled, isGuestAllowedPath } from "@/lib/demo/config";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/**
 * Optimized Middleware — guards ONLY protected API routes.
 * 
 * Production monitoring:
 * - Silent on normal 2xx/3xx responses
 * - Logs 401 unauthenticated blocks (auth debugging)
 * - Warns on 403 forbidden access attempts (security monitoring)
 * - Errors on 500+ (debugging)
 */
const institutionalMiddleware = withAuth(
    function middleware(req) {
        const start = Date.now();
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const method = req.method;
        const role = token?.role as string | undefined;

        const logResponse = (res: NextResponse, context?: string) => {
            const duration = Date.now() - start;
            const status = res.status;

            // ⚠️ Track forbidden access attempts
            if (status === 403) {
                console.warn(JSON.stringify({
                    level: "warn",
                    ts: new Date().toISOString(),
                    msg: "Forbidden access attempt",
                    context: { method, path, role: role || "none", duration, reason: context },
                }));
            }

            // 🔒 Track unauthenticated requests blocked by auth middleware
            if (status === 401) {
                console.log(`[auth] Unauthenticated request blocked: ${method} ${path}`);
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

        // Force students through onboarding before entering the student workspace.
        if (path.startsWith("/student")) {
            if (role !== "student") {
                return logResponse(
                    NextResponse.redirect(new URL("/unauthorized", req.url), 307),
                    "non-student accessing /student route"
                );
            }

            const requestHeaders = new Headers(req.headers);
            requestHeaders.set("x-student-path", `${path}${req.nextUrl.search}`);
            return logResponse(
                NextResponse.next({
                    request: {
                        headers: requestHeaders,
                    },
                }),
            );
        }

        // Default: allow
        return logResponse(NextResponse.next());
    },
    {
        callbacks: {
            // Guest tokens never reach here (blocked below); require a real user id.
            authorized: ({ token }) => {
                return !!token?.id && token.isGuest !== true;
            },
        },
    }
);

// The routes the institutional withAuth guard has always covered, kept in the
// matcher form they had when they were the middleware matcher.
const institutionalPaths = [
    "/api/admin/:path*",
    "/api/faculty/:path*",
    "/api/student/:path*",
    "/api/drives/:path*",
    "/api/jobs/:path*",
    "/api/resources/:path*",
    "/api/seasons/:path*",
    "/student/:path*",
].map((matcher) => matcher.slice(0, -"/:path*".length));

/**
 * Site-wide entry point.
 * - Guest-mode sessions are confined to an allowlist (/guest, /api/demo, /api/auth):
 *   every institutional page or API answers 403/redirect for them, independent of
 *   any per-route role check.
 * - /guest pages 404 unless ENABLE_GUEST_ACCESS=true.
 * - Institutional protected routes keep their existing withAuth guard.
 */
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
    const path = req.nextUrl.pathname;
    const isGuestPage = path === "/guest" || path.startsWith("/guest/");
    if ((isGuestPage || path.startsWith("/api/demo/")) && !guestAccessEnabled()) {
        return new NextResponse(null, { status: 404 });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
    if (token?.isGuest && !isGuestAllowedPath(path)) {
        console.warn(JSON.stringify({ level: "warn", msg: "Guest blocked from institutional route", context: { path, method: req.method } }));
        if (path.startsWith("/api/")) {
            return NextResponse.json({ error: "Guest sessions cannot access institutional features." }, { status: 403 });
        }
        const portal = token.role === "faculty" ? "recruiter" : "student";
        return NextResponse.redirect(new URL(`/guest/${portal}`, req.url), 307);
    }

    if (institutionalPaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
        return institutionalMiddleware(req as Parameters<typeof institutionalMiddleware>[0], event);
    }
    return NextResponse.next();
}

export const config = {
    // Everything except build assets, so guest confinement covers every page and API.
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
