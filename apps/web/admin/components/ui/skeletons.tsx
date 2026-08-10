import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({
  columns = 4,
  rows = 6,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)]">
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`h-${i}`} className="border-b border-[var(--admin-border)] p-3">
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: columns }).map((_, c) => (
            <div key={`${r}-${c}`} className="border-b border-[var(--admin-border)] p-3">
              <Skeleton className="h-4 w-full max-w-[12rem]" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-28" />
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)]">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]/80 p-5"
        >
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ShellSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[var(--admin-sidebar)] border-e border-[var(--admin-border)] p-4 md:block">
        <Skeleton className="mb-6 h-8 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="mb-6 h-10 w-48" />
        <TableSkeleton />
      </div>
    </div>
  );
}
