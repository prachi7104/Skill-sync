// app/unauthorized/page.tsx
import Link from "next/link";
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl font-semibold text-foreground">403</div>
        <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
        <Link href="/" className="text-foreground hover:text-foreground text-sm font-bold">
          Go home
        </Link>
      </div>
    </div>
  );
}
