import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";

export default function AdminMenuCategoryLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-8 w-56 rounded bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCardSkeleton rows={5} />
        <AdminCardSkeleton rows={6} />
      </div>
      <AdminCardSkeleton rows={3} />
    </div>
  );
}
