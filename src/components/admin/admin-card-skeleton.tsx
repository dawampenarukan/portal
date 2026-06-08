export function AdminCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border bg-white p-6">
      <div className="h-5 w-40 rounded bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-muted/70" />
      ))}
    </div>
  );
}
