import { Suspense } from "react";
import {
  AdminPublikasiHeader,
  AdminPublikasiList,
} from "@/components/admin/admin-publikasi-section";
import { CardGridSkeleton } from "@/components/ui/route-skeletons";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Publikasi Hasil" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminPublikasiPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  return (
    <div className="space-y-6">
      <AdminPublikasiHeader />
      <Suspense fallback={<CardGridSkeleton count={4} cols="md:grid-cols-2" />}>
        <AdminPublikasiList page={page} />
      </Suspense>
    </div>
  );
}
