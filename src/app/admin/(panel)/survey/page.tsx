import { Suspense } from "react";
import { AdminSurveyHeader, AdminSurveyList } from "@/components/admin/admin-survey-section";
import { TableSkeleton } from "@/components/ui/route-skeletons";

export const metadata = { title: "Kelola Survey" };

export default function AdminSurveyPage() {
  return (
    <div className="space-y-6">
      <AdminSurveyHeader />
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <AdminSurveyList />
      </Suspense>
    </div>
  );
}
