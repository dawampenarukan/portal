import { Suspense } from "react";
import { AdminSurveyHeader, AdminSurveyList } from "@/components/admin/admin-survey-section";
import { TableSkeleton } from "@/components/ui/route-skeletons";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Kelola Survey" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminSurveyPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  return (
    <div className="space-y-6">
      <AdminSurveyHeader />
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <AdminSurveyList page={page} />
      </Suspense>
    </div>
  );
}
