"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ page, total, pageSize = 20 }: {
  page: number; total: number; pageSize?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);
  
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 mt-8">
      <button onClick={() => go(page - 1)} disabled={page <= 1}
        className="px-4 py-2 bg-card hover:bg-muted text-foreground rounded-md disabled:opacity-40 text-sm font-bold transition-colors border border-border">
        &larr; Prev
      </button>
      <span className="text-sm font-medium text-muted-foreground px-2 lg:px-4">
        Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span>
      </span>
      <button onClick={() => go(page + 1)} disabled={page >= totalPages}
        className="px-4 py-2 bg-card hover:bg-muted text-foreground rounded-md disabled:opacity-40 text-sm font-bold transition-colors border border-border">
        Next &rarr;
      </button>
    </div>
  );
}
