import { Suspense } from "react";
import { AdminMenuOverview } from "@/components/admin/admin-menu-overview-section";
import { AdminOrganolepticSummary } from "@/components/admin/admin-organoleptic-summary";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import { SyncInventoryWeeklyMenuButton } from "@/components/admin/sync-inventory-weekly-menu-button";

export const metadata = { title: "Kelola Menu" };

export default function AdminMenuPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Kelola Menu</h2>
          <p className="text-muted-foreground">
            Atur jadwal mingguan, checklist uji organoleptik, menu favorit, dan request menu dari
            pengunjung.
          </p>
        </div>
        <SyncInventoryWeeklyMenuButton />
      </div>

      <Suspense fallback={<AdminCardSkeleton rows={4} />}>
        <AdminOrganolepticSummary />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <AdminCardSkeleton key={i} rows={4} />
            ))}
          </div>
        }
      >
        <AdminMenuOverview />
      </Suspense>
    </div>
  );
}
