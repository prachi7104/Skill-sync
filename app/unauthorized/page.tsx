// app/unauthorized/page.tsx
import Link from "next/link";
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl font-black text-white">403</div>
        <p className="text-slate-400">You don&apos;t have permission to access this page.</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold">
          Go home
        </Link>
      </div>
    </div>
  );
}
