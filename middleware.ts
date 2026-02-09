
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role;

        // 1. Admin Route: Only admin
        if (path.startsWith("/admin")) {
            if (role !== "admin") {
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }

        // 2. Faculty Route: Faculty or Admin
        if (path.startsWith("/faculty")) {
            if (role !== "faculty" && role !== "admin") {
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }

        // 3. Student Route: Student, Faculty, or Admin
        if (path.startsWith("/student")) {
            if (role !== "student" && role !== "faculty" && role !== "admin") {
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }

        // API Authorization could be added here, currently relying on token check
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow public access to auth endpoints even if matched by /api/:path*
                if (req.nextUrl.pathname.startsWith("/api/auth")) {
                    return true;
                }
                // Require token for all other matched routes
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/student/:path*",
        "/faculty/:path*",
        "/admin/:path*",
        "/api/:path*",
    ],
};
