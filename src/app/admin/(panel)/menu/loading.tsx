import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";

export default function AdminMenuLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/70" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminCardSkeleton key={i} rows={4} />
        ))}
      </div>
    </div>
  );
}
