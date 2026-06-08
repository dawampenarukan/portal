import { Suspense } from "react";
import { AdminMasukanList } from "@/components/admin/admin-masukan-section";
import { TableSkeleton } from "@/components/ui/route-skeletons";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Inbox Masukan" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminMasukanPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inbox Masukan</h2>
        <p className="text-muted-foreground">
          Kelola masukan, kritik, dan laporan temuan dari masyarakat.
        </p>
      </div>
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <AdminMasukanList page={page} />
      </Suspense>
    </div>
  );
}
