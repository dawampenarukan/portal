import { Suspense } from "react";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats";
import { AdminDashboardSurveySection } from "@/components/admin/admin-dashboard-survey-section";

export const metadata = {
  title: "Dashboard Admin",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Ringkasan aktivitas portal SPPG Penarukan 2.</p>
      </div>

      <Suspense
        fallback={
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <AdminCardSkeleton key={i} rows={1} />
              ))}
            </div>
            <AdminCardSkeleton rows={4} />
          </>
        }
      >
        <AdminDashboardStats />
      </Suspense>

      <Suspense
        fallback={
          <>
            <AdminCardSkeleton rows={4} />
            <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
          </>
        }
      >
        <AdminDashboardSurveySection />
      </Suspense>
    </div>
  );
}
