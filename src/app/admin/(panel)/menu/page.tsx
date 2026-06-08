import { Suspense } from "react";
import { AdminMenuOverview } from "@/components/admin/admin-menu-overview-section";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";

export const metadata = { title: "Kelola Menu" };

export default function AdminMenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Kelola Menu</h2>
        <p className="text-muted-foreground">
          Atur jadwal mingguan, lihat akumulasi menu favorit, dan tinjau request menu dari
          pengunjung.
        </p>
      </div>

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
