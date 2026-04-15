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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl border border-border bg-card p-5 xl:min-h-[440px]">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-[280px] w-full xl:h-[360px]" />
        </div>
        <div className="space-y-4 xl:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 xl:min-h-[260px]">
            <Skeleton className="mb-4 h-4 w-28" />
            <Skeleton className="h-32 w-full xl:h-40" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 xl:min-h-[260px]">
            <Skeleton className="mb-4 h-4 w-24" />
            <Skeleton className="mx-auto mb-3 h-20 w-20 rounded-full" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <div className="rounded-2xl border border-border bg-card p-5 xl:min-h-[360px]">
          <Skeleton className="mb-4 h-4 w-28" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl xl:h-16" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 xl:min-h-[320px]">
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