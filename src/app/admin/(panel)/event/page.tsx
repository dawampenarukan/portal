import { Suspense } from "react";
import { AdminEventHeader, AdminEventList } from "@/components/admin/admin-event-section";
import { CardGridSkeleton } from "@/components/ui/route-skeletons";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Kelola Event" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminEventPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  return (
    <div className="space-y-6">
      <AdminEventHeader />
      <Suspense
        fallback={<CardGridSkeleton count={6} cols="md:grid-cols-2 lg:grid-cols-3" />}
      >
        <AdminEventList page={page} />
      </Suspense>
    </div>
  );
}
