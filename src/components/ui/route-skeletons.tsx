export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 w-56 rounded-lg bg-muted" />
      <div className="h-4 w-80 max-w-full rounded bg-muted/70" />
    </div>
  );
}

export function CardGridSkeleton({ count = 4, cols = "sm:grid-cols-2 lg:grid-cols-4" }: { count?: number; cols?: string }) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse rounded-xl border bg-white p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-muted/60" />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return <div className="h-72 animate-pulse rounded-2xl bg-muted/60" />;
}

export function ChartSkeleton() {
  return <div className="h-48 animate-pulse rounded-xl bg-muted/60" />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border bg-white p-6">
      <div className="h-5 w-32 rounded bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-muted/70" />
      ))}
    </div>
  );
}
