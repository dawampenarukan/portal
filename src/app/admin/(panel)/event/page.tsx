import { Suspense } from "react";
import { AdminEventHeader, AdminEventList } from "@/components/admin/admin-event-section";
import { CardGridSkeleton } from "@/components/ui/route-skeletons";

export const metadata = { title: "Kelola Event" };

export default function AdminEventPage() {
  return (
    <div className="space-y-6">
      <AdminEventHeader />
      <Suspense fallback={<CardGridSkeleton count={6} cols="md:grid-cols-2 lg:grid-cols-3" />}>
        <AdminEventList />
      </Suspense>
    </div>
  );
}
