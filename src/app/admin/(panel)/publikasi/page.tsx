import { Suspense } from "react";
import {
  AdminPublikasiEditor,
  AdminPublikasiHeader,
  AdminPublikasiList,
} from "@/components/admin/admin-publikasi-section";
import { CardGridSkeleton } from "@/components/ui/route-skeletons";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Publikasi Hasil" };

type Props = {
  searchParams: Promise<{ page?: string; buat?: string; edit?: string }>;
};

export default async function AdminPublikasiPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const buat = params.buat === "1" || params.buat === "true";
  const editId = params.edit?.trim() || undefined;

  if (buat || editId) {
    return (
      <Suspense fallback={<CardGridSkeleton count={1} cols="md:grid-cols-1" />}>
        <AdminPublikasiEditor mode={editId ? "edit" : "buat"} editId={editId} />
      </Suspense>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPublikasiHeader />
      <Suspense fallback={<CardGridSkeleton count={4} cols="md:grid-cols-2" />}>
        <AdminPublikasiList page={page} />
      </Suspense>
    </div>
  );
}
