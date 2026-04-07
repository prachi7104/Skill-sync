"use client";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        <span className="sr-only">Previous</span>
      </Button>
      
      <span className="text-xs text-muted-foreground px-2">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        <span className="sr-only">Next</span>
      </Button>
    </div>
  );
}
