import Link from "next/link";

/**
 * Custom 404 page.
 *
 * Providing this as a real file prevents Next.js from auto-generating
 * a synthetic /_not-found route that must be recompiled on every HMR
 * cycle, which was causing stale webpack chunk errors.
 */
export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold mb-2">404</h1>
            <p className="text-lg text-gray-600 mb-6">Page not found</p>
            <Link
                href="/"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
                Go home
            </Link>
        </div>
    );
}
