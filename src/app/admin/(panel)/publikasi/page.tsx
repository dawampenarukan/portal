import { Suspense } from "react";
import {
  AdminPublikasiHeader,
  AdminPublikasiList,
} from "@/components/admin/admin-publikasi-section";
import { CardGridSkeleton } from "@/components/ui/route-skeletons";

export const metadata = { title: "Publikasi Fixed" };

export default function AdminPublikasiPage() {
  return (
    <div className="space-y-6">
      <AdminPublikasiHeader />
      <Suspense fallback={<CardGridSkeleton count={4} cols="md:grid-cols-2" />}>
        <AdminPublikasiList />
      </Suspense>
    </div>
  );
}
