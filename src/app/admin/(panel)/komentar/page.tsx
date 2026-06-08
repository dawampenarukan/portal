import { Suspense } from "react";
import { AdminKomentarList } from "@/components/admin/admin-komentar-section";
import { TableSkeleton } from "@/components/ui/route-skeletons";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Moderasi Komentar" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminKomentarPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Moderasi Komentar</h2>
        <p className="text-muted-foreground">Tinjau dan moderasi komentar pembaca.</p>
      </div>
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <AdminKomentarList page={page} />
      </Suspense>
    </div>
  );
}
