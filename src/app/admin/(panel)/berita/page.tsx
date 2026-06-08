import { Suspense } from "react";
import { AdminBeritaHeader, AdminBeritaList } from "@/components/admin/admin-berita-section";
import { TableSkeleton } from "@/components/ui/route-skeletons";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Kelola Berita" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminBeritaPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  return (
    <div className="space-y-6">
      <AdminBeritaHeader />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <AdminBeritaList page={page} />
      </Suspense>
    </div>
  );
}
