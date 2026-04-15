"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  /** If provided, called instead of router.push when the page changes. */
  onChange?: (page: number) => void;
}

export default function Pagination({
  page,
  total,
  pageSize = 20,
  onChange,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const go = (p: number) => {
    if (p < 1 || p > totalPages) return;
    if (onChange) {
      onChange(p);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`?${params.toString()}`);
    }
  };

  // Build a list of at most 5 numbered slots centred around the current page,
  // padded out to 5 when near the edges, with "…" sentinels at the gaps.
  const pageNumbers: (number | "…")[] = [];
  const WINDOW = 2; // slots on each side of current
  let start = Math.max(1, page - WINDOW);
  let end = Math.min(totalPages, page + WINDOW);
  // Expand the window to always show 5 slots where possible
  if (end - start < 4) {
    if (start === 1) end = Math.min(totalPages, start + 4);
    else start = Math.max(1, end - 4);
  }
  if (start > 1) {
    pageNumbers.push(1);
    if (start > 2) pageNumbers.push("…");
  }
  for (let i = start; i <= end; i++) pageNumbers.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pageNumbers.push("…");
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 mt-8">
      {/* Prev */}
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 bg-card hover:bg-muted text-foreground rounded-md disabled:opacity-40 text-sm font-bold transition-colors border border-border"
      >
        &larr; Prev
      </button>

      {/* Numbered slots */}
      {pageNumbers.map((p, idx) =>
        p === "…" ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 text-sm text-muted-foreground select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            className={cn(
              "min-w-[36px] px-3 py-2 rounded-md text-sm font-bold transition-colors border",
              p === page
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted",
            )}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 bg-card hover:bg-muted text-foreground rounded-md disabled:opacity-40 text-sm font-bold transition-colors border border-border"
      >
        Next &rarr;
      </button>

      {/* Last — only shown when not already on or adjacent to the last page */}
      {page < totalPages - 1 && (
        <button
          onClick={() => go(totalPages)}
          className="px-3 py-2 bg-card hover:bg-muted text-foreground rounded-md text-sm font-bold transition-colors border border-border"
        >
          Last
        </button>
      )}
    </div>
  );
}
