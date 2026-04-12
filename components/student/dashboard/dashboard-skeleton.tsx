import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="mb-2 h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-1 md:col-span-2">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="mb-4 h-4 w-28" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="mb-4 h-4 w-24" />
          <Skeleton className="mx-auto mb-3 h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
