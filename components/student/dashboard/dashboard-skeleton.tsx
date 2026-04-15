import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="mb-2 h-8 w-72" />
        <Skeleton className="h-4 w-96" />
        <div className="mt-5 flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-md" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-2">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <div className="space-y-4 xl:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="mb-4 h-4 w-28" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="mb-4 h-4 w-24" />
            <Skeleton className="mx-auto mb-3 h-20 w-20 rounded-full" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-2">
          <Skeleton className="mb-4 h-4 w-28" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-1">
          <Skeleton className="mb-4 h-4 w-28" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}